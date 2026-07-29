export type UserRole = "admin" | "sales_rep";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "demo_booked"
  | "not_interested";

export type LeadCategory =
  | "salon"
  | "spa"
  | "aesthetics"
  | "barbershop"
  | "nail_studio"
  | "med_spa";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export function repLabel(profile: Profile): string {
  const name = profile.full_name ?? profile.id;
  return profile.email ? `${name} (${profile.email})` : name;
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
  category: LeadCategory | null;
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

export const LEAD_CATEGORIES: { value: LeadCategory; label: string }[] = [
  { value: "salon", label: "Salon" },
  { value: "spa", label: "Spa" },
  { value: "aesthetics", label: "Aesthetics" },
  { value: "barbershop", label: "Barbershop" },
  { value: "nail_studio", label: "Nail Studio" },
  { value: "med_spa", label: "Med Spa" },
];

export function categoryLabel(category: LeadCategory | null): string {
  if (!category) return "Uncategorized";
  return (
    LEAD_CATEGORIES.find((c) => c.value === category)?.label ?? category
  );
}

export const CATEGORY_STYLES: Record<
  LeadCategory,
  { badgeBg: string; badgeText: string }
> = {
  salon: { badgeBg: "bg-violet-50", badgeText: "text-violet-700" },
  spa: { badgeBg: "bg-teal-50", badgeText: "text-teal-700" },
  aesthetics: { badgeBg: "bg-pink-50", badgeText: "text-pink-700" },
  barbershop: { badgeBg: "bg-orange-50", badgeText: "text-orange-700" },
  nail_studio: { badgeBg: "bg-fuchsia-50", badgeText: "text-fuchsia-700" },
  med_spa: { badgeBg: "bg-cyan-50", badgeText: "text-cyan-700" },
};
