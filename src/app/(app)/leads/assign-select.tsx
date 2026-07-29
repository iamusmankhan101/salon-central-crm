"use client";

import { useTransition } from "react";
import type { Profile } from "@/lib/types/database";
import { assignLead } from "./actions";

export function AssignSelect({
  leadId,
  assignedTo,
  reps,
}: {
  leadId: string;
  assignedTo: string | null;
  reps: Profile[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={assignedTo ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value || null;
        startTransition(() => {
          assignLead(leadId, next);
        });
      }}
      className="text-sm rounded-md border border-slate-300 px-2 py-1 bg-white disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {reps.map((rep) => (
        <option key={rep.id} value={rep.id}>
          {rep.full_name ?? rep.id}
        </option>
      ))}
    </select>
  );
}
