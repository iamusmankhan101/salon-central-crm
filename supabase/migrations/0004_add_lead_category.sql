-- Add a lead category so venues can be separated by type
-- (Salon, Spa, Aesthetics, Barbershop, Nail Studio, Med Spa).

create type public.lead_category as enum (
  'salon',
  'spa',
  'aesthetics',
  'barbershop',
  'nail_studio',
  'med_spa'
);

alter table public.leads
  add column category public.lead_category;

create index leads_category_idx on public.leads (category);
