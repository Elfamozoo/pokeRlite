# SDD ledger — plan: docs/superpowers/plans/2026-09-09-hoenn-gen3.md

| Task | Status | Details |
|---|---|---|
| Pre-flight | complete | Scan clean, zero cross-task interface conflicts detected. Baseline commit recorded (`b156c6ad81ff9a32ce8f733fb9fd97b01cf45d39`). |
| Task 1 | complete | Commits: `b156c6a`..`14fa985`. Review clean. Offline fetch tool and fallback dataset verified. All 135 species data & sprites generated. |
| Task 2 | complete | Commits: `14fa985`..`2e41337`. Review clean. Core NOYAU data modules (`types.js`, `effets.js`, `attaques.js`, `especes.js`, `objets.js`) authored and verified. Zero DOM leaks, sanitized evolutions, normalized move keys. |
| Task 3 | complete | Commits: `2e41337`..`c4fa700`. Review clean. 8 Gym Leaders, Elite Four, Champion Wallace, Epilogue Boss Steven Stone (Meteor Falls lv 75-78), rivals May/Brendan and Wally. |
| Task 4 | complete | Commits: `c4fa700`..`7afc652`. Review clean. Locations dictionary (`W.POKE_GEN3_LIEUX`), 61 encounter zones matching Emerald (`W.POKE_GEN3_ZONES`), fishing tables (`W.POKE_GEN3_PECHE`), fossils, casino, gifts, and in-game trades. |
| Task 5 | complete | Commits: `7afc652`..`366258f`. Review clean. 9 Acts roguelite journey (`W.POKE_GEN3_ETAPES`), 8 HMs (`W.POKE_GEN3_CLES`), all 8 static legendaries, roamers (Latios/Latias), and Steven Stone epilogue boss. |

### Directives pour Task 6
- Mettre à jour `js/poke/ordre.js` pour déclarer `GEN3` et `GEN3_ECRANS`, définir `HOENN = "ouvert"`, et injecter `GEN3` dans `NOYAU` avant `regles.js`.
- Mettre à jour `js/poke/regles.js` pour inscrire `JEUX.gen3` lorsque les données sont chargées.
- Vérifier que `PokeRegles.cles()` retourne `["gen1", "gen2", "gen3"]`.
- Vérifier que `PokeRegles.dexTotalCompte()` retourne bien 386.
- Vérifier que `PokeActes.construire()` produit bien les 9 actes d'Hoenn sans casser Kanto et Johto.
