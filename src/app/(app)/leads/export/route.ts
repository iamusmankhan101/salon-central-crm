import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvEscape } from "@/lib/csv";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import {
  categoryLabel,
  statusLabel,
  type Lead,
  type LeadCategory,
  type LeadStatus,
  type Profile,
} from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const rep = searchParams.get("rep");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  let leads = await fetchAllRows<Lead>((from, to) => {
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (rep) query = query.eq("assigned_to", rep);
    if (status) query = query.eq("status", status as LeadStatus);
    if (category) query = query.eq("category", category as LeadCategory);

    return query;
  });

  if (q) {
    const needle = q.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        (l.phone ?? "").toLowerCase().includes(needle) ||
        (l.email ?? "").toLowerCase().includes(needle) ||
        (l.company ?? "").toLowerCase().includes(needle)
    );
  }

  const { data: profilesData } = await supabase.from("profiles").select("*");
  const profileMap = new Map(
    ((profilesData ?? []) as Profile[]).map((p) => [p.id, p])
  );

  const header = [
    "Venue Name",
    "Phone",
    "Email",
    "Location",
    "Category",
    "Source",
    "Status",
    "Assigned To",
    "Notes",
    "Created At",
  ];

  const rows = leads.map((l) => [
    l.name,
    l.phone ?? "",
    l.email ?? "",
    l.company ?? "",
    l.category ? categoryLabel(l.category) : "",
    l.source ?? "",
    statusLabel(l.status),
    l.assigned_to
      ? profileMap.get(l.assigned_to)?.full_name ?? ""
      : "Unassigned",
    l.notes ?? "",
    new Date(l.created_at).toLocaleString(),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
