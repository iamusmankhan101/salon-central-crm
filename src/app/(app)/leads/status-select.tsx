"use client";

import { useTransition } from "react";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types/database";
import { updateLeadStatus } from "./actions";

export function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as LeadStatus;
        startTransition(() => {
          updateLeadStatus(leadId, next);
        });
      }}
      className="text-sm rounded-md border border-slate-300 px-2 py-1 bg-white disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
