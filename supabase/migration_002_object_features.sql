-- Run in Supabase SQL Editor after baseline schema exists.
-- Adds: slab description, price, photos, audit/changelog, can_edit_objects permission.

-- ---------------------------------------------------------------------------
-- Profiles: who may create/edit inventory (view-only if false; admins always can)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists can_edit_objects boolean not null default false;

update public.profiles
set can_edit_objects = true
where is_approved = true;

-- New signups keep can_edit_objects = false until an admin enables it.

-- ---------------------------------------------------------------------------
-- Objects: description, price, audit timestamps / actors
-- ---------------------------------------------------------------------------
alter table public.objects
  add column if not exists description text not null default '',
  add column if not exists price numeric(14, 2),
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

update public.objects
set
  created_by = coalesce(created_by, user_id),
  updated_by = coalesce(updated_by, user_id)
where created_by is null or updated_by is null;

-- ---------------------------------------------------------------------------
-- Changelog rows (create + each update)
-- ---------------------------------------------------------------------------
create table if not exists public.object_changelog (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete set null,
  action text not null check (action in ('create', 'update')),
  at timestamptz not null default now()
);

alter table public.object_changelog enable row level security;

drop policy if exists "object_changelog_select" on public.object_changelog;
create policy "object_changelog_select"
  on public.object_changelog for select
  using (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "object_changelog_insert" on public.object_changelog;
create policy "object_changelog_insert"
  on public.object_changelog for insert
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.objects o
      where o.id = object_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Photo metadata (files live in Storage bucket "object-images")
-- ---------------------------------------------------------------------------
create table if not exists public.object_photos (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists object_photos_object_id_idx on public.object_photos (object_id);

alter table public.object_photos enable row level security;

drop policy if exists "object_photos_select" on public.object_photos;
create policy "object_photos_select"
  on public.object_photos for select
  using (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "object_photos_insert" on public.object_photos;
create policy "object_photos_insert"
  on public.object_photos for insert
  with check (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "object_photos_delete" on public.object_photos;
create policy "object_photos_delete"
  on public.object_photos for delete
  using (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: create bucket "object-images" in Dashboard → Storage → New bucket
-- Name: object-images — set "Public bucket" ON so QR/public pages can load URLs.
-- No SQL required for bucket creation in hosted Supabase (use the UI).
-- ---------------------------------------------------------------------------
