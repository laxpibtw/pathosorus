# PathoSorus 🦖

Plateforme interactive d'apprentissage actif et d'entraînement en anatomopathologie.

## 🌟 Fonctionnalités Principales

- **Format QCM par défaut** : Choix multiples avec sélection libre et validation immédiate.
- **Classification Hiérarchique à 3 Niveaux** : Organe $\rightarrow$ Catégorie $\rightarrow$ Lésion / Entité spécifique.
- **Système de Tags Personnalisés** : Créez et assignez vos propres tags (`#HES`, `#IHC`, `#E-cadhérine`, etc.).
- **Dossiers Progressifs (DP)** : Résolvez et concevez des cas clinico-pathologiques progressifs étape par étape avec imagerie séquentielle.
- **Répétition Espacée Intelligente** : Choisissez le délai de révision à chaque carte (Demain, Dans 3j, Dans 7j, Dans 30j) avec calcul automatique des cartes échues du jour.
- **Neutralisation des Cartes Maîtrisées** : Mettez de côté les notions totalement acquises pour ne plus saturer vos sessions de révision active.
- **Organisation par Boîtes d'Organe** : Retrouvez vos questions et cas soigneusement rangés par organe avec accordéons repliables.

---

## 👥 Comptes & Rôles (Créateur vs Lecteur)

PathoSorus propose deux niveaux d'accès pour collaborer entre internes :

1. **Compte Créateur 🦖** (Vous & Co-rédacteurs) :
   - Accès illimité à l'entraînement, aux QCM et aux Dossiers Progressifs.
   - Accès à la rédaction : création et modification de questions, de dossiers progressifs et de tags.
   - Accès au panneau **Gestion des Comptes** pour créer et gérer les comptes des collègues.
   - L'administrateur principal est configuré par défaut sur `padoreau85@gmail.com`.

2. **Compte Lecteur 📖** (Co-internes & Étudiants) :
   - Accès complet à l'entraînement, aux séries de répétition espacée du jour et aux DP.
   - Consultation intégrale de la banque de questions (avec mode **Aperçu** des choix, des explications diagnostiques et des pièges).
   - Mode lecture seule sécurisé : impossible de modifier ou supprimer les questions de l'équipe.
   - Progression et calendrier de révision 100% individualisés (chaque interne a son propre rythme).

---

## 💻 Démarrage en Local (Avant Déploiement)

Pour travailler et tester confortablement en local avant de pousser sur Netlify :

1. **Sur Mac (En 1 clic)** :
   Double-cliquez simplement sur le fichier **`Lancer-Local.command`**.
   Le serveur local se lance sur `http://localhost:8080` et ouvre votre navigateur.

2. **En ligne de commande** :
   ```bash
   python3 scripts/dev_server.py
   ```

---

## ☁️ Configuration Supabase & Netlify

### 1. Mise à jour de la Base de Données
Copiez le contenu du fichier [`supabase_schema.sql`](file:///Users/pierre-alaindoreau/Downloads/pathosorus/supabase_schema.sql) et collez-le dans l'onglet **SQL Editor** de votre projet Supabase, puis cliquez sur **Run**.
Ce script crée automatiquement :
- La table `profiles` pour gérer les rôles (Créateur / Lecteur).
- La table `user_progress` pour la répétition espacée individuelle.
- Les fonctions de sécurité et Row Level Security (RLS).

### 2. Variables d'environnement Netlify (Lors du Push)
Dans votre tableau de bord Netlify :
**Site configuration $\rightarrow$ Environment variables** (cocher *All scopes*) :
- `SUPABASE_URL` : `https://tevcifnshxzhkdkrcrph.supabase.co`
- `SUPABASE_ANON_KEY` : votre clé publique anon
- `SUPABASE_SERVICE_ROLE_KEY` : votre clé secrète service_role (permet la création instantanée des comptes collègues sans confirmation email).
