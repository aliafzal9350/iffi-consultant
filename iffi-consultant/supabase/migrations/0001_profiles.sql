-- Phase 1: one profile row per Google account, created automatically on first sign-in.
-- Run once in Supabase -> SQL Editor (or `supabase db push` if you use the CLI).

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  whatsapp    text,
  -- 'staff' is set only by the server (auth callback, from STAFF_EMAILS); students cannot change it
  role        text not null default 'student' check (role in ('student', 'staff')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- keep updated_at honest
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- first Google sign-in -> profile row with the name and photo Google returned
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- security definer: reads profiles without going through RLS, so staff policies do not recurse
create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'staff');
$$;

-- Row-level security: a student sees and edits only their own row; staff can read every row.
alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "staff read all profiles" on public.profiles
  for select to authenticated using (public.is_staff());

create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Column privileges: RLS decides which ROWS, grants decide which COLUMNS.
-- Without this, a student could set their own role to 'staff' from the browser console.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, whatsapp) on public.profiles to authenticated;
