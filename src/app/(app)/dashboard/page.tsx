import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import { LEAD_STATUSES, repLabel, type Profile } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();
  const isAdmin = profile?.role === "admin";

  const [totalRes, unassignedRes, ...statusRes] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    isAdmin
      ? supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .is("assigned_to", null)
      : Promise.resolve({ count: null }),
    ...LEAD_STATUSES.map((s) =>
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", s.value)
    ),
  ]);

  const totalCount = totalRes.count ?? 0;
  const unassignedCount = unassignedRes.count ?? 0;
  const counts = LEAD_STATUSES.map((s, i) => ({
    ...s,
    count: statusRes[i].count ?? 0,
  }));

  let repBreakdown: { rep: Profile; count: number }[] = [];
  if (isAdmin) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "sales_rep");
    const reps = (profilesData ?? []) as Profile[];

    const repCountRes = await Promise.all(
      reps.map((rep) =>
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", rep.id)
      )
    );

    repBreakdown = reps.map((rep, i) => ({
      rep,
      count: repCountRes[i].count ?? 0,
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {isAdmin ? "Team Dashboard" : "My Dashboard"}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 border-t-2 border-t-brand">
          <div className="text-2xl font-semibold text-brand">
            {totalCount}
          </div>
          <div className="text-sm text-slate-500">Total leads</div>
        </div>
        {isAdmin && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 border-t-2 border-t-brand-indigo">
            <div className="text-2xl font-semibold text-brand-indigo">
              {unassignedCount}
            </div>
            <div className="text-sm text-slate-500">Unassigned</div>
          </div>
        )}
        {counts.map((s) => (
          <div
            key={s.value}
            className="bg-white border border-slate-200 rounded-lg p-4"
          >
            <div className="text-2xl font-semibold text-slate-900">
              {s.count}
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            Leads per rep
          </h2>
          {repBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No sales reps yet.</p>
          ) : (
            <ul className="space-y-2">
              {repBreakdown.map(({ rep, count }) => (
                <li
                  key={rep.id}
                  className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-slate-700">{repLabel(rep)}</span>
                  <span className="text-slate-500">{count} leads</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
