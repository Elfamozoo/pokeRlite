# Task 1 Report: Canonical Gen 3 Technical Machines (CTs & CSs) and Registry Wiring

**Plan:** `.superpowers/sdd/2026-09-09-gen3-loot/plan.md`  
**Task Number:** 1  
**Status:** `DONE`

---

## 1. Summary of Changes

Implemented the canonical Generation 3 Technical Machines (CT01 to CT50) and Hidden Machines (CS01 to CS08) module and unified registry wiring:

1. **Test Suite (`tests/test_gen3_ct.mjs`)**:
   - Initial TDD cycle: Verified 15/15 test failures prior to implementation.
   - Verifies strict NOYAU constraints: `'use strict'`, zero DOM/browser dependencies, zero `Math.random()`, `Date.now()`, or timing calls.
   - Validates all 50 canonical Gen 3 CTs (CT01 FOCUS_PUNCH to CT50 OVERHEAT) with correct order, move keys, ROM prices (e.g. 1000 to 7500), and types.
   - Validates all 8 canonical Gen 3 CSs (CS01 CUT to CS08 DIVE) with `cs: true` and valid types.
   - Validates fast lookup map `POKE_GEN3_CT_PAR_CLE` indexing all 50 CTs and 8 CSs by move key.
   - Validates module wiring in `js/poke/ordre.js` (`GEN3` order and `POKE_ORDRE_NOYAU` positioning).
   - Validates registry integration in `js/poke/regles.js` for `JEUX.gen1`, `JEUX.gen2`, `JEUX.gen3`, and `PokeRegles` accessors (`ct`, `cs`, `ctParCle`) across string keys, partie objects, and active `poser()` state.

2. **Gen 3 CT Module (`js/poke/gen3/ct.js`)**:
   - Strict NOYAU rules: pure IIFE attached to `typeof window !== "undefined" ? window : globalThis`.
   - Exports `W.POKE_GEN3_CT` containing the 50 canonical Gen 3 CTs.
   - Exports `W.POKE_GEN3_CS` containing the 8 canonical Gen 3 CSs.
   - Exports `W.POKE_GEN3_CT_PAR_CLE` fast lookup table mapping move key to CT/CS object.

3. **Loading Order Architecture (`js/poke/ordre.js`)**:
   - Inserted `"js/poke/gen3/ct.js"` into `GEN3` array immediately following `"js/poke/gen3/objets.js"`.
   - Ensures `ct.js` is loaded into `POKE_ORDRE_NOYAU` before `js/poke/regles.js`.

4. **Game Rules & Registry Accessors (`js/poke/regles.js`)**:
   - `JEUX.gen1`: added `ct()` returning `W.POKE_CT`, `cs()` returning `null`, `ctParCle()` returning `W.POKE_CT_PAR_CLE`.
   - `JEUX.gen2`: added `ct()` returning `W.POKE_GEN2_CT || W.POKE_CT`, `cs()` returning `null`, `ctParCle()` returning `W.POKE_GEN2_CT_PAR_CLE || W.POKE_CT_PAR_CLE`.
   - `JEUX.gen3`: added `ct()` returning `W.POKE_GEN3_CT || W.POKE_CT`, `cs()` returning `W.POKE_GEN3_CS || null`, `ctParCle()` returning `W.POKE_GEN3_CT_PAR_CLE || W.POKE_CT_PAR_CLE`.
   - `W.PokeRegles`: added dynamic accessors:
     - `PokeRegles.ct(partieOuCle)`
     - `PokeRegles.cs(partieOuCle)`
     - `PokeRegles.ctParCle(partieOuCle)`
     Gracefully handling string keys (`"gen1"`, `"gen3"`), partie objects (`{ regles: "gen3" }`), and active game state via `poser()`.

5. **Test Harness Synchronization**:
   - Updated `tests/run_all_tests.mjs` and `tests/test_gen3_registry.mjs` to reflect the 14 NOYAU files in `POKE_ORDRE_GEN3`.

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_ct.mjs`
   - Result: **15 / 15 failed** as expected before implementation.

2. **Task 1 Test Suite (`tests/test_gen3_ct.mjs`)**:
   - `node tests/test_gen3_ct.mjs`
   - Result: **15 / 15 passed (100%)**, 0 failures.

3. **Gen 3 Registry Test Suite (`tests/test_gen3_registry.mjs`)**:
   - `node tests/test_gen3_registry.mjs`
   - Result: **14 / 14 passed (100%)**, 0 failures.

4. **Full Regression Test Suite (`tests/run_all_tests.mjs`)**:
   - `node tests/run_all_tests.mjs`
   - Result: **36 / 36 passed (100%)**, 0 failures.
   - Zero non-deterministic call violations across NOYAU and Gen 3.
   - Zero DOM / browser leaks across NOYAU and Gen 3.
   - Combat simulation & PRNG determinism verified across Gen 1, Gen 2, and Gen 3.

5. **Existing Domain Test Suites**:
   - `node tests/test_gen3_data_module.mjs`: 24 / 24 passed (100%)
   - `node tests/test_gen3_trainers.mjs`: 16 / 16 passed (100%)
   - `node tests/test_gen3_ui.mjs`: 9 / 9 passed (100%)
   - `node tests/test_gen3_voyage.mjs`: 20 / 20 passed (100%)
   - `node tests/test_gen3_world.mjs`: 17 / 17 passed (100%)
   - `node tests/test_combat_capture_adversarial.mjs`: 19 / 19 passed (100%)
   - `node tests/test_adversarial_reviewer2.mjs`: 100% passed

---

## 3. Commits Created

- `feat(gen3): Task 1 - canonical Gen 3 CTs/CSs and registry wiring`

## 4. Concerns & Notes for Subsequent Tasks

- Task 2 will adapt `js/poke/butin.js`, `js/poke/obtenir.js`, and `js/poke/carte-actes.js`. They should call `PokeRegles.ct(partie)` instead of directly accessing `W.POKE_CT`.
- `VITAMINES` in `obtenir.js` and `carte-actes.js` will need to include `ZINC` for Gen 3.
- `apprendreCT` in `obtenir.js` should check `PokeRegles.ctParCle(partie)` to resolve move keys and machine objects accurately.
