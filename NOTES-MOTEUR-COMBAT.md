# Notes techniques — Moteur de combat « Road to Legends » (Pokémon)

Analyse du moteur de combat du fan game « Road to Legends » (2 générations : Kanto 151 / Johto 251, FR/EN), destinée à servir de base à une réécriture complète par IA (« vibe-coding »).
Toutes les formules sont citées **telles quelles** depuis le code source (`js/poke/`), avec leurs constantes exactes.

> 🔴 **Principe fondateur du code** : le serveur *rejoue* toute la partie à partir du journal des choix du joueur pour valider son score. **Tout** le hasard passe par `PokeHasard` (une seule graine), et **le nombre et l'ordre des tirages font partie du contrat de rejeu**. Ajouter/retirer un tirage casse le rejeu. Les fichiers « moteur » (`moteur.js`, `combat.js`, `capture.js`, `rng.js`) sont **purs** : aucun DOM, aucun texte — ils rendent des listes d'**événements** structurés (`{t: "...", ...}`) que l'interface met en mots.

---

## 1. Architecture et globaux

Tous les fichiers sont des **IIFE** : `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`

| Fichier | Rôle | Globale exportée |
|---|---|---|
| `js/poke/moteur.js` | Créatures : stats, DV, expérience, évolutions (pur) | `W.PokeMoteur` |
| `js/poke/combat.js` | Tour par tour gen 1 (pur, 215 KB) | `W.PokeCombat` |
| `js/poke/capture.js` | Capture (pur) | `W.PokeCapture` |
| `js/poke/rng.js` | Hasard déterministe (mulberry32) | `W.PokeHasard`, `W.PokeChoix`, `W.pokeGraineDe`, `W.pokeAvantLe` |
| `js/poke/types.js` | Table de types gen 1 (généré) | `W.POKE_TYPES`, `W.POKE_TYPE_NOMS`, `W.POKE_TYPE_TABLE`, `W.POKE_TYPE_ECARTS`, `W.POKE_TYPES_SPECIAUX` |
| `js/poke/eclat.js` | Chromatique + grades de DV | `W.PokeEclat` |
| `js/poke/genre.js` | Textes FR/EN, genre, accords | `W.PokeGenre` |
| `js/poke/attaques.js` | 165 attaques gen 1 (généré) | `W.POKE_ATTAQUES`, `W.POKE_ATTAQUE_PAR_CLE` |
| `js/poke/especes.js` | 151 espèces gen 1 (généré) | `W.POKE_ESPECES`, `W.POKE_ESPECE` |
| `js/poke/gen2/types.js` | Table de types gen 2 (généré, non chargé) | `W.POKE_GEN2_TYPES`, `W.POKE_GEN2_TYPE_TABLE`, `W.POKE_GEN2_TYPES_SPECIAUX`, … |
| `js/poke/gen2/effets.js` | Traduction noms d'effets gen2→gen1 (non chargé) | `W.POKE_GEN2_EFFETS`, `W.POKE_GEN2_EFFETS_NEUFS` |
| `js/poke/gen2/effets-neufs.js` | Mécaniques gen2 : météo, drapeaux, paliers, pièges (non chargé) | `W.POKE_GEN2_EFFETS_NEUFS_TABLE` |
| `js/poke/gen2/attaques.js` | Attaques gen 2 (généré, non chargé) | `W.POKE_GEN2_ATTAQUES`, `W.POKE_GEN2_ATTAQUE_PAR_CLE` |
| `js/poke/gen2/especes.js` | 251 espèces gen 2 (généré, non chargé) | `W.POKE_GEN2_ESPECES`, `W.POKE_GEN2_ESPECE`, `W.POKE_GEN2_A_MODELISER`, `W.POKE_GEN2_DEX_FR_REPLIE` |
| `js/poke/gen2/objets-tenus.js` | Objets tenus gen 2 (non chargé) | `W.POKE_GEN2_TENUS`, `W.POKE_GEN2_TENUS_HORS_DE_PORTEE` |
| `js/poke/regles.js` | **Registre** `W.PokeRegles` : aiguille moteur vers gen1 ou gen2 | `W.PokeRegles` |

### Le registre `W.PokeRegles` (la couture gen1/gen2)

Le moteur ne sait **jamais** sous quelle génération il tourne : il demande tout au registre. Méthodes lues par le moteur :
`table()`, `speciaux()`, `especes()`, `attaques()` (index par clé), `attaquesListe()` (tableau), `tenus()`, `objetsTable()`, `effetsNeufs()`, `speAtk()`, `speDef()`, `sexeDe(p)`, `professeur(lang)`, `nomVersion(cle)`, `stats()`.
- Gen 1 : `speAtk()` = `"spe"`, `speDef()` = `"spe"` (une seule Spéciale) ; `tenus()` = `null` ; `effetsNeufs()` = `null`.
- Gen 2 : `speAtk()` = `"sat"`, `speDef()` = `"sdf"` ; `tenus()` = `W.POKE_GEN2_TENUS` ; `effetsNeufs()` = `W.POKE_GEN2_EFFETS_NEUFS_TABLE`.

⚠️ **Rien ne charge `js/poke/gen2/`** : la gen 2 est écrite en entier mais fermée aux joueurs (outil `tools/poke-gen2-close.mjs`). Les globales gen2 sont préfixées `POKE_GEN2_` pour ne jamais écraser celles de la gen 1.

---

## 2. Le hasard — `rng.js`

- Générateur **mulberry32**, identique au bit près navigateur/Node.
- Graine : `graineDe(texte)` → hash type FNV : `h = 1779033703 ^ longueur` puis par caractère `h = Math.imul(h ^ charCode, 3432918353); h = (h<<13)|(h>>>19)` ; retour `h >>> 0`.
- `Hasard(graine)` : `etat = (string ? graineDe : graine>>>0) || 1`, compteur `tirages` (permet de situer une divergence de rejeu), `source`.
- `brut()` : `etat = (etat + 0x6d2b79f5) >>> 0` ; `t = imul(t ^ (t>>>15), t|1)` ; `t ^= t + imul(t ^ (t>>>7), t|61)` ; retour `((t ^ (t>>>14)) >>> 0) / 4294967296`.
- `entier(n)` = `floor(brut()*n)` (dans `[0, n[`, **une** consommation). `entre(a,b)` = `a + entier(b-a+1)`. `chance(pourcent)` = `brut()*100 < pourcent`. `pondere(liste, champ="poids")` consomme **exactement 1 tirage** quel que soit le contenu. `dans(liste)`, `melange(liste)` (Fisher-Yates, n−1 tirages), `derive(etiquette)` (sous-générateur : `graineDe(source + "|" + etiquette)`).
- **Verrous datés** : `avantLe(dateGraine, borne)` = `String(dateGraine) <= String(borne)` — une règle qui change le tirage est verrouillée pour les parties déjà commencées.
- `W.PokeChoix` : combinatoire « k parmi n » en un seul tirage (`combien`, `deRang`) pour les cartes à choix multiples.

---

## 3. Créatures — `moteur.js`

### Statistiques (formule gen 1 exacte)

```js
function terme(base, dv, statExp) {
  var e = Math.floor(Math.min(255, Math.ceil(Math.sqrt(statExp || 0))) / 4);
  return (base + dv) * 2 + e;
}
// PV  : floor(terme(b.pv, d.pv, e.pv) * L / 100) + L + 10
// atk/def/vit/spe : floor(terme(...) * L / 100) + 5
```

- Gen 2 : les deux spéciales partagent **la même DV et la même statExp** (`dv.spe`, `statExp.spe` uniques — comme le ROM de 1999) ; le calcul lit `b[SPE_ATK()]`/`b[SPE_DEF()]` (`sat`/`sdf` en gen 2). Aucun tirage supplémentaire.

### Valeurs déterminantes (DV)

```js
// atk, def, vit, spe = h.entier(16) chacun ; la DV des PV se DÉDUIT :
var pv = ((atk & 1) << 3) | ((def & 1) << 2) | ((vit & 1) << 1) | (spe & 1);
```

### Courbes d'expérience (`expTotalePour(croissance, n)`, n≤1 → 0, c = n³)

| Croissance | Formule |
|---|---|
| `rapide` | `floor(4c/5)` |
| `lente` | `floor(5c/4)` |
| `moyenne_lente` | `max(0, floor((6/5)c − 15n² + 100n − 140))` |
| `moyenne` (défaut) | `c` |

`niveauPourExp(croissance, exp)` : boucle `n` de 1 à 99 tant que `expTotalePour(n+1) <= exp`.

### Jeu d'attaques au niveau (`attaquesAuNiveau`)

Garde les **4 dernières** attaques : `depart` + `apprend` (paires `[niveau, clé]` par ordre croissant, `break` dès `app[i][0] > niveau`), dédoublonnées, puis `liste.slice(-4)`. Chaque entrée : `{cle, pp, ppMax}`.

### Création (`creer(n, niveau, h, options)`)

Champ du Pokémon créé : `n`, `surnom`, `niveau`, `dv`, `statExp` (5 cases à 0), `exp = expTotalePour(croissance, niveau)`, `attaques`, `statut` (null | `"para"` | `"brulure"` | `"gel"` | `"sommeil"` | `"poison"` | `"poisonGrave"`), `statutTours`, `echange` (booléen), `capture` ({zone, niveau}), `objet` (objet tenu, gen1 = null), puis `stats = calculerStats(p)`, `pv = stats.pv`.

**Objet tenu sauvage** (gen 2, 61 espèces concernées) — 2 tirages, constants : `OBJET_RIEN = 0.75`, `OBJET_RARE = 0.08`.
```js
if (h.brut() < OBJET_RIEN) return null;          // 75 % : rien
return h.brut() < OBJET_RARE ? b : a;            // 8 % du quart : objet rare ; sinon objet commun
```
Rencontres fixes : `options.objetForce` → objet 1 **à coup sûr** sans tirage (Ho-Oh/Lugia/Ronflex du ROM, `BATTLETYPE_FORCEITEM`). En gen 1, la porte rend `null` **avant** tout tirage (rejeu Kanto intact).

### Gain d'expérience — `gainExperience(vaincu, participants, serments, opt)`

```js
var brut = Math.floor((e.exp * vaincu.niveau * RYTHME * facteurNiveau(vaincu.niveau)) / 7);
if (opt.dresseur) brut = Math.floor(brut * 1.5);          // combat de dresseur = ×1,5 (canon)
var part = Math.floor(brut / Math.max(1, participants));  // TOUS les combattants, divisé
if (opt.gagnant.echange) part = Math.floor(part * 1.5);   // Pokémon échangé = ×1,5 (canon)
if (serments && serments !== 1) part = Math.floor(part * serments);
return Math.max(1, part);
```

- `RYTHME = 4.3` — **écart au canon assumé** (réglage de rythme d'une partie de 40 min ; la formule brute du ROM `/7` rendait le jeu infini).
- `facteurNiveau(niveau)` — la « bosse de rattrapage » (écart au canon, mesuré sur 900 voyages) :
```js
n <= 8        : (2.5 + (niveau - 5) / 3) / 6
n <= 14       : (3.5 + 6 * Math.pow((niveau - 8) / 6, 0.75)) / 6
n <= 20       : (114 - 7 * (niveau - 14)) / 72     // NIVEAU_NEUTRE = 20
n <= 42       : Math.pow(niveau / 20, 1.25)        // NIVEAU_PLEIN = 42
sinon         : Math.pow(42/20, 1.25) * Math.pow(niveau/42, 0.35)  // PENTE_HAUTE = 0.35
```

- `gagnerStatExp(p, vaincu)` : `statExp[k] = min(65535, statExp[k] + base[k])` du vaincu, pour **toutes** les cases de `statExp` (case `spe` alimentée par `sat`/`sdf` selon le monde ; une base absente ne verse rien — garde anti-NaN). Pas de plafond par stat, plafond global 65535.
- `appliquerExperience(p, gain, plafond)` : borne `min(100, plafond>0 ? plafond : 100)` ; l'expérience **rentre quand même** sous plafond (rattrapage au niveau suivant) ; rend des événements `{type:"niveau"|"attaque"|"evolution"|"plafond"}`. Une seule proposition d'évolution par lot ; le moteur **signale** l'évolution, l'écran décide (bouton B).
- Évolutions : `evolutionParNiveau` (`ev.par==="niveau" && niveau>=ev.niveau`), `evolutionParPierre` (`par==="pierre" && ev.objet===objet`), `evolutionParEchange`, `evolutionParStat` (Debugant : compare les **stats dérivées** `atk<def|atk>def|atk=def` au niveau requis, champ `ev.compare`), `evolutionsParBonheur` (seuil `BONHEUR_SEUIL = 1500` = somme des statExp ; toutes les voies rendues, l'écran choisit — pas d'horloge dans le mode).
- `faireEvoluer(p, vers)` : change `p.n`, `exp = max(exp, expTotalePour(croissance, niveau))`, recalcule les stats (les PV max gagnés s'ajoutent aux PV courants, bornés), propose les attaques de niveau 1 de la nouvelle espèce.
- `especeAuNiveau(n, niveau)` : suit la chaîne d'évolution **par niveau** (et par stat sur les **bases**) — sert aux dresseurs hissés au niveau.
- `poserPv(p, v, ou)` : **porte unique** d'écriture des PV — borne `[0, max]`, refuse tout non-nombre (`v !== v`) en enregistrant un « incident » (`pvIncoherent`, pile capturée, liste `PV_INCOHERENTS` bornée à 50).
- `distribuerExperience(partie, participants, adverse, options)` : règle complète du partage — combattants : part divisée par leur nombre ; sous Multi Exp. (`expAll`) ou Serment de la troupe (`expPartage`) : les non-combattants debout touchent la moitié (Multi Exp.) ou la part entière (troupe) d'un combat, **un combattant ne touche jamais deux fois**.
- `soigner(p)` : PV max, statut null, PP pleins.

---

## 4. Types — `types.js` (gen 1) et `gen2/types.js`

### Gen 1 — 15 types

`W.POKE_TYPES = ["normal","fighting","flying","poison","ground","rock","bug","ghost","fire","water","grass","electric","psychic","ice","dragon"]`.
`W.POKE_TYPE_TABLE[attaquant][défenseur]` (valeur = multiplicateur ; 1 = `.`) :

| att\déf | normal | fight | fly | poison | ground | rock | bug | ghost | fire | water | grass | elect | psych | ice | dragon |
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

- **Écart assumé** : `W.POKE_TYPE_ECARTS = [{"de":"ghost","vers":"psychic","rom":0,"retenu":2,"raison":"Bug de la génération 1..."}]` — Spectre super efficace contre Psy (case en gras), pour que le type Spectre serve contre Morgane/Agatha.
- **Physique/spécial par TYPE** (gen 1 et gen 2) : `W.POKE_TYPES_SPECIAUX = ["fire","water","grass","electric","psychic","ice","dragon"]` (les 7 spéciaux ; tout le reste est physique). Pas de catégorie par attaque avant la gen 4.

### Gen 2 — 17 types (ajouts : `steel`, `dark`)

`W.POKE_GEN2_TYPE_TABLE` = table gen 2 canonique complète (voir tableau ci-dessous, différences soulignées par `W.POKE_GEN2_TYPE_CHANGEMENTS`) :
`[{"de":"poison","vers":"bug","gen1":2,"gen2":1}, {"de":"bug","vers":"poison","gen1":2,"gen2":0.5}, {"de":"ice","vers":"fire","gen1":1,"gen2":0.5}]` — exactement **3 cases** changent entre les deux générations ; `W.POKE_GEN2_TYPE_ECARTS = []` (aucun écart, le bug Spectre/Psy est corrigé par le canon gen 2).
`W.POKE_GEN2_TYPES_SPECIAUX = [fire, water, grass, electric, psychic, ice, dragon, dark]` (Ténèbres **spécial**, Acier **physique**).

Table gen 2 complète (1 = `.`) :

| att\déf | normal | fight | fly | poison | ground | rock | bug | ghost | **steel** | fire | water | grass | elect | psych | ice | dragon | **dark** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | 1 | 1 | 1 | 1 | 1 | .5 | 1 | 0 | .5 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| fighting | 2 | 1 | .5 | .5 | 1 | 2 | .5 | 0 | 2 | 1 | 1 | 1 | 1 | .5 | 2 | 1 | 2 |
| flying | 1 | 2 | 1 | 1 | 1 | .5 | 2 | 1 | .5 | 1 | 1 | 2 | .5 | 1 | 1 | 1 | 1 |
| poison | 1 | 1 | 1 | .5 | .5 | .5 | 1 | .5 | 0 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 1 |
| ground | 1 | 1 | 0 | 2 | 1 | 2 | .5 | 1 | 2 | 2 | 1 | .5 | 2 | 1 | 1 | 1 | 1 |
| rock | 1 | .5 | 2 | 1 | .5 | 1 | 2 | 1 | .5 | 2 | 1 | 1 | 1 | 1 | 2 | 1 | 1 |
| bug | 1 | .5 | .5 | .5 | 1 | 1 | 1 | .5 | .5 | .5 | 1 | 2 | 1 | 2 | 1 | 1 | 2 |
| ghost | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | .5 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | .5 |
| steel | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | .5 | .5 | .5 | 1 | .5 | 1 | 2 | 1 | 1 |
| fire | 1 | 1 | 1 | 1 | 1 | .5 | 2 | 1 | 2 | .5 | .5 | 2 | 1 | 1 | 2 | .5 | 1 |
| water | 1 | 1 | 1 | 1 | 2 | 2 | 1 | 1 | 1 | 2 | .5 | .5 | 1 | 1 | 1 | .5 | 1 |
| grass | 1 | 1 | .5 | .5 | 2 | 2 | .5 | 1 | .5 | .5 | 2 | .5 | 1 | 1 | 1 | .5 | 1 |
| electric | 1 | 1 | 2 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 2 | .5 | .5 | 1 | 1 | .5 | 1 |
| psychic | 1 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | .5 | 1 | 1 | 1 | 1 | .5 | 1 | 1 | 0 |
| ice | 1 | 1 | 2 | 1 | 2 | 1 | 1 | 1 | .5 | .5 | .5 | 2 | 1 | 1 | .5 | 2 | 1 |
| dragon | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | .5 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 |
| dark | 1 | .5 | 1 | 1 | 1 | 1 | 1 | 2 | .5 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | .5 |

---

## 5. Combat — `combat.js` (le cœur, gen 1)

### 5.1 État d'un combat

`demarrer(equipeJoueur, equipeAdverse, options, h)` → `e = { joueur: cote, adverse: cote, tour: 0, sauvage, zone, fini: null /* "victoire"|"defaite"|"fuite"|"capture" */, serments, fuiteApres, balls, journal }`.
`cote(equipe, options)` = `{ equipe, actif: premierDebout(equipe), paliers: paliersNeufs(), volatils: {}, participants: {}, badges, dresseur, soins: 0, soin: "SUPER_POTION" }`.
- `paliersNeufs()` = `{atk:0, def:0, vit:0, precision:0, esquive:0}` + `sat`/`sdf` selon le registre (gen 2). Remis à zéro au changement.
- `premierDebout` : premier index avec `pv > 0` (sinon 0) — un combat ne s'ouvre jamais sur un K.O.
- **Volatils** (`cote.volatils`) : confusion, peur, protection, mur, brume, puissance, graine, clone, entrave, bis, rage, fureur, etreint, patience, charge, horsAtteinte, recharge, riposte, dernierCoup, abri, tenacite, voileMiroir, malediction, cauchemar, attraction, rune, regard, requiem, relais, verrou, clairvoyance, lienDestin, gardeSuite… (s'effacent au changement, sauf pièges posés au sol `cote.piegesPoses` et `cote.differe`).
- `entrerEnJeu(e, quiCote, index, ev, options)` : **porte unique** d'entrée (le partant reprend sa forme — fin de Morphing/Conversion), pose `actif`, paliers (ou ceux du Relais), volatils vides, annonce, puis **pièges à l'entrée** (`piegesALEntree` : Picots gen2 → `floor(pvMax/8)` sauf types `flying`, épargnés).

### 5.2 Ordre des tours et priorités

```js
var PRIORITES_1G = { QUICK_ATTACK: 1, COUNTER: -1 };   // gen 2 : table par EFFET (voir §9)
// prioriteDe(cote, action) : effet gen2 d'abord (PRIORITES), sinon PRIORITES_1G[cle] || 0

function joueurEnPremier(e, prioriteJoueur, prioriteAdverse, h, ev) {
  var alea = h.brut();                       // 🔴 consommé DANS TOUS LES CAS
  if (prioriteJoueur !== prioriteAdverse) return prioriteJoueur > prioriteAdverse;
  // Vive Griffe (60/256) : seulement à priorité égale — joueur d'abord, puis adverse
  var vj = vitesseEffective(actif(e.joueur), e.joueur.paliers, e.joueur);
  var va = vitesseEffective(actif(e.adverse), e.adverse.paliers);
  if (vj !== va) return vj > va;
  return alea < 0.5;
}
```
`vitesseEffective(p, paliers, camp)` = `floor(stats.vit * facteurPalier(paliers.vit))` ; × `bonusBadges(camp, "vit")` (=1.125 si Badge Foudre) ; si `statut === "para"` : `floor(v/4)` ; `max(1, v)`.

### 5.3 Paliers de statistiques

```js
var PALIERS = [0.25, 0.28, 0.33, 0.40, 0.50, 0.66, 1, 1.5, 2, 2.5, 3, 3.5, 4];
function facteurPalier(p) { return PALIERS[Math.max(0, Math.min(12, p + 6))]; }
// bougerPalier : c.paliers[stat] = Math.max(-6, Math.min(6, avant + delta))
```
Table gen 1 canonique : −6→0.25, −5→0.28, −4→0.33, −3→0.40, −2→0.50, −1→0.66, 0→1, +1→1.5, +2→2, +3→2.5, +4→3, +5→3.5, +6→4.

### 5.4 Statuts (début/fin de tour)

`peutAgir(p, ev, h, quiCote, cle)` — ordre des empêchements :
1. **Gel** : `h.chance(DEGEL_NATUREL)` avec `DEGEL_NATUREL = 10` (%/tour) → dégel naturel (écart au canon assumé, le gel gen1 ne fondait qu'au contact du feu) ; sinon `gele`, tour perdu.
2. **Sommeil** : `statutTours--` ; `<= 0` → réveil **et le tour du réveil est perdu** (canon 1996) ; sinon `dort`, tour perdu — **sauf** si le coup choisi est dans `enDormant` (gen 2 : `SLEEP_TALK`, `SNORE`).
3. **Paralysie** : `h.chance(100 * 63 / 256)` (~24,6 %) → `pleinePara`, tour perdu. (Canon : 63/256 du ROM.)

Usure de fin de tour (`usureFinDeTour`) :
- **Vampigraine** : `drain = max(1, floor(pvMax/16))` retiré, et le **même montant** rendu à l'actif du camp d'en face (événements `graineDraine` + `graineRend`).
- **Poison / Brûlure** : `d = max(1, floor(pvMax/16))` par tour.
- **Poison grave** : `statutTours++` ; `g = statutTours * max(1, floor(pvMax/16))` (dose ×N, croissance du ROM).
- Objets tenus en fin de tour (Restes 1/16, baies sur seuil, Baie Mystère PP, baies de statut) — voir §9.
- Météo (gen 2) : tempête de sable **avant** l'usure ordinaire, `floor(pvMax/16)` sauf rock/ground/steel.

### 5.5 Formule de dégâts — `degats(att, def, attaque, ctx, h)` (EXACTE)

```js
var eff = ctx.sansType ? 1 : efficacite(a.type, typesDe(def));
if (eff === 0) return { degats: 0, efficacite: 0, critique: false };

// Critique
var tauxCrit = chanceCritique(att, attaque);          // = t/256, cf. 5.6
if (TENUS && effetTenu(att) === critique.effet) tauxCrit *= 2;   // Lentille Scope ×2
if (ctx.puissance) tauxCrit = tauxCrit / 4;           // 🔴 bug 1996 CONSERVÉ : Puissance DIVISE le crit
if (ctx.sermentsCrit) tauxCrit = clamp(tauxCrit + sermentsCrit, 0, 1);
var critique = ctx.sansCritique ? false : h.brut() < tauxCrit;

var spec = estSpecial(a.type);                        // par TYPE, jamais par attaque
var cleA = spec ? SPE_ATK() : "atk";                  // gen1 : "spe" == "spe" ; gen2 : "sat" / "sdf"
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
if (ctx.badgesAtt) A = Math.floor(A * ctx.badgesAtt);  // ×1.125 (Badge Roche → atk, Badge Glacier → spe)
if (ctx.badgesDef) D = Math.floor(D * ctx.badgesDef);  // ×1.125 (Badge Âme → def)
if (a.effet === "EXPLODE_EFFECT") D = Math.max(1, Math.floor(D / 2));  // Explosion/Destruction : D/2 (même sur crit)
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

**Écarts assumés** (en-tête du fichier) : ① Spectre > Psy (cf. types), ② dégel naturel 10 %/tour, ③ **pas de raté 1/256** : une précision de 100 % touche toujours.

### 5.6 Coup critique — `chanceCritique(p, cleAttaque)`

```js
var FORT_CRITIQUE = { SLASH: 1, KARATE_CHOP: 1, CRABHAMMER: 1, RAZOR_LEAF: 1 };
var base = ESP()[p.n].base.vit;          // 🔴 VITESSE DE BASE de l'ESPÈCE, pas la stat calculée
var t = Math.floor(base / 2);
if (FORT_CRITIQUE[cleAttaque]) t = Math.min(255, t * 8);
return t / 256;
```
Critique = `h.brut() < tauxCrit` ; il ignore les paliers des deux côtés, les murs, et double le niveau dans la formule (`niveau*2`). Le bug « Puissance divise le crit par 4 » est conservé.

### 5.7 Précision (dans `assaut`)

```js
var prec = a.precision * facteurPalier(source.paliers.precision) / facteurPalier(cible.paliers.esquive);
// Poudre Claire (objet tenu) : prec *= 0.9
// Infaillible : SWIFT_EFFECT, ou verrou (Lock-On) posé
if (!viseSoi && !infaillible && (a.precision < 100 || prec < 100)) {
  if (!h.chance(Math.max(1, Math.min(100, prec))) && !toucheDOffice) { ... rate ... }
}
```
- Un coup sur soi (`viseSoi` : `puissance === 0 && ((palierDe(effet) && palier[1] > 0) || VISE_SOI[effet])`) ne fait **aucun** jet.
- `horsAtteinte` (Vol/Tunnel en charge) : le coup ne peut pas porter (sauf Météores/SWIFT, qui saute tout le jet — canon RBY).
- `toucheDOffice` : répétition d'étreinte (le jet est consommé quand même — convention du dépôt).
- Pied Sauté qui rate : **1 PV** de dégât au lanceur (canon ROM) ; Explosion se sacrifie même en ratant.
- `VISE_SOI = { HEAL_EFFECT, FOCUS_ENERGY_EFFECT, SUBSTITUTE_EFFECT, MIST_EFFECT, LIGHT_SCREEN_EFFECT, REFLECT_EFFECT, HAZE_EFFECT, CONVERSION_EFFECT, BIDE_EFFECT, SPLASH_EFFECT, SWITCH_AND_TELEPORT_EFFECT }`.

### 5.8 Tables d'effets (constantes exactes)

```js
// Statuts secondaires — 🔴 taux canon du ROM : EFFECT1 = 10 %, EFFECT2 = 30 % (audit 13/08)
var STATUT_DE = {
  PARALYZE_SIDE_EFFECT1: ["para", 10], PARALYZE_SIDE_EFFECT2: ["para", 30],
  PARALYZE_EFFECT: ["para", 100],
  BURN_SIDE_EFFECT1: ["brulure", 10], BURN_SIDE_EFFECT2: ["brulure", 30],
  FREEZE_SIDE_EFFECT1: ["gel", 10],          // 🔴 la clé porte son « 1 » (bug historique réparé)
  POISON_SIDE_EFFECT1: ["poison", 20], POISON_SIDE_EFFECT2: ["poison", 40],
  POISON_EFFECT: ["poison", 100],            // Toxik est POISON_EFFECT + reconnu au NOM ("TOXIC" → poisonGrave)
  SLEEP_EFFECT: ["sommeil", 100],
};

var PALIER_DE = {   // [stat, delta, chance %]  — triplet du moteur
  ATTACK_DOWN1_EFFECT: ["atk", -1, 100], DEFENSE_DOWN1_EFFECT: ["def", -1, 100],
  SPEED_DOWN1_EFFECT: ["vit", -1, 100],
  ATTACK_DOWN_SIDE_EFFECT: ["atk", -1, 33.2], DEFENSE_DOWN_SIDE_EFFECT: ["def", -1, 33.2],  // 🔴 33.2 = 85/256 ROM
  SPEED_DOWN_SIDE_EFFECT: ["vit", -1, 33.2], SPECIAL_DOWN_SIDE_EFFECT: ["spe", -1, 33.2],
  ATTACK_UP1_EFFECT: ["atk", 1, 100], DEFENSE_UP1_EFFECT: ["def", 1, 100],
  SPECIAL_UP1_EFFECT: ["spe", 1, 100],
  ATTACK_UP2_EFFECT: ["atk", 2, 100], DEFENSE_UP2_EFFECT: ["def", 2, 100],
  SPEED_UP2_EFFECT: ["vit", 2, 100], SPECIAL_UP2_EFFECT: ["spe", 2, 100],
  ACCURACY_DOWN1_EFFECT: ["precision", -1, 100],   // Jet de Sable, Brouillard, Flash, Télékinésie
  DEFENSE_DOWN2_EFFECT: ["def", -2, 100],          // Grincement
  EVASION_UP1_EFFECT: ["esquive", 1, 100],         // Reflet, Lilliput
};

var PEUR_DE = { FLINCH_SIDE_EFFECT1: 10, FLINCH_SIDE_EFFECT2: 30 };   // 🔴 inversés avant l'audit
```
- Un palier positif (`pal[1] > 0`) se pose sur **soi**, négatif sur l'**adversaire** (lecture du ROM). La Brume (`volatils.brume`) bloque les baisses **infligées à 100 %** seulement. Le clone (`volatils.clone > 0`) intercepte statuts, paliers, peur, confusion et Vampigraine (canon `CheckTargetSubstitute`). `bougerPalier` peut recevoir une **liste** de stats (Pouvoir Antique : `["atk","def","vit","sat","sdf"]`).
- Immunités de statut : Poison/poisonGrave sur type poison ; brûlure sur type feu ; gel sur type glace ; para si efficacité du type = 0 (attaque sans puissance) ; **effet secondaire** ne prend pas sur son propre type (Tonnerre n'empale pas un Électrik) mais le statut pur (Cage Éclair) paralyse bien un Électrik.

### 5.9 Dégâts fixes — `degatsFixes(cle, pA, h)`

```js
SONICBOOM → 20 ; DRAGON_RAGE → 40 ;
SEISMIC_TOSS / NIGHT_SHADE → pA.niveau ;
PSYWAVE → h.entier(Math.max(1, Math.floor(pA.niveau * 1.5) - 1)) + 1   // [1, floor(1.5N)−1], borne haute EXCLUSIVE
```
L'immunité de type s'applique quand même (Ombre Nocturne ≠ Normal, Frappe Atlas ≠ Spectre).

### 5.10 Effets spéciaux (`effetSpecial`, switch sur `a.effet`)

- `SPECIAL_DAMAGE_EFFECT` : dégâts fixes (cf. 5.9).
- `SUPER_FANG_EFFECT` (Croc de Mort) : `max(1, floor(pD.pv/2))`, sauf si efficacité 0.
- `OHKO_EFFECT` (Guillotine, Empal'Korne, Abîme) : échoue si efficacité 0 ; **échoue si `vitesseEffective(pA) < vitesseEffective(pD)`** (règle 1996) ; sinon `encaisser(pD.pv)`.
- `DREAM_EATER_EFFECT` (Dévorêve) : échoue sur cible éveillée ; sinon dégâts normaux + drain moitié (retour `false` pour laisser la queue s'exécuter).
- `PAY_DAY_EFFECT` (Jackpot) : `pieces = 2 * pA.niveau` accumulées dans `e.jackpot` ; l'attaque frappe quand même (40).
- `SWITCH_AND_TELEPORT_EFFECT` : fuite si `e.sauvage`, sinon `sansEffet`.
- `HEAL_EFFECT` : **Repos** (`REST`) : PV max + `statut = "sommeil"`, `statutTours = 2`, échoue à pleins PV ; autres : `soin = min(manque, floor(pvMax/2))`.
- `SPLASH_EFFECT` : ne fait rien mais **le dit** (`trempette`).
- `HAZE_EFFECT` (Buée Noire) : remet les paliers des **deux** camps à zéro ; **lève le statut de la CIBLE seule** (asymétrie 1996 conservée) ; efface volatils brume/mur/protection/graine/puissance/confusion des deux camps (pas le clone).
- `MIST_EFFECT` → `brume` ; `LIGHT_SCREEN_EFFECT` → `mur` (spécial) ; `REFLECT_EFFECT` → `protection` (physique) ; `FOCUS_ENERGY_EFFECT` → `puissance` (bug 1996 : divise le crit par 4).
- `LEECH_SEED_EFFECT` : refusé sur Plante, sur clone, ou si déjà semé.
- `SUBSTITUTE_EFFECT` : coût `floor(pvMax/4)`, `volatils.clone = coût` (absorbe les dégâts à la place).
- `DISABLE_EFFECT` (Entrave) : choisit `h.entier(nbUtilisables)` parmi les attaques avec PP>0, `{index, tours: h.entre(2,5)}` ; décompte **par tour** (fin de tour), pas par tentative ; si l'entravée est la seule attaque utilisable → Lutte (bug corrigé 22/08).
- `MIMIC_EFFECT` (Copie) : remplace **ce coup-ci** par un coup au hasard de la cible, `pp = min(5, pp)`.
- `MIRROR_MOVE_EFFECT` (Mimique) : rejoue le `dernierCoup` de la cible (refuse `MIRROR_MOVE`).
- `METRONOME_EFFECT` : tire dans **toutes** les attaques (max 12 essais, exclut METRONOME et STRUGGLE) puis `rejouer`.
- `CONVERSION_EFFECT` : `typesForces = types de la cible` (après `garderAvantTransformation`).
- `TRANSFORM_EFFECT` (Morphing) : copie morphe, types, **stats de combat** (liste de stats du registre, PV gardés), attaques (PP 5/5), **et les paliers de la cible** (en place, audit 13/08) ; ne copie pas les PV.
- `BIDE_EFFECT` (Patience) : `{tours: h.entre(2,3), encaisse: 0}` ; la réserve accumule `r.degats * portes` ; à la fin, rend `encaisse * 2` (via `libererPatience`, fin de tour, seulement si debout).
- **Riposte** (`mv.cle === "COUNTER"`) : reconnue **par son nom** (effet `NO_ADDITIONAL_EFFECT` dans les données) ; rend `du * 2` des dégâts **Normal/Combat** réellement encaissés ce tour (`volatils.riposte = r.degats * portes`, types normal/fighting seulement) ; la dette meurt en fin de tour ; priorité −1.
- **Transformation** : `garderAvantTransformation`/`defaireTransformation`/`defaireToutesTransformations` — toute transformation est annulée à la fin du combat et au repli.

### 5.11 Queue de résolution (`resoudreCoup`) — coups multiples, drain, recul

```js
// Coups multiples : les dégâts se calculent UNE fois, s'appliquent N fois
if (a.effet === "TWO_TO_FIVE_ATTACKS_EFFECT") {
  var r8 = h.entier(8);
  coups = r8 < 3 ? 2 : r8 < 6 ? 3 : r8 === 6 ? 4 : 5;    // 3/8 · 3/8 · 1/8 · 1/8
} else if (ATTACK_TWICE_EFFECT || TWINEEDLE_EFFECT) coups = 2;
// Dard-Nuée : 20 % de poison PAR DARD (immunité poison)
// on s'arrête dès que la cible tombe
```
- **Drain** (`DRAIN_HP_EFFECT`, `DREAM_EATER_EFFECT`) : `vole = max(1, floor(r.degats/2))` rendu au lanceur, borné par PV max (via `poserPv`).
- **Recul** (`RECOIL_EFFECT`) : `part = mv.cle === "STRUGGLE" ? 2 : 4` → `recul = max(1, floor(r.degats/part))` (¼ Bélier/Damoclès/Sacrifice, ½ Lutte).
- **Ultralaser** (`HYPER_BEAM_EFFECT`) : `volatils.recharge = true` **seulement si la cible survit** (caprice 1996) ; la recharge vit dans les volatils (un changement l'efface).
- **Frénésie** (`RAGE_EFFECT`) : `volatils.rage = cle`, verrou sans fin ; chaque coup encaissé monte `paliers.atk` de 1 (max +6) via `monterRage` (dans `encaisser`).
- **Fureur** (`THRASH_PETAL_DANCE_EFFECT`) : `{cle, tours: 2 + h.entier(2)}` (2-3 au total, pose comprise) ; à la fin : confusion `h.entre(2,5)`.
- **Étreinte** (`TRAPPING_EFFECT`) : `tours: r8<3 ? 2 : r8<6 ? 3 : r8===6 ? 4 : 5` (même table 3/8·3/8·1/8·1/8, pose comprise) ; **bloque toute action y compris le changement** (sauf la victime qui peut se replier — tranché senior : le repli coupe la prise) ; décompte en fin de tour.
- **Explosion/Destruction** : `seSacrifier` — l'utilisateur tombe **toujours** (même sur raté, immunisé ou Protection) ; D/2 (cf. 5.5).
- **Confusion secondaire** : `CONFUSION_SIDE_EFFECT` à 10 % (audit) ; `CONFUSION_EFFECT` (Ultrason/Onde Folie) à 100 % ; durée `h.entre(2,5)`.
- **Peur** (`PEUR_DE`) : posée, elle ne vaut que si l'on frappe en premier (meurt en fin de tour — `finDeTour` remet `peur = false` des deux camps).
- **Roche Royale** : `h.entier(256) < 30` sur un coup qui a porté, seulement si l'effet de peur du coup est absent.
- **Patience** : `cible.volatils.patience.encaisse += r.degats * portes`.

### 5.12 Confusion (dans `assaut`)

Résolue avant l'attaque : `confusion--` ; si toujours confus, `h.chance(50)` → auto-dégât :
```js
var auto = Math.floor(Math.floor((Math.floor((2 * pA.niveau) / 5) + 2) * 40 * pA.stats.atk / pA.stats.def) / 50) + 2;
```
(puissance 40, sans STAB, sans type, sans paliers ni critique).

### 5.13 Badges (Kanto)

`bonusBadges(c, quoi)` : `b[cle] ? 1.125 : 1`, avec `cleBadge("atk"|"def"|"vit") = la même`, sinon `"spe"` (le Badge Glacier de Johto montera les deux spéciales). Badges lus : Roche (atk), Cascade (spe), Foudre (vit), Âme (def). Le bonus **Attaque** s'applique dans `degats` (ctx.badgesAtt), le bonus **Défense** aussi (ctx.badgesDef, camp joueur qui encaisse), la **Vitesse** dans `vitesseEffective`.

### 5.14 IA adverse — `choixAdverse(e, h)`

```js
// Sauvage : coup au hasard parmi ceux avec PP > 0
if (!e.adverse.dresseur) return { type: "attaque", index: h.dans(dispo) };
// Dresseur : pondération par dégâts potentiels
var pese = dispo.map(function (i) {
  var a = ATT()[pA.attaques[i].cle];
  var eff = a.puissance ? efficacite(a.type, typesDe(pD)) : 1;
  var note = a.puissance ? a.puissance * eff : 25;   // attaque de statut = 25 de base
  if (!coupUtile(a, pA, pD, e.adverse, e.joueur, !!e.sauvage)) note = 0;  // condition impossible → poids 0→1
  return { index: i, poids: Math.max(1, Math.round(note)) };
});
var choix = { type: "attaque", index: h.pondere(pese).index };
// Soin : seuil 1/4 des PV max, si le stock n'est pas vide (tirage pondéré TOUJOURS consommé avant)
if (e.adverse.soins > 0 && pA.pv > 0 && pA.pv <= Math.floor(pA.stats.pv / 4)) {
  return { type: "objetAdverse", objet: e.adverse.soin || "SUPER_POTION" };
}
```
- `coupUtile(a, pA, pD, ctxA, ctxD, sauvage)` — la loi « ce coup peut-il seulement marcher ? » (partagée avec le duel) : Dévorêve si cible endormie ; OHKO si plus rapide ; HEAL si PV manquants ; Téléport seulement en sauvage ; Vampigraine si cible non Plante et non semée ; statut pur si la cible n'en a pas déjà un et n'est pas immunisée.
- Le soin adverse **consomme son tour** (le joueur frappe, lui non).

### 5.15 Actions du joueur (`jouerTour`)

- Types d'action : `{type:"attaque", index}`, `{type:"changer", index}` (rang d'équipe 0-5), `{type:"objet", objet, cible?}`, `{type:"stat", objet}`, `{type:"ball", ball}`, `{type:"fuite"}`, `{type:"abandon"}`.
- `tourForce(e)` — porte unique « le tour est-il pris ? » : charge, étreinte subie (`changerOk:false`), fureur, patience, rage, **Bis** (`changerOk:true` — on sort d'un Bis en se repliant), étreinte adverse subie (`changerOk:true`). L'écran l'appelle pour éteindre les boutons avant de vider le sac.
- Changer : gardes (index valide, pas l'actif, vivant) ; l'événement `rappelle` porte **les PV de l'instant** (`pv: cand.pv`) ; **Relais** (gen 2) transmet les paliers ; `participants[index] = true`.
- Fuite (sauvage) — formule du ROM, corrigée (audit 13/08) :
```js
e.essaisFuite = (e.essaisFuite || 0) + 1;
var cote2 = Math.floor((pJ.stats.vit * 32) / Math.max(1, Math.floor(vAdv / 4) % 256)) + 30 * e.essaisFuite;
var jetFuite = h.entier(256);
if (pJ.stats.vit > vAdv || cote2 > 255 || jetFuite < cote2) → fuite réussie
```
(tirage consommé dans tous les cas ; plus rapide → fuite garantie sans jet utile).
- Objet : `appliquerObjet` (cf. 5.16) ; refus motivé (`pleineVie`, `rienALever`, `aTerre`, `debout`, `inconnu`). Objet de stat : `appliquerStat`. Ball : `W.PokeCapture.tenter` ; si pris → `e.fini = "capture"` (pas de riposte). Abandon : `e.fini = "defaite"`, `e.abandon = true`.
- Ordre : `joueurEnPremier` (tirage toujours consommé) ; le soin adverse se résout avant les attaques ; `assaut` premier camp, puis second **si rien n'est fini et que les deux actifs sont vivants**, puis `finDeTour` si `!e.fini`.

### 5.16 Objets de combat

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
  X_SPECIAL: {stat: SPE_ATK()},   // gen1 "spe" / gen2 "sat"
  X_ACCURACY: {stat: "precision"},
  DIRE_HIT: {volatil: "puissance"},   // Muscle + = Focus Énergie (bug crit/4 conservé)
  GUARD_SPEC: {volatil: "brume"},     // Garde-Stats = Brume
};
```
Un objet de soin/stat **coûte le tour** (l'adversaire riposte). L'Antidote lève aussi le poison grave.

### 5.17 Fin de tour (`finDeTour`) — ordre EXACT

1. `decompterEtreinte` (les deux camps), `decompterEntrave` (les deux camps).
2. `peur = false` des deux camps ; `decompterFureur` (si fin → confusion `h.entre(2,5)`).
3. `usureMeteo` (les deux camps) — tempête avant l'usure.
4. `usureFinDeTour` (les deux camps) : objet tenu, vampigraine, poison/brûlure/poisonGrave.
5. `meteoFinDeTour` (compte à rebours).
6. Requiem (`deuxCamps`, les deux compteurs ensemble → `pv = 0` + KO).
7. Malédiction (`floor(pvMax/4)`/tour), Cauchemar (`floor(pvMax/4)`/tour, s'éteint au réveil).
8. Prescience (touche, dégâts **déjà calculés au lancer**, traverse les remplacements).
9. Lien du Destin, Rune Protect : décomptes. `libererPatience` (les deux camps).
10. `riposte = 0`, `voileMiroir = 0`, `abri = false`, `tenacite = false` des deux camps ; `decompterBis`.
11. L'adversaire K.O. → envoie automatiquement le suivant (`envoie` porte `de` + `n` + `pv`), pièges à l'entrée inclus.
12. Fins (dans cet ordre — canon : le camp du joueur se juge EN PREMIER) :
    - `!resteUn(joueur)` → `e.fini = "defaite"` (même si l'adversaire tombe en même temps) ;
    - sinon `!resteUn(adverse)` → `e.fini = "victoire"` ;
    - sinon `e.sauvage && e.fuiteApres && e.tour >= e.fuiteApres` → `e.fini = "fuite"` (errant, compté pas tiré) ;
    - sinon si l'actif joueur est K.O. → `e.attenteJoueur = true` (le joueur choisit qui entre).
13. Si `e.fini` → `defaireToutesTransformations(e)` (une seule porte).

---

## 6. Capture — `capture.js`

```js
var BALLS = {
  POKE_BALL:    { tirage: 256, facteur: 12, safari: false },
  GREAT_BALL:   { tirage: 201, facteur: 8,  safari: false },   // 🔴 facteur 8 UNIQUEMENT pour la Super Ball
  ULTRA_BALL:   { tirage: 151, facteur: 12, safari: false },
  SAFARI_BALL:  { tirage: 151, facteur: 12, safari: true },
  MASTER_BALL:  { tirage: 0,   facteur: 0,  safari: false },   // ne rate jamais
};
var AIDE_STATUT = { sommeil: 25, gel: 25, para: 12, brulure: 12, poison: 12, poisonGrave: 12 };
```

**`tenter(cible, cleBall, h, serments)`** (algorithme réel du jeu — le nombre de secousses est **déduit**, jamais tiré) :
```js
// Master Ball → { pris: true, secousses: 3, raison: "master" }
var taux = ESP()[cible.n].capture;
if (serments && serments !== 1) taux = clamp(Math.round(taux * serments), 1, 255);  // serments agissent sur le TAUX, pas sur les tirages
var jet = h.entier(ball.tirage);                 // jet ∈ [0, tirage[
var aide = AIDE_STATUT[cible.statut] || 0;
if (aide && jet < aide) → PRIS (raison "statut")                 // ① le statut emporte d'un coup
if (jet > taux) → RATÉ (raison "taux")                            // ② le taux est une porte franche
var valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur)); // ③ les PV restants, borné 255
if (valeur >= 255) → PRIS (raison "affaibli")
var second = h.entier(256);
if (second <= valeur) → PRIS (raison "calcul")
// Raté : secousses selon la marge (valeur+1)/256 : >0.66 → 3, >0.33 → 2, >0.10 → 1, sinon 0
```

**`chance(cible, cleBall, serments, statutSuppose)`** — affichée à l'écran, **aucun tirage** (relit les mêmes constantes) :
```js
var R = ball.tirage;                       // le jet vit dans [0, R[
var aide = Math.min(AIDE_STATUT[statut] || 0, R);
var pStatut = aide / R;                    // ① statut
var hautPorte = Math.min(taux, R - 1);
var pPorte = Math.max(0, hautPorte - aide + 1) / R;   // ② porte du taux (tranche [aide, min(taux,R−1)])
var valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur));
var pPv = valeur >= 255 ? 1 : (valeur + 1) / 256;     // ③ PV
return Math.min(1, pStatut + pPorte * pPv);
```

**Zone Safari** (`tenterSafari`) — pas de PV à faire descendre :
```js
var ajuste = clamp(Math.floor(taux * (caillou ? 2 : 1) * (appat ? 0.5 : 1)), 1, 255);
// 1er jet : h.entier(151) ≤ ajuste ; 2e jet : h.entier(256) ≤ floor((255*4)/12) = 85 → PRIS, sinon 2 secousses
```
`fuit(cible, etatSafari, h)` : `base = 12 + (caillou ? 20 : 0) − (appat ? 8 : 0)` ; fuite si `h.chance(max(2, base))` (pour-cent).

---

## 7. Éclat — `eclat.js` (chromatique + grades)

```js
// Chromatique — condition du ROM (pokecrystal), seuils DESSERRÉS le 24/08 (écart assumé) :
var MASQUE_ATK = 2, DEF_DV = [10, 11], VIT_DV = [10, 11], SPE_DV = 10;
// chromatique ⟺ (dv.atk & 2) !== 0 && def ∈ {10,11} && vit ∈ {10,11} && spe === 10
// Probabilité : (2/16)×(2/16)×(1/16)×(8/16) = 32/65536 = 1/2048 (au lieu de 1/8192 d'origine)
// Aucun tirage : l'éclat EST dans les DV (un Pokémon échangé reste chromatique, le serveur le revérifie)
```
Grades (sur la **somme** des 4 DV, PV exclu car déduit — `somme = atk+def+vit+spe`, max 60) :
`PARFAIT ≥ 60`, `EXCEPTIONNEL ≥ 52`, `SOLIDE ≥ 43`, `CORRECT ≥ 30`, `ORDINAIRE ≥ 0`.

---

## 8. Schémas de données (fichiers générés — ne pas éditer à la main)

### 8.1 `attaques.js` — les 165 attaques gen 1 (`W.POKE_ATTAQUES`)

Chaque entrée (exemple réel) :
```json
{"id":1,"cle":"POUND","nom":{"fr":"Écras’Face","en":"Pound"},"type":"normal","categorie":"physique",
 "puissance":40,"precision":100,"pp":35,"effet":"NO_ADDITIONAL_EFFECT",
 "texte":{"fr":"Écrase l’ennemi avec les pattes avant, la queue, etc.","en":"A physical attack delivered..."}}
```
Champs : `id` (int), `cle` (string majuscule, ex. `KARATE_CHOP`), `nom` ({fr,en}), `type` (clé de type), `categorie` (`"physique"` | `"special"` — **redondante avec le type** en gen 1, utilisée pour l'affichage), `puissance` (int, 0 = attaque de statut), `precision` (int 0-100), `pp` (int), `effet` (constante d'effet du ROM, ex. `TWO_TO_FIVE_ATTACKS_EFFECT`, 68 constantes distinctes), `texte` ({fr,en}). Index : `W.POKE_ATTAQUE_PAR_CLE[cle]`.

### 8.2 `especes.js` — les 151 espèces gen 1 (`W.POKE_ESPECES`)

Chaque entrée (exemple réel, Bulbizarre) :
```json
{"n":1,"cle":"BULBASAUR","nom":{"fr":"Bulbizarre","en":"Bulbasaur"},"genre":{"fr":"Pokémon Graine","en":"Seed Pokémon"},
 "types":["grass","poison"],"base":{"pv":45,"atk":49,"def":49,"vit":45,"spe":65},
 "capture":45,"exp":64,"croissance":"moyenne_lente","taille":7,"poids":69,
 "dex":{"fr":"...","en":"..."},
 "depart":["TACKLE","GROWL"],
 "apprend":[[7,"LEECH_SEED"],[13,"VINE_WHIP"],[20,"POISONPOWDER"],...],
 "ct":["SWORDS_DANCE","TOXIC",...],
 "evolue":[{"par":"niveau","niveau":16,"vers":2}]}
```
Champs : `n` (n° Pokédex int), `cle`, `nom` {fr,en}, `genre` {fr,en} (catégorie), `types[]`, `base` {pv,atk,def,vit,**spe**} (5 stats — Spécial unique gen 1), `capture` (taux 0-255, ne s'arrondit pas), `exp` (gain de base), `croissance` (`rapide`|`moyenne`|`moyenne_lente`|`lente`), `taille` (décimètres), `poids` (hectogrammes), `dex` {fr,en}, `depart[]` (attaques de départ), `apprend[]` (paires `[niveau, clé]` triées), `ct[]` (capsules), `evolue[]` (objets `{par: "niveau"|"pierre"|"echange", niveau?, objet?, vers}`). Index `W.POKE_ESPECE` par `n` **et** par `cle`.

### 8.3 `gen2/attaques.js` — les 251 attaques gen 2 (`W.POKE_GEN2_ATTAQUES`)

```json
{"id":7,"cle":"FIRE_PUNCH","nom":{"fr":"Poing Feu","en":"Fire Punch"},"type":"fire",
 "puissance":75,"precision":100,"pp":15,"effet":"EFFECT_BURN_HIT","chance":10,
 "dit":{"fr":"Un coup de poing enflammé vient frapper l’ennemi. Peut le brûler.","en":"A fiery punch. May cause a burn."}}
```
Différences avec gen 1 : **pas de champ `categorie`** (physique/spécial toujours par type) ; **`chance`** = probabilité d'effet secondaire **sur 255** (comme le ROM ; ex. 10 = 10/255) ; les effets sont les constantes gen 2 (`EFFECT_*`, 135 constantes distinctes) ; `texte` s'appelle **`dit`**. Index : `W.POKE_GEN2_ATTAQUE_PAR_CLE`.

### 8.4 `gen2/especes.js` — les 251 espèces gen 2 (`W.POKE_GEN2_ESPECES`)

```json
{"n":1,"cle":"BULBASAUR","nom":{"fr":"Bulbizarre","en":"Bulbasaur"},"genre":{"fr":"Pokémon Graine","en":"Seed Pokémon"},
 "types":["grass","poison"],"base":{"pv":45,"atk":49,"def":49,"vit":45,"sat":65,"sdf":65},
 "capture":45,"exp":64,"objets":[null,null],"croissance":"moyenne_lente","sexe":"GENDER_F12_5",
 "taille":7,"poids":69,"dex":{"fr":"...","en":"..."},
 "depart":["TACKLE"],"apprend":[[4,"GROWL"],[7,"LEECH_SEED"],...],"ct":[...],
 "evolue":[{"par":"niveau","niveau":16,"vers":2}]}
```
Différences avec gen 1 : `base` = **6 stats** `{pv,atk,def,vit,sat,sdf}` (Spécial séparé) ; **`objets`** = paire `[commun, rare]` d'objets tenus (null = rien) ; **`sexe`** (`GENDER_F12_5`|`GENDER_F25`|`GENDER_F50`|`GENDER_F75`|`GENDER_F100`|`GENDER_F0`|`GENDER_UNKNOWN`) ; `evolue` peut porter `par:"bonheur"` et `par:"stat"` (+ `compare`). Compléments : `W.POKE_GEN2_A_MODELISER = {bonheur: [8 espèces], stat: [TYROGUE×3]}` ; `W.POKE_GEN2_DEX_FR_REPLIE` (251 notices FR reprises d'une génération postérieure).

---

## 9. Spécificités gen 2 — `gen2/effets.js`, `gen2/effets-neufs.js`, `gen2/objets-tenus.js`

### 9.1 Traduction des effets (`W.POKE_GEN2_EFFETS`)

Les deux générations n'ont **aucun nom d'effet en commun** (68 en 1996, 135 en 1999). La table traduit gen2→gen1 **quand c'est le même effet** (ex. `EFFECT_SLEEP → "SLEEP_EFFECT"`, `EFFECT_ATTACK_DOWN → "ATTACK_DOWN1_EFFECT"`, `EFFECT_MULTI_HIT → "TWO_TO_FIVE_ATTACKS_EFFECT"`). Là où la mécanique a changé ou n'existe pas, la case est **vide** (`EFFECT_FALSE_SWIPE`, `EFFECT_COUNTER`, `EFFECT_GUST`, `EFFECT_RETURN`, `EFFECT_HIDDEN_POWER`, `EFFECT_ROLLOUT`, `EFFECT_PURSUIT`, `EFFECT_THIEF`, `EFFECT_BEAT_UP`, …) — l'attaque ne fait que ses dégâts plutôt qu'un effet faux.

### 9.2 Effets neufs (`W.POKE_GEN2_EFFETS_NEUFS_TABLE`)

```js
paliers: {   // [stat | liste de stats, crans, % de déclenchement] — format du moteur
  EFFECT_ATTACK_DOWN_2: ["atk", -2, 100], EFFECT_SPEED_DOWN_2: ["vit", -2, 100],
  EFFECT_EVASION_DOWN: ["esquive", -1, 100],
  EFFECT_ATTACK_UP_HIT: ["atk", 1, 10],  EFFECT_DEFENSE_UP_HIT: ["def", 1, 10],   // montées EN FRAPPANT (10 %)
  EFFECT_ALL_UP_HIT: [["atk","def","vit","sat","sdf"], 1, 10],                    // Pouvoir Antique (5 stats)
},
pieges: [{ cle: "picots", part: 8, epargneTypes: ["flying"] }],   // 1/8 des PV max à l'entrée
enDormant: ["SLEEP_TALK", "SNORE"],                               // se jouent endormi
meteo: { EFFECT_RAIN_DANCE: {cle:"pluie",tours:5}, EFFECT_SUNNY_DAY: {cle:"zenith",tours:5}, EFFECT_SANDSTORM: {cle:"sable",tours:5} },
meteoDegats: { pluie: {water:1.5, fire:0.5}, zenith: {fire:1.5, water:0.5}, sable: {} },
meteoUsure: { sable: { part: 16, epargne: ["rock","ground","steel"] } },
durees: {   // drapeaux à compteur, aucun jet
  EFFECT_SAFEGUARD: {cle:"rune", tours:5, camp:true},
  EFFECT_MEAN_LOOK: {cle:"regard", tours:0, cible:true},
  EFFECT_PERISH_SONG: {cle:"requiem", tours:4, deuxCamps:true},
  EFFECT_BATON_PASS: {cle:"relais", tours:1, soi:true},
  EFFECT_LOCK_ON: {cle:"verrou", tours:2, soi:true},
  EFFECT_FORESIGHT: {cle:"clairvoyance", tours:0, cible:true},
  EFFECT_DESTINY_BOND: {cle:"lienDestin", tours:1, soi:true},
},
sansJet: {   // zéro tirage
  EFFECT_CURSE: {quoi:"malediction", typeQuiPose:"ghost", coutPart:2, rongePart:4,
                 paliers:[["atk",1],["def",1],["vit",-1]]},   // Spectre : ½ PV max, plaie ¼/tour ; sinon atk+1 def+1 vit−1
  EFFECT_HEAL_BELL: {quoi:"glasDeSoin"},
  EFFECT_BELLY_DRUM: {quoi:"bideEnVrac", coutPart:2, crans:6},   // échoue sous la moitié des PV
  EFFECT_PAIN_SPLIT: {quoi:"partage"},                            // moyenne des PV
  EFFECT_SPIKES: {quoi:"poserPiege", piege:"picots"},
  EFFECT_ATTRACT: {quoi:"attraction", surDeux:2},                 // 1 tirage PAR TOUR où amoureux (50 %)
  EFFECT_NIGHTMARE: {quoi:"cauchemar", rongePart:4},
  EFFECT_PSYCH_UP: {quoi:"copiePaliers"},
  EFFECT_CONVERSION2: {quoi:"conversionDeux"},   // 🔴 divergence écrite : 1er type résistant dans l'ordre de la table (pas de tirage)
},
avecJet: {   // chacun DÉCLARE son coût en tirages (champ `jets`)
  EFFECT_PROTECT:  {quoi:"abri", compteur:"gardeSuite", sur:256, depart:255, jets:1},   // seuil = 255 >> suite
  EFFECT_ENDURE:   {quoi:"tenacite", compteur:"gardeSuite", sur:256, depart:255, jets:1}, // compteur PARTAGÉ (ROM)
  EFFECT_SPITE:    {quoi:"depit", ppMin:2, ppMax:5, jets:1},
  EFFECT_ENCORE:   {quoi:"bis", toursMin:3, toursMax:6, jets:1, refuse:[ENCORE,MIMIC,MIRROR_MOVE,METRONOME,SKETCH,STRUGGLE,TRANSFORM]},
  EFFECT_MIRROR_COAT: {quoi:"voileMiroir", facteur:2, jets:0},    // ×2 du SPÉCIAL encaissé ce tour, frappe en dernier
  EFFECT_SKETCH:   {quoi:"gribouille", jets:0, refuse:[SKETCH,STRUGGLE,METRONOME,MIMIC,MIRROR_MOVE,TRANSFORM]},
  EFFECT_SWAGGER:  {quoi:"vantardise", crans:2, jets:1},
  EFFECT_FUTURE_SIGHT: {quoi:"prescience", tours:3, jets:1},      // dégâts calculés AU LANCER, sans type ni critique
  EFFECT_SLEEP_TALK: {quoi:"blablaDodo", jets:1, refuse:[SLEEP_TALK,BIDE,MIRROR_MOVE,METRONOME,SKY_ATTACK,SKULL_BASH,SOLARBEAM,RAZOR_WIND,DIG,FLY]},
},
priorites: {   // 🔴 le ROM classe par EFFET (MoveEffectPriorities) ; priorité ordinaire = 1
  EFFECT_PROTECT: 2, EFFECT_ENDURE: 2,
  EFFECT_PRIORITY_HIT: 1,
  EFFECT_COUNTER: -1, EFFECT_MIRROR_COAT: -1, EFFECT_FORCE_SWITCH: -1,
},
batonPass: "EFFECT_BATON_PASS",
```
Règles portées par `combat.js` : garde usée (255 >> n, 1er toujours, 2e 1/2, 3e 1/4…), Ténacité tient à 1 PV **dans `encaisser`** (protège des coups, pas de l'usure), Protection arrête tout ce qui vise l'adversaire (dégâts, statut, palier, prise) après le jet de précision, le sacrifice d'Explosion se paie quand même, Attraction s'immobilise après la confusion (ordre des empêchements 1999), le sexe vient de `regles.js:sexeDe` : femelle si `dv.atk <= (octet >> 4)` avec `OCTET_DE_SEXE = {GENDER_F12_5: 0x1f, GENDER_F25: 0x3f, GENDER_F50: 0x7f, GENDER_F75: 0xbf, GENDER_F100: 0xfe}` ; `GENDER_F0` = toujours mâle ; `GENDER_UNKNOWN` = pas de sexe (21 espèces, tous les légendaires).

### 9.3 Objets tenus (`W.POKE_GEN2_TENUS`)

```js
boost: BOOST (17 clés HELD_*_BOOST → type), boostFacteur: 1.1,   // ×1,1 sur A (arrondi comme le ROM)
leftovers: {effet:"HELD_LEFTOVERS", part: 16},                   // 1/16 des PV max, fin de tour
brightpowder: {effet:"HELD_BRIGHTPOWDER", precision: 0.9},      // précision adverse ×0,9
critique: {effet:"HELD_CRITICAL_UP", facteur: 2},                // Lentille Scope : crit ×2
metalPowder: {effet:"HELD_METAL_POWDER", espece: 132, facteur: 1.5},   // Défense de Métamorph ×1,5
baies: { HELD_BERRY: {soigne: 10, seuil: 0.5} },                 // se consomme (objet = null)
viveGriffe: {effet:"HELD_QUICK_CLAW", sur:256, seuil:60},        // priorité égale seulement
flinch: {effet:"HELD_FLINCH", sur:256, seuil:30},                // sur un coup qui a porté
rendPP: {effet:"HELD_RESTORE_PP", pp:5},                         // Baie Mystère : 5 PP au 1er coup à sec
soins: { HELD_HEAL_POISON:["poison","poisonGrave"], HELD_HEAL_PARALYZE:["para"], HELD_HEAL_FREEZE:["gel"],
         HELD_HEAL_BURN:["brulure"], HELD_HEAL_SLEEP:["sommeil"],
         HELD_HEAL_STATUS:["poison","poisonGrave","para","gel","brulure","sommeil"] },
```
`W.POKE_GEN2_TENUS_HORS_DE_PORTEE` (écrits volontairement pas) : Bandeau, Pièce Rune, Rune Purifiante, Boule Fumée, Baie Amère. Le tirage de la Vive Griffe et de la Roche Royale ne se paie **que si** quelqu'un porte l'objet (2 % des créatures) — aucun jet pour les autres combats.

---

## 10. Récapitulatif des écarts au canon (déclarés dans le code)

**Gen 1 :**
1. Spectre super efficace contre Psy (bug 1996 corrigé, `POKE_TYPE_ECARTS`).
2. Dégel naturel : 10 %/tour (`DEGEL_NATUREL`).
3. Pas de raté 1/256 : précision 100 % = toujours toucher.
4. `RYTHME = 4.3` + `facteurNiveau` (bosse de rattrapage, plafonné à 42) — expérience accélérée (jeu de 40 min).
5. Nombre de secousses de capture déduit (pas l'algorithme de secousses du ROM).
6. Multi Exp. = « Exp. Share moderne » (le combattant garde tout, les autres la moitié) — via la carte.
7. Master Ball unique (hors canon, mentionné).
8. Chromatique desserré : 1/2048 au lieu de 1/8192.

**Gen 2 :** aucun écart de table (`POKE_GEN2_TYPE_ECARTS = []`) ; la conversion 2 prend le premier type résistant au lieu d'un tirage (divergence écrite et assumée) ; la météo est sans tirage ; pas d'horloge (Mentali/Noctali : l'écran choisit).

---

## 11. Points d'attention pour la réécriture (pièges historiques du code)

- **Le contrat de rejeu** : tout tirage ajouté/retiré doit être compensé (convention « un tirage supprimé se conserve ») ; les verrous datés (`avantLe`) protègent les parties en cours.
- **Statistiques gen 2** : `sat`/`sdf` partagent `dv.spe`/`statExp.spe` ; ne jamais écrire de table de stats en dur (venir du registre), sous peine de NaN.
- **Toxik** porte `POISON_EFFECT` et se reconnaît **par son nom** ; **Riposte** porte `NO_ADDITIONAL_EFFECT` et se reconnaît **par son nom** ; les clés d'effet portent leur suffixe (`FREEZE_SIDE_EFFECT1`, pas sans `1`).
- **Dévorêve** échoue sur cible éveillée ; **OHKO** échoue si plus lent ; ces conditions doivent aussi peser dans l'IA (`coupUtile`).
- Le **clone** intercepte dégâts + statuts + paliers + peur + confusion + graine ; la **Brume** bloque les baisses à 100 % ; la **Rune Protect** bloque les statuts.
- `poserPv` est la **seule** porte d'écriture des PV (bornage + détection de NaN) ; `entrerEnJeu` la seule porte d'entrée ; `finDeTour` le seul endroit qui conclut.
- Tout événement de changement (`rappelle`, `envoie`) porte **les PV de l'instant**.
- Les données générées ne se corrigent jamais à la main (générateurs `tools/poke-donnees*.mjs`).
