import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import {
  LEAD_STATUSES,
  type CallLog,
  type Lead,
  type Profile,
} from "@/lib/types/database";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { StatusSelect } from "../status-select";
import { AssignSelect } from "../assign-select";
import { CategorySelect } from "../category-select";
import { logCall, updateLeadNotes } from "../actions";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();
  const isAdmin = profile?.role === "admin";

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lead) notFound();

  const typedLead = lead as Lead;

  const { data: callLogsData } = await supabase
    .from("call_logs")
    .select("*")
    .eq("lead_id", params.id)
    .order("created_at", { ascending: false });
  const callLogs = (callLogsData ?? []) as CallLog[];

  const { data: profilesData } = await supabase.from("profiles").select("*");
  const profiles = (profilesData ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const reps = profiles.filter((p) => p.role === "sales_rep");

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/leads" className="text-sm text-slate-500 hover:underline">
        ← Back to pipeline
      </Link>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`h-11 w-11 rounded-full ${getAvatarColor(
                typedLead.name
              )} text-white text-sm font-semibold flex items-center justify-center flex-shrink-0`}
            >
              {getInitials(typedLead.name)}
            </span>
            <div>
              <h1 className="text-xl font-semibold">{typedLead.name}</h1>
              <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                {typedLead.phone && (
                  <div>
                    <a
                      href={`tel:${typedLead.phone}`}
                      className="text-slate-900 hover:text-brand hover:underline"
                    >
                      {typedLead.phone}
                    </a>
                  </div>
                )}
                {typedLead.email && <div>{typedLead.email}</div>}
                {typedLead.company && <div>{typedLead.company}</div>}
                {typedLead.source && (
                  <div className="text-xs text-slate-400">
                    Source: {typedLead.source}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 text-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusSelect leadId={typedLead.id} status={typedLead.status} />
              <CategorySelect
                leadId={typedLead.id}
                category={typedLead.category}
              />
            </div>
            {isAdmin ? (
              <AssignSelect
                leadId={typedLead.id}
                assignedTo={typedLead.assigned_to}
                reps={reps}
              />
            ) : (
              <span className="text-slate-500 text-xs">
                {typedLead.assigned_to
                  ? `Assigned to ${
                      profileMap.get(typedLead.assigned_to)?.full_name ??
                      "you"
                    }`
                  : "Unassigned"}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          Added {new Date(typedLead.created_at).toLocaleString()}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-medium text-slate-700">Notes</h2>
        <form action={updateLeadNotes} className="space-y-2">
          <input type="hidden" name="lead_id" value={typedLead.id} />
          <textarea
            name="notes"
            rows={3}
            defaultValue={typedLead.notes ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-50 text-brand-dark text-sm px-4 py-1.5 hover:bg-brand-100 transition"
          >
            Save notes
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-700">Log a call</h2>
        <form action={logCall} className="space-y-3">
          <input type="hidden" name="lead_id" value={typedLead.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Outcome
              </label>
              <input
                name="outcome"
                placeholder="e.g. No answer, left voicemail"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Move to stage
              </label>
              <select
                name="next_status"
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Keep current stage</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="What happened on the call?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-brand to-brand-indigo text-white text-sm px-4 py-1.5 shadow-sm shadow-brand/30 hover:opacity-95 transition"
          >
            Log Call
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-medium text-slate-700">Call history</h2>
        {callLogs.length === 0 ? (
          <p className="text-sm text-slate-400">No calls logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {callLogs.map((log) => (
              <li
                key={log.id}
                className="border-b border-slate-100 last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {log.user_id
                      ? profileMap.get(log.user_id)?.full_name ?? "Unknown"
                      : "Unknown"}
                  </span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.outcome && (
                  <div className="text-sm font-medium text-slate-800 mt-1">
                    {log.outcome}
                  </div>
                )}
                {log.notes && (
                  <div className="text-sm text-slate-600 mt-0.5">
                    {log.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
