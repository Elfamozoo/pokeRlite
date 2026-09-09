# Road to Legends — Mode Pokémon : README COMPLET (A → Z)

> Documentation technique intégrale du mode Pokémon de **roadtolegends.com/pokemon**, établie à partir du miroir local (version `v=773`, scrapée le 25/08/2026).
> But : permettre une **réécriture complète du jeu** (vibe-coding, autre stack, autre langage) sans relire les 68 fichiers JS d'origine.
> Les analyses exhaustives qui ont nourri ce document sont conservées dans le dossier :
> - `NOTES-MOTEUR-COMBAT.md` — moteur, combat, types, effets gen2, objets tenus (720 lignes)
> - `NOTES-MONDE-VOYAGE.md` — monde, itinéraires, arènes, dresseurs, carte (489 lignes)
> - `docs/notes-techniques-meta.md` — butin, serments, sceaux, chasses, compte, rejeu, duels (552 lignes)

---

## SOMMAIRE

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture & chargement](#2-architecture--chargement)
3. [Le contrat du hasard (rejeu serveur)](#3-le-contrat-du-hasard)
4. [Les données (schémas exacts)](#4-les-données)
5. [Créatures : stats, DV, expérience, évolutions](#5-créatures)
6. [Le combat (tour par tour gen1/gen2)](#6-le-combat)
7. [La capture](#7-la-capture)
8. [Types et efficacités](#8-types-et-efficacités)
9. [L'éclat (chromatique) et les grades de DV](#9-léclat)
10. [Le monde : Kanto et Johto](#10-le-monde)
11. [Arènes, Conseil 4, rival, dresseurs](#11-arènes-conseil-4-rival-dresseurs)
12. [La carte à embranchements (roguelite)](#12-la-carte-à-embranchements)
13. [Le butin](#13-le-butin)
14. [Serments, sceaux, acquis, règle du jour](#14-serments-sceaux-acquis-règle-du-jour)
15. [Les chasses](#15-les-chasses)
16. [Obtenir des Pokémon](#16-obtenir-des-pokémon)
17. [La partie (objet, score, bilan)](#17-la-partie)
18. [La progression de compte](#18-la-progression-de-compte)
19. [La fusion nuage/local](#19-la-fusion-nuagelocal)
20. [Le rejeu serveur, le classement, les duels](#20-rejeu-classement-duels)
21. [L'écran de fin et la carte de partage](#21-écran-de-fin-et-carte-de-partage)
22. [Le son (puce Game Boy)](#22-le-son)
23. [Les animations de combat](#23-les-animations-de-combat)
24. [L'interface](#24-linterface)
25. [PWA, hors-ligne, versions](#25-pwa-hors-ligne-versions)
26. [Outillage & contrôles de livraison](#26-outillage--contrôles)
27. [Écarts au canon (déclarés)](#27-écarts-au-canon)
28. [Pièges à préserver lors de la réécriture](#28-pièges-à-préserver)
29. [Arborescence des fichiers](#29-arborescence)

---

## 1. Vue d'ensemble

Un fan game Pokémon en **deux générations** : Kanto (151 espèces, moteur Rouge/Bleu 1996) et Johto (251 espèces, moteur Or/Argent/Cristal 1999). Interface 100 % web (HTML/CSS/JS vanilla, aucun framework), données **générées** depuis des sources publiques (`pret/pokered`, `pret/pokecrystal` — désassemblages des ROMs, PokéAPI, Poképédia).

**C'est un roguelite** : chaque « voyage » est une carrière procédurale — carte de nœuds, combats, butin, serments, badges — avec une progression de compte permanente (Pokédex, PC, déblocages, compagnon).

**Le principe fondateur** : chaque partie du **Défi du jour** est **rejouée par le serveur** à partir du journal des choix du joueur pour valider son score. Conséquences absolues :

1. **Tout le hasard** vient d'une graine déterministe (mulberry32). Aucun `Math.random()` / `Date.now()` / `new Date()` ailleurs dans `js/poke/` (l'outil `tools/poke-rng.mjs` fait échouer la livraison s'il en trouve un).
2. **Le nombre et l'ordre des tirages font partie du contrat.** Retirer/ajouter un tirage décale tout le rejeu → `score_mismatch` → score refusé (≈ 25 % des défis refusés sur les autres modes du site avant cette discipline).
3. Le **noyau du jeu** est un ensemble de fichiers **purs** (aucun DOM, aucun texte, aucun stockage, aucun réseau) qui tourne à l'identique navigateur/Node (le serveur l'utilise pour rejouer).

**Boucle de jeu** : on tire un monde (graine du jour au Défi — identique pour tous — ou graine libre) → on avance sur une carte de nœuds (herbes, dresseurs, objets, centres, boutiques, pêche, arbres, scènes du canon) → après chaque **victoire**, 3 cartes de butin, on en choisit 1 → à chaque badge, **un serment** (contrainte + force) → au fil des voyages, **acquis** (gains permanents choisis), **chasses** (objectifs qui ouvrent des serments), **sceaux** (difficulté cumulative post-Ligue) → en fin de voyage : bilan, palmarès, carte de partage.

**Modes** : Voyage (libre), **Défi du jour** (même graine pour tous, un seul essai, classement), Express (voyage court), Nuzlocke (mortalité), Duel (PvP asynchrone), Défis de Kanto (PvE scellés).

---

## 2. Architecture & chargement

### 2.1 La page (`/pokemon` → `index.html`)

Page minimale : `<div id="poke-racine">`, `<link rel="stylesheet" href="css/poke.css?v=773">`, **un seul script** : `js/poke/gate.js?v=773`. Les scripts du jeu **ne sont pas dans la page** — ils sont injectés par le verrou (c'est ce qui a longtemps empêché de lire le mode fermé dans l'onglet réseau). Commentaires de la page : le mode a été livré « fermé », puis **ouvert en discret le 16/08/2026 sur ordre explicite du propriétaire** (`OUVERT = true`), et reste volontairement `noindex` (introuvable par les moteurs).

### 2.2 Le verrou (`gate.js`)

- `OUVERT` (booléen) + `CLE = "poke-4c1e7b"` : accès par `OUVERT`, ou `?cle=...` (mémorisé en localStorage puis retiré de l'URL via `history.replaceState`), sinon **écran d'attente** (un Pokédex fermé : « En cours de développement... »).
- `injecter()` : charge `js/poke/ordre.js?v=<version>`, lit `W.POKE_ORDRE`, charge les fichiers **en séquence** (script par script — l'ordre est l'API, une seule source lue aussi par le harnais de simulation et le serveur).
- Pose le **service worker** du site (`/service-worker.js`) même mode fermé (hors-ligne/installabilité) — jamais en contexte non sécurisé.
- **Veille de version** (`PokeVeille`) : sonde la page toutes les 10 min et au retour sur l'onglet ; compare `versionServie` vs `versionChargee` ; pose un bandeau « Une nouvelle version est sortie » ; **force le rechargement UNIQUEMENT** depuis `momentSur()` — appelé par le jeu quand il vient de sceller son état (jamais pendant un combat), une seule tentative par version (sessionStorage).
- `PokeDemarrer` : drapeau `RTL_DEMARRAGE_IMMEDIAT = true` posé avant injection (piège payé : `DOMContentLoaded` est déjà passé quand le verrou injecte).

### 2.3 L'ordre de chargement (`ordre.js`) — le graphe de dépendances

Quatre listes, une seule source (`W.POKE_ORDRE_*`) :

| Liste | Rôle | Fichiers |
|---|---|---|
| `NOYAU` (31) | Tout ce que le serveur rejoue. Pur : aucun texte, aucun DOM. | rng, genre, types, regles, attaques, especes, monde, dresseurs, classes, obtentions, ct, moteur, combat, capture, voyage, actes, carte-actes, eclat, fusion, partie, depart, obtenir, butin, regle-du-jour, acquis, serments, chasses, sceaux, scenario, duel, rejeu |
| `ECRANS` (16) | L'interface (jamais rejouée). | tempo, icones, sons, audio, animations, anim-attaque, progression, dits-objets, mesure-arene, ui-combat, pokedex-ui, infobulles, carte-partage, classement, fin, ui |
| `GEN2` (17) | Johto, **injecté dans le NOYAU avant `regles.js`** si Johto est ouvert (`JOHTO = "ouvert"`). | gen2/types, effets, effets-neufs, objets-tenus, obtentions, attaques, especes, dresseurs, rival, equipes, classes, monde, voyage, scenes, concours, sons, sons-attaques |
| `GEN2_ECRANS` (2) | Injectés dans ECRANS avant `anim-attaque.js`. | gen2/animations, gen2/anim-attaque |

`POKE_JOHTO_ETAT` ∈ `"ferme" | "banc" | "ouvert"` (actuellement `"ouvert"`). `POKE_BANC_JOHTO` : en mode `"banc"`, Johto ne se charge que sur localhost (banc d'essai).

Ordre du NOYAU (logique) : *monde avant moteur, moteur avant interface* — charger un corpus avant les données qui le déclarent l'efface.

### 2.4 Organisation du code

- **Fichiers générés** (« FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN », produits par `node tools/poke-*.mjs` depuis les désassemblées/REST) : `especes.js`, `attaques.js`, `monde.js`, `dresseurs.js`, `classes.js`, `obtentions.js`, `ct.js`, `sons.js`, `animations.js`, `gen2/*` de données. Toute correction se fait dans le **générateur**, jamais dans le fichier.
- **Fichiers écrits à la main** : moteur (`moteur.js`, `combat.js`, `capture.js`, `voyage.js`…), interface (`ui.js`, `ui-combat.js`…), systèmes méta (`butin.js`, `serments.js`, `sceaux.js`, `acquis.js`, `chasses.js`, `fusion.js`, `progression.js`…).
- Tous sont des IIFE `(function (W) { ... })(typeof window !== "undefined" ? window : globalThis)` : les objets globaux `W.POKE_*` (données) et `W.Poke*` (modules) sont le contrat entre fichiers.

### 2.5 Les objets globaux (l'API du jeu)

**Données** : `POKE_ESPECES`/`POKE_ESPECE`, `POKE_ATTAQUES`/`POKE_ATTAQUE_PAR_CLE`, `POKE_TYPES`, `POKE_TYPE_TABLE`, `POKE_TYPE_NOMS`, `POKE_TYPE_ECARTS`, `POKE_TYPES_SPECIAUX`, `POKE_LIEUX`, `POKE_ZONES`, `POKE_PECHE`, `POKE_POIDS_CRENEAUX`, `POKE_ARENES`, `POKE_CONSEIL`, `POKE_EQUIPES`, `POKE_RIVAL`, `POKE_CLASSES`, `POKE_CLASSES_ROM`, `POKE_CT`, `POKE_CS`, `POKE_CT_PAR_CLE`, `POKE_OBJETS`, `POKE_MARTS`, `POKE_FOSSILES`, `POKE_AMBRE`, `POKE_CADEAUX`, `POKE_CASINO`, `POKE_DOJO`, `POKE_ECHANGES`, `POKE_SONS`, `POKE_ANIM`, `POKE_SCENARIO`, `POKE_RONFLEX`, `POKE_GENRE`, `POKE_GRAINE`, `POKE_LANG`, `POKE_TRANSITION`, + `POKE_GEN2_*` (mêmes familles, préfixées pour ne jamais écraser la gen1).

**Modules** : `PokeHasard`, `PokeChoix`, `pokeGraineDe`, `pokeAvantLe`, `PokeRegles` (registre par monde), `PokeMoteur`, `PokeCombat`, `PokeCapture`, `PokeVoyage`, `PokeActes`, `PokeCarteActes`, `PokeButin`, `PokeSerments`, `PokeSceaux`, `PokeAcquis`, `PokeChasses`, `PokeRegleDuJour`, `PokeFusion`, `PokePartie`, `PokeObtenir`, `PokeProgression`, `PokeDepart`, `PokeRejeu`, `PokeClassement`, `PokeDuel`, `PokeFin`, `PokeCarte`, `PokePokedex`, `PokeInfobulles`, `PokeIcones`, `PokeSprites`, `PokeType`, `PokeUI`, `PokeUICombat`, `PokeSon`, `PokeTempo`, `PokeGenre`, `PokeEclat`, `PokeMesure`, `PokeVeille`, `PokeDemarrer`, `PokeDits`.

### 2.6 Le registre `PokeRegles` (la couture gen1/gen2)

Le moteur ne sait **jamais** sous quelle génération il tourne : il demande tout au registre (`regles.js`). Portes : `table()`, `speciaux()`, `especes()`, `especesListe()`, `attaques()`, `attaquesListe()`, `dexTotal`, `arenes()`, `etapes()`, `clesVoyage()`, `badgePourCS()`, `badgesStat`, `sons()`, `peche()`, `zones()`, `lieux()`, `versions()`, `canon`, `professeur`, `visages`, `maitre()`, `equipes()`, `classesDresseur()`, `rival()`, `dresseurFinal()`, `tenus()`, `objetsTable()`, `effetsNeufs()`, `errants()`, `mythique()`, `conseil()`, `echanges()`, `casino()`, `cadeaux()`, `fossiles()`, `dojo()`, `ambre()`, `statiques()`, `concours()`, `arbres()`, `oeufs()`, `speAtk()`, `speDef()`, `sexeDe(p)`, `especeToute(n)`, `stats()`, `nomVersion()`…

- **gen1** : `speAtk()="spe"`, `speDef()="spe"` (une seule Spéciale) ; `tenus()=null` ; `badgesStat {1:"atk", 3:"vit", 5:"def", 7:"spe"}` ; `canon [1,4,7]` (Bulbizarre/Salamèche/Carapuce) ; professeur Chen ; `maitre()=null` (le dernier combat est le **rival**) ; `mythique()={n:151, niveau:7, lieu:null}` (Mew) ; `versions ["rouge","bleu"]`.
- **gen2** : `speAtk()="sat"`, `speDef()="sdf"` (Spéciales séparées) ; `tenus()=POKE_GEN2_TENUS` ; `effetsNeufs()=POKE_GEN2_EFFETS_NEUFS_TABLE` ; `badgesStat {1:"atk", 3:"vit", 6:"def", 7:"spe"}` ; `canon [152,155,158]` ; professeur Orme ; `maitre()=POKE_GEN2_MAITRE` (Peter) ; `mythique()={n:251, niveau:30, lieu:"ilex-forest"}` (Célébi) ; `versions ["cristal"]` ; **ce que Johto n'a pas, il ne l'a pas** (`fossiles`, `dojo`, `ambre` → null).

---

## 3. Le contrat du hasard

### 3.1 Le générateur (`rng.js`)

**mulberry32**, identique au bit près navigateur/Node. Graine depuis une chaîne :

```js
function graineDe(texte) {          // hash type FNV 32 bits
  var h = 1779033703 ^ texte.length;
  for (var i = 0; i < texte.length; i++) {
    h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
```

`Hasard(graine)` porte `etat`, **`tirages` (compteur — permet de situer une divergence de rejeu à un tirage près)**, `source`. Méthodes :

| Méthode | Comportement | Tirages |
|---|---|---|
| `brut()` | flottant [0,1[ — `etat=(etat+0x6d2b79f5)>>>0; t=imul(t^(t>>>15),t\|1); t^=t+imul(t^(t>>>7),t\|61); return ((t^(t>>>14))>>>0)/4294967296` | 1 |
| `entier(n)` | entier [0, n[ | 1 (quelle que soit n) |
| `entre(a,b)` | entier [a, b] | 1 |
| `chance(p)` | `brut()*100 < p` | 1 |
| `pondere(liste, champ="poids")` | tirage pondéré — **exactement 1 tirage quelle que soit la liste** | 1 |
| `dans(liste)` | élément au hasard | 1 |
| `melange(liste)` | Fisher-Yates | n−1 |
| `derive(etiquette)` | **sous-générateur** `graineDe(source+"|"+etiquette)` — ne déplace pas le parent (aléa d'affichage, duels) | 0 (sur le parent) |

### 3.2 Le choix combinatoire (`PokeChoix`)

Un choix « k parmi n » (3 cartes de butin, 3 serments, 3 CT, 3 acquis) consomme **exactement 1 tirage** : on tire un **rang** parmi tous les sous-ensembles possibles (`combien(n,k) = C(n,k)`), puis on le **déplie** par dérangement lexicographique (`deRang`) **sans toucher au hasard**. Le dépliage doit être une **bijection**, sinon certaines offres ne sortiraient jamais et d'autres deux fois plus souvent.

### 3.3 Les verrous datés

`avantLe(dateGraine, borne)` = `String(dateGraine) <= String(borne)`. Quand une règle change le tirage, les parties déjà commencées continuent de rejouer l'ANCIENNE règle. **La borne est strictement antérieure au premier jour public** (leçon : une borne posée le jour même de l'ouverture a éteint une mécanique entière le premier jour).

### 3.4 Les règles apprises (les plus chères)

- Le mélange de serments se fait sur le pool **plein**, puis on filtre (filtrer avant changerait le nombre de tirages).
- La règle du jour se dérive de la **date seule** (zéro tirage).
- La version du jour se tire **en premier** (`h.brut() < 0.5` sur `"POKE-JOUR-"+date`) — le serveur la retrouve d'un seul tirage.
- Les tirages « inutiles » (ex. traces de Mew) sont **inconditionnels** : on tire toujours, on ne retient que si la condition est remplie.
- La chance de capture affichée est **analytique** (zéro tirage).

---

## 4. Les données

### 4.1 Espèces gen1 (`especes.js` → `POKE_ESPECES`, indexé `POKE_ESPECE` par n **et** par clé)

```json
{ "n": 1, "cle": "BULBASAUR", "nom": {"fr": "Bulbizarre", "en": "Bulbasaur"},
  "genre": {"fr": "Pokémon Graine", "en": "Seed Pokémon"},
  "types": ["grass", "poison"],
  "base": {"pv": 45, "atk": 49, "def": 49, "vit": 45, "spe": 65},
  "capture": 45, "exp": 64, "croissance": "moyenne_lente",
  "taille": 7, "poids": 69, "dex": {"fr": "...", "en": "..."},
  "depart": ["TACKLE", "GROWL"],
  "apprend": [[7, "LEECH_SEED"], [13, "VINE_WHIP"], ...],
  "ct": ["SWORDS_DANCE", "TOXIC", ...],
  "evolue": [{"par": "niveau", "niveau": 16, "vers": 2}] }
```

- `base` : **5 stats** (Spécial unique gen1). `capture` : taux 0-255, ne s'arrondit jamais. `croissance` : `rapide|moyenne|moyenne_lente|lente`. `taille` en décimètres, `poids` en hectogrammes. `apprend` : paires `[niveau, clé]` croissantes. `evolue` : `{par: "niveau"|"pierre"|"echange", niveau?, objet?, vers}`.

### 4.2 Espèces gen2 (`gen2/especes.js` → `POKE_GEN2_ESPECES`)

Même schéma, avec :
- `base` : **6 stats** `{pv, atk, def, vit, sat, sdf}` (Spécial séparé) ;
- **`objets`** : paire `[commun, rare]` d'objets tenus (61 espèces concernées) ;
- **`sexe`** : `GENDER_F12_5 | F25 | F50 | F75 | F100 | F0 | UNKNOWN` ;
- `evolue` peut porter `par:"bonheur"` (seuil `BONHEUR_SEUIL = 1500` = somme des statExp ; pas d'horloge — l'écran choisit) et `par:"stat"` + `compare` (Debugant : `atk<def|atk>def|atk=def`).

Compléments : `POKE_GEN2_A_MODELISER = {bonheur: [8 espèces], stat: [TYROGUE×3]}` ; `POKE_GEN2_DEX_FR_REPLIE` (251 notices FR reprises d'une génération postérieure).

### 4.3 Attaques gen1 (`attaques.js` → `POKE_ATTAQUES`, 165 entrées)

```json
{ "id": 1, "cle": "POUND", "nom": {"fr": "Écras'Face", "en": "Pound"},
  "type": "normal", "categorie": "physique",
  "puissance": 40, "precision": 100, "pp": 35,
  "effet": "NO_ADDITIONAL_EFFECT",
  "texte": {"fr": "...", "en": "..."} }
```

`categorie` est redondante avec le type en gen1 (affichage). `effet` : 68 constantes du ROM (`BURN_SIDE_EFFECT1`, `TWO_TO_FIVE_ATTACKS_EFFECT`, `EXPLODE_EFFECT`…).

### 4.4 Attaques gen2 (`gen2/attaques.js` → `POKE_GEN2_ATTAQUES`)

```json
{ "id": 7, "cle": "FIRE_PUNCH", "nom": {"fr": "Poing Feu", "en": "Fire Punch"},
  "type": "fire", "puissance": 75, "precision": 100, "pp": 15,
  "effet": "EFFECT_BURN_HIT", "chance": 10,
  "dit": {"fr": "...", "en": "..."} }
```

Pas de `categorie` (toujours par type) ; `chance` = effet secondaire **sur 255** (comme le ROM) ; effets = 135 constantes `EFFECT_*` de Crystal ; `texte` s'appelle `dit`.

### 4.5 CT/CS (`ct.js`)

- `POKE_CT` : les **50 CT** de gen1 `{n, cle, prix, type}` — CT07 HORN_DRILL, CT15 HYPER_BEAM, CT26 EARTHQUAKE, CT29 PSYCHIC_M, CT35 METRONOME… (liste complète dans `docs/notes-techniques-meta.md` §5.1).
- `POKE_CS` : 5 CS `CUT, FLY, SURF, STRENGTH, FLASH` — pas de prix, « on les mérite », elles ouvrent des chemins.
- gen2 : `POKE_GEN2_CT` = 50 CT + 7 CS **dans l'ordre de 1999** (≠ 1996 !) : CT01 DYNAMICPUNCH, CT03 CURSE, CT10 HIDDEN_POWER, CT17 PROTECT, CT26 EARTHQUAKE… ; CS : CUT, FLY, SURF, STRENGTH, FLASH, WHIRLPOOL, WATERFALL.

### 4.6 Objets (`POKE_OBJETS`, `POKE_GEN2_OBJETS`)

Prix canon (extraits) : POKE_BALL 200, GREAT_BALL 600, ULTRA_BALL 1200, POTION 300, SUPER_POTION 700, HYPER_POTION 1500 (1200 à Johto), MAX_POTION 2500, FULL_RESTORE 3000, REVIVE 1500, MAX_REVIVE 4000, RARE_CANDY 4800, vitamines 9800, pierres 2100, NUGGET 10000, FRESH_WATER 200, SODA_POP 300, LEMONADE 350. Johto ajoute : EXP_SHARE 3000, objets tenus, baies 10, apicorns 200, SLOWPOKETAIL 9800, SACRED_ASH 200, Balls spéciales 150 (HEAVY/LEVEL/LURE/FAST/FRIEND/MOON/LOVE).

---

## 5. Créatures

### 5.1 Statistiques (`moteur.js` — formule gen1 exacte)

```js
function terme(base, dv, statExp) {
  var e = Math.floor(Math.min(255, Math.ceil(Math.sqrt(statExp || 0))) / 4);
  return (base + dv) * 2 + e;
}
// PV  : floor(terme(b.pv, d.pv, e.pv) * L / 100) + L + 10
// atk/def/vit/spe : floor(terme(...) * L / 100) + 5
```

**gen2** : les deux Spéciales partagent **la même DV et la même statExp** (`dv.spe`, `statExp.spe` — comme le ROM 1999) ; le calcul lit `b[sat]`/`b[sdf]`. Aucun tirage supplémentaire.

### 5.2 Valeurs déterminantes (DV)

```js
// atk, def, vit, spe = h.entier(16) chacun ; la DV des PV se DÉDUIT :
var pv = ((atk & 1) << 3) | ((def & 1) << 2) | ((vit & 1) << 1) | (spe & 1);
```

### 5.3 Sexe (gen2)

`sexeDe(p)` : femelle si `dv.atk <= (octet >> 4)` avec `OCTET_DE_SEXE = {GENDER_F12_5: 0x1f, GENDER_F25: 0x3f, GENDER_F50: 0x7f, GENDER_F75: 0xbf, GENDER_F100: 0xfe}` ; `GENDER_F0` = toujours mâle ; `GENDER_UNKNOWN` = pas de sexe (21 espèces, tous les légendaires). Répartition dans les données gen2 : F50 ×158, F12_5 ×32, UNKNOWN ×21, F25 ×12, F75 ×11, F100 ×9, F0 ×8.

### 5.4 Courbes d'expérience (`expTotalePour(croissance, n)`, c = n³)

| Croissance | Formule |
|---|---|
| `rapide` | `floor(4c/5)` |
| `lente` | `floor(5c/4)` |
| `moyenne_lente` | `max(0, floor((6/5)c − 15n² + 100n − 140))` |
| `moyenne` (défaut) | `c` |

`niveauPourExp` : boucle n de 1 à 99.

### 5.5 Jeu d'attaques au niveau

Garde les **4 dernières** : `depart` + `apprend` (dédoublonnés, `break` dès `app[i][0] > niveau`), puis `slice(-4)`. Chaque entrée `{cle, pp, ppMax}`.

### 5.6 Création (`creer(n, niveau, h, options)`)

Champs : `n, surnom, niveau, dv, statExp (5 cases à 0), exp, attaques, statut (null|"para"|"brulure"|"gel"|"sommeil"|"poison"|"poisonGrave"), statutTours, echange, capture ({zone, niveau}), objet, stats, pv`.

**Objet tenu sauvage** (gen2, 2 tirages, constants `OBJET_RIEN = 0.75`, `OBJET_RARE = 0.08`) : `h.brut() < 0.75 → rien` ; sinon `h.brut() < 0.08 → objet rare`, sinon commun. `options.objetForce` → objet 1 à coup sûr sans tirage (Ho-Oh/Lugia/Ronflex du ROM). **En gen1 la porte rend null avant tout tirage** (rejeu Kanto intact).

### 5.7 Gain d'expérience (`gainExperience`)

```js
var brut = Math.floor((e.exp * vaincu.niveau * RYTHME * facteurNiveau(vaincu.niveau)) / 7);
if (opt.dresseur) brut = Math.floor(brut * 1.5);          // combat de dresseur = ×1,5 (canon)
var part = Math.floor(brut / Math.max(1, participants));  // TOUS les combattants, divisé
if (opt.gagnant.echange) part = Math.floor(part * 1.5);   // Pokémon échangé = ×1,5 (canon)
if (serments && serments !== 1) part = Math.floor(part * serments);
return Math.max(1, part);
```

- `RYTHME = 4.3` — écart au canon assumé (partie de ~40 min).
- `facteurNiveau(niveau)` — la « bosse de rattrapage » (mesurée sur 900 voyages) :
  - n ≤ 8 : `(2.5 + (n-5)/3) / 6`
  - n ≤ 14 : `(3.5 + 6·((n-8)/6)^0.75) / 6`
  - n ≤ 20 : `(114 − 7·(n−14)) / 72` (NIVEAU_NEUTRE = 20)
  - n ≤ 42 : `(n/20)^1.25` (NIVEAU_PLEIN = 42)
  - sinon : `(42/20)^1.25 · (n/42)^0.35`
- `gagnerStatExp` : `statExp[k] = min(65535, statExp[k] + base[k])` du vaincu (case `spe` alimentée par sat/sdf selon le monde).
- `appliquerExperience(p, gain, plafond)` : niveau ≤ `min(100, plafond)` ; l'exp **rentre quand même** sous plafond ; rend des événements `{type:"niveau"|"attaque"|"evolution"|"plafond"}`. Le moteur **signale** l'évolution, l'écran décide (bouton B).
- `distribuerExperience` : combattants → part divisée par leur nombre ; Multi Exp. (`expAll`) ou Serment de la troupe (`expPartage`) → les non-combattants debout touchent la moitié (Multi Exp.) ou la part entière (troupe) ; **un combattant ne touche jamais deux fois**.

### 5.8 Portes d'écriture

- `poserPv(p, v, ou)` : **porte unique** d'écriture des PV — borne [0, max], refuse tout non-nombre (incident `pvIncoherent` tracé, liste bornée à 50).
- `entrerEnJeu` : porte unique d'entrée (pièges à l'entrée inclus — Picots gen2 : `floor(pvMax/8)` sauf Vol).
- `faireEvoluer(p, vers)` : change `p.n`, `exp = max(exp, expTotalePour(croissance, niveau))`, PV max gagnés ajoutés aux PV courants.
- `especeAuNiveau(n, niveau)` : suit la chaîne d'évolution (par niveau, et par stat sur les bases) — sert aux dresseurs hissés au niveau.

---

## 6. Le combat

### 6.1 État d'un combat (`combat.js` → `PokeCombat`)

`demarrer(equipeJoueur, equipeAdverse, options, h)` → `e = { joueur: cote, adverse: cote, tour: 0, sauvage, zone, fini: null ("victoire"|"defaite"|"fuite"|"capture"), serments, fuiteApres, balls, journal }`.

`cote` = `{ equipe, actif, paliers, volatils, participants, badges, dresseur, soins, soin: "SUPER_POTION" }`.
- `paliers` : `{atk, def, vit, precision, esquive}` + `sat`/`sdf` selon le registre (gen2). Remis à zéro au changement.
- `volatils` : confusion, peur, protection, mur, brume, puissance, graine, clone, entrave, bis, rage, fureur, etreint, patience, charge, horsAtteinte, recharge, riposte, dernierCoup, abri, tenacite, voileMiroir, malediction, cauchemar, attraction, rune, regard, requiem, relais, verrou, clairvoyance, lienDestin, gardeSuite… (s'effacent au changement, sauf pièges posés au sol et `differe`).

Le moteur rend des **listes d'événements** `{t: "...", ...}` que l'interface met en mots (`PokeUICombat.mettreEnMots`).

### 6.2 Ordre des tours et priorités

```js
var PRIORITES_1G = { QUICK_ATTACK: 1, COUNTER: -1 };   // gen2 : table par EFFET (EFFECT_PRIORITY_HIT etc.)
// prioriteDe(cote, action) : effet gen2 d'abord, sinon PRIORITES_1G[cle] || 0

function joueurEnPremier(e, pJ, pA, h, ev) {
  var alea = h.brut();                       // 🔴 consommé DANS TOUS LES CAS
  if (pJ !== pA) return pJ > pA;
  // Vive Griffe (60/256) : seulement à priorité égale
  var vj = vitesseEffective(actif(e.joueur), e.joueur.paliers, e.joueur);
  var va = vitesseEffective(actif(e.adverse), e.adverse.paliers);
  if (vj !== va) return vj > va;
  return alea < 0.5;
}
```

`vitesseEffective` = `floor(stats.vit × facteurPalier(paliers.vit))` ; ×1.125 si Badge Foudre ; si `para` : `floor(v/4)` ; min 1.

### 6.3 Paliers de statistiques

```js
var PALIERS = [0.25, 0.28, 0.33, 0.40, 0.50, 0.66, 1, 1.5, 2, 2.5, 3, 3.5, 4];  // index = palier + 6
// bornes : ±6 ; un palier positif se pose sur soi, négatif sur l'adversaire (lecture du ROM)
```

### 6.4 Statuts (début/fin de tour)

`peutAgir` — ordre des empêchements :
1. **Gel** : `h.chance(10)` (`DEGEL_NATUREL`, écart assumé) → dégel naturel ; sinon tour perdu.
2. **Sommeil** : `statutTours--` ; ≤ 0 → réveil **et le tour du réveil est perdu** (canon 1996) ; sinon tour perdu — sauf `enDormant` (gen2 : SLEEP_TALK, SNORE).
3. **Paralysie** : `h.chance(100 × 63/256)` (~24,6 %, canon) → pleine paralysie.

Usure de fin de tour : **Vampigraine** `drain = max(1, floor(pvMax/16))` rendu à l'actif adverse ; **Poison/Brûlure** `max(1, floor(pvMax/16))`/tour ; **Poison grave** dose ×N (`statutTours × max(1, floor(pvMax/16))`) ; **Tempête de sable** (gen2) avant l'usure, `floor(pvMax/16)` sauf rock/ground/steel ; objets tenus en fin de tour (Restes 1/16, baies sur seuil).

### 6.5 Formule de dégâts (`degats(att, def, attaque, ctx, h)` — EXACTE)

```js
var eff = ctx.sansType ? 1 : efficacite(a.type, typesDe(def));
if (eff === 0) return { degats: 0, efficacite: 0, critique: false };

// Critique
var tauxCrit = chanceCritique(att, attaque);          // = t/256, cf. 6.6
if (TENUS && effetTenu(att) === critique.effet) tauxCrit *= 2;   // Lentille Scope ×2
if (ctx.puissance) tauxCrit = tauxCrit / 4;           // 🔴 bug 1996 CONSERVÉ : Puissance DIVISE le crit
if (ctx.sermentsCrit) tauxCrit = clamp(tauxCrit + sermentsCrit, 0, 1);
var critique = ctx.sansCritique ? false : h.brut() < tauxCrit;

var spec = estSpecial(a.type);                        // par TYPE, jamais par attaque
var cleA = spec ? SPE_ATK() : "atk";                  // gen1 : "spe"=="spe" ; gen2 : "sat"/"sdf"
var cleD = spec ? SPE_DEF() : "def";
var A = att.stats[cleA], D = def.stats[cleD];
if (!critique) {                                      // 🔴 le crit IGNORE les paliers
  A = Math.floor(A * facteurPalier(ctx.attPaliers[cleA]));
  D = Math.floor(D * facteurPalier(ctx.defPaliers[cleD]));
}
// Renfort de type (objet tenu) : ×1.1 sur A si l'objet correspond au type du coup
// Météo (gen2) : A ×= 1.5 (pluie/Eau, zénith/Feu) ou ×= 0.5 (pluie/Feu, zénith/Eau)
if (!spec && att.statut === "brulure") A = Math.floor(A / 2);   // brûlure coupe l'Attaque physique
if (!critique) {
  if (spec && ctx.mur) D = D * 2;                      // Mur Lumière (spécial)
  if (!spec && ctx.protection) D = D * 2;              // Protection (physique)
}
if (ctx.badgesAtt) A = Math.floor(A * ctx.badgesAtt);  // ×1.125 (Badge Roche → atk, Glacier → spe)
if (ctx.badgesDef) D = Math.floor(D * ctx.badgesDef);  // ×1.125 (Badge Âme → def)
if (a.effet === "EXPLODE_EFFECT") D = Math.max(1, Math.floor(D / 2));  // Explosion : D/2 (même sur crit)
A = Math.max(1, A); D = Math.max(1, D);

var niveau = critique ? att.niveau * 2 : att.niveau;
var d = Math.floor(Math.floor((Math.floor((2 * niveau) / 5) + 2) * a.puissance * A / D) / 50) + 2;
if (!ctx.sansType && typesAtt.indexOf(a.type) >= 0) d = Math.floor(d * 1.5);  // STAB gen1 = ×1.5
d = Math.floor(d * eff);
if (d > 1) d = Math.floor((d * h.entre(217, 255)) / 255);   // aléa 217-255/255 → 85 % à 100 %
if (ctx.sermentsInflige && ctx.sermentsInflige !== 1) d = Math.floor(d * ctx.sermentsInflige);
if (ctx.sermentsSubit && ctx.sermentsSubit !== 1) d = Math.floor(d * ctx.sermentsSubit);
return { degats: Math.max(1, d), efficacite: eff, critique: critique };
```

### 6.6 Coup critique (`chanceCritique`)

```js
var FORT_CRITIQUE = { SLASH: 1, KARATE_CHOP: 1, CRABHAMMER: 1, RAZOR_LEAF: 1 };
var base = ESP()[p.n].base.vit;          // 🔴 VITESSE DE BASE de l'ESPÈCE, pas la stat calculée
var t = Math.floor(base / 2);
if (FORT_CRITIQUE[cleAttaque]) t = Math.min(255, t * 8);
return t / 256;
```

Critique = `h.brut() < tauxCrit` ; ignore paliers + murs ; double le niveau dans la formule. Bug « Puissance divise le crit par 4 » conservé.

### 6.7 Précision (dans `assaut`)

```js
var prec = a.precision * facteurPalier(source.paliers.precision) / facteurPalier(cible.paliers.esquive);
// Poudre Claire (objet tenu) : prec *= 0.9
// Infaillible : SWIFT_EFFECT, ou verrou (Lock-On) posé
if (!viseSoi && !infaillible && (a.precision < 100 || prec < 100)) {
  if (!h.chance(Math.max(1, Math.min(100, prec))) && !toucheDOffice) { ... rate ... }
}
```

- Coup sur soi (`viseSoi`) : aucun jet. `horsAtteinte` (Vol/Tunnel) : ne porte pas (sauf Météores/SWIFT qui saute tout le jet — canon RBY). Pied Sauté qui rate : **1 PV** au lanceur. Explosion se sacrifie même en ratant.
- **Écart assumé : pas de raté 1/256** — une précision de 100 % touche toujours.

### 6.8 Tables d'effets (constantes exactes)

```js
// Statuts secondaires — taux canon du ROM : EFFECT1 = 10 %, EFFECT2 = 30 %
var STATUT_DE = {
  PARALYZE_SIDE_EFFECT1: ["para", 10], PARALYZE_SIDE_EFFECT2: ["para", 30], PARALYZE_EFFECT: ["para", 100],
  BURN_SIDE_EFFECT1: ["brulure", 10], BURN_SIDE_EFFECT2: ["brulure", 30],
  FREEZE_SIDE_EFFECT1: ["gel", 10],            // 🔴 la clé porte son « 1 » (bug historique réparé)
  POISON_SIDE_EFFECT1: ["poison", 20], POISON_SIDE_EFFECT2: ["poison", 40], POISON_EFFECT: ["poison", 100],
  SLEEP_EFFECT: ["sommeil", 100],
};
var PALIER_DE = {  // [stat, delta, chance %]
  ATTACK_DOWN1_EFFECT: ["atk", -1, 100], DEFENSE_DOWN1_EFFECT: ["def", -1, 100], SPEED_DOWN1_EFFECT: ["vit", -1, 100],
  ATTACK_DOWN_SIDE_EFFECT: ["atk", -1, 33.2], DEFENSE_DOWN_SIDE_EFFECT: ["def", -1, 33.2],  // 🔴 33.2 = 85/256 ROM
  SPEED_DOWN_SIDE_EFFECT: ["vit", -1, 33.2], SPECIAL_DOWN_SIDE_EFFECT: ["spe", -1, 33.2],
  ATTACK_UP1_EFFECT: ["atk", 1, 100], DEFENSE_UP1_EFFECT: ["def", 1, 100], SPECIAL_UP1_EFFECT: ["spe", 1, 100],
  ATTACK_UP2_EFFECT: ["atk", 2, 100], DEFENSE_UP2_EFFECT: ["def", 2, 100], SPEED_UP2_EFFECT: ["vit", 2, 100], SPECIAL_UP2_EFFECT: ["spe", 2, 100],
  ACCURACY_DOWN1_EFFECT: ["precision", -1, 100], DEFENSE_DOWN2_EFFECT: ["def", -2, 100], EVASION_UP1_EFFECT: ["esquive", 1, 100],
};
var PEUR_DE = { FLINCH_SIDE_EFFECT1: 10, FLINCH_SIDE_EFFECT2: 30 };
```

- **Toxik** porte `POISON_EFFECT` et se reconnaît **par son nom** (`"TOXIC"` → poisonGrave). **Riposte** porte `NO_ADDITIONAL_EFFECT` et se reconnaît **par son nom** (`COUNTER`).
- Le **clone** intercepte statuts, paliers, peur, confusion, Vampigraine (canon `CheckTargetSubstitute`). La **Brume** bloque les baisses infligées à 100 %.
- Immunités de statut : Poison sur type poison ; Brûlure sur type feu ; Gel sur type glace ; para si efficacité du type = 0 ; **effet secondaire** ne prend pas sur son propre type, mais le statut pur (Cage Éclair) paralyse bien un Électrik.

### 6.9 Dégâts fixes

`SONICBOOM → 20` ; `DRAGON_RAGE → 40` ; `SEISMIC_TOSS / NIGHT_SHADE → pA.niveau` ; `PSYWAVE → h.entier(max(1, floor(pA.niveau*1.5) − 1)) + 1`. L'immunité de type s'applique quand même.

### 6.10 Effets spéciaux notables

- **OHKO** (Guillotine/Empal'Korne/Abîme) : échoue si efficacité 0 **ou si moins rapide** (règle 1996) ; sinon `encaisser(pD.pv)`.
- **Dévorêve** : échoue sur cible éveillée ; sinon dégâts + drain moitié. **Jackpot** : `pieces = 2 × pA.niveau`.
- **Repos** : PV max + sommeil (statutTours=2) ; **Buée Noire** : paliers des deux camps à zéro + **lève le statut de la cible seule** (asymétrie 1996) ; **Patience** : `{tours: h.entre(2,3), encaisse: 0}`, rend ×2 à la fin ; **Ultralaser** : recharge **seulement si la cible survit** ; **Frénésie** : chaque coup encaissé monte atk +1 ; **Fureur** : `tours: 2 + h.entier(2)` puis confusion `h.entre(2,5)` ; **Étreinte** : `tours` via la table 3/8·3/8·1/8·1/8, bloque tout y compris le changement (le repli coupe la prise) ; **Métronome** : tire dans toutes les attaques (max 12 essais, exclut METRONOME/STRUGGLE) ; **Morphing** : copie morphe, types, stats de combat, attaques (PP 5/5), **et les paliers de la cible** — toute transformation est annulée en fin de combat.
- **Coups multiples** : `r8 = h.entier(8)` ; `coups = r8<3 ? 2 : r8<6 ? 3 : r8===6 ? 4 : 5` — les dégâts se calculent UNE fois, s'appliquent N fois.
- **Drain** : `max(1, floor(dégâts/2))` ; **Recul** : `1/4` (Bélier/Damoclès/Sacrifice), `1/2` (Lutte).
- **Confusion** : `h.chance(50)` → auto-dégât puissance 40 sans STAB/type/paliers/crit.
- **Peur** : ne vaut que si l'on frappe en premier (meurt en fin de tour). **Roche Royale** : `h.entier(256) < 30` sur un coup porté sans effet de peur.

### 6.11 Badges (Kanto)

`bonusBadges(c, quoi)` : `b[cle] ? 1.125 : 1`. Badges lus : Roche (atk), Cascade (spe), Foudre (vit), Âme (def). Le bonus Attaque s'applique dans `degats`, Défense aussi (camp joueur), Vitesse dans `vitesseEffective`.

### 6.12 IA adverse (`choixAdverse`)

```js
// Sauvage : coup au hasard parmi ceux avec PP > 0
if (!e.adverse.dresseur) return { type: "attaque", index: h.dans(dispo) };
// Dresseur : pondération par dégâts potentiels
var pese = dispo.map(function (i) {
  var a = ATT()[pA.attaques[i].cle];
  var eff = a.puissance ? efficacite(a.type, typesDe(pD)) : 1;
  var note = a.puissance ? a.puissance * eff : 25;   // attaque de statut = 25 de base
  if (!coupUtile(a, pA, pD, e.adverse, e.joueur, !!e.sauvage)) note = 0;
  return { index: i, poids: Math.max(1, Math.round(note)) };
});
var choix = { type: "attaque", index: h.pondere(pese).index };
// Soin : seuil 1/4 des PV max, stock non vide (tirage pondéré TOUJOURS consommé avant)
if (e.adverse.soins > 0 && pA.pv > 0 && pA.pv <= Math.floor(pA.stats.pv / 4)) {
  return { type: "objetAdverse", objet: e.adverse.soin || "SUPER_POTION" };
}
```

`coupUtile` (partagée avec le duel) : « ce coup peut-il seulement marcher ? » — Dévorêve si cible endormie ; OHKO si plus rapide ; HEAL si PV manquants ; Téléport seulement en sauvage ; Vampigraine si cible non Plante et non semée ; statut pur si la cible n'en a pas déjà un.

### 6.13 Actions du joueur (`jouerTour`)

`{type:"attaque", index}`, `{type:"changer", index}`, `{type:"objet", objet, cible?}`, `{type:"stat", objet}`, `{type:"ball", ball}`, `{type:"fuite"}`, `{type:"abandon"}`.

**Fuite (sauvage)** — formule du ROM corrigée :
```js
e.essaisFuite = (e.essaisFuite || 0) + 1;
var cote2 = Math.floor((pJ.stats.vit * 32) / Math.max(1, Math.floor(vAdv / 4) % 256)) + 30 * e.essaisFuite;
var jetFuite = h.entier(256);
if (pJ.stats.vit > vAdv || cote2 > 255 || jetFuite < cote2) → fuite réussie
```
(tirage consommé dans tous les cas).

### 6.14 Objets de combat

```js
var OBJETS_SOIN = {   // soin: -1 = « au maximum »
  POTION: {soin: 20}, SUPER_POTION: {soin: 50}, HYPER_POTION: {soin: 200},
  MAX_POTION: {soin: -1}, FULL_RESTORE: {soin: -1, etat: "tous"},
  FRESH_WATER: {soin: 50}, SODA_POP: {soin: 60}, LEMONADE: {soin: 80},
  ANTIDOTE: {etat: "poison"}, BURN_HEAL: {etat: "brulure"}, ICE_HEAL: {etat: "gel"},
  AWAKENING: {etat: "sommeil"}, PARLYZ_HEAL: {etat: "para"},   // 🔴 "PARLYZ" (faute historique réparée)
  FULL_HEAL: {etat: "tous"}, REVIVE: {ranime: 0.5}, MAX_REVIVE: {ranime: 1},
};
var OBJETS_STAT = {
  X_ATTACK: {stat: "atk"}, X_DEFEND: {stat: "def"}, X_SPEED: {stat: "vit"},
  X_SPECIAL: {stat: SPE_ATK()}, X_ACCURACY: {stat: "precision"},
  DIRE_HIT: {volatil: "puissance"}, GUARD_SPEC: {volatil: "brume"},
};
```

Un objet de soin/stat **coûte le tour**. Un `soinInterdit` (serment/règle du jour) vide les soins du sac de combat — **les Balls restent**.

### 6.15 Fin de tour (`finDeTour`) — ordre EXACT

1. Décompter Étreinte + Entrave (deux camps). 2. `peur=false` ; décompter Fureur (fin → confusion). 3. Usure météo. 4. Usure de fin de tour (objets tenus, vampigraine, poisons). 5. Météo compte à rebours. 6. Requiem (deux compteurs ensemble). 7. Malédiction `floor(pvMax/4)`/tour, Cauchemar idem. 8. Prescience (dégâts **déjà calculés au lancer**). 9. Lien du Destin, Rune Protect, `libererPatience`. 10. `riposte=0, voileMiroir=0, abri=false, tenacite=false` ; décompter Bis. 11. Adversaire K.O. → envoie automatique du suivant (pièges à l'entrée inclus). 12. Fins dans l'ordre — **le camp du joueur se juge EN PREMIER** : `!resteUn(joueur)` → défaite (même si l'adversaire tombe en même temps) ; sinon victoire ; sinon `fuiteApres` (errant) ; sinon `attenteJoueur`. 13. Si fini → `defaireToutesTransformations`.

---

## 7. La capture

### 7.1 Les Balls et l'aide de statut

```js
var BALLS = {
  POKE_BALL:   { tirage: 256, facteur: 12, safari: false },
  GREAT_BALL:  { tirage: 201, facteur: 8,  safari: false },   // 🔴 le facteur 8 n'appartient qu'à elle (ROM)
  ULTRA_BALL:  { tirage: 151, facteur: 12, safari: false },
  SAFARI_BALL: { tirage: 151, facteur: 12, safari: true },
  MASTER_BALL: { tirage: 0,   facteur: 0,  safari: false },   // ne rate jamais
};
var AIDE_STATUT = { sommeil: 25, gel: 25, para: 12, brulure: 12, poison: 12, poisonGrave: 12 };
```

### 7.2 L'algorithme (`tenter(cible, cleBall, h, serments)`)

Le résultat est calculé **avant** l'animation ; le nombre de secousses est **déduit**, jamais tiré.

```js
// Master Ball → { pris: true, secousses: 3, raison: "master" }   (un seul exemplaire par partie)
var taux = ESP()[cible.n].capture;
if (serments && serments !== 1) taux = clamp(Math.round(taux * serments), 1, 255);  // serments → sur le TAUX, jamais sur les tirages
var jet = h.entier(ball.tirage);                 // jet ∈ [0, tirage[
var aide = AIDE_STATUT[cible.statut] || 0;
if (aide && jet < aide) → PRIS (raison "statut")                 // ① le statut emporte d'un coup
if (jet > taux) → RATÉ (raison "taux")                            // ② le taux est une porte franche (rareté : Mewtwo 3, Ronflex 25, Chenipan 255)
var valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur)); // ③ les PV restants, borné 255
if (valeur >= 255) → PRIS (raison "affaibli")
var second = h.entier(256);
if (second <= valeur) → PRIS (raison "calcul")
// Raté : secousses selon la marge (valeur+1)/256 : >0.66 → 3, >0.33 → 2, >0.10 → 1, sinon 0
```

### 7.3 La chance affichée (`chance(...)`) — zéro tirage

Calcul **analytique** (une estimation qui piocherait dans la graine décalerait tout le rejeu) : `p = pStatut + pPorte × pPv`, borné à 1, avec `pStatut = min(aide, R)/R`, `pPorte = max(0, min(taux, R−1) − aide + 1)/R`, `pPv = min(1, (valeur+1)/256)`. Mesuré : **Artikodin N.50 Super Ball = 2,6 % éveillé, 16,0 % endormi** — six fois mieux ; le savoir-faire « on affaiblit, on endort, PUIS on lance » est entièrement câblé, et l'écran donne le chiffre, pas un conseil.

### 7.4 Safari (`tenterSafari`)

```js
var ajuste = clamp(Math.floor(taux * (caillou ? 2 : 1) * (appat ? 0.5 : 1)), 1, 255);
// 1er jet : h.entier(151) ≤ ajuste ; 2e jet : h.entier(256) ≤ floor((255*4)/12) = 85 → PRIS, sinon 2 secousses
// fuit : base = 12 + (caillou ? 20 : 0) − (appat ? 8 : 0) ; fuite si h.chance(max(2, base))
```

---

## 8. Types et efficacités

### 8.1 gen1 — 15 types

`POKE_TYPES = [normal, fighting, flying, poison, ground, rock, bug, ghost, fire, water, grass, electric, psychic, ice, dragon]`. Table complète (`POKE_TYPE_TABLE[attaquant][défenseur]`, 1 = neutre) :

| att\ déf | normal | fight | fly | poison | ground | rock | bug | ghost | fire | water | grass | elect | psych | ice | dragon |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | 1 | 1 | 1 | 1 | 1 | .5 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| fighting | 2 | 1 | .5 | .5 | 1 | 2 | .5 | 0 | 1 | 1 | 1 | 1 | .5 | 2 | 1 |
| flying | 1 | 2 | 1 | 1 | 1 | .5 | 2 | 1 | 1 | 1 | 2 | .5 | 1 | 1 | 1 |
| poison | 1 | 1 | 1 | .5 | .5 | .5 | 2 | .5 | 1 | 1 | 2 | 1 | 1 | 1 | 1 |
| ground | 1 | 1 | 0 | 2 | 1 | 2 | .5 | 1 | 2 | 1 | .5 | 2 | 1 | 1 | 1 |
| rock | 1 | .5 | 2 | 1 | .5 | 1 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 2 | 1 |
| bug | 1 | .5 | .5 | 2 | 1 | 1 | 1 | .5 | .5 | 1 | 2 | 1 | 2 | 1 | 1 |
| ghost | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | **2** | 1 | 1 |
| fire | 1 | 1 | 1 | 1 | 1 | .5 | 2 | 1 | .5 | .5 | 2 | 1 | 1 | 2 | .5 |
| water | 1 | 1 | 1 | 1 | 2 | 2 | 1 | 1 | 2 | .5 | .5 | 1 | 1 | 1 | .5 |
| grass | 1 | 1 | .5 | .5 | 2 | 2 | .5 | 1 | .5 | 2 | .5 | 1 | 1 | 1 | .5 |
| electric | 1 | 1 | 2 | 1 | 0 | 1 | 1 | 1 | 1 | 2 | .5 | .5 | 1 | 1 | .5 |
| psychic | 1 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | .5 | 1 | 1 |
| ice | 1 | 1 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | .5 | 2 | 1 | 1 | .5 | 2 |
| dragon | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |

- **Un écart assumé** (`POKE_TYPE_ECARTS`) : `ghost → psychic` vaut **2** au lieu de 0 — bug gen1 corrigé, sinon Spectre inutile contre Morgane et Agatha.
- **Physique/spécial par TYPE** (`POKE_TYPES_SPECIAUX`) : spéciaux = `fire, water, grass, electric, psychic, ice, dragon`. C'est ce qui rend Amphinobi impossible et explique qu'un Sabelette encaisse un Laser Glace.

### 8.2 gen2 — 17 types (ajouts : steel, dark)

Table canonique complète dans `NOTES-MOTEUR-COMBAT.md` §4. **Exactement 3 cases changent** entre les générations (`POKE_GEN2_TYPE_CHANGEMENTS`) : `poison→bug 2→1`, `bug→poison 2→0.5`, `ice→fire 1→0.5`. `POKE_GEN2_TYPE_ECARTS = []` (aucun écart). Spéciaux gen2 : `fire, water, grass, electric, psychic, ice, dragon, dark` (Ténèbres **spécial**, Acier **physique**).

---

## 9. L'éclat

Condition lue depuis `pret/pokecrystal` (un Pokémon de Rouge échangé vers Or devient chromatique ssi ses DV remplissent la condition — l'éclat EST dans les DV, aucun tirage, le serveur le revérifie) :

```js
var MASQUE_ATK = 2, DEF_DV = [10, 11], VIT_DV = [10, 11], SPE_DV = 10;
// chromatique ⟺ (dv.atk & 2) !== 0 && def ∈ {10,11} && vit ∈ {10,11} && spe === 10
```

**Seuils desserrés le 24/08** (écart assumé) : probabilité = (2/16)×(2/16)×(1/16)×(8/16) = **1/2048** (au lieu de 1/8192 du ROM).

**Grades de DV** (somme `atk+def+vit+spe`, max 60 — les PV sont exclus car déduits) : `PARFAIT ≥ 60`, `EXCEPTIONNEL ≥ 52`, `SOLIDE ≥ 43`, `CORRECT ≥ 30`, `ORDINAIRE ≥ 0`.

---

## 10. Le monde

### 10.1 Kanto — 49 lieux, 51 étapes

`POKE_LIEUX` : dictionnaire `clé → {fr, en}` (villes, routes 1-25 sans la 20, chenaux 19/20/21, donjons : Mont Sélénite, Cave Taupiqueur, Grotte, Tour Pokémon, Manoir Pokémon, Centrale, Îles Écume, Caverne Azurée, Route Victoire 1/2, Forêt de Jade, Parc Safari, paquebot S.S. Anne, Plateau Indigo).

`POKE_ETAPES` (voyage.js) : **51 étapes**, schéma :

| Champ | Type | Rôle |
|---|---|---|
| `id` | string | identifiant unique (kebab-case) |
| `lieu` | string | clé de `POKE_LIEUX` |
| `categorie` | string | `ville \| route \| donjon \| scene \| eau \| safari \| ligue` |
| `tables` | string[] | ids des tables de rencontre couvertes |
| `exige` | string[] | clés requises pour entrer (verrous canon) |
| `exigeBadges` | int | nb de badges requis |
| `donne` | string[] | clés rendues par l'étape |
| `arene` | int | n° d'arène qui ferme l'acte |
| `boutique` | int | niveau de boutique (1-3) |
| `legendaire` | int | n du légendaire qui y dort |
| `depart` / `unique` | bool | point de départ / nœud unique |
| `fossile` / `fossileRanime` | bool | choix / ranimation |
| `rocket` | int | apparition Team Rocket (1-3) |
| `casino, pension, ronflex, camion, journalMewtwo` | bool | scènes |
| `apresLigue` | bool | exige la Ligue gagnée |

**Les 51 étapes dans l'ordre** (avec verrous) :
`bourg-palette` (départ) → `route-1` → `jadielle` → `route-22` (le rival barre) → `route-2` (**donne flash**) → `foret-de-jade` → `argenta` (**arène 1**) → `route-3` → `mont-selenite` (fossile, rocket 1) → `route-4` → `azuria` (**arène 2**) → `route-24` → `route-25` (**donne ticket**) → `route-5` (pension) → `route-6` → `carmin` (**arène 3**, **donne velo**) → `paquebot` (**exige ticket**, **donne coupe**, camion) → `route-11` → `grotte-taupiqueur` → `route-9` (**exige coupe**) → `route-10` → `tunnel-roche` (**exige flash**) → `lavanville` → `route-8` → `route-7` → `celadopole` (**arène 4**, casino, **donne boisson**) → `repaire-rocket` (rocket 2, **donne scope + carte**) → `tour-pokemon` (**exige scope**, **donne flute**) → `route-16` (ronflex, **exige flute**, **donne vol**) → `route-17` → `route-18` → `parmanie` (**arène 5**) → `zone-safari` (**donne surf + force + dentOr**) → `route-12` (ronflex, **exige flute**) → `route-13` → `route-14` → `route-15` → `safrania` (**exige boisson**) → `tour-silph` (rocket 3, **donne master**) → `safrania-arene` (**arène 6**, **exige master**) → `route-19` (**exige surf**) → `iles-ecume` (**exige surf+force**, **légendaire 144 Artikodin**) → `route-21` (**exige surf**) → `cramois-ile` (**arène 7**, fossileRanime, **exige cleSecrete**) → `manoir` (journalMewtwo, **donne cleSecrete**) → `centrale` (**exige surf**, **légendaire 145 Électhor**) → `jadielle-arene` (**arène 8**, exigeBadges 7) → `route-23` (**exige surf**, exigeBadges 8) → `route-victoire` (**exige force**, **légendaire 146 Sulfura**) → `plateau-indigo` (ligue) → `grotte-inconnue` (**exige surf**, apresLigue, **légendaire 150 Mewtwo**).

### 10.2 Les clés de progression (`POKE_CLES`)

| clé | source | = |
|---|---|---|
| `coupe` | paquebot | CS01 Coupe |
| `vol` | route-16 | CS02 Vol |
| `surf` | zone-safari | CS03 Surf |
| `force` | zone-safari | CS04 Force |
| `flash` | route-2 | CS05 Flash |
| `ticket` | route-25 | Ticket Bateau |
| `scope` | repaire-rocket | Scope Sylphe |
| `flute` | tour-pokemon | Poké Flûte |
| `carte` | repaire-rocket | Carte Magnétique |
| `dentOr` | zone-safari | Dent d'Or |
| `velo` | carmin | Bicyclette |
| `master` | tour-silph | Master Ball |
| `boisson` | celadopole | Limonade |
| `cleSecrete` | manoir | Clé Secrète |

**`POKE_BADGE_POUR_CS = { flash: 1, coupe: 2, vol: 3, force: 4, surf: 5 }`** — une CS ne s'emploie pas sans son badge. `POKE_RONFLEX = 143` (routes 12 et 16, niv. 30).

### 10.3 Johto — 45 lieux, 43 étapes, 9 actes

`POKE_GEN2_ETAPES`, points saillants :
- Acte 1 (→ Albert) : bourg-geon → route-29 → ville-griotte → route-30/31 → tour-chetiflor → **mauville (arène 1)**.
- Acte 2 (→ Hector) : route-32 → caves-jumelles (**donne flash**) → grotte-obscure (**exige flash**) → route-33 → puits-ramoloss (rocket 1) → **ecorcia (arène 2)**.
- Acte 3 (→ Blanche) : bois-aux-chenes (**donne coupe**) → route-34 (**exige coupe**) → **doublonville (arène 3, casino, pension)**.
- Acte 4 (→ Mortimer) : route-35 → parc-national → route-36 → ruines-alpha (unique) → route-37 → tour-calcinee (**libereErrants** — Raikou/Entei/Suicune) → **rosalia (arène 4, donne surf)**.
- Acte 5 (→ Chuck) : route-38/39 → oliville-port → chenal-40/41 (**exige surf**) → **irisia (arène 5, donne remede)**.
- Acte 6 (→ Jasmine) : tourbiles (**exige surf**, **donne ailArgent**) → phare-oliville (**exige remede**) → **oliville (arène 6, exige remede, donne force)**.
- Acte 7 (→ Frédo) : route-42 → mont-creuset (**exige force**) → acajou-bourg → route-43 → lac-colere (**exige surf**, **donne mdpRocket**) → repaire-rocket (**exige mdpRocket**, rocket 2, **donne ailArcEnCiel + master**) → **acajou (arène 7)**.
- Acte 8 (→ Sandra) : route-44 → route-de-glace (**exige force**) → **ebenelle (arène 8, donne chute)** → antre-dragon (exigeBadges 8, unique).
- Acte 9 : route-45/46 → **plateau-indigo (ligue, exigeBadges 8)**.
- Après Ligue : `caverne-lugia` (**exige surf+chute+ailArgent**, **légendaire 249**), `tour-carillon` (**exige ailArcEnCiel**, **légendaire 250**), `mont-argente` (**dresseurFinal "Red"**).

Clés Johto : `coupe, surf, force, flash, chute, remede, mdpRocket, ailArgent, ailArcEnCiel, master`. **`POKE_GEN2_BADGE_POUR_CS = { flash: 1, coupe: 2, force: 3, surf: 4, chute: 8 }`**.

### 10.4 Tables de rencontres sauvages

**Kanto** — `POKE_POIDS_CRENEAUX = [20, 20, 15, 10, 10, 10, 5, 5, 4, 1]` : **10 créneaux** par table, poids du ROM (jamais arrondis : « un Pokémon à 1 % reste à 1 % »). `POKE_ZONES` (56 zones) :

```json
{ "id": "Route1", "lieu": "kanto-route-1", "nom": {"fr": "Route 1", "en": "Route 1"},
  "herbe": { "taux": 25,
    "rouge": [ {"n": 16, "niveau": 3, "poids": 20}, ... 10 entrées ],
    "bleu":  [ ... ] },
  "eau": null | { "taux": 5, "rouge": [...10], "bleu": [...10] } }
```

`taux` : fréquence de rencontre en marchant (8-30 ; Safari 30, routes principales 25, grottes 10-15, Forêt de Jade 8). `rouge`/`bleu` : les **deux versions** (choix de départ). Rencontre : `h.chance(bloc.taux * 100 / 187)`.

`POKE_PECHE` : `{canne: [Magicarp n.129 niv.5], bonne: [Poissirène, Ptitard niv.10], mega: {groupes: Group1..Group10, parCarte: {PALLET_TOWN: "Group1", ...33 cartes}}}`. Groupes notables : G6 (Minidraco), G9 (Aquali/Staross niv.23), G10 (Staross niv.23).

**Johto** — `POKE_GEN2_ZONES` (73 zones), format **différent** (pas de versions, pas d'horloge) :

```json
{ "id": "SPROUT_TOWER_2F", "lieu": "sprout-tower", "taux": 2,
  "herbe": { "cristal": [ {"n": 19, "niveau": 5, "poids": 8}, ... ] },
  "eau": null | { "cristal": [...] } }
```

`taux` = le **meilleur** des 3 moments de la journée du ROM ; `herbe.cristal` = créneaux **fondus** matin/jour/nuit (le mode n'a pas d'horloge — les espèces de nuit restent atteignables), souvent 8-13 créneaux et plusieurs niveaux par espèce. `POKE_GEN2_PECHE` (même forme que Kanto ; Méga Canne : groupes Shore/Ocean/Lake/Pond/Dratini/Gyarados/WhirlIslands/Qwilfish/Remoraid indexés par carte ROM) + `POKE_GEN2_PECHE_ROM` (39 tables brutes à seuils cumulatifs, gardée pour relecture).

---

## 11. Arènes, Conseil 4, rival, dresseurs

### 11.1 Les 8 arènes de Kanto (`POKE_ARENES`)

Schéma : `{ordre, ville, nom:{fr,en}, champion, championEn, badge, badgeEn, type, ct, equipe:[{n, niveau}]}`. **Aucun Champion n'est adouci.**

| # | Ville | Champion | Badge | Type | CT | Équipe (niveaux) |
|---|---|---|---|---|---|---|
| 1 | Argenta | Pierre / Brock | Roche | Roche | TM_BIDE | Racaillou 74 @12, Onix 95 @14 |
| 2 | Azuria | Ondine / Misty | Cascade | Eau | TM_BUBBLEBEAM | Stari 120 @18, Staross 121 @21 |
| 3 | Carmin sur Mer | Major Bob / Lt. Surge | Foudre | Électrik | TM_THUNDERBOLT | Voltorbe 100 @21, Pikachu 25 @18, Raichu 26 @24 |
| 4 | Céladopole | Erika | Prisme | Plante | TM_MEGA_DRAIN | Empiflor 71 @29, Saquedeneu 114 @24, Rafflesia 45 @29 |
| 5 | Parmanie | Koga | Âme | Poison | TM_TOXIC | Smogogo 109 @37, Nosferalto 42 @40, Grotadmorv 89 @39, Aéromite 49 @43, Smogogo 110 @43 |
| 6 | Safrania | Morgane / Sabrina | Marais | Psy | TM_PSYWAVE | Kadabra 64 @40, M. Mime 122 @39, Aéromite 49 @40, Hypnomade 97 @44, Alakazam 65 @48 |
| 7 | Cramois'Île | Auguste / Blaine | Volcan | Feu | TM_FIRE_BLAST | Caninos 58 @42, Ponyta 77 @40, Galopa 78 @42, Magmar 126 @45, Arcanin 59 @47 |
| 8 | Jadielle | Giovanni | Terre | Sol | TM_FISSURE | Rhinocorne 111 @45, Triopikeur 51 @42, Nidoqueen 31 @44, Nidoking 34 @45, Rhinoféros 112 @50 |

Rééquilibrage (`actes.js`) : Koga et Morgane hissés à **5 Pokémon** ; Auguste visé au niveau effectif **67**, Giovanni à **70** (`EFFECTIF_FIN = {7:67, 8:70}`) ; Auguste porte 2 Hyper Potions ; l'arène 2 reçoit +3 niveaux. Niveau effectif = canon + `monteeChampion(ordre)`.

### 11.2 Les 8 arènes de Johto (`POKE_GEN2_ARENES`)

Schéma identique + **`attaques` explicites** (la gen2 fournit les attaques exactes, contrairement à la gen1) :

| # | Ville | Champion | Badge | Type | CT | Équipe (niveaux) |
|---|---|---|---|---|---|---|
| 1 | Mauville | Albert / Falkner | Zéphyr | Vol | TM_MUD_SLAP | Roucool 16 @7, Roucoups 17 @9 |
| 2 | Écorcia | Hector / Bugsy | Essaim | Insecte | TM_FURY_CUTTER | Papilusion 12 @14, Dardargnan 14 @14, Scarabrute 123 @16 |
| 3 | Doublonville | Blanche / Whitney | Plaine | Normal | TM_ATTRACT | Mélofée 35 @18, Écrémeuh 241 @20 |
| 4 | Rosalia | Mortimer / Morty | Brume | Spectre | TM_SHADOW_BALL | Fantominus 92 @21, Spectrum 93 @21, Ectoplasma 94 @25, Spectrum 93 @23 |
| 5 | Irisia | Chuck | Choc | Combat | TM_DYNAMICPUNCH | Férosinge 57 @27, Mackogneur 62 @30 |
| 6 | Oliville | Jasmine | Minéral | Acier | TM_IRON_TAIL | Magnéti 81 @30 ×2, Steelix 208 @35 |
| 7 | Acajou | Frédo / Pryce | Glacier | Glace | TM_ICY_WIND | Lamantine 86 @27, Lamantine 87 @29, Cochignon 221 @31 |
| 8 | Ébènelle | Sandra / Clair | Lever | Dragon | TM_DRAGONBREATH | Draco 148 @37 ×3, Hyporoi 230 @40 |

`badgeEn` est `null` à Johto (pas de traduction EN du badge). Jasmine n'est défiable qu'après le remède (verrou scénario).

### 11.3 Conseil 4 + Champion

**Kanto** (`POKE_CONSEIL`, aucun soin entre les 5 combats — schéma `{ordre, nom, nomEn, equipe}`) :
1. **Olga/Lorelei** (Glace) : Lokhlass 87 @54, Clamiral 91 @53, Flagadoss 80 @54, Lippoutou 124 @56, Lokhlass 131 @56.
2. **Aldo/Bruno** (Combat) : Onix 95 @53, Kicklee 107 @55, Tygnon 106 @55, Onix 95 @56, Mackogneur 68 @58.
3. **Agatha** (Spectre) : Ectoplasma 94 @56, Nosferalto 42 @56, Spectrum 93 @55, Arbok 24 @58, Ectoplasma 94 @60.
4. **Peter/Lance** (Dragon) : Léviator 130 @58, Draco 148 @56 ×2, Ptéra 142 @60, Dracolosse 149 @62.
- **Champion = le rival** (`POKE_RIVAL.champion`). `monteeLigue() = +14` appliqué à tout le bloc : Olga 56→70, Aldo 58→72, Agatha 60→74, Peter 62→76, rival 65→79 (décalage plat, écarts internes préservés).

**Johto** (`POKE_GEN2_CONSEIL` + `POKE_GEN2_MAITRE`) :
1. **Marion/Will** (Psy) : Xatu 178 @40, Lippoutou 124 @41, Noadkoko 103 @41, Flagadoss 80 @41, Xatu 178 @42.
2. **Koga** (Poison) : Migalos 168 @40, Aéromite 49 @41, Forretress 205 @43, Grotadmorv 89 @42, Nostenfer 169 @44.
3. **Aldo/Bruno** (Combat) : Kapoera 237 @42, Tygnon 106 @42, Kicklee 107 @42, Onix 95 @43, Mackogneur 68 @46.
4. **Marina/Karen** (Ténèbres) : Noctali 197 @42, Rafflesia 45 @42, Ectoplasma 94 @45, Cornèbre 198 @44, Démolosse 229 @47.
- **Maître = Peter/Lance** (@44-50) : Léviator 130 @44, Dracolosse 149 @47 ×2, Ptéra 142 @46, Dracaufeu 6 @46, Dracolosse 149 @50.
- **Red** (`POKE_GEN2_RED`, épilogue Mont Argenté) : Pikachu 25 @81, Mentali 196 @73, Ronflex 143 @75, Florizarre 3 @77, Dracaufeu 6 @77, Tortank 9 @77 — le combat le plus dur des deux générations.

### 11.4 Le rival

**Kanto** (`POKE_RIVAL`) — 8 rencontres × 3 variantes : `{debut: [...], milieu: [...], champion: [...]}` ; variante = le rival prend toujours le starter qui **bat** le tien (Carapuce→Bulbizarre, Bulbizarre→Salamèche, Salamèche→Carapuce). Rencontres :
- debut (3) : starter @5 ; Roucool @9 + starter @8 ; Roucoups @18, Abra @15, Rattata @15, starter évolué @17.
- milieu (4) : Roucoups @19, Rattatac @16, Kadabra @18, starter @20 ; Roucoups @25, (Léviator|Caninos|Noeunoeuf) @22-23, Kadabra @20, starter @25 ; Roucarnage @37, (Caninos|Léviator|Noeunoeuf) @35-38, Alakazam @35, starter final @40 ; Roucarnage @47, Rhinocorne @45, (…) @45-47, Alakazam @50, starter final @53.
- champion (1) : Roucarnage @61, Alakazam @59, Rhinoféros @61, (Arcanin|Léviator|Noadkoko) @61-63, starter final @65.

**Johto** (`POKE_GEN2_RIVAL`) — 7 rencontres × 3 variantes, `{ordre: [152,155,158], rencontres: 7, debut: [...], milieu: [...]}` (pas de `champion` : la Ligue se clôt sur Peter). R1 starter @5 ; R2 Fantominus @12, Nosferapti @14, starter évolué @16 ; R3 Spectrum @20, Magnéti @18, Nosferapti @20, starter @22 ; R4-R7 montent jusqu'à Farfuret @45, Nostenfer @48, Ectoplasma @46, Alakazam @46, starter final @50. Sur la carte : une **scène** posée une fois par acte.

### 11.5 Classes et équipes de route

- `POKE_CLASSES` (Kanto, 29) : `{"Classe": {"fr", "en", "route": bool}}` — `route:true` = peut apparaître sur un nœud. Les Champions/Conseil/rival/prof/Rocket n'y sont pas (`route:false`). Clés : Beauty, Biker, BirdKeeper, Blackbelt, BugCatcher, Burglar, Channeler, CooltrainerF/M, CueBall, Engineer, Fisher, Gambler, Gentleman, Hiker, JrTrainerF/M, Juggler, Lass, Pokemaniac, Psychic, Rocker, Rocket, Sailor, Scientist, SuperNerd, Swimmer, Tamer, UnusedJuggler.
- `POKE_GEN2_CLASSES` (Johto, 40) : ajoute Boarder, Camper, ExecutiveF/M, Firebreather, GruntF/M, Guitarist, KimonoGirl, Medium, Officer, Picnicker, PokefanF/M, Sage, Schoolboy, Skier, SwimmerF/M, Teacher, Twins, Youngster.
- `POKE_EQUIPES` (Kanto) : `{"Classe": [ [{n, niveau}, ...], ... ]}` — 400+ équipes exactes du ROM (résumé complet par classe dans `NOTES-MONDE-VOYAGE.md` §11.3). `POKE_GEN2_EQUIPES` (Johto) : même schéma, 40 classes.
- Portraits : `assets/img/poke/dresseur/<clé-minuscules>.png` ; `jr.trainerm`/`jr.trainerf` pour les Jr.Trainer. Les classes gen2 de route n'ont **pas de portrait dédié** (fallback).

### 11.6 Légendaires errants (Johto)

```json
{ "depuis": "tour-calcinee", "chance": 0.06, "tours": 3,
  "liste": [ {"n": 243, "niveau": 40}, {"n": 244, "niveau": 40}, {"n": 245, "niveau": 40} ] }
```

Raikou/Entei/Suicune libérés à la Tour Calcinée : **6 % par nœud d'herbe** traversé qu'un errant encore libre se montre ; **3 tours** pour l'attraper avant qu'il fuie. Kanto : `errants() → null`.

### 11.7 Statiques, œufs, échanges, cadeaux, casino, arbres, fossiles

- **Statiques Kanto** : Ronflex n.143 @30 sur routes 12 et 16 (rencontre unique, un seul essai). **Johto** (7) : Léviator rouge @30 (lac-colere), Simularbre @20 (route-36), Voltorbe @23/Racaillou @21/Smogo @21/Électrode @23 (repaire-rocket), Lokhlass @20 (caves-jumelles).
- **Œufs Johto** (`POKE_GEN2_OEUFS`) : Togepi (mauville, niveau 5) ; **Œuf Étrange** (route-34) — les 7 bébés que rien n'attrape : Pichu 9, Mélo 19, Toudoudou 19, Lippouti 16, Magby 12, Élekid 14, Debugant 11 (poids /100).
- **Échanges Kanto** (9) : Nidorino→Nidorina (TERRY, route-11), Abra→M. Mime (MARCEL, route-2), Ponyta→Otaria (SAILOR, cramois-ile), Piafabec→Canarticho (DUX, carmin), Flagadoss→Excelangue (MARC, route-18), Ptitard→Lippoutou (LOLA, azuria), Raichu→Électrode (DORIS, cramois-ile), Mimitoss→Saquedeneu (CRINKLES, cramois-ile), Nidoran♂→Nidoran♀ (SPOT, route-5). **Johto** (4) : Abra→Machoc (MUSCLE, doublonville), Chétiflor→Onix (ROCKY, mauville), Krabby→Voltorbe (VOLTY, oliville-port), Draco→Dodrio (DORIS, ebenelle). L'échange est **irréversible**, une fois par espèce, et sert d'aller-retour d'évolution (Alakazam, Ectoplasma, Grolem, Mackogneur).
- **Cadeaux** : Kanto Évoli @25 (celadon) + Lokhlass @15 (saffron) ; Johto Évoli @20 (doublonville), Minidraco @15 (antre-dragon), Debugant @10 (mont-creuset), Piafabec @10 (route-35).
- **Casino** : Kanto par version (rouge : Abra 180 jetons, Mélofée 500, Nidorina 1200, Minidraco 2800, Scyther 5500, **Porygon 9999** ; bleu : Abra 120, Mélofée 750, Nidorino 1200, Pinsir 2500, Minidraco 4600, Porygon 6500). **Prix du jeton = 1 ₽** (arbitrage 17/08 — le ROM disait 10 ₽). Johto : Abra 100, Osselait 800, Qulbutoké 1500.
- **Arbres/rochers Johto** (`POKE_GEN2_ARBRES`) : 7 jeux de tables (canyon, town, route, kanto, lake, forest, rock), 6 créneaux pondérés niv.10 ; rochers : Krabboss @15 poids 90 + Insecateur @15 poids 10. Espèces rares : Hoothoot 50, Scarhino 15, Pomdrapi 15.
- **Fossiles** : `[{DOME_FOSSIL → 140 Kabuto @30}, {HELIX_FOSSIL → 138 Amonita @30}]` (choix EXCLUSIF au Mont Sélénite). **Ambre** : `{OLD_AMBER → 142 Ptéra @30}` (Musée d'Argenta, ranimé à Cramois'Île). **Dojo** : `{saffron-city, niveau 20, choix: [106 Kicklee, 107 Tygnon]}` (exclusif, le refusé est marqué vu).

---

## 12. La carte à embranchements

### 12.1 Génération (`PokeCarteActes.generer(acte, partie, h)`)

Carte **seedée** (même carte pour tous au Défi du jour) → `{acte, rangees: [[noeud,...],...]}`. **3 à 5 rangées de 2-3 nœuds** ; on en choisit un, les autres sont perdus, on ne revient pas. **Chaque nœud annonce son contenu avant le choix** (annonce calculée depuis les données, jamais écrite).

- Nombre de rangées : `max(6, min(9, max(marche, aVivre.length+1, zones.length)))` où `marche = niveauDeReference(acte) − niveauTete(partie)`. Règle `express` : `max(3, ...)`.
- Contenu d'une rangée, dans l'ordre : 1) une **scène du canon** (posée d'abord, jamais tirée) ; 2) un **légendaire** sur la dernière rangée ; 3) l'**étal de chasse** (rangée −2) ; 4) remplissage par **tirage pondéré** (`h.pondere`) : herbes 30, dresseur 26, objet 12, centre 10, boutique 8 (20 si acte ≥ 4), eau 8, pêche 14 (si canne), arbre 14 (si `onSecoueIci`). Garde-fous anti-doublons de type.
- Le nœud final : `noeudBoss(acte)` → `{type:"boss", arene, lieu}` ou `{type:"ligue", lieu}`.

### 12.2 Rampe de niveaux

- `niveauDeReference(acte)` : ligue → `hautDeLaLigue(0)` ; sinon max de l'équipe du Champion − 1 (min 3).
- `niveauDeRangee` : **interpolation** `entree + (mur − entree) × ((rangee+1)/total)^rampe` — le 1er nœud est au niveau d'entrée, le dernier au Champion − 1. `rampe()` : 1.0 (Kanto), **1.3 (gen2)**.
- `noeudHerbes` : `vise` estampillé, `dose: 4` (sauvages = visé − 4, jamais sous le niveau du ROM qui reste un plancher), `rencontres: h.entre(2,4)`, annonce 2 communes + 1 rare avec taux, `entraine` (statistique dominante — le stat-exp rendu visible).
- `noeudDresseur` : classes `route:true` seulement ; **sélection par écart pondéré au vise** (trop fort coûte ×2), fenêtre `ecart ≤ meilleur + 3` ; 1er combat : filtre équipes ≤ taille de l'équipe du joueur ; **décalage + évolution appliquée** (`especeAuNiveau` — un Pokémon servi au-dessus de son palier est servi ÉVOLUÉ) ; `gain: 300 + equipe.length × 250`.
- `noeudObjet` : échelle des Balls suivant l'acte ; `pourLaChasse` → lots de Balls (5-8 / 6-9 / 4-7, Hyper Ball dès l'acte 6).
- `noeudBoutique` : `rare` à partir de l'acte 4 (vitamines HP_UP/PROTEIN/IRON/CARBOS/CALCIUM + pierres).
- `noeudLegendaire` : `{type:"legendaire", etape, lieu, espece}` — **un seul essai** (« et il ne revient pas ») ; issues nommées dans le scénario.

### 12.3 Les scènes (`scenesDe(etape)`)

`scene` (donne/rocket/libereErrants), `safari` (appât/caillou), `camion` (le mythe de Mew, 3 états), `pension`, `journal` (Manoir), `ronflex`, `concours`, `fossile`/`ranimation`, `casino`, `oeuf`, `echange`, `cadeau`, `musee` (Ambre), `dojo`.

### 12.4 Les actes (`PokeActes`)

Un acte = tout ce qui se trouve entre deux Champions, plus le Champion. `construire()` dérive les actes de `POKE_ETAPES` (jamais recopié) : `{n, zones[], scenes[], legendaires[], finals[], boutique, boss, ligue, ville, epilogue?}`. L'après-Ligue rejoint le dernier acte en `epilogue`.

- **`plafondDe(n, arenes, bonusSerment, serre)`** : plafond de niveau du joueur = plus haut niveau du Champion de l'acte + `monteeChampion` + marge. **`MARGE_PLAFOND = 8`**, **`MARGE_LIGUE = 16`** ; `margeDe(ordre)` : dégressive — 8 (actes 1-4), 5 (5-6), **0 (7-8)**.
- **`monteeChampion(ordre)`** : arène 1 → +0 ; arène 2 → +3 ; arènes 7-8 → niveau effectif 67/70 ; sinon `round(10 + (ordre − 2))` (+12 à l'arène 4…).
- **`monteeLigue() = 14`** : appliquée au Conseil 4 + rival. `hautDeLaLigue(bonusSerment)` borné à 100.
- `plafondPour(partie)` : porte unique utilisée par le sac, la Pension et le rejeu serveur (corrige le bug « Super Bonbon → niveau 100 »).

### 12.5 La mesure (`PokeMesure` — écran « Comment mon équipe se mesure »)

`contre(mienne, adverse, h)` : par Pokémon du joueur → `{frappe: "fort"|"rien"|null, subit: "fragile"|"tient"|null}` fondé sur le **meilleur multiplicateur réel** (attaques avec dégâts, PP > 0). `menaces` : états infligés à dessein (effets primaires seulement). `remedes(sac)` : compteur de remèdes. `aLaHauteur` : combien de Pokémon sont à `haut adverse − 3` — LE chiffre qui explique le mode (un seul Pokémon sur six est au niveau du Champion à chaque arène).

### 12.6 Mythiques

- **Mew** (151) : `{niveau: 7, lieu: null}` — chasse ouverte (diplôme Kanto), **3 traces** sur des nœuds ordinaires, puis apparition, essai unique.
- **Célébi** (251) : `{niveau: 30, lieu: "ilex-forest"}` (sanctuaire du Bois aux Chênes), même mécanique.

---

## 13. Le butin

### 13.1 Règles

- Le butin ne sort **qu'après une victoire** (ni trouvaille, ni fuite, ni boutique).
- **3 cartes, on en prend 1**, on renonce aux deux autres ; + serments/règle du jour/acquis : `combien = max(1, 3 + butinChoix)`.
- Un boss : **2 cartes de plus** et double le poids des familles non-communes.
- **Pas de doublons** dans un tirage (empreinte `type + ":" + (objet|montant|"")` ; les cartes à choix `acquis:`/`ct:` ont l'empreinte fixe).
- Trois raretés : `commun`, `rare`, `legendaire`.

### 13.2 Les familles (poids et valeurs exacts)

| Famille | Rareté | Poids | Tirage |
|---|---|---|---|
| `argent` | commun | 14 | `400 + acte×260 + h.entier(base/2)` |
| `balls` | commun | 16 | acte ≥ 6 → ULTRA_BALL ×(3-6) ; ≥ 3 → GREAT_BALL ×(3-6) ; sinon POKE_BALL ×(3-6) |
| `soins` | commun | 13 | acte ≥ 6 → HYPER_POTION ×(2-4) ; ≥ 3 → SUPER_POTION ×(2-4) ; sinon POTION ×(2-4) |
| `remede` | commun | 10 | acte ≥ 6 → FULL_HEAL ×(2-3) ; sinon 1 remède ×(2-3) (condition : acte ≥ 3) |
| `rappel` | rare | 7 | REVIVE ×(1-2) |
| `vitamine` | rare | 9 | 1 vitamine (condition : équipe non vide) |
| `expAll` | rare | 14 | EXP_ALL ×1 (acte ≥ 1, équipe > 1, pas déjà possédée) |
| `canne` | rare | 8 | canne suivante non possédée dont l'acte ≥ seuil |
| `bonbon` | rare | 6 | RARE_CANDY ×1 |
| `ct` | rare | 15 | 3 machines proposées (`PokeChoix`), une gardée |
| `acquis` | légendaire | 5 | 3 acquis proposés, un gardé |
| `pierre` | légendaire | 5 | pierre utile (espèce de l'équipe évoluant par pierre) |

**Deux cartes « posées »** (garanties, jamais tirées) : **EXP_ALL** posée d'office à chaque butin dès l'acte 1 (multiplicateur ×3,5 d'expérience effective) ; **premier acquis** posé d'office à l'acte 1 (`p._acquisPose`, une seule fois).

### 13.3 Plafond des CT et cannes

`PLAFOND_CT = [95, 95, 100, 100, 100, 0, 0, 0, 0]` (par acte ; 0 = aucun plafond) — les coups sans puissance passent toujours. `apprenables(p)` : CT non possédée + sous plafond + au moins un membre l'apprend. Cannes : `[{OLD_ROD, acte 2}, {GOOD_ROD, acte 4}, {SUPER_ROD, acte 6}]`, une à la fois.

---

## 14. Serments, sceaux, acquis, règle du jour

### 14.1 Les clés d'effet (LE CONTRAT — `PokeSerments.CLES`)

| Clé | Neutre | Type | Sens |
|---|---|---|---|
| `degatsInfliges` | 1 | × | dégâts que TU infliges |
| `degatsSubis` | 1 | × | dégâts que tu SUBIS |
| `critBonus` | 0 | + | part de critiques (0 → 1) |
| `capture` | 1 | × | chance de capture |
| `argent` | 1 | × | argent gagné |
| `expGain` | 1 | × | expérience gagnée |
| `butinChoix` | 0 | + | cartes de butin proposées |
| `equipeMax` | 6 | min | places dans l'équipe (jamais sommée) |
| `soinInterdit` | false | bool | soins retirés du sac de combat (Balls restent) |
| `centreInterdit` | false | bool | le Centre refuse de soigner |
| `fuiteInterdite` | false | bool | on ne fuit plus un sauvage |
| `bossNiveau` | 0 | + | niveaux ajoutés aux Champions |
| `plafondChampion` | false | bool | on ne dépasse pas le Champion de l'acte |
| `expPartage` | false | bool | toute l'équipe gagne de l'expérience |
| `captureNiveau` | false | bool | les captures arrivent au niveau de la tête d'équipe |
| `dernierDebout` | 1 | × | dégâts × quand un seul Pokémon debout |

**Composition** (`effet(partie)`) : sources dans l'ordre — règle du jour express, serments pris, règle du jour, acquis. Fusion : booléens en `||` ; `equipeMax` en **min** ; `critBonus`/`butinChoix`/`bossNiveau` en **somme** ; le reste en **produit**. Bornes avant sceau : `equipeMax ≥ 1`, `critBonus ∈ [−0.2, 0.6]`, `degatsSubis ≥ 0.35`, `degatsInfliges ≥ 0.4`, `capture ≥ 0.4`, `expGain ≥ 0.4`, `argent ≥ 0.4`, `butinChoix ∈ [−1, 3]`, `bossNiveau ∈ [0, 9]`. **Le sceau s'applique après**, avec ses propres bornes.

### 14.2 Les 17 serments du pool de base (valeurs EXACTES)

| id | Nom | Effet |
|---|---|---|
| `lame` | Serment de la lame | dégâtsInfliges 1.2, dégâtsSubis 1.2 |
| `muraille` | Serment de la muraille | dégâtsSubis 0.78, dégâtsInfliges 0.88 |
| `audace` | Serment de l'audace | critBonus 0.2, soinInterdit |
| `chasse` | Serment de la chasse | capture 1.5, bossNiveau 2 |
| `solitude` | Serment de la solitude | equipeMax 4, expGain 1.5 |
| `plafond` | Serment du plafond | plafondChampion, expGain 1.5 |
| `troupe` | Serment de la troupe | expPartage, expGain 0.7 |
| `avarice` | Serment de l'avarice | argent 2, capture 0.7 |
| `abondance` | Serment de l'abondance | butinChoix 1, argent 0.66 |
| `honneur` | Serment de l'honneur | fuiteInterdite, dégâtsInfliges 1.1 |
| `endurance` | Serment de l'endurance | dégâtsSubis 0.9, expGain 0.75 |
| `defi` | Serment du défi | bossNiveau 3, butinChoix 2 |
| `patience` | Serment de la patience | expGain 1.34, dégâtsInfliges 0.9 |
| `meute` | Serment de la meute | capture 1.3, expGain 0.8 |
| `duel` | Serment du duel | equipeMax 3, dégâtsInfliges 1.34 |
| `prudence` | Serment de la prudence | argent 1.5, critBonus −0.1 |
| `vertu` | Serment de la vertu | soinInterdit, dégâtsSubis 0.8 |

### 14.3 Les 11 serments sous verrou — ouverts par les chasses

| id | Nom | Effet | Ouvert par |
|---|---|---|---|
| `arpenteur` | Serment de l'arpenteur | captureNiveau, dégâtsInfliges 0.75 | dixCroisees |
| `rempart` | Serment du rempart | fuiteInterdite, dégâtsSubis 0.7, critBonus 0.15 | sansPerte |
| `fureur` | Serment de la fureur | dégâtsInfliges 1.5, dégâtsSubis 1.5 | deuxBadges |
| `ermite` | Serment de l'ermite | equipeMax 2, expGain 2 | trenteAuCompte |
| `oeil` | Serment de l'œil juste | critBonus 0.4, bossNiveau 3 | quatreBadges |
| `collection` | Serment du collectionneur | capture 2, dégâtsInfliges 0.75 | douzeEspeces |
| `marche` | Serment du marché | butinChoix 3, argent 0.5 | unLegendaire |
| `silence` | Serment du silence | soinInterdit, fuiteInterdite, dégâtsSubis 0.66 | troisSerments |
| `fortune` | Serment de la fortune | argent 3, expGain 0.5 | badgeSousSerment |
| `titan` | Serment du titan | bossNiveau 5, dégâtsInfliges 1.5 | septBadges |
| `sacrifice` | Serment du sacrifice | equipeMax 3, soinInterdit, dégâtsInfliges 1.34, capture 1.34 | ligue |

**Offre** : Fisher-Yates sur le pool **plein**, puis filtre (déjà pris, verrou non ouvert, coût déjà payé). `partie.sermentsOuverts` vient des chasses ; **vide au Défi du jour**. Un serment se prend à chaque badge, il ne se reprend pas (8 arbitrages par voyage, 3 propositions).

### 14.4 Les sceaux de Kanto (`PokeSceaux`) — 8 paliers cumulatifs

Le Sceau n porte les règles 1..n ; un seul sceau s'ouvre par Ligue (ou 8 badges) franchie. **Le Défi du jour est toujours au sceau 0.**

| n | Nom | Effet (exact) |
|---|---|---|
| 1 | Sceau de la Roche | bossNiveau 2 |
| 2 | Sceau de la Cascade | equipeMax 5 |
| 3 | Sceau de la Foudre | plafondChampion |
| 4 | Sceau du Prisme | dégâtsSubis 1 + 1/7 (≈1.142857) |
| 5 | Sceau de l'Âme | capture 0.75 |
| 6 | Sceau du Marais | bossNiveau 3 |
| 7 | Sceau du Volcan | expGain 0.8 |
| 8 | Sceau de la Terre | dégâtsInfliges 0.9 |

`appliquer(effet, n)` : applique 1..n par-dessus l'effet des serments, puis reborne : `butinChoix ∈ [−2, 3]`, `bossNiveau ∈ [0, 14]`, `argent ≥ 0.2`, `expGain ≥ 0.3`, `capture ≥ 0.25`, `degatsSubis ≤ 2.2`, `degatsInfliges ≥ 0.3`.

### 14.5 Les acquis (`PokeAcquis`)

Le **pendant exact du serment** : le serment est le PRIX du badge (imposé), l'acquis est un GAIN du voyage (choisi — on renonce à deux autres). Chaque acquis pousse les **mêmes clés** que les serments (aucune clé neuve → aucune branche morte). Un acquis emporté par voyage (`GARDES_MAX = 1`, jamais au Défi). Listés dans `acquis.js` (ex. « Le coup d'œil du pêcheur » = capture ×1,3 — les noms sont ceux du monde, pas des étiquettes de statistique).

### 14.6 La règle du jour (`PokeRegleDuJour`)

Fonction **pure de la date** : `REGLES[pokeGraineDe("POKE-REGLE-" + date) % 7]` (étiquette distincte de la carte `POKE-JOUR-`). Celle de **demain** est connue aujourd'hui (calcul en calendrier civil, années bissextiles à la main — pas d'objet `Date` dans le noyau).

| id | Nom | Effet |
|---|---|---|
| `chasse` | Journée de chasse | capture 2, expGain 0.8 |
| `mainLegere` | Main légère | equipeMax 3, expGain 1.5 |
| `pochesPleines` | Les poches pleines | argent 2, butinChoix 1 |
| `sangFroid` | Sang-froid | critBonus 0.25, dégâtsSubis 1.15 |
| `marcheForcee` | Marche forcée | bossNiveau 2, butinChoix 1 |
| `economieDeGuerre` | Économie de guerre | soinInterdit, argent 1.5 |
| `jourDesBraves` | Le jour des braves | dégâtsInfliges 1.25, dégâtsSubis 1.25 |

---

## 15. Les chasses

11 chasses jugées **au bilan** (fin de voyage), une seule fois par voyage ; chacune ouvre **un** serment verrouillé. `mesure(b, c)` rend `[fait, sur]` (jamais un booléen — l'écran affiche « 3/4 »).

| id | Nom | Condition (exacte) | Ouvre |
|---|---|---|---|
| `dixCroisees` | Dix croisées | `b.vus ≥ 10` (croiser, pas attraper) | arpenteur |
| `deuxBadges` | Deux badges | `b.badges ≥ 2` | fureur |
| `quatreBadges` | Quatre badges | `b.badges ≥ 4` | oeil |
| `septBadges` | Sept badges | `b.badges ≥ 7` | titan |
| `ligue` | La Ligue | `b.ligue` (Conseil 4 franchi) | sacrifice |
| `douzeEspeces` | Douze espèces | `b.pris ≥ 12` (dans un voyage) | collection |
| `trenteAuCompte` | Trente au compte | `c.pris ≥ 30` (espèces différentes, compte) | ermite |
| `unLegendaire` | Un légendaire | `b.legendaires.length ≥ 1` | marche |
| `troisSerments` | Trois serments | `b.serments.length ≥ 3` | silence |
| `badgeSousSerment` | Parole tenue | badges ≥ 3 et (solitude ou duel pris) | fortune |
| `sansPerte` | Aucun tombé | `b.badgesSansChute ≥ 3` (figé avant la 1re chute) | rempart |

---

## 16. Obtenir des Pokémon

### 16.1 Les portes (`PokeObtenir`)

- **Achat** : `prixDe(cle)`, `acheter(p, cle, combien)` (porte unique ; les CT vont dans `p.ct[n]`, PAS le sac), `inventaire(nomMart)` (filtre `ESCAPE_ROPE|REPEL|SUPER_REPEL|MAX_REPEL|POKE_DOLL` — « hors monde »), `martPour(p)` (acte → comptoir : Viridian a1, Pewter a2, Cerulean a3, Vermilion a4, Celadon c1 a5, Lavender a6, Fuchsia a7, Cinnabar a8, Indigo a9), `acheterJetons` (1 ₽/jeton), `lotsCasino` (drapeau `unique` = introuvable ailleurs).
- **Vitamines** : `VITAMINES = {HP_UP:"pv", PROTEIN:"atk", IRON:"def", CARBOS:"vit", CALCIUM:"spe"}`, `VITAMINE_GAIN = 2560`, plafond `statExp ≥ 25600`.
- **Super Bonbon** : `employerBonbon` — refusé au plafond de l'acte, effet borné à `niveau + 1`.
- **Rangement** : `ranger(p, mon)` — équipe si `equipeMax` le permet, sinon boîte.
- **« Où le trouver »** : `ouTrouver(version, n)` — pistes typées (`herbe`, `eau`, `peche`, `echange`, `casino`, `cadeau`, `fossile`, `dojo`, `ambre`, `arbre`, `errant`, `concours`, `depart`, `legendaire`, `statique`, `oeuf`, `evolution`), triées par taux décroissant, évolutions en dernier.

### 16.2 Le vivier de départ (`PokeDepart`)

Les 3 du canon (`Kanto [1,4,7]`, `Johto [152,155,158]`) + **toute première forme capturée sur le compte** (calculée depuis `e.evolue[].vers` — Pikachu est première forme en gen1 mais plus en gen2), moins les légendaires. `recevable(n)` : première forme ET pas légendaire. Au Défi du jour / PvP : **canon seul**. `mythe()` (Mew) : `pris ≥ 150 → "mew"` ; `pris ≥ 100 → "remue"` (le camion bouge) ; sinon `"rien"` (EVEIL = 100, total = 150, Mew exclu du seuil).

### 16.3 Le concours gen2 (`POKE_GEN2_CONCOURS` — Parc National)

Vivier : Chenipan 20 (7-18), Aspicot 20 (7-18), Chrysacier 10 (9-18), Coconfort 10 (9-18), Mimitor 10 (10-16), Paras 10 (10-17), Papilusion 5 (12-15), Dardargnan 5 (12-15), Scyther 5 (13-14), Scarabrute 5 (13-14) — Aéromite jamais tiré (rang terminateur). **20 Balls**, barème : pvMax 4, stats 1, pvRestants /8, objetTenu 1, dvBit 2, dvPoids {vit 1, spe 4, atk 8, def 16}. Prix : SUN_STONE / EVERSTONE / GOLD_BERRY / BERRY.

---

## 17. La partie

### 17.1 L'objet partie (`PokePartie.creer(config, h)`)

```js
{
  graine: h.source,
  version: "rouge" | "bleu" | "cristal",   // tirée : h.brut() < 0.5 → 1re version
  regles: "gen1" | "gen2",                  // scellé à la création
  genre: "f" | "h", nom, rival,
  regle: "voyage" | "express" | "nuzlocke",
  regleDuJour: <id> | null,
  compare: bool,                            // Défi du jour : verrouille vivier/compagnon/version
  acte: 1, rangee: 0, carteActe: null,
  noeudsVisites: {}, noeudsPerdus: {}, branchesPerdues: 0,
  argent: 3000,
  equipe: [], boite: [], badges: [], cles: {},
  sac: { POKE_BALL: 12, POTION: 3 },        // équilibré le 07/08
  vus: {}, pris: {}, etape: "bourg-palette",
  starter: null, starterRival: null,
  fossile: null, fossileRanime: false, jetons: 0, rivalVus: 0,
  echanges: {}, cadeaux: {}, legendaires: {},   // n → "pris" | "enfui"
  ligueGagnee: false, perdus: [],               // Nuzlocke
  fini: null,                                   // "vitrine" | "equipe" | "epuise" | "abandon"
  journal: [], mew: false, mewTraces: 0,
  serments: [], sermentsOuverts: {}, sceau: 0, acquis: [],
  ct: {}, echecsActe: {}, tombes: 0, badgesSansChute: 0,
  pension: null, texture: {},
}
```

### 17.2 Portes principales

- **Starter** : `choisirStarter(p, n, h)` — niv. 5 ; le rival prend `RIVAL_CONTRE[n]` (`{1:4, 4:7, 7:1}`).
- **Pokédex** : `voir(p,n)` / `prendre(p,n,zone,niveau)` ; **« vu » se pose dès la RENCONTRE**.
- **Atteignables** : `atteignables(version)` par version (herbes + eau + légendaires + statiques + pêche + canon + fossiles + cadeaux + casino + dojo + ambre + œufs + **point fixe** évolutions/échanges) — Kanto ~139/version (78 sauvages par version) ; **Mew jamais atteignable** (canon). `atteignablesToutes()` = union (Pokédex de compte).
- **Rencontre** : `rencontre(p, etape, milieu, h, {forcer, vise, dose})` — zone `h.dans`, taux `h.chance(bloc.taux × 100/187)`, créneau `h.pondere(bloc[version])`, niveau `max(creneau.niveau, vise − dose)` (jamais sous la table du ROM).
- **Carte** : `prendreNoeud(p, noeud)` — marque visité + **perd tous les autres nœuds de la rangée** ; `revenirAuNoeud(p)` (recule d'une rangée, les perdus restent perdus).
- **Pension** : `pensionDepot` (jamais le dernier Pokémon) / `pensionReprise` — à l'acte suivant : `niveaux = min(5, nœudsFaits − depuis)`, 100 ₽/niveau, plafonné par `plafondPour`.
- **Badge** : `gagnerBadge(p, arene)` — push `{ordre, badge, champion, acte}` ; `badgesActifs` via `badgesStat()`.
- **Défaite** : `horsCombat(p)` — perd la moitié de l'argent, équipe soignée. `echouerDansLActe(p)` — **`ESSAIS_BOSS = 2`** échecs par acte, au 2e → `fini = "epuise"`.
- **Nuzlocke** : `appliquerNuzlocke(p)` — l'équipe à terre part dans `perdus` ; équipe vide → `fini = "equipe"`.
- **Master Ball unique** : une seule dans tout le jeu (tour Silph) — 5 légendaires, il faut choisir.

### 17.3 Le score (`PokePartie.POIDS` + `scoreDeBilan`)

```js
POIDS = { badge: 40, ligue: 300, vu: 2, pris: 12, legendaire: 80,
          niveauEquipe: 2, acte: 45, nuzlocke: 1.5, express: 1.25, sceau: 0.1 }
```

`s = badges×40 + (ligue ? 300) + vus×2 + pris×12 + légendaires×80 + round(Σniveaux×2) + (acte−1)×45` ; puis `×1.5` (nuzlocke), `×1.25` (express), `×(1 + 0.1×sceau)` ; `max(0, round(s))`.

### 17.4 Le bilan (`PokePartie.bilan`)

Objet complet **lu par l'écran de fin, la carte de partage ET le classement** — une seule source (leçon du mode ninja : deux calculs divergent).

---

## 18. La progression de compte

`PokeProgression` (`localStorage "poke_progress"`) — **arbitrage du 07/08** : **les niveaux ne persistent PAS** (chaque voyage repart égal ; le Défi reste équitable), **la collection persiste** : Pokédex (vus + pris), **PC de Léo** (réserve d'individus, `PC_MAX = 120`), déblocages (règles de voyage, Balls de départ), **un compagnon** ramenable en carrière libre (jamais au Défi), diplômes par monde.

```js
{ v: 1, vus: {}, pris: {}, boite: [], pc: [],
  diplomes: {}, voyages: 0, ligues: 0, badgesMax: 0, meilleurScore: 0,
  chromatiques: {}, meilleurDV: {}, regles: { voyage: true },
  gardes: [], compagnon: null, duel: null, rivaux: [],
  defis: {}, genre: null, defiJour: null, defiHisto: [], chasses: {}, sceauMax: 0, sceauNeuf: 0 }
```

- `fusionner(partie, quand)` : **idempotente, non destructive** (vus/pris avec version et date, boîte 1 ligne/espèce, chromatiques, meilleurDV).
- `cloturer(partie, quand)` : une seule fois (`partie._clos`) — voyages/ligues/badgesMax/meilleurScore, déblocages (`badgesMax ≥ 4` → express ; `ligues ≥ 1` → nuzlocke), **sceau** : +1 cran si Ligue ou 8 badges et `joue ≥ sceauMax`, **chasses** évaluées.
- **Diplôme** : seuil **calculé** = espèces avec au moins une piste directe + point fixe d'évolutions dont la source s'attrape → **Kanto 150, Johto 214**. Mew/Célébi exclus.
- **Rang** : `maitre > ligue > confirme (≥8 badges) > dresseur (≥1 badge) > debutant`. **Aucun bonus** (rien ne pèse où l'on se compare).
- **Défi du jour** : un seul essai, `defiHisto` 30 jours, `serieDefis` (la série ne casse pas le jour même, calcul en UTC), `calendrierDefis` (trous compris).
- **Sauvegarde du voyage** (`poke_voyage`) : garde l'état de la graine (`etat`, `tirages`) pour une reprise honnête ; **jamais pour le Défi** (triche impossible).
- **PC vs boîte** : `pc` = la réserve (individus, compose l'équipe de duel), `boite` = le journal (une ligne par espèce).

---

## 19. La fusion nuage/local

`PokeFusion.fusionner(a, b)` — fichier **pur** (noyau) utilisé par le client ET le serveur. Règle de fer : **ne peut jamais rendre moins que ce qu'elle reçoit**. Politiques par champ :
- `vus: "union"` · `pris: "unionTot"` (la fiche la PLUS ANCIENNE gagne) · `boite/pc: "parCle"` (union par identité `voyage#rang`, plafond PC_MAX 120) · compteurs `"max"` · `chromatiques/diplomes/chasses: "unionTot"` · `meilleurDV: "maxPar"` · `regles: "union"` · `gardes: "local"` (un acquis emporté ne se fusionne pas) · `compagnon: "siVide"` · `duel: "duel"` (le voyage mené le plus loin) · `defis: "maxVD"` · `defiJour: "jour"` (date la plus récente ; « fini » gagne à date égale) · `defiHisto: "histo"` (union par date, 30) · `sceauNeuf: "local"`.

`assainir(p)` (serveur, AVANT fusion) : borne toutes les formes (espèces ≤ dexCompte, niveaux 1-100, badges ≤ 8, sceauMax ≤ 8, chaînes tronquées…). Les deux côtés unissent, **personne ne remplace** — c'est ce qui rend l'ordre des écritures sans importance.

---

## 20. Rejeu, classement, duels

### 20.1 Le rejeu serveur (`PokeRejeu.replayDaily(date, journal)`)

Le serveur ne rejoue PAS le voyage tour par tour : il recalcule le **score** depuis un **résumé** (journal[0]) après `normaliser` — on vérifie que l'arrivée est atteignable, pas le chemin. Bornes :
- `LIMITES = { badges: 8, acte: 9, equipe: 6, niveau: 100, especes: 151, legendaires: 5 }` ;
- `badges ≤ acte−1` ; `ligue` seulement si `badges==8 && acte==9` ;
- espèces plafonnées par la version du jour (`prisesMaxDuJour`) **et** par l'acte (`ceil(max × (acte+2)/11)` : acte 1 → 38, acte 4 → 76, acte 9 → 139) ;
- `pris ≤ vus` ; légendaires filtrés par `acteDuLegendaire()` (Artikodin acte 7, Électhor 8, Sulfura 9, Mewtwo épilogue) ;
- niveaux bornés par `plafondNiveau(acte)` (max des plafonds d'acte + `MARGE_SERMENTS = 20` ; acte 9 → 100) ;
- `dureeMinimale = (acte−1)×40s + badges×25s` (anti-soumission instantanée ; voyage complet ≈ 520 s) ;
- `nomDeRepli` : « Dresseur 1000..9999 » stable.

### 20.2 Le classement (`PokeClassement`)

- 3 appels dans l'ordre : `POST /device` (pid signé) → `POST /daily/start` (consomme l'essai, jeton daté) → `POST /daily` (le serveur recalcule et refuse les incohérences : `score_mismatch`). Lecture `GET /daily`.
- **Cercle de dresseurs** (clan) : code 8 caractères, 50 dresseurs max, 10 cercles créés max, classement hebdomadaire (depuis lundi, somme des meilleurs Défis).
- `pokedexSynchroniser()` : `GET /poke/sync` → fusion locale → `POST /poke/sync` avec le fondu → réadoption du fondu serveur. Panne → silencieux.

### 20.3 Les duels (`PokeDuel`) — PvP asynchrone sans serveur de match

Épingle sur la **gen1** (`DUEL_REGLES = "gen1"`). `sceller(partie)` : `{v:1, equipe:[{n, niveau, dv, statExp, attaques:[clés]}]}` (6 max). `valider` refuse : équipe trop grande, espèce inconnue, niveau hors bornes (1-100), attaques invalides, DV hors bornes (0-15). **Aucun avantage de compte** (ni compagnon, ni objet, ni badge).

- `graineDuel(idA, idB, jour)` : `"POKE-DUEL-" + jour + "-" + min + "-" + max` (ordre fixe → même combat des deux côtés).
- `choisir(etat, cote, h)` : politique déterministe — changer si l'actif < 25 % PV et un remplaçant encaisse mieux (`pire < 0.6 × pire(actif)`) ; sinon note chaque attaque `puissance × efficacité × STAB 1.5` (statut = 30, inutile = 0) et joue la meilleure.
- `jouer` : boucle max **500 tours** (garde `duel_sans_fin`), **double K.O. tranché par la graine** (le siège ne décide jamais).
- **Code d'équipe** : format compact base 36 `PKD1 | empreinte | nom | mon1~mon2…` ; `empreinte()` = hash des tables (un code périmé est refusé) ; palmarès marqué `p` à côté du scellé.
- **Défis de Kanto** : les 8 arènes + 4 Conseil + le Maître, graine fixe `"POKE-DEFI-" + id` → échelle PvE identique pour tous.

---

## 21. Écran de fin et carte de partage

- `PokeFin.afficher(hote, partie, surRejouer, surDuel, neuf, rangMonte)` : titre selon `b.fini` — `equipe` → « LE VOYAGE S'ACHÈVE », `epuise` → « LA ROUTE S'ARRÊTE ICI », `abandon` → « TU RENTRES », sinon « LA VITRINE DES MAÎTRES » (le Hall of Fame : 6 Pokémon enregistrés, badges, Pokédex, temps).
- Contenu : phrase de fin, verdict (`motDeFin`), **le mur** (Champion suivant : « ton niveau contre le sien »), vitrine de l'équipe (`data-ko` pour les tombés), légendaires, ouverture du vivier, **prochaine chasse** (barre + serment ouvert), chasses décrochées, échelle des sceaux, règle du jour (défi), rang, **acquis à emporter** (choix/rendre), score, actions (rejouer/duel).
- **Carte de partage** (`carte-partage.js`) : lit le **même** `bilan` — canvas, **aucun emoji** (le ♀/♂ des Nidoran est testé au lieu d'être supposé) ; le mot de la carte + sa date permettent de comparer (un score ne veut dire que sur la même carte).

---

## 22. Le son

**Aucun fichier audio.** Les sons de Rouge/Bleu sont des **programmes pour l'APU du Game Boy** (`POKE_SONS`) :

```js
W.POKE_SONS = {
  sfx:      { "<nom>": [ {c: canal, d: rapport, m: motif, s: balayage, n: [[type, longueur, volume, fondu, période], ...]}, ... ] },
  cris:     { "<n° Pokédex>": [son de base, décalage, durée] },
  attaques: { "<clé attaque>": [son, décalage, tempo] },
  ondes:    [32 valeurs de 4 bits],        // forme d'onde du canal 3
  hauteurs: [12 demi-tons signés 16 bits],
};
```

Codes de commande : `0` note carrée · `1` bruit · `2` silence · `3` note · `4` type · `5` octave · `6` tempo · `7` rapport cyclique · `8` motif · `9` vibrato · `10` justesse parfaite · `11` glissando · `12` volume · `13` balayage · `14` dialecte musical.

`audio.js` porte la **puce** (émulation échantillon par échantillon) : 4 canaux matériels (2 ondes carrées à rapport cyclique 12,5/25/50/75 %, 1 onde programmable 32×4 bits, 1 bruit LFSR), enveloppes, balayage, vibrato. Constantes : `IMAGE = 59.7275` images/s, `ENVELOPPE = 64`, `BALAYAGE = 128`, sur-échantillonnage 2. Fréquence `131072/(2048−période)` Hz ; note musicale `131072/|hauteur >> (octave−1)|`. Durée d'une note = `(longueur+1)` images avec partie fractionnaire (sinon les notes dérivent). **Rendu hors ligne** (AudioBuffer) puis rejoué — pas d'oscillateurs planifiés. Le contexte ne démarre jamais avant un geste. Volume 0.55, bouton muet. `gen2/sons.js` + `gen2/sons-attaques.js` : les programmes de 1999.

---

## 23. Les animations de combat

### 23.1 Les données

Les animations **rejouent les scripts des ROMs** (portés par `tools/poke-animations.mjs`) : position de chaque tuile, ordre des images, délais = le ROM, rien n'est inventé.

- **gen1** (`POKE_ANIM`) : `{bases: [[x,y]...], blocs: {...}, sous: {...}, attaques: {...}, effets: {...}}` — `bases` = ancrages en pixels ; `blocs` = images (tuiles `{x,y,t,fx,fy}`) ; `sous` = sous-animations `{t, i:[[bloc, ancrage, mode]...]}` ; `attaques` = suite de pas du ROM `{s,p,d}` (sous-anim, planche, délai) ou `{e,nom}` (effet d'écran) ; `effets` = noms (rien ne disparaît en silence). Tuiles : **2 planches** `anim/move_anim_0.png` + `_1.png` (16×5 tuiles de 8 px), le nom d'origine dit laquelle (`Subanim_0Star`, `Subanim_1Flames`).
- **gen2** (`POKE_ANIM_GEN2`) : 31 planches `BATTLE_ANIM_GFX_*` → `anim/gen2/*.png` avec `{fichier, tuiles, etiquette, img, l, h}`, OAM sets `BATTLE_ANIM_OAMSET_*` (frames `{x,y,t,fx,fy}`), scripts par attaque.

### 23.2 Le lecteur (`anim-attaque.js` / `gen2/anim-attaque.js`)

- Hiérarchie : ATTAQUE = suite de PAS ; PAS = sous-animation (planche + délai) ou effet d'écran ; SOUS-ANIM = suite d'IMAGES ; IMAGE = bloc de tuiles à un ancrage ; TUILE = 8×8 px.
- **Échelle** : dessin dans le repère exact du Game Boy (160×144) puis mise à l'échelle d'un bloc (aucune conversion de coordonnées qui décalerait d'un pixel).
- **Fond blanc** : planches en trait noir sur blanc (4 gris) superposées en `multiply` sur scène blanche — le blanc disparaît, le trait reste, aucun détourage (le détourage avait mangé le corps du Pikachu de dos).
- Les effets d'écran sont **comptés, jamais tus** (mesuré : seuls 40 des 198 effets étaient rendus au début).

---

## 24. L'interface

### 24.1 Les 42 écrans (`ui.js`, 281 fonctions)

`ecranAcquis, ecranArene, ecranBoite, ecranBoutique, ecranButin, ecranCadeau, ecranCamion, ecranCapsule, ecranCarnet, ecranCasino, ecranCentre, ecranCombat, ecranConcours, ecranDefaite, ecranDefi, ecranDeuxChemins, ecranDojo, ecranDuel, ecranEchange, ecranEpilogue, ecranEpilogueChoix, ecranFossile, ecranJournal, ecranJuge, ecranLigue, ecranMonde, ecranMontees, ecranMusee, ecranNouveautes, ecranOeuf, ecranOublier, ecranPc, ecranPension, ecranPrise, ecranRangMonte, ecranRanimation, ecranRanimeAmbre, ecranRival, ecranSac, ecranSafari, ecranSerment, ecranSommet`

+ l'accueil (Bourg Palette : COMMENCER, DÉFI DU JOUR, DUEL, CLASSEMENT, MON CERCLE, CARNET DE CHASSE, NOUVEAUTÉS, CONNEXION, vitesse des combats, langue). `PokeUI` expose `T` (traduction), `carte()`. `PokeUICombat` expose `Ecran`, `mettreEnMots` (messages), `nomDe`, `nomBall`, `sprite`, `NON_DITS`.

### 24.2 Le Pokédex (`PokePokedex`)

Trois états, lisibles **sans couleur** : silhouette noire = jamais croisé ; portrait gris = **vu** ; portrait couleur = capturé. La grille s'étend au total du compte (`PokeRegles.especeToute` — un joueur revenu de Johto a des espèces >151 dans son Pokédex en plein Kanto).

### 24.3 Infobulles, pictogrammes, sprites

- **Infobulles** (`PokeInfobulles`) : l'appareil du Pokédex en petit (cadre de métal, vitre, chasse fixe), la même partout ; **sans donnée réelle, pas d'infobulle** (null) ; survol + clavier + tactile.
- **Pictogrammes** (`PokeIcones`) : **aucun emoji** (`poke-design.mjs` fait échouer la livraison) ; SVG sur grille de 24, trait de 2, bouts arrondis, `currentColor` ; un pictogramme ne remplace jamais son libellé.
- **Sprites** (`PokeSprites`) : `face(n)`/`dos(n)` → `assets/img/poke/face|dos/<n>.png`, ou `gen2/...` selon la règle : **au-delà de 151, le sprite n'existe que dans le dossier 1999 ; en deçà, il suit le monde joué** ; artworks `art/<n>.webp` (1-251) ; portraits `dresseur/<nom>.png` (un chemin avec barre oblique est complet, un nom nu va dans le dossier 1996).

### 24.4 Le genre du joueur (`PokeGenre`)

Textes sans accord dans `fr`/`en` ; textes avec accord dans `frF` (et `enF` si besoin). Jetons courts : `{e}`, `{ne}` (champion/championne), `{il}`, `{le}`, `{un}`, `{ce}`, `{joueur}`. **Élision** : `{de|champion}` → « d'Ondine » si voyelle (liste : de, le, la, ce, que, ne, se, te, me, je ; l'anglais n'élide pas ; le « h » n'est pas traité). **Accord en nombre** : `{n|rencontre|rencontres}` — FR : 0 au singulier ; EN : seul 1. `tools/poke-genre.mjs` fait échouer la livraison sur un texte masculin sans variante féminine.

### 24.5 Le tempo (`PokeTempo`)

`apres(ms, fn)` remplace `setTimeout` partout où le délai peut valoir 0 : à 0 ms → `MessageChannel` (un `setTimeout(0)` dans un onglet en arrière-plan vaut **1 seconde** — règle Chrome — ce qui ralentissait le harnais de test des heures). Au-dessus de 0, minuteur normal.

---

## 25. PWA, hors-ligne, versions

- **Manifeste** : celui du site (`/manifest.json`), start_url = accueil (à dessein — un manifeste propre au mode annoncerait le mode fermé). `theme-color #0d1420` (marine du mode).
- **Service worker** : `/service-worker.js` enregistré par `gate.js` même mode fermé ; le mode est installable et jouable hors ligne.
- **Veille de version** : bandeau « Une nouvelle version est sortie » (rechargement volontaire), forçage d'autorité seulement via `momentSur()` (état scellé), une tentative par version. `PokeVeille = {momentSur, perimee}`.

---

## 26. Outillage & contrôles

Générateurs (`node tools/poke-*.mjs`) et **contrôles de livraison qui font échouer le build** :
- `poke-rng.mjs` : interdit `Math.random`/`Date.now`/`new Date()` dans `js/poke/` ;
- `poke-genre.mjs` / `poke-elision.mjs` : accord de genre + élisions ;
- `poke-design.mjs` : interdit les emojis dans le chrome ;
- `poke-infobulles.mjs` : une infobulle sans donnée réelle ne s'affiche pas ;
- `poke-serments.mjs` : prouve qu'aucune clé d'effet déclarée n'est morte ;
- `poke-sim.mjs` (harnais) : simule des voyages entiers à zéro de rythme (grâce à `PokeTempo`) ;
- détecteur de **portes mortes** (fonction exportée que rien n'appelle) ;
- `poke-fusion.mjs`, `poke-sac.mjs`, `poke-fins.mjs`, `poke-chasse-sans-perte.mjs`, `poke-collection-ne-perd-rien.mjs`, `poke-gen2-close.mjs`, `poke-gen2-errants.mjs`, `poke-rival.mjs`…

**La doctrine** : *une mécanique branchée sur une porte existante ne peut pas avoir de branche morte* — tout effet (serment, sceau, acquis, règle du jour) pousse des clés que le combat, le butin, la capture et l'expérience lisent déjà.

---

## 27. Écarts au canon (déclarés dans le code)

**Gen1 :**
1. Spectre super efficace contre Psy (bug 1996 corrigé, `POKE_TYPE_ECARTS`).
2. Dégel naturel : 10 %/tour (`DEGEL_NATUREL`).
3. Pas de raté 1/256 : précision 100 % = toujours toucher.
4. `RYTHME = 4.3` + `facteurNiveau` (bosse de rattrapage, plafonné à 42) — expérience accélérée (jeu de 40 min).
5. Nombre de secousses de capture déduit (pas l'algorithme de secousses du ROM).
6. Multi Exp. = « Exp. Share moderne » (le combattant garde tout, les autres la moitié).
7. Master Ball unique (hors canon).
8. Chromatique desserré : **1/2048** au lieu de 1/8192.
9. Jeton de casino à 1 ₽ (le ROM disait 10).

**Gen2 :** aucun écart de table (`POKE_GEN2_TYPE_ECARTS = []`) ; Conversion 2 prend le premier type résistant au lieu d'un tirage (divergence écrite et assumée) ; météo sans tirage ; pas d'horloge (Mentali/Noctali : l'écran choisit).

**Équilibrage mesuré (repères)** : murs visés — Erika ~7 %, Koga ~3 % à niveau égal ; Ligue ~10-18 % ; attrition ~42 % des débutants à l'acte 2 ; médiane 3-4 badges ; `ESSAIS_BOSS = 2` (3→2 le 15/08 : parcours complets 27,7 % → 17,2 %) ; argent départ 3000 ₽ ; dresseur `300 + equipe.length×250` ; médiane de bourse devant légendaire ~12 593 ₽.

---

## 28. Pièges à préserver lors de la réécriture

1. **Le contrat de rejeu** : tout tirage ajouté/retiré doit être compensé ; les verrous datés (`avantLe`) protègent les parties en cours.
2. **Le canon est la loi** : équipes/niveaux des Champions et du Conseil 4 viennent des ROMs ; on ne les adoucit pas. On règle la ROUTE, jamais le MUR.
3. **Une CS ne s'emploie pas sans son badge** — c'est ce qui fait la vraie progression.
4. **`exige` est documentaire sur la carte** : `pokeOuverture` existe mais `generer()` ne filtre pas les scènes par elle (une carte à embranchements peut ne pas avoir pris la branche qui donne la clé).
5. **Statistiques gen2** : `sat`/`sdf` partagent `dv.spe`/`statExp.spe` ; jamais de table de stats en dur (venir du registre), sous peine de NaN.
6. **Toxik** se reconnaît par son nom ; **Riposte** aussi ; les clés d'effet portent leur suffixe (`FREEZE_SIDE_EFFECT1`).
7. Le **clone** intercepte tout (dégâts + statuts + paliers + peur + confusion + graine) ; la **Brume** bloque les baisses à 100 %.
8. `poserPv` est la seule porte d'écriture des PV ; `entrerEnJeu` la seule porte d'entrée ; `finDeTour` le seul endroit qui conclut ; tout événement de changement porte **les PV de l'instant**.
9. Les scènes du canon ne se tirent pas (posées d'abord) ; les poids 20/20/15/10/10/10/5/5/4/1 ne s'arrondissent pas ; le niveau du ROM est toujours un plancher.
10. **Johto n'a ni fossiles, ni Dojo, ni Musée** (→ null), mais il a errants, arbres, œufs, concours, Master Ball (repaire Rocket) et Red au Mont Argenté.
11. Un nœud annonce son contenu avant le choix — y compris les taux (2 communes + 1 rare) et la statistique entraînée.
12. Les données générées ne se corrigent jamais à la main (générateurs).

---

## 29. Arborescence

```
rtl-pokemon/
├── index.html              # la page du mode (pokemon.html d'origine)
├── css/poke.css            # styles du mode (~410 Ko)
├── js/poke/                # le jeu
│   ├── gate.js             # verrou + injecteur + veille + service worker
│   ├── ordre.js            # LA liste de chargement (NOYAU/ECRANS/GEN2)
│   ├── <31 NOYAU>          # données + règles (rejouées par le serveur)
│   ├── <16 ECRANS>         # interface
│   └── gen2/               # 17 fichiers noyau + 2 écrans
├── assets/img/poke/
│   ├── face/1-151.png, dos/1-151.png   # sprites gen1 (1996)
│   ├── art/1-251.webp                  # artworks officiels
│   ├── dresseur/*.png                  # portraits
│   ├── anim/move_anim_0-1.png          # tuiles d'anim gen1 (16×5 × 8px)
│   ├── anim/gen2/*.png                 # 31 planches d'anim gen2
│   └── gen2/face|dos/152-251.png, gen2/dresseur/arene1-8 + conseil1-4
├── patchnotes-poke.json    # notes de version (écran NOUVEAUTÉS)
├── manifest.json           # manifeste du site
├── NOTES-MOTEUR-COMBAT.md  # analyse exhaustive du moteur (720 lignes)
├── NOTES-MONDE-VOYAGE.md   # analyse exhaustive du monde (489 lignes)
├── docs/notes-techniques-meta.md  # analyse exhaustive des systèmes méta (552 lignes)
└── README.md               # ce document
```

---

*Document établi le 25/08/2026 à partir du miroir v=773. Les dumps JSON indentés de toutes les globales du noyau ont été générés par chargement dans Node (VM) — voir `notes-data/POKE_*.json` (à régénérer par `node notes-data/dump.js`).*
