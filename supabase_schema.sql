-- =========================================================
-- PATHOSORUS 🦖 - SCHÉMA COMPLET SUPABASE AVEC GESTION DES RÔLES
-- (Créateurs & Lecteurs, Progression individuelle de Répétition Espacée)
-- À exécuter dans l'onglet "SQL Editor" de votre projet Supabase
-- =========================================================

-- 1. Table des Profils Utilisateurs & Rôles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'reader' check (role in ('creator', 'reader')),
  stats jsonb not null default '{"xp":0,"streak":1}'::jsonb,
  created_at timestamptz default now()
);

-- 2. Fonction de vérification des droits Créateur / Administrateur
-- Tous les comptes (créateurs, rédacteurs, lecteurs) peuvent enrichir la banque collective
create or replace function public.is_creator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;

revoke all on function public.is_creator() from public;
grant execute on function public.is_creator() to authenticated, anon;

-- Fonction stricte : Seuls Pierre-Alain et Samy ont le pouvoir de supprimer des questions ou DP
create or replace function public.is_admin_or_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce((auth.jwt() ->> 'email'), '')) in ('padoreau85@gmail.com', 'belhadef.samy@gmail.com');
$$;

revoke all on function public.is_admin_or_master() from public;
grant execute on function public.is_admin_or_master() to authenticated, anon;

-- 3. Trigger automatique lors de la création d'un utilisateur Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when lower(new.email) in ('padoreau85@gmail.com', 'belhadef.samy@gmail.com') then 'creator'
      else coalesce(new.raw_user_meta_data->>'role', 'reader')
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when lower(excluded.email) in ('padoreau85@gmail.com', 'belhadef.samy@gmail.com') then 'creator'
      else coalesce(public.profiles.role, excluded.role)
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Table de la Progression Individuelle de Répétition Espacée
-- Permet à chaque interne d'avoir ses propres intervalles, cartes maîtrisées et erreurs,
-- sans altérer le contenu central de la banque de questions partagée !
create table if not exists public.user_progress (
  user_id uuid references auth.users(id) on delete cascade,
  question_id text not null,
  mastered boolean not null default false,
  flagged boolean not null default false,
  stats jsonb not null default '{"seen":0,"correct":0,"consecutiveCorrect":0,"intervalDays":0,"nextReviewDate":null,"lastReviewed":null}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 5. Table des Questions (QCM, QCU, Piège/Vrai-Faux)
create table if not exists public.questions (
  id text primary key,
  created_at timestamptz default now(),
  format text not null default 'qcm',
  organ text not null,
  category text not null,
  entity text not null,
  question text not null,
  context text default '',
  options jsonb not null default '[]'::jsonb,
  correct jsonb not null default '[]'::jsonb,
  optionExplanations jsonb not null default '[]'::jsonb,
  acceptedAnswers jsonb not null default '[]'::jsonb,
  explanation text default '',
  explanationImages jsonb not null default '[]'::jsonb,
  trap text default '',
  tags jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  mastered boolean not null default false,
  stats jsonb not null default '{"seen":0,"correct":0}'::jsonb,
  flagged boolean not null default false
);

-- Rétrocompatibilité : ajout sans erreur des colonnes d'explications et schémas si la table existe déjà
alter table public.questions add column if not exists optionexplanations jsonb default '[]'::jsonb;
alter table public.questions add column if not exists explanationimages jsonb default '[]'::jsonb;
alter table public.questions add column if not exists acceptedanswers jsonb default '[]'::jsonb;
alter table public.questions add column if not exists difficulty text default 'facile';
alter table public.questions add column if not exists extremeclues text default '';

-- 6. Table des Dossiers Progressifs (DP)
create table if not exists public.cases (
  id text primary key,
  created_at timestamptz default now(),
  title text not null,
  organ text not null,
  category text not null,
  entity text not null,
  synopsis text default '',
  tags jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb
);

-- 7. Table des Tags personnalisés (#HES, #IHC...)
create table if not exists public.custom_tags (
  name text primary key,
  created_at timestamptz default now()
);

-- 8. Table des Trophées & Badges personnalisés
create table if not exists public.custom_badges (
  id text primary key,
  created_at timestamptz default now(),
  created_by text default '',
  name text not null,
  description text default '',
  icon text not null default '🏆',
  tier text not null default 'gold',
  xpReward integer not null default 50,
  conditionType text not null default 'organ_mastery',
  targetOrgan text default '',
  targetCount integer default 5
);

-- 9. Table des Fiches de Cours & Critères OMS par Lésion
create table if not exists public.lesion_notes (
  key text primary key,
  organ text not null default '',
  category text not null default '',
  entity text not null default '',
  content text not null default '',
  updated_at timestamptz default now(),
  author_name text default '',
  author_email text default ''
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) ET POLITIQUES D'ACCÈS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.questions enable row level security;
alter table public.cases enable row level security;
alter table public.custom_tags enable row level security;

-- Politiques Profiles
drop policy if exists "Lecture des profils pour utilisateurs connectés" on public.profiles;
create policy "Lecture des profils pour utilisateurs connectés"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Gestion des profils par les créateurs" on public.profiles;
create policy "Gestion des profils par les créateurs"
  on public.profiles for all
  to authenticated
  using (public.is_creator() or auth.uid() = id)
  with check (public.is_creator() or auth.uid() = id);

-- Politiques Progression Individuelle
drop policy if exists "Chaque utilisateur gère sa propre progression" on public.user_progress;
create policy "Chaque utilisateur gère sa propre progression"
  on public.user_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Politiques Questions
-- Lecture libre pour tous
drop policy if exists "Lecture publique des questions" on public.questions;
create policy "Lecture publique des questions"
  on public.questions for select
  using (true);

-- Création et mise à jour permises à tous les rédacteurs et lecteurs (comme le compte Master)
drop policy if exists "Écriture questions réservée aux créateurs" on public.questions;
drop policy if exists "Écriture questions autorisée pour tous" on public.questions;
create policy "Écriture questions autorisée pour tous"
  on public.questions for insert
  with check (true);

drop policy if exists "Mise à jour questions autorisée pour tous" on public.questions;
create policy "Mise à jour questions autorisée pour tous"
  on public.questions for update
  using (true)
  with check (true);

-- Suppression définitive STRICTEMENT réservée à Pierre-Alain et Samy (aucun risque de perte accidentelle)
drop policy if exists "Suppression questions réservée aux administrateurs" on public.questions;
create policy "Suppression questions réservée aux administrateurs"
  on public.questions for delete
  using (public.is_admin_or_master());

-- Politiques Dossiers Progressifs (DP)
drop policy if exists "Lecture publique des dossiers" on public.cases;
create policy "Lecture publique des dossiers"
  on public.cases for select
  using (true);

-- Création et mise à jour permises à tous les rédacteurs et lecteurs (comme le compte Master)
drop policy if exists "Écriture dossiers réservée aux créateurs" on public.cases;
drop policy if exists "Écriture dossiers autorisée pour tous" on public.cases;
create policy "Écriture dossiers autorisée pour tous"
  on public.cases for insert
  with check (true);

drop policy if exists "Mise à jour dossiers autorisée pour tous" on public.cases;
create policy "Mise à jour dossiers autorisée pour tous"
  on public.cases for update
  using (true)
  with check (true);

-- Suppression définitive DP STRICTEMENT réservée à Pierre-Alain et Samy
drop policy if exists "Suppression dossiers réservée aux administrateurs" on public.cases;
create policy "Suppression dossiers réservée aux administrateurs"
  on public.cases for delete
  using (public.is_admin_or_master());

-- Colonne auteur / créateur sur les dossiers progressifs si absente
alter table public.cases add column if not exists created_by text default '';

-- Politiques Tags personnalisés
drop policy if exists "Lecture publique des tags" on public.custom_tags;
create policy "Lecture publique des tags"
  on public.custom_tags for select
  using (true);

drop policy if exists "Écriture tags réservée aux créateurs" on public.custom_tags;
drop policy if exists "Écriture tags autorisée pour tous" on public.custom_tags;
create policy "Écriture tags autorisée pour tous"
  on public.custom_tags for all
  using (true)
  with check (true);

-- Politiques Badges personnalisés
alter table public.custom_badges enable row level security;

drop policy if exists "Lecture publique custom_badges" on public.custom_badges;
create policy "Lecture publique custom_badges"
  on public.custom_badges for select
  using (true);

drop policy if exists "Écriture custom_badges réservée aux créateurs" on public.custom_badges;
create policy "Écriture custom_badges réservée aux créateurs"
  on public.custom_badges for all
  to authenticated
  using (public.is_creator())
  with check (public.is_creator());

-- Politiques Fiches OMS / Topos de Lésions
alter table public.lesion_notes enable row level security;

drop policy if exists "Lecture publique des topos de lésions" on public.lesion_notes;
create policy "Lecture publique des topos de lésions"
  on public.lesion_notes for select
  using (true);

drop policy if exists "Écriture des topos pour utilisateurs connectés" on public.lesion_notes;
create policy "Écriture des topos pour utilisateurs connectés"
  on public.lesion_notes for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- CONFIGURATION DU STOCKAGE SUPABASE (STORAGE PHOTOS)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('pathosorus_images', 'pathosorus_images', true)
on conflict (id) do nothing;

drop policy if exists "Lecture publique photos" on storage.objects;
create policy "Lecture publique photos" on storage.objects
  for select using (bucket_id = 'pathosorus_images');

drop policy if exists "Upload photos pour utilisateurs connectés" on storage.objects;
drop policy if exists "Upload photos autorisée pour tous" on storage.objects;
create policy "Upload photos autorisée pour tous"
  on storage.objects
  for insert with check (bucket_id = 'pathosorus_images');
