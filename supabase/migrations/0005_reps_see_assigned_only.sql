-- Sales reps now only see/manage leads assigned to them — the unassigned
-- pool is admin-only (assignment is admin-driven, not self-serve claiming).

drop policy "leads_select_admin_or_own_or_unassigned" on public.leads;
create policy "leads_select_admin_or_own"
  on public.leads for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
  );

drop policy "leads_update_admin_or_own_or_unassigned" on public.leads;
create policy "leads_update_admin_or_own"
  on public.leads for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
  )
  with check (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
  );

drop policy "call_logs_select_admin_or_lead_owner" on public.call_logs;
create policy "call_logs_select_admin_or_lead_owner"
  on public.call_logs for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.leads l
      where l.id = call_logs.lead_id
        and l.assigned_to = auth.uid()
    )
  );

drop policy "call_logs_insert_admin_or_lead_owner" on public.call_logs;
create policy "call_logs_insert_admin_or_lead_owner"
  on public.call_logs for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.leads l
        where l.id = call_logs.lead_id
          and l.assigned_to = auth.uid()
      )
    )
  );
