"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeHeader, parseCsv } from "@/lib/csv";
import {
  LEAD_CATEGORIES,
  LEAD_PRODUCTS,
  LEAD_STATUSES,
  leadProduct,
  parseLeadProduct,
  type LeadCategory,
  type LeadProduct,
  type LeadStatus,
  type Profile,
} from "@/lib/types/database";

/** A lead only ever lives under one product, but the mutation actions are
 * called from shared client components that don't know which pipeline they're
 * rendered in — so refresh both products' routes plus the dashboard. */
function revalidateLeadPaths(leadId?: string) {
  revalidatePath("/dashboard");
  for (const product of LEAD_PRODUCTS) {
    revalidatePath(product.basePath);
    if (leadId) revalidatePath(`${product.basePath}/${leadId}`);
  }
}

/** Products come in as form fields / route params, so never trust the raw
 * value — fall back to the default pipeline rather than writing junk. */
function productFromForm(formData: FormData): LeadProduct {
  return parseLeadProduct(String(formData.get("product") ?? "")) ?? "salon_central";
}

export async function createLead(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const product = productFromForm(formData);
  const basePath = leadProduct(product).basePath;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(
      `${basePath}/new?error=${encodeURIComponent("Venue name is required")}`
    );
  }

  const assignedTo = String(formData.get("assigned_to") ?? "") || null;
  const category =
    (String(formData.get("category") ?? "") as LeadCategory) || null;

  const { error } = await supabase.from("leads").insert({
    name,
    phone: String(formData.get("phone") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    company: String(formData.get("company") ?? "") || null,
    source: String(formData.get("source") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    assigned_to: assignedTo,
    category,
    product,
    created_by: user.id,
  });

  if (error) {
    redirect(`${basePath}/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLeadPaths();
  redirect(basePath);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = createClient();
  await supabase.from("leads").update({ status }).eq("id", leadId);
  revalidateLeadPaths(leadId);
}

export async function updateLeadCategory(
  leadId: string,
  category: LeadCategory | null
) {
  const supabase = createClient();
  await supabase.from("leads").update({ category }).eq("id", leadId);
  revalidateLeadPaths(leadId);
}

export async function assignLead(leadId: string, repId: string | null) {
  const supabase = createClient();
  await supabase.from("leads").update({ assigned_to: repId }).eq("id", leadId);
  revalidateLeadPaths(leadId);
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

  revalidateLeadPaths(leadId);
}

export async function updateLeadNotes(formData: FormData) {
  const supabase = createClient();
  const leadId = String(formData.get("lead_id") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await supabase.from("leads").update({ notes }).eq("id", leadId);
  revalidateLeadPaths(leadId);
}

/** Wipes one product's pipeline only — the other product's leads are left
 * alone even though both live in the same table. */
export async function deleteAllLeads(formData: FormData) {
  const supabase = createClient();
  const product = productFromForm(formData);

  await supabase.from("leads").delete().eq("product", product);

  revalidateLeadPaths();
}

function resolveStatus(raw: string): LeadStatus {
  const needle = normalizeHeader(raw);
  const match = LEAD_STATUSES.find(
    (s) => normalizeHeader(s.value) === needle || normalizeHeader(s.label) === needle
  );
  return match?.value ?? "new";
}

function resolveCategory(raw: string): LeadCategory | null {
  const needle = normalizeHeader(raw);
  if (!needle) return null;
  const match = LEAD_CATEGORIES.find(
    (c) => normalizeHeader(c.value) === needle || normalizeHeader(c.label) === needle
  );
  return match?.value ?? null;
}

function resolveRep(raw: string, reps: Profile[]): string | null {
  const needle = raw.trim().toLowerCase();
  if (!needle || needle === "unassigned") return null;
  const match = reps.find(
    (r) =>
      (r.full_name ?? "").trim().toLowerCase() === needle ||
      (r.email ?? "").trim().toLowerCase() === needle
  );
  return match?.id ?? null;
}

export async function importLeads(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const product = productFromForm(formData);
  const basePath = leadProduct(product).basePath;

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    redirect(basePath);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    redirect(
      `${basePath}/import?error=${encodeURIComponent(
        "Choose a CSV file to import"
      )}`
    );
  }
  if (file.size === 0) {
    redirect(
      `${basePath}/import?error=${encodeURIComponent(
        "Choose a CSV file to import"
      )}`
    );
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length < 2) {
    redirect(
      `${basePath}/import?error=${encodeURIComponent("CSV has no data rows")}`
    );
  }

  const header = rows[0].map(normalizeHeader);
  const findIdx = (...candidates: string[]) =>
    header.findIndex((h) => candidates.includes(h));

  const nameIdx = findIdx("venuename", "name");

  if (nameIdx === -1) {
    redirect(
      `${basePath}/import?error=${encodeURIComponent(
        "CSV must have a Venue Name column"
      )}`
    );
  }

  const phoneIdx = findIdx("phone", "phonenumber", "contactnumber", "mobile", "cell");
  const emailIdx = findIdx("email", "emailaddress");
  const companyIdx = findIdx("location", "company");
  const sourceIdx = findIdx("source", "leadsource");
  const statusIdx = findIdx("status", "leadstatus", "stage");
  const categoryIdx = header.indexOf("category");
  const assignedIdx = header.findIndex(
    (h) => h === "assignedto" || h === "assignee" || h === "rep"
  );
  const notesIdx = header.indexOf("notes");

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "sales_rep");
  const reps = (profilesData ?? []) as Profile[];

  const categoryOverride =
    (String(formData.get("category") ?? "") as LeadCategory) || null;

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
      category:
        categoryOverride ??
        (categoryIdx >= 0 ? resolveCategory(cell(row, categoryIdx)) : null),
      assigned_to:
        assignedIdx >= 0 ? resolveRep(cell(row, assignedIdx), reps) : null,
      product,
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
        `${basePath}/import?error=${encodeURIComponent(
          `Imported ${imported} leads, then failed: ${error.message}`
        )}`
      );
    }

    imported += chunk.length;
  }

  revalidateLeadPaths();
  redirect(`${basePath}?imported=${imported}&skipped=${skipped}`);
}
