"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CATEGORY_STYLES,
  categoryLabel,
  type Lead,
  type Profile,
  type LeadCategory,
} from "@/lib/types/database";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { StatusSelect } from "./status-select";
import { AssignSelect } from "./assign-select";

function withParams(base: string, overrides: Record<string, string>) {
  const params = new URLSearchParams(base);
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, value);
  }
  return params.toString();
}

export function PipelineList({
  initialLeads,
  isAdmin,
  reps,
  profileMap,
  listTotal,
  page,
  totalPages,
  baseParams,
  PAGE_SIZE,
}: {
  initialLeads: Lead[];
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
  listTotal: number;
  page: number;
  totalPages: number;
  baseParams: string;
  PAGE_SIZE: number;
}) {
  const [leads, setLeads] = useState(initialLeads);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const addOptimisticUpdate = (update: { id: string; partial: Partial<Lead> }) => {
    setLeads((state) =>
      state.map((l) => (l.id === update.id ? { ...l, ...update.partial } : l))
    );
  };

  return (
    <div className="space-y-3">
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-medium">Venue Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-2.5 group">
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
                <td className="px-4 py-3 text-slate-600">{lead.company ?? "—"}</td>
                <td className="px-4 py-3">
                  {lead.category ? (
                    <CategoryBadge category={lead.category} />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    leadId={lead.id}
                    status={lead.status}
                    onChangeOptimistic={(status) => addOptimisticUpdate({ id: lead.id, partial: { status } })}
                  />
                </td>
                <td className="px-4 py-3">
                  <AssignedControl
                    lead={lead}
                    isAdmin={isAdmin}
                    reps={reps}
                    profileMap={profileMap}
                    onChangeOptimistic={(assigned_to) =>
                      addOptimisticUpdate({ id: lead.id, partial: { assigned_to } })
                    }
                  />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <Link
              href={`/leads/${lead.id}`}
              className="flex items-center gap-2.5 group"
            >
              <span
                className={`h-10 w-10 rounded-full ${getAvatarColor(
                  lead.name
                )} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}
              >
                {getInitials(lead.name)}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-slate-900 truncate group-hover:text-brand">
                  {lead.name}
                </span>
                <span className="block text-xs text-slate-400 truncate">
                  {lead.company ?? "—"}
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-between gap-2 mt-3 text-sm">
              <span className="text-slate-600 truncate">
                {lead.phone ?? "—"}
              </span>
              {lead.category ? (
                <CategoryBadge category={lead.category} />
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
              <StatusSelect
                leadId={lead.id}
                status={lead.status}
                onChangeOptimistic={(status) =>
                  addOptimisticUpdate({ id: lead.id, partial: { status } })
                }
              />
              <AssignedControl
                lead={lead}
                isAdmin={isAdmin}
                reps={reps}
                profileMap={profileMap}
                onChangeOptimistic={(assigned_to) =>
                  addOptimisticUpdate({ id: lead.id, partial: { assigned_to } })
                }
              />
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            No leads found
          </div>
        )}
      </div>

      {listTotal > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 px-1">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, listTotal)} of {listTotal}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/leads?${withParams(baseParams, {
                  page: String(page - 1),
                })}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 px-3 py-1.5">
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </span>
            )}
            <span className="px-1">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/leads?${withParams(baseParams, {
                  page: String(page + 1),
                })}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 transition"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 text-slate-300 px-3 py-1.5">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: LeadCategory }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={`inline-flex items-center rounded-full ${style.badgeBg} ${style.badgeText} text-xs font-medium px-2 py-0.5`}
    >
      {categoryLabel(category)}
    </span>
  );
}

function AssignedControl({
  lead,
  isAdmin,
  reps,
  profileMap,
  onChangeOptimistic,
}: {
  lead: Lead;
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
  onChangeOptimistic: (assignedTo: string | null) => void;
}) {
  if (isAdmin) {
    return (
      <AssignSelect
        leadId={lead.id}
        assignedTo={lead.assigned_to}
        reps={reps}
        onChangeOptimistic={onChangeOptimistic}
      />
    );
  }

  return (
    <span className="text-slate-500">
      {lead.assigned_to ? profileMap.get(lead.assigned_to)?.full_name ?? "Assigned" : "Unassigned"}
    </span>
  );
}
