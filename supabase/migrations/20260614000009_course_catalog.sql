-- Course catalog columns for learner self-enrollment

alter table public.courses
  add column if not exists category text not null default 'General',
  add column if not exists subcategory text,
  add column if not exists difficulty text not null default 'Beginner'
    check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  add column if not exists duration_minutes int not null default 30,
  add column if not exists is_featured bool not null default false,
  add column if not exists thumbnail text,
  add column if not exists catalog_visible bool not null default false;

-- catalog_visible=true means learners can self-enroll from catalog
-- is_active=true means it exists; catalog_visible=true means it's browseable
