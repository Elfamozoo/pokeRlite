# SDD ledger — plan: .superpowers/sdd/2026-09-09-gen3-loot/plan.md

## Pre-flight Conflict Scan
| Task Pair / Task | Produces / Consumes | Conflict Finding | Ruling |
|---|---|---|---|
| Task 1 x Task 2 | Task 1 provides `W.POKE_GEN3_CT` & `PokeRegles.ct()` -> Task 2 consumes them in `butin.js`, `obtenir.js`, `carte-actes.js` | None. Task 1 establishes the single source of truth for Gen 3 CTs/CSs, Task 2 integrates it into the loot and mart engines. | Pass |
| Task 2 x Task 3 | Task 2 adapts butin/objets/shops data -> Task 3 adapts UI descriptions and screens | None. Clean separation between engine/data (Task 2) and presentation/text/integration tests (Task 3). | Pass |
| Task 1 text | `js/poke/gen3/ct.js` defines 50 CTs + 8 CSs | Aligns with Emerald canon (Focus Punch to Overheat; Cut to Dive). | Pass |
| Task 2 text | Support `ZINC`, `SUN_STONE`, `MOON_STONE` and `apprenables(p)` | Aligns with existing `gen3/objets.js` keys and `gen3/especes.js` learnsets. | Pass |
| Task 3 text | Non-regression on Gen 1 and Gen 2 | All existing suites must pass 100%. | Pass |

## Progress
- Task 1: complete (commits efc996d..af98f69, review clean)
- Task 2: complete (commits af98f69..0705525, review clean)
- Task 3: complete (commits 0705525..7b73554, review clean)
