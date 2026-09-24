-- Insert Teams
insert into public.teams (id, name, short_name) values
  ('d8b13a30-c3d6-444a-95ab-61d560c5a3d7', 'Calicut FC', 'CFC'),
  ('1215b22b-2e97-400d-9fb4-2458428801b6', 'Malappuram FC', 'MFC'),
  ('69372132-9c32-4d2d-be8a-2c8135805c8a', 'Kannur Warriors', 'KWF'),
  ('5e625a6b-c743-4c9f-8646-95fc13c02eb9', 'Kochi United', 'KUT');

-- Insert Rounds
insert into public.rounds (id, name, round_order) values
  ('c4224b74-1234-4b55-a22c-567812349012', 'Round 1', 1),
  ('a4224b74-1234-4b55-a22c-567812349013', 'Round 2', 2);

-- Insert Fixtures
insert into public.fixtures (round_id, home_team_id, away_team_id, kickoff_time, venue) values
  ('c4224b74-1234-4b55-a22c-567812349012', 'd8b13a30-c3d6-444a-95ab-61d560c5a3d7', '1215b22b-2e97-400d-9fb4-2458428801b6', now() + interval '2 days', 'EMS Stadium'),
  ('c4224b74-1234-4b55-a22c-567812349012', '69372132-9c32-4d2d-be8a-2c8135805c8a', '5e625a6b-c743-4c9f-8646-95fc13c02eb9', now() + interval '3 days', 'Kannur Stadium');
