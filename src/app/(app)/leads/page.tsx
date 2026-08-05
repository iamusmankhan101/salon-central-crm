import Link from "next/link";
import { Download, Plus, Search, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/current-profile";
import {
  LEAD_CATEGORIES,
  LEAD_STATUSES,
  repLabel,
  type Lead,
  type LeadCategory,
  type LeadStatus,
  type Profile,
} from "@/lib/types/database";
import { PipelineBoard } from "./pipeline-board";
import { PipelineList } from "./pipeline-list";

const PAGE_SIZE = 50;
const BOARD_CARD_LIMIT = 30;

type LeadsSearchParams = {
  view?: string;
  rep?: string;
  q?: string;
  status?: string;
  category?: string;
  page?: string;
  imported?: string;
  skipped?: string;
};

/** Escapes characters that are structurally significant in a PostgREST
 * `.or()` filter string (comma separates conditions, parens group them) so
 * user search input can't alter which columns/rows are being matched. */
function sanitizeForOr(value: string): string {
  return value.replace(/[,()"]/g, "");
}

function applySharedFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  searchParams: LeadsSearchParams,
  isAdmin: boolean
) {
  if (isAdmin && searchParams.rep) {
    query = query.eq("assigned_to", searchParams.rep);
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category as LeadCategory);
  }
  const term = searchParams.q ? sanitizeForOr(searchParams.q.trim()) : "";
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`
    );
  }
  return query;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: LeadsSearchParams;
}) {
  const supabase = createClient();
  const { profile } = await getCurrentUserAndProfile();
  const isAdmin = profile?.role === "admin";

  const view = searchParams.view === "list" ? "list" : "board";

  const { data: profilesData } = await supabase.from("profiles").select("*");
  const profiles = (profilesData ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const reps = profiles.filter((p) => p.role === "sales_rep");

  let boardColumns: { status: LeadStatus; leads: Lead[]; total: number }[] =
    [];
  let listLeads: Lead[] = [];
  let listTotal = 0;
  let page = 1;
  let totalPages = 1;

  if (view === "board") {
    boardColumns = await Promise.all(
      LEAD_STATUSES.map(async (s) => {
        if (searchParams.status && searchParams.status !== s.value) {
          return { status: s.value, leads: [] as Lead[], total: 0 };
        }
        let query = supabase
          .from("leads")
          .select("*", { count: "exact" })
          .eq("status", s.value)
          .order("created_at", { ascending: false })
          .range(0, BOARD_CARD_LIMIT - 1);
        query = applySharedFilters(query, searchParams, isAdmin);
        const { data, count } = await query;
        return {
          status: s.value,
          leads: (data ?? []) as Lead[],
          total: count ?? 0,
        };
      })
    );
  } else {
    page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    query = applySharedFilters(query, searchParams, isAdmin);
    if (searchParams.status) {
      query = query.eq("status", searchParams.status as LeadStatus);
    }
    const { data, count } = await query;
    listLeads = (data ?? []) as Lead[];
    listTotal = count ?? 0;
    totalPages = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
  }

  const buildParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("view", overrides.view ?? view);
    const rep = overrides.rep ?? searchParams.rep;
    const q = overrides.q ?? searchParams.q;
    const status = overrides.status ?? searchParams.status;
    const category = overrides.category ?? searchParams.category;
    if (rep) params.set("rep", rep);
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (overrides.page) params.set("page", overrides.page);
    return params.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/leads/export?${buildParams({})}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm px-3.5 py-2 hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          {isAdmin && (
            <Link
              href="/leads/import"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm px-3.5 py-2 hover:bg-slate-50 transition"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                href="/leads/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-brand-indigo text-white text-sm font-medium px-3.5 py-2 shadow-sm shadow-brand/30 hover:opacity-95 transition"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </Link>
              <form
                action={async () => {
                  "use server";
                  const { createClient } = await import(
                    "@/lib/supabase/server"
                  );
                  const supabase = createClient();
                  await supabase
                    .from("leads")
                    .delete()
                    .neq("id", "00000000-0000-0000-0000-000000000000");
                  const { revalidatePath } = await import("next/cache");
                  revalidatePath("/leads");
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white text-sm font-medium px-3.5 py-2 shadow-sm hover:opacity-95 transition"
                >
                  Delete All Leads
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {searchParams.imported && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
          Imported {searchParams.imported}{" "}
          {searchParams.imported === "1" ? "lead" : "leads"}.
          {searchParams.skipped && searchParams.skipped !== "0"
            ? ` Skipped ${searchParams.skipped} row${
                searchParams.skipped === "1" ? "" : "s"
              } without a venue name.`
            : ""}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <form
          method="get"
          className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
        >
          <input type="hidden" name="view" value={view} />
          <div className="relative w-full sm:w-56">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search leads..."
              className="rounded-full border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={searchParams.category ?? ""}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Categories</option>
            {LEAD_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select
              name="rep"
              defaultValue={searchParams.rep ?? ""}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All Reps</option>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {repLabel(rep)}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="rounded-full bg-slate-900 text-white text-sm px-4 py-2 sm:py-1.5 hover:bg-slate-800 transition w-full sm:w-auto"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-1 text-sm bg-white border border-slate-200 rounded-full p-1">
          <Link
            href={`/leads?${buildParams({ view: "board" })}`}
            className={`px-3 py-1 rounded-full transition ${
              view === "board"
                ? "bg-gradient-to-r from-brand to-brand-indigo text-white"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            Board
          </Link>
          <Link
            href={`/leads?${buildParams({ view: "list" })}`}
            className={`px-3 py-1 rounded-full transition ${
              view === "list"
                ? "bg-gradient-to-r from-brand to-brand-indigo text-white"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            List
          </Link>
        </div>
      </div>

      {view === "board" ? (
        <PipelineBoard
          initialColumns={boardColumns}
          isAdmin={isAdmin}
          reps={reps}
          profileMap={profileMap}
          buildParamsStr={(status) =>
            `/leads?${buildParams({ view: "list", status })}`
          }
        />
      ) : (
        <PipelineList
          initialLeads={listLeads}
          isAdmin={isAdmin}
          reps={reps}
          profileMap={profileMap}
          listTotal={listTotal}
          page={page}
          totalPages={totalPages}
          buildParamsStr={buildParams}
          PAGE_SIZE={PAGE_SIZE}
        />
      )}
    </div>
  );
}
