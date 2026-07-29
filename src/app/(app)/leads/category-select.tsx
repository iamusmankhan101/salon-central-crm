"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import {
  CATEGORY_STYLES,
  LEAD_CATEGORIES,
  type LeadCategory,
} from "@/lib/types/database";
import { updateLeadCategory } from "./actions";

export function CategorySelect({
  leadId,
  category,
}: {
  leadId: string;
  category: LeadCategory | null;
}) {
  const [isPending, startTransition] = useTransition();
  const style = category
    ? CATEGORY_STYLES[category]
    : { badgeBg: "bg-slate-100", badgeText: "text-slate-500" };

  return (
    <div
      className={`relative inline-flex items-center rounded-full ${style.badgeBg} ${style.badgeText} disabled:opacity-50`}
    >
      <select
        defaultValue={category ?? ""}
        disabled={isPending}
        onChange={(e) => {
          const next = (e.target.value || null) as LeadCategory | null;
          startTransition(() => {
            updateLeadCategory(leadId, next);
          });
        }}
        className="appearance-none bg-transparent text-xs font-medium pl-2.5 pr-6 py-1 focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        <option value="" className="text-slate-900">
          Uncategorized
        </option>
        {LEAD_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value} className="text-slate-900">
            {c.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none" />
    </div>
  );
}
