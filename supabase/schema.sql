-- Run this in Supabase SQL Editor (Dashboard → SQL → New query).
-- Enables profiles, custom locations, materials, secured objects, and RLS.

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users; approval + admin flags)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_approved boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- No client insert/update: rows come from trigger; admins change flags via API (service role).

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If the line above errors on older Postgres, try instead:
-- for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Locations & materials (per user)
-- ---------------------------------------------------------------------------
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
alter table public.materials enable row level security;

create policy "locations_owner_all"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "materials_owner_all"
  on public.materials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Objects (replace legacy table if needed — see LEGACY section below)
-- ---------------------------------------------------------------------------
create table if not exists public.objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  length double precision not null,
  width double precision not null,
  depth double precision not null,
  surface text not null,
  location_id uuid not null references public.locations (id) on delete restrict,
  material_id uuid not null references public.materials (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.objects enable row level security;

create policy "objects_owner_all"
  on public.objects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- LEGACY: If you already have public.objects with column "location" (text)
-- and no user_id, back up data, then adapt manually, e.g.:
--   alter table public.objects add column user_id uuid references auth.users(id);
--   alter table public.objects add column location_id uuid references public.locations(id);
--   alter table public.objects add column material_id uuid references public.materials(id);
-- Migrate rows, set not null, drop column location;
-- This script assumes a fresh "objects" table or that you ran equivalent alters.

-- ---------------------------------------------------------------------------
-- First admin (run once with your Google account email after first login)
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set is_approved = true, is_admin = true
-- where email = 'you@example.com';
