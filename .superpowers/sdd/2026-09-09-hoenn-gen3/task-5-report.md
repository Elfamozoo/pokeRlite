# Task 5 Report: Itinéraire Roguelite des 9 Actes & Légendaires (`voyage.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 5  
**Status:** `DONE`

---

## 1. Summary of Changes

Implemented the Gen 3 Hoenn roguelite progression, key unlocks, 9-act journey, static legendaries, roamers, and epilogue boss in `js/poke/gen3/voyage.js`, along with the comprehensive test suite `tests/test_gen3_voyage.mjs`:

1. **`js/poke/gen3/voyage.js`**:
   - Strictly pure NOYAU module adhering to ES5 IIFE pattern: `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`.
   - **`W.POKE_GEN3_CLES`**:
     - All 8 canonical HMs:
       - `coupe` (source: `merouville`, CS01 Coupe / HM01 Cut)
       - `flash` (source: `grotte-granite`, CS05 Flash / HM05 Flash)
       - `eclateroc` (source: `lavandia`, CS06 Éclate-Roc / HM06 Rock Smash)
       - `force` (source: `tunnel-merouvergne`, CS04 Force / HM04 Strength)
       - `surf` (source: `clementi-ville`, CS03 Surf / HM03 Surf)
       - `vol` (source: `route-120`, CS02 Vol / HM02 Fly)
       - `plongee` (source: `algatia`, CS08 Plongée / HM08 Dive)
       - `cascade` (source: `atalanopolis`, CS07 Cascade / HM07 Waterfall)
     - Story keys:
       - `lunettes` (source: `vermilava`, Lunettes Sable / Go-Goggles)
       - `devonScope` (source: `route-120`, Devon Scope / Devon Scope)
       - `master` (source: `nenucrique`, Master Ball / Master Ball)
   - **`W.POKE_GEN3_BADGE_POUR_CS`**:
     - Complete badge-to-HM gating map: `{ coupe: 1, flash: 2, eclateroc: 3, force: 4, surf: 5, vol: 6, plongee: 7, cascade: 8 }`.
   - **`W.POKE_GEN3_ETAPES`**:
     - 52 canonical steps structured for 9 progressive acts + epilogue sanctuaries:
       - **Act 1 · Roxanne (Mérouville)**: `bourg-en-vol` (depart), `route-101`, `rosyeres`, `route-103` (rival 1), `route-102`, `clementi-ville`, `route-104`, `bois-clementi` (team 1), `tunnel-merouvergne` (donne force), `merouville` (arene 1, donne coupe).
       - **Act 2 · Brawly (Myokara)**: `grotte-granite` (donne flash), `myokara` (arene 2).
       - **Act 3 · Wattson (Lavandia)**: `plage-poivressel`, `poivressel`, `route-110` (duel rival 2), `lavandia` (arene 3, donne eclateroc, casino).
       - **Act 4 · Flannery (Vermilava)**: `route-111-sud`, `route-112`, `chemin-ardent`, `telepherique-mont-chimere` (team 2), `sentier-sinuroc`, `vermilava` (arene 4, donne lunettes, oeuf).
       - **Act 5 · Norman (Clémenti-Ville)**: `route-111-desert` (exige lunettes, fossile), `route-117` (pension), `vergazon`, `clementi-arene` (arene 5, donne surf).
       - **Act 6 · Winona (Cimetronelle)**: `route-118` (exige surf), `route-119` (centre météo), `route-120` (donne devonScope, donne vol), `cimetronelle` (arene 6).
       - **Act 7 · Tito & Tato (Algatia)**: `route-121`, `parc-safari`, `nenucrique` (repaire team, master ball), `mont-memoria`, `chenal-124`, `algatia` (arene 7, donne plongee, centre spatial, Jirachi 385).
       - **Act 8 · Juan (Atalanopolis)**: `chenal-126` (exige surf), `caverne-fondmer` (exige plongee), `chenal-127-128`, `pilier-celeste` (Rayquaza 384 niv 70), `atalanopolis` (arene 8, donne cascade).
       - **Act 9 · La Ligue Pokémon (Éternara)**: `cascade-eternara` (exige cascade), `route-victoire` (Timmy), `eternara-ligue` (Conseil 4 + Maître Marc, ligue: true, boss: true, exigeBadges: 8, libereErrants: true).
       - **Épilogue & Sanctuaires**:
         - `site-meteore-profondeurs` (dresseurFinal: true - Pierre Rochard niv 75-78).
         - `chambre-scellee` (nœud déverrouillant les trois Régis, deverrouilleRegis: true).
         - `ruines-desert` (Regirock 377, niv 40).
         - `grotte-ilot` (Regice 378, niv 40).
         - `tombeau-antique` (Registeel 379, niv 40).
         - `grotte-terra` (Groudon 383, niv 70).
         - `grotte-marine` (Kyogre 382, niv 70).
         - `ile-aurore` (Deoxys 386, niv 30, mythique diplôme).
   - **`W.POKE_GEN3_ERRANTS`**:
     - Declared as `[380, 381]` with attached properties (`depuis: "eternara-ligue"`, `apresLigue: true`, `libereErrants: true`, `chance: 0.05`, `tours: 3`, and canonical `liste` of Latias #380 and Latios #381 at level 40).
   - **Helpers**:
     - `W.pokeGen3EtapeDe(id)`: O(n) lookup returning the step object.
     - `W.pokeGen3Ouverture(etape, partie)`: returns `{ ouverte, manque[] }` accounting for key unlocks, CS badge requirements, required badge count, and league completion.

2. **`tests/test_gen3_voyage.mjs`**:
   - 20 unit tests across 7 suites verifying:
     - Strict NOYAU constraints and file existence.
     - Isolated headless VM execution.
     - All 8 HMs and story keys with bilingual names.
     - All 8 badge-to-HM mappings.
     - Step schema, departure, table validity against `W.POKE_GEN3_ZONES`, and helpers.
     - Roguelite 9-act construction with `PokeActes.construire()`.
     - 100% static legendary access (Rayquaza, Groudon, Kyogre, 3 Regis, Jirachi, Deoxys).
     - Epilogue boss Steven Stone and roamers (Latias & Latios).

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_voyage.mjs` was executed before implementing `voyage.js` and failed with 20/20 test failures (ENOENT).

2. **Task 5 Test Suite (`tests/test_gen3_voyage.mjs`)**:
   - Command: `node tests/test_gen3_voyage.mjs`
   - Result: **20 / 20 tests passed (100%)**, 0 failures.

3. **Gen 3 Test Suites**:
   - `node tests/test_gen3_world.mjs`: 17 / 17 passed (100%).
   - `node tests/test_gen3_trainers.mjs`: 16 / 16 passed (100%).
   - `node tests/test_gen3_data_module.mjs`: 24 / 24 passed (100%).
   - `node tests/test_gen3_fetch.mjs`: 12 / 12 passed (100%).

4. **Full Regression Suite (`tests/run_all_tests.mjs`)**:
   - Command: `node tests/run_all_tests.mjs`
   - Result: **25 / 25 tests passed (100%)**, zero regressions across NOYAU execution, PRNG determinism, replay scoring, and module architecture.

---

## 3. Commits Created
- `bd047a9 feat(gen3): Task 5 - roguelite journey, 9 acts and complete legendary access`

---

## 4. Concerns & Notes for Subsequent Tasks
- In Task 6 (`ordre.js` and `regles.js`), `js/poke/gen3/voyage.js` should be added to `GEN3` in `ordre.js` so that `POKE_ORDRE_GEN3` includes it in NOYAU execution.
- `PokeRegles` will map `etapes()` to `W.POKE_GEN3_ETAPES`, `clesVoyage()` to `W.POKE_GEN3_CLES`, `errants()` to `W.POKE_GEN3_ERRANTS`, and `badgesPourCS()` to `W.POKE_GEN3_BADGE_POUR_CS` when `monde === "gen3"`.
