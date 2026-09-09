# SDD ledger — plan: docs/superpowers/plans/2026-09-09-battle-factory-talents.md

Base commit: `2a25b688d21df6c740c35fc5eb4489ffe271a6f5`
Branch: `feat/battle-factory-talents`

## Pre-Flight Conflict Scan

| Task Pair / Self | Interface / Files Touched | Finding | Ruling |
|---|---|---|---|
| Task 1 self | `js/poke/gen3/natures.js`, `js/poke/moteur.js`, `js/poke/ordre.js` | Agreement between test and code; +10% / -10% factors | Clean |
| Task 1 -> Task 2 | `moteur.js` and `especes.js` | Natures and abilities live in separate data fields (`p.nature`, `p.talent`) | Clean |
| Task 2 self | `js/poke/gen3/talents.js`, `js/poke/gen3/especes.js`, `js/poke/especes.js` | 100% species mapping, consistent property `talent` | Clean |
| Task 1,2 -> Task 3 | `combat.js` consumes `p.nature` and `p.talent` | Combat hooks trigger only if active and present | Clean |
| Task 3 self | `js/poke/gen3/objets-tenus.js`, `js/poke/combat.js` | Hail weather, air lock, and active abilities | Clean |
| Task 3 -> Task 4 | `sets-usine.js` and `usine.js` consume held items, natures, abilities | Factory rental sets have nature, item, moves, ability | Clean |
| Task 4 -> Task 5 | `ui-usine.js` consumes `PokeUsine` engine API | Clear UI separation, zero logic in UI | Clean |
| Task 1..5 -> Task 6 | `tests/run_all_tests.mjs` Suite 11 | Comprehensive non-regression and PRNG determinism | Clean |

---

## Task Progress Log
