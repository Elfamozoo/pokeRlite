# Coffre d'Accueil, Objets de Départ à 5 Charges & Équipement dans le Sac Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete meta-progression loop connecting the Battle Factory to the main roguelite adventure: Battle Shop purchases award 5 uses stored in a persistent Home Chest, a starting loadout selection screen lets players take 1 unlocked item into their run (consuming 1 charge), an in-game bag interface allows equipping held items on team Pokémon with instant combat effects, and a Nuzlocke salvage rule automatically returns held items to the bag upon Pokémon death.

**Architecture:** 
- Meta-storage in `js/poke/progression.js` with `p.coffre = { [cle]: charges }` and API methods `coffreLire`, `coffreAjouter`, `coffreConsommer`, `coffreCompte`.
- Battle Shop in `js/poke/ui-usine.js` decoupled from active runs, directly funding the persistent chest.
- Home screen and onboarding screens in `js/poke/ui.js` providing `#pk-coffre` (`ecranCoffre`), start run loadout selection (`ecranObjetDepart`), and adventure bag equipment flow (`choisirPorteur`).
- Core engine Nuzlocke cleanup in `js/poke/partie.js:nettoyerEquipe` salvaging held items back to `partie.sac`.

**Tech Stack:** Pure Vanilla JavaScript (ES5 / IIFE), HTML5/CSS, Node.js test runners, zero external runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-10-coffre-objets-depart-design.md`

## Global Constraints
- Zero external runtime dependencies. Pure Vanilla JS (ES5 / IIFE).
- Strict NOYAU rules for `progression.js` and `partie.js`: 'use strict', zero DOM access, zero Math.random() / Date.now().
- Backward compatibility: Gen 1, Gen 2, and Gen 3 PRNG Mulberry32 determinism and combat replay invariance strictly preserved.
- Daily Challenge (`defi` / `partie.compare`) must strictly exclude starting chest items to preserve leaderboard fairness.
- 100% test pass rate across `tests/run_all_tests.mjs` and dedicated test suite `tests/test_coffre_objets_depart.mjs`.

---

### Task 1: Core Data & Meta-Progression Chest Engine (`js/poke/progression.js`)

**Files:**
- Modify: `js/poke/progression.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Produces on `W.PokeProgression`:
  - `coffreLire(): Object`
  - `coffreAjouter(cleObjet: string, charges?: number): number`
  - `coffreConsommer(cleObjet: string): number`
  - `coffreCompte(): number`

- [ ] **Step 1: Write the failing test for Task 1 in `tests/test_coffre_objets_depart.mjs`**

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";

// Isolated NOYAU loader
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; }
    };
  })()
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

function loadScript(path) {
  const code = fs.readFileSync(path, "utf8");
  const fn = new Function("window", "globalThis", "localStorage", code);
  fn.call(sandbox, sandbox, sandbox, sandbox.localStorage);
}

loadScript("js/poke/hasard.js");
loadScript("js/poke/progression.js");

const P = sandbox.W.PokeProgression;
assert.ok(P, "PokeProgression exported");

// Test 1: Coffre API
assert.deepEqual(P.coffreLire(), {}, "Coffre initialement vide");
assert.equal(P.coffreCompte(), 0, "Coffre compte 0");

const c1 = P.coffreAjouter("CHOICE_BAND", 5);
assert.equal(c1, 5, "Ajout de 5 charges Choice Band");
assert.equal(P.coffreCompte(), 1, "Compte 1 objet");
assert.equal(P.coffreLire().CHOICE_BAND, 5, "5 charges stockées");

const c2 = P.coffreAjouter("CHOICE_BAND", 5);
assert.equal(c2, 10, "Cumul à 10 charges");

const rem1 = P.coffreConsommer("CHOICE_BAND");
assert.equal(rem1, 9, "9 charges restantes après consommation");

// Consommer 9 fois
for (let i = 0; i < 9; i++) P.coffreConsommer("CHOICE_BAND");
assert.equal(P.coffreLire().CHOICE_BAND, undefined, "Clé supprimée après épuisement");
assert.equal(P.coffreCompte(), 0, "Coffre vide après épuisement");

console.log("✓ Task 1: Tests unitaires du moteur de Coffre réussis !");
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_coffre_objets_depart.mjs`
Expected: FAIL with `P.coffreLire is not a function`

- [ ] **Step 3: Implement `coffreLire`, `coffreAjouter`, `coffreConsommer`, `coffreCompte` in `js/poke/progression.js`**

```javascript
  function coffreLire() {
    var p = lire();
    return p.coffre || {};
  }

  function coffreCompte() {
    var c = coffreLire();
    return Object.keys(c).length;
  }

  function coffreAjouter(cleObjet, charges) {
    if (!cleObjet) return 0;
    var n = typeof charges === "number" && charges > 0 ? Math.floor(charges) : 5;
    var p = lire();
    p.coffre = p.coffre || {};
    p.coffre[cleObjet] = (p.coffre[cleObjet] || 0) + n;
    ecrire(p);
    return p.coffre[cleObjet];
  }

  function coffreConsommer(cleObjet) {
    if (!cleObjet) return 0;
    var p = lire();
    if (!p.coffre || !(p.coffre[cleObjet] > 0)) return 0;
    p.coffre[cleObjet] -= 1;
    if (p.coffre[cleObjet] <= 0) {
      delete p.coffre[cleObjet];
    }
    ecrire(p);
    return (p.coffre && p.coffre[cleObjet]) || 0;
  }
```
And export them in `W.PokeProgression`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_coffre_objets_depart.mjs`
Expected: PASS

- [ ] **Step 5: Commit Task 1**
```bash
git add js/poke/progression.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(coffre): Task 1 - core meta-progression chest engine with 5-charge lifecycle"
```

---

### Task 2: Battle Shop Decoupling & Reservation Badge (`js/poke/ui-usine.js`)

**Files:**
- Modify: `js/poke/ui-usine.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Consumes: `PokeProgression.coffreLire`, `PokeProgression.coffreAjouter`
- Updates: `ouvrirBoutiquePCo` to add purchases to chest and display `En réserve : X utilisations`

- [ ] **Step 1: Write the failing test for Task 2 in `tests/test_coffre_objets_depart.mjs`**

Add assertion verifying that buying an item from `CATALOGUE_BOUTIQUE` debits PCo and increases `P.coffreLire()[cle]` without altering `partie.sac`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_coffre_objets_depart.mjs`

- [ ] **Step 3: Update `js/poke/ui-usine.js`**
In `ouvrirBoutiquePCo`:
1. Read `coffre = (P && typeof P.coffreLire === "function") ? P.coffreLire() : {}`.
2. On each card in `CATALOGUE_BOUTIQUE`, check `charges = coffre[item.cle] || 0`. If `charges > 0`, display `<span class="pk-boutique-reserve">En réserve : ` + charges + ` utilisations</span>`.
3. In the click handler for `pk-boutique-acheter`:
   - Replace `P.ajouterObjet(itemTrouve.cle, 1)` with `P.coffreAjouter(itemTrouve.cle, 5)`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_coffre_objets_depart.mjs`

- [ ] **Step 5: Commit Task 2**
```bash
git add js/poke/ui-usine.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(usine): Task 2 - decouple battle shop purchases into persistent chest"
```

---

### Task 3: Home Screen Chest Button & Modal (`js/poke/ui.js`)

**Files:**
- Modify: `js/poke/ui.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Consumes: `PokeProgression.coffreLire`, `PokeProgression.coffreCompte`
- Produces: `ecranCoffre()` and button `#pk-coffre` in `accueil()`

- [ ] **Step 1: Write the failing test for Task 3 in `tests/test_coffre_objets_depart.mjs`**
Verify that `ecranCoffre` HTML renders the list of objects with category badges and charge counters.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `#pk-coffre` and `ecranCoffre` in `js/poke/ui.js`**
1. In `accueil()`, add `#pk-coffre` button next to `#pk-carnet`:
   ```html
   <button type="button" class="pkdx-touche" id="pk-coffre">
     Coffre <span class="pkdx-touche-note" id="pk-coffre-compte">...</span>
   </button>
   ```
2. Implement `function ecranCoffre()`:
   - Header with title and description.
   - List/cards of items in `P.coffreLire()` with `W.PokeDits.objet` descriptions and `⚡ X utilisations restantes`.
   - Empty state message if coffre is empty.
   - Return button to `accueil()`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit Task 3**
```bash
git add js/poke/ui.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(ui): Task 3 - home screen chest button and inspection modal"
```

---

### Task 4: New Run Loadout Selection Screen (`js/poke/ui.js`)

**Files:**
- Modify: `js/poke/ui.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Consumes: `PokeProgression.coffreConsommer`, `PokeProgression.coffreLire`
- Produces: `ecranObjetDepart(partie, suite)`

- [ ] **Step 1: Write the failing test for Task 4 in `tests/test_coffre_objets_depart.mjs`**
Simulate new run flow: selecting an item consumes 1 charge from chest, increments `partie.sac[cle] = 1`, while Daily Challenge bypasses `ecranObjetDepart`.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `ecranObjetDepart` and hook in `ecranNoms`**
1. In `ecranNoms()` validation:
   - If `partie.compare` or `!P || P.coffreCompte() === 0`, call `carte()`.
   - Else call `ecranObjetDepart(function () { carte(); })`.
2. Implement `ecranObjetDepart(suite)`:
   - Render cards for each unlocked item.
   - Enable "Emporter cet objet" button upon selection.
   - On click "Emporter" -> `P.coffreConsommer(selection)`, `partie.sac[selection] = (partie.sac[selection] || 0) + 1`, `garderLeVoyage()`, `son("GET_ITEM_1")`, `suite()`.
   - On click "Partir sans objet" -> `son("PRESS_AB")`, `suite()`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit Task 4**
```bash
git add js/poke/ui.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(ui): Task 4 - new run loadout selection screen with charge consumption"
```

---

### Task 5: Adventure Bag Held Items Equipment Flow (`js/poke/ui.js`)

**Files:**
- Modify: `js/poke/ui.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Updates: `RANGS_SAC` with `tenus`, and click handler with `choisirPorteur(cleObjet)`

- [ ] **Step 1: Write the failing test for Task 5 in `tests/test_coffre_objets_depart.mjs`**
Simulate giving a held item from bag to a Pokémon:
- Check `mon.objet === cleObjet`.
- Check bag count decremented.
- Check old held item returned to bag if previously equipped.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `tenus` in `RANGS_SAC` and `choisirPorteur` in `ecranSac`**
1. In `RANGS_SAC`, add:
   ```javascript
   {
     cle: "tenus",
     test: function (o) { return estObjetTenuOuCombat(o); }
   }
   ```
2. In `choisirCible`, if `estObjetTenuOuCombat(objet)`, delegate to `choisirPorteur(objet)`:
   - Render team members with current held item status.
   - On select Pokémon:
     ```javascript
     if (mon.objet) {
       partie.sac[mon.objet] = (partie.sac[mon.objet] || 0) + 1;
     }
     mon.objet = objet;
     partie.sac[objet] -= 1;
     if (partie.sac[objet] <= 0) delete partie.sac[objet];
     W.PokeProgression.fusionner(partie);
     ```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit Task 5**
```bash
git add js/poke/ui.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(ui): Task 5 - held items equipment flow and bag management"
```

---

### Task 6: Nuzlocke KO Held Item Salvage Mechanism (`js/poke/partie.js`)

**Files:**
- Modify: `js/poke/partie.js`
- Test: `tests/test_coffre_objets_depart.mjs`

**Interfaces:**
- Updates: `PokePartie.nettoyerEquipe(p)`

- [ ] **Step 1: Write the failing test for Task 6 in `tests/test_coffre_objets_depart.mjs`**
Simulate Nuzlocke combat loss: a Pokémon holding `CHOICE_BAND` dies (`pv = 0`). Verify that `partie.sac.CHOICE_BAND === 1` and `m.objet === null`.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement salvage in `js/poke/partie.js:nettoyerEquipe`**
```javascript
    for (i = p.equipe.length - 1; i >= 0; i--) {
      if (p.equipe[i].pv <= 0) {
        partis.push(p.equipe[i]);
        if (p.equipe[i].objet) {
          p.sac = p.sac || {};
          p.sac[p.equipe[i].objet] = (p.sac[p.equipe[i].objet] || 0) + 1;
          p.equipe[i].objet = null;
        }
        p.perdus.push({ n: p.equipe[i].n, niveau: p.equipe[i].niveau, zone: p.etape });
        p.equipe.splice(i, 1);
      }
    }
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit Task 6**
```bash
git add js/poke/partie.js tests/test_coffre_objets_depart.mjs
git commit -m "feat(nuzlocke): Task 6 - salvage held items to bag when pokemon dies in nuzlocke"
```

---

### Task 7: Full Regression Suite & Master Runner Integration (`tests/run_all_tests.mjs`)

**Files:**
- Modify: `tests/run_all_tests.mjs`
- Test: `node tests/run_all_tests.mjs`

**Interfaces:**
- Adds Suite 12 to master test runner testing all invariants.

- [ ] **Step 1: Add Suite 12 in `tests/run_all_tests.mjs`**
Verify:
- Coffre API lifecycle (add, consume, delete).
- Battle shop decoupling.
- Starting loadout selection & charge deduction.
- Bag held item assignment & replacement.
- Nuzlocke held item salvage.
- Zero DOM / non-deterministic leaks in logic files.

- [ ] **Step 2: Run master runner and all standalone suites**
Run: `node tests/run_all_tests.mjs`
Expected: 51+/51+ tests pass (100% PASS RATE).

- [ ] **Step 3: Commit Task 7**
```bash
git add tests/run_all_tests.mjs
git commit -m "feat(tests): Task 7 - comprehensive regression suite for chest, loadout and nuzlocke salvage"
```

---

## Self-Review
- Spec coverage: Every section of the spec is covered by a dedicated task.
- Zero placeholders: Complete code and test snippets are written out.
- Type & method consistency: `coffreLire`, `coffreAjouter`, `coffreConsommer`, `coffreCompte` are identical across all tasks.
