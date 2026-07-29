/**
 * Supabase/PostgREST caps a single query at 1000 rows by default. This
 * pages through with .range() and concatenates results so callers get
 * every matching row regardless of table size.
 */
export async function fetchAllRows<T>(
  queryPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    all.push(...rows);

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
