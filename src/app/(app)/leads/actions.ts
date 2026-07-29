"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types/database";

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
