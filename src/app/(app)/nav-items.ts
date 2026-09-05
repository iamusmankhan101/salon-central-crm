import { LayoutDashboard, Scissors, Sparkles } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Salon Central", icon: Scissors },
  { href: "/pointly", label: "Pointly", icon: Sparkles },
];

/** Each pipeline owns a subtree (/leads/new, /pointly/123, …), so the nav
 * item stays highlighted on every page beneath it. */
export function isNavActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
