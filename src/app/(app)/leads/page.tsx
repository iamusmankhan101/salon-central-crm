import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import { LEAD_STATUSES, type Lead, type Profile } from "@/lib/types/database";
import { StatusSelect } from "./status-select";
import { AssignSelect } from "./assign-select";
import { claimLead } from "./actions";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { view?: string; rep?: string; q?: string };
}) {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (isAdmin && searchParams.rep) {
    query = query.eq("assigned_to", searchParams.rep);
  }

  const { data: leadsData } = await query;
  let leads = (leadsData ?? []) as Lead[];

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.phone ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q)
    );
  }

  const { data: profilesData } = await supabase.from("profiles").select("*");
  const profiles = (profilesData ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const reps = profiles.filter((p) => p.role === "sales_rep");

  const view = searchParams.view === "list" ? "list" : "board";

  const viewHref = (v: string) => {
    const params = new URLSearchParams();
    params.set("view", v);
    if (searchParams.rep) params.set("rep", searchParams.rep);
    if (searchParams.q) params.set("q", searchParams.q);
    return `/leads?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">Leads Pipeline</h1>
        <div className="flex items-center gap-1 text-sm bg-white border border-slate-200 rounded-md p-1">
          <Link
            href={viewHref("board")}
            className={`px-3 py-1 rounded ${
              view === "board" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            Board
          </Link>
          <Link
            href={viewHref("list")}
            className={`px-3 py-1 rounded ${
              view === "list" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            List
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-md p-3"
      >
        <input type="hidden" name="view" value={view} />
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-500 mb-1">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Name, phone, email, company"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        {isAdmin && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Assigned rep
            </label>
            <select
              name="rep"
              defaultValue={searchParams.rep ?? ""}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white"
            >
              <option value="">All reps</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.full_name ?? rep.id}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="rounded-md bg-slate-900 text-white text-sm px-4 py-1.5 hover:bg-slate-800"
        >
          Filter
        </button>
      </form>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((s) => {
            const columnLeads = leads.filter((l) => l.status === s.value);
            return (
              <div key={s.value} className="w-72 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-slate-700">
                    {s.label}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {columnLeads.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isAdmin={isAdmin}
                      reps={reps}
                      profileMap={profileMap}
                    />
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-md p-3 text-center">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Assigned</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {lead.company ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <StatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                  <td className="px-4 py-2">
                    <AssignedControl
                      lead={lead}
                      isAdmin={isAdmin}
                      reps={reps}
                      profileMap={profileMap}
                    />
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  isAdmin,
  reps,
  profileMap,
}: {
  lead: Lead;
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-3 space-y-2 shadow-sm">
      <Link
        href={`/leads/${lead.id}`}
        className="font-medium text-slate-900 hover:underline block"
      >
        {lead.name}
      </Link>
      <div className="text-xs text-slate-500 space-y-0.5">
        {lead.phone && <div>{lead.phone}</div>}
        {lead.company && <div>{lead.company}</div>}
      </div>
      <StatusSelect leadId={lead.id} status={lead.status} />
      <div className="text-xs pt-1 border-t border-slate-100">
        <AssignedControl
          lead={lead}
          isAdmin={isAdmin}
          reps={reps}
          profileMap={profileMap}
        />
      </div>
    </div>
  );
}

function AssignedControl({
  lead,
  isAdmin,
  reps,
  profileMap,
}: {
  lead: Lead;
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
}) {
  if (isAdmin) {
    return (
      <AssignSelect leadId={lead.id} assignedTo={lead.assigned_to} reps={reps} />
    );
  }

  if (lead.assigned_to) {
    return (
      <span className="text-slate-500">
        {profileMap.get(lead.assigned_to)?.full_name ?? "Assigned"}
      </span>
    );
  }

  return (
    <form action={claimLead.bind(null, lead.id)}>
      <button
        type="submit"
        className="text-slate-900 underline underline-offset-2"
      >
        Claim lead
      </button>
    </form>
  );
}
