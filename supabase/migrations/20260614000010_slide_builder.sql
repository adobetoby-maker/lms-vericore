create table if not exists public.slide_modules (
  id uuid primary key default gen_random_uuid(),
  course_id bigint not null references public.courses(id) on delete cascade,
  title text not null,
  slide_type text not null default 'tiptap' check (slide_type in ('tiptap', 'pdf')),
  content jsonb,          -- TipTap JSON doc for tiptap type
  pdf_path text,          -- storage path for pdf type
  pdf_file_name text,
  slide_order int not null default 0,
  read_aloud_enabled boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.slide_modules enable row level security;

drop policy if exists "slide_admin" on public.slide_modules;
drop policy if exists "slide_learner" on public.slide_modules;

create policy "slide_admin" on public.slide_modules for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "slide_learner" on public.slide_modules for select using (
  exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = auth.uid()
    and c.id = slide_modules.course_id
  )
);
