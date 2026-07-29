-- Store each user's email on their profile so admins can tell sales reps
-- apart by more than just their display name (e.g. in the assign-to and
-- rep-filter dropdowns).

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'sales_rep'
  );
  return new;
end;
$$;
