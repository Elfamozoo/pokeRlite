# Spécification de Conception : Usine de Combat (Battle Factory) & Moteur Tactique Gen 3

**Date :** 09/09/2026  
**Statut :** Validé / En attente de revue finale  
**Périmètre :** Zone de Combat (Usine de Combat), Talents Gen 3, Natures, Climat étendu, Objets tenus Gen 3, et Boutique PCo.

---

## 1. Contexte & Vision

La 3e génération (Hoenn / Pokémon Émeraude) est celle qui a posé les fondations du jeu compétitif moderne : l'introduction des **Natures**, des **Talents (Abilities)**, de la **Météo avancée**, et de la légendaire **Zone de Combat (Battle Frontier)**.

L'objectif de ce projet est de doter *Pokémon : La Voie des Maîtres* de ce summum stratégique à travers son mode le plus emblématique, équitable et addictif : **l'Usine de Combat (Battle Factory)**.
Dans ce mode, le joueur n'a pas besoin d'une équipe préexistante ni d'optimisations laborieuses : il démarre sur un pied d'égalité total avec 3 Pokémon de prêt choisis parmi 6, et doit adapter sa composition après chaque combat en échangeant des créatures avec ses adversaires, jusqu'à défier le Savant de l'Usine, **Noland (Samson)**.

---

## 2. Piliers d'Architecture & Règles NOYAU

Comme pour le reste du moteur Pokémon, ce chantier respecte rigoureusement la charte d'architecture du projet :
1. **Zéro dépendance d'exécution externe** : JavaScript pur (ES5 / IIFE universel).
2. **Cloisonnement strict NOYAU / INTERFACE** :
   - Les modules de logique (`js/poke/gen3/*.js`, `usine.js`) sont **purs** : aucun accès au DOM (`window`, `document`), aucun appel non déterministe (`Math.random()`, `Date.now()`).
   - L'interface (`js/poke/ui-usine.js`) ne contient aucune règle métier : elle écoute l'état et orchestre le DOM et l'audio.
3. **Déterminisme absolu & Contrat Mulberry32** :
   - Les tirages de l'Usine (choix des Pokémon de prêt, adversaires, sets) sont dérivés de la graine de session via `h.entier()` / `h.sous(nom)`.
   - Tout combat et toute série peuvent être rejoués à l'octet près par le moteur de replay.
4. **Non-régression 100 % garantie** :
   - Les combats Gen 1 et Gen 2 n'activent ni natures ni talents, préservant 100 % de l'invariance et les 44+ tests existants.

---

## 3. Le Moteur Tactique Gen 3

### 3.1. Les 25 Natures Canoniques (`js/poke/gen3/natures.js`)
Chaque Pokémon en Gen 3 possède une nature déterminant un bonus de $+10\%$ sur une statistique et un malus de $-10\%$ sur une autre (5 natures sont neutres) :
- Les 25 natures canoniques : *Hardi, Docile, Pudique, Bizarre, Timide, Rigide, Modeste, Jovial, Assuré, Calme, Malin, Prudent, Doux, Foufou, Naïf, Pressé, Relax, Discret, Malpoli, Brave, etc.*
- **Calcul des statistiques** (`moteur.js:calculerStats`) :
  ```javascript
  // Si p.nature est définie et possède un modificateur :
  if (p.nature && W.POKE_GEN3_NATURES && W.POKE_GEN3_NATURES[p.nature]) {
    var nat = W.POKE_GEN3_NATURES[p.nature];
    if (nat.plus && s[nat.plus]) s[nat.plus] = Math.floor(s[nat.plus] * 1.1);
    if (nat.moins && s[nat.moins]) s[nat.moins] = Math.floor(s[nat.moins] * 0.9);
  }
  ```
- En Gen 1 et Gen 2, `p.nature` vaut `undefined` : aucun recalcul, résultat bit-à-bit identique à l'existant.

### 3.2. Base de Données des Talents (`js/poke/gen3/talents.js`)
- **Couverture à 100 %** : 100 % des espèces Pokémon (de 1 à 386) reçoivent leur talent canonique officiel dans leurs données (`talent: "INTIMIDATE"` ou `talents: ["INTIMIDATE", "RUN_AWAY"]`).
- Le dictionnaire `W.POKE_GEN3_TALENTS` répertorie tous les talents avec leur nom et description localisée `{ fr, en }`.

### 3.3. Hooks de Combat pour les Talents Actifs (`js/poke/combat.js`)
Le moteur de combat appelle des hooks dédiés, sans coût pour les combats Gen 1 et Gen 2 :
1. **Entrée sur le terrain (`entreeEnCombat`)** :
   - `INTIMIDATE` (Intimidation) : baisse l'Attaque adverse de 1 cran (`statModifiee`).
   - `DRIZZLE` (Crachin) : déclenche la pluie pour 5 tours (ou permanent en Gen 3 canon).
   - `DROUGHT` (Sécheresse) : déclenche le zénith / soleil.
   - `SAND_STREAM` (Sable Volant) : déclenche la tempête de sable.
   - `AIR_LOCK` / `CLOUD_NINE` : neutralise tous les effets climatiques tant que le porteur est actif.
2. **Calcul de Puissance & Dégâts (`calculerDegats`)** :
   - `OVERGROW`, `BLAZE`, `TORRENT`, `SWARM` : $\times 1.5$ de puissance sur les attaques de leur type quand les PV tombent sous $\le 1/3$.
   - `HUGE_POWER` / `PURE_POWER` : double l'Attaque physique effective.
   - `GUTS` (Cran) : $+50\%$ d'Attaque si statut actif (brûlure sans malus d'attaque, poison, para).
3. **Réception d'un coup & Immunités (`immunitesEtAbsorptions`)** :
   - `LEVITATE` (Lévitation) : immunité totale aux coups de type Sol et aux Picots.
   - `WONDER_GUARD` (Garde Mystik) : immunité totale si le coup n'est pas « Super Efficace » (efficacité $> 1$).
   - `VOLT_ABSORB` / `WATER_ABSORB` : annule les dégâts Électrik/Eau et restaure $1/4$ des PV max.
   - `FLASH_FIRE` (Torche) : immunité Feu et booste les attaques Feu du porteur.
4. **Effets de Contact & Statuts (`apresCoup`)** :
   - `STATIC`, `POISON_POINT`, `FLAME_BODY` : $30\%$ de chance d'infliger paralysie, poison ou brûlure à l'attaquant sur coup de contact.
   - `SYNCHRONIZE` : transmet la brûlure, paralysie ou poison reçu à l'adversaire.
   - `IMMUNITY`, `INSOMNIA`, `OWN_TEMPO` : immunités strictes au poison, sommeil et confusion.
5. **Fin de tour (`finDeTour`)** :
   - `SPEED_BOOST` (Turbo) : $+1$ cran de Vitesse à chaque fin de tour.
   - `SHED_SKIN` (Mue) : $1$ chance sur $3$ de guérir spontanément de son statut.
   - `RAIN_DISH` (Cuvette) : soigne $1/16$ des PV sous la pluie.

### 3.4. Climat Gen 3 Étendu
- Ajout de la **Grêle (`grele`)** :
  - Invoquée par l'attaque `HAIL` (ou le talent `SNOW_WARNING`).
  - Dure 5 tours.
  - Inflige $1/16$ des PV max à tous les Pokémon qui ne sont pas de type Glace (`ice`).
- Prise en compte d'`AIR_LOCK` : si Rayquaza (ou Ciel Gris) est sur le terrain, tous les multiplicateurs de dégâts et effets d'usure météo sont neutralisés.

### 3.5. Objets Tenus Gen 3 (`js/poke/gen3/objets-tenus.js`)
Enrichissement du système d'objets tenus (`p.objet`) avec les piliers de compétition Gen 3 :
- `CHOICE_BAND` (Bandeau Choix) : Attaque physique $\times 1.5$, bloque le Pokémon sur sa première attaque choisie.
- `LEFTOVERS` (Restes) : soigne $1/16$ des PV max en fin de tour.
- `WHITE_HERB` (Herbe Blanche) : restaure immédiatement toute baisse de statistique et se consomme.
- `LUM_BERRY` (Baie Prunus) : soigne immédiatement n'importe quelle altération de statut ou confusion et se consomme.
- `SITRUS_BERRY` (Baie Sitrus) : soigne 30 PV (ou 1/4 PV) sous $50\%$ de vie.
- `QUICK_CLAW` (Vive Griffe), `SCOPE_LENS` (Lentille Scope), `FOCUS_BAND` (Bandeau).

---

## 4. L'Usine de Combat (Battle Factory)

### 4.1. Les Sets Canoniques de Pokémon Émeraude (`js/poke/gen3/sets-usine.js`)
Issus directement de la décompilation officielle de Pokémon Émeraude (`pret/pokeemerald: battle_frontier_mons.h`) :
- Une collection structurée de sets compétitifs au niveau 50 couvrant les Pokémon pleinement évolués et compétitifs.
- Chaque entrée définit :
  ```javascript
  {
    espece: 260, // Laggron
    nature: "brave",
    objet: "LEFTOVERS",
    attaques: ["SURF", "EARTHQUAKE", "ICE_BEAM", "PROTECT"],
    repartition: "atk_pv", // orientation des stats
  }
  ```
- Les sets sont organisés par **paliers de difficulté (Tiers 1 à 4)** :
  - **Tier 1 (Séries 1-2, combats 1 à 14)** : Pokémon pré-évolués ou Pokémon de base solides, DVs à 9, statExp légère.
  - **Tier 2 (Séries 3-4, combats 15 à 28)** : Pokémon évolués viables, DVs à 12, statExp ciblée.
  - **Tier 3 (Séries 5-7, combats 29 à 49)** : Pokémon au summum compétitif (Métalosse, Drattak, Ronflex, Staross, Ectoplasma...), DVs parfaits (15), statExp maximale.
  - **Tier 4 (Meneur Noland Or & séries très avancées)** : Pokémon d'élite et légendaires autorisés (Artikodin, Électhor, Sulfura, Suicune, Raikou, Entei, Latios, Latias).

### 4.2. Moteur de l'Usine (`js/poke/gen3/usine.js`)
Ce module NOYAU gère l'état complet d'une session d'Usine :
- **État d'une session (`sessionUsine`)** :
  ```javascript
  {
    graine: 12345678,
    serie: 1,           // Numéro de série (1 à N)
    combat: 1,          // Combat dans la série (1 à 7)
    victoiresTotales: 0,
    echangesFaits: 0,   // Compteur d'échanges effectués
    equipe: [p1, p2, p3],
    adversaire: {
      nom: "Topdresseur Alexis",
      classe: "topdresseur",
      equipe: [adv1, adv2, adv3]
    },
    statut: "choix_initial", // "choix_initial" | "combat" | "echange" | "serie_gagnee" | "defaite"
  }
  ```
- **Fonctions pures du module** :
  - `tirerPretsInitiaux(graine, serie)` : tire 6 Pokémon du bon palier de difficulté sans doublon d'espèce ni d'objet tenu.
  - `tirerAdversaire(graine, serie, combat)` : génère le dresseur adverse et ses 3 Pokémon.
  - `appliquerEchange(session, indexMonJoueur, indexMonAdverse)` : effectue l'échange post-victoire.
  - `soignerEquipe(session)` : restaure PV, PP et statuts de l'équipe entre chaque combat.
  - `calculerGainPCo(serie, vaincuNoland)` : détermine les Points de Combat attribués à la complétion de la série.

### 4.3. Le Boss : Meneur Noland (Samson, Savant de l'Usine)
- **Combat 21 (Fin de la série 3)** :
  - Noland apparaît avec son dialogue officiel d'introduction.
  - Son équipe de 3 Pokémon est tirée de manière transparente parmi le Tier 3/4 avec DVs maximaux.
  - Victoire = Attribution du **Symbole du Savoir (Argent)** + bonus de 15 PCo.
- **Combat 42 (Fin de la série 6)** :
  - Défi suprême pour le **Symbole du Savoir (Or)**.
  - Noland utilise les Pokémon du Tier Légendaire autorisés.
  - Victoire = Attribution du **Symbole du Savoir (Or)** + bonus de 30 PCo.

---

## 5. Interface Utilisateur & Expérience Joueur (`js/poke/ui-usine.js`)

### 5.1. Écrans de l'Usine
1. **Hall d'accueil de l'Usine** :
   - Statistiques du joueur : Record de victoires consécutives, séries terminées, solde de PCo, et affichage des Symboles du Savoir (Argent / Or).
   - Bouton « Commencer un défi » (ou « Reprendre la série »).
   - Bouton d'accès à la « Boutique PCo ».
2. **Draft Initial (Sélection des 3 Pokémon)** :
   - Présentation claire des 6 Pokémon de prêt sous forme de cartes dresseur riches : sprite, nom, niveau 50, types, nature, talent et son effet, objet tenu, et les 4 attaques détaillées.
   - Sélection interactive de 3 créatures avec confirmation.
3. **Transition & Écran de Combat** :
   - Annonce du dresseur adverse (ex: « Combat 4 / 7 — Topdresseur Mathis vous défie ! »).
   - Combat au tour par tour fluide utilisant le moteur standard avec toutes les animations et les nouveaux talents.
4. **Phase d'Échange d'Après-Match (Swap)** :
   - Après une victoire (combats 1 à 6) : un écran présente « Ton équipe » à gauche et « Équipe vaincue » à droite.
   - Le joueur peut cliquer sur « Passer (garder mon équipe) » OU sélectionner un Pokémon à remplacer et sa recrue.
5. **Fin de Série & Victoire / Défaite** :
   - Série de 7 victoires complétée : gain de PCo, célébration, invitation à poursuivre pour la série suivante.
   - Défaite : enregistrement du score si record battu, récapitulatif des PCo gagnés.

### 5.2. Boutique PCo (Points de Combat)
Permet de convertir la gloire de l'Usine en récompenses utilisables dans tout le jeu :
- **Objets de combat rares** : *Restes* (48 PCo), *Bandeau Choix* (64 PCo), *Lentille Scope* (48 PCo), *Vive Griffe* (24 PCo), *Herbe Blanche* (32 PCo).
- **Vitamines d'entraînement** (1 PCo unité) : *Zinc*, *Calcium*, *Protéine*, *Fer*, *Carbos*, *PV Plus*, *Super Bonbon*.
- **Pierres d'évolution** (8 PCo unité) : *Pierre Lune*, *Pierre Soleil*, *Pierre Eau*, etc.

### 5.3. Intégration sur l'Écran d'Accueil
- Un bouton stylisé **« Zone de Combat »** est ajouté sur l'écran d'accueil du jeu (`index.html`), menant directement au Hall de l'Usine.

---

## 6. Plan de Test & Vérification

### 6.1. Tests Unitaires & Invariants Déterministes
- `tests/test_gen3_natures.mjs` : vérifie les 25 natures, l'exactitude des multiplicateurs $(+10\% / -10\%)$ et l'invariance sur Gen 1/Gen 2.
- `tests/test_gen3_talents.mjs` : teste exhaustivement l'activation de tous les talents clés en combat (Intimidation, Lévitation, Garde Mystik, Engrais/Brasier/Torrent, Crachin, Sécheresse, Air Lock, contact et fin de tour).
- `tests/test_gen3_usine.mjs` : teste le tirage sans doublon des 6 prêts, la progression des 7 combats, les échanges post-victoire, l'apparition de Noland au combat 21 et 42, le calcul des PCo, et la reproductibilité PRNG.

### 6.2. Non-Régression Globale
- Exécution de `tests/run_all_tests.mjs` : validation à 100 % de l'ensemble des suites de tests (architecture, determinisme PRNG, simulation de combat Gen 1, Gen 2, Gen 3).
