-- Hollywood Birthday Awards – komplettes Schema. Im Supabase SQL Editor einmal ausführen.
create extension if not exists pgcrypto;

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  voting_status text not null default 'upcoming' check (voting_status in ('upcoming','open','closed'))
);
insert into settings (id) values (1) on conflict do nothing;

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null default '',
  display_name text not null,
  description text,
  photo_path text,
  nominated boolean not null default true,     -- darf dieser Gast nominiert werden?
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question text,
  emoji text not null default '🏆',
  position int not null default 0,
  active boolean not null default true
);

-- Jedes Smartphone bekommt beim ersten Betreten eine zufällige ID (Cookie). Keine Namen, keine Codes.
create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Der Primary Key (voter_id, category_id) IST die Doppelstimmen-Sperre.
create table if not exists votes (
  voter_id uuid not null references voters(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  nominee_id uuid not null references guests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (voter_id, category_id)
);
create index if not exists votes_category_idx on votes (category_id, nominee_id);

-- RLS an, KEINE Policies: der öffentliche anon-Key kann nichts lesen/schreiben.
alter table settings enable row level security;
alter table guests enable row level security;
alter table categories enable row level security;
alter table votes enable row level security;
alter table voters enable row level security;

create or replace function cast_vote(p_voter uuid, p_category uuid, p_nominee uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select voting_status from settings where id = 1) <> 'open' then return 'not_open'; end if;
  if not exists (select 1 from voters where id = p_voter) then return 'invalid_guest'; end if;
  if not exists (select 1 from categories where id = p_category and active) then return 'invalid_category'; end if;
  if not exists (select 1 from guests where id = p_nominee and nominated) then return 'invalid_nominee'; end if;
  insert into votes (voter_id, category_id, nominee_id) values (p_voter, p_category, p_nominee);
  return 'ok';
exception when unique_violation then
  return 'already_voted';
end $$;

create or replace function vote_results()
returns table (category_id uuid, nominee_id uuid, votes bigint)
language sql security definer set search_path = public as
$$ select category_id, nominee_id, count(*) from votes group by 1, 2 $$;

revoke all on function cast_vote(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function vote_results() from public, anon, authenticated;

-- Privater Foto-Bucket (Auslieferung nur über kurzlebige Signed URLs vom Server)
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;

-- Beispiel-Kategorien
insert into categories (title, question, emoji, position) select * from (values
  ('Coolstes Outfit','Wer hat heute den besten Look?','🏆',1),
  ('Bestes Hollywood-Feeling','Wer bringt den Red Carpet zum Strahlen?','🎬',2),
  ('Größter Entertainer','Wer hat den ganzen Saal im Griff?','🎤',3),
  ('Beste Tanzmoves','Wer gehört auf die Tanzfläche der Stars?','💃',4),
  ('Lustigster Gast','Bei wem tun die Wangen vom Lachen weh?','😂',5),
  ('Party Animal','Wer geht als Letzter nach Hause?','🔥',6),
  ('Überraschung des Abends','Wer hat dich am meisten überrascht?','🎁',7),
  ('Sympathischster Gast','Mit wem würdest du sofort einen Film drehen?','💛',8),
  ('Hollywood Star des Abends','Der größte Award der Nacht.','⭐',9)
) as v(title, question, emoji, position) where not exists (select 1 from categories);
