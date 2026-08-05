"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  CATEGORY_STYLES,
  categoryLabel,
  type Lead,
  type LeadStatus,
  type Profile,
  type LeadCategory,
} from "@/lib/types/database";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatCardDate } from "@/lib/format";
import { StatusSelect } from "./status-select";
import { AssignSelect } from "./assign-select";

export type BoardColumn = {
  status: LeadStatus;
  leads: Lead[];
  total: number;
};

export function PipelineBoard({
  initialColumns,
  isAdmin,
  reps,
  profileMap,
  buildParamsStr,
}: {
  initialColumns: BoardColumn[];
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
  buildParamsStr: (status: LeadStatus) => string;
}) {
  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const addOptimisticUpdate = (update: { id: string; partial: Partial<Lead> }) => {
    setColumns((state) => {
      let oldStatus: LeadStatus | undefined;
      for (const col of state) {
        if (col.leads.find((l) => l.id === update.id)) {
          oldStatus = col.status;
          break;
        }
      }

      if (!oldStatus) return state;

      const nextStatus = update.partial.status ?? oldStatus;

      return state.map((col) => {
        if (col.status === oldStatus && oldStatus !== nextStatus) {
          return {
            ...col,
            total: col.total - 1,
            leads: col.leads.filter((l) => l.id !== update.id),
          };
        }
        if (col.status === nextStatus && oldStatus !== nextStatus) {
          const movedLead = state
            .find((c) => c.status === oldStatus)
            ?.leads.find((l) => l.id === update.id);
          if (movedLead) {
            return {
              ...col,
              total: col.total + 1,
              leads: [{ ...movedLead, ...update.partial }, ...col.leads],
            };
          }
        }
        if (col.status === oldStatus && oldStatus === nextStatus) {
          return {
            ...col,
            leads: col.leads.map((l) => (l.id === update.id ? { ...l, ...update.partial } : l)),
          };
        }
        return col;
      });
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ status, leads: columnLeads, total }) => {
        const s = LEAD_STATUSES.find((x) => x.value === status)!;
        return (
          <div key={status} className="w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} />
                <h2 className="text-sm font-semibold text-slate-700">{s.label}</h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                {total} {total === 1 ? "Lead" : "Leads"}
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
                  onOptimisticUpdate={(partial) => addOptimisticUpdate({ id: lead.id, partial })}
                />
              ))}
              {columnLeads.length === 0 && (
                <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 text-center bg-white/50">
                  No leads
                </div>
              )}
              {total > columnLeads.length && (
                <Link
                  href={buildParamsStr(status)}
                  className="block text-xs text-brand hover:text-brand-dark text-center py-2"
                >
                  +{total - columnLeads.length} more — view in list
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadCard({
  lead,
  isAdmin,
  reps,
  profileMap,
  onOptimisticUpdate,
}: {
  lead: Lead;
  isAdmin: boolean;
  reps: Profile[];
  profileMap: Map<string, Profile>;
  onOptimisticUpdate: (partial: Partial<Lead>) => void;
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

      {lead.category && <CategoryBadge category={lead.category} />}

      {(lead.phone || lead.email) && (
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
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <StatusSelect 
          leadId={lead.id} 
          status={lead.status} 
          onChangeOptimistic={(status) => onOptimisticUpdate({ status })} 
        />
      </div>
      <div className="text-xs">
        <AssignedControl
          lead={lead}
          isAdmin={isAdmin}
          reps={reps}
          profileMap={profileMap}
          onChangeOptimistic={(assigned_to) => onOptimisticUpdate({ assigned_to })}
        />
      </div>
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
      {lead.assigned_to
        ? profileMap.get(lead.assigned_to)?.full_name ?? "Assigned"
        : "Unassigned"}
    </span>
  );
}
