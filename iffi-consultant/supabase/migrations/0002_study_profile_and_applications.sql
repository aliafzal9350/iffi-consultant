-- Phase 2: the study profile (drives programme matching) and applications.
-- Run once in Supabase -> SQL Editor, after 0001_profiles.sql.

-- One study profile per student. Mirrors the eligibility checker's Profile (src/lib/eligibility.ts).
create table public.study_profiles (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  level          text not null check (level in ('Bachelor', 'MBBS', 'Master', 'PhD', 'Language')),
  field          text,                       -- null = any field
  date_of_birth  date,
  grade_mode     text not null default 'percentage' check (grade_mode in ('percentage', 'cgpa')),
  percent        numeric(5, 2) check (percent is null or (percent > 0 and percent <= 100)),
  cgpa           numeric(4, 2) check (cgpa is null or cgpa >= 0),
  cgpa_scale     numeric(3, 1) not null default 4,
  english_test   text not null default 'none' check (english_test in ('ielts', 'toefl', 'duolingo', 'pte', 'moi', 'none')),
  english_score  numeric(5, 1),
  hsk            smallint not null default 0 check (hsk between 0 and 6),
  teaching       text not null default 'either' check (teaching in ('English', 'Chinese', 'either')),
  funding        text not null default 'partial' check (funding in ('full', 'partial', 'self')),
  bank_usd       integer not null default 0 check (bank_usd >= 0),
  country        text not null default 'PK',
  -- AI "why it fits you" notes, cached for the answers they were written for
  ai_matches     jsonb,
  ai_matches_key text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger study_profiles_touch before update on public.study_profiles
  for each row execute function public.touch_updated_at();

alter table public.study_profiles enable row level security;

create policy "own study profile" on public.study_profiles
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "staff read study profiles" on public.study_profiles
  for select to authenticated using (public.is_staff());

revoke all on public.study_profiles from anon, authenticated;
grant select, insert, update on public.study_profiles to authenticated;

-- Applications: one per student per programme.
create table public.applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  program_id       text not null,
  -- the programme as it was when the student applied (programs.json is regenerated from new brochures)
  program_snapshot jsonb not null,
  status           text not null default 'draft' check (status in (
                     'draft', 'payment_submitted', 'under_review', 'action_needed', 'sent_to_university',
                     'admitted', 'not_admitted', 'jw202_issued', 'visa', 'completed', 'withdrawn')),
  -- the application form answers, section by section
  form             jsonb not null default '{}'::jsonb,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, program_id)
);

create index applications_user on public.applications (user_id);

create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

alter table public.applications enable row level security;

create policy "read own applications" on public.applications
  for select to authenticated using (user_id = (select auth.uid()));

create policy "staff read applications" on public.applications
  for select to authenticated using (public.is_staff());

-- students may edit the form answers, and only while the application is still a draft
create policy "edit own draft" on public.applications
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'draft')
  with check (user_id = (select auth.uid()) and status = 'draft');

-- Creating an application and every status change go through the server (secret key), never the browser:
-- no insert grant, and update only on the form column.
revoke all on public.applications from anon, authenticated;
grant select on public.applications to authenticated;
grant update (form) on public.applications to authenticated;
