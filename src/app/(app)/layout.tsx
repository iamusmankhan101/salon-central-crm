import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { BrandMark } from "@/components/brand-mark";
import { SidebarNav } from "./sidebar-nav";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name ?? user.email ?? "there";

  return (
    <div className="min-h-screen flex bg-[#F5F3FB]">
      <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col py-5">
        <div className="px-5 mb-6">
          <BrandMark className="w-28" />
        </div>
        <SidebarNav />
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
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium text-slate-800">
              Hi, {displayName}
            </div>
            <div className="text-xs text-slate-400">
              {isAdmin ? "Admin" : "Sales Rep"}
            </div>
          </div>
          <div
            className={`h-9 w-9 rounded-full ${getAvatarColor(
              displayName
            )} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}
          >
            {getInitials(displayName)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
