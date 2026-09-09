# Task 2 Report: Core Loot, Rewards & Marts Engine Adaptation

**Plan:** `.superpowers/sdd/2026-09-09-gen3-loot/plan.md`  
**Task Number:** 2  
**Status:** `DONE`

---

## 1. Summary of Changes

Adapted the core loot, rewards, shopping, and stat-growth engines across Hoenn (Gen 3) while maintaining 100% backward compatibility and PRNG determinism for Kanto (Gen 1) and Johto (Gen 2):

1. **Test Suite (`tests/test_gen3_loot_engine.mjs`)**:
   - Built comprehensive TDD test harness covering all Task 2 specifications:
     - Strict NOYAU constraints: `'use strict'`, zero DOM/browser dependencies, zero unauthorized non-deterministic calls (`Math.random()`, `Date.now()`, etc.).
     - `W.POKE_GEN3_MARTS` canonical Emerald marts & Lilycove Department Store counters (2F, 3F, 4F, 5F).
     - `PokeObtenir.inventaire(nomMart)` resolving across Gen 3, Gen 2, and Gen 1 marts.
     - `PokeObtenir.martPour(p)` returning Hoenn marts per act (1-9) in Gen 3, Kanto in Gen 1.
     - `PokeObtenir.martMachines(p)` and `martCombat(p)` returning Lilycove counters in Gen 3 vs Celadon counters in Gen 1/2.
     - `PokeObtenir.machinePour(cle, p)` resolving `"TM39"`, `"TM08"`, numeric `39`, `"TM_ROCK_TOMB"`, move keys, and CSs in Gen 3.
     - `PokeObtenir.ctDe(p)` dynamically querying active generation's CTs.
     - `PokeObtenir.VITAMINES_GEN3` mapping including `CALCIUM: "sat"` and `ZINC: "sdf"`.
     - `PokeObtenir.employerVitamine` updating `mon.statExp.sdf` and `mon.statExp.sat`, triggering stat recalculation, rejecting `ZINC` in Gen 1.
     - `PokeMoteur.calculerStats` accounting for `e.sat` and `e.sdf` when defined on `mon.statExp` while falling back to `e.spe` for Gen 1/2.
     - `PokeButin.apprenables(p)` returning learnable Gen 3 TMs based on active party and generation.
     - `PokeButin.pierresUtiles(p)` capturing canonical Gen 3 stone evolutions (`WATER_STONE`, `LEAF_STONE`, `MOON_STONE`, `SUN_STONE`, `FIRE_STONE`, `THUNDERSTONE`).
     - `PokeButin.vitamine.tirer` PRNG determinism: strictly 5 legacy keys for Gen 1/2, 6 vitamins for Gen 3.
     - `PokeCarteActes.noeudBoutique` rare shelf containing `ZINC`, `MOON_STONE`, and `SUN_STONE` in Gen 3 while remaining bit-identical in Gen 1 and 2.
   - Initial TDD cycle: Verified failures before applying modifications.

2. **Hoenn Poké Marts (`js/poke/gen3/obtentions.js`)**:
   - Declared `W.POKE_GEN3_MARTS` containing canonical Emerald town mart inventories:
     `OldaleMart`, `PetalburgMart`, `RustboroMart`, `DewfordMart`, `SlateportMart`, `MauvilleMart`, `VerdanturfMart`, `FallarborMart`, `LavaridgeMart`, `FortreeMart`, `MossdeepMart`, `SootopolisMart`, `EverGrandeMart`, `PacifidlogMart`.
   - Included Lilycove Department Store counters:
     - `LilycoveDept2F`: Balls, remedies, potions, revives.
     - `LilycoveDept3F`: Battle items and vitamins (Protein, Calcium, Iron, Zinc, Carbos, HP Up).
     - `LilycoveDept4F`: High-tier TMs (Fire Blast, Thunder, Blizzard, Hyper Beam, Protect, Safeguard, Reflect, Light Screen).
     - `LilycoveDept5F`: Poké Doll (canon toy floor).

3. **Loot Drops & Rewards Engine (`js/poke/butin.js`)**:
   - `apprenables(p)`: Queries the active generation's CT list via `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(p) : W.POKE_CT)` instead of hardcoded Gen 1 `W.POKE_CT`. Filters by species learnsets in `W.POKE_GEN3_ESPECES`.
   - `pierresUtiles(p)`: Inspects all party species stone evolution paths, capturing `MOON_STONE`, `SUN_STONE`, `FIRE_STONE`, `WATER_STONE`, `LEAF_STONE`, and `THUNDERSTONE`/`THUNDER_STONE`.
   - `vitamine.tirer(p, h)`: When `cleRegles === "gen3"`, draws from `["HP_UP", "PROTEIN", "IRON", "CARBOS", "CALCIUM", "ZINC"]`. For Gen 1 & Gen 2, preserves the exact 5 keys (`Object.keys(W.PokeObtenir.VITAMINES)`), guaranteeing zero deviation in PRNG draws on Kanto and Johto seeds.

4. **Acquisition & Shop System (`js/poke/obtenir.js`)**:
   - `machinePour(cle, p)`: Resolves TM strings (e.g. `"TM39"`, `"TM08"` from `W.POKE_GEN3_ARENES`), bare move keys, and numeric IDs against the active generation's CT/CS tables.
   - `donnerCT`, `prixDe`, and `acheter`: Passed context `p` down to `machinePour` to ensure correct resolution and pricing in shops.
   - `inventaire(nomMart)`: Checks `W.POKE_GEN3_MARTS`, `W.POKE_GEN2_MARTS`, and `W.POKE_MARTS`, and validates items against `W.POKE_GEN3_OBJETS` and Gen 3 TMs.
   - `martPour(p)`: Returns Hoenn progression marts for acts 1 through 9 when in Gen 3 (`RustboroMart`, `DewfordMart`, `MauvilleMart`, `LavaridgeMart`, `VerdanturfMart`, `FortreeMart`, `LilycoveDept2F`, `MossdeepMart`, `EverGrandeMart`).
   - Added and exported `martMachines(p)` (`LilycoveDept4F` in Gen 3 vs `CeladonMart4FClerkText` in Gen 1/2) and `martCombat(p)` (`LilycoveDept3F` in Gen 3 vs `CeladonMart5FClerk1Text` in Gen 1/2).
   - Added and exported `VITAMINES_GEN3`: `{ HP_UP: "pv", PROTEIN: "atk", IRON: "def", CARBOS: "vit", CALCIUM: "sat", ZINC: "sdf" }`.
   - `employerVitamine`: Sets `mon.statExp.sat` and `mon.statExp.sdf` in Gen 3, increments statExp by `VITAMINE_GAIN` (2560 up to cap 25600), recalculates stats with `M().calculerStats(mon)`, and accurately reflects stat gains.
   - `ctDe(p)`: Queries the active generation's CT list.

5. **Stat Calculation (`js/poke/moteur.js`)**:
   - `calculerStats(p)`: Computes `expSa` from `e.sat` (or `e[sa]`, or fallback `e.spe`) and `expSd` from `e.sdf` (or `e[sd]`, or fallback `e.spe`).

6. **Act Map Nodes (`js/poke/carte-actes.js`)**:
   - `PIERRES(cleRegles)`: Resolves stone items against the specific generation's items table, including `MOON_STONE` and `SUN_STONE` for Gen 3.
   - `noeudBoutique(etape, acte, partie, h)`: Rare shelf (acts >= 4) selects from 6 vitamins (including `ZINC`) and 6 stones (including `MOON_STONE` and `SUN_STONE`) when playing in Gen 3, while preserving 100% invariance for Gen 1/2.
   - Exported `noeudBoutique` on `W.PokeCarteActes`.

---

## 2. Verification Results

1. **Task 2 Test Suite (`tests/test_gen3_loot_engine.mjs`)**:
   - `node tests/test_gen3_loot_engine.mjs`
   - Result: **23 / 23 passed (100%)**, 0 failures.

2. **Full Regression Test Suite (`tests/run_all_tests.mjs`)**:
   - `node tests/run_all_tests.mjs`
   - Result: **36 / 36 passed (100%)**, 0 failures.
   - Zero non-deterministic call violations across NOYAU and Gen 3.
   - Zero DOM / browser leaks across NOYAU and Gen 3.
   - Combat simulation determinism verified across Gen 1, Gen 2, and Gen 3.
   - Mulberry32 PRNG determinism contract maintained.

3. **Gen 3 CT Suite (`tests/test_gen3_ct.mjs`)**:
   - `node tests/test_gen3_ct.mjs`
   - Result: **15 / 15 passed (100%)**, 0 failures.

4. **Gen 3 Registry Suite (`tests/test_gen3_registry.mjs`)**:
   - `node tests/test_gen3_registry.mjs`
   - Result: **14 / 14 passed (100%)**, 0 failures.

---

## 3. Commits Created

- `feat(gen3): Task 2 - core loot, rewards and marts engine adaptation`

---

## 4. Notes for Task 3

- Task 3 will handle UI descriptions, screen integrations (`ui-boutique.js`, `ui-butin.js`), and end-to-end voyage/shop verification.
- `W.PokeObtenir.martMachines(partie)` and `W.PokeObtenir.martCombat(partie)` are exported and ready for shop UI navigation.
- `W.PokeObtenir.VITAMINES_GEN3` is exported and ready for item description renderers.
