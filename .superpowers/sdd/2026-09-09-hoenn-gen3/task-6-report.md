# Task 6 Report: Câblage de l'Ordre Unique et du Registre (`ordre.js`, `regles.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 6  
**Status:** `DONE`

---

## 1. Summary of Changes

Wired the Gen 3 Hoenn modules into the single source of truth script loader [`js/poke/ordre.js`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/ordre.js) and the polymorphic rule registry [`js/poke/regles.js`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/regles.js), and created the unit test suite [`tests/test_gen3_registry.mjs`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/tests/test_gen3_registry.mjs):

1. **`js/poke/ordre.js`**:
   - Declared `var GEN3 = [ ... ]` containing the 13 NOYAU modules in dependency order:
     - `js/poke/gen3/types.js`
     - `js/poke/gen3/effets.js`
     - `js/poke/gen3/objets.js`
     - `js/poke/gen3/obtentions.js`
     - `js/poke/gen3/attaques.js`
     - `js/poke/gen3/especes.js`
     - `js/poke/gen3/dresseurs.js`
     - `js/poke/gen3/classes.js`
     - `js/poke/gen3/equipes.js`
     - `js/poke/gen3/arenes.js`
     - `js/poke/gen3/rival.js`
     - `js/poke/gen3/monde.js`
     - `js/poke/gen3/voyage.js`
   - Declared `var GEN3_ECRANS = [ "js/poke/gen3/sons.js" ]`.
   - Declared `var HOENN = "ouvert";` and `function hoennCharge()`.
   - Exported globals:
     - `W.POKE_ORDRE_GEN3 = GEN3;`
     - `W.POKE_ORDRE_GEN3_ECRANS = GEN3_ECRANS;`
     - `W.POKE_HOENN_ETAT = HOENN;`
     - `W.POKE_BANC_HOENN = hoennCharge();`
   - Conditionally injected `GEN3` into `NOYAU` before `regles.js` when `W.POKE_BANC_HOENN` is true.

2. **`js/poke/regles.js`**:
   - Added `JEUX.gen3` registration block when `W.POKE_GEN3_ESPECE && W.POKE_GEN3_TYPE_TABLE`:
     - `nom: "Troisième génération"`
     - `types()`, `typeNoms()`, `table()`, `speciaux()`
     - `especes()`, `especesListe()` (135 Hoenn species)
     - `attaques()`, `attaquesListe()` (103 Hoenn moves)
     - `dexTotal: 386`
     - `arenes()`, `etapes()`, `clesVoyage()`, `badgePourCS()`
     - `badgesStat: { 1: "atk", 3: "vit", 5: "def", 7: "spe" }` (Roxanne/Atk, Wattson/Vit, Norman/Def, Liza&Tate/Spe)
     - `sons()`, `sonsAttaques()`, `peche()`, `zones()`, `lieux()`
     - `versions: ["emeraude"]`
     - `versionsNoms: { emeraude: { fr: "Émeraude", en: "Emerald" } }`
     - `canon: [252, 255, 258]` (Arcko, Poussifeu, Gobou)
     - `professeur: { fr: "Seko", en: "Birch" }`
     - `visages`: 8 gym portraits, 4 Elite Four portraits, Wallace master portrait
     - `maitre()`: Wallace / Marc
     - `equipes()`, `classesDresseur()`, `rival()`
     - `dresseurFinal()`: Steven Stone / Pierre Rochard
     - `objetsTable()`, `errants()` (Latias #380 & Latios #381)
     - `mythique()`: Jirachi `{ n: 385, niveau: 30, lieu: "mossdeep-space-center" }`
     - `conseil()`, `echanges()`, `casino()`, `cadeaux()`, `fossiles()`
     - `speAtk: "sat"`, `speDef: "sdf"`
   - Updated `PokeRegles.objet(cle)` to look into `W.POKE_GEN3_OBJETS` when available.

3. **`tests/test_gen3_registry.mjs`**:
   - 14 automated unit tests verifying:
     - `ordre.js` exports `POKE_ORDRE_GEN3` (13 NOYAU files) and `POKE_ORDRE_GEN3_ECRANS`.
     - `HOENN = "ouvert"`, `POKE_BANC_HOENN = true`.
     - `POKE_ORDRE_NOYAU` injects all 13 `GEN3` files before `regles.js`.
     - Pure NOYAU: Zero sound files in `POKE_ORDRE_GEN3`.
     - All 13 Gen 3 files exist on disk.
     - Isolated headless VM execution with Gen 3 NOYAU stack without window or DOM.
     - `PokeRegles.cles()` includes `"gen1"`, `"gen2"`, and `"gen3"`.
     - `PokeRegles.pour("gen3")` returns complete Hoenn profile.
     - `PokeRegles.dexTotalCompte()` returns 386.
     - `PokeRegles.versionsToutes()` includes `"emeraude"`.
     - `PokeRegles.nomVersion("emeraude")` resolves both `"Émeraude"` and `"Emerald"`.
     - `PokeRegles.especeToute` resolves cross-gen species (#252 Arcko and #386 Deoxys).
     - `PokeRegles.poser("gen3")` activates Hoenn rules and 6 stats (`sat`/`sdf`).
     - `PokeActes.construire()` under Gen 3 produces 9 acts and epilogue with Steven Stone.

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_registry.mjs` executed before implementation:
   - Result: **13 failures / 1 pass**, verifying that `ordre.js` and `regles.js` lacked Gen 3 declarations.

2. **Task 6 Test Suite (`tests/test_gen3_registry.mjs`)**:
   - Command: `node tests/test_gen3_registry.mjs`
   - Result: **14 / 14 tests passed (100%)**, 0 failures.

3. **Full Regression Test Suite (`tests/run_all_tests.mjs`)**:
   - Command: `node tests/run_all_tests.mjs`
   - Result: **25 / 25 tests passed (100%)**, completed in 205ms. Zero regression across module graph, headless execution, PRNG determinism, Mulberry32, and replay daily scoring.

4. **Additional Gen 3 Suites**:
   - `tests/test_gen3_voyage.mjs`: 20 / 20 passed (100%).
   - `tests/test_gen3_trainers.mjs`: 16 / 16 passed (100%).
   - `tests/test_gen3_world.mjs`: 17 / 17 passed (100%).
   - `tests/test_gen3_data_module.mjs`: 24 / 24 passed (100%).

---

## 3. Commits Created
- `4aafc03 feat(gen3): Task 6 - wire ordre.js and regles.js for Hoenn`

---

## 4. Concerns & Notes for Subsequent Tasks
- In Task 7 (`sons.js`, `ui.js`, `pokedex-ui.js`):
  - `js/poke/gen3/sons.js` will be authored to implement WebAudio cries for species 252-386.
  - `GEN3_ECRANS` can be wired into `ECRANS` in `ordre.js` when `sons.js` is created.
  - `MONDES_DITS` in `ui.js` will map `gen3` to Hoenn UI text and starter select.
