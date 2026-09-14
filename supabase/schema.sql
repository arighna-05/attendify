-- ==============================================================================
-- Attendify Supabase Database Schema
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. Helper function for updating timestamps automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  class_or_semester text not null,
  user_type text not null check (user_type in ('school', 'college')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Trigger for profiles updated_at
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 3. School Attendance Data Table
create table if not exists public.school_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  saturday_enabled boolean default true not null,
  current_week integer default 1 not null,
  previous_attended integer default 0 not null,
  previous_total integer default 0 not null,
  weeks jsonb default '[]'::jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Trigger for school_data updated_at
drop trigger if exists set_school_data_updated_at on public.school_data;
create trigger set_school_data_updated_at
  before update on public.school_data
  for each row
  execute function public.handle_updated_at();

-- 4. College Attendance Data Table
create table if not exists public.college_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  minimum_goal integer default 75 not null,
  eca_count integer default 0 not null,
  subjects jsonb default '[]'::jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Trigger for college_data updated_at
drop trigger if exists set_college_data_updated_at on public.college_data;
create trigger set_college_data_updated_at
  before update on public.college_data
  for each row
  execute function public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.school_data enable row level security;
alter table public.college_data enable row level security;

-- 6. Row Level Security Policies

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- School Data Policies
drop policy if exists "Users can manage own school data" on public.school_data;
create policy "Users can manage own school data"
  on public.school_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- College Data Policies
drop policy if exists "Users can manage own college data" on public.college_data;
create policy "Users can manage own college data"
  on public.college_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
