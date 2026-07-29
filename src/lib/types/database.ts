export type UserRole = "admin" | "sales_rep";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "not_interested"
  | "won"
  | "lost";

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
  { value: "not_interested", label: "Not Interested" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function statusLabel(status: LeadStatus): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}
