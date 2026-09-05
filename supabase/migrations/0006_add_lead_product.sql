-- Leads are now tracked per product: Salon Central (the original pipeline)
-- and Pointly. Existing rows all belong to Salon Central, which is also the
-- default for anything inserted without an explicit product.
--
-- Written to be safely re-runnable: this project applies migrations by hand
-- in the Supabase SQL editor, so a half-applied run must not block a retry.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_product') then
    create type public.lead_product as enum ('salon_central', 'pointly');
  end if;
end
$$;

alter table public.leads
  add column if not exists product public.lead_product not null default 'salon_central';

-- Every leads query is scoped by product, usually alongside status.
create index if not exists leads_product_idx on public.leads (product);
create index if not exists leads_product_status_idx on public.leads (product, status);
