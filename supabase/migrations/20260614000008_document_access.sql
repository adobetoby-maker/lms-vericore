-- Document visibility control and team-based access

-- Add visibility level to documents
alter table public.documents
  add column if not exists visibility text not null default 'all'
  check (visibility in ('all', 'teams', 'admin_only'));

-- Which teams can see a document, and whether it's required for them
create table if not exists public.document_access (
  id          serial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  team_id     int  not null references public.teams(id)     on delete cascade,
  is_required boolean not null default false,
  created_at  timestamptz default now(),
  unique(document_id, team_id)
);

alter table public.document_access enable row level security;

drop policy if exists "doc_access_admin"   on public.document_access;
drop policy if exists "doc_access_learner" on public.document_access;

create policy "doc_access_admin" on public.document_access for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "doc_access_learner" on public.document_access for select using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = document_access.team_id and tm.user_id = auth.uid()
  )
);
