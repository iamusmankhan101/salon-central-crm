-- Leads are now tracked per product: Salon Central (the original pipeline)
-- and Pointly. Existing rows all belong to Salon Central, which is also the
-- default for anything inserted without an explicit product.

create type public.lead_product as enum ('salon_central', 'pointly');

alter table public.leads
  add column product public.lead_product not null default 'salon_central';

-- Every leads query is scoped by product, usually alongside status.
create index leads_product_idx on public.leads (product);
create index leads_product_status_idx on public.leads (product, status);
