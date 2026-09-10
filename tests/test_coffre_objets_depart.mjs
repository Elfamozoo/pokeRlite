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

// ============================================================================
// Task 2: Découplage Boutique PCo & Badge "En réserve"
// ============================================================================

// Charger ui-usine.js dans le sandbox
loadScript("js/poke/ui-usine.js");
const UIUsine = sandbox.W.PokeUIUsine || sandbox.PokeUIUsine;
assert.ok(UIUsine, "PokeUIUsine exporté");
assert.ok(Array.isArray(UIUsine.CATALOGUE_BOUTIQUE), "CATALOGUE_BOUTIQUE exporté");

// Mock de conteneur DOM pour ouvrirBoutiquePCo
function createMockCible() {
  let _html = "";
  const cible = {
    buttons: [],
    get innerHTML() {
      return _html;
    },
    set innerHTML(val) {
      _html = val;
      cible.buttons = [];
      const regex = /<button[^>]*class="[^"]*pk-boutique-acheter[^"]*"[^>]*data-cle="([^"]+)"[^>]*>/g;
      let match;
      while ((match = regex.exec(val)) !== null) {
        const cle = match[1];
        const listeners = [];
        cible.buttons.push({
          cle,
          getAttribute: (attr) => (attr === "data-cle" ? cle : null),
          addEventListener: (evt, fn) => {
            if (evt === "click") listeners.push(fn);
          },
          click: () => {
            for (const fn of listeners) fn({ preventDefault: () => {} });
          }
        });
      }
    },
    querySelectorAll: (sel) => {
      if (sel === ".pk-boutique-acheter") return cible.buttons;
      return [];
    },
    querySelector: (sel) => null
  };
  return cible;
}

// Initialiser le solde PCo
P.ajouterPCo(100);
const soldeInitial = P.usineLire().pco;
assert.ok(soldeInitial >= 100, "Solde PCo initial suffisant");

// Initialiser le coffre vide pour le test
const coffreAvant = P.coffreLire();
assert.equal(coffreAvant.CHOICE_BAND, undefined, "CHOICE_BAND pas encore dans le coffre");

// Rendu initial de la boutique
const mockCible = createMockCible();
const htmlInitial = UIUsine.ouvrirBoutiquePCo({ cible: mockCible });
assert.ok(mockCible.innerHTML.includes("Bandeau Choix") || mockCible.innerHTML.includes("CHOICE_BAND"), "Boutique affiche Bandeau Choix");
assert.ok(!mockCible.innerHTML.includes("pk-boutique-reserve"), "Pas de badge En réserve initialement");

// Espionner P.depenserPCo, P.coffreAjouter, et P.ajouterObjet
let depenserPCoAppele = false;
let coffreAjouterAppele = false;
let ajouterObjetAppele = false;

const origDepenser = P.depenserPCo;
const origCoffreAjouter = P.coffreAjouter;
const origAjouterObjet = P.ajouterObjet;

P.depenserPCo = function (...args) {
  depenserPCoAppele = true;
  return origDepenser.apply(this, args);
};

P.coffreAjouter = function (...args) {
  coffreAjouterAppele = true;
  return origCoffreAjouter.apply(this, args);
};

P.ajouterObjet = function (...args) {
  ajouterObjetAppele = true;
  return origAjouterObjet.apply(this, args);
};

// Trouver le bouton pour CHOICE_BAND (prix = 64 PCo)
const btnChoiceBand = mockCible.buttons.find(b => b.cle === "CHOICE_BAND");
assert.ok(btnChoiceBand, "Bouton d'achat CHOICE_BAND trouvé");

// Déclencher le clic d'achat
btnChoiceBand.click();

// 1. P.depenserPCo(64) a bien été appelé
assert.equal(depenserPCoAppele, true, "P.depenserPCo doit être appelé");

// 2. P.coffreAjouter("CHOICE_BAND", 5) a été appelé et le coffre a été crédité de 5 charges
assert.equal(coffreAjouterAppele, true, "P.coffreAjouter doit être appelé lors d'un achat boutique");
assert.equal(P.coffreLire().CHOICE_BAND, 5, "Le coffre contient exactement 5 charges de CHOICE_BAND");

// 3. P.ajouterObjet n'a JAMAIS été appelé (découplage total avec le sac de run)
assert.equal(ajouterObjetAppele, false, "P.ajouterObjet ne doit PAS être appelé par la boutique");
const sac = P.sac ? P.sac() : (P.lire().sac || {});
assert.equal(sac.CHOICE_BAND || 0, 0, "partie.sac ne doit pas contenir CHOICE_BAND");

// 4. Le re-rendu de la boutique affiche le badge 'En réserve : 5 utilisations'
assert.ok(mockCible.innerHTML.includes('class="pk-boutique-reserve"'), "Le badge .pk-boutique-reserve doit être présent dans le HTML");
assert.ok(mockCible.innerHTML.includes("En réserve : 5 utilisations"), "Le badge doit afficher 'En réserve : 5 utilisations'");

// 5. Achat supplémentaire pour tester le cumul de charges
P.ajouterPCo(100);
const btnChoiceBand2 = mockCible.buttons.find(b => b.cle === "CHOICE_BAND");
assert.ok(btnChoiceBand2, "Bouton CHOICE_BAND retrouvé après re-rendu");
btnChoiceBand2.click();

assert.equal(P.coffreLire().CHOICE_BAND, 10, "10 charges cumulées après deuxième achat");
assert.ok(mockCible.innerHTML.includes("En réserve : 10 utilisations"), "Affiche 'En réserve : 10 utilisations'");

console.log("✓ Task 2: Tests unitaires du découplage Boutique PCo réussis !");
