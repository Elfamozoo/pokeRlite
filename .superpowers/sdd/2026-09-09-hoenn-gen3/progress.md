# SDD ledger — plan: docs/superpowers/plans/2026-09-09-hoenn-gen3.md

| Task | Status | Details |
|---|---|---|
| Pre-flight | complete | Scan clean, zero cross-task interface conflicts detected. Baseline commit recorded (`b156c6ad81ff9a32ce8f733fb9fd97b01cf45d39`). |
| Task 1 | complete | Commits: `b156c6a`..`14fa985`. Review clean. Offline fetch tool and fallback dataset verified. All 135 species data & sprites generated. |
| Task 2 | complete | Commits: `14fa985`..`2e41337`. Review clean. Core NOYAU data modules (`types.js`, `effets.js`, `attaques.js`, `especes.js`, `objets.js`) authored and verified. Zero DOM leaks, sanitized evolutions, normalized move keys. |
| Task 3 | complete | Commits: `2e41337`..`c4fa700`. Review clean. 8 Gym Leaders, Elite Four, Champion Wallace, Epilogue Boss Steven Stone (Meteor Falls lv 75-78), rivals May/Brendan and Wally. |
| Task 4 | complete | Commits: `c4fa700`..`7afc652`. Review clean. Locations dictionary (`W.POKE_GEN3_LIEUX`), 61 encounter zones matching Emerald (`W.POKE_GEN3_ZONES`), fishing tables (`W.POKE_GEN3_PECHE`), fossils, casino, gifts, and in-game trades. |

### Directives pour Task 5
- Modéliser l'itinéraire des 9 actes dans `js/poke/gen3/voyage.js`.
- Câbler les 8 badges, les CS canoniques (Coupe, Flash, Éclate-Roc, Force, Surf, Vol, Plongée, Cascade) et leurs verrous.
- Câbler les scènes narratives : Bois Clémenti, Mont Chimère, Centre Météo, Repaire Team, Pilier Céleste.
- Câbler l'accès garanti à 100% des Pokémon : Rayquaza (Pilier Céleste), Groudon (Grotte Terra), Kyogre (Grotte Marine), Sanctuaires des Régis (Regirock, Regice, Registeel via Chambre Scellée), Latios/Latias errants, Jirachi (Centre Spatial), Deoxys (Île Aurore), et le boss d'épilogue Pierre Rochard au Site Météore.
