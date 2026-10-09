-- Einmal im Supabase SQL Editor ausführen (für die bereits eingerichtete Datenbank).
-- ACHTUNG: ersetzt alle bisherigen Kategorien durch die drei neuen. Bereits abgegebene Stimmen gehen dabei verloren.

alter table guests add column if not exists gender text not null default 'm' check (gender in ('m','f'));
alter table categories add column if not exists audience text not null default 'all' check (audience in ('all','m','f'));

create or replace function cast_vote(p_voter uuid, p_category uuid, p_nominee uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select voting_status from settings where id = 1) <> 'open' then return 'not_open'; end if;
  if not exists (select 1 from voters where id = p_voter) then return 'invalid_guest'; end if;
  if not exists (select 1 from categories where id = p_category and active) then return 'invalid_category'; end if;
  if not exists (
    select 1 from guests g, categories c
    where g.id = p_nominee and g.nominated and c.id = p_category
      and (c.audience = 'all' or c.audience = g.gender)
  ) then return 'invalid_nominee'; end if;
  insert into votes (voter_id, category_id, nominee_id) values (p_voter, p_category, p_nominee);
  return 'ok';
exception when unique_violation then
  return 'already_voted';
end $$;

delete from categories;
insert into categories (title, question, emoji, position, audience) values
  ('Best Dressed – Male','Wer hat den besten Look unter den Herren?','🕴️',1,'m'),
  ('Best Dressed – Female','Wer hat den besten Look unter den Damen?','👗',2,'f'),
  ('Sympathischster Gast','Mit wem würdest du sofort einen Film drehen?','💛',3,'all');
