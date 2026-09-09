# Task 4 Brief: Zones de Rencontre, Tables d'Émeraude & Obtentions (`monde.js`, `obtentions.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 4

## Objective
Author the world encounter zones, locations dictionary, fishing tables, and special obtaining methods (fossils, casino, gifts, trades) in `js/poke/gen3/` and verify them with `tests/test_gen3_world.mjs`.

## Files to Create
- `js/poke/gen3/monde.js`
- `js/poke/gen3/obtentions.js`
- `tests/test_gen3_world.mjs`

## Requirements
1. **`js/poke/gen3/monde.js`**:
   - Declares `W.POKE_GEN3_LIEUX`:
     - Dictionary of Hoenn locations with localized French and English names.
     - Covers: `littleroot-town` (Bourg-en-Vol), `oldale-town` (Rosyères), `petalburg-city` (Clémenti-Ville), `rustboro-city` (Mérouville), `dewford-town` (Myokara), `slateport-city` (Poivressel), `mauville-city` (Lavandia), `verdanturf-town` (Vergazon), `fallarbor-town` (Autéquia), `lavaridge-town` (Vermilava), `fortree-city` (Cimetronelle), `lilycove-city` (Nénucrique), `mossdeep-city` (Algatia), `sootopolis-city` (Atalanopolis), `pacifidlog-town` (Pacifiville), `ever-grande-city` (Éternara).
     - Covers dungeons and routes: Routes 101 through 134, `petalburg-woods` (Bois Clémenti), `rusturf-tunnel` (Tunnel Mérouvergne), `granite-cave` (Grotte Granite), `fiery-path` (Chemin Ardent), `jagged-pass` (Sentier Sinuroc), `mt-chimney` (Mont Chimère), `meteor-falls` (Site Météore), `route-111-desert` (Désert), `weather-institute` (Centre Météo), `mt-pyre` (Mont Mémoria), `magma-hideout` (Repaire Magma), `aqua-hideout` (Repaire Aqua), `safari-zone` (Parc Safari), `shoal-cave` (Grotte Tréfonds), `seafloor-cavern` (Caverne Fondmer), `cave-of-origin` (Grotte Origine), `sky-pillar` (Pilier Céleste), `victory-road` (Route Victoire), `sealed-chamber` (Chambre Scellée), `desert-ruins` (Ruines du Désert), `island-cave` (Grotte de l'Îlot), `ancient-tomb` (Tombeau Antique), `terra-cave` (Grotte Terra), `marine-cave` (Grotte Marine), `birth-island` (Île Aurore), `mossdeep-space-center` (Centre Spatial).
   - Declares `W.POKE_GEN3_ZONES`:
     - Array of encounter zone objects. Each zone has `{ id, lieu, taux, herbe, eau }`.
     - `herbe`: `{ emeraude: [{ n, niveau, poids }] }` or `null`.
     - `eau`: `{ taux, emeraude: [{ n, niveau, poids }] }` or `null`.
     - Matches canonical Emerald encounter distribution for grass and surf.
   - Declares `W.POKE_GEN3_PECHE`:
     - Fishing tables matching Emerald: `canne`, `bonne`, and `mega` (`groupes` + `parCarte`).
2. **`js/poke/gen3/obtentions.js`**:
   - Declares `W.POKE_GEN3_FOSSILES`:
     - `griffe`: Anorith (#347, lv 20)
     - `racine`: Lilia (#345, lv 20)
   - Declares `W.POKE_GEN3_CASINO`:
     - Mauville Game Corner prizes (Treecko / Torchic / Mudkip plush, TMs, Pokémon prizes like Abra, Surskit, Mawile, Porygon).
   - Declares `W.POKE_GEN3_CADEAUX`:
     - Castform / Morphéo (#351) at Weather Institute.
     - Wynaut / Okéoké (#360) egg at Lavaridge Hot Springs.
     - Beldum / Terhal (#374) in Steven's house in Mossdeep City postgame.
   - Declares `W.POKE_GEN3_ECHANGES`:
     - In-game NPC trades (e.g. Slakoth for Makuhita in Rustboro, Skitty for Corsola in Fortree, Pikachu for Skitty, Plusle/Minun in Pacifidlog).
3. **Strict NOYAU Constraints**:
   - Strict mode `'use strict'`.
   - Zero DOM, zero window/document access.
   - Zero non-deterministic calls (`Math.random`, `Date.now`).
4. **Test (`tests/test_gen3_world.mjs`)**:
   - Asserts all locations exist and have localized FR/EN labels.
   - Asserts zones contain valid species numbers (1 to 386) and positive levels.
   - Asserts fishing tables and casino/fossil/gift structures are exported and non-empty.
   - Runs cleanly in Node.js and exits with code 0.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-4-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
