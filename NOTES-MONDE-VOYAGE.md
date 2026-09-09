# Road to Legends — Notes techniques : Monde & Voyage (Kanto + Johto)

Analyse complète des fichiers `js/poke/` en vue d'une réécriture (« vibe-coding »). Toutes les structures de données, les règles de progression et les mécaniques de carte y sont documentées avec leur **schéma exact** et des **exemples**.

> Fichiers analysés : `regles.js`, `monde.js`, `gen2/monde.js`, `voyage.js`, `gen2/voyage.js`, `actes.js`, `carte-actes.js`, `scenario.js`, `mesure-arene.js`, `dresseurs.js`, `gen2/dresseurs.js`, `classes.js`, `gen2/classes.js`, `gen2/equipes.js`, `gen2/rival.js`, `gen2/scenes.js`, `ordre.js`.
> Les dumps JSON indentés de toutes les globales (`notes-data/POKE_*.json`) ont été générés par chargement du noyau dans Node (VM) — source de vérité pour la réécriture.

---

## 1. Architecture générale

- **IIFE** : chaque fichier est `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);` — `W` est `window` (navigateur) ou `globalThis` (serveur de rejeu / outils Node).
- **Globales de données** : `W.POKE_*` (données pures, JSON) et **modules** `W.Poke*` (fonctions, ex. `PokeRegles`, `PokeActes`, `PokeCarteActes`, `PokeMesure`).
- **Registre** (`PokeRegles`, dans `regles.js`) : toute lecture de données passe par lui, jamais en direct sur les globales. Il connaît deux « jeux de règles » : `gen1` (Kanto, défaut) et `gen2` (Johto, inscrit **seulement si** `W.POKE_GEN2_ESPECE && W.POKE_GEN2_TYPE_TABLE` existent, i.e. si les fichiers gen2 sont chargés).
- **Génération des données** : `monde.js`, `dresseurs.js`, `gen2/*` sont des **fichiers générés** (bannière « FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN », produits par `node tools/poke-monde.mjs`, `poke-monde-gen2.mjs`, etc. depuis les ROM désassemblés `pret/pokered`, `pret/pokecrystal` + PokéAPI/Poképédia). Toute correction se fait dans le générateur.
- **Langue** : double table `{fr, en}` partout ; `W.POKE_LANG` choisit.
- **Espèces** : identifiées par `n` (numéro Pokédex national). Niveaux et espèces des équipes du ROM sont exacts, jamais adoucis (règle « le canon est la loi du mode »).

---

## 2. Ordre de chargement (`ordre.js`)

Globales posées :
- `W.POKE_ORDRE_NOYAU` : liste des fichiers du noyau (serveur de rejeu + client).
- `W.POKE_ORDRE_ECRANS` : liste des fichiers d'interface (jamais chargés par le serveur).
- `W.POKE_ORDRE` = `NOYAU.concat(ECRANS)` (liste complète, chargée par `gate.js`).
- `W.POKE_ORDRE_GEN2` : fichiers gen2 insérés dans le noyau **avant `regles.js`** (le registre n'inscrit Johto que si les globales existent déjà).
- `W.POKE_ORDRE_GEN2_ECRANS` : animations gen2, insérées après `anim-attaque.js`.
- `W.POKE_JOHTO_ETAT` : `"ferme"` | `"banc"` | `"ouvert"` (actuellement **`"ouvert"`**).
- `W.POKE_BANC_JOHTO` : booléen calculé — `johtoCharge()` : `ouvert` → vrai ; `banc` → vrai seulement si `location.hostname` ∈ {127.0.0.1, localhost, ::1, [::1]} ; sinon faux.

**Ordre du noyau (dans l'ordre)** : `rng.js` → `genre.js` → `types.js` → `regles.js` → `attaques.js` → `especes.js` → `monde.js` → `dresseurs.js` → `classes.js` → `obtentions.js` → `ct.js` → `moteur.js` → `combat.js` → `capture.js` → `voyage.js` → `actes.js` → `carte-actes.js` → `eclat.js` → `fusion.js` → `partie.js` → `depart.js` → `obtenir.js` → `butin.js` → `regle-du-jour.js` → `acquis.js` → `serments.js` → `chasses.js` → `sceaux.js` → `scenario.js` → `duel.js` → `rejeu.js`.
**Bloc GEN2 inséré avant `regles.js`** : `gen2/types.js` → `gen2/effets.js` → `gen2/effets-neufs.js` → `gen2/objets-tenus.js` → `gen2/obtentions.js` → `gen2/attaques.js` → `gen2/especes.js` → `gen2/dresseurs.js` → `gen2/rival.js` → `gen2/equipes.js` → `gen2/classes.js` → `gen2/monde.js` → `gen2/voyage.js` → `gen2/scenes.js` → `gen2/concours.js` → `gen2/sons.js` → `gen2/sons-attaques.js`.

Principes : le monde avant le moteur, le moteur avant l'interface ; un fichier qui touche au DOM/audio ne va que dans ECRANS ; tout ce qui modifie dégâts/capture/expérience (serments, acquis, règle du jour, sceaux) est dans le NOYAU pour que le rejeu serveur recalcule exactement le voyage joué.

---

## 3. Le registre `PokeRegles` (`regles.js`)

- `DEFAUT = "gen1"`. `PokeRegles.de(partie)` → clé du jeu de règles d'une partie (repli gen1 si absent). `poser(partieOuCle)` → pose le monde courant. `courante()` → clé posée.
- Chaque entrée `JEUX.gen1` / `JEUX.gen2` expose des **portes** (fonctions) : `types()`, `typeNoms()`, `table()` (table des types), `speciaux()`, `especes()` (dictionnaire n→espèce), `especesListe()`, `attaques()` (par clé), `attaquesListe()`, `dexTotal` (151 / 251), `arenes()`, `etapes()`, `clesVoyage()`, `badgePourCS()`, `badgesStat` (quels badges montent quelle stat), `sons()`, `sonsAttaques()`, `peche()`, `zones()`, `lieux()`, `versions()` + `versionsNoms`, `canon` (starters), `professeur`, `visages`, `maitre()`, `equipes()`, `classesDresseur()`, `rival()`, `dresseurFinal()`, `tenus()`, `objetsTable()`, `effetsNeufs()`, `errants()`, `mythique()`, `conseil()`, `echanges()`, `casino()`, `cadeaux()`, `fossiles()`, `dojo()`, `ambre()`, `statiques()`, `concours()`, `arbres()`, `oeufs()`, `speAtk`, `speDef`.
- **gen1** : `badgesStat {1:"atk", 3:"vit", 5:"def", 7:"spe"}` ; `canon [1,4,7]` ; professeur Chen ; `maitre() → null` (= le dernier combat est le **rival**) ; `mythique() → {n:151, niveau:7, lieu:null}` (Mew, chasse sans adresse) ; `versions ["rouge","bleu"]` ; `speAtk="spe"`, `speDef="spe"` (spécial unique) ; `statiques()` reconstruit la liste depuis `POKE_RONFLEX` (Ronflex n.30 sur chaque étape `ronflex:true`).
- **gen2** : `badgesStat {1:"atk", 3:"vit", 6:"def", 7:"spe"}` (Zéphyr→Attaque, Plaine→Vitesse, Minéral→Défense, Glacier→Spéciale) ; `canon [152,155,158]` ; professeur Orme ; `maitre() → POKE_GEN2_MAITRE` (Peter) ; `mythique() → {n:251, niveau:30, lieu:"ilex-forest"}` (Célébi au sanctuaire du Bois aux Chênes) ; `versions ["cristal"]` ; `speAtk="sat"`, `speDef="sdf"` (spéciales séparées) ; **les scènes ne replient JAMAIS sur Kanto** (ce que Johto n'a pas, il ne l'a pas : `fossiles`, `dojo`, `ambre` → null).
- **Traduction des effets d'attaque gen2** : les attaques de 1999 portent des noms d'effet différents ; `traduireAttaques()` recopie la table gen2 en remplaçant `effet` via `POKE_GEN2_EFFETS` (l'original reste dans `effetGen2`). Le moteur de combat ne change pas.
- Portes transverses : `especeToute(n)` (cherche dans le monde courant puis les autres — la collection appartient au compte), `dexTotalCompte()` (max des mondes), `nomObjet(cle)` / `objet(cle)` (monde courant → Kanto → gen2), `idSon(att)` / `idKanto(att)` (numéro de bruitage, garde d'identité de clé), `sexeDe(p)` (rapport de sexe par DV d'Attaque, octets `OCTET_DE_SEXE` : F12_5=0x1f, F25=0x3f, F50=0x7f, F75=0xbf, F100=0xfe ; `GENDER_F0`→toujours mâle, `GENDER_UNKNOWN`→null), `stats()` (liste des stats du monde), `versionsToutes()`, `nomVersion(cle)`.

---

## 4. Le monde Kanto

### 4.1 `POKE_LIEUX` (`monde.js`)
Dictionnaire `clé → {fr, en}` de **49 lieux** : villes (`pallet-town` Bourg Palette, `viridian-city` Jadielle, `pewter-city` Argenta, `cerulean-city` Azuria, `vermilion-city` Carmin sur Mer, `celadon-city` Céladopole, `lavender-town` Lavanville, `fuchsia-city` Parmanie, `saffron-city` Safrania, `cinnabar-island` Cramois'Île), routes `kanto-route-1..25` (pas de 20), chenaux `kanto-sea-route-19/20/21`, donjons (`mt-moon` Mont Sélénite, `digletts-cave` Cave Taupiqueur, `rock-tunnel` Grotte, `pokemon-tower` Tour Pokémon, `pokemon-mansion` Manoir Pokémon, `kanto-power-plant` Centrale, `seafoam-islands` Îles Écume, `cerulean-cave` Caverne Azurée, `kanto-victory-road-1/2` Route Victoire, `viridian-forest` Forêt de Jade, `kanto-safari-zone` Parc Safari), `ss-anne` (paquebot), `indigo-plateau` (Plateau Indigo).

### 4.2 `POKE_ETAPES` (`voyage.js`) — l'itinéraire de Kanto (51 étapes)
Schéma d'une étape :
| Champ | Type | Rôle |
|---|---|---|
| `id` | string | identifiant unique (kebab-case) |
| `lieu` | string | clé de `POKE_LIEUX` |
| `categorie` | string | `"ville"` \| `"route"` \| `"donjon"` \| `"scene"` \| `"eau"` \| `"safari"` \| `"ligue"` |
| `tables` | string[] | ids des tables de rencontre (`POKE_ZONES`) que l'étape recouvre |
| `exige` | string[] | clés de `POKE_CLES` requises pour entrer (verrous canon) |
| `exigeBadges` | int | nb de badges requis |
| `donne` | string[] | clés rendues par l'étape |
| `arene` | int | n° d'arène qui ferme l'acte |
| `boutique` | int | niveau de boutique (1-3) |
| `legendaire` | int | `n` du légendaire qui y dort |
| `depart` | bool | point de départ |
| `unique` | bool | étape à nœud unique |
| `fossile` / `fossileRanime` | bool | choix de fossile / ranimation |
| `rocket` | int | apparition Team Rocket (1-3) |
| `casino`, `pension`, `ronflex`, `camion`, `journalMewtwo` | bool | scènes |
| `apresLigue` | bool | exige la Ligue gagnée |

**Les 51 étapes dans l'ordre** (avec verrous) :
1. `bourg-palette` (pallet-town, ville, depart)
2. `route-1` (Route1)
3. `jadielle` (viridian-city, ville, boutique 1)
4. `route-22` (Route22) — le rival y barre la route
5. `route-2` (Route2, **donne flash**)
6. `foret-de-jade` (ViridianForest)
7. `argenta` (pewter-city, ville, **arène 1**, boutique 1)
8. `route-3` (Route3)
9. `mont-selenite` (MtMoon1F/B1F/B2F, fossile, rocket 1)
10. `route-4` (Route4)
11. `azuria` (cerulean-city, ville, **arène 2**, boutique 2)
12. `route-24` (Route24)
13. `route-25` (Route25, **donne ticket**)
14. `route-5` (Route5, pension)
15. `route-6` (Route6)
16. `carmin` (vermilion-city, ville, **arène 3**, boutique 2, **donne velo**)
17. `paquebot` (ss-anne, scene, **exige ticket**, **donne coupe**, unique, camion)
18. `route-11` (Route11)
19. `grotte-taupiqueur` (DiglettsCave)
20. `route-9` (Route9, **exige coupe**)
21. `route-10` (Route10)
22. `tunnel-roche` (RockTunnel1F/B1F, **exige flash**)
23. `lavanville` (lavender-town, ville, boutique 2)
24. `route-8` (Route8)
25. `route-7` (Route7)
26. `celadopole` (celadon-city, ville, **arène 4**, boutique 3, casino, **donne boisson**)
27. `repaire-rocket` (celadon-city, scene, rocket 2, **donne scope + carte**)
28. `tour-pokemon` (PokemonTower3F..7F, **exige scope**, **donne flute**)
29. `route-16` (Route16, ronflex, **exige flute**, **donne vol**)
30. `route-17` (Route17)
31. `route-18` (Route18)
32. `parmanie` (fuchsia-city, ville, **arène 5**, boutique 3)
33. `zone-safari` (SafariZoneCenter/East/North/West, safari, **donne surf + force + dentOr**)
34. `route-12` (Route12, ronflex, **exige flute**)
35. `route-13` (Route13)
36. `route-14` (Route14)
37. `route-15` (Route15)
38. `safrania` (saffron-city, ville, boutique 3, **exige boisson**)
39. `tour-silph` (saffron-city, scene, rocket 3, **donne master**)
40. `safrania-arene` (saffron-city, ville, **arène 6**, **exige master**)
41. `route-19` (SeaRoutes, **exige surf**)
42. `iles-ecume` (SeafoamIslands1F..B4F, **exige surf+force**, **légendaire 144 Artikodin**)
43. `route-21` (Route21, **exige surf**)
44. `cramois-ile` (cinnabar-island, ville, **arène 7**, boutique 3, fossileRanime, **exige cleSecrete**)
45. `manoir` (PokemonMansion1F..B1F, journalMewtwo, **donne cleSecrete**)
46. `centrale` (PowerPlant, **exige surf**, **légendaire 145 Électhor**)
47. `jadielle-arene` (viridian-city, ville, **arène 8**, exigeBadges 7)
48. `route-23` (Route23, **exige surf**, exigeBadges 8)
49. `route-victoire` (VictoryRoad1F/2F/3F, **exige force**, **légendaire 146 Sulfura**)
50. `plateau-indigo` (indigo-plateau, ligue)
51. `grotte-inconnue` (CeruleanCave1F/2F/B1F, **exige surf**, **apresLigue**, **légendaire 150 Mewtwo**)

### 4.3 Clés et portes de progression
`W.POKE_CLES` — chaque clé s'obtient par une scène canon, et par elle seule :
| clé | source | nom fr / en |
|---|---|---|
| `coupe` | paquebot | CS01 Coupe / HM01 Cut |
| `vol` | route-16 | CS02 Vol / HM02 Fly |
| `surf` | zone-safari | CS03 Surf / HM03 Surf |
| `force` | zone-safari | CS04 Force / HM04 Strength |
| `flash` | route-2 | CS05 Flash / HM05 Flash |
| `ticket` | route-25 | Ticket Bateau / S.S. Ticket |
| `scope` | repaire-rocket | Scope Sylphe / Silph Scope |
| `flute` | tour-pokemon | Poké Flûte / Poké Flute |
| `carte` | repaire-rocket | Carte Magnétique / Lift Key |
| `dentOr` | zone-safari | Dent d'Or / Gold Teeth |
| `velo` | carmin | Bicyclette / Bicycle |
| `master` | tour-silph | Master Ball / Master Ball |
| `boisson` | celadopole | Limonade / Fresh Water |
| `cleSecrete` | manoir | Clé Secrète / Secret Key |

`W.POKE_BADGE_POUR_CS = { flash: 1, coupe: 2, vol: 3, force: 4, surf: 5 }` — **une CS ne s'emploie pas sans son badge** : badge n°X requis pour utiliser la CS (comptés sur `partie.badges.length`). Ex. : Flash → badge 1, Coupe → 2, Vol → 3, Force → 4, Surf → 5.

`pokeOuverture(etape, partie)` rend `{ouverte, manque[]}` avec `manque` = liste de `{type:"cle"|"badgeCS"|"badges"|"ligue", cle?, requis?, obtenus?}`. ⚠️ **C'est documentaire sur la carte** : `generer()` de carte-actes ne filtre PAS les scènes par cette fonction (voir §11 — un verrou canon suppose un chemin unique, or la carte est à embranchements).

`W.POKE_RONFLEX = 143` — Ronflex des routes 12 et 16, rencontré au niveau 30 (via `statiques()` du registre).

---

## 5. Le monde Johto

### 5.1 `POKE_GEN2_LIEUX` (`gen2/monde.js`)
Dictionnaire de **45 lieux** : villes (`new-bark-town` Bourg Geon, `cherrygrove-city` Ville Griotte, `violet-city` Mauville, `azalea-town` Écorcia, `goldenrod-city` Doublonville, `ecruteak-city` Rosalia, `olivine-city` Oliville, `cianwood-city` Irisia, `mahogany-town` Acajou, `blackthorn-city` Ébènelle), routes `johto-route-29..46` (sauf 40/41, chenaux `johto-sea-route-40/41`), donjons (`sprout-tower` Tour Chétiflor, `bell-tower` Tour Carillon, `burned-tower` Tour Cendrée, `national-park` Parc Naturel, `ruins-of-alph` Ruines d'Alpha, `union-cave` Caves Jumelles, `slowpoke-well` Puits Ramoloss, `ilex-forest` Bois aux Chênes, `mt-mortar` Mont Creuset, `ice-path` Route de Glace, `whirl-islands` Tourb'Îles, `dark-cave` Antre Noir, `dragons-den` Antre du Dragon, `mt-silver`/`mt-silver-cave` Mont Argenté), `lake-of-rage` (Lac Colère), `indigo-plateau`.

### 5.2 `POKE_GEN2_ETAPES` (`gen2/voyage.js`) — 43 étapes, 9 actes
Même schéma que Kanto. Points saillants (verrous) :
- Acte 1 (→ Albert) : bourg-geon (depart) → route-29 → ville-griotte → route-30 → route-31 → tour-chetiflor → **mauville (arène 1)**.
- Acte 2 (→ Hector) : route-32 → caves-jumelles (**donne flash**) → grotte-obscure (**exige flash** ; Dark Cave VIOLET + BLACKTHORN entrances) → route-33 → puits-ramoloss (rocket 1) → **ecorcia (arène 2)**.
- Acte 3 (→ Blanche) : bois-aux-chenes (**donne coupe**) → route-34 (**exige coupe**) → **doublonville (arène 3, casino, pension, boutique 3)**.
- Acte 4 (→ Mortimer) : route-35 → parc-national → route-36 → ruines-alpha (unique) → route-37 → tour-calcinee (**libereErrants: true** — libère Raikou/Entei/Suicune) → **rosalia (arène 4, donne surf)**.
- Acte 5 (→ Chuck) : route-38 → route-39 → oliville-port → chenal-40 (**exige surf**) → chenal-41 (**exige surf**) → **irisia (arène 5, donne remede)**.
- Acte 6 (→ Jasmine) : tourbiles (**exige surf**, **donne ailArgent**) → phare-oliville (scene, **exige remede**) → **oliville (arène 6, exige remede, donne force)**.
- Acte 7 (→ Frédo) : route-42 → mont-creuset (**exige force**) → acajou-bourg → route-43 → lac-colere (scene, unique, **exige surf**, tables LAKE_OF_RAGE, **donne mdpRocket**) → repaire-rocket (**exige mdpRocket**, rocket 2, **donne ailArcEnCiel + master**) → **acajou (arène 7, exige mdpRocket)**.
- Acte 8 (→ Sandra) : route-44 → route-de-glace (Ice Path, **exige force**) → **ebenelle (arène 8, donne chute)** → antre-dragon (exigeBadges 8, unique, tables DRAGONS_DEN_B1F).
- Acte 9 : route-45 → route-46 → **plateau-indigo (ligue, exigeBadges 8)**.
- Après Ligue : `caverne-lugia` (WHIRL_ISLAND_LUGIA_CHAMBER, **exige surf+chute+ailArgent**, apresLigue, **légendaire 249**), `tour-carillon` (TIN_TOWER_2F..9F, **exige ailArcEnCiel**, apresLigue, **légendaire 250**), `mont-argente` (SILVER_CAVE_OUTSIDE/ROOM_1/2/3/ITEM_ROOMS, **exige force+chute**, apresLigue, **dresseurFinal "Red"**).

### 5.3 Clés Johto
`W.POKE_GEN2_CLES` : `coupe` (bois-aux-chenes), `surf` (rosalia), `force` (oliville), `flash` (caves-jumelles), `chute` (CS07 Cascade / HM07 Waterfall, ebenelle), `remede` (irisia), `mdpRocket` (lac-colere), `ailArgent` (tourbiles), `ailArcEnCiel` (repaire-rocket), `master` (repaire-rocket — **ajout du 20/08/2026**, la Master Ball de Johto, donnée au repaire car c'est la dernière rencontre Rocket).
`W.POKE_GEN2_BADGE_POUR_CS = { flash: 1, coupe: 2, force: 3, surf: 4, chute: 8 }` — Zéphyr→Flash, Essaim→Coupe, Plaine→Force, Brume→Surf, Lever→Cascade.
`W.POKE_GEN2_ERRANTS` — voir §12.

---

## 6. Tables de rencontres sauvages

### 6.1 `POKE_POIDS_CRENEAUX` (Kanto)
`[20, 20, 15, 10, 10, 10, 5, 5, 4, 1]` — **DIX créneaux** par table, poids du moteur d'origine (en %). « Un Pokémon à un pour cent reste à un pour cent » (pas d'arrondi/lissage).

### 6.2 `POKE_ZONES` (Kanto) — 56 zones
Schéma d'une entrée :
```json
{ "id": "Route1", "lieu": "kanto-route-1",
  "nom": { "fr": "Route 1", "en": "Route 1" },
  "herbe": { "taux": 25,
    "rouge": [ {"n": 16, "niveau": 3, "poids": 20}, ... 10 entrées ],
    "bleu":  [ ... même format ... ] },
  "eau": null | { "taux": 5, "rouge": [...10], "bleu": [...10] } }
```
- `taux` : fréquence de rencontre en marchant (8 à 30 ; Safari 30, Route1/2/16/17/18/22/24 25, grottes 10-15, Forêt de Jade 8).
- `rouge`/`bleu` : les deux **versions** du jeu (choix de départ). Chaque créneau : `{n, niveau, poids}`.
- `eau` : table de surf (seulement `Route21` et `SeaRoutes` — chenaux 19/20/21 — taux 5).
- Exemple réel (Route1, rouge) : Roucool n.16 niv.2-3 (poids 20/20/15/10), Rattata n.19 niv.2-4 (10/10/10/5/5/4/1).
- Zones couvertes : toutes les étapes + `SeaRoutes` (chenal 19/20). Les **2 premiers étages de la Tour Pokémon n'ont pas de table** (canon : que des dresseurs). `CeruleanCave*` (3 zones), `MtMoon*` (3), `PokemonMansion*` (4), `PokemonTower3F..7F` (5), `RockTunnel*` (2), `SeafoamIslands1F..B4F` (5), `VictoryRoad1F/2F/3F` (3), `SafariZone*` (4), `PowerPlant`, `DiglettsCave`, `ViridianForest`, routes 1-18, 21-25.

### 6.3 `POKE_PECHE` (Kanto)
```json
{ "canne": [ {n:129, niveau:5} ],                       // Canne : Magicarpe niv.5 uniquement
  "bonne": [ {n:118, niveau:10}, {n:60, niveau:10} ],   // Bonne Canne : Poissirène, Ptitard
  "mega": { "groupes": { "Group1": [ {n:72,niveau:15}, {n:60,niveau:15} ], ... Group1..Group10 },
            "parCarte": { "PALLET_TOWN": "Group1", "ROUTE_4": "Group3", ... 33 cartes } } }
```
- La **Méga Canne** indexe par **carte ROM** (majuscules, ex. `ROUTE_4`, `CERULEAN_GYM`, `SAFARI_ZONE_EAST`). Groupes notables : Group5 (Ptitard n.61 niv.23 + Tentacool), Group6 (Minidraco n.147), Group7 (Krabby n.72 niv.5...), Group9 (niv.23 : Aquali/Staross...) etc.
- Les 10 groupes : Group1 (Tentacool, Ptitard), G2 (Poissirène, Ptitard), G3 (Psykokwak, Poissirène, Krabby), G4 (Krabby, Kokiyas), G5 (Ptitard n.23, Tentacool), G6 (Minidraco, Krabby, Psykokwak, Tentacool), G7 (Krabby n.5, Krabby, Poissirène, Magicarpe), G8 (Stari, Hypotrempe, Kokiyas, Poissirène), G9 (Aquali, Staross, Krabboss, Hypocéan n.23), G10 (Staross n.23, Krabby, Poissirène, Magicarpe).

### 6.4 `POKE_GEN2_ZONES` (Johto) — 73 zones
**Format différent** (pas de versions rouge/bleu, pas de créneaux horaires séparés) :
```json
{ "id": "SPROUT_TOWER_2F", "lieu": "sprout-tower", "taux": 2,
  "herbe": { "cristal": [ {n:19, niveau:5, poids:8}, ... ] },
  "eau": null | { "cristal": [ {n:..., niveau:..., poids:...}, ... ] } }
```
- `taux` : le **meilleur** des trois moments de la journée du ROM ; `herbe.cristal` : créneaux **fondus** des trois moments (matin/jour/nuit) avec leurs poids — le mode n'a pas d'horloge, fondre garde les espèces de nuit atteignables. Le générateur produit **8+ créneaux** (parfois 13), souvent plusieurs niveaux par espèce (ex. SPROUT_TOWER : Rattata n.19 niv.3-6, Fantominus n.92 niv.3-6).
- `eau.cristal` : tables de surf (3 créneaux) sur les cartes aquatiques.
- Zones : toutes routes/donjons Johto + villes avec eau (taux 0, herbe vide, eau 3) + `DRAGONS_DEN_B1F` (eau seulement : Magicarpe/Minidraco/Draco à la surf), `OLIVINE_PORT`, `LAKE_OF_RAGE` (eau : Magicarpe + Léviator), `SILVER_CAVE_*` (5 zones), `WHIRL_ISLAND_*` (7 zones dont LUGIA_CHAMBER), `TIN_TOWER_2F..9F`, etc. **⚠️ `POKE_GEN2_ZONES` n'est chargé par personne en production** (note `tools/poke-gen2-close.mjs`) — l'état `JOHTO="ouvert"` le rend actif.

### 6.5 `POKE_GEN2_PECHE` et `POKE_GEN2_PECHE_ROM`
- `POKE_GEN2_PECHE` : **même forme que Kanto** (`canne`, `bonne`, `mega.groupes`, `mega.parCarte`) — c'est celle que le jeu lit. Canne : Magicarpe n.129 niv.10 + Krabby n.98 niv.10 ; Bonne : + Corayon n.222, Stari n.120 (niv.20) ; Méga (niv.40) : groupes `Shore`, `Ocean`, `Lake`, `Pond`, `Dratini`, `Dratini_2`, `Gyarados`, `WhirlIslands`, `Qwilfish`, `Remoraid`, indexés par carte ROM (`JOHTO_ROUTE_32`→Qwilfish, `DRAGONS_DEN`→Dratini, `LAKE_OF_RAGE`→Gyarados, `NEW_BARK_TOWN`→Ocean, etc.).
- `POKE_GEN2_PECHE_ROM` : la table brute du ROM, 39 tables `<Biotope>_<Canne>` (Old/Good/Super), chacune une liste de `{seuil, espece, niveau}` avec **seuils cumulatifs** (ex. Shore_Old : seuil 71 Magicarpe n.10, 86 Magicarpe n.10, 100 Krabby n.10). Gardée pour relecture.

---

## 7. Les 8 arènes de Kanto (`POKE_ARENES`, `dresseurs.js`)

Schéma : `{ordre, ville, nom:{fr,en}, champion, championEn, badge, badgeEn, type, ct, equipe:[{n, niveau}]}`. `ct` = clé de CT (TM). Aucun Champion adouci.

| # | Ville | Champion | Badge | Type | CT | Équipe (niveaux) |
|---|---|---|---|---|---|---|
| 1 | Argenta (pewter-city) | Pierre / Brock | Roche (Boulder) | Roche | TM_BIDE | Racaillou n.74 @12, Onix n.95 @14 |
| 2 | Azuria (cerulean-city) | Ondine / Misty | Cascade | Eau | TM_BUBBLEBEAM | Stari n.120 @18, Staross n.121 @21 |
| 3 | Carmin sur Mer (vermilion-city) | Major Bob / Lt. Surge | Foudre (Thunder) | Électrik | TM_THUNDERBOLT | Voltorbe n.100 @21, Pikachu n.25 @18, Raichu n.26 @24 |
| 4 | Céladopole (celadon-city) | Erika | Prisme (Rainbow) | Plante | TM_MEGA_DRAIN | Empiflor n.71 @29, Saquedeneu n.114 @24, Rafflesia n.45 @29 |
| 5 | Parmanie (fuchsia-city) | Koga | Âme (Soul) | Poison | TM_TOXIC | Smogogo n.109 @37, Nosferalto n.42 @40, Grotadmorv n.89 @39, Aéromite n.49 @43, Smogogo n.110 @43 |
| 6 | Safrania (saffron-city) | Morgane / Sabrina | Marais (Marsh) | Psy | TM_PSYWAVE | Kadabra n.64 @40, M. Mime n.122 @39, Aéromite n.49 @40, Hypnomade n.97 @44, Alakazam n.65 @48 |
| 7 | Cramois'Île (cinnabar-island) | Auguste / Blaine | Volcan (Volcano) | Feu | TM_FIRE_BLAST | Caninos n.58 @42, Ponyta n.77 @40, Galopa n.78 @42, Magmar n.126 @45, Arcanin n.59 @47 |
| 8 | Jadielle (viridian-city) | Giovanni | Terre (Earth) | Sol | TM_FISSURE | Rhinocorne n.111 @45, Triopikeur n.51 @42, Nidoqueen n.31 @44, Nidoking n.34 @45, Rhinoféros n.112 @50 |

⚠️ Rééquilibrage (`actes.js`) : Koga et Morgane hissés à **5 Pokémon** ; Auguste (arène 7) hissé au niveau effectif **67** et Giovanni (arène 8) à **70** (`EFFECTIF_FIN = {7:67, 8:70}`) ; Auguste porte 2 Hyper Potions (`soinsDeChampion`). L'arène 2 reçoit +3 niveaux. Les niveaux du ROM ci-dessus sont la **base canon** ; le niveau effectif affiché en jeu = canon + `monteeChampion(ordre)`.

---

## 8. Les 8 arènes de Johto (`POKE_GEN2_ARENES`, `gen2/dresseurs.js`)

Schéma : identique + **`attaques` explicites** (noms ROM, 2-4 par Pokémon) — la gen 2 fournit les attaques exactes, contrairement à la gen 1.

| # | Ville | Champion | Badge | Type | CT | Équipe (niveaux + attaques) |
|---|---|---|---|---|---|---|
| 1 | Mauville (violet-city) | Albert / Falkner | Zéphyr | Vol | TM_MUD_SLAP | Roucool n.16 @7 [TACKLE, MUD_SLAP], Roucoups n.17 @9 [+GUST] |
| 2 | Écorcia (azalea-town) | Hector / Bugsy | Essaim | Insecte | TM_FURY_CUTTER | Papilusion n.12 @14 [TACKLE, STRING_SHOT, HARDEN], Dardargnan n.14 @14 [POISON_STING...], Scarabrute n.123 @16 [QUICK_ATTACK, LEER, FURY_CUTTER] |
| 3 | Doublonville (goldenrod-city) | Blanche / Whitney | Plaine | Normal | TM_ATTRACT | Mélofée n.35 @18 [DOUBLESLAP, MIMIC, ENCORE, METRONOME], Écrémeuh n.241 @20 [ROLLOUT, ATTRACT, STOMP, MILK_DRINK] |
| 4 | Rosalia (ecruteak-city) | Mortimer / Morty | Brume | Spectre | TM_SHADOW_BALL | Fantominus n.92 @21, Spectrum n.93 @21, Ectoplasma n.94 @25 [HYPNOSIS, SHADOW_BALL, MEAN_LOOK, DREAM_EATER], Spectrum n.93 @23 |
| 5 | Irisia (cianwood-city) | Chuck | Choc | Combat | TM_DYNAMICPUNCH | Férosinge n.57 @27, Mackogneur n.62 @30 [HYPNOSIS, MIND_READER, SURF, DYNAMICPUNCH] |
| 6 | Oliville (olivine-city) | Jasmine | Minéral | Acier | TM_IRON_TAIL | Magnéti n.81 @30 ×2 [THUNDERBOLT...], Steelix n.208 @35 [SCREECH, SUNNY_DAY, ROCK_THROW, IRON_TAIL] |
| 7 | Acajou (mahogany-town) | Frédo / Pryce | Glacier | Glace | TM_ICY_WIND | Lamantine n.86 @27, Lamantine n.87 @29, Cochignon n.221 @31 [ICY_WIND, FURY_ATTACK, MIST, BLIZZARD] |
| 8 | Ébènelle (blackthorn-city) | Sandra / Clair | Lever | Dragon | TM_DRAGONBREATH | Draco n.148 @37 ×3 (SURF / THUNDERBOLT / ICE_BEAM variantes), Hyporoi n.230 @40 [SMOKESCREEN, SURF, HYPER_BEAM, DRAGONBREATH] |

`badgeEn` est `null` pour Johto (pas de traduction EN du badge). Jasmine n'est défiable qu'**après** le remède (verrou scénario, étape `oliville` exige `remede`).

---

## 9. Conseil 4 + Champion

### 9.1 Kanto (`POKE_CONSEIL`) — aucun soin entre les 5 combats
Schéma : `{ordre, nom, nomEn, equipe:[{n, niveau}]}`.
1. **Olga / Lorelei** (Glace) : Lokhlass n.87 @54, Clamiral n.91 @53, Flagadoss n.80 @54, Lippoutou n.124 @56, Lokhlass n.131 @56.
2. **Aldo / Bruno** (Combat) : Onix n.95 @53, Kicklee n.107 @55, Tygnon n.106 @55, Onix n.95 @56, Mackogneur n.68 @58.
3. **Agatha** (Spectre) : Ectoplasma n.94 @56, Nosferalto n.42 @56, Spectrum n.93 @55, Arbok n.24 @58, Ectoplasma n.94 @60.
4. **Peter / Lance** (Dragon) : Léviator n.130 @58, Draco n.148 @56, Draco n.148 @56, Ptéra n.142 @60, Dracolosse n.149 @62.
- **Champion = le rival** (`POKE_RIVAL.champion`, voir §10). `PokeActes.monteeLigue()` = **+14** appliqué à tout le bloc : Olga 56→70, Aldo 58→72, Agatha 60→74, Peter 62→76, rival 65→79 (décalage **plat**, les écarts internes du ROM préservés).

### 9.2 Johto (`POKE_GEN2_CONSEIL` + `POKE_GEN2_MAITRE`)
1. **Marion / Will** (Psy) : Xatu n.178 @40, Lippoutou n.124 @41, Noadkoko n.103 @41, Flagadoss n.80 @41, Xatu n.178 @42.
2. **Koga** (Poison) : Migalos n.168 @40, Aéromite n.49 @41, Forretress n.205 @43, Grotadmorv n.89 @42, Nostenfer n.169 @44.
3. **Aldo / Bruno** (Combat) : Kapoera n.237 @42, Tygnon n.106 @42, Kicklee n.107 @42, Onix n.95 @43, Mackogneur n.68 @46.
4. **Marina / Karen** (Ténèbres) : Noctali n.197 @42, Rafflesia n.45 @42, Ectoplasma n.94 @45, Cornèbre n.198 @44, Démolosse n.229 @47.
- **Maître = Peter / Lance** (`POKE_GEN2_MAITRE`, niveau 44-50) : Léviator n.130 @44, Dracolosse n.149 @47 ×2, Ptéra n.142 @46, Dracaufeu n.6 @46, Dracolosse n.149 @50.
- Les attaques de chaque membre sont explicites dans les données (ex. Marion : PSYCHIC_M, FUTURE_SIGHT...).
- **Red** (`POKE_GEN2_RED`, épilogue Mont Argenté, `dresseurFinal`) : Pikachu n.25 @81, Mentali n.196 @73, Ronflex n.143 @75, Florizarre n.3 @77, Dracaufeu n.6 @77, Tortank n.9 @77 — le combat le plus dur des deux générations (81-88 annoncés ; le dump montre 73-81).

---

## 10. Le rival

### 10.1 Kanto (`POKE_RIVAL`) — 8 rencontres × 3 variantes
Structure : `{ debut: [...], milieu: [...], champion: [...] }` — **3 moments**, chaque moment contient `nbRencontres × 3` équipes (variante 1 = joueur a Carapuce → rival Bulbizarre ; v2 = Bulbizarre → Salamèche ; v3 = Salamèche → Carapuce). Le rival prend toujours le starter qui **bat** le tien. Les attaques ne sont pas listées (dérivées par le moteur). Rencontres (niveaux) :
- **debut** (3 rencontres) : R1 : starter @5. R2 : Roucool @9 + starter rival @8. R3 : Roucoups @18, Abra @15, Rattata @15, starter évolué @17.
- **milieu** (4 rencontres) : R1 : Roucoups @19, Rattatac @16, Kadabra @18, starter@20. R2 : Roucoups @25, (Léviator|Caninos|Noeunoeuf) @22-23, Kadabra @20, starter @25. R3 : Roucarnage @37, (Caninos|Léviator|Noeunoeuf) @35-38, Alakazam @35, starter final @40. R4 : Roucarnage @47, Rhinocorne @45, (Caninos|Léviator|Noeunoeuf) @45-47, Alakazam @50, starter final @53.
- **champion** (1 rencontre, = Champion de la Ligue) : Roucarnage @61, Alakazam @59, Rhinoféros @61, (Arcanin|Léviator|Noadkoko) @61-63, starter final @65.
- Le registre expose le rival Kanto sous `{ordre:[7,1,4], rencontres:8, debut, milieu, champion}`.

### 10.2 Johto (`POKE_GEN2_RIVAL`) — 7 rencontres × 3 variantes
Structure : `{ ordre: [152,155,158], rencontres: 7, debut: [...], milieu: [...] }` — **l'ordre est DANS la table** : `debut` = rencontres 1-3 (9 entrées), `milieu` = rencontres 4-7 (12 entrées). Pas de bloc `champion` : la Ligue se clôt sur Peter. Variante = starter du joueur (Germignon/Héricendre/Kaiminus) ; le rival a l'avantage de type (Macronium/Feurisson/Crocrodil). Attaques explicites à partir de la R3. Rencontres (niveaux) :
- R1 : starter @5. R2 : Fantominus @12, Nosferapti @14, starter évolué @16. R3 : Spectrum @20, Magnéti @18, Nosferapti @20, starter @22.
- R4 : Nosferalto @30, Magnéti @28, Spectrum @30, Farfuret @32, starter final @32. R5 : Farfuret @34, Nosferalto @36, Magnéton @35, Spectrum @35, Kadabra @35, starter final @38. R6 : Farfuret @41, Nosferalto @42, Magnéton @41, Ectoplasma @43, Alakazam @43, starter final @45. R7 : Farfuret @45, Nostenfer @48, Magnéton @45, Ectoplasma @46, Alakazam @46, starter final @50.
- Sur la carte, le rival est une **scène** posée une fois par acte (actes 1-7, `rencontre: acte.n - 1`) ; la 8ᵉ rencontre n'existe pas — à Johto la Ligue est Peter.

---

## 11. Classes de dresseurs et équipes de route

### 11.1 `POKE_CLASSES` (Kanto) et `POKE_GEN2_CLASSES` (Johto)
Schéma : `{ "Classe": {"fr": "...", "en": "...", "route": bool} }` — `route:true` = peut apparaître au hasard sur un nœud de la carte. Les Champions, le Conseil 4, le rival, le professeur et la Team Rocket (repaires) n'y sont pas (`route:false` ou absents).
- Kanto (29 classes, route=true sauf Rocket/UnusedJuggler) : Beauty→Canon, Biker→Motard, BirdKeeper→Ornithologue, Blackbelt→Karatéka, BugCatcher→Scout, Burglar→Pillard, Channeler→Exorciste, CooltrainerF/M→Topdresseur, CueBall→Loubard, Engineer→Mécano, Fisher→Pêcheur, Gambler→Croupier, Gentleman, Hiker→Montagnard, JrTrainerF/M→Dresseur Jr, Juggler→Jongleur, Lass→Fillette, Pokemaniac, Psychic→Kinésiste, Rocker, Rocket (route:false), Sailor→Marin, Scientist→Scientifique, SuperNerd→Intello, Swimmer→Nageur, Tamer→Dompteur, UnusedJuggler (route:false).
- Johto (40 classes) : ajoute Boarder→Surfer, Camper→Campeur, ExecutiveF/M→Caïd Rocket (route:false), Firebreather→Crache-Feu, GruntF/M→Sbire Rocket (route:false), Guitarist→Guitariste, KimonoGirl→Kimono, Medium→Médium, Officer→Officier, Picnicker→Pique-Nique, PokefanF/M→Pokéfan, Sage→Sage, Schoolboy→Écolier, Skier→Skieuse, SwimmerF→Nageuse, SwimmerM→Nageur, Teacher→Prof, Twins→Jumelles, Youngster→Gamin.

### 11.2 `POKE_CLASSES_ROM` (Kanto)
Tableau des **noms ROM bruts** (47 entrées) : `"YOUNGSTER", "BUG CATCHER", "LASS", "SAILOR", "JR.TRAINER♂", "JR.TRAINER♀", "POKéMANIAC", "SUPER NERD", "HIKER", "BIKER", "BURGLAR", "ENGINEER", "JUGGLER", "FISHERMAN", "SWIMMER", "CUE BALL", "GAMBLER", "BEAUTY", "PSYCHIC", "ROCKER", "JUGGLER", "TAMER", "BIRD KEEPER", "BLACKBELT", "RIVAL1", "PROF.OAK", "CHIEF", "SCIENTIST", "GIOVANNI", "ROCKET", "COOLTRAINER♂", "COOLTRAINER♀", "BRUNO", "BROCK", "MISTY", "LT.SURGE", "ERIKA", "KOGA", "BLAINE", "SABRINA", "GENTLEMAN", "RIVAL2", "RIVAL3", "LORELEI", "CHANNELER", "AGATHA", "LANCE"`. ⚠️ Historique : ce tableau s'appelait `POKE_CLASSES` et était écrasé par `classes.js` (chargé 2 lignes plus loin) — d'où le renommage `_ROM`.

### 11.3 `POKE_EQUIPES` (Kanto) — 46 classes, 400+ équipes
Schéma : `{ "Classe": [ [ {n, niveau}, ... ], ... ] }` — liste d'équipes possibles pour la classe (chacune = une variante de dresseur du ROM). Résumé (nb équipes / tailles / niveaux) :
- BugCatcher 14 (1-4, 6-20) · Lass 18 (1-5, 9-31) · Sailor 8 (1-3, 17-21) · JrTrainerM 9 (11-29) · JrTrainerF 24 (16-33) · Pokemaniac 7 (20-40) · SuperNerd 12 (11-41) · Hiker 14 (10-25) · Biker 15 (25-33) · Burglar 9 (28-41) · Engineer 3 (18-21) · **UnusedJuggler 0 (vide)** · Fisher 11 (17-33) · Swimmer 15 (16-37) · CueBall 9 (26-33) · Gambler 7 (18-24) · Beauty 15 (21-35) · Psychic 4 (31-38) · Rocker 2 (20-29) · Juggler 8 (29-48) · Tamer 6 (33-44) · BirdKeeper 17 (25-42) · Blackbelt 9 (31-43) · Rival1 9 (5-18) · ProfOak 3 (66-70) · **Chief 0 (vide)** · Scientist 13 (25-34) · Giovanni 3 (24-50) · Rocket 41 (11-33) · CooltrainerM 10 (39-49) · CooltrainerF 8 (24-46) · Bruno 1 (53-58) · Brock 1 (12-14) · Misty 1 (18-21) · LtSurge 1 (18-24) · Erika 1 (24-29) · Koga 1 (37-43) · Blaine 1 (40-47) · Sabrina 1 (39-48) · Gentleman 5 (17-48) · Rival2 12 (16-53) · Rival3 3 (59-65) · Lorelei 1 (53-56) · Channeler 24 (22-38) · Agatha 1 (55-60) · Lance 1 (56-62).
⚠️ La table contient aussi les personnages (Champions, Conseil 4, rival, Oak, Giovanni) — le tirage de route les **exclut** via `POKE_CLASSES[classe].route`.

### 11.4 `POKE_GEN2_EQUIPES` (Johto) — 40 classes
Même schéma. Résumé : Scientist 5 (20-30) · Youngster 14 (2-37) · Schoolboy 24 (12-38) · BirdKeeper 19 (6-40) · Lass 17 (12-36) · CooltrainerM 20 (10-39) · CooltrainerF 21 (22-43) · Beauty 17 (9-35) · Pokemaniac 15 (10-41) · GruntM 31 (7-36) · Gentleman 5 (18-37) · Skier 2 (28) · Teacher 3 (32-36) · BugCatcher 19 (2-40) · Fisher 25 (5-39) · SwimmerM 21 (13-35) · SwimmerF 19 (18-37) · Sailor 13 (17-38) · SuperNerd 14 (7-39) · Guitarist 2 (27-34) · Hiker 22 (4-38) · Biker 9 (20-34) · Burglar 3 (23-30) · Firebreather 8 (6-32) · Juggler 6 (2-33) · Blackbelt 9 (23-38) · ExecutiveM 4 (22-36) · Psychic 12 (13-37) · Picnicker 26 (9-43) · Camper 22 (9-42) · ExecutiveF 2 (23-32) · Sage 12 (3-32) · Medium 7 (18-36) · Boarder 3 (24-26) · PokefanM 14 (13-36) · KimonoGirl 6 (17-20) · Twins 10 (10-38) · PokefanF 6 (14-30) · Officer 2 (14-17) · GruntF 5 (9-26).

---

## 12. Légendaires errants (`POKE_GEN2_ERRANTS`)
```json
{ "depuis": "tour-calcinee", "chance": 0.06, "tours": 3,
  "liste": [ {n:243, niveau:40}, {n:244, niveau:40}, {n:245, niveau:40} ] }
```
- **Raikou (243), Entei (244), Suicune (245)** au niveau 40, libérés par l'étape `tour-calcinee` (`libereErrants:true`).
- `chance` : probabilité **par nœud d'herbe traversé** qu'un errant encore libre se montre (6 %).
- `tours` : **3 tours** pour l'attraper avant qu'il fuie (le combat dure ce qu'il dure). Les deux se calibrent à la mesure (`tools/poke-gen2-errants.mjs`).
- Kanto : `errants() → null` (porte qui se tait).

---

## 13. Rencontres statiques, œufs, échanges, cadeaux, casino, arbres, fossiles

### 13.1 Statiques
- Kanto : `POKE_RONFLEX = 143` → le registre construit `statiques() = [{n:143, niveau:30, etape:"route-16"}, {n:143, niveau:30, etape:"route-12"}]` (routes `ronflex:true`). Rencontre unique, un seul essai.
- Johto `POKE_GEN2_STATIQUES` (7) — schéma `{n, niveau, etape}` :
  - Léviator rouge n.130 @30 → `lac-colere`
  - Simularbre n.185 @20 → `route-36`
  - Voltorbe n.100 @23, Racaillou n.74 @21, Smogo n.109 @21, Électrode n.101 @23 → `repaire-rocket`
  - Lokhlass n.131 @20 → `caves-jumelles`

### 13.2 Œufs (`POKE_GEN2_OEUFS`) — schéma `{cle, etape, niveau, table:[{n, poids}]}`
- `{cle:"togepi", etape:"mauville", niveau:5, table:[{n:175, poids:100}]}` (Togepi, Centre de Mauville).
- `{cle:"etrange", etape:"route-34", niveau:5, table:[{n:172, poids:9}, {n:173, poids:19}, {n:174, poids:19}, {n:238, poids:16}, {n:240, poids:12}, {n:239, poids:14}, {n:236, poids:11}]}` — l'Œuf Étrange (Pichu 9, Mélo 19, Toudoudou 19, Mélofée... en fait : Pichu, Mélo, Toudoudou, Machoc?, voir poids) : les 7 bébés que rien n'attrape dans la nature.
- Kanto : `oeufs() → null`.

### 13.3 Échanges
- Kanto `POKE_ECHANGES` (9) — schéma `{donne, recoit, surnom, etape}` :
  | donne | recoit | surnom | étape |
  |---|---|---|---|
  | 33 (Nidorino) → 30 (Nidorina) | TERRY | route-11 |
  | 63 (Abra) → 122 (M. Mime) | MARCEL | route-2 |
  | 77 (Ponyta) → 86 (Otaria) | SAILOR | cramois-ile |
  | 21 (Piafabec) → 83 (Canarticho) | DUX | carmin |
  | 80 (Flagadoss) → 108 (Excelangue) | MARC | route-18 |
  | 61 (Ptitard) → 124 (Lippoutou) | LOLA | azuria |
  | 26 (Raichu) → 101 (Électrode) | DORIS | cramois-ile |
  | 48 (Mimitoss) → 114 (Saquedeneu) | CRINKLES | cramois-ile |
  | 32 (Nidoran♂) → 29 (Nidoran♀) | SPOT | route-5 |
- Johto `POKE_GEN2_ECHANGES` (4) : `{donne:63→recoit:66, MUSCLE, doublonville}` (Abra→Machoc), `{69→95, ROCKY, mauville}` (Chétiflor→Onix), `{98→100, VOLTY, oliville-port}` (Krabby→Voltorbe), `{148→85, DORIS, ebenelle}` (Draco→Dodrio). Les 3 autres échanges du ROM se tiennent à Kanto (hors itinéraire).

### 13.4 Cadeaux
- Kanto `POKE_CADEAUX` — schéma `{n, niveau, lieu}` : Évoli n.133 @25 → `celadon-city` ; Lokhlass n.131 @15 → `saffron-city`.
- Johto `POKE_GEN2_CADEAUX` — schéma `{n, niveau, etape}` (l'étape et non le lieu, car deux cadeaux sont au fond d'un donjon) : Évoli n.133 @20 → `doublonville` ; Minidraco n.147 @15 → `antre-dragon` ; Debugant n.236 @10 → `mont-creuset` ; Piafabec n.21 @10 → `route-35`.

### 13.5 Casino
- Kanto `POKE_CASINO` — `{rouge: [...], bleu: [...]}` (lots **par version**) : rouge = Abra n.63 @180 jetons niv.9, Mélofée n.35 @500 n.8, Nidorina n.30 @1200 n.17, Minidraco n.147 @2800 n.18, Scyther n.123 @5500 n.25, Porygon n.137 @9999 n.26 ; bleu = Abra @120 n.6, Mélofée @750 n.12, Nidorino n.33 @1200 n.17, Pinsir n.127 @2500 n.20, Minidraco @4600 n.24, Porygon @6500 n.18. (Étape `celadopole`, `casino:true`.)
- Johto `POKE_GEN2_CASINO` — `{cristal: [...]}` (une seule version) : Abra n.63 @100 jetons niv.5, Osselait n.104 @800 niv.15, Qulbutoké n.202 @1500 niv.15 (étape `doublonville`).

### 13.6 Arbres et rochers (`POKE_GEN2_ARBRES`)
```json
{ "jeux": { "<cle>": { "commun": [ {poids, n, niveau} x6 ], "rare": [ ... x6 ] } },
  "etapes": { "<etapeId>": "<cleDeJeu>" },
  "rochers": { "<etapeId>": "rock" } }
```
- 7 jeux de tables : `canyon`, `town`, `route`, `kanto`, `lake`, `forest`, `rock` (chaque table = 6 créneaux pondérés, niveau 10 ; rochers : Krabboss n.98 @15 poids 90 + Insecateur n.213 @15 poids 10).
- Arbres : espèces communes (Chenipan n.10, Aspicot n.13, Hoothoot n.163, Lainergie n.179...), rares (Métamorph n.132, Noctali? n.197... valeurs : `rare` = Hoothoot poids 50, **Natarie?** — en fait : `{poids:15, n:214}` = Scarhino/Donphan selon jeu, `{poids:15, n:204}` = Pomdrapi?). Les étapes : routes 29-46 (sauf 40/41) + `bois-aux-chenes`→forest ; rochers : `chenal-40`, `grotte-obscure`, `puits-ramoloss`→rock.
- `onSecoueIci(etape)` / `jeuArbreDe(etape)` : un nœud `arbre` n'est tiré que sur ces étapes (poids 0 ailleurs).

### 13.7 Fossiles, Ambre, Dojo
- `POKE_FOSSILES` : `[{objet:"DOME_FOSSIL", n:140, niveau:30}, {objet:"HELIX_FOSSIL", n:138, niveau:30}]` (Kabuto/Ammonita, Mont Sélénite — choix exclusif).
- `POKE_AMBRE` : `{objet:"OLD_AMBER", n:142, niveau:30, lieu:"pewter-city"}` (Ptéra, Musée d'Argenta — ranimé à Cramois'Île, « la plus longue dette du voyage »).
- `POKE_DOJO` : `{lieu:"saffron-city", niveau:20, choix:[106, 107]}` (Tygnon/Kicklee — le seul choix exclusif du jeu d'origine). Johto : null.

### 13.8 Concours de capture (`POKE_GEN2_CONCOURS`)
`{vivier:[{n, poids, min, max} x10], jamaisTire:{n:49, pourquoi:...}, prix:{premier:"SUN_STONE", deuxieme:"EVERSTONE", troisieme:"GOLD_BERRY", participation:"BERRY"}, bareme:{pvMax:4, atk:1, def:1, vit:1, sat:1, sdf:1, pvRestantsSur:8, objetTenu:1, dvBit:2, dvPoids:{vit:1, spe:4, atk:8, def:16}}, balls:20, etape:"parc-national"}` — vivier : Chenipan/ Aspicot poids 20 (7-18), Chrysacier/Coconfort 10 (9-18), Papilusion/Dardargnan 5 (12-15), Mimitoss 10 (10-16), Paras 10 (10-17), Scarabrute 5 (13-14), Insécateur 5 (13-14) ; Aéromite jamais tiré (rang terminateur).

---

## 14. `PokeActes` (`actes.js`) — découpage en actes, plafonds, difficulté

- **Construction** : un acte = tout ce qui se trouve entre deux Champions, plus le Champion. `construire()` dérive les actes de `POKE_ETAPES` (jamais recopié) : chaque acte a `{n, zones[], scenes[], legendaires[], finals[], boutique, boss, ligue, ville, epilogue?}`. Une étape est une **scène** si `PokeCarteActes.scenesDe(e).length > 0` (repli : `donne`, `fossile`, `fossileRanime`, `rocket`, `pension`, `casino`, échange, cadeau). L'après-Ligue (Grotte Inconnue/Mewtwo, et Red pour Johto) rejoint le dernier acte en `epilogue: {zones, legendaires, finals}`.
- Exports : `construire, acteDe(n), plafondDe, plafondPour, monteeChampion, monteeLigue, hautDeLaLigue, MARGE_PLAFOND, nombre, nomActe`.
- **`plafondDe(n, arenes, bonusSerment, serre)`** : plafond de niveau du joueur pour un acte = plus haut niveau du Champion de l'acte (canon, lu dans `ARENES()`) + `monteeChampion(ordre)` + marge. **`MARGE_PLAFOND = 8`** ; **`MARGE_LIGUE = 16`** (le dernier acte : `hautDeLaLigue + 16`, ou +0 si serment `plafondChampion`). `margeDe(ordre)` : **dégressive** — 8 (actes 1-4), 5 (5-6), **0 (7-8)**.
- **`monteeChampion(ordre)`** — la rampe de durcissement (graduée, mesurée) : arène 1 → +0 ; arène 2 → **+3** ; arènes 7-8 → `EFFECTIF_FIN[ordre] - hautCanon(ordre)` (viser le niveau effectif : 67 pour Auguste, 70 pour Giovanni) ; sinon `round(10 + (ordre - 2))` (soit +12 à l'arène 4, +13 à la 5, +14 à la 6...). `hautCanon(ordre)` = plus haut niveau du ROM dans l'équipe (lu, jamais recopié).
- **`monteeLigue()` = 14** (constante `MONTEE_LIGUE`) : appliquée au Conseil 4 + rival (Olga 56→70 ... rival 65→79). `hautDeLaLigue(bonusSerment)` = max(Conseil 4, rival) + 14 + bonus serment, borné à 100.
- **`plafondPour(partie)`** : porte unique utilisée par le sac, la Pension et le rejeu serveur (corrige le bug « Super Bonbon → niveau 100 » : `employerBonbon` appelait `appliquerExperience` sans plafond). `serre` = serment « ne pas dépasser le Champion » → marge zéro.
- Cache par monde (`_cacheCle = cleDuMonde()`) : corrige le bug où un joueur Kanto→Johto recevait les actes de Kanto (0 nœud d'herbe).

---

## 15. `PokeCarteActes` (`carte-actes.js`) — la carte à embranchements

### 15.1 Génération (`generer(acte, partie, h)`)
- Carte **seedée** (`h` = hasher de `rng.js`, `partie.graine`) : au Défi du jour, tout le monde a la MÊME carte. Retour : `{acte: n, rangees: [ [noeud, ...], ... ]}`.
- 3 à 5 rangées de 2-3 nœuds ; on en choisit un, les autres sont perdus, on ne revient pas. **Chaque nœud annonce son contenu avant le choix** (annonce calculée depuis les données, jamais écrite).
- **Nombre de rangées** : `max(plancher=6, min(9, max(marche, aVivre.length+1, zones.length)))` où `marche = niveauDeReference(acte) - niveauTete(partie)`. Règle `express` : `max(3, max(aVivre.length+1, ceil(rangees/2)))`.
- Contenu d'une rangée, dans l'ordre : 1) une **scène** du canon (file `aVivre`, posée en premier, jamais tirée) — rival et scènes Rocket reçoivent `vise` estampillé ; 2) un **légendaire** sur la dernière rangée ; 3) l'**étal de chasse** (`rangeeEtal = rangees-2` si légendaire : boutique si `acte.boutique`, sinon nœud objet `pourLaChasse` — les Balls avant l'oiseau) ; 4) remplissage par **tirage pondéré** (`h.pondere`) parmi : herbes 30, dresseur 26, objet 12, centre 10 (rangée ≥1), boutique 8 (rangée ≥1, `poidsBoutique` = 8 ou 20 `POIDS_BOUTIQUE_RARE` si acte ≥ `PokeObtenir.ACTE_MACHINES`=4), eau 8, pêche 14 (seulement si canne + eau), arbre 14 (seulement si `onSecoueIci`). Garde-fous anti-doublons de type dans la rangée.
- **Zones réparties** (`zoneDeLaRangee`) sur toute la longueur de l'acte (les zones ne sont jamais perdues).
- **La trace du mythique** : si `partie.mew` (chasse ouverte) et traces < 3 et mythique non capturé, un nœud ordinaire (jamais boss/ligue/légendaire, jamais dernière rangée ni nœud seul) reçoit `trace:true` — une seule par acte.
- Le nœud final : `noeudBoss(acte)` → `{type:"boss", arene, lieu}` ou `{type:"ligue", lieu}`.

### 15.2 Rampe de niveaux
- `niveauDeReference(acte)` : ligue → `PokeActes.hautDeLaLigue(0)` ; sinon max de l'équipe du Champion − 1 (min 3).
- `niveauTete(partie)` : plus haut niveau de l'équipe du joueur (min 5).
- `niveauDeRangee(acte, partie, rangee, total)` : **interpolation** `entree + (mur - entree) * ((rangee+1)/total)^rampe` — la route MÈNE au mur : 1er nœud au niveau d'entrée, dernier au Champion − 1. `rampe()` : 1.0 (Kanto), **1.3 (gen2)** (`RAMPE_MONDE = {gen2: 1.3}`).
- `noeudHerbes` : `vise` estampillé à la génération, `dose: 4` (sauvages = visé − 4, jamais sous le niveau du ROM qui reste un plancher), `rencontres: h.entre(2,4)`, `annonce` (2 communes + 1 rare avec taux), `entraine` (statistique dominante pondérée par les taux — le stat-exp rendu visible).
- `noeudDresseur` : ne tire que les classes `route:true` ; **sélection par écart pondéré** au `vise` (trop fort coûte ×2) parmi TOUTES les paires classe/équipe ; fenêtre `ecart ≤ meilleur + 3` ; rangée 0 de l'acte 1 : filtre équipes ≤ taille de l'équipe du joueur (le premier combat ne se joue jamais à 2-3 contre 1) ; **décalage** (`decale = vise - as`) si l'équipe du ROM est trop faible, avec **évolution appliquée** (`PokeMoteur.especeAuNiveau`) — un Pokémon servi au-dessus de son palier est servi ÉVOLUÉ ; `gain: 300 + equipe.length * 250` (argent). Retour : `{type:"dresseur", etape, lieu, classe, equipe, gain}`.
- `noeudPeche` : table selon la canne (`PokeButin.canneDe(partie)` → OLD_ROD/GOOD_ROD/SUPER_ROD), `rencontres: 2-3`, `dose: 4`, annonce ≤ 3 espèces (taux = 100/nb).
- `noeudArbre` : table `commun` du jeu de l'étape, annonce ≤ 3 espèces, `entraine`.
- `noeudObjet` : échelle des Balls suivant l'acte (comme `butin.js`) ; `pourLaChasse` → lots de Balls (ravitaillement là où le canon interdit un comptoir).
- `noeudCentre` : `{type:"centre", etape, lieu}` (soin). `noeudBoutique` : `{type:"boutique", etape, lieu, rare?: [vitamine, pierre]}` — `rare` à partir de l'acte 4 (VITAMINES = HP_UP, PROTEIN, IRON, CARBOS, CALCIUM ; pierres via `PIERRES()` qui lit les clés canon des deux mondes). ⚠️ La boutique d'un acte se pose avec le lieu de la VILLE de l'acte (`acte.ville`).
- `noeudLegendaire` : `{type:"legendaire", etape, lieu, espece}` — un seul essai (les 5 issues sont nommées dans le scénario, voir §16).

### 15.3 `scenesDe(etape)` — toutes les scènes possibles (exporté, source unique pour `actes.js`)
Retourne une liste de nœuds-scènes pour une étape :
- `{type:"scene", donne, rocket, libereErrants}` si `donne.length` ou `rocket` ou `libereErrants` (Tour Calcinée).
- `{type:"safari", tables}` si id contient "safari" (règles propres : appât/caillou, `tenterSafari`, `fuit` dans capture.js).
- `{type:"camion", espece:151}` si `etape.camion` (le mythe du camion du paquebot ; 3 états lus dans `PokeDepart.mythe` ; nœud présent même sans récompense).
- `{type:"pension"}` si `etape.pension` (route-5 / doublonville).
- `{type:"journal"}` si `etape.journalMewtwo` (Manoir — lore de Mewtwo).
- `{type:"ronflex", espece, niveau}` pour chaque `POKE_GEN2_STATIQUES`/`statiques()` dont l'étape correspond (type historique « ronflex » conservé pour la compat des sauvegardes).
- `{type:"concours"}` si `POKE_GEN2_CONCOURS.etape` correspond (Parc Naturel).
- `{type:"fossile"}` si `etape.fossile` **et** `FOSSILES_DISPO().length` ; `{type:"ranimation"}` si `fossileRanime`.
- `{type:"casino"}` si `etape.casino`.
- `{type:"oeuf", oeuf, niveau, table}` pour chaque œuf de l'étape.
- `{type:"echange", offres}` pour les échanges de l'étape.
- `{type:"cadeau", offres}` — cadeaux par `etape` si le cadeau en porte une, sinon sur la **première étape ville du lieu** (`premiereVilleDu`) pour éviter les doublons (Céladopole ×2, Safrania ×2).
- `{type:"musee", espece}` (Vieil Ambre, première ville du lieu) ; `{type:"dojo", choix, niveau}` (première ville du lieu).

---

## 16. Le scénario (`scenario.js` → `W.POKE_SCENARIO`)
Corpus de textes bilingues `{fr, en}`, phrases courtes ≤14 mots, zéro métaphore, canon gen 1, accords de genre via `{e}` / `frF` :
- `CHEN` : accueil, remise (Pokédex), choixStarter, apresChoix (« Ton rival prend celui qui bat le tien »), adieu.
- `RIVAL` : premier, gagne, perdu, milieu, ligue.
- `ARENES` : `1..8` → `{avant, apres}` par arène (les noms des Champions viennent de `POKE_ARENES`).
- `LIGUE` : entree (« Cinq combats t'attendent. Aucun soin entre eux. »), conseil1..4, champion (« Le Champion se retourne. C'est {rival}. »).
- `ROCKET` : selenite, celadopole, tour, silph, fuite.
- `VOYAGE` : premierPas (fr/frF), seul, foret, tunnel, ronflex, victoire, grotte.
- `POKEDEX` : premiereCapture, legendaireEnfui, **legendaireLache** (« Tu t'en vas... »), **legendaireAbattu** (« On ne capture pas ce qu'on a mis à terre »), legendaireManque, legendairePris, fossileChoisi, masterBall.

---

## 17. `PokeMesure` (`mesure-arene.js`) — l'écran « Comment mon équipe se mesure »
Exports : `contre, menaces, remedes, aLaHauteur`. Pure lecture (types + attaques dérivées via `PokeMoteur.creer`) — aucun rejeu n'en dépend, vit dans les ECRANS.
- `contre(mienne, adverse, h)` : pour chaque Pokémon du joueur → `{index, n, frappe: "fort"|"rien"|null, subit: "fragile"|"tient"|null, parQuoi, parQuoiSubi}` — verdict fondé sur le **meilleur multiplicateur réel** (attaques qui font des dégâts seulement, PP > 0) ; « fort » = ×2 sur au moins un adversaire, « rien » = aucune attaque ne mord, « fragile » = l'un d'eux me frappe ×2, « tient » = rien ne me fait mal.
- `menaces(equipeAdverse, h)` : états infligés **à dessein** (effets primaires seulement) : SLEEP_EFFECT→sommeil, POISON_EFFECT/TOXIC_EFFECT→poison, PARALYZE_EFFECT→paralysie, CONFUSION_EFFECT→confusion (pas les side-effects).
- `remedes(sac)` : nombre de remèdes d'état (objets avec `etat` dans `PokeCombat.OBJETS_SOIN`).
- `aLaHauteur(mienne, adverse)` : `{n, sur, seuil, haut}` — combien de mes Pokémon (PV > 0) sont à `haut adverse − MARGE(3)` ou au-dessus. C'est LE chiffre qui explique le mode : un seul Pokémon sur six est au niveau du Champion à chaque arène.

---

## 18. Mythiques : Mew et Célébi
- **Mew** (Kanto) : `mythique() → {n:151, niveau:7, lieu:null}`. Chasse : `partie.mew` ouvre la chasse, `partie.mewActe` décide l'acte au départ, 3 **traces** (`partie.mewTraces`, `PokePartie.MEW_TRACES = 3`) posées sur des nœuds ordinaires, puis le mythique apparaît sur l'étape d'une zone de l'acte (`zones[0]` faute d'adresse). Essai unique.
- **Célébi** (Johto) : `{n:251, niveau:30, lieu:"ilex-forest"}` — adresse canon (sanctuaire du Bois aux Chênes) ; même mécanique de chasse (diplôme du monde → traces → essai unique). En Cristal il n'était obtenable qu'à l'événement de la Ball GS.

---

## 19. Pièges et leçons de conception à préserver lors de la réécriture
1. **Le canon est la loi** : équipes/niveaux des Champions et du Conseil 4 viennent des ROM ; on ne les adoucit pas. On règle la ROUTE, jamais le MUR.
2. **Une CS ne s'emploie pas sans son badge** (`POKE_BADGE_POUR_CS`, `POKE_GEN2_BADGE_POUR_CS`) — c'est ce qui fait la vraie progression.
3. **`exige` est documentaire sur la carte** : `pokeOuverture` existe mais `generer()` ne filtre pas les scènes par elle (une carte à embranchements peut ne pas avoir pris la branche qui donne la clé).
4. **Tout tirage passe par la graine** (`h` de `rng.js`) : même carte pour tous au Défi du jour ; le rejeu serveur recalcule le score depuis un résumé, il doit pouvoir rejouer le voyage à l'identique (aucun tirage ajouté sans re-mesure).
5. **Le niveau des sauvages suit la rampe de l'acte** (visé − 4), celui des dresseurs vise la rampe avec décalage + évolution ; le niveau du ROM est toujours un plancher.
6. **Les scènes du canon ne se tirent pas** : elles sont posées d'abord (`aVivre`), sinon elles ne sortent jamais.
7. **Rareté honnête** : les poids 20/20/15/10/10/10/5/5/4/1 ne s'arrondissent pas ; un Pokémon à 1 % reste à 1 %.
8. **Le plafond du joueur** (acte) suit la montée des Champions ; la marge est dégressive (8/5/0) ; la Ligue se joue à +14 sur tout le bloc, sans soin entre les 5 combats.
9. **Un nœud annonce son contenu avant le choix** — y compris les taux (2 communes + 1 rare) et ce que le lieu entraîne (statistique).
10. **Johto n'a ni fossiles, ni Dojo, ni Musée** (scènes → null), mais il a les errants, les arbres, les œufs, le concours, la Master Ball (repaire Rocket) et Red au Mont Argenté.

---

*Fichiers d'appui générés : `notes-data/POKE_*.json` (dumps indentés de toutes les globales du noyau, chargé dans Node v22) — à régénérer par `node notes-data/dump.js`.*
