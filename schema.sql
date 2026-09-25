-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Custom Types
create type user_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type user_role as enum ('member', 'admin');
create type match_status as enum ('upcoming', 'live', 'completed', 'postponed', 'cancelled', 'awaiting_result');

-- Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text not null,
  status user_status default 'pending' not null,
  role user_role default 'member' not null,
  language text default 'en' not null,
  admin_notes text,
  created_at timestamptz default now() not null
);

-- Teams Table
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_ml text,
  short_name text not null,
  short_name_ml text,
  logo_url text,
  badge_url text
);

-- Rounds Table
create table public.rounds (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_ml text,
  round_order int not null
);

-- Fixtures Table
create table public.fixtures (
  id uuid default uuid_generate_v4() primary key,
  round_id uuid references public.rounds on delete cascade not null,
  home_team_id uuid references public.teams on delete cascade not null,
  away_team_id uuid references public.teams on delete cascade not null,
  kickoff_time timestamptz not null,
  original_kickoff_time timestamptz,
  is_rescheduled boolean default false not null,
  rescheduled_reason text,
  venue text,
  status match_status default 'upcoming' not null,
  home_score int,
  away_score int,
  finalized boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint check_fixture_scores_non_negative check (
    (home_score is null and away_score is null) or
    (home_score >= 0 and away_score >= 0)
  )
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
  unique(user_id, fixture_id),
  constraint check_prediction_scores_non_negative check (home_score >= 0 and away_score >= 0)
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

-- Admin Audit Logs Table (Private audit history for consequential actions)
create table public.admin_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  reason text,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz default now() not null
);

-- Rules Table
create table public.rules (
  id uuid default uuid_generate_v4() primary key,
  title_en text default 'Contest Rules' not null,
  title_ml text default 'മത്സര നിയമങ്ങൾ' not null,
  content_en text not null,
  content_ml text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default now() not null
);

-- Performance Indexes
create index idx_predictions_user_id on public.predictions(user_id);
create index idx_predictions_fixture_id on public.predictions(fixture_id);
create index idx_fixtures_kickoff_time on public.fixtures(kickoff_time);
create index idx_fixtures_status on public.fixtures(status);
create index idx_admin_audit_created_at on public.admin_audit_logs(created_at desc);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.rounds enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_audits enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.rules enable row level security;

-- Profiles: Users can read public profile info (for leaderboard). Users can update own language/display_name. Admins can update all.
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Teams/Rounds/Fixtures/Announcements/Rules: Viewable by all, editable by admins
create policy "Teams viewable by everyone" on public.teams for select using (true);
create policy "Rounds viewable by everyone" on public.rounds for select using (true);
create policy "Fixtures viewable by everyone" on public.fixtures for select using (true);
create policy "Announcements viewable by everyone" on public.announcements for select using (true);
create policy "Rules viewable by everyone" on public.rules for select using (true);

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
create policy "Admins can insert/update/delete rules" on public.rules using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Admin Audit Logs: strictly admins only
create policy "Admin audit logs viewable only by admins" on public.admin_audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admin audit logs insertable only by admins" on public.admin_audit_logs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Predictions:
-- Privacy: User can view their own prediction anytime. Other users' predictions are viewable only AFTER kickoff. Admins can view all.
create policy "Predictions visibility rule" on public.predictions
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.fixtures f 
      where f.id = predictions.fixture_id and f.kickoff_time <= now()
    ) or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

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
