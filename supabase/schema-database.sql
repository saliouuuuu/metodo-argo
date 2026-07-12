-- ============================================================
-- IL METODO ARGO — Schema database (Postgres / Supabase)
-- Da eseguire nel SQL Editor di Supabase, una volta sola.
-- Dopo questo file, eseguire seed-course-days.sql.
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES — un profilo per utente (collegato ad auth.users)
-- Creato dal webhook Stripe al momento dell'acquisto.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  dog_name text,
  -- profilo comportamentale assegnato dal quiz:
  -- trattore | squalo | esploratore | velcro | tornado
  quiz_profile text check (quiz_profile in
    ('trattore','squalo','esploratore','velcro','tornado')),
  -- bonus opzionale "SOS Pipì" per i cuccioli (flag separato)
  puppy_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PURCHASES — acquisti confermati da Stripe (via webhook)
-- ------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_session_id text not null unique,
  stripe_customer_id text,
  amount_total integer not null,          -- in centesimi (4700 = €47)
  currency text not null default 'eur',
  order_bump boolean not null default false, -- Checklist arrivo cucciolo €9
  purchased_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

-- ------------------------------------------------------------
-- COURSE_DAYS — i contenuti dei 21 giorni
-- module = null  → giorno comune a tutti (Fase 1 e Fase 3)
-- module = slug  → giorno della Fase 2 di quel profilo
-- ------------------------------------------------------------
create table if not exists public.course_days (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null check (day_number between 1 and 21),
  phase integer not null check (phase in (1, 2, 3)),
  module text check (module in
    ('trattore','squalo','esploratore','velcro','tornado')),
  title text not null,
  subtitle text,
  content text not null,                  -- testo del giorno (markdown leggero)
  video_url text,                         -- Bunny.net, quando ci saranno i video
  checklist jsonb not null default '[]',  -- ["voce 1", "voce 2", ...]
  unique (day_number, module)
);

create index if not exists course_days_module_idx on public.course_days (module, day_number);

-- ------------------------------------------------------------
-- PROGRESS — avanzamento personale per giorno
-- ------------------------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number integer not null check (day_number between 1 and 21),
  -- stato delle checkbox: array di booleani allineato alla checklist
  checklist_state jsonb not null default '[]',
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

-- ------------------------------------------------------------
-- QUIZ_RESPONSES — risposte del quiz pubblico (prima del checkout)
-- Scritte solo dal server (service role), mai dal client.
-- ------------------------------------------------------------
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  answers jsonb not null,                 -- risposte grezze del quiz
  profile text not null check (profile in
    ('trattore','squalo','esploratore','velcro','tornado')),
  puppy_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists quiz_responses_email_idx on public.quiz_responses (email);

-- ============================================================
-- ROW LEVEL SECURITY — ognuno vede solo i propri dati
-- ============================================================
alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.course_days enable row level security;
alter table public.progress enable row level security;
alter table public.quiz_responses enable row level security;

-- PROFILES: leggo e aggiorno solo il mio
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- PURCHASES: vedo solo i miei acquisti (inserimento solo via service role)
create policy "purchases: select own"
  on public.purchases for select
  using (auth.uid() = user_id);

-- COURSE_DAYS: leggibili solo da chi ha almeno un acquisto
create policy "course_days: select if purchased"
  on public.course_days for select
  using (
    exists (
      select 1 from public.purchases p
      where p.user_id = auth.uid()
    )
  );

-- PROGRESS: gestisco solo il mio avanzamento
create policy "progress: select own"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "progress: insert own"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "progress: update own"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- QUIZ_RESPONSES: nessuna policy client → accesso solo con service role

-- ============================================================
-- STORAGE — bucket privato "downloads" per ebook, tracker e bump
-- I file si caricano a mano dalla dashboard (Storage → downloads):
--   Metodo-Argo-ebook-v2.pdf
--   Tracker-21-giorni.pdf
--   Checklist-arrivo-cucciolo.pdf
-- L'area membri li serve con URL firmati: senza login e senza
-- acquisto non si scaricano.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('downloads', 'downloads', false)
on conflict (id) do nothing;

create policy "downloads: leggibili solo da chi ha acquistato"
  on storage.objects for select
  using (
    bucket_id = 'downloads'
    and exists (
      select 1 from public.purchases p
      where p.user_id = auth.uid()
    )
  );
