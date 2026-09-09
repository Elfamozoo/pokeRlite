# SDD ledger — plan: docs/superpowers/plans/2026-09-09-hoenn-gen3.md

| Task | Status | Details |
|---|---|---|
| Pre-flight | complete | Scan clean, zero cross-task interface conflicts detected. Baseline commit recorded (`b156c6ad81ff9a32ce8f733fb9fd97b01cf45d39`). |
| Task 1 | complete | Commits: `b156c6a`..`14fa985`. Review clean. Offline fetch tool and fallback dataset verified. All 135 species data & sprites generated. |
| Task 2 | complete | Commits: `14fa985`..`2e41337`. Review clean. Core NOYAU data modules (`types.js`, `effets.js`, `attaques.js`, `especes.js`, `objets.js`) authored and verified. Zero DOM leaks, sanitized evolutions, normalized move keys. |

### Directives pour Task 3
- Modéliser les 8 champions d'arène d'Émeraude (Roxanne à Juan avec équipes canoniques).
- Modéliser le Conseil 4 (Damien, Spectra, Glacia, Aragon) et le Maître Marc (Wallace).
- Modéliser le boss d'épilogue Pierre Rochard (Steven Stone) au Site Météore (niv. 75-78).
- Modéliser les rivaux Flora/Brice (3 variantes selon le starter) et Timmy (Route Victoire).
- Roster complet des dresseurs de route et classes d'Hoenn.
