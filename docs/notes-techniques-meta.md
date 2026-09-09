# Road to Legends — Notes techniques des systèmes méta (référence pour réécriture)

> Analyse du code de `js/poke/` (JavaScript vanilla, IIFE, objets globaux `W.POKE_*`).
> Deux générations : Kanto (151) et Johto (251), sélectionnables au départ.
> Toutes les valeurs citées sont celles du code. Les commentaires `🔴` du code original
> documentent des bugs corrigés — ils sont résumés ici quand ils expliquent une règle.

---

## 0. Architecture et contrat de rejeu (À LIRE EN PREMIER)

### 0.1 Le noyau vs les écrans
- **Noyau (chargé par le serveur pour rejouer)** : fichiers « purs », aucun DOM, aucun `localStorage`, aucun réseau : `partie.js`, `serments.js`, `sceaux.js`, `regle-du-jour.js`, `chasses.js`, `fusion.js`, `rejeu.js`, `duel.js`, `depart.js`, `regles.js`, `butin.js`, `rng.js`, `ct.js`, `obtentions.js`, `gen2/*` (données), `capture.js`, `moteur.js`, `combat.js`, `actes.js`…
- **Écrans (client seul)** : `progression.js` (lit/écrit `localStorage`), `obtenir.js` (pur mais appelle la progression), `fin.js`, `classement.js`, `carte-partage.js`, `dits-objets.js` (pur mais cosmétique), `ui.js` (1 Mo), `pokedex-ui.js`…
- **Registre** : `regles.js` expose `W.PokeRegles`, la porte unique vers les tables du monde **posé** (`gen1` ou `gen2`). Tous les fichiers du noyau lisent les données par cette porte (`PokeRegles.especes()`, `.etapes()`, `.zones()`, `.lieux()`, `.clesVoyage()`, `.arenes()`, `.conseil()`, `.canon()`, `.versions()`, `.peche()`, `.echanges()`, `.casino()`, `.cadeaux()`, `.fossiles()`, `.dojo()`, `.ambre()`, `.statiques()`, `.concours()`, `.arbres()`, `.oeufs()`, `.errants()`, `.tenus()`, `.badgesStat()`, `.mythique()`…). Un monde se pose avec `PokeRegles.poser(cle)` ; `de(partie)` déduit la règle d'une partie (`partie.regles`, repli `gen1`).

### 0.2 Le contrat de rejeu (CRITIQUE pour la réécriture)
- **Le serveur ne rejoue PAS le voyage tour par tour.** `PokeRejeu.replayDaily(date, journal)` recalcule le **score** à partir d'un **résumé** (8 nombres) que le client envoie (`journal[0]`), après l'avoir borné (`normaliser`). On ne vérifie pas le chemin, on vérifie que l'arrivée est atteignable.
- **Tout le hasard vient d'une graine mulberry32** (`W.PokeHasard` dans `rng.js`). Le **nombre et l'ordre des tirages font partie du contrat** : toute nouvelle consommation de hasard (ou consommation conditionnelle) casse la comparabilité du Défi du jour. Règles apprises :
  - `h.entier(n)` consomme `brut()` **une seule fois** quelle que soit la borne → utilisé pour tirer un *rang* dans un ensemble de triplets (`PokeChoix.combien` / `PokeChoix.deRang` dans `rng.js`), déplié ensuite **sans toucher au hasard** (acquis, CT).
  - Le mélange de serments se fait sur le pool **plein**, puis on filtre (verrous, coûts déjà payés) : filtrer avant changerait le nombre de tirages.
  - La règle du jour se dérive de la **date seule** (`pokeGraineDe("POKE-REGLE-"+date)`) : zéro tirage consommé.
  - La version du jour se tire en premier (`h.brut() < 0.5`) sur `"POKE-JOUR-"+date` — le serveur la retrouve d'un seul tirage.
  - Les tirages « inutiles » (ex. traces de Mew) sont **inconditionnels** : on tire toujours, on ne retient le résultat que si la condition est remplie.
- **Outils de contrôle** : `tools/poke-rng.mjs`, `tools/poke-fusion.mjs`, `tools/poke-sac.mjs`, `tools/poke-fins.mjs`, `tools/poke-chasse-sans-perte.mjs`, `tools/poke-collection-ne-perd-rien.mjs`, `tools/poke-gen2-close.mjs`, etc. Le projet interdit les « portes mortes » (fonction exportée que rien n'appelle).

---

## 1. Le butin — `PokeButin` (`butin.js`)

### 1.1 Règles générales
- Le butin ne sort **qu'après une victoire en combat** (pas après trouvaille, fuite ou boutique).
- **3 cartes proposées** (choix d'une, renoncement aux autres), + bonus de serments : `combien = o.combien || max(1, 3 + PokeSerments.effet(p).butinChoix)`.
- Un boss donne **2 cartes de plus** (`chance = o.boss ? 2 : 1`) et **double le poids des familles non-communes**.
- **Pas de doublons** dans un tirage : empreinte `type + ":" + (objet|montant|"")` ; une carte à choix (acquis, CT) a l'empreinte fixe `acquis:` / `ct:` (le `rang` est exclu de l'empreinte).
- Trois raretés : `commun`, `rare`, `legendaire` (couleurs d'affichage).

### 1.2 Les familles de cartes (FAMILLES) — poids et valeurs exactes

| Famille | Rareté | Poids | Tirage (`tirer`) | Condition (`utile`) |
|---|---|---|---|---|
| `argent` | commun | 14 | `montant = 400 + acte*260 + h.entier(base/2)` | — |
| `balls` | commun | 16 | acte ≥ 6 → `ULTRA_BALL` ×(3..6) ; acte ≥ 3 → `GREAT_BALL` ×(3..6) ; sinon `POKE_BALL` ×(3..6) | — |
| `soins` | commun | 13 | acte ≥ 6 → `HYPER_POTION` ×(2..4) ; acte ≥ 3 → `SUPER_POTION` ×(2..4) ; sinon `POTION` ×(2..4) | — |
| `remede` | commun | 10 | acte ≥ 6 → `FULL_HEAL` ×(2..3) ; sinon `h.dans([ANTIDOTE, AWAKENING, PARLYZ_HEAL, FULL_HEAL])` ×(2..3) | acte ≥ 3 |
| `rappel` | rare | 7 | `REVIVE` ×(1..2) | — |
| `vitamine` | rare | 9 | `h.dans(Object.keys(PokeObtenir.VITAMINES))` → 1 vitamine | équipe non vide |
| `expAll` | rare | 14 | `EXP_ALL` ×1 | acte ≥ 1 **et** équipe > 1 **et** pas déjà `p.sac.EXP_ALL` |
| `canne` | rare | 8 | `canneSuivante(p, acte)` (1re canne non possédée dont l'acte ≥ seuil) | idem |
| `bonbon` | rare | 6 | `RARE_CANDY` ×1 | équipe non vide |
| `ct` | rare | 15 | `{type:"ct", rang: h.entier(PokeChoix.combien(possibles.length))}` — 3 machines proposées, une gardée | `apprenables(p).length > 0` |
| `acquis` | légendaire | 5 | `{type:"acquis", rang: h.entier(PokeAcquis.combien(n))}` — 3 acquis proposés, un gardé | `PokeAcquis.ouverts(p).length > 0` |
| `pierre` | légendaire | 5 | `h.dans(pierresUtiles(p))` ×1 | au moins une pierre utile |

### 1.3 Les deux cartes « posées » (garanties, pas tirées)
- **EXP_ALL (Multi Exp)** : à chaque butin, si `!o.sansPose && !o.combien && famExp.utile(...) && acte >= 1`, la carte EXP_ALL est **posée d'office** dans l'offre (reste une carte parmi trois ; ne se repropose pas car `utile` la refuse dès qu'on la possède). C'est un multiplicateur ×3,5 d'expérience effective : `gainExperience` divise le brut par les participants, `distribuerExperience` verse en plus la moitié d'un brut plein à chaque non-participant.
- **Premier acquis** : à l'acte 1, si `!o.sansPose && !o.combien && !p._acquisPose && acte === 1 && famAcq.utile(...)`, la carte acquis est posée d'office et `p._acquisPose = true` (drapeau : même refusée, elle ne se repropose pas).

### 1.4 Le plafond de puissance des CT (PLAFOND_CT)
`var PLAFOND_CT = [95, 95, 100, 100, 100, 0, 0, 0, 0]` (index = acte−1 ; `0` = aucun plafond). `plafondCT(acte)` renvoie la valeur. `apprenables(p)` filtre les 50 CT de `W.POKE_CT` :
- non déjà possédée (`p.ct[m.n]`) ;
- si plafond : `att.puissance <= cap` (les coups sans puissance — Toxik, Cage-Éclair, Danse-Lames, Reflet, Repos — passent toujours) ;
- au moins un membre de l'équipe a `e.ct.indexOf(m.cle) >= 0`.

### 1.5 Les cannes (CANNES)
```js
CANNES = [
  { objet: "OLD_ROD",   acte: 2 },   // Canne — Azuria
  { objet: "GOOD_ROD",  acte: 4 },   // Super Canne — Parmanie
  { objet: "SUPER_ROD", acte: 6 },   // Méga Canne — Route 12
];
```
`canneDe(p)` : meilleure canne possédée. `canneSuivante(p, acte)` : première canne **non possédée** dont l'acte requis est atteint (progression à un cran à la fois). `pierre` : `pierresUtiles(p)` lit `e.evolue[i].par === "pierre"` → `e.evolue[i].objet`.

---

## 2. Les serments — `PokeSerments` (`serments.js`)

### 2.1 Les clés d'effet (LE CONTRAT — `CLES`)
| Clé | Neutre | Type | Sens |
|---|---|---|---|
| `degatsInfliges` | 1 | × | dégâts que TU infliges |
| `degatsSubis` | 1 | × | dégâts que tu SUBIS |
| `critBonus` | 0 | + | part de coups critiques (0 → 1) |
| `capture` | 1 | × | chance de capture |
| `argent` | 1 | × | argent gagné |
| `expGain` | 1 | × | expérience gagnée |
| `butinChoix` | 0 | + | cartes de butin proposées |
| `equipeMax` | 6 | min | places dans l'équipe (bornée au minimum, jamais sommée) |
| `soinInterdit` | false | bool | les soins quittent le sac de combat (les Balls restent) |
| `centreInterdit` | false | bool | le Centre Pokémon refuse de soigner |
| `fuiteInterdite` | false | bool | on ne fuit plus un sauvage |
| `bossNiveau` | 0 | + | niveaux ajoutés aux Champions |
| `plafondChampion` | false | bool | on ne dépasse pas le niveau du Champion de l'acte |
| `expPartage` | false | bool | toute l'équipe gagne de l'expérience |
| `captureNiveau` | false | bool | les captures arrivent au niveau de la tête d'équipe |
| `dernierDebout` | 1 | × | dégâts × quand il ne reste qu'un Pokémon debout (conditionnel) |

### 2.2 Composition (`effet(partie)`)
- Sources, dans l'ordre : règle du jour **express** (`{expGain: 1.52}` si `partie.regle === "express"`), serments pris, règle du jour (`PokeRegleDuJour.effetDe`), **acquis** (`PokeAcquis.effets`).
- Règles de fusion : booléens en `||` ; `equipeMax` en **min** ; `critBonus`, `butinChoix`, `bossNiveau` en **somme** ; tout le reste en **produit** (trois ×1,2 de dégâts donnent 1,728).
- Bornes des serments (avant le sceau) : `equipeMax ≥ 1` ; `critBonus ∈ [−0.2, 0.6]` ; `degatsSubis ≥ 0.35` ; `degatsInfliges ≥ 0.4` ; `capture ≥ 0.4` ; `expGain ≥ 0.4` ; `argent ≥ 0.4` ; `butinChoix ∈ [−1, 3]` (plancher −1 pour laisser les acquis retirer une carte) ; `bossNiveau ∈ [0, 9]`.
- **Le sceau s'applique APRÈS** (`PokeSceaux.appliquer(e, partie.sceau)`), avec ses propres bornes (voir §3).

### 2.3 Les 17 serments du pool de base (POOL) — valeurs EXACTES

| id | Nom (fr) | Effet (exact) | Dit (fr) |
|---|---|---|---|
| `lame` | Serment de la lame | `degatsInfliges: 1.2, degatsSubis: 1.2` | Tu encaisses moins bien. Tu frappes plus fort. |
| `muraille` | Serment de la muraille | `degatsSubis: 0.78, degatsInfliges: 0.88` | Tes coups portent moins. Tu encaisses mieux. |
| `audace` | Serment de l'audace | `critBonus: 0.2, soinInterdit: true` | Le sac reste fermé en combat. Un coup critique sur cinq de plus. |
| `chasse` | Serment de la chasse | `capture: 1.5, bossNiveau: 2` | Les Champions gagnent deux niveaux. Tes Poké Balls tiennent bien mieux. |
| `solitude` | Serment de la solitude | `equipeMax: 4, expGain: 1.5` | Quatre places dans l'équipe. Chaque combat rapporte moitié plus d'expérience. |
| `plafond` | Serment du plafond | `plafondChampion: true, expGain: 1.5` | Tu ne dépasses pas le Champion de l'acte. L'expérience rentre moitié plus. |
| `troupe` | Serment de la troupe | `expPartage: true, expGain: 0.7` | Chacun gagne un tiers d'expérience en moins. Personne n'en est privé. |
| `avarice` | Serment de l'avarice | `argent: 2, capture: 0.7` | Les Poké Balls tiennent bien moins. L'argent double. |
| `abondance` | Serment de l'abondance | `butinChoix: 1, argent: 0.66` | L'argent baisse d'un tiers. Une carte de butin de plus à chaque fois. |
| `honneur` | Serment de l'honneur | `fuiteInterdite: true, degatsInfliges: 1.1` | On ne fuit plus un sauvage. Tes coups gagnent un dixième. |
| `endurance` | Serment de l'endurance | `degatsSubis: 0.9, expGain: 0.75` | L'expérience baisse d'un quart. Tu encaisses un dixième de moins. |
| `defi` | Serment du défi | `bossNiveau: 3, butinChoix: 2` | Les Champions gagnent trois niveaux. Deux cartes de butin de plus. |
| `patience` | Serment de la patience | `expGain: 1.34, degatsInfliges: 0.9` | Tes coups perdent un dixième. L'expérience monte d'un tiers. |
| `meute` | Serment de la meute | `capture: 1.3, expGain: 0.8` | L'expérience baisse d'un cinquième. Tes Poké Balls tiennent mieux. |
| `duel` | Serment du duel | `equipeMax: 3, degatsInfliges: 1.34` | Trois places dans l'équipe. Tes coups gagnent un tiers. |
| `prudence` | Serment de la prudence | `argent: 1.5, critBonus: −0.1` | Un coup critique sur dix en moins. L'argent monte de moitié. |
| `vertu` | Serment de la vertu | `soinInterdit: true, degatsSubis: 0.8` | Tu ne rouvres plus ton sac. Tu encaisses un cinquième de moins. |

### 2.4 Les 11 serments sous verrou (`verrou: true`) — ouverts par les chasses

| id | Nom | Effet (exact) | Ouvert par la chasse |
|---|---|---|---|
| `arpenteur` | Serment de l'arpenteur | `captureNiveau: true, degatsInfliges: 0.75` | `dixCroisees` |
| `rempart` | Serment du rempart | `fuiteInterdite: true, degatsSubis: 0.7, critBonus: 0.15` | `sansPerte` |
| `fureur` | Serment de la fureur | `degatsInfliges: 1.5, degatsSubis: 1.5` | `deuxBadges` |
| `ermite` | Serment de l'ermite | `equipeMax: 2, expGain: 2` | `trenteAuCompte` |
| `oeil` | Serment de l'œil juste | `critBonus: 0.4, bossNiveau: 3` | `quatreBadges` |
| `collection` | Serment du collectionneur | `capture: 2, degatsInfliges: 0.75` | `douzeEspeces` |
| `marche` | Serment du marché | `butinChoix: 3, argent: 0.5` | `unLegendaire` |
| `silence` | Serment du silence | `soinInterdit: true, fuiteInterdite: true, degatsSubis: 0.66` | `troisSerments` |
| `fortune` | Serment de la fortune | `argent: 3, expGain: 0.5` | `badgeSousSerment` |
| `titan` | Serment du titan | `bossNiveau: 5, degatsInfliges: 1.5` | `septBadges` |
| `sacrifice` | Serment du sacrifice | `equipeMax: 3, soinInterdit: true, degatsInfliges: 1.34, capture: 1.34` | `ligue` |

### 2.5 Offre et prise
- `offrir(partie, h, combien=3)` : **Fisher-Yates sur le pool PLEIN** (`h.entier(j+1)`), puis filtre : déjà pris → sauté ; `verrou && !partie.sermentsOuverts[id]` → sauté ; **coût déjà payé** (`coutDejaPaye`) → sauté (un serment dont tous les prix booléens sont déjà en vigueur n'est plus proposé ; `expPartage` et `captureNiveau` ne comptent pas comme prix).
- `partie.sermentsOuverts` vient de `PokeChasses.sermentsOuverts(compte)` ; **vide au Défi du jour** (les serments verrouillés n'y apparaissent jamais).
- `prendre(partie, id)` : ajoute à `partie.serments` (refuse doublon).
- Pas de porte `tous()` (refusée par le détecteur de portes mortes).

---

## 3. Les sceaux de Kanto — `PokeSceaux` (`sceaux.js`)

8 paliers **cumulatifs** : le Sceau n porte les règles 1..n. Un seul sceau s'ouvre par Ligue (ou par 8 badges, cf. §10) franchie. Valeurs exactes :

| n | Nom | Dit (fr) | Effet (exact) |
|---|---|---|---|
| 1 | Sceau de la Roche | Les Champions gagnent deux niveaux. | `bossNiveau: 2` |
| 2 | Sceau de la Cascade | Une place de moins dans ton équipe. | `equipeMax: 5` |
| 3 | Sceau de la Foudre | Tes Pokémon ne dépassent plus le niveau du Champion de l'acte. | `plafondChampion: true` |
| 4 | Sceau du Prisme | Tu encaisses un septième de plus. | `degatsSubis: 1 + 1/7` (≈1,142857) |
| 5 | Sceau de l'Âme | Tes Poké Balls tiennent un quart de moins. | `capture: 0.75` |
| 6 | Sceau du Marais | Les Champions gagnent trois niveaux de plus. | `bossNiveau: 3` |
| 7 | Sceau du Volcan | L'expérience baisse d'un cinquième. | `expGain: 0.8` |
| 8 | Sceau de la Terre | Tes coups perdent un dixième. | `degatsInfliges: 0.9` |

`appliquer(effet, n)` : applique les sceaux 1..n **par-dessus** l'effet déjà composé des serments, avec la même grammaire (bool `||`, `equipeMax` min, `critBonus`/`butinChoix`/`bossNiveau` somme, le reste produit), puis reborne : `butinChoix ∈ [−2, 3]`, `bossNiveau ∈ [0, 14]`, `argent ≥ 0.2`, `expGain ≥ 0.3`, `capture ≥ 0.25`, `degatsSubis ≤ 2.2`, `degatsInfliges ≥ 0.3`. Le Défi du jour est toujours au sceau 0.

---

## 4. La règle du jour — `PokeRegleDuJour` (`regle-du-jour.js`)

Dérivée de la **date seule** : `pour(date)` = `REGLES[pokeGraineDe("POKE-REGLE-"+date) % 7]` (étiquette distincte de la carte `POKE-JOUR-`). `demain(date)` calcule le lendemain en calendrier civil (années bissextiles gérées à la main, pas d'objet `Date` dans le noyau). Les 7 règles :

| id | Nom | Effet (exact) | Dit (fr) |
|---|---|---|---|
| `chasse` | Journée de chasse | `capture: 2, expGain: 0.8` | Les Poké Balls tiennent mieux. L'expérience rentre moins vite. |
| `mainLegere` | Main légère | `equipeMax: 3, expGain: 1.5` | Trois Pokémon au plus. Ils grandissent moitié plus vite. |
| `pochesPleines` | Les poches pleines | `argent: 2, butinChoix: 1` | L'argent double. Une carte de butin de plus à chaque fois. |
| `sangFroid` | Sang-froid | `critBonus: 0.25, degatsSubis: 1.15` | Tes coups critiques sont plus fréquents. Tu encaisses plus. |
| `marcheForcee` | Marche forcée | `bossNiveau: 2, butinChoix: 1` | Les Champions gagnent deux niveaux. Le butin s'élargit. |
| `economieDeGuerre` | Économie de guerre | `soinInterdit: true, argent: 1.5` | Aucun soin en combat. L'argent rentre moitié plus. |
| `jourDesBraves` | Le jour des braves | `degatsInfliges: 1.25, degatsSubis: 1.25` | Tout frappe plus fort, des deux côtés. |

`effetDe(partie)` lit `partie.regleDuJour` (un **identifiant**, pas un effet — l'effet se lit ici). La règle se fond dans `PokeSerments.effet`.

---

## 5. Les façons d'obtenir un Pokémon

### 5.1 Kanto (`obtentions.js`, généré par `tools/poke-obtentions.mjs` depuis le ROM)

**`POKE_AMBRE`** (Vieil Ambre) :
```js
{ objet: "OLD_AMBER", n: 142 /* Ptéra */, niveau: 30, lieu: "pewter-city" }
```
Ramassé au Musée d'Argenta (acte 1), ranimé à Cramois'Île (acte 6+). N'entre PAS dans le choix du Mont Sélénité.

**`POKE_FOSSILES`** (Mont Sélénité — choix EXCLUSIF, un seul emporté) :
```js
[{ objet: "DOME_FOSSIL", n: 140 /* Kabuto */, niveau: 30 },
 { objet: "HELIX_FOSSIL", n: 138 /* Amonita */, niveau: 30 }]
```

**`POKE_CADEAUX`** :
```js
[{ n: 133 /* Évoli */, niveau: 25, lieu: "celadon-city" },
 { n: 131 /* Lokhlass */, niveau: 15, lieu: "saffron-city" }]
```

**`POKE_CASINO`** (Céladopole ; lots par version) :
- **Rouge** : Abra (63) 180 jetons N.9 · Rondoudou (35) 500 N.8 · Nidorina (30) 1200 N.17 · Minidraco (147) 2800 N.18 · Scyther (123) 5500 N.25 · **Porygon (137) 9999 jetons N.26**
- **Bleu** : Abra (63) 120 jetons N.6 · Rondoudou (35) 750 N.12 · Nidorino (33) 1200 N.17 · Scarabrute (127) 2500 N.20 · Minidraco (147) 4600 N.24 · **Porygon (137) 6500 jetons N.18**
- Prix du jeton : **1 ₽** (`PRIX_JETON = 1`, arbitrage 17/08 — le ROM disait 10 ₽, rendu payable). Porygon reste l'espèce la plus chère.

**`POKE_DOJO`** (Safrania — choix EXCLUSIF entre deux) :
```js
{ lieu: "saffron-city", niveau: 20, choix: [106 /* Kicklee */, 107 /* Tygnon */] }
```
Le refusé est marqué **vu** au Pokédex (`dojoLaisse`).

**`POKE_ECHANGES`** (9 trocs PNJ ; `donne` → `recoit`, surnom canon conservé, niveau = celui du Pokémon cédé) :

| Étape | Donne | Reçoit | Surnom |
|---|---|---|---|
| route-11 | 33 Nidorino | 30 Nidorina | TERRY |
| route-2 | 63 Abra | 122 M. Mime | MARCEL |
| cramois-ile | 77 Galopa | 86 Hypotrempe | SAILOR |
| carmin | 21 Piafabec | 83 Canarticho | DUX |
| route-18 | 80 Flagadoss | 108 Excelangue | MARC |
| azuria | 61 Ptitard | 124 Lippoutou | LOLA |
| cramois-ile | 26 Rattatac | 101 Électrode | DORIS |
| cramois-ile | 48 Mimitor | 114 Saquedeneu | CRINKLES |
| route-5 | 32 Nidoran♂ | 29 Nidoran♀ | SPOT |

L'échange est **irréversible** (splice définitif), une fois par espèce reçue (`p.echanes`), et sert aussi d'**aller-retour d'évolution** (`candidatsRetour` : Pokémon évoluant par échange dans l'équipe ou la boîte — Alakazam, Ectoplasma, Grolem, Mackogneur).

**`POKE_MARTS`** (14 inventaires du ROM, filtrés par `inventaire()` qui retire `ESCAPE_ROPE|REPEL|SUPER_REPEL|MAX_REPEL|POKE_DOLL` — « hors monde ») :
- Viridian : POKE_BALL, ANTIDOTE, PARLYZ_HEAL, BURN_HEAL
- Pewter : POKE_BALL, POTION, ESCAPE_ROPE, ANTIDOTE, BURN_HEAL, AWAKENING, PARLYZ_HEAL
- Cerulean : POKE_BALL, POTION, REPEL, ANTIDOTE, BURN_HEAL, AWAKENING, PARLYZ_HEAL
- Vermilion : POKE_BALL, SUPER_POTION, ICE_HEAL, AWAKENING, PARLYZ_HEAL, REPEL
- Lavender : GREAT_BALL, SUPER_POTION, REVIVE, ESCAPE_ROPE, SUPER_REPEL, ANTIDOTE, BURN_HEAL, ICE_HEAL, PARLYZ_HEAL
- Celadon 2F (caisse 1) : GREAT_BALL, SUPER_POTION, REVIVE, SUPER_REPEL, ANTIDOTE, BURN_HEAL, ICE_HEAL, AWAKENING, PARLYZ_HEAL
- **Celadon 2F (caisse 2 — MART_MACHINES, ouvre à l'acte 4)** : TM_DOUBLE_TEAM, TM_REFLECT, TM_RAZOR_WIND, TM_HORN_DRILL, TM_EGG_BOMB, TM_MEGA_PUNCH, TM_MEGA_KICK, TM_TAKE_DOWN, TM_SUBMISSION
- Celadon 4F : POKE_DOLL, FIRE_STONE, THUNDER_STONE, WATER_STONE, LEAF_STONE
- Celadon 5F (caisse 1 — MART_COMBAT) : X_ACCURACY, GUARD_SPEC, DIRE_HIT, X_ATTACK, X_DEFEND, X_SPEED, X_SPECIAL
- Celadon 5F (caisse 2) : HP_UP, PROTEIN, IRON, CARBOS, CALCIUM (9 800 ₽ pièce)
- Fuchsia : ULTRA_BALL, GREAT_BALL, SUPER_POTION, REVIVE, FULL_HEAL, SUPER_REPEL
- Cinnabar : ULTRA_BALL, GREAT_BALL, HYPER_POTION, MAX_REPEL, ESCAPE_ROPE, FULL_HEAL, REVIVE
- Saffron : GREAT_BALL, HYPER_POTION, MAX_REPEL, ESCAPE_ROPE, FULL_HEAL, REVIVE
- Indigo Plateau : ULTRA_BALL, GREAT_BALL, FULL_RESTORE, MAX_POTION, FULL_HEAL, REVIVE, MAX_REPEL

`MARTS_PAR_ACTE` (boutique par acte, via `martPour(p)`) : Viridian (a1), Pewter (a2), Cerulean (a3), Vermilion (a4), Celadon 2F c1 (a5), Lavender (a6), Fuchsia (a7), Cinnabar (a8), Indigo Plateau (a9).

**`POKE_OBJETS`** (prix du ROM, extraits) : POKE_BALL 200, GREAT_BALL 600, ULTRA_BALL 1200, MASTER_BALL 0, SAFARI_BALL 1000, POTION 300, SUPER_POTION 700, HYPER_POTION 1500, MAX_POTION 2500, FULL_RESTORE 3000, ANTIDOTE 100, BURN_HEAL 250, ICE_HEAL 250, AWAKENING 200, PARLYZ_HEAL 200, FULL_HEAL 600, REVIVE 1500, MAX_REVIVE 4000, ESCAPE_ROPE 550, REPEL 350, SUPER_REPEL 500, MAX_REPEL 700, X_ATTACK 500, X_DEFEND 550, X_SPEED 350, X_SPECIAL 350, X_ACCURACY 950, DIRE_HIT 650, GUARD_SPEC 700, FIRE_STONE/THUNDER_STONE/WATER_STONE/LEAF_STONE 2100, HP_UP/PROTEIN/IRON/CARBOS/CALCIUM 9800, RARE_CANDY 4800, NUGGET 10000, POKE_DOLL 1000, FRESH_WATER 200, SODA_POP 300, LEMONADE 350, COIN 10, PP_UP 0, ETHER 0, MAX_ETHER 0, ELIXER 0, MAX_ELIXER 0, etc.

**Les CT (`ct.js`, généré)** : `W.POKE_CT` = 50 machines `{n, cle, prix (ROM, en ₽), type}` :
1 MEGA_PUNCH 3000 normal · 2 RAZOR_WIND 2000 normal · 3 SWORDS_DANCE 2000 normal · 4 WHIRLWIND 1000 normal · 5 MEGA_KICK 3000 normal · 6 TOXIC 4000 poison · 7 HORN_DRILL 2000 normal · 8 BODY_SLAM 4000 normal · 9 TAKE_DOWN 3000 normal · 10 DOUBLE_EDGE 4000 normal · 11 BUBBLEBEAM 2000 water · 12 WATER_GUN 1000 water · 13 ICE_BEAM 4000 ice · 14 BLIZZARD 5000 ice · 15 HYPER_BEAM 5000 normal · 16 PAY_DAY 5000 normal · 17 SUBMISSION 3000 fighting · 18 COUNTER 2000 fighting · 19 SEISMIC_TOSS 3000 fighting · 20 RAGE 2000 normal · 21 MEGA_DRAIN 5000 grass · 22 SOLARBEAM 5000 grass · 23 DRAGON_RAGE 5000 dragon · 24 THUNDERBOLT 2000 electric · 25 THUNDER 5000 electric · 26 EARTHQUAKE 4000 ground · 27 FISSURE 5000 ground · 28 DIG 2000 ground · 29 PSYCHIC_M 4000 psychic · 30 TELEPORT 1000 psychic · 31 MIMIC 2000 normal · 32 DOUBLE_TEAM 1000 normal · 33 REFLECT 1000 psychic · 34 BIDE 2000 normal · 35 METRONOME 4000 normal · 36 SELFDESTRUCT 2000 normal · 37 EGG_BOMB 2000 normal · 38 FIRE_BLAST 5000 fire · 39 SWIFT 2000 normal · 40 SKULL_BASH 4000 normal · 41 SOFTBOILED 2000 normal · 42 DREAM_EATER 2000 psychic · 43 SKY_ATTACK 5000 flying · 44 REST 2000 psychic · 45 THUNDER_WAVE 2000 electric · 46 PSYWAVE 4000 psychic · 47 EXPLOSION 3000 normal · 48 ROCK_SLIDE 4000 rock · 49 TRI_ATTACK 4000 normal · 50 SUBSTITUTE 2000 normal.
`W.POKE_CS` (5 CS) : CUT, FLY, SURF, STRENGTH, FLASH. `POKE_CT_PAR_CLE` indexe par clé d'attaque. Les CT s'achètent (rangées dans `p.ct[numéro]`, PAS dans le sac), se gagnent contre les Champions (CT du Champion), et s'apprennent **une seule fois** (`apprendreCT`).

### 5.2 Johto (`gen2/obtentions.js`, généré depuis Crystal)

**`POKE_GEN2_OBJETS`** (~140 clés `{nom, prix, tenu}`) — extrait des prix notables : POKE_BALL 200, GREAT_BALL 600, ULTRA_BALL 1200, POTION 300, SUPER_POTION 700, HYPER_POTION **1200** (≠ 1500 à Kanto), MAX_POTION 2500, FULL_RESTORE 3000, soins d'état 100-250, FULL_HEAL 600, REVIVE 1500, MAX_REVIVE 4000, RARE_CANDY 4800, vitamines 9800, PP_UP 9800, ETHER 1200, MAX_ETHER 2000, ELIXER 3000, MAX_ELIXER 4500, MOOMOO_MILK 500, FRESH_WATER 200, SODA_POP 300, LEMONADE 350, pierres 2100, SUN_STONE 2100, UP_GRADE 2100, DRAGON_SCALE 2100, EXP_SHARE 3000 (Multi Exp), objets tenus 10-500 (voir §6), PSNCUREBERRY 10, BERRY 10, GOLD_BERRY 10, MYSTERYBERRY 10, MIRACLEBERRY 10, baies de statut 10, apicorns 200, TINYMUSHROOM 500, BIG_MUSHROOM 5000, SLOWPOKETAIL 9800, PEARL 1400, BIG_PEARL 7500, STARDUST 2000, STAR_PIECE 9800, NUGGET 10000, RAGECANDYBAR 300, ENERGYPOWDER 500, ENERGY_ROOT 800, HEAL_POWDER 450, REVIVAL_HERB 2800, SACRED_ASH 200, Balls spéciales 150 (HEAVY_BALL, LEVEL_BALL, LURE_BALL, FAST_BALL, FRIEND_BALL, MOON_BALL, LOVE_BALL), LIGHT_BALL 100, courriers 50, etc.

**`POKE_GEN2_MARTS`** (34 comptoirs, par identifiant ROM — extrait) : MartCherrygrove (POTION, ANTIDOTE, PARLYZ_HEAL, AWAKENING), +Dex (POKE_BALL…), MartViolet (…, X_DEFEND, X_ATTACK, X_SPEED, FLOWER_MAIL), MartAzalea (CHARCOAL, …), MartCianwood (POTION, SUPER/HYPER_POTION, FULL_HEAL, REVIVE), MartGoldenrod 2F-1/2F-2/3F (objets X)/4F (vitamines)/5F (TM_THUNDERPUNCH, TM_FIRE_PUNCH, TM_ICE_PUNCH + TM_HEADBUTT/TM_ROCK_SMASH selon badge), MartOlivine, MartEcruteak, MartMahogany1 (TINYMUSHROOM, SLOWPOKETAIL, POKE_BALL, POTION), MartMahogany2 (RAGECANDYBAR…), MartBlackthorn, MartViridian, MartPewter, MartCerulean, MartLavender, MartVermilion, MartCeladon 2F-1/2F-2/3F (TM_HIDDEN_POWER, TM_SUNNY_DAY, TM_PROTECT, TM_RAIN_DANCE, TM_SANDSTORM)/4F/5F, MartFuchsia, MartSaffron, MartMtMoon (POKE_DOLL, FRESH_WATER, SODA_POP, LEMONADE, REPEL), MartIndigoPlateau (ULTRA_BALL, MAX_REPEL, HYPER/MAX_POTION, FULL_RESTORE, REVIVE, FULL_HEAL), MartUnderground (ENERGYPOWDER, ENERGY_ROOT, HEAL_POWDER, REVIVAL_HERB), DefaultMart (POKE_BALL, POTION).

**`POKE_GEN2_CT`** : 50 CT + 7 CS **dans l'ordre de 1999** (≠ 1996 !) : CT01 DYNAMICPUNCH, 02 HEADBUTT, 03 CURSE, 04 ROLLOUT, 05 ROAR, 06 TOXIC, 07 ZAP_CANNON, 08 ROCK_SMASH, 09 PSYCH_UP, 10 HIDDEN_POWER, 11 SUNNY_DAY, 12 SWEET_SCENT, 13 SNORE, 14 BLIZZARD, 15 HYPER_BEAM, 16 ICY_WIND, 17 PROTECT, 18 RAIN_DANCE, 19 GIGA_DRAIN, 20 ENDURE, 21 FRUSTRATION, 22 SOLARBEAM, 23 IRON_TAIL, 24 DRAGONBREATH, 25 THUNDER, 26 EARTHQUAKE, 27 RETURN, 28 DIG, 29 PSYCHIC_M, 30 SHADOW_BALL, 31 MUD_SLAP, 32 DOUBLE_TEAM, 33 ICE_PUNCH, 34 SWAGGER, 35 SLEEP_TALK, 36 SLUDGE_BOMB, 37 SANDSTORM, 38 FIRE_BLAST, 39 SWIFT, 40 DEFENSE_CURL, 41 THUNDERPUNCH, 42 DREAM_EATER, 43 DETECT, 44 REST, 45 ATTRACT, 46 THIEF, 47 STEEL_WING, 48 FIRE_PUNCH, 49 FURY_CUTTER, 50 NIGHTMARE ; CS : CUT, FLY, SURF, STRENGTH, FLASH, WHIRLPOOL, WATERFALL.

**Scènes Johto** (portes du registre, `null` si absentes) : `echanges` → `POKE_GEN2_ECHANGES`, `casino` → `POKE_GEN2_CASINO`, `cadeaux` → `POKE_GEN2_CADEAUX`, **`fossiles`/`dojo`/`ambre` → `null`** (à Kanto), `statiques` → `POKE_GEN2_STATIQUES` (7 rencontres posées : Simularbre, Lokhlass, Léviator rouge, Voltorbe du repaire…), `concours` → `POKE_GEN2_CONCOURS` (§14), `arbres` → `POKE_GEN2_ARBRES`, `oeufs` → `POKE_GEN2_OEUFS` (Pichu, Mélo, Toudoudou, Lippouti, Magby, Élekid, Debugant — seuls par œufs).

**Légendaires Johto** :
- **Les trois bêtes** (`POKE_GEN2_ERRANTS`, `gen2/voyage.js`) : libérées à la Tour Calcinée (`depuis: "tour-calcinee"`), puis **errantes** : `chance: 0.06` par nœud d'herbe traversé, `tours: 3` pour la capturer, `liste: [{n:243, niveau:40}, {n:244, niveau:40}, {n:245, niveau:40}]` (Raikou, Entei, Suicune). Elles **fuient** (combat borné à 3 tours).
- **Lugia / Ho-Oh** : épilogue du Mont Argenté (dresseur final : **Red** — `POKE_GEN2_RED`), cf. §13.
- **Célébi (251)** : mythique de Johto, `mythique() = { n: 251, niveau: 30, lieu: "ilex-forest" }` — même chasse que Mew (diplôme du monde + traces), niveau 30.

---

## 6. Les objets tenus gen2 — `POKE_GEN2_TENUS` (`gen2/objets-tenus.js`)

Données pures (le moteur lit ces valeurs) :
- `boost` : 17 renforts de type `HELD_*_BOOST` (normal, fighting, flying, poison, ground, rock, bug, ghost, steel, fire, water, grass, electric, psychic, ice, dragon, dark) ; `boostFacteur: 1.1` (×1,1 sur les dégâts d'un coup du même type).
- `leftovers` : `{ effet: "HELD_LEFTOVERS", part: 16 }` — 1/16 des PV max par fin de tour.
- `brightpowder` : `{ effet: "HELD_BRIGHTPOWDER", precision: 0.9 }` — précision adverse ×0,9 (pas de jet supplémentaire).
- `critique` : `{ effet: "HELD_CRITICAL_UP", facteur: 2 }` — taux de critique ×2.
- `metalPowder` : `{ effet: "HELD_METAL_POWDER", espece: 132, facteur: 1.5 }` — Défense de Métamorph ×1,5 (lui seul).
- `baies` : `HELD_BERRY: { soigne: 10, seuil: 0.5 }` — soigne 10 PV sous 50 % des PV, se consomme (seuil, pas de tirage).
- `viveGriffe` : `{ effet: "HELD_QUICK_CLAW", sur: 256, seuil: 60 }` — passe en premier **à priorité égale**, tirage 60/256 seulement si quelqu'un en porte.
- `flinch` : `{ effet: "HELD_FLINCH", sur: 256, seuil: 30 }` — apeure sur un coup porté (30/256, par coup porté du porteur).
- `rendPP` : `{ effet: "HELD_RESTORE_PP", pp: 5 }` — rend 5 PP au coup qui vient de tomber à 0 (seuil).
- `soins` (baies de statut, lèvent l'état et se consomment) : `HELD_HEAL_POISON: ["poison","poisonGrave"]`, `HELD_HEAL_PARALYZE: ["para"]`, `HELD_HEAL_FREEZE: ["gel"]`, `HELD_HEAL_BURN: ["brulure"]`, `HELD_HEAL_SLEEP: ["sommeil"]`, `HELD_HEAL_STATUS: [tous]`.
- **Hors de portée (aucune porte d'entrée — mécanique non écrite)** : `HELD_FOCUS_BAND` (Bandeau), `HELD_AMULET_COIN` (Pièce Rune), `HELD_CLEANSE_TAG` (Rune Purifiante), `HELD_ESCAPE` (Boule Fumée), `HELD_HEAL_CONFUSION` (Baie Amère).

---

## 7. Descriptions d'objets — `PokeDits` (`dits-objets.js`)

Porte unique `objet(cle, T, nomStat)` rendant une clé de texte (le dictionnaire est injecté). Ordre de résolution :
1. `RARE_CANDY` → « Super Bonbon ».
2. Vitamines : `PokeObtenir.VITAMINES[cle]` → phrase générique avec la statistique nommée.
3. `DIT_BALL` : MASTER_BALL / ULTRA_BALL / GREAT_BALL ; sinon tout `*BALL` → phrase générique.
4. Soins lus dans `PokeCombat.OBJETS_SOIN` : `ranime` (Rappel / Rappel Max), `soin` (nombre de PV, ou « tous les PV » si < 0) — uniquement si `!soin.etat` (la Guérison garde sa phrase complète).
5. `DIT_ETAT` : ANTIDOTE (poison), PARLYZ_HEAL (paralysie), AWAKENING (sommeil), BURN_HEAL (brûlure), ICE_HEAL (gel), FULL_HEAL (tous états).
6. `EXP_ALL` → phrase Multi Exp.
7. `DIT_OBJET` : X_ATTACK/X_DEFEND/X_SPEED/X_SPECIAL/X_ACCURACY/DIRE_HIT/GUARD_SPEC, REPEL×3, ESCAPE_ROPE, POKE_DOLL, FULL_RESTORE, et les trois objets « muets expliqués » : BICYCLE (Vélo), CARD_KEY (Carte Magnétique), GOLD_TEETH (Dentier).
8. `/STONE/` → phrase pierre ; `/ROD/` → `ditCanne(cle, T)` : compte les espèces atteignables via `PokeCarteActes.tablePeche` sur toutes les étapes, et dit si la canne est un barreau (`suite`) ou un sommet.
9. Sinon `""`.

---

## 8. Les chasses — `PokeChasses` (`chasses.js`)

11 chasses jugées **au bilan** (`PokePartie.bilan`), une seule fois par voyage (à la clôture). Chaque chasse ouvre **un** serment verrouillé. `mesure(b, c)` rend `[fait, sur]` ; `etat(compte, bilan)` liste tout (fait/non fait avec comptes) ; `evaluer(bilan, compte)` ne rend que le **neuf** ; `sermentsOuverts(compte)` construit l'ensemble pour `PokeSerments.offrir`.

| id | Nom | Condition (exacte) | Ouvre |
|---|---|---|---|
| `dixCroisees` | Dix croisées | `b.vus ≥ 10` (croiser, pas attraper) | `arpenteur` |
| `deuxBadges` | Deux badges | `b.badges ≥ 2` | `fureur` |
| `quatreBadges` | Quatre badges | `b.badges ≥ 4` | `oeil` |
| `septBadges` | Sept badges | `b.badges ≥ 7` | `titan` |
| `ligue` | La Ligue | `b.ligue` (Conseil 4 franchi) | `sacrifice` |
| `douzeEspeces` | Douze espèces | `b.pris ≥ 12` (dans un voyage) | `collection` |
| `trenteAuCompte` | Trente au compte | `c.pris ≥ 30` (espèces différentes **en tout**, compte) | `ermite` |
| `unLegendaire` | Un légendaire | `b.legendaires.length ≥ 1` | `marche` |
| `troisSerments` | Trois serments | `b.serments.length ≥ 3` | `silence` |
| `badgeSousSerment` | Parole tenue | badges ≥ 3 **et** (`solitude` ou `duel` dans `b.serments`) — l'ordre n'est pas mesurable | `fortune` |
| `sansPerte` | Aucun tombé | `b.badgesSansChute ≥ 3` (badges gagnés AVANT la première chute, figé par `partie.js`) ; repli ancien : `b.tombes === 0 ? b.badges : 0` | `rempart` |

---

## 9. La partie — `PokePartie` (`partie.js`)

### 9.1 Schéma de l'objet partie (`creer(config, h)`)
```js
{
  graine: h.source,
  version: "rouge" | "bleu" | "cristal",   // tirée : h.brut() < 0.5 → 1re version
  regles: "gen1" | "gen2",                  // scellé à la création
  genre: "f" | "h",
  nom, rival,                               // noms saisis
  regle: "voyage" | "express" | "nuzlocke",
  regleDuJour: <id> | null,
  compare: bool,                            // Défi du jour : verrouille vivier/compagnon/version
  acte: 1, rangee: 0, carteActe: null,      // 9 actes (8 Champions + Ligue)
  noeudsVisites: {}, noeudsPerdus: {}, branchesPerdues: 0,
  argent: 3000,
  equipe: [], boite: [], badges: [], cles: {},
  sac: { POKE_BALL: 12, POTION: 3 },        // équilibré (07/08) : 12 Balls, 3 Potions
  vus: {},                                  // n → true
  pris: {},                                 // n → { zone, niveau }
  etape: "bourg-palette",
  starter: null, starterRival: null,
  fossile: null, fossileRanime: false,
  jetons: 0,
  rivalVus: 0,
  echanges: {}, cadeaux: {},                // espèce reçue → true
  legendaires: {},                          // n → "pris" | "enfui"
  ligueGagnee: false,
  perdus: [],                               // Nuzlocke : morts définitifs
  fini: null,                               // "vitrine" | "equipe" | "epuise" | "abandon"
  journal: [],                              // journal de choix (résumé pour le serveur)
  mew: bool, mewTraces: 0,                  // chasse à Mew (3 traces)
  serments: [], sermentsOuverts: {}, sceau: 0, acquis: [],  // (posés par ailleurs)
  ct: {},                                   // n° CT → quantité
  echecsActe: {},                           // compteur d'essais par acte
  tombes: 0, badgesSansChute: 0,            // faits de voyage (chasse « aucun tombé »)
  pension: null,                            // { mon, depuis, acte }
  texture: {...},                           // stats de combats (cf. §16)
}
```
Au départ, si `!p.compare` : les **acquis emportés** (`PokeProgression.gardes()`) sont posés via `PokeAcquis.poser`.

### 9.2 Fonctions principales (portes)
- **Starter** : `choisirStarter(p, n, h)` — valide `PokeDepart.recevable(n)` (structurel) et le canon au Défi ; crée le starter **niveau 5** ; le rival prend `RIVAL_CONTRE[n]` (`{1:4, 4:7, 7:1}`) ou le starter qui le bat (`contreLeJoueur`).
- **Rival** : `tableRival()` (registre), `rencontresRival()` (8 à Kanto, 7 à Johto), `equipeRival(p, rencontre, vise)` — 3 premiers dans `debut`, suivants dans `milieu`, dernier dans `champion` ; niveau décalé à `max(as, vise−2, tête−2)` (jamais sans `vise` : canon pur à la Ligue).
- **Pokédex** : `voir(p,n)` (vu), `prendre(p,n,zone,niveau)` (pris + vu), `comptePokedex(p)` → `{vus, pris}`.
- **Atteignables** : `atteignablesSet(version)`, `atteignables(version)` (par version : herbes + eau + légendaires d'étapes + statiques + pêche + canon + fossiles + cadeaux + casino + dojo + ambre + œufs + **point fixe** évolutions/échanges), `atteignablesToutes()` (union des versions — Pokédex de compte). Kanto : ~139/version (78 sauvages par version) ; Mew jamais atteignable (canon).
- **Rencontre** : `rencontre(p, etape, milieu, h, {forcer, vise, dose})` — zone tirée `h.dans(zones)`, taux de rencontre `h.chance(bloc.taux * 100 / 187)` (sauté si `forcer`), créneau `h.pondere(bloc[version])`, niveau = `max(creneau.niveau, vise − (dose||4))` (rampe d'acte, −4 dosé par A/B ; jamais sous la table du ROM).
- **Carte** : `prendreNoeud(p, noeud)` — marque visité + **perd tous les autres nœuds de la rangée** (`noeudsPerdus`, `branchesPerdues += n−1`), `rangee++` ; les **traces de Mew** se comptent ici. `revenirAuNoeud(p)` — recule d'une rangée (nœud pris rejouable, les perdus restent perdus). `carteSansIssue(p)`.
- **Pension** : `pensionDepot(p, index)` (jamais le dernier Pokémon, une seule pension), `pensionReprise(p)` — à l'acte suivant : `niveaux = min(PENSION_MAX=5, nœudsFaits − depuis)`, prix 100 ₽/niveau (payé ce qu'on a), plafonné par `PokeActes.plafondPour(p)`, rendu à l'équipe (ou boîte si `equipeMax` atteint).
- **Acte** : `acteSuivant(p)` — reprend la pension, `acte++`, si acte > nombre d'actes → `fini = "vitrine"`.
- **Sac** : `aLaBall`, `aLObjet`, `utiliserObjet(p, cle)` (décrémente, supprime à 0), `utiliserBall`, `meilleureBall(p)` (ULTRA > GREAT > POKE, jamais la Master seule). **La Master Ball est unique** (une seule dans tout le jeu — la tour Silph) : 5 légendaires, il faut choisir.
- **Badge** : `gagnerBadge(p, arene)` — push `{ordre, badge, champion, acte}` ; met à jour `badgesSansChute` si aucune chute (`!p.tombes && !equipeAUneChute(p)`). `badgesActifs(p)` — stats par badge via `PokeRegles.badgesStat()` : Kanto `{1:"atk", 3:"vit", 5:"def", 7:"spe"}` (Roche→Attaque, Foudre→Vitesse, Âme→Défense, Volcan→Spécial), Johto `{1:"atk", 3:"vit", 6:"def", 7:"spe"}`.
- **Défaite** : `horsCombat(p)` — perd la moitié de l'argent (`floor(argent/2)`), équipe soignée. `echouerDansLActe(p)` — `ESSAIS_BOSS = 2` échecs par acte (toute cause : Champion OU route), au 2ᵉ → `fini = "epuise"`. `essaisRestants(p)`.
- **Nuzlocke** : `appliquerNuzlocke(p)` — compte `tombes` pour TOUTES les règles (avec marque `tombeCompte` levée au soin), et en `nuzlocke` retire l'équipe à terre dans `perdus` ; équipe vide → `fini = "equipe"`.
- **Équipe** : `mettreEnTete`, `deplacer`, `echangerReserve` (jamais de tombé en tête), `echangerAttaques` (hors combat).
- **Score** : voir §10.3.
- **Bilan** : `bilan(p)` — objet complet lu par l'écran de fin, la carte de partage et le classement (voir §16).

---

## 10. L'obtention — `PokeObtenir` (`obtenir.js`) et la progression de compte

### 10.1 `PokeObtenir` (portes d'obtention)
- **Achat** : `prixDe(cle)` (objet du registre, puis CT), `acheter(p, cle, combien)` (porte unique ; les CT vont dans `p.ct[n]`, pas le sac), `inventaire(nomMart)` (filtre HORS_MONDE), `martPour(p)` (acte → comptoir), `acheterJetons` (1 ₽/jeton), `lotsCasino(p)` (avec drapeau `unique` = `introuvableAilleurs`), `prendreLot`.
- **Échanges** : `echangesDe(p, etape)`, `echangeJouable`, `candidatsRetour`/`retourJouable`, `exemplairesDe`, `echanger(p, e, h, choix)` — splice définitif, reçu au niveau du cédé, surnom canon, une fois par espèce.
- **Fossiles/Ambre** : `prendreFossile(p, objet)` (un seul), `ranimer(p, h)` (à Cramois'Île, niveau 30), `ambreDisponible`, `prendreAmbre`, `ranimerAmbre`.
- **Cadeaux/Œufs** : `cadeauxDe(p, ou)`, `prendreCadeau` (une fois par espèce), `oeufDisponible`, `prendreOeuf` — tirage **pondéré** `h.entier(somme)` sur la table du ROM (Pichu 8 %, Mélo 16 %, Toudoudou 16 %…), une fois par voyage par œuf.
- **Dojo** : `dojoOuvert`, `choixDojo`, `prendreDojo` — exclusif, le refusé est marqué vu.
- **Pierres** : `pierrePossible`, `employerPierre` — passe par `M().evolutionParPierre` + `P().utiliserObjet`.
- **CT** : `ctDe(p)` (machines possédées triées), `machinePour(cle)` (clé `TM_X` → machine), `donnerCT`/`poserMachine`, `quiApprend`, `apprendreCT(p, index, machine, remplace)` — une CT = un usage.
- **Vitamines** : `VITAMINES = { HP_UP:"pv", PROTEIN:"atk", IRON:"def", CARBOS:"vit", CALCIUM:"spe" }`, `VITAMINE_GAIN = 2560` (pas du ROM), plafond `statExp[stat] >= 25600` ; le gain réel de stat est mesuré et rendu (`gain`).
- **Super Bonbon** : `employerBonbon` — refusé au plafond de l'acte (`PokeActes.plafondPour`), effet borné à `niveau + 1`.
- **Rangement** : `ranger(p, mon)` — équipe si `equipeMax` (composé des serments) le permet, sinon boîte ; rend `"equipe"|"boite"`.
- **« Où le trouver »** : `ouTrouver(version, n)` — pistes typées : `herbe`/`eau` (avec taux), `peche`, `echange`, `casino`, `cadeau`, `fossile`, `dojo`, `ambre`, `arbre`, `errant`, `concours`, `depart`, `legendaire`, `statique`, `oeuf`, `evolution` (triées : taux décroissant, évolutions en dernier).

### 10.2 `PokeProgression` — le compte (`localStorage "poke_progress"`)
Schéma `vide()` :
```js
{ v: 1,
  vus: {}, pris: {},              // n → { zone, niveau, version, quand }
  boite: [],                      // journal : { n, surnom } — UNE ligne par espèce
  pc: [],                         // réserve de compte : individus (clé `voyage#rang`), PC_MAX = 120
  diplomes: {},                   // monde → fiche
  voyages: 0, ligues: 0, badgesMax: 0, meilleurScore: 0,
  chromatiques: {},               // n → { quand, version } (1/8192)
  meilleurDV: {},                 // n → somme DV (max 60)
  regles: { voyage: true },       // déblocages (express, nuzlocke)
  gardes: [],                     // acquis emportés (GARDES_MAX = 1)
  compagnon: null,                // { n } — jamais au Défi
  duel: null,                     // { scelle, nom, badges, quand } — équipe du meilleur voyage
  rivaux: [],                     // { cle, nom, scelle, v, d, vu }
  defis: {},                      // id → { v, d } (palmarès des défis canon)
  genre: null,
  defiJour: null,                 // { date, score, badges, fini }
  defiHisto: [],                  // 30 derniers jours
  chasses: {},                    // id → quand
  sceauMax: 0, sceauNeuf: 0 }
```
- `lire()` complète les champs manquants avec `vide()` (compatibilité ascendante), `ecrire(p)`.
- `fusionner(partie, quand)` : **idempotente, non destructive** — ajoute vus/pris (avec version et date), boîte (1 ligne/espèce, surnom suivi), chromatiques, meilleurDV. `cloturer(partie, quand)` : **une seule fois** (drapeau `partie._clos`) — `voyages++`, `ligues++` si Ligue, `badgesMax`, `meilleurScore`, déblocages (`badgesMax ≥ 4` → express ; `ligues ≥ 1` → nuzlocke), **sceau** : si `ligueGagnee || badges == 8` → `sceauMax = min(8, joue + 1)` si `joue >= sceauMax` (un seul cran par voyage), **chasses** : `PokeChasses.evaluer(bilan, {chasses, pris})` → `chasses[id] = quand` + `chassesNeuves`.
- `palmares()` → `{ v:1, voyages, ligues, badges: badgesMax, score: meilleurScore, pokedex: nbPris, chromatiques, sceau: sceauMax, chasses, rang: rang().cle, diplome: 0|1 }` — la tranche qui voyage dans le code de duel.
- **Diplôme** : `DIPLOME_SEUIL = 150` historiquement ; désormais `obtenablesDuMonde(cle)` **calcule** le seuil = nombre d'espèces avec au moins une piste directe (toutes versions) + point fixe d'évolutions **dont la source s'attrape** → Kanto : **150**, Johto : **214**. Mew/Célébi exclus (aucune piste). `diplome(cle)` compte les prises **du monde** uniquement. `decernerDiplome()`.
- **Rang** (`rang()`) : paliers `maitre` (défi maitre gagné) > `ligue` (≥1 ligue) > `confirme` (≥8 badges) > `dresseur` (≥1 badge) > `debutant` ; rend aussi `suivant`, `n`, `sur`. **Aucun bonus** (règle : rien ne pèse où l'on se compare).
- **Défi du jour** : `defiDuJour(date)`, `ouvrirDefi(date)` (pose `defiJour` + pousse `defiHisto`, 30 max), `clore(date, resume)` ; `serieDefis(aujourdhui)` → `{encours, meilleure, joues}` (la série ne casse pas le jour même ; calcul en UTC, `veille()`), `calendrierDefis(aujourdhui, 30)` (trous compris), `meilleurJour`.
- **Duel** : `sceller(partie, quand)` (équipe scellée du meilleur voyage), `composerDuel`, `equipeDuel()`, `inscrireRival`, `noterDuel`, `carnet()`, `noterDefi`, `palmaresDefis()`, `genre()`.
- **Sauvegarde du voyage** : `voyageEcrire(partie, hasard, journal)` / `voyageLire` / `voyageEffacer` (`localStorage "poke_voyage"`, FORMAT 1) — garde l'**état de la graine** (`etat`, `tirages`) pour une reprise honnête ; **jamais pour le Défi** (triche impossible). `instantane()`/`restaurer(photo)`.
- **Compagnon** : `compagnonAutorise(regle, mode)` (jamais `compare`), `poserCompagnon(n)`.
- **Acquis emportés** : `gardes()`, `garder(id)` (plafond `GARDES_MAX = 1`, refuse doublon/inconnu), `rendre(id)`.

### 10.3 Le score (`PokePartie.POIDS` + `scoreDeBilan(b)`)
```js
POIDS = { badge: 40, ligue: 300, vu: 2, pris: 12, legendaire: 80,
          niveauEquipe: 2, acte: 45, nuzlocke: 1.5, express: 1.25, sceau: 0.1 }
```
`s = badges×40 + (ligue ? 300) + vus×2 + pris×12 + nbLégendaires×80 + round(Σniveaux × 2) + (acte−1)×45` ; puis `×1.5` (nuzlocke), `×1.25` (express), `×(1 + 0.1×sceau)` ; `max(0, round(s))`. `resumePourScore(p)` = `{badges, ligue, vus, pris, legendaires, equipe:[{niveau}], acte, regle, sceau}`. `score(p)` passe par le bilan.

---

## 11. La fusion nuage/local — `PokeFusion` (`fusion.js`)

Fichier **pur** (noyau) : le client et le serveur l'emploient tous les deux. Règle de fer : **`fusionner(a,b)` ne peut jamais rendre moins que ce qu'elle reçoit**. Politiques par champ (`POLITIQUE`) :
- `v: "max"` · `vus: "union"` (objets n→true) · `pris: "unionTot"` (la fiche la PLUS ANCIENNE gagne) · `boite`/`pc`: `"parCle"` (union par identité `voyage#rang`, les plus récents d'abord, plafond `PC_MAX=120` pour pc) · `voyages`/`ligues`/`badgesMax`/`meilleurScore`/`sceauMax`: `"max"` · `chromatiques`: `"unionTot"` · `diplomes`: `"unionTot"` · `meilleurDV`: `"maxPar"` · `regles`: `"union"` · `gardes`: `"local"` (un acquis emporté ne se fusionne pas — usage unique) · `compagnon`: `"siVide"` · `duel`: `"duel"` (le voyage mené le plus loin, départagé par badges) · `rivaux`: `"parCle"` · `defis`: `"maxVD"` (`{v,d}` max par champ) · `genre`: `"siVide"` · `defiJour`: `"jour"` (date la plus récente, « fini » gagne à date égale — un seul essai par jour) · `defiHisto`: `"histo"` (union par date, 30 derniers) · `chasses`: `"unionTot"` · `sceauNeuf`: `"local"`.
`assainir(p)` (serveur, AVANT fusion) : borne les formes — `v ∈ [0,99]`, espèces 1..`dexCompte()` (151 ou 251), niveaux 1..100, `boite`/`pc` plafonnés, attaques ≤ 4, `voyages/ligues/score ≤ 100000`, `badges ≤ 8`, `sceauMax ≤ 8`, chaînes tronquées (40/12/60/30/24/400/12), `defiJour`, `defiHisto`, `rivaux` (200), `defis`/`chasses` (200), version inconnue → première de `versionsToutes()`.
Constantes : `PC_MAX = 120`, `HISTO_MAX = 30`, `dexCompte()` (porte : 151 tant que Johto dort, 251 dès l'ouverture).

---

## 12. Le vivier de départ et Mew — `PokeDepart` (`depart.js`)

- **Vivier** : les 3 du canon (`PokeRegles.canon()` : Kanto `[1,4,7]`, Johto `[152,155,158]`) + **toute première forme capturée sur le compte** (`premieresFormes()` : rien n'évolue vers elle — calculé depuis `e.evolue[].vers`, Pikachu est première forme en gen1 mais plus en gen2), moins les **légendaires** (lus sur les étapes `legendaire`).
- `vivier({compare})` : `compare` → canon seul (Défi du jour / PvP). Hors navigateur (rejeu serveur) → canon seul (`recevable` reste la règle structurelle anti-triche).
- `recevable(n)` : première forme ET pas légendaire. `raisonFermee(n)` : `"legendaire" | "evolution" | "jamaisCapture" | null`.
- `compte()` → `{ouverts, ouvrables}`.
- **Le mythe de Mew** : `MEW = 151`, `EVEIL = 100`, `total = 150` (Mew exclu du seuil). `mythe()` → `{etat: "rien"|"remue"|"mew", pris, seuil, total}` : `pris ≥ 150` → `"mew"` ; `pris ≥ 100` → `"remue"` (le camion bouge) ; sinon `"rien"`. La chasse : **3 traces** (`MEW_TRACES = 3`, `partie.mewTraces`) ramassées sur des nœuds ordinaires (coûtent la branche d'à côté), tirage inconditionnel pour le rejeu. Célébi hérite de la même mécanique (`mythique()` du registre).

---

## 13. Le rejeu serveur — `PokeRejeu` (`rejeu.js`)

`replayDaily(date, journal, options)` → `{score, name, resume}` : `journal[0]` = résumé brut, passé dans `normaliser(brut, date)` puis `PokePartie.scoreDeBilan(resume)`.
- `normaliserDefi(b)` : `regle = "voyage"`, `sceau = 0` (aucun multiplicateur de compte au Défi).
- `LIMITES = { badges: 8, acte: 9, equipe: 6, niveau: 100, especes: 151, legendaires: 5 }`.
- Bornes : `badges ≤ acte−1` ; `ligue` seulement si `badges == 8 && acte == 9` ; espèces plafonnées par la version du jour (`prisesMaxDuJour(date)` = `PokePartie.atteignables(version)` où `version = h.brut() < 0.5 ? "rouge" : "bleu"` sur la graine `"POKE-JOUR-"+date`) **et** par l'acte (`ceil(max × (acte+2) / 11)` : acte 1 → 38, acte 3 → 63, acte 4 → 76, acte 9 → 139) ; `pris ≤ vus` ; **légendaires** filtrés par `acteDuLegendaire()` (Artikodin acte 7, Électhor 8, Sulfura 9, Mewtwo épilogue — avant l'acte 7 la liste doit être vide ; inconnu = on laisse passer) ; `equipe` niveaux bornés par `plafondNiveau(acte)` = max des `PokeActes.plafondDe(n, arènes, 0, false)` sur les actes 1..min(acte,8) + `MARGE_SERMENTS = 20` (acte 9 → 100) ; `texture` bornée (`n ≤ 2000`, `tours ≤ n×200`, `un ≤ n`, `eq ≤ n×6`, seaux nommés : `sauvage`, `dresseur`, `boss`).
- `nomDeRepli(date, resume)` : « Dresseur 1000..9999 » stable (hash ×31).
- `dureeMinimale(journal, date)` : `(acte−1)×40s + badges×25s` (plancher anti-soumission instantanée ; un voyage complet ≈ 520 s).
- Exposé à la racine : `W.replayDaily`, `W.dureeMinimale` (le serveur appelle `engineFor("poke").replayDaily`).

---

## 14. Le classement et la synchronisation — `PokeClassement` (`classement.js`)

- API : `POKE_API || "/api"`. Clés : `palmares_pid2` (appareil signé), `palmares_token` (session compte), `rtl_poke_defi_jeton`.
- **3 appels dans l'ordre** : 1) `POST /device` → `pid` signé ; 2) `POST /daily/start` `{date, sport:"poke", pid}` → consomme l'essai, rend un jeton daté ; 3) `POST /daily` `{sport, date, pid, token, name, score, journal:[résumé], ver}` — le serveur recalcule le score (`rejeu.js`) et refuse les incohérences (`score_mismatch`). Lecture : `GET /daily?sport=poke&date=…`.
- **Cercle de dresseurs** (clan) : `GET/POST /league`, `/league/create`, `/league/join`, `/league/leave` — code 8 caractères, 50 dresseurs max, 10 cercles créés max, classement hebdomadaire (depuis lundi, somme des meilleurs Défis) ; bouton « quitter » à double confirmation ; sans compte → mène à `index.html?go=compte&retour=poke`.
- `monde()` : `GET /pubstats` (compteur de joueurs du site).
- **`pokedexSynchroniser()`** : si jeton → `GET /poke/sync`, fusion locale (`PokeFusion.fusionner(P.lire(), nuage)`), `P.ecrire`, `POST /poke/sync` avec le fondu, réadoption du fondu serveur. Les deux côtés unissent, personne ne remplace. Panne → `false` silencieux.
- `jour()` (client), `dateLisible(cle)` (via `Intl`), règle du jour affichée pour la date consultée.

---

## 15. Les duels — `PokeDuel` (`duel.js`)

**PvP asynchrone sans serveur de match**, épingle sur la **gen 1** (`DUEL_REGLES = "gen1"` via `PokeRegles.pour`).
- `sceller(partie)` : `{v:1, equipe:[{n, niveau, dv, statExp, attaques:[clés]}]}` (6 max). `valider(scelle)` : refuse `scelle_invalide`, `equipe_trop_grande`, `espece_inconnue`, `niveau_hors_bornes` (1..100), `attaques_invalides`, `attaque_inconnue`, `dv_hors_bornes` (0..15). Aucun avantage de compte (ni compagnon, ni objet, ni badge).
- `reconstituer(scelle, h)` : recrée les Pokémon via `PokeMoteur.creer(n, niveau, h, {dv, attaques})` (PP pleins), applique statExp le cas échéant.
- `graineDuel(idA, idB, jour)` : `"POKE-DUEL-" + jour + "-" + min(idA,idB) + "-" + max(idA,idB)` (ordre fixe → même combat des deux côtés).
- `choisir(etat, cote, h)` : politique déterministe — si l'actif < 25 % PV et un remplaçant < 60 % PV encaisse mieux (`pire(cible, autre) < 0.6 × pire(cible, actif)`) → changer ; sinon note chaque attaque `puissance × efficacité × STAB (1.5)` (coups sans puissance notés 30 ; `PokeCombat.coupUtile` met à 0 les coups inutiles — anti-Dévorêve) et joue la meilleure.
- `jouer(scelleA, scelleB, idA, idB, jour)` : valide, reconstitue **dans l'ordre de la graine**, boucle max 500 tours (garde `duel_sans_fin`), même politique des deux côtés, **double K.O. tranché par la graine** (`h.brut() < 0.5` après le combat — le siège ne décide jamais). Rend `{vainqueur, tours, journal, graine, tirages}`.
- **Code d'équipe** : format compact base 36 : `PKD1 | empreinte | nom | mon1~mon2…` (optionnel ` | p<palmarès>`). Un mon : `n.niveau.dv.statExp.attaques` (séparateurs `.`, `-`, `~`, `|`). `empreinte()` = hash des tables (attaques par rang) ; un code périmé est REFUSÉ (`code_perime`). `PALM_ORDRE = ["voyages","ligues","badges","score","pokedex","chromatiques","sceau","chasses","diplome"]` + rang (`PALM_RANGS = ["debutant","dresseur","confirme","ligue","maitre"]`), marqué `p`. Le palmarès sort **à côté** du scellé (ne traverse jamais `valider` ni le combat).
- **Défis de Kanto** (`defis()`) : les 8 arènes + 4 Conseil + le Maître (`POKE_RIVAL.champion[0]`), chacun avec graine fixe `"POKE-DEFI-"+id` (`scellerDefi`) → échelle PvE identique pour tous.

---

## 16. L'écran de fin — `PokeFin` (`fin.js`)

- `afficher(hote, partie, surRejouer, surDuel, neuf, rangMonte)` — rend le bilan (`PokePartie.bilan(partie)`) : titre selon `b.fini` (`equipe` → « LE VOYAGE S'ACHÈVE », `epuise` → « LA ROUTE S'ARRÊTE ICI », `abandon` → « TU RENTRES », sinon « LA VITRINE DES MAÎTRES »), phrase de fin (`FINS` : finEquipe/finEpuise (`{n} K.O. dans le même acte`)/finAbandon/finInconnue), verdict `motDeFin(b)` (`ligue` → motChampion, `badges ≥ 5` → motProche, sinon motDebut avec « reste à croiser »), **le mur** (Champion suivant : « ton niveau contre le sien », si badges < 8 et équipe non vide), vitrine de l'équipe (avec `data-ko` pour les tombés), badges, légendaires, **ouverture du vivier** (départs neufs), **prochaine chasse** (la plus proche en part de chemin, avec barre et serment ouvert), **chasses décrochées** (`chassesNeuves` + serments ouverts), **échelle des sceaux** (nouveau sceau nommé, ou palier actuel, ou promesse avec distance), **règle du jour** (défi seulement), **rang** (`rangMonte`), **acquis à emporter** (choix/rendre, `GARDES_MAX = 1`, jamais au Défi), **score**, actions (rejouer / duel). 
- La **carte de partage** est un écran séparé (`carte-partage.js`, non détaillé ici) qui lit le même `bilan` — le fichier insiste : UNE SEULE source pour l'écran de fin, la carte et le classement.
- `PokeFin = { afficher, motDeFin }`.

---

## 17. Le concours gen2 — `POKE_GEN2_CONCOURS` (`gen2/concours.js`, généré depuis Crystal)

```js
{ vivier: [
    { n: 10, poids: 20, min: 7,  max: 18 },   // Chenipan
    { n: 13, poids: 20, min: 7,  max: 18 },   // Aspicot
    { n: 11, poids: 10, min: 9,  max: 18 },   // Chrysacier
    { n: 14, poids: 10, min: 9,  max: 18 },   // Coconfort
    { n: 12, poids: 5,  min: 12, max: 15 },   // Papilusion
    { n: 15, poids: 5,  min: 12, max: 15 },   // Dardargnan
    { n: 48, poids: 10, min: 10, max: 16 },   // Mimitor
    { n: 46, poids: 10, min: 10, max: 17 },   // Paras
    { n: 123, poids: 5, min: 13, max: 14 },   // Scyther
    { n: 127, poids: 5, min: 13, max: 14 } ], // Scarabrute
  jamaisTire: { n: 49, pourquoi: "rang terminateur -1, le vivier somme deja a 100 %" },
  prix: { premier: "SUN_STONE", deuxieme: "EVERSTONE", troisieme: "GOLD_BERRY", participation: "BERRY" },
  bareme: { pvMax: 4, atk: 1, def: 1, vit: 1, sat: 1, sdf: 1,
            pvRestantsSur: 8, objetTenu: 1, dvBit: 2,
            dvPoids: { vit: 1, spe: 4, atk: 8, def: 16 } },
  balls: 20, etape: "parc-national" }
```
Le concours se tient au Parc National (`etape: "parc-national"`) : 20 Balls, notation sur PV max / stats / PV restants / objet tenu / DV (bits pondérés), prix : Pierre Soleil, Pierre Stase, Baie Sitrus, Baie Oran.

---

## 18. La capture — `capture.js` (résumé, pour la boucle)

- Balls : `BALLS` (taux canon) ; `tenter(cible, cleBall, h, serments)` — 1er tirage : statut (`AIDE_STATUT`) ; 2e tirage `h.entier(256)` ≤ `valeur` avec `valeur = floor(pvMax × 255 × 4 / (pv × facteurBall))` (cap 255 → pris, 3 secousses) ; secousses selon la marge (3 si > 0.66, 2 si > 0.33, 1 si > 0.10, 0 sinon). MASTER_BALL → capture toujours.
- `chance(cible, cleBall, serments, statutSuppose)` : calcul **analytique sans tirage** (l'écran affiche « 2,6 % · endormi 16 % » pour Artikodin N.50 à la Super Ball).
- Les serments (× `capture`) s'appliquent au taux : `taux = clamp(round(taux × serments), 1, 255)`.
- Légendaires : nœud `{type:"legendaire", etape, lieu, espece}` — **un seul essai** (« et il ne revient pas ») ; `p.legendaires[n] = "pris" | "enfui"` ; score ne compte que les `"pris"`. Ravitaillement avant chasse (`pourLaChasse`) : trois lots de Balls (5-8 / 6-9 / 4-7) au lieu d'objets mixtes — qualité qui suit l'acte (Hyper Ball dès l'acte 6).

---

## 19. Équilibrage mesuré (repères pour la réécriture)

- Taux de victoire ciblés : arènes 3/7/8 ≈ 95-98 % ; murs mesurés : Erika ~7 %, Koga ~3 % à niveau égal (avant remèdes) ; Ligue ~10-18 % selon version.
- Attrition : ~42 % des débutants meurent à l'acte 2 ; médiane du mode : 3-4 badges.
- `ESSAIS_BOSS = 2` (3 → 2 le 15/08 : parcours complets 27,7 % → 17,2 %) ; rampe sauvage `vise − 4` ; rival `max(canon, vise−2, tête−2)` ; `EXP_ALL` poids 14, posé d'office ; plafond CT `[95,95,100,100,100,0,0,0,0]`.
- Argent : départ 3000 ₽ ; dresseur de route rapporte `300 + equipe.length × 250` ; butin argent `400 + acte×260 ± moitié` ; médiane de bourse devant légendaire ~12 593 ₽ (98 % peuvent s'offrir une Hyper Ball) ; Porygon à 9 999 jetons = 9 999 ₽ à 1 ₽/jeton.
- Plafond de niveau par acte : `PokeActes.plafondDe(n, arènes, sceau, marge)` — marges : 8 aux actes 1-4, 5 aux actes 5-6, 0 aux actes 7-8, `MARGE_LIGUE` au dernier ; sceau 3 (plafond) = barreau le plus dur (8 badges 47,1 → 36,5 %, Ligue 16,8 → 9,5 %).
