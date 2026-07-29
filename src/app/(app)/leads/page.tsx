import Link from "next/link";
import { Download, Phone, Mail, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  type Lead,
  type LeadStatus,
  type Profile,
} from "@/lib/types/database";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatCardDate } from "@/lib/format";
import { StatusSelect } from "./status-select";
import { AssignSelect } from "./assign-select";
import { claimLead } from "./actions";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { view?: string; rep?: string; q?: string; status?: string };
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
  if (searchParams.status) {
    query = query.eq("status", searchParams.status as LeadStatus);
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

  const buildParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("view", overrides.view ?? view);
    const rep = overrides.rep ?? searchParams.rep;
    const q = overrides.q ?? searchParams.q;
    const status = overrides.status ?? searchParams.status;
    if (rep) params.set("rep", rep);
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    return params.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/leads/export?${buildParams({})}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm px-3.5 py-2 hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          {isAdmin && (
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-brand-indigo text-white text-sm font-medium px-3.5 py-2 shadow-sm shadow-brand/30 hover:opacity-95 transition"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <form
          method="get"
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="view" value={view} />
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search leads..."
              className="rounded-full border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select
              name="rep"
              defaultValue={searchParams.rep ?? ""}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All Reps</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.full_name ?? rep.id}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="rounded-full bg-slate-900 text-white text-sm px-4 py-1.5 hover:bg-slate-800 transition"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-1 text-sm bg-white border border-slate-200 rounded-full p-1">
          <Link
            href={`/leads?${buildParams({ view: "board" })}`}
            className={`px-3 py-1 rounded-full transition ${
              view === "board"
                ? "bg-gradient-to-r from-brand to-brand-indigo text-white"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            Board
          </Link>
          <Link
            href={`/leads?${buildParams({ view: "list" })}`}
            className={`px-3 py-1 rounded-full transition ${
              view === "list"
                ? "bg-gradient-to-r from-brand to-brand-indigo text-white"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            List
          </Link>
        </div>
      </div>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((s) => {
            const columnLeads = leads.filter((l) => l.status === s.value);
            return (
              <div key={s.value} className="w-72 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        STATUS_STYLES[s.value].dot
                      }`}
                    />
                    <h2 className="text-sm font-semibold text-slate-700">
                      {s.label}
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                    {columnLeads.length} {columnLeads.length === 1 ? "Lead" : "Leads"}
                  </span>
                </div>
                <div className="space-y-3">
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
                    <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 text-center bg-white/50">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <span
                        className={`h-7 w-7 rounded-full ${getAvatarColor(
                          lead.name
                        )} text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0`}
                      >
                        {getInitials(lead.name)}
                      </span>
                      <span className="font-medium text-slate-900 group-hover:text-brand">
                        {lead.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.company ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <AssignedControl
                      lead={lead}
                      isAdmin={isAdmin}
                      reps={reps}
                      profileMap={profileMap}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
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
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm hover:shadow-md transition">
      <Link href={`/leads/${lead.id}`} className="flex items-start gap-2.5">
        <span
          className={`h-9 w-9 rounded-full ${getAvatarColor(
            lead.name
          )} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}
        >
          {getInitials(lead.name)}
        </span>
        <div className="min-w-0">
          <div className="font-medium text-slate-900 truncate hover:text-brand">
            {lead.name}
          </div>
          <div className="text-xs text-slate-400">
            {formatCardDate(lead.created_at)}
          </div>
        </div>
      </Link>

      <div className="text-xs text-slate-500 space-y-1">
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" />
            {lead.phone}
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <StatusSelect leadId={lead.id} status={lead.status} />
      </div>
      <div className="text-xs">
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
        className="text-brand underline underline-offset-2 hover:text-brand-dark"
      >
        Claim lead
      </button>
    </form>
  );
}
