# Spécification de Conception : Refonte Complète de la Direction Artistique (DA) & Écran de Combat Style Pokémon Showdown

**Date :** 11 septembre 2026  
**Statut :** Validé / En cours de planification  
**Portée :** Globale (Toutes Générations 1-3, Moteur de Combat, Usine de Combat, Accueil, Carte, Sac, Coffre & Pokédex)  
**Auteur :** Antigravity & Ingénierie Pair-Programming  

---

## 1. Contexte & Problématique

### 1.1 Le Constat Utilisateur
L'interface visuelle du jeu présentait deux défauts majeurs :
1. **Éblouissement et illisibilité (blanc sur blanc)** : Des conflits de variables CSS (`--sur-fond: #ffffff` combiné à `--texte` défini comme une police de caractères) rendaient les cartes de l'Usine et les fiches de combat toutes blanches avec des écritures blanches invisibles.
2. **Écran de combat désuet et trop primaire** : L'écran de combat était contraint dans un cadre étriqué 160×144 pixels calqué sur le Game Boy de 1996, avec une boîte de dialogue en dessous bloquant une phrase à la fois, une arène blanche agressive et des boutons d'attaque sans informations tactiques riches.

### 1.2 La Vision Cible : Pokémon Showdown
L'objectif est d'unifier l'ensemble du jeu autour d'une Direction Artistique moderne, sombre, contrastée et compétitive, inspirée directement du simulateur de référence **Pokémon Showdown** :
- **Dark Slate Theme unifié** : surfaces sombres profondes (`#080c14`, `#0f172a`, `#1e293b`), typographies blanches nettes (`#f8fafc`), zéro fond blanc aveuglant.
- **Arène de combat Showdown** : champ de bataille large avec perspective, socles de terrain pour les deux combattants, barres de santé flottantes dynamiques (vert/jaune/rouge) avec pourcentages et PV réels, et journal de combat en temps réel (Live Battle Log).
- **Grille de capacités 2×2 Showdown** : boutons stylisés teintés de la couleur franche de leur type élémentaire (Feu, Eau, Électrik, etc.), affichant Nom, Puissance, Précision et PP en un coup d'œil.
- **Harmonisation complète** : la même DA Showdown moderne est appliquée à l'ensemble du site (Accueil, Carte d'aventure, Usine de Combat, Sac, Coffre d'accueil, Pokédex).

---

## 2. Architecture des Composants & Modules

```
rtl-pokemon/
├── css/
│   └── poke.css              # Design Tokens Showdown, Arène, Cartes, Grille 2×2, Log latéral, Thème sombre
├── js/poke/
│   ├── ui-combat.js          # Moteur d'affichage Showdown : Arène large, Healthboxes flottantes, Grille 2×2, Log
│   ├── ui-usine.js           # Usine de Combat : Teambuilder Draft 6 cartes, Swap 2 colonnes, Boutique PCo
│   ├── ui.js                 # Lobby Accueil, Carte tactique sombre, Sac par onglets, Coffre & Pokédex
│   └── icones.js             # Mappage sprites couleur haute visibilité sur toutes les générations
└── tests/
    ├── test_showdown_combat_ui.mjs  # Suite de tests dédiée pour l'écran de combat Showdown
    ├── test_gen3_usine_ui.mjs       # Suite de tests pour l'Usine de Combat modernisée
    └── run_all_tests.mjs            # Suite maîtresse de régression (55+ tests)
```

---

## 3. Spécification Détaillée par Couche

### Couche 1 : Design Tokens & Charte Graphique (`css/poke.css`)

1. **Surfaces & Conteneurs (Dark Slate)** :
   - `--fond` : `#080c14` (nuit profonde ardoise).
   - `--surface-base` : `#0f172a` (fond des sections, cadre d'arène, panneaux de navigation).
   - `--surface-carte` : `#1e293b` (cartes de Pokémon, panneaux d'objets, boîtes de dialogue).
   - `--surface-survol` : `#334155` (états actifs, focus, survol interactif).
   - `--bordure-douce` : `rgba(255, 255, 255, 0.08)`.
   - `--bordure-nette` : `#334155`.
   - `--bordure-focus` : `#38bdf8` (lueur cyan d'accessibilité et de sélection active).

2. **Typographie & Ratios de Contraste** :
   - `--texte-principal` : `#f8fafc` (blanc neige haute netteté, contraste > 10:1 sur `--surface-carte`).
   - `--texte-secondaire` : `#94a3b8` (ardoise doux pour talents, métadonnées, sous-titres).
   - `--texte-discret` : `#64748b` (PP totaux, mentions secondaires).
   - Élimination formelle de tout texte clair sur fond blanc et de tout fond `#ffffff` brut.

3. **Palette Officielle des 18 Types Showdown** :
   - `NORMAL` : `#9099a1` | `FEU` : `#ff9c54` | `EAU` : `#4f90d5` | `PLANTE` : `#63bb5b`
   - `ELECTRIK` : `#f3d23b` | `GLACE` : `#74cec0` | `COMBAT` : `#ce4069` | `POISON` : `#ab6ac8`
   - `SOL` : `#d97746` | `VOL` : `#8fa8dd` | `PSY` : `#f97176` | `INSECTE` : `#90c12c`
   - `ROCHE` : `#c7b78b` | `SPECTRE` : `#5269ac` | `DRAGON` : `#096dc4` | `ACIER` : `#5a8fa3`
   - `TENEBRES` : `#5a5366` | `FEE` : `#ec8fe6`

4. **Jauges de Santé Dynamiques Showdown** :
   - $> 50\%$ PV : gradient vert `#22c55e` vers `#16a34a`.
   - $20\% \text{ à } 50\%$ PV : gradient jaune ambre `#eab308` vers `#ca8a04`.
   - $< 20\%$ PV : gradient rouge alerte `#ef4444` vers `#dc2626`.

---

### Couche 2 : Moteur & Écran de Combat Showdown (`js/poke/ui-combat.js`)

1. **Gabarit Général (Layout Responsive)** :
   - Conteneur `.pk-showdown-combat` fluide (largeur max 1100 px, centré).
   - **Mode Bureau ($\ge 768\text{ px}$)** : 
     - Colonne gauche (70 %) : Champ de bataille Showdown + Pupitre d'actions (grille 2×2).
     - Colonne droite (30 %) : Journal de combat en direct (*Live Battle Log*) défilant avec horodatage des tours.
   - **Mode Mobile ($< 768\text{ px}$)** :
     - Champ de bataille en haut, pupitre de commande au centre, et tiroir / onglet glissant pour le journal en bas.

2. **Champ de Bataille & Socles** :
   - Fond de stade stylisé sombre avec perspective en profondeur.
   - Socle adverse (haut-droite) : ellipse lumineuse avec ombre portée douce, accueillant le sprite couleur de face.
   - Socle joueur (bas-gauche) : ellipse lumineuse au sol avec le sprite couleur de dos.

3. **Fiches Flottantes de Statut (Showdown Healthboxes)** :
   - **Fiche Adverse** (haut-gauche) : Nom du Pokémon, Genre, Niveau (`Nv. 50`), Badges de statut néon (`BRN`, `PAR`, `PSN`, etc.), barre de PV animée fluide Showdown et pourcentage restant (`100 %`).
   - **Fiche Joueur** (bas-droite) : Nom, Genre, Niveau, Badges de statut, barre de PV Showdown et affichage précis des PV (`142 / 150 PV`) avec pourcentage.

4. **Pupitre d'Attaque (Grille 2×2)** :
   - 4 boutons de capacités en grille 2×2 :
     - Fond teinté du type de l'attaque avec liseré contrasté.
     - Ligne haute : Nom de l'attaque en gras + pastille de catégorie (Physique / Spéciale / Statut).
     - Ligne basse : Type en clair + Puissance (`Pui 90`) + Précision (`Préc 100%`) + PP restants (`PP 15/15`).
     - Boutons désactivés/grisés avec raison explicite si PP à 0 ou entrave active.
   - Barre tactique :
     - `[ ÉQUIPE / SWITCH ]` : ouvre le banc avec les PV de chaque équipier pour remplacement immédiat.
     - `[ ABANDONNER ]` : déclaration de forfait confirmée.
     - `[ SAC ]` : disponible en aventure classique, masqué automatiquement en Zone de Combat / Usine.

5. **Journal de Combat en Direct (Live Battle Log)** :
   - Défilement automatique au bas de chaque tour.
   - Séparateurs visuels `--- Tour X ---`.
   - Badges colorés : `[Critique]`, `[Super efficace]`, `[Talent] Intimidation`.
   - Sous-titre dynamique semi-transparent au centre de l'arène pendant les coups pour ne rien manquer.

---

### Couche 3 : Zone de Combat & Usine Moderne (`js/poke/ui-usine.js`)

1. **Hall de l'Usine** :
   - Carte de présentation du Savant Samson (Noland).
   - Tableau de bord 4 métriques : Record consécutif, Solde PCo, Symbole Argent, Symbole Or.
   - Rappel élégant des règles du tournoi (Niveau 50 Ouvert).

2. **Écran de Draft Initial (Style Teambuilder Showdown)** :
   - 6 grandes cartes de prêt Showdown :
     - Grand sprite / artwork centré.
     - Nom, Niveau 50, pastilles de types.
     - Nature avec modificateurs statistiques explicites (ex: `Rigide (+Att, -AtkSp)`).
     - Talent avec description complète de l'effet.
     - Objet tenu avec son utilité compétitive.
     - 4 capacités avec type, puissance et précision.
   - Compteur `X / 3 sélectionnés` avec liseré cyan sur les Pokémon choisis.
   - Bouton `[Confirmer l'équipe (3/3)]` actif uniquement à 3/3.

3. **Écran d'Échange d'Après-Match (Swap à 2 Colonnes)** :
   - Colonne gauche : « Votre équipe » (3 cartes).
   - Colonne droite : « Équipe adverse » (3 cartes du vaincu).
   - Clic de sélection croisée intuitif avec prévisualisation des statistiques.
   - Boutons `[Échanger]` et `[Garder l'équipe et continuer]`.

4. **Boutique PCo Moderne** :
   - Onglets de filtrage par catégorie (Combat, Renforts, Baies, Vitamines, Pierres).
   - Cartes d'objets avec icônes, prix en PCo, description stratégique et badge `⚡ En réserve : X utilisations` relié au Coffre.

---

### Couche 4 : Écrans Centraux (`js/poke/ui.js`)

1. **Accueil (Lobby Compétitif)** :
   - Thème Dark Slate avec en-tête moderne, résumé du profil dresseur et cartes de navigation vers les modes de jeu (Aventure, Défi du jour, Zone de Combat, Coffre).
2. **Carte d'Aventure (Roadmap Tactique)** :
   - Nœuds sombres éclairés par statut (visité, actif, futur), chemins lumineux, et identification immédiate des paliers (Combat, Boutique, Repos, Boss).
3. **Sac & Coffre d'Accueil** :
   - Navigation par onglets (Soins, Balls, Objets Tenus, Vitamines, Pierres).
   - Cartes d'articles avec action directe d'équipement sur les créatures de l'équipe.
4. **Pokédex** :
   - Fiches d'espèces avec grand artwork Ken Sugimori, jauges de statistiques de base, liste des capacités apprenables et talents.

---

## 4. Stratégie de Découpage en Sous-Agents (Subagent-Driven Development)

Pour exécuter cette refonte rapidement et sans régression, le travail est orchestré en tâches indépendantes et étanches :

1. **Task 1 (Design Tokens & CSS Base)** : Refonte de [css/poke.css](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/css/poke.css) avec la palette Showdown, les types, les variables de surface sombre, et la suppression définitive des conflits blancs.
2. **Task 2 (Moteur de Combat Showdown)** : Refonte de [js/poke/ui-combat.js](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/ui-combat.js) (arène large, socles, healthboxes flottantes, grille 2×2, journal latéral et adaptabilité mobile).
3. **Task 3 (Usine de Combat Teambuilder & Swap)** : Modernisation de [js/poke/ui-usine.js](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/ui-usine.js) avec les cartes Teambuilder riches, le swap 2 colonnes et la boutique PCo.
4. **Task 4 (Écrans Centraux Accueil, Carte, Sac & Coffre)** : Harmonisation de [js/poke/ui.js](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/ui.js) vers la DA Showdown sombre.
5. **Task 5 (Suite de Tests & Validation Globale)** : Tests unitaires et d'intégration DOM validant le nouveau gabarit Showdown, non-régression à 100 % sur `run_all_tests.mjs`.

---

## 5. Critères de Réussite & Validation

1. **Contraste & Lisibilité** : Aucun texte clair sur fond clair ni texte sombre sur fond sombre. Contraste minimal $\ge 4.5:1$ (WCAG AA) et $\ge 7:1$ (WCAG AAA) sur tous les textes principaux.
2. **Parité Showdown** : L'écran de combat présente une arène en perspective avec socles, fiches de statut flottantes animées, grille 2×2 colorée par type et journal de combat dédié en direct.
3. **Multi-Génération** : Le nouveau moteur de combat Showdown fonctionne de manière identique et fluide sur Gen 1, Gen 2, Gen 3 et Zone de Combat.
4. **Intégrité NOYAU** : Zéro modification de la logique métier sous-jacente (`PokeCombat`, `PokeMoteur`, `Mulberry32`, `PokeUsine`). Les calculs de dégâts, de hasard et de rejeu restent déterministes à 100 %.
5. **Tests Automatisés** : 100 % de réussite sur `tests/run_all_tests.mjs` (55+ tests) et sur toutes les suites unitaires.
