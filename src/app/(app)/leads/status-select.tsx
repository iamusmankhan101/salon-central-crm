"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  type LeadStatus,
} from "@/lib/types/database";
import { updateLeadStatus } from "./actions";

export function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const style = STATUS_STYLES[status];

  return (
    <div
      className={`relative inline-flex items-center rounded-full ${style.badgeBg} ${style.badgeText} disabled:opacity-50`}
    >
      <span className={`ml-2.5 h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as LeadStatus;
          startTransition(() => {
            updateLeadStatus(leadId, next);
          });
        }}
        className="appearance-none bg-transparent text-xs font-medium pl-1.5 pr-6 py-1 focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value} className="text-slate-900">
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none" />
    </div>
  );
}
