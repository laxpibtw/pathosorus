-- =========================================================================
-- PATHOSORUS 🦖 - MIGRATION DÉFINITIVE : STATISTIQUES & PROGRESSION PROPRES
-- À copier-coller et exécuter dans l'onglet "SQL Editor" de votre Supabase
-- =========================================================================

-- 1. Table officielle des Statistiques Utilisateurs (Leaderboard & Duel)
create table if not exists public.user_stats (
  email text primary key,
  name text not null default '',
  role text not null default 'reader',
  xp integer not null default 0,
  streak integer not null default 1,
  total_correct integer not null default 0,
  total_answered integer not null default 0,
  unlocked_badges jsonb not null default '{}'::jsonb,
  completed_categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Activation RLS
alter table public.user_stats enable row level security;

-- Politiques : Lecture publique pour tout le monde (classement en direct 0 ms)
drop policy if exists "Lecture publique user_stats" on public.user_stats;
create policy "Lecture publique user_stats"
  on public.user_stats for select
  using (true);

-- Écriture permise pour mettre à jour son score
drop policy if exists "Écriture user_stats autorisée" on public.user_stats;
create policy "Écriture user_stats autorisée"
  on public.user_stats for all
  using (true)
  with check (true);

-- 2. Table officielle de la Progression Individuelle (Répétition Espacée)
create table if not exists public.user_question_progress (
  user_email text not null,
  question_id text not null,
  mastered boolean not null default false,
  flagged boolean not null default false,
  seen integer not null default 0,
  correct integer not null default 0,
  consecutive_correct integer not null default 0,
  interval_days integer not null default 0,
  last_reviewed timestamptz,
  next_review_date date,
  updated_at timestamptz not null default now(),
  primary key (user_email, question_id)
);

-- Activation RLS
alter table public.user_question_progress enable row level security;

-- Politiques : Lecture et écriture autorisées
drop policy if exists "Accès user_question_progress" on public.user_question_progress;
create policy "Accès user_question_progress"
  on public.user_question_progress for all
  using (true)
  with check (true);

-- 3. Insertion initiale des scores légitimes confirmés
insert into public.user_stats (email, name, role, xp, streak, total_correct, total_answered, unlocked_badges)
values 
  ('padoreau85@gmail.com', 'Dr Pierre-Alain Doreau', 'creator', 237, 1, 11, 15, '{"organ_orl_10":1,"organ_orl_25":1,"organ_orl_50":1,"organ_orl_80":1,"organ_orl_100":1,"organ_ovaire_10":1,"organ_ovaire_25":1,"organ_col_ut_rin_10":1,"organ_col_ut_rin_25":1,"organ_rein_10":1,"organ_rein_25":1,"organ_rein_50":1,"organ_rein_80":1,"organ_rein_100":1}'::jsonb),
  ('belhadef.samy@gmail.com', 'Dr Samy Belhadef', 'creator', 15, 1, 2, 2, '{}'::jsonb)
on conflict (email) do update set
  xp = excluded.xp,
  total_correct = excluded.total_correct,
  total_answered = excluded.total_answered,
  unlocked_badges = excluded.unlocked_badges,
  updated_at = now();
