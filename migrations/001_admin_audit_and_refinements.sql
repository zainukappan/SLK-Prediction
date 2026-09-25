-- Migration 001: Admin Audit, Bilingual Enhancements, Constraints, and Schedule Refinements

-- 1. Extend match_status enum if not present
alter type match_status add value if not exists 'awaiting_result';

-- 2. Profiles table enhancements
alter table public.profiles
  add column if not exists admin_notes text;

-- 3. Teams table enhancements (English + Malayalam, Short Names, Badges)
alter table public.teams
  add column if not exists name_ml text,
  add column if not exists short_name_ml text,
  add column if not exists badge_url text;

-- Backfill badge_url from logo_url if present
update public.teams set badge_url = logo_url where badge_url is null and logo_url is not null;

-- 4. Rounds table enhancements
alter table public.rounds
  add column if not exists name_ml text;

-- 5. Fixtures table enhancements (Reschedule Tracking & Score Constraints)
alter table public.fixtures
  add column if not exists original_kickoff_time timestamptz,
  add column if not exists is_rescheduled boolean default false not null,
  add column if not exists rescheduled_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_fixture_scores_non_negative'
  ) then
    alter table public.fixtures
      add constraint check_fixture_scores_non_negative
      check (
        (home_score is null and away_score is null) or
        (home_score >= 0 and away_score >= 0)
      );
  end if;
end $$;

-- 6. Predictions table enhancements (Check Constraints & Uniqueness)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_prediction_scores_non_negative'
  ) then
    alter table public.predictions
      add constraint check_prediction_scores_non_negative
      check (home_score >= 0 and away_score >= 0);
  end if;
end $$;

-- 7. Admin Audit Logs Table (Private audit history for consequential actions)
create table if not exists public.admin_audit_logs (
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

-- 8. Contest Rules Table (Editable bilingual rules with last updated timestamp)
create table if not exists public.rules (
  id uuid default uuid_generate_v4() primary key,
  title_en text default 'Contest Rules' not null,
  title_ml text default 'മത്സര നിയമങ്ങൾ' not null,
  content_en text not null,
  content_ml text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz default now() not null
);

-- 9. Performance Indexes
create index if not exists idx_predictions_user_id on public.predictions(user_id);
create index if not exists idx_predictions_fixture_id on public.predictions(fixture_id);
create index if not exists idx_fixtures_kickoff_time on public.fixtures(kickoff_time);
create index if not exists idx_fixtures_status on public.fixtures(status);
create index if not exists idx_admin_audit_created_at on public.admin_audit_logs(created_at desc);

-- 10. Row Level Security for New Tables
alter table public.admin_audit_logs enable row level security;
alter table public.rules enable row level security;

-- Admin audit logs: strictly admins only
drop policy if exists "Admin audit logs viewable only by admins" on public.admin_audit_logs;
create policy "Admin audit logs viewable only by admins" on public.admin_audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admin audit logs insertable only by admins" on public.admin_audit_logs;
create policy "Admin audit logs insertable only by admins" on public.admin_audit_logs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Rules: viewable by everyone, editable by admins
drop policy if exists "Rules viewable by everyone" on public.rules;
create policy "Rules viewable by everyone" on public.rules
  for select using (true);

drop policy if exists "Admins can insert or update rules" on public.rules;
create policy "Admins can insert or update rules" on public.rules
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Update Predictions Policy: Members can only see other members' predictions AFTER kickoff
drop policy if exists "Predictions viewable by everyone" on public.predictions;
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

-- 11. Seed default rules if table is empty
insert into public.rules (title_en, title_ml, content_en, content_ml)
select
  'Contest Rules',
  'മത്സര നിയമങ്ങൾ',
  '1. Predictions & Deadlines
You can submit or edit your prediction until exactly 5 minutes before scheduled kickoff. Once deadline passes, predictions are locked. Server time strictly dictates the deadline.

2. Scoring System
Scores are based on full-time result at regulation time (stoppage time included; extra time and penalty shootouts are EXCLUDED):
• Exact Score: 5 Points
• Correct Outcome (Win/Draw/Loss): 3 Points
• Incorrect: 0 Points
Points are mutually exclusive (you receive 5 or 3, not both).

3. Correct Outcomes Statistic
An exact-score prediction also counts toward the member''s "Correct Outcomes" statistic. A non-exact prediction with the right outcome also counts.

4. Postponements & Cancellations
Postponed fixtures receive no points while awaiting a valid final result. Cancelled fixtures receive 0 points. If kickoff is rescheduled, the deadline updates to 5 minutes before the new kickoff.

5. Leaderboard Tie-Breakers
1. Total Points
2. Exact Scores count (5 pts)
3. Correct Outcomes count (Exact + Outcome)
If members remain tied after all 3 tie-breakers, a shared rank is displayed.',
  '1. പ്രവചനങ്ങളും സമയപരിധിയും
ഷെഡ്യൂൾ ചെയ്ത കിക്കോഫ് സമയത്തിന് കൃത്യം 5 മിനിറ്റ് മുമ്പ് വരെ പ്രവചനം സമർപ്പിക്കാനോ എഡിറ്റ് ചെയ്യാനോ കഴിയും. സമയപരിധി കഴിഞ്ഞാൽ പ്രവചനങ്ങൾ ലോക്ക് ചെയ്യപ്പെടും. സെർവർ സമയമാണ് കർശനമായി പാലിക്കുന്നത്.

2. സ്കോറിംഗ് സിസ്റ്റം
റെഗുലേഷൻ സമയം (സ്റ്റോപ്പേജ് സമയം ഉൾപ്പെടെ) അവസാനിക്കുമ്പോഴുള്ള ഫുൾ ടൈം റിസൾട്ട് അടിസ്ഥാനമാക്കിയാണ് സ്കോറുകൾ (എക്സ്ട്രാ ടൈമും പെനാൽറ്റി ഷൂട്ടൗട്ടും ഒഴിവാക്കിയിരിക്കുന്നു):
• കൃത്യമായ സ്കോർ: 5 പോയിന്റ്
• ശരിയായ ഫലം (ജയം/സമനില/തോൽവി): 3 പോയിന്റ്
• തെറ്റായത്: 0 പോയിന്റ്

3. ശരിയായ ഫലങ്ങളുടെ കണക്ക്
കൃത്യമായ സ്കോർ പ്രവചിച്ചാൽ അത് അംഗത്തിന്റെ "ശരിയായ ഫലങ്ങൾ" കണക്കിലും ഉൾപ്പെടും. ഫലം മാത്രം ശരിയായതും ഇതിൽ കണക്കാക്കും.

4. മാറ്റിവെക്കലുകളും റദ്ദാക്കലുകളും
മാറ്റിവെച്ച മത്സരങ്ങൾക്ക് അന്തിമഫലം വരുന്നതുവരെ പോയിന്റ് ലഭിക്കില്ല. റദ്ദാക്കിയ മത്സരങ്ങൾക്ക് 0 പോയിന്റാണ്. കിക്കോഫ് സമയം മാറ്റിയാൽ, പുതിയ സമയത്തിന് 5 മിനിറ്റ് മുമ്പ് വരെ പ്രവചിക്കാം.

5. ലീഡർബോർഡ് ടൈ-ബ്രേക്കർ
1. ആകെ പോയിന്റ്
2. കൃത്യമായ സ്കോറുകളുടെ എണ്ണം
3. ശരിയായ ഫലങ്ങളുടെ എണ്ണം
ഇതിലും തുല്യമാണെങ്കിൽ ഒരേ റാങ്ക് പങ്കിടും.'
where not exists (select 1 from public.rules);
