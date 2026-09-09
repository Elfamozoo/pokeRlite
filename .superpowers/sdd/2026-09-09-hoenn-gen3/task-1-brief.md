# Task 1 Brief: Pipeline d'Outillage & Téléchargement des Données 3G

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 1

## Objective
Implement `tools/poke-gen3-fetch.mjs` and test it with `tests/test_gen3_fetch.mjs`.
The tool is responsible for fetching/extracting data for the 135 species (252 to 386), moves (252 to 354), encounter tables for Emerald, and downloading sprites face/back into `assets/img/poke/gen3/face/` and `assets/img/poke/gen3/dos/`, plus artworks in `assets/img/poke/art/`.

## Requirements
1. **Network Resilience & Fallback**:
   - The script should attempt to fetch from PokéAPI / PokeSprite / pret GitHub raw if network is reachable.
   - It MUST include a complete embedded/generated fallback dictionary of all 135 species (252-386) with their official French & English names, base stats `{ pv, atk, def, vit, sat, sdf }`, types, capture rates, exp curves, gender ratio, height, weight, evolutions, and level-up moves.
   - It MUST ensure that all sprite files `assets/img/poke/gen3/face/<252-386>.png`, `assets/img/poke/gen3/dos/<252-386>.png`, and `assets/img/poke/art/<252-386>.webp` exist on disk (fetching real assets from PokéAPI raw assets if possible, or generating valid 64x64 PNG sprites if offline/rate-limited).
2. **Output Data**:
   - Generates/validates JSON or JS dumps in `notes-data/` or directly in `js/poke/gen3/` draft structures.
   - Specifically produces:
     - `notes-data/POKE_GEN3_ESPECES.json`
     - `notes-data/POKE_GEN3_ATTAQUES.json`
3. **Tests (`tests/test_gen3_fetch.mjs`)**:
   - Asserts all 135 species 252-386 exist in the generated dataset.
   - Asserts every species has valid 6 base stats, types, capture rate > 0.
   - Asserts sprite files exist on disk for all 135 species.
   - Runs cleanly in Node.js and exits with code 0.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-1-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
