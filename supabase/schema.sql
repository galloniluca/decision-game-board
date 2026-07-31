-- Lean Trade-off Game — schema iniziale
-- Da eseguire manualmente nel SQL Editor di Supabase dopo revisione.
-- Lo script e' idempotente: puo' essere rieseguito senza duplicare dati.

-- 1) Tavoli (le 6 squadre, id fisso 1..6 usato anche nell'URL /tavolo/:id)
create table if not exists tavoli (
  id smallint primary key,
  nome text not null
);

-- 2) Opzioni: matrice punteggi editabile (4 round x 3 opzioni x 4 shift KPI)
create table if not exists opzioni (
  id bigserial primary key,
  round smallint not null check (round between 1 and 4),
  opzione text not null check (opzione in ('A', 'B', 'C')),
  nome text not null default '',
  shift_q smallint not null default 0 check (shift_q between -1 and 1),
  shift_s smallint not null default 0 check (shift_s between -1 and 1),
  shift_c smallint not null default 0 check (shift_c between -1 and 1),
  shift_p smallint not null default 0 check (shift_p between -1 and 1),
  unique (round, opzione)
);

-- 3) Sessione: stato di gioco, riga singola (id sempre 1)
create table if not exists sessione (
  id smallint primary key default 1 check (id = 1),
  round_attivo smallint not null default 1 check (round_attivo between 1 and 4),
  stato text not null default 'chiuso' check (stato in ('aperto', 'chiuso')),
  timer_avvio timestamptz
);

-- 4) Scelte: una scelta per tavolo per round
create table if not exists scelte (
  id bigserial primary key,
  tavolo_id smallint not null references tavoli (id),
  round smallint not null check (round between 1 and 4),
  opzione text not null check (opzione in ('A', 'B', 'C')),
  inviato_at timestamptz not null default now(),
  unique (tavolo_id, round)
);

-- Row Level Security: niente autenticazione, l'accesso e' protetto solo da
-- URL non indicizzati/non prevedibili. Policy permissive per il ruolo anon.
alter table tavoli enable row level security;
alter table opzioni enable row level security;
alter table sessione enable row level security;
alter table scelte enable row level security;

drop policy if exists "anon full access" on tavoli;
create policy "anon full access" on tavoli for all to anon using (true) with check (true);

drop policy if exists "anon full access" on opzioni;
create policy "anon full access" on opzioni for all to anon using (true) with check (true);

drop policy if exists "anon full access" on sessione;
create policy "anon full access" on sessione for all to anon using (true) with check (true);

drop policy if exists "anon full access" on scelte;
create policy "anon full access" on scelte for all to anon using (true) with check (true);

-- Seed: 6 tavoli
insert into tavoli (id, nome) values
  (1, 'Tavolo 1'),
  (2, 'Tavolo 2'),
  (3, 'Tavolo 3'),
  (4, 'Tavolo 4'),
  (5, 'Tavolo 5'),
  (6, 'Tavolo 6')
on conflict (id) do nothing;

-- Seed: riga sessione singleton
insert into sessione (id, round_attivo, stato) values (1, 1, 'chiuso')
on conflict (id) do nothing;

-- Seed: matrice opzioni vuota (shift a 0), da compilare nella vista Config (step 2)
insert into opzioni (round, opzione, nome, shift_q, shift_s, shift_c, shift_p)
select r, o, '', 0, 0, 0, 0
from (values (1), (2), (3), (4)) as rounds (r)
cross join (values ('A'), ('B'), ('C')) as opzioni_lettera (o)
on conflict (round, opzione) do nothing;
