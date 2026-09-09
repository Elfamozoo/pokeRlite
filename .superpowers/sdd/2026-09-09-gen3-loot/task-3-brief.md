# Task 3 Brief: UI, Descriptions, Shop Displays & Full Regression Integration

## Context & Objectives
Tasks 1 and 2 implemented the core data, registry wiring, loot engine, rewards, and marts for Gen 3.
In Task 3, we complete the user-facing presentation layer and integrate everything into the comprehensive regression test runner:
1. **Descriptions (`js/poke/dits-objets.js`)**:
   - In `objet(cle, T, nomStat)`:
     - Ensure `ZINC` (and any Gen 3 vitamin) returns `T("bDitVitamine", { stat: nomStat ? nomStat(s) : s })` using `W.PokeObtenir.VITAMINES_GEN3`.
     - Ensure `SUN_STONE` and `MOON_STONE` return `T("bDitPierre")`.
     - Ensure Gen 3 specialized balls (`NET_BALL`, `DIVE_BALL`, `NEST_BALL`, `REPEAT_BALL`, `TIMER_BALL`, `LUXURY_BALL`, `PREMIER_BALL`) return `T("bDitBall")` or specific key.
2. **UI Screens (`js/poke/ui.js`)**:
   - In `ctDe(n)`:
     - Resolve CT from `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(partie) : W.POKE_CT)` instead of hardcoded `W.POKE_CT`.
   - In `ecranBoutique`:
     - Resolve `martCombat` via `(O().martCombat ? O().martCombat(partie) : O().MART_COMBAT)`.
     - Resolve `martMachines` via `(O().martMachines ? O().martMachines(partie) : O().MART_MACHINES)`.
     - Ensure `ligneObjet`, `ditButin`, `ecranChoixCT`, `ecranSac`, `ecranBoutique` display Gen 3 TMs, items, and vitamins properly.
3. **Comprehensive Regression Suite (`tests/run_all_tests.mjs`)**:
   - Add Suite 10 to `tests/run_all_tests.mjs` verifying Gen 3 loot, CTs/CSs, marts, and determinism.
   - Run the full suite (`tests/run_all_tests.mjs`) and verify 100% tests pass (zero regressions).
   - Also verify `tests/test_gen3_loot_engine.mjs`, `tests/test_gen3_ct.mjs`, and `tests/test_gen3_registry.mjs`.

## Files to Modify
- Modify `js/poke/dits-objets.js`: support `VITAMINES_GEN3` lookup for vitamin descriptions.
- Modify `js/poke/ui.js`: update `ctDe(n)` and `ecranBoutique` mart references.
- Modify `tests/run_all_tests.mjs`: add Suite 10 for Gen 3 Loot, Marts & Rewards invariants.

## Strict Constraints
- Strict NOYAU rules for engine files; valid UI code for `ui.js` / `dits-objets.js`.
- Zero external runtime dependencies.
- Non-regression: all tests in `tests/run_all_tests.mjs` must pass 100%.
- PRNG determinism contract maintained.
