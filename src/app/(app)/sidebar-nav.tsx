"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "./nav-items";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-gradient-to-r from-brand to-brand-indigo text-white shadow-sm shadow-brand/30"
                : "text-slate-600 hover:bg-brand-50 hover:text-brand"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
