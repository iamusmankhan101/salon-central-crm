import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import {
  LEAD_PRODUCTS,
  LEAD_STATUSES,
  repLabel,
  type LeadProduct,
  type Profile,
} from "@/lib/types/database";

type ProductStats = {
  total: number;
  unassigned: number;
  byStatus: { value: string; label: string; count: number }[];
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();
  const isAdmin = profile?.role === "admin";

  const countLeads = async (
    product: LeadProduct,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    narrow?: (q: any) => any
  ) => {
    let query = supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("product", product);
    if (narrow) query = narrow(query);
    const { count } = await query;
    return count ?? 0;
  };

  const stats = new Map<LeadProduct, ProductStats>(
    await Promise.all(
      LEAD_PRODUCTS.map(async ({ value }) => {
        const [total, unassigned, ...statusCounts] = await Promise.all([
          countLeads(value),
          isAdmin
            ? countLeads(value, (q) => q.is("assigned_to", null))
            : Promise.resolve(0),
          ...LEAD_STATUSES.map((s) =>
            countLeads(value, (q) => q.eq("status", s.value))
          ),
        ]);

        return [
          value,
          {
            total,
            unassigned,
            byStatus: LEAD_STATUSES.map((s, i) => ({
              ...s,
              count: statusCounts[i],
            })),
          },
        ] as const;
      })
    )
  );

  let repBreakdown: {
    rep: Profile;
    counts: Record<LeadProduct, number>;
    total: number;
  }[] = [];

  if (isAdmin) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "sales_rep");
    const reps = (profilesData ?? []) as Profile[];

    repBreakdown = await Promise.all(
      reps.map(async (rep) => {
        const perProduct = await Promise.all(
          LEAD_PRODUCTS.map((p) =>
            countLeads(p.value, (q) => q.eq("assigned_to", rep.id))
          )
        );
        const counts = Object.fromEntries(
          LEAD_PRODUCTS.map((p, i) => [p.value, perProduct[i]])
        ) as Record<LeadProduct, number>;
        return {
          rep,
          counts,
          total: perProduct.reduce((sum, n) => sum + n, 0),
        };
      })
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">
        {isAdmin ? "Team Dashboard" : "My Dashboard"}
      </h1>

      {LEAD_PRODUCTS.map((product) => {
        const s = stats.get(product.value)!;
        return (
          <section key={product.value} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">
                {product.label}
              </h2>
              <Link
                href={product.basePath}
                className="text-sm text-brand hover:text-brand-dark"
              >
                View pipeline →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 border-t-2 border-t-brand">
                <div className="text-2xl font-semibold text-brand">
                  {s.total}
                </div>
                <div className="text-sm text-slate-500">Total leads</div>
              </div>
              {isAdmin && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 border-t-2 border-t-brand-indigo">
                  <div className="text-2xl font-semibold text-brand-indigo">
                    {s.unassigned}
                  </div>
                  <div className="text-sm text-slate-500">Unassigned</div>
                </div>
              )}
              {s.byStatus.map((status) => (
                <div
                  key={status.value}
                  className="bg-white border border-slate-200 rounded-lg p-4"
                >
                  <div className="text-2xl font-semibold text-slate-900">
                    {status.count}
                  </div>
                  <div className="text-sm text-slate-500">{status.label}</div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            Leads per rep
          </h2>
          {repBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400">No sales reps yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Rep</th>
                    {LEAD_PRODUCTS.map((p) => (
                      <th
                        key={p.value}
                        className="py-2 px-4 font-medium text-right whitespace-nowrap"
                      >
                        {p.label}
                      </th>
                    ))}
                    <th className="py-2 pl-4 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repBreakdown.map(({ rep, counts, total }) => (
                    <tr
                      key={rep.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 pr-4 text-slate-700">
                        {repLabel(rep)}
                      </td>
                      {LEAD_PRODUCTS.map((p) => (
                        <td
                          key={p.value}
                          className="py-2 px-4 text-slate-500 text-right"
                        >
                          {counts[p.value]}
                        </td>
                      ))}
                      <td className="py-2 pl-4 text-slate-900 font-medium text-right">
                        {total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
