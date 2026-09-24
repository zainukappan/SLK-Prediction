-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Custom Types
create type user_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type user_role as enum ('member', 'admin');
create type match_status as enum ('upcoming', 'live', 'completed', 'postponed', 'cancelled');

-- Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text not null,
  status user_status default 'pending' not null,
  role user_role default 'member' not null,
  language text default 'en' not null,
  created_at timestamptz default now() not null
);

-- Teams Table
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  short_name text not null,
  logo_url text
);

-- Rounds Table
create table public.rounds (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  round_order int not null
);

-- Fixtures Table
create table public.fixtures (
  id uuid default uuid_generate_v4() primary key,
  round_id uuid references public.rounds on delete cascade not null,
  home_team_id uuid references public.teams on delete cascade not null,
  away_team_id uuid references public.teams on delete cascade not null,
  kickoff_time timestamptz not null,
  venue text,
  status match_status default 'upcoming' not null,
  home_score int,
  away_score int,
  finalized boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Predictions Table
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  fixture_id uuid references public.fixtures on delete cascade not null,
  home_score int not null,
  away_score int not null,
  points_awarded int,
  points_reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, fixture_id)
);

-- Prediction Audits Table
create table public.prediction_audits (
  id uuid default uuid_generate_v4() primary key,
  prediction_id uuid references public.predictions on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  home_score int not null,
  away_score int not null,
  changed_at timestamptz default now() not null
);

-- Announcements Table
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title_en text not null,
  title_ml text not null,
  content_en text not null,
  content_ml text not null,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz default now() not null,
  active boolean default true not null
);

-- RLS Policies

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.rounds enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_audits enable row level security;
alter table public.announcements enable row level security;

-- Profiles: Users can read all profiles (needed for leaderboard). Users can update their own profile (language). Admins can update all.
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Teams/Rounds/Fixtures/Announcements: Viewable by all, editable by admins
create policy "Teams viewable by everyone" on public.teams for select using (true);
create policy "Rounds viewable by everyone" on public.rounds for select using (true);
create policy "Fixtures viewable by everyone" on public.fixtures for select using (true);
create policy "Announcements viewable by everyone" on public.announcements for select using (true);

create policy "Admins can insert/update/delete teams" on public.teams using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert/update/delete rounds" on public.rounds using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert/update/delete fixtures" on public.fixtures using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert/update/delete announcements" on public.announcements using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Predictions: Users can view all predictions (UI hides before deadline), can insert/update their own before deadline. Admins can view all.
create policy "Predictions viewable by everyone" on public.predictions for select using (true);

create policy "Users can insert own prediction" on public.predictions for insert with check (
  auth.uid() = user_id and
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and status = 'approved'
  ) and
  exists (
    select 1 from public.fixtures 
    where id = fixture_id and kickoff_time > now() + interval '5 minutes'
  )
);

create policy "Users can update own prediction" on public.predictions for update using (
  auth.uid() = user_id and
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and status = 'approved'
  ) and
  exists (
    select 1 from public.fixtures 
    where id = fixture_id and kickoff_time > now() + interval '5 minutes'
  )
);

create policy "Admins can update predictions (for scoring)" on public.predictions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Trigger for Prediction Audit
create or replace function public.log_prediction_change()
returns trigger as $$
begin
  insert into public.prediction_audits (prediction_id, user_id, home_score, away_score)
  values (new.id, new.user_id, new.home_score, new.away_score);
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_prediction_audit
after insert or update of home_score, away_score on public.predictions
for each row execute function public.log_prediction_change();

-- Trigger for User Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger to recalculate points when fixture is finalized/updated by admin
-- Note: This is complex in SQL. It's often better handled in the application layer (Next.js server action) to easily handle audit logs and errors.
-- We'll implement scoring in Next.js Server Actions.
