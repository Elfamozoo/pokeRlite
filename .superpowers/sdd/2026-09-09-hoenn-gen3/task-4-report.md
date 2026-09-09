# Task 4 Report: Zones de Rencontre, Tables d'Émeraude & Obtentions (`monde.js`, `obtentions.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 4  
**Status:** `DONE`

---

## 1. Summary of Changes

Implemented the world encounter zones, locations dictionary, fishing tables, and special obtaining methods (fossils, casino, gifts, trades) for Generation 3 (Hoenn — Pokémon Emerald canonical distribution) in `js/poke/gen3/` along with the validation test suite `tests/test_gen3_world.mjs`:

1. **`js/poke/gen3/monde.js`**:
   - Strictly pure NOYAU module adhering to ES5 IIFE pattern: `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`.
   - Declares `W.POKE_GEN3_LIEUX`:
     - Dictionary of Hoenn locations with localized `{ fr, en }` names.
     - Covers all 16 canonical towns and cities (`littleroot-town`, `oldale-town`, `petalburg-city`, `rustboro-city`, `dewford-town`, `slateport-city`, `mauville-city`, `verdanturf-town`, `fallarbor-town`, `lavaridge-town`, `fortree-city`, `lilycove-city`, `mossdeep-city`, `sootopolis-city`, `pacifidlog-town`, `ever-grande-city`).
     - Covers all routes: Routes 101 through 123 (`route-101` to `route-123`) and sea routes / channels (`route-124` to `route-134`).
     - Covers all canonical Hoenn dungeons and landmarks (`petalburg-woods`, `rusturf-tunnel`, `granite-cave`, `fiery-path`, `jagged-pass`, `mt-chimney`, `meteor-falls`, `route-111-desert`, `weather-institute`, `mt-pyre`, `magma-hideout`, `aqua-hideout`, `safari-zone`, `shoal-cave`, `seafloor-cavern`, `cave-of-origin`, `sky-pillar`, `victory-road`, `sealed-chamber`, `desert-ruins`, `island-cave`, `ancient-tomb`, `terra-cave`, `marine-cave`, `birth-island`, `mossdeep-space-center`, `abandoned-ship`, `new-mauville`, `scorched-slab`, `artisan-cave`, `desert-underpass`, `battle-frontier`, `southern-island`, `faraway-island`, `navel-rock`, `pokemon-league`).
   - Declares `W.POKE_GEN3_ZONES`:
     - Array of 61 encounter zone objects with `{ id, lieu, taux, herbe, eau }`.
     - `herbe`: `{ taux, emeraude: [{ n, niveau, poids }] }` or `null`.
     - `eau`: `{ taux, emeraude: [{ n, niveau, poids }] }` or `null`.
     - Faithfully maps Pokémon Emerald canonical encounter distributions across grass, caves, and surf (e.g. Ralts 4% on Route 102, Slakoth 5% in Petalburg Woods, Whismur in Rusturf Tunnel, Bagon 20% in deep Meteor Falls, Spinda 70% / Skarmory 5% on Route 113, Trapinch/Baltoy/Cacnea in Desert, Absol on Route 120, Spheal/Snorunt in Shoal Cave, Wailord 1% on Route 129, etc.).
   - Declares `W.POKE_GEN3_PECHE`:
     - Canne (Old Rod): Magikarp (#129), Goldeen (#118), Tentacool (#72).
     - Bonne Canne (Good Rod): Magikarp, Goldeen, Tentacool, Wailmer (#320), Corphish (#341), Barboach (#339).
     - Méga Canne (Super Rod):
       - Structured with `groupes` and `parCarte` matching engine conventions (`tablePeche(objet, lieu)` and `onPecheIci(lieu)` in `carte-actes.js`).
       - Groups: `Ocean`, `Shore`, `Pond`, `River`, `Route119` (Barpau / Feebas #349!), `DeepSea` (Relicanth #369, Clamperl #366, Luvdisc #370, Corsola #222), `MeteorFalls`, `ShoalCave`, `Safari`.
       - `parCarte` maps all uppercase snake_case Hoenn water map keys to groups.

2. **`js/poke/gen3/obtentions.js`**:
   - Strictly pure NOYAU module adhering to ES5 IIFE pattern.
   - Declares `W.POKE_GEN3_FOSSILES`:
     - `griffe`: Claw Fossil reviving into Anorith (#347, lv 20).
     - `racine`: Root Fossil reviving into Lileep / Lilia (#345, lv 20).
     - Compatible as an Array (`[0]`, `[1]`) and key lookup (`.griffe`, `.racine`).
   - Declares `W.POKE_GEN3_CASINO`:
     - Mauville Game Corner prize roster:
       - Pokémon: Abra (#63, 180 coins, lv 10), Surskit / Arakdo (#283, 500 coins, lv 15), Mawile / Mysdibule (#303, 1000 coins, lv 20), Porygon (#137, 2800 coins, lv 20).
       - Starter plushies: Treecko Plush (`PLUSH_TREECKO`), Torchic Plush (`PLUSH_TORCHIC`), Mudkip Plush (`PLUSH_MUDKIP`).
       - TMs: TM10 (Hidden Power), TM29 (Psychic), TM35 (Flamethrower), TM24 (Thunderbolt), TM13 (Ice Beam).
   - Declares `W.POKE_GEN3_CADEAUX`:
     - Castform / Morphéo (#351, lv 25, Weather Institute / `weather-institute`, holding Mystic Water).
     - Wynaut / Okéoké egg (#360, lv 5, Lavaridge Hot Springs / `lavaridge-town`).
     - Beldum / Terhal (#374, lv 5, Steven Stone's home in Mossdeep City / `mossdeep-city`).
   - Declares `W.POKE_GEN3_ECHANGES`:
     - In-game NPC trades with `{ donne, recoit, surnom, etape, lieu }`:
       - Rustboro City: Slakoth (#287) -> Makuhita (#296, "MAKU").
       - Fortree City: Skitty (#300) -> Corsola (#222, "CORONA").
       - Pacifidlog Town: Pikachu (#25) -> Skitty (#300, "SKITTY").
       - Pacifidlog Town: Plusle (#311) -> Minun (#312, "MINUN").
       - Battle Frontier: Skitty (#300) -> Meowth (#52, "MEOWTHY").

3. **Strict NOYAU Constraints**:
   - `'use strict'` enforced in both files.
   - Zero DOM / window / document access.
   - Zero non-deterministic calls (`Math.random`, `Date.now`, etc.).

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_world.mjs` was executed prior to file creation and failed with 17/17 test failures.

2. **Task 4 Test Suite (`tests/test_gen3_world.mjs`)**:
   - Command: `node tests/test_gen3_world.mjs`
   - Result: **17 / 17 tests passed (100%)**, 0 failures.

3. **Gen 3 Test Suites**:
   - `node tests/test_gen3_fetch.mjs`: 12 / 12 passed (100%).
   - `node tests/test_gen3_data_module.mjs`: 24 / 24 passed (100%).
   - `node tests/test_gen3_trainers.mjs`: 16 / 16 passed (100%).
   - `node tests/test_gen3_world.mjs`: 17 / 17 passed (100%).

4. **Full Regression Suite (`tests/run_all_tests.mjs`)**:
   - Command: `node tests/run_all_tests.mjs`
   - Result: **25 / 25 tests passed (100%)**, zero regressions across existing modules, NOYAU pure execution, PRNG determinism, and replay scoring.

---

## 3. Commits Created
- Pending commit: `feat(gen3): Task 4 - world encounter zones, locations, fishing and obtaining methods`

---

## 4. Concerns & Notes for Subsequent Tasks
- Encounter zones and fishing tables are calibrated to work seamlessly with `PokeRegles.zones()` and `PokeRegles.peche()` in Task 6.
- All locations in `W.POKE_GEN3_LIEUX` and zones in `W.POKE_GEN3_ZONES` are fully ready to be integrated into the 9-act roguelite itinerary (`js/poke/gen3/voyage.js`) in Task 5.
