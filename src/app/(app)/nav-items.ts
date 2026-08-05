import { LayoutDashboard, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
];

export function isNavActive(pathname: string, href: string) {
  return href === "/leads"
    ? pathname.startsWith("/leads")
    : pathname === href;
}
