-- Phase 3: staff and admin roles, the team list admins manage, and the history of every application.
-- Run once in Supabase -> SQL Editor, after 0002.

-- 1. Roles: student, staff (advisers) and admin (staff + manages the team)
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'staff', 'admin'));

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('staff', 'admin'));
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

-- 2. The team: Google emails that get staff or admin access at sign-in. Admins edit it in the portal (Team page).
create table public.team_members (
  email      text primary key check (email = lower(email)),
  role       text not null check (role in ('staff', 'admin')),
  added_by   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "admins read the team" on public.team_members
  for select to authenticated using (public.is_admin());

-- changes go through the server (secret key) after an admin check
revoke all on public.team_members from anon, authenticated;
grant select on public.team_members to authenticated;

-- 3. Application history: every status change, with an optional note that the student sees.
create table public.application_events (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status    text,
  to_status      text not null,
  note           text check (note is null or length(note) <= 1000),
  actor          uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index application_events_app on public.application_events (application_id, created_at desc);

alter table public.application_events enable row level security;

create policy "students read their own history" on public.application_events
  for select to authenticated using (
    exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );

create policy "staff read all history" on public.application_events
  for select to authenticated using (public.is_staff());

revoke all on public.application_events from anon, authenticated;
grant select on public.application_events to authenticated;
