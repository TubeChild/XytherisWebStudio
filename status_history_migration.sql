-- W-Tracker: status_history table
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Mirrors the RLS pattern already used by job_applications / application_files:
-- each user can only see and write their own rows.

create extension if not exists pgcrypto;

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  changed_at timestamptz not null default now()
);

create index if not exists status_history_application_id_idx on public.status_history(application_id);
create index if not exists status_history_user_id_idx on public.status_history(user_id);

alter table public.status_history enable row level security;

create policy "Users can view their own status history"
  on public.status_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own status history"
  on public.status_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own status history"
  on public.status_history for delete
  using (auth.uid() = user_id);
