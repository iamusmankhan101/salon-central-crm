"use client";

import { useTransition } from "react";
import { repLabel, type Profile } from "@/lib/types/database";
import { assignLead } from "./actions";

export function AssignSelect({
  leadId,
  assignedTo,
  reps,
  onChangeOptimistic,
}: {
  leadId: string;
  assignedTo: string | null;
  reps: Profile[];
  onChangeOptimistic?: (assignedTo: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={assignedTo ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value || null;
        if (onChangeOptimistic) onChangeOptimistic(next);
        startTransition(() => {
          assignLead(leadId, next);
        });
      }}
      className="text-xs rounded-md border border-slate-200 px-1.5 py-1 bg-white text-slate-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
    >
      <option value="">Unassigned</option>
      {reps.map((rep) => (
        <option key={rep.id} value={rep.id}>
          {repLabel(rep)}
        </option>
      ))}
    </select>
  );
}
