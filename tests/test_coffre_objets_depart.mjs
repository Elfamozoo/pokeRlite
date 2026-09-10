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
sandbox.W = sandbox;

function loadScript(path) {
  const code = fs.readFileSync(path, "utf8");
  const fn = new Function("window", "globalThis", "localStorage", "W", code);
  fn.call(sandbox, sandbox, sandbox, sandbox.localStorage, sandbox);
}

loadScript("js/poke/rng.js");
loadScript("js/poke/progression.js");

const P = sandbox.W.PokeProgression || sandbox.PokeProgression;
assert.ok(P, "PokeProgression exported");

// Test 1: Coffre API initial state
assert.deepEqual(P.coffreLire(), {}, "Coffre initialement vide");
assert.equal(P.coffreCompte(), 0, "Coffre compte 0");

// Test 2: Adding items & cumulative charges
const c1 = P.coffreAjouter("CHOICE_BAND", 5);
assert.equal(c1, 5, "Ajout de 5 charges Choice Band");
assert.equal(P.coffreCompte(), 1, "Compte 1 objet");
assert.equal(P.coffreLire().CHOICE_BAND, 5, "5 charges stockées");

const c2 = P.coffreAjouter("CHOICE_BAND", 5);
assert.equal(c2, 10, "Cumul à 10 charges");

// Default charges parameter (5)
const cDefault = P.coffreAjouter("LEFTOVERS");
assert.equal(cDefault, 5, "Ajout sans paramètre de charges donne 5 charges par défaut");
assert.equal(P.coffreCompte(), 2, "Coffre compte 2 objets");
assert.equal(P.coffreLire().LEFTOVERS, 5, "5 charges Leftovers");

// Test 3: Consuming charges
const rem1 = P.coffreConsommer("CHOICE_BAND");
assert.equal(rem1, 9, "9 charges restantes après consommation");

// Consommer 9 fois supplémentaires (total 10 consommations pour CHOICE_BAND)
for (let i = 0; i < 9; i++) {
  P.coffreConsommer("CHOICE_BAND");
}
assert.equal(P.coffreLire().CHOICE_BAND, undefined, "Clé supprimée après épuisement");
assert.equal(P.coffreCompte(), 1, "Coffre contient 1 objet restant (LEFTOVERS)");
assert.equal(P.coffreLire().LEFTOVERS, 5, "LEFTOVERS toujours intact à 5 charges");

// Consommer objet inexistant
const remInexistant = P.coffreConsommer("OBJET_INEXISTANT");
assert.equal(remInexistant, 0, "Consommation d'un objet inexistant retourne 0");

// Consommer le reste des Leftovers
for (let i = 0; i < 5; i++) {
  P.coffreConsommer("LEFTOVERS");
}
assert.equal(P.coffreLire().LEFTOVERS, undefined, "LEFTOVERS supprimé après épuisement");
assert.equal(P.coffreCompte(), 0, "Coffre vide après épuisement");

// Edge cases: clés null/undefined/vides
assert.equal(P.coffreAjouter(null), 0, "coffreAjouter(null) renvoie 0");
assert.equal(P.coffreAjouter(""), 0, "coffreAjouter('') renvoie 0");
assert.equal(P.coffreConsommer(null), 0, "coffreConsommer(null) renvoie 0");
assert.equal(P.coffreConsommer(""), 0, "coffreConsommer('') renvoie 0");

console.log("✓ Task 1: Tests unitaires du moteur de Coffre réussis !");
