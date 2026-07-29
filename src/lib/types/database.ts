export type UserRole = "admin" | "sales_rep";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "demo_booked"
  | "not_interested";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: string | null;
  notes: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  user_id: string | null;
  outcome: string | null;
  notes: string | null;
  created_at: string;
}

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-up" },
  { value: "demo_booked", label: "Demo Booked" },
  { value: "not_interested", label: "Not Interested" },
];

export function statusLabel(status: LeadStatus): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export const STATUS_STYLES: Record<
  LeadStatus,
  { dot: string; badgeBg: string; badgeText: string }
> = {
  new: {
    dot: "bg-slate-400",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
  },
  contacted: {
    dot: "bg-sky-400",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
  },
  interested: {
    dot: "bg-brand-light",
    badgeBg: "bg-brand-50",
    badgeText: "text-brand-dark",
  },
  follow_up: {
    dot: "bg-amber-400",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  demo_booked: {
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
  },
  not_interested: {
    dot: "bg-rose-400",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
  },
};
