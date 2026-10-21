-- =========================================================
-- PATHOSORUS 🦖 - SCHÉMA DE BASE DE DONNÉES SUPABASE
-- À copier-coller dans l'onglet "SQL Editor" de votre projet Supabase
-- =========================================================

-- 1. Table des Questions (QCM, QCU, Piège/Vrai-Faux)
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
  explanation text default '',
  trap text default '',
  tags jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  mastered boolean not null default false,
  stats jsonb not null default '{"seen":0,"correct":0}'::jsonb,
  flagged boolean not null default false
);

-- 2. Table des Dossiers Progressifs (DP)
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

-- 3. Table des Tags personnalisés (#HES, #IHC...)
create table if not exists public.custom_tags (
  name text primary key,
  created_at timestamptz default now()
);

-- =========================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) AVEC ACCÈS LIBRE
-- Permet à l'application de lire/écrire sans blocage depuis l'hôpital
-- =========================================================

alter table public.questions enable row level security;
alter table public.cases enable row level security;
alter table public.custom_tags enable row level security;

drop policy if exists "Accès total questions" on public.questions;
create policy "Accès total questions" on public.questions
  for all using (true) with check (true);

drop policy if exists "Accès total cases" on public.cases;
create policy "Accès total cases" on public.cases
  for all using (true) with check (true);

drop policy if exists "Accès total custom_tags" on public.custom_tags;
create policy "Accès total custom_tags" on public.custom_tags
  for all using (true) with check (true);

-- =========================================================
-- CONFIGURATION DU STOCKAGE SUPABASE (STORAGE BUCKET POUR PHOTOS)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('pathosorus_images', 'pathosorus_images', true)
on conflict (id) do nothing;

drop policy if exists "Lecture publique photos" on storage.objects;
create policy "Lecture publique photos" on storage.objects
  for select using (bucket_id = 'pathosorus_images');

drop policy if exists "Upload public photos" on storage.objects;
create policy "Upload public photos" on storage.objects
  for insert with check (bucket_id = 'pathosorus_images');
