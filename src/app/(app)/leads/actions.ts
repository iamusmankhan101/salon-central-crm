"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeHeader, parseCsv } from "@/lib/csv";
import { LEAD_STATUSES, type LeadStatus, type Profile } from "@/lib/types/database";

export async function createLead(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/leads/new?error=${encodeURIComponent("Name is required")}`);
  }

  const assignedTo = String(formData.get("assigned_to") ?? "") || null;

  const { error } = await supabase.from("leads").insert({
    name,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    company: String(formData.get("company") ?? "") || null,
    source: String(formData.get("source") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    assigned_to: assignedTo,
    created_by: user.id,
  });

  if (error) {
    redirect(`/leads/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads");
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function assignLead(leadId: string, repId: string | null) {
  const supabase = createClient();
  await supabase.from("leads").update({ assigned_to: repId }).eq("id", leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function claimLead(leadId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("leads")
    .update({ assigned_to: user.id })
    .eq("id", leadId);

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function logCall(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const leadId = String(formData.get("lead_id") ?? "");
  const outcome = String(formData.get("outcome") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;
  const nextStatus = String(formData.get("next_status") ?? "") as
    | LeadStatus
    | "";

  await supabase.from("call_logs").insert({
    lead_id: leadId,
    user_id: user.id,
    outcome,
    notes,
  });

  if (nextStatus) {
    await supabase.from("leads").update({ status: nextStatus }).eq("id", leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadNotes(formData: FormData) {
  const supabase = createClient();
  const leadId = String(formData.get("lead_id") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await supabase.from("leads").update({ notes }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
}

function resolveStatus(raw: string): LeadStatus {
  const needle = normalizeHeader(raw);
  const match = LEAD_STATUSES.find(
    (s) => normalizeHeader(s.value) === needle || normalizeHeader(s.label) === needle
  );
  return match?.value ?? "new";
}

function resolveRep(raw: string, reps: Profile[]): string | null {
  const needle = raw.trim().toLowerCase();
  if (!needle || needle === "unassigned") return null;
  const match = reps.find(
    (r) => (r.full_name ?? "").trim().toLowerCase() === needle
  );
  return match?.id ?? null;
}

export async function importLeads(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    redirect("/leads");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/leads/import?error=${encodeURIComponent("Choose a CSV file to import")}`
    );
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length < 2) {
    redirect(
      `/leads/import?error=${encodeURIComponent("CSV has no data rows")}`
    );
  }

  const header = rows[0].map(normalizeHeader);
  const nameIdx = header.indexOf("name");

  if (nameIdx === -1) {
    redirect(
      `/leads/import?error=${encodeURIComponent(
        "CSV must have a Name column"
      )}`
    );
  }

  const phoneIdx = header.indexOf("phone");
  const emailIdx = header.indexOf("email");
  const companyIdx = header.indexOf("company");
  const sourceIdx = header.indexOf("source");
  const statusIdx = header.indexOf("status");
  const assignedIdx = header.findIndex(
    (h) => h === "assignedto" || h === "assignee" || h === "rep"
  );
  const notesIdx = header.indexOf("notes");

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "sales_rep");
  const reps = (profilesData ?? []) as Profile[];

  const cell = (row: string[], idx: number) =>
    idx >= 0 ? (row[idx] ?? "").trim() : "";

  let skipped = 0;
  const toInsert: Record<string, unknown>[] = [];

  for (const row of rows.slice(1)) {
    const name = cell(row, nameIdx);
    if (!name) {
      skipped++;
      continue;
    }

    toInsert.push({
      name,
      phone: cell(row, phoneIdx) || null,
      email: cell(row, emailIdx) || null,
      company: cell(row, companyIdx) || null,
      source: cell(row, sourceIdx) || null,
      notes: cell(row, notesIdx) || null,
      status: statusIdx >= 0 ? resolveStatus(cell(row, statusIdx)) : "new",
      assigned_to:
        assignedIdx >= 0 ? resolveRep(cell(row, assignedIdx), reps) : null,
      created_by: user.id,
    });
  }

  let imported = 0;
  const CHUNK_SIZE = 500;
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("leads").insert(chunk);

    if (error) {
      redirect(
        `/leads/import?error=${encodeURIComponent(
          `Imported ${imported} leads, then failed: ${error.message}`
        )}`
      );
    }

    imported += chunk.length;
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads?imported=${imported}&skipped=${skipped}`);
}
