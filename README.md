# PathoTrainer Lab 🧪 (Environnement de Test Local Mac)

Cet espace est **100% autonome et local sur votre Mac**. Il permet de tester et d'enrichir le nouvel outil d'apprentissage actif sans rien impacter en ligne.

---

### 🚀 Comment le tester sur votre Mac ?
Vous pouvez simplement faire un double-clic sur :
`pathotrainer_lab/index.html`
ou l'ouvrir depuis votre terminal :
```bash
open pathotrainer_lab/index.html
```

---

### ✨ Nouvelles Fonctionnalités Implémentées :

1. **Questions à Choix Multiples (QCM) & Choix Unique (QCU) :**
   - Mode QCU classique (boutons radio).
   - Mode QCM (cases à cocher multiples avec validation par bouton "Valider ma sélection" et détection des réponses exactes, manquantes ou fausses).

2. **Classification Hiérarchique & Sous-classification :**
   - Définition d'un **Organe Majeur** (ex: *Tube Digestif*, *Plèvre & Poumon*, *Sein*, *Dermatopathologie*...)
   - Définition d'un **Sous-organe / Catégorie** (ex: *Estomac*, *Plèvre*, *Parenchyme mammaire*...).

3. **Système de Tags Riches (#HES, #IHC, etc.) :**
   - Possibilité de taguer chaque question : `#HES`, `#IHC`, `#GIST`, `#Mésothéliome`, `#PiègeClone`, `#SOX10`...
   - Filtre par tag dans la banque de questions.
   - **Lancement rapide par Tag** depuis la page d'accueil (ex: cliquer sur `#HES` pour ne réviser que les questions avec photos microscopiques HES, ou `#IHC` pour les profils phénotypiques).

4. **Multi-images par Question :**
   - Possibilité d'associer plusieurs coupes / photos à une même question avec légendes personnalisées.
   - Lightbox avec zoom plein écran pour examiner les détails cyto-nucléaires.

5. **Dossiers Progressifs (DP) Clinico-Pathologiques :**
   - Résolution de cas réels pas-à-pas en plusieurs étapes séquentielles.
   - Révélation progressive des données et des clichés (Étape 1 : Panoramique HES $\rightarrow$ Étape 2 : Fort grossissement $\rightarrow$ Étape 3 : Révélation des clichés d'IHC et diagnostic final).
   - Un cas pilote de référence (**Masse sous-muqueuse gastrique**) est déjà pré-chargé et fonctionnel.

6. **Sauvegarde & Portabilité :**
   - Sauvegarde automatique en temps réel dans votre navigateur (`localStorage`).
   - Export / Import JSON pour sauvegarder ou restaurer vos questions et vos cas.
