# SDD ledger — plan: docs/superpowers/plans/2026-09-09-hoenn-gen3.md

| Task | Status | Details |
|---|---|---|
| Pre-flight | complete | Scan clean, zero cross-task interface conflicts detected. Baseline commit recorded (`b156c6ad81ff9a32ce8f733fb9fd97b01cf45d39`). |
| Task 1 | complete | Commits: `b156c6a`..`14fa985`. Review clean. Offline fetch tool and fallback dataset verified. All 135 species data & sprites generated. |

### Directives pour Task 2 (issues de la revue Task 1)
- Nettoyer les reliquats d'évolutions cross-gen > 386 (ex. Lineon vers Ixon 862, Kirlia vers Gallame 475, Tarinor vers Tarinorme 476, Roselia vers Roserade 407, Teraclope vers Noctunoir 477, Stalgamin vers Momartik 478).
- Corriger le second embranchement de Ningale vers Munja (`par: "niveau"`).
- Normaliser les 14 clés d'attaques historiques (ex. `SOLARBEAM`, `PSYCHIC_M`, `FAINT_ATTACK`, `BUBBLEBEAM`, `POISONPOWDER`, `DYNAMICPUNCH`, `DOUBLESLAP`, `VICEGRIP`, `HI_JUMP_KICK`, `THUNDERPUNCH`, `DRAGONBREATH`, `SELFDESTRUCT`, `ANCIENTPOWER`, `EXTREMESPEED`).
