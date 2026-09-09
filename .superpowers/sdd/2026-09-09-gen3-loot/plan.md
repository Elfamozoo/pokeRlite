# Adaptation des Récompenses, Butin, Objets et CTs à la 3ᵉ Génération (Hoenn / Émeraude)

## Global Constraints
- Zero external runtime dependencies.
- Strict NOYAU rules: 'use strict', zero DOM access, zero window/document dependencies, zero Math.random / Date.now.
- All PRNG usage through mulberry32 (`h.entier`, `h.dans`, `h.brut`).
- Non-regression: Gen 1 (Kanto) and Gen 2 (Johto) behavior, loot draws, test suite invariant.
- Canonical Gen 3 Emerald references for TMs (CT01 to CT50), HMs (CS01 to CS08), items, vitamins, and prices.

## Task 1: Canonical Gen 3 Technical Machines (CTs & CSs) and Registry Wiring
- Create `js/poke/gen3/ct.js` defining:
  - `W.POKE_GEN3_CT`: Array of 50 canonical Gen 3 TMs (CT01 Focus Punch to CT50 Overheat) with `{ n: 1..50, cle: "<MOVE>", prix: <price>, type: "<type>" }`.
  - `W.POKE_GEN3_CS`: Array of 8 canonical Gen 3 HMs (CS01 Cut to CS08 Dive) with `{ n: 1..8, cle: "<MOVE>", cs: true, type: "<type>" }`.
  - `W.POKE_GEN3_CT_PAR_CLE`: Fast lookup dictionary by move key.
- Update `js/poke/ordre.js`:
  - Add `"js/poke/gen3/ct.js"` into `GEN3` list (before `regles.js` evaluates).
- Update `js/poke/regles.js`:
  - Add `ct`, `cs`, `ctParCle` methods to `JEUX.gen1`, `JEUX.gen2`, and `JEUX.gen3`.
  - Expose `PokeRegles.ct(partie)`, `PokeRegles.cs(partie)`, `PokeRegles.ctParCle(partie)` dynamically resolving to current/specified generation's table.
- Test: Create and pass `tests/test_gen3_ct.mjs` verifying all 50 CTs, 8 CSs, and lookup methods.

## Task 2: Core Loot & Reward Engine Adaptation (Butin, Obtenir, Carte-Actes)
- Update `js/poke/butin.js`:
  - `apprenables(p)`: retrieve CT list dynamically from `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(p) : W.POKE_CT)` instead of hardcoded `W.POKE_CT`.
  - `pierresUtiles(p)`: support all stone evolutions in Gen 3 (`WATER_STONE`, `LEAF_STONE`, `FIRE_STONE`, `THUNDERSTONE`/`THUNDER_STONE`, `MOON_STONE`, `SUN_STONE`).
  - `vitamine`: draw from `W.PokeObtenir.VITAMINES` (which includes `ZINC`).
  - `remede` and `balls`: support Gen 3 remedies and balls based on act progression.
- Update `js/poke/obtenir.js`:
  - `machinePour(cle, p)`: resolve both `TM39`, `TM_ROCK_TOMB`, and move keys using active generation's CT list.
  - `ctDe(p)`: use `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(p) : W.POKE_CT)` to read acquired CTs.
  - `VITAMINES`: add `ZINC` mapping to `"sdf"` (or `"spe"` for statExp compatibility), and update `employerVitamine` to support `ZINC` and `CALCIUM` correctly.
  - `W.POKE_GEN3_MARTS`: define canonical Poké Mart inventories for Hoenn towns.
  - `martPour(p)`: when in Gen 3, map Hoenn acts to Hoenn town mart inventories.
- Update `js/poke/carte-actes.js`:
  - `VITAMINES`: include `ZINC` when in Gen 3 for rare shelves (`noeudBoutique`).
  - `PIERRES`: include `SUN_STONE` and `MOON_STONE` when in Gen 3.
  - Lilycove Department Store: sell Gen 3 TMs (Fire Blast, Thunder, Blizzard, Hyper Beam, Protect, Safeguard, Reflect, Light Screen) and combat items.
- Test: Verify with `tests/test_gen3_loot_engine.mjs`.

## Task 3: UI, Descriptions, Shop Displays & Full Regression Integration
- Update `js/poke/dits-objets.js`:
  - Add descriptions for `ZINC`, `SUN_STONE`, `MOON_STONE`, and Gen 3 specific items/balls.
- Update `js/poke/ui.js`:
  - `ctDe(n)`: resolve machine from `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(partie) : W.POKE_CT)`.
  - Ensure `ligneObjet`, `ditButin`, `ecranChoixCT`, `ecranSac`, `ecranBoutique` display Gen 3 TMs and items properly.
- Update `tests/run_all_tests.mjs`:
  - Incorporate comprehensive Gen 3 loot and TM test suite (`tests/test_gen3_loot.mjs`).
  - Verify 100% pass across all test suites, headless execution, static analysis, and replay invariance.
