# SDD ledger — plan: docs/superpowers/plans/2026-09-09-hoenn-gen3.md

| Task | Status | Details |
|---|---|---|
| Pre-flight | complete | Scan clean, zero cross-task interface conflicts detected. Baseline commit recorded (`b156c6ad81ff9a32ce8f733fb9fd97b01cf45d39`). |
| Task 1 | complete | Commits: `b156c6a`..`14fa985`. Review clean. Offline fetch tool and fallback dataset verified. All 135 species data & sprites generated. |
| Task 2 | complete | Commits: `14fa985`..`2e41337`. Review clean. Core NOYAU data modules (`types.js`, `effets.js`, `attaques.js`, `especes.js`, `objets.js`) authored and verified. Zero DOM leaks, sanitized evolutions, normalized move keys. |
| Task 3 | complete | Commits: `2e41337`..`c4fa700`. Review clean. 8 Gym Leaders, Elite Four, Champion Wallace, Epilogue Boss Steven Stone (Meteor Falls lv 75-78), rivals May/Brendan and Wally. |
| Task 4 | complete | Commits: `c4fa700`..HEAD. World locations, encounter zones, fishing tables, fossils, Mauville Game Corner, gifts, and NPC trades. |

Task 3: minor (deferred):
- Hex Maniac French label can be polished to "Mystique".
- `FEINT_ATTACK` spelling in route teams normalized to `FAINT_ATTACK`.

### Directives pour Task 5
- Itinéraire roguelite des 9 actes d'Hoenn dans `js/poke/gen3/voyage.js`.
- Émeraudes, légendaires statiques (Rayquaza, Kyogre, Groudon, Regi trio) et errants (Latios/Latias).
- Intégration avec `PokeRegles.etapes()`.
