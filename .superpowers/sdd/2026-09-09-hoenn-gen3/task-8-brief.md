# Task 8 Brief: Suite Complète de Tests & Vérification de Non-Régression Bit-à-Bit

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 8

## Objective
Update the primary test runner [`tests/run_all_tests.mjs`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/tests/run_all_tests.mjs) to comprehensively validate the Hoenn Gen 3 expansion across all test tiers, enforce strict NOYAU headless constraints, and prove bit-level non-regression on Gen 1 and Gen 2 combat and PRNG pipelines.

## Files to Modify
- `tests/run_all_tests.mjs`

## Requirements
1. **Module Architecture & Dependency Graph**:
   - Verify `POKE_ORDRE_GEN3` contains only pure logic/data files and NO sound/animation files.
   - Verify `POKE_ORDRE_GEN3_ECRANS` contains sound/animation files.
   - Verify zero intersection between NOYAU and ECRANS file lists.
   - Verify all files in `GEN3` and `GEN3_ECRANS` exist on disk.
2. **Headless NOYAU Execution**:
   - Evaluate the entire NOYAU stack (Gen 1 + Gen 2 + Gen 3) in an isolated Node.js context with NO `window` and NO `document`.
   - Verify that all Gen 3 globals (`POKE_GEN3_ESPECES`, `POKE_GEN3_ATTAQUES`, `POKE_GEN3_ARENES`, `POKE_GEN3_ETAPES`, `POKE_GEN3_ZONES`, `POKE_GEN3_LIEUX`, `POKE_GEN3_CLES`, `POKE_GEN3_OBJETS`) and `JEUX.gen3` in `PokeRegles` are cleanly exported.
3. **Static Analysis & Security Invariants**:
   - Assert zero occurrences of `Math.random()`, `Date.now()`, `new Date()`, or `performance.now()` across all `js/poke/gen3/` core files.
   - Assert zero DOM / browser API leaks (`window.`, `document.`, `localStorage`, `sessionStorage`, `navigator`).
   - Assert all `js/poke/gen3/*.js` files enforce `'use strict'`.
4. **PRNG Determinism & Replay Engine Invariance**:
   - Execute Mulberry32 bit-level reproducibility tests across Gen 1, Gen 2, and Gen 3.
   - Run combat replay verification: prove that identical seeds and turn sequences in Gen 1 and Gen 2 produce 100% identical combat events and score hashes as before Gen 3 was added.
5. **Gen 3 Completeness & Progression Validation**:
   - Verify all 135 species (252-386) have 6 valid base stats, valid capture rates, and valid types.
   - Verify `PokeActes.construire()` generates exactly 9 acts under Gen 3.
   - Verify Steven Stone is reachable as `dresseurFinal`.
   - Verify all 8 static legendaries and roaming duo are declared.
6. **Execution**:
   - `node tests/run_all_tests.mjs` must pass 100% with 0 failures and execute quickly (< 500ms).

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-8-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
