import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">
              Salon Central CRM
            </span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/leads" className="text-slate-600 hover:text-slate-900">
                Pipeline
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/leads/new"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Add Lead
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {profile?.full_name ?? user.email}{" "}
              <span className="text-slate-400">
                ({isAdmin ? "Admin" : "Sales Rep"})
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-slate-600 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
