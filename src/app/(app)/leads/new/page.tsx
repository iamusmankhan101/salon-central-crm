import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import type { Profile } from "@/lib/types/database";
import { createLead } from "../actions";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { profile } = await getCurrentUserAndProfile();
  if (profile?.role !== "admin") {
    redirect("/leads");
  }

  const supabase = createClient();
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "sales_rep");
  const reps = (profilesData ?? []) as Profile[];

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Add Lead</h1>

      <form
        action={createLead}
        className="space-y-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm"
      >
        {searchParams.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {searchParams.error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name *
          </label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              name="phone"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Company
          </label>
          <input
            name="company"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Source
          </label>
          <input
            name="source"
            placeholder="e.g. website, referral, walk-in"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assign to
          </label>
          <select
            name="assigned_to"
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Unassigned</option>
            {reps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.full_name ?? rep.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-gradient-to-r from-brand to-brand-indigo text-white text-sm font-medium py-2 shadow-sm shadow-brand/30 hover:opacity-95 transition"
        >
          Add Lead
        </button>
      </form>
    </div>
  );
}
