-- =========================================================================
-- PATHOSORUS 🦖 - MIGRATION SUPABASE : TROPHÉES, TITRES ÉQUIPÉS & ANTI-TRICHE
-- À copier-coller et exécuter dans l'onglet "SQL Editor" de votre Supabase
-- =========================================================================

-- 1. Table officielle des Définitions de Trophées & Badges personnalisés
create table if not exists public.custom_badges (
  id text primary key,
  created_at timestamptz default now(),
  created_by text default '',
  name text not null,
  description text default '',
  icon text not null default '🏆',
  tier text not null default 'gold',
  xpReward integer not null default 0,
  conditionType text not null default 'tag_mastery',
  targetOrgan text default '',
  targetTag text default '',
  targetCount integer default 5
);

-- Rétrocompatibilité : ajout des colonnes manquantes si la table existait
alter table public.custom_badges add column if not exists targetTag text default '';
alter table public.custom_badges add column if not exists xpReward integer default 0;

-- Activation RLS custom_badges
alter table public.custom_badges enable row level security;

drop policy if exists "Lecture publique custom_badges" on public.custom_badges;
create policy "Lecture publique custom_badges"
  on public.custom_badges for select
  using (true);

drop policy if exists "Écriture custom_badges autorisée" on public.custom_badges;
create policy "Écriture custom_badges autorisée"
  on public.custom_badges for all
  using (true)
  with check (true);


-- 2. Table officielle des Trophées Individuels Débloqués par Utilisateur
-- (Rend l'attribution des trophées 100% transparente et vérifiable ligne par ligne)
create table if not exists public.user_trophies (
  user_email text not null,
  badge_id text not null,
  badge_name text not null,
  category text not null default 'organ',
  unlocked_at timestamptz not null default now(),
  primary key (user_email, badge_id)
);

create index if not exists idx_user_trophies_email on public.user_trophies (user_email);

-- Activation RLS user_trophies
alter table public.user_trophies enable row level security;

drop policy if exists "Lecture publique user_trophies" on public.user_trophies;
create policy "Lecture publique user_trophies"
  on public.user_trophies for select
  using (true);

drop policy if exists "Écriture user_trophies autorisée" on public.user_trophies;
create policy "Écriture user_trophies autorisée"
  on public.user_trophies for all
  using (true)
  with check (true);


-- 3. Ajout du Titre Équipé, Renommage de Trophées et Date Active dans public.user_stats
alter table public.user_stats add column if not exists equipped_title text default '';
alter table public.user_stats add column if not exists trophy_custom_names jsonb default '{}'::jsonb;
alter table public.user_stats add column if not exists unlocked_badges jsonb default '{}'::jsonb;
alter table public.user_stats add column if not exists last_active_date date default current_date;

-- Réparation de la série active des confrères (J2 confirmé)
update public.user_stats
set streak = greatest(streak, 2),
    last_active_date = current_date
where lower(trim(email)) in ('padoreau85@gmail.com', 'belhadef.samy@gmail.com');


-- 4. Ajout de l'Anti-Triche et du Cooldown Quotidien d'XP dans public.user_question_progress
alter table public.user_question_progress add column if not exists last_failed_date date;
alter table public.user_question_progress add column if not exists last_correct_date date;
alter table public.user_question_progress add column if not exists last_xp_date date;
alter table public.user_question_progress add column if not exists trophy_eligible boolean default true;


-- 5. Protection : nettoyer Samy uniquement s'il a encore l'ancien bug des 46 faux trophées contaminés
delete from public.user_trophies
where lower(trim(user_email)) = 'belhadef.samy@gmail.com'
  and (select count(*) from public.user_trophies where lower(trim(user_email)) = 'belhadef.samy@gmail.com') >= 40;


-- 6. Migration automatique des trophées légitimes existants de Pierre-Alain vers public.user_trophies
insert into public.user_trophies (user_email, badge_id, badge_name, category, unlocked_at)
select 
  s.email as user_email,
  kv.key as badge_id,
  coalesce(s.trophy_custom_names->>kv.key, kv.key) as badge_name,
  'organ' as category,
  now() as unlocked_at
from public.user_stats s,
lateral jsonb_each(s.unlocked_badges) kv
where lower(trim(s.email)) != 'belhadef.samy@gmail.com'
on conflict (user_email, badge_id) do nothing;


-- 7. Rechargement du cache d'API Supabase
notify pgrst, 'reload schema';
