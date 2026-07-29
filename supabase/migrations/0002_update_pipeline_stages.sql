-- Update the leads pipeline to: New, Contacted, Interested, Follow-up,
-- Demo Booked, Not Interested. Replaces the old Won/Lost stages —
-- existing 'won' rows become 'demo_booked', existing 'lost' rows become
-- 'not_interested'.

alter type public.lead_status rename to lead_status_old;

create type public.lead_status as enum (
  'new',
  'contacted',
  'interested',
  'follow_up',
  'demo_booked',
  'not_interested'
);

alter table public.leads
  alter column status drop default;

alter table public.leads
  alter column status type public.lead_status
  using (
    case status::text
      when 'won' then 'demo_booked'
      when 'lost' then 'not_interested'
      else status::text
    end
  )::public.lead_status;

alter table public.leads
  alter column status set default 'new'::public.lead_status;

drop type public.lead_status_old;
