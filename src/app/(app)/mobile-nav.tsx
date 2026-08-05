"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import { signOut } from "./actions";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden inline-flex items-center justify-center h-10 w-10 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-xl flex flex-col py-5">
            <div className="flex items-center justify-between px-5 mb-6">
              <BrandMark className="w-24" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
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

            <div className="px-3 mt-auto pt-4">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
