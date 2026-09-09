# Task 6 Brief: Câblage de l'Ordre Unique et du Registre (`ordre.js`, `regles.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 6

## Objective
Wire the Gen 3 modules into the single source of truth script loader [`js/poke/ordre.js`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/ordre.js) and the polymorphic rule registry [`js/poke/regles.js`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/js/poke/regles.js), and verify with `tests/test_gen3_registry.mjs`.

## Files to Modify
- `js/poke/ordre.js`
- `js/poke/regles.js`

## Files to Create
- `tests/test_gen3_registry.mjs`

## Requirements
1. **`js/poke/ordre.js`**:
   - Define `var GEN3 = [ ... ]` containing the 13 NOYAU files:
     - `"js/poke/gen3/types.js"`
     - `"js/poke/gen3/effets.js"`
     - `"js/poke/gen3/objets.js"`
     - `"js/poke/gen3/obtentions.js"`
     - `"js/poke/gen3/attaques.js"`
     - `"js/poke/gen3/especes.js"`
     - `"js/poke/gen3/dresseurs.js"`
     - `"js/poke/gen3/classes.js"`
     - `"js/poke/gen3/equipes.js"`
     - `"js/poke/gen3/arenes.js"`
     - `"js/poke/gen3/rival.js"`
     - `"js/poke/gen3/monde.js"`
     - `"js/poke/gen3/voyage.js"`
   - Define `var GEN3_ECRANS = [ ... ]`:
     - `"js/poke/gen3/sons.js"` (created in Task 7)
   - Define `var HOENN = "ouvert";` and `function hoennCharge()`.
   - Export globals:
     - `W.POKE_ORDRE_GEN3 = GEN3;`
     - `W.POKE_ORDRE_GEN3_ECRANS = GEN3_ECRANS;`
     - `W.POKE_HOENN_ETAT = HOENN;`
     - `W.POKE_BANC_HOENN = hoennCharge();`
   - When `hoennCharge()`, inject `GEN3` into `NOYAU` before `js/poke/regles.js` (following the exact same pattern as `GEN2` in lines 247-255).
2. **`js/poke/regles.js`**:
   - In the registration section, when `W.POKE_GEN3_ESPECE && W.POKE_GEN3_TYPE_TABLE`:
     - Register `JEUX.gen3 = { ... }`:
       - `nom: "Troisième génération"`
       - `types: function () { return W.POKE_GEN3_TYPES; }`
       - `typeNoms: function () { return W.POKE_GEN3_TYPE_NOMS; }`
       - `table: function () { return W.POKE_GEN3_TYPE_TABLE; }`
       - `speciaux: function () { return W.POKE_GEN3_TYPES_SPECIAUX; }`
       - `especes: function () { return W.POKE_GEN3_ESPECE; }`
       - `especesListe: function () { return W.POKE_GEN3_ESPECES; }`
       - `attaques: function () { return W.POKE_GEN3_ATTAQUE_PAR_CLE; }`
       - `attaquesListe: function () { return W.POKE_GEN3_ATTAQUES; }`
       - `dexTotal: 386`
       - `arenes: function () { return W.POKE_GEN3_ARENES || W.POKE_ARENES; }`
       - `etapes: function () { return W.POKE_GEN3_ETAPES || W.POKE_ETAPES; }`
       - `clesVoyage: function () { return W.POKE_GEN3_CLES || W.POKE_CLES; }`
       - `badgePourCS: function () { return W.POKE_GEN3_BADGE_POUR_CS || {}; }`
       - `badgesStat: { 1: "atk", 3: "vit", 5: "def", 7: "spe" }`
       - `sons: function () { return W.POKE_GEN3_SONS || W.POKE_SONS; }`
       - `sonsAttaques: function () { return W.POKE_GEN3_SONS_ATTAQUES || W.POKE_SONS; }`
       - `peche: function () { return W.POKE_GEN3_PECHE || null; }`
       - `zones: function () { return W.POKE_GEN3_ZONES || W.POKE_ZONES; }`
       - `lieux: function () { return W.POKE_GEN3_LIEUX || W.POKE_LIEUX; }`
       - `versions: ["emeraude"]`
       - `versionsNoms: { emeraude: { fr: "Émeraude", en: "Emerald" } }`
       - `canon: [252, 255, 258]` (Arcko, Poussifeu, Gobou)
       - `professeur: { fr: "Seko", en: "Birch" }`
       - `visages: { arene: ["gen3/dresseur/arene1", "gen3/dresseur/arene2", "gen3/dresseur/arene3", "gen3/dresseur/arene4", "gen3/dresseur/arene5", "gen3/dresseur/arene6", "gen3/dresseur/arene7", "gen3/dresseur/arene8"], conseil: ["gen3/dresseur/conseil1", "gen3/dresseur/conseil2", "gen3/dresseur/conseil3", "gen3/dresseur/conseil4"], maitre: "gen3/dresseur/maitre" }`
       - `maitre: function () { return W.POKE_GEN3_MAITRE || null; }`
       - `equipes: function () { return W.POKE_GEN3_EQUIPES || null; }`
       - `classesDresseur: function () { return W.POKE_GEN3_CLASSES || null; }`
       - `rival: function () { return W.POKE_GEN3_RIVAL || null; }`
       - `dresseurFinal: function () { return W.POKE_GEN3_STEVEN || null; }`
       - `objetsTable: function () { return W.POKE_GEN3_OBJETS || null; }`
       - `errants: function () { return W.POKE_GEN3_ERRANTS || null; }`
       - `mythique: function () { return { n: 385, niveau: 30, lieu: "mossdeep-space-center" }; }`
       - `conseil: function () { return W.POKE_GEN3_CONSEIL || W.POKE_CONSEIL; }`
       - `echanges: function () { return W.POKE_GEN3_ECHANGES || null; }`
       - `casino: function () { return W.POKE_GEN3_CASINO || null; }`
       - `cadeaux: function () { return W.POKE_GEN3_CADEAUX || null; }`
       - `fossiles: function () { return W.POKE_GEN3_FOSSILES || null; }`
       - `speAtk: "sat"`, `speDef: "sdf"`
   - Ensure `dexTotalCompte()` returns `386`.
   - Ensure `versionsToutes()` includes `"emeraude"`.
3. **Tests (`tests/test_gen3_registry.mjs`)**:
   - Asserts `ordre.js` contains `GEN3` and properly injects it into `NOYAU`.
   - Asserts `PokeRegles.cles()` includes `"gen1"`, `"gen2"`, `"gen3"`.
   - Asserts `PokeRegles.pour("gen3")` returns full profile.
   - Asserts `PokeRegles.dexTotalCompte()` returns 386.
   - Asserts `PokeActes.construire()` generates 9 acts under Gen 3.
   - Asserts zero regression on existing `tests/run_all_tests.mjs`.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-6-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
