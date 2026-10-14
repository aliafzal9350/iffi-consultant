-- Phase 4: the online application. The form sections save into applications.form (0002); this adds uploaded
-- documents, the signature, payments (static QR, checked by staff), adviser assignment, settings staff can change,
-- and turns application_events into a full activity log. Run once in Supabase -> SQL Editor, after 0003.

-- 1. Applications: facts only the server records (students have no update grant on these columns)
alter table public.applications
  add column signed_name               text check (signed_name is null or length(signed_name) <= 200),
  add column signed_at                 timestamptz,
  add column refund_policy_version     text,
  add column refund_policy_accepted_at timestamptz,
  -- set by staff per application: IFFI's fees depend on the scholarship the student gets (null = not set yet)
  add column application_fee_usd       numeric(8, 2) check (application_fee_usd is null or application_fee_usd >= 0),
  add column service_charge_usd        numeric(8, 2) check (service_charge_usd is null or service_charge_usd >= 0),
  add column assigned_to               uuid references public.profiles (id) on delete set null;

create index applications_assigned on public.applications (assigned_to);

-- Students fill in the form while it is a draft, and again when IFFI asks them to fix something.
drop policy "edit own draft" on public.applications;
create policy "edit own form while open" on public.applications
  for update to authenticated
  using (user_id = (select auth.uid()) and status in ('draft', 'action_needed'))
  with check (user_id = (select auth.uid()) and status in ('draft', 'action_needed'));

-- 2. Uploaded documents. The files live in the private 'application-files' bucket (section 6); rows are written by
-- the server only, after it has checked the uploaded file.
create table public.application_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  kind           text not null check (kind ~ '^[a-z][a-z_]{1,39}$'),
  storage_path   text not null unique,
  file_name      text not null check (length(file_name) between 1 and 200),
  mime_type      text not null,
  size_bytes     integer not null check (size_bytes > 0),
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  -- why staff asked for a new file; the student reads it
  review_note    text check (review_note is null or length(review_note) <= 1000),
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index application_documents_app on public.application_documents (application_id, kind);
create index application_documents_pending on public.application_documents (created_at) where status = 'pending';

alter table public.application_documents enable row level security;

create policy "students read their own documents" on public.application_documents
  for select to authenticated using (user_id = (select auth.uid()));

create policy "staff read all documents" on public.application_documents
  for select to authenticated using (public.is_staff());

revoke all on public.application_documents from anon, authenticated;
grant select on public.application_documents to authenticated;

-- 3. Payments: the student pays with IFFI's QR code and sends the transaction ID; staff check it against the account.
create table public.application_payments (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  purpose           text not null check (purpose in ('application_fee', 'service_charge')),
  amount            numeric(12, 2) not null check (amount > 0),
  currency          text not null check (currency ~ '^[A-Z]{3}$'),
  transaction_id    text not null check (length(transaction_id) between 4 and 80),
  paid_on           date not null,
  proof_document_id uuid references public.application_documents (id) on delete set null,
  status            text not null default 'submitted' check (status in ('submitted', 'verified', 'rejected')),
  review_note       text check (review_note is null or length(review_note) <= 1000),
  reviewed_by       uuid references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index application_payments_app on public.application_payments (application_id, created_at desc);
-- one transaction cannot pay for two applications (a rejected attempt can be sent again)
create unique index application_payments_txn on public.application_payments (lower(transaction_id)) where status <> 'rejected';

alter table public.application_payments enable row level security;

create policy "students read their own payments" on public.application_payments
  for select to authenticated using (user_id = (select auth.uid()));

create policy "staff read all payments" on public.application_payments
  for select to authenticated using (public.is_staff());

revoke all on public.application_payments from anon, authenticated;
grant select on public.application_payments to authenticated;

-- 4. The activity log: every step (form part finished, upload, signature, payment, staff note), not only status
-- changes. Staff-only notes are hidden from the student by the policy below.
alter table public.application_events
  alter column to_status drop not null,
  add column type text not null default 'status'
    check (type in ('status', 'form', 'document', 'payment', 'signature', 'note', 'assignment')),
  add column meta jsonb,
  add column visible_to_student boolean not null default true,
  add constraint application_events_status_has_to check (type <> 'status' or to_status is not null);

create index application_events_recent on public.application_events (created_at desc);

drop policy "students read their own history" on public.application_events;
create policy "students read their own history" on public.application_events
  for select to authenticated using (
    visible_to_student
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );

-- 5. Settings admins change in the staff portal without a redeploy (payment account, QR code, default fees).
create table public.app_settings (
  key        text primary key check (key ~ '^[a-z][a-z_]{1,39}$'),
  value      jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

alter table public.app_settings enable row level security;

-- students need the payment details to pay; writes go through the server after an admin check
create policy "signed-in users read settings" on public.app_settings
  for select to authenticated using (true);

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;

-- 6. Private file storage. No storage policies on purpose: the browser uploads only through one-time signed URLs the
-- server creates after checking the application, and files open only through /portal/files (short signed links).
-- 50 MB is the largest file the Supabase free plan accepts (a self-introduction video can be big).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-files',
  'application-files',
  false,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
