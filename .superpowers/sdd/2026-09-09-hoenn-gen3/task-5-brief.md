# Task 5 Brief: Itinéraire Roguelite des 9 Actes & Légendaires (`voyage.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 5

## Objective
Author the roguelite journey for Hoenn in `js/poke/gen3/voyage.js` and verify it with `tests/test_gen3_voyage.mjs`.

## Files to Create
- `js/poke/gen3/voyage.js`
- `tests/test_gen3_voyage.mjs`

## Requirements
1. **Progression Clés & CS (`W.POKE_GEN3_CLES`, `W.POKE_GEN3_BADGE_POUR_CS`)**:
   - `coupe`: { source: "merouville", nom: { fr: "CS01 Coupe", en: "HM01 Cut" } }
   - `flash`: { source: "grotte-granite", nom: { fr: "CS05 Flash", en: "HM05 Flash" } }
   - `eclateroc`: { source: "lavandia", nom: { fr: "CS06 Éclate-Roc", en: "HM06 Rock Smash" } }
   - `force`: { source: "tunnel-merouvergne", nom: { fr: "CS04 Force", en: "HM04 Strength" } }
   - `surf`: { source: "clementi-ville", nom: { fr: "CS03 Surf", en: "HM03 Surf" } }
   - `vol`: { source: "route-120", nom: { fr: "CS02 Vol", en: "HM02 Fly" } }
   - `plongee`: { source: "algatia", nom: { fr: "CS08 Plongée", en: "HM08 Dive" } }
   - `cascade`: { source: "atalanopolis", nom: { fr: "CS07 Cascade", en: "HM07 Waterfall" } }
   - Story keys: `lunettes` (Lunettes Sable pour le désert), `devonScope` (pour révéler Kecleon), `master` (Master Ball au Repaire Team).
   - `BADGE_POUR_CS`:
     `{ coupe: 1, flash: 2, eclateroc: 3, force: 4, surf: 5, vol: 6, plongee: 7, cascade: 8 }`
2. **Itinéraire en 9 Actes (`W.POKE_GEN3_ETAPES`)**:
   - Every step has `{ id, lieu, categorie }` and appropriate flags:
     - `tables`: IDs of encounter zones defined in `js/poke/gen3/monde.js`.
     - `exige`: array of required keys (e.g. `["surf"]`).
     - `donne`: array of keys granted upon clearance.
     - `arene`: gym index (1 to 8).
     - `boss`: for final act / league boss.
     - `legendaire`: species number for static legendaries.
     - `dresseurFinal`: true for Steven Stone (Pierre Rochard).
     - `depart`: true for Littleroot Town.
   - **Act 1 · Roxanne (Mérouville)**:
     - `bourg-en-vol` (depart), `route-101`, `rosyeres`, `route-103` (rival), `route-102`, `clementi-ville`, `route-104`, `bois-clementi` (team), `merouville` (arene 1, donne coupe), `tunnel-merouvergne` (donne force).
   - **Act 2 · Brawly (Myokara)**:
     - `myokara` (arene 2), `grotte-granite` (donne flash, tables).
   - **Act 3 · Wattson (Lavandia)**:
     - `plage-poivressel`, `poivressel`, `route-110` (duel rival), `lavandia` (arene 3, donne eclateroc, casino).
   - **Act 4 · Flannery (Vermilava)**:
     - `route-111-sud`, `route-112`, `chemin-ardent`, `telepherique-mont-chimere` (team), `sentier-sinuroc`, `vermilava` (arene 4, donne lunettes, oeuf), `route-111-desert` (exige lunettes, fossile).
   - **Act 5 · Norman (Clémenti-Ville)**:
     - `route-117`, `vergazon`, retour à `clementi-arene` (arene 5, donne surf).
   - **Act 6 · Winona (Cimetronelle)**:
     - `route-118` (exige surf), `route-119` (centre meteo, morpheo), `cimetronelle` (arene 6), `route-120` (donne devonScope, donne vol).
   - **Act 7 · Tito & Tato (Algatia)**:
     - `route-121`, `parc-safari`, `nenucrique` (repaire team, master ball), `mont-memoria`, `chenal-124`, `algatia` (arene 7, donne plongee, centre spatial, Jirachi 385).
   - **Act 8 · Juan (Atalanopolis)**:
     - `chenal-126`, `caverne-fondmer` (exige plongee), `chenal-127-128`, `pilier-celeste` (Rayquaza 384 niv 70), `atalanopolis` (arene 8, donne cascade).
   - **Act 9 · La Ligue Pokémon (Éternara)**:
     - `cascade-eternara` (exige cascade), `route-victoire` (Timmy), `eternara-ligue` (Conseil 4 + Maître Marc).
   - **Épilogue & Sanctuaires**:
     - `site-meteore-profondeurs` (`dresseurFinal: true` - Pierre Rochard niv 75-78).
     - `chambre-scellee` (nœud déverrouillant les trois Régis).
     - `ruines-desert` (Regirock 377, niv 40).
     - `grotte-ilot` (Regice 378, niv 40).
     - `tombeau-antique` (Registeel 379, niv 40).
     - `grotte-terra` (Groudon 383, niv 70).
     - `grotte-marine` (Kyogre 382, niv 70).
     - `ile-aurore` (Deoxys 386, niv 30, mythique diplôme).
3. **Errants (`W.POKE_GEN3_ERRANTS`)**:
   - `[380, 381]` (Latias et Latios) marqués pour être libérés en errance après la Ligue (`libereErrants: true`).
4. **Strict NOYAU Constraints**:
   - Strict mode `'use strict'`.
   - Zero DOM, zero window/document dependencies.
   - Zero non-deterministic calls (`Math.random`, `Date.now`).
5. **Test (`tests/test_gen3_voyage.mjs`)**:
   - Asserts 9 distinct acts are constructible from `W.POKE_GEN3_ETAPES`.
   - Asserts all 8 gyms (1-8) exist and lead to the League.
   - Asserts all 8 HMs (`coupe` to `cascade`) and their required badges are declared.
   - Asserts Rayquaza (384), Groudon (383), Kyogre (382), Regirock (377), Regice (378), Registeel (379), Jirachi (385), Deoxys (386) are on reachable nodes.
   - Asserts Steven Stone is present as `dresseurFinal`.
   - Asserts roamers Latios (381) and Latias (380) are declared.
   - Runs cleanly in Node.js and exits with code 0.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-5-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
