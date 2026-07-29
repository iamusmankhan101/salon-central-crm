-- Salon Central CRM — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'sales_rep');

create type public.lead_status as enum (
  'new',
  'contacted',
  'interested',
  'follow_up',
  'not_interested',
  'won',
  'lost'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'sales_rep',
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  company text,
  source text,
  notes text,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  outcome text,
  notes text,
  created_at timestamptz not null default now()
);

create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_status_idx on public.leads (status);
create index call_logs_lead_id_idx on public.call_logs (lead_id);

-- ---------------------------------------------------------------------------
-- Helper: is_admin — SECURITY DEFINER so RLS policies can check role
-- without recursively re-evaluating RLS on profiles.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- New-user trigger: every auth.users row gets a matching profiles row.
-- Defaults to 'sales_rep' — promote the first user to 'admin' manually
-- (see README) after they sign up.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'sales_rep'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at maintenance on leads

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;

-- profiles: any authenticated user can read the roster (needed to show rep
-- names on leads / in the assignment dropdown); only admins can edit roles.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_admin_only"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- leads: admins see/manage everything. Sales reps see leads assigned to them
-- plus the unassigned pool, and can claim an unassigned lead or update leads
-- already assigned to them — but cannot reassign a lead to someone else.
create policy "leads_select_admin_or_own_or_unassigned"
  on public.leads for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
    or assigned_to is null
  );

create policy "leads_insert_admin_only"
  on public.leads for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "leads_update_admin_or_own_or_unassigned"
  on public.leads for update
  to authenticated
  using (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
    or assigned_to is null
  )
  with check (
    public.is_admin(auth.uid())
    or assigned_to = auth.uid()
    or assigned_to is null
  );

create policy "leads_delete_admin_only"
  on public.leads for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- call_logs: visible/insertable by admins and by whoever can see the parent
-- lead (assigned rep or anyone while it's unassigned).
create policy "call_logs_select_admin_or_lead_owner"
  on public.call_logs for select
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.leads l
      where l.id = call_logs.lead_id
        and (l.assigned_to = auth.uid() or l.assigned_to is null)
    )
  );

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
          and (l.assigned_to = auth.uid() or l.assigned_to is null)
      )
    )
  );

create policy "call_logs_delete_admin_only"
  on public.call_logs for delete
  to authenticated
  using (public.is_admin(auth.uid()));
