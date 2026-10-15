-- Phase 5: English proficiency letter support on study_profiles
-- Adds english_letter jsonb to store uploaded letter metadata (storage_path, file_name, mime_type, size_bytes, uploaded_at).
alter table public.study_profiles
  add column if not exists english_letter jsonb;
