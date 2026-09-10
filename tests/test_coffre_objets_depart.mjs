import assert from "node:assert/strict";
import fs from "node:fs";

let racineHTML = "";
const elementMap = {};

function getOrCreateElement(id, initialAttrs = {}) {
  if (!elementMap[id]) {
    const listeners = {};
    const classes = new Set(initialAttrs.classes || []);
    const attrs = Object.assign({}, initialAttrs);
    let _inner = attrs.innerHTML || "";
    elementMap[id] = {
      id,
      disabled: !!attrs.disabled,
      get innerHTML() { return _inner; },
      set innerHTML(v) { _inner = String(v); },
      get textContent() { return _inner; },
      set textContent(v) { _inner = String(v); },
      get classList() {
        return {
          add(c) { classes.add(c); },
          remove(c) { classes.delete(c); },
          contains(c) { return classes.has(c); }
        };
      },
      getAttribute(attr) {
        if (attr === "data-cle") return attrs["data-cle"] || null;
        if (attr === "id") return id;
        if (attr === "aria-pressed") return attrs["aria-pressed"] || null;
        return attrs[attr] || null;
      },
      setAttribute(attr, val) {
        attrs[attr] = String(val);
      },
      removeAttribute(attr) {
        delete attrs[attr];
      },
      addEventListener(evt, fn) {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      click() {
        if (listeners.click) {
          listeners.click.forEach(f => f({
            preventDefault() {},
            currentTarget: elementMap[id],
            target: elementMap[id]
          }));
        }
      }
    };
  }
  return elementMap[id];
}

const mockRacine = {
  get innerHTML() { return racineHTML; },
  set innerHTML(val) {
    racineHTML = val;
    for (const k in elementMap) delete elementMap[k];
    const tagRegex = /<([a-zA-Z0-9_-]+)\s+([^>]*?)>/g;
    let match;
    while ((match = tagRegex.exec(val)) !== null) {
      const rawAttrs = match[2];
      const idMatch = rawAttrs.match(/id="([^"]+)"/);
      const classMatch = rawAttrs.match(/class="([^"]+)"/);
      const cleMatch = rawAttrs.match(/data-cle="([^"]+)"/);
      const disabled = /\bdisabled\b/.test(rawAttrs);
      const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
      const id = idMatch ? idMatch[1] : (cleMatch ? "cle-" + cleMatch[1] : null);
      if (id) {
        getOrCreateElement(id, {
          classes,
          disabled,
          "data-cle": cleMatch ? cleMatch[1] : null
        });
      }
    }
  },
  classList: { add() {}, remove() {}, contains() { return false; } },
  querySelector(sel) {
    const m = sel.match(/^#([a-zA-Z0-9_-]+)$/);
    if (m) {
      const id = m[1];
      if (!racineHTML.includes('id="' + id + '"')) return null;
      return getOrCreateElement(id);
    }
    if (sel.startsWith(".")) {
      const cls = sel.slice(1);
      for (const k in elementMap) {
        if (elementMap[k].classList.contains(cls)) return elementMap[k];
      }
    }
    if (sel.includes("[data-cle=")) {
      const mCle = sel.match(/\[data-cle="([^"]+)"\]/);
      if (mCle) {
        for (const k in elementMap) {
          if (elementMap[k].getAttribute("data-cle") === mCle[1]) return elementMap[k];
        }
      }
    }
    return null;
  },
  querySelectorAll(sel) {
    if (sel.startsWith(".")) {
      const cls = sel.slice(1);
      return Object.values(elementMap).filter(el => el.classList.contains(cls));
    }
    if (sel === "[data-cle]" || sel.includes("data-cle")) {
      return Object.values(elementMap).filter(el => el.getAttribute("data-cle") != null);
    }
    if (sel.startsWith("#")) {
      const id = sel.slice(1);
      return elementMap[id] ? [elementMap[id]] : [];
    }
    return [];
  }
};

// Isolated NOYAU loader
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  location: { href: "", search: "", pathname: "", hash: "" },
  history: { replaceState() {} },
  localStorage: (() => {
    let store = {};
    return {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; }
    };
  })(),
  document: {
    getElementById: (id) => id === "poke-racine" ? mockRacine : null,
    querySelector: (s) => mockRacine.querySelector(s),
    querySelectorAll: (s) => mockRacine.querySelectorAll(s)
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.W = sandbox;
sandbox.D = sandbox.document;

function loadScript(path) {
  const code = fs.readFileSync(path, "utf8");
  const fn = new Function("window", "globalThis", "localStorage", "W", "document", "D", code);
  fn.call(sandbox, sandbox, sandbox, sandbox.localStorage, sandbox, sandbox.document, sandbox.document);
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

// ============================================================================
// Task 3: Écran du Coffre à l'Accueil & Modale d'inspection (js/poke/ui.js)
// ============================================================================

loadScript("js/poke/regles.js");
loadScript("js/poke/depart.js");
loadScript("js/poke/icones.js");
loadScript("js/poke/genre.js");
loadScript("js/poke/dits-objets.js");
loadScript("js/poke/gen3/objets.js");
loadScript("js/poke/ui.js");

const UI = sandbox.W.PokeUI || sandbox.PokeUI;
assert.ok(UI, "PokeUI exporté");

// 1. Traductions présentes
assert.equal(typeof UI.T("coffreTitre"), "string", "Traduction coffreTitre présente");
assert.equal(typeof UI.T("coffreDit"), "string", "Traduction coffreDit présente");
assert.equal(typeof UI.T("coffreVide"), "string", "Traduction coffreVide présente");
assert.equal(typeof UI.T("coffreCharges", { n: 5 }), "string", "Traduction coffreCharges présente");
assert.ok(UI.T("coffreCharges", { n: 5 }).includes("5"), "coffreCharges interpole le nombre de charges");

// 2. Bouton #pk-coffre dans accueil() avec compte (N) quand le coffre contient des objets
assert.ok(P.coffreCompte() > 0, "Le coffre contient au moins 1 objet (CHOICE_BAND: 10 charges)");
sandbox.PokeDemarrer(); // charge l'accueil
assert.ok(mockRacine.innerHTML.includes('id="pk-coffre"'), "accueil() doit contenir le bouton #pk-coffre");
const btnCoffre = mockRacine.querySelector("#pk-coffre");
assert.ok(btnCoffre, "Bouton #pk-coffre trouvé");
assert.ok(
  mockRacine.innerHTML.includes("pk-coffre-compte") || mockRacine.innerHTML.includes("(1)"),
  "Affiche le compteur d'objets (1)"
);

// 3. Clic sur #pk-coffre ouvre ecranCoffre()
btnCoffre.click();
assert.ok(mockRacine.innerHTML.includes("pk-coffre"), "ecranCoffre() doit s'afficher après clic sur #pk-coffre");
assert.ok(
  mockRacine.innerHTML.includes("Bandeau Choix") || mockRacine.innerHTML.includes("CHOICE_BAND"),
  "ecranCoffre affiche le nom de l'objet (Bandeau Choix)"
);
assert.ok(mockRacine.innerHTML.includes("10"), "ecranCoffre affiche 10 charges pour CHOICE_BAND");
assert.ok(mockRacine.innerHTML.includes("⚡"), "Badge d'utilisations restantes avec éclair ⚡");
const btnRetourCoffre = mockRacine.querySelector("#pk-coffre-retour");
assert.ok(btnRetourCoffre, "Bouton #pk-coffre-retour présent dans ecranCoffre");

// 4. Bouton retour ramène à l'accueil
btnRetourCoffre.click();
assert.ok(mockRacine.querySelector("#pk-coffre"), "Bouton retour ramène à l'accueil");

// 5. État vide quand le coffre ne contient aucun objet
const pData = P.lire();
pData.coffre = {};
P.ecrire(pData);
assert.equal(P.coffreCompte(), 0, "Coffre maintenant vidé");

// Re-rendu de l'accueil
sandbox.PokeDemarrer();
assert.ok(mockRacine.innerHTML.includes('id="pk-coffre"'), "#pk-coffre toujours présent quand coffre vide");
assert.ok(
  !mockRacine.innerHTML.includes("pk-coffre-compte") && !mockRacine.innerHTML.includes("(0)"),
  "Pas de badge de compte (0) quand coffre vide"
);

// Clic pour ouvrir le coffre vide
const btnCoffreVide = mockRacine.querySelector("#pk-coffre");
btnCoffreVide.click();
assert.ok(
  mockRacine.innerHTML.includes(UI.T("coffreVide")),
  "Affiche le message d'état vide amical (coffreVide)"
);
assert.ok(mockRacine.querySelector("#pk-coffre-retour"), "Bouton retour présent sur écran vide");

console.log("✓ Task 3: Tests unitaires de l'écran du Coffre réussis !");

// ============================================================================
// Task 4: Écran de sélection d'objet de départ & consommation de charges
// ============================================================================

// 1. Nouvelles traductions
assert.equal(typeof UI.T("objetDepartTitre"), "string", "Traduction objetDepartTitre présente");
assert.equal(typeof UI.T("objetDepartDit"), "string", "Traduction objetDepartDit présente");
assert.ok(UI.T("emporterObjet", { nom: "Bandeau Choix" }).includes("Bandeau Choix"), "Traduction emporterObjet interpole le nom");
assert.equal(typeof UI.T("partirSansObjet"), "string", "Traduction partirSansObjet présente");

// 2. Export des méthodes requises
assert.equal(typeof UI.ecranObjetDepart, "function", "UI.ecranObjetDepart exporté");
assert.equal(typeof UI.versCarteOuObjetDepart, "function", "UI.versCarteOuObjetDepart exporté");

// 3. Bypass si partie.compare === true (Défi du jour)
P.coffreAjouter("CHOICE_BAND", 5);
assert.ok(P.coffreCompte() > 0, "Coffre non-vide pour tester le bypass");

let suiteAppelee = false;
const suiteMock = () => { suiteAppelee = true; };

// Simuler une partie défi
UI.definirPartie({ compare: true, sac: {}, regle: "voyage" });
suiteAppelee = false;
UI.versCarteOuObjetDepart(suiteMock);
assert.equal(suiteAppelee, true, "Le défi du jour doit immédiatement appeler suite() / carte()");
assert.ok(!mockRacine.innerHTML.includes("pkdx-ecran-objet-depart"), "L'écran d'objet de départ ne doit pas être rendu au Défi du jour");

// 4. Bypass si le coffre est vide sur une partie normale
const pDataVide = P.lire();
pDataVide.coffre = {};
P.ecrire(pDataVide);
assert.equal(P.coffreCompte(), 0, "Coffre vidé");

UI.definirPartie({ compare: false, sac: {}, regle: "voyage" });
suiteAppelee = false;
UI.versCarteOuObjetDepart(suiteMock);
assert.equal(suiteAppelee, true, "Coffre vide doit immédiatement appeler suite() / carte()");
assert.ok(!mockRacine.innerHTML.includes("pkdx-ecran-objet-depart"), "L'écran ne doit pas être affiché si coffre vide");

// 5. Rendu de l'écran d'objet de départ quand le coffre est non-vide
P.coffreAjouter("CHOICE_BAND", 5);
P.coffreAjouter("LEFTOVERS", 3);
assert.equal(P.coffreCompte(), 2, "Coffre garni de 2 objets");

suiteAppelee = false;
UI.versCarteOuObjetDepart(suiteMock);
assert.equal(suiteAppelee, false, "suite() ne doit pas être appelée immédiatement quand coffre non-vide");
assert.ok(
  mockRacine.innerHTML.includes("pkdx-ecran-objet-depart") || mockRacine.innerHTML.includes(UI.T("objetDepartTitre")),
  "Écran d'objet de départ affiché"
);
assert.ok(
  mockRacine.innerHTML.includes("Bandeau Choix") || mockRacine.innerHTML.includes("CHOICE_BAND"),
  "Affiche Bandeau Choix"
);
assert.ok(
  mockRacine.innerHTML.includes("Restes") || mockRacine.innerHTML.includes("LEFTOVERS"),
  "Affiche Restes"
);

const btnEmporter = mockRacine.querySelector("#pk-objet-depart-ok");
assert.ok(btnEmporter, "Bouton #pk-objet-depart-ok présent");
assert.equal(btnEmporter.disabled, true, "Bouton Emporter désactivé tant qu'aucun objet n'est sélectionné");

const btnSans = mockRacine.querySelector("#pk-objet-depart-sans");
assert.ok(btnSans, "Bouton #pk-objet-depart-sans présent");

// 6. Protection contre clic sur bouton désactivé
suiteAppelee = false;
btnEmporter.click();
assert.equal(suiteAppelee, false, "Le clic sur le bouton Emporter désactivé ne doit rien déclencher");
assert.equal(P.coffreLire().CHOICE_BAND, 5, "Aucune charge consommée lors d'un clic prématuré");

// Espionner les effets sonores
const sonsJoues = [];
sandbox.W.PokeSon = {
  jouer: (nom) => { sonsJoues.push(nom); },
  muet: () => false,
  volume: () => 1
};

// Sélection d'un objet et clic sur Emporter
const carteChoice = mockRacine.querySelector("#pk-objet-depart-CHOICE_BAND");
assert.ok(carteChoice, "Carte CHOICE_BAND trouvée");
carteChoice.click();

assert.ok(sonsJoues.includes("PRESS_AB"), "PRESS_AB joué lors de la sélection d'objet");
assert.equal(btnEmporter.disabled, false, "Bouton Emporter activé après sélection");
assert.ok(
  btnEmporter.innerHTML.includes("Bandeau Choix") || btnEmporter.innerHTML.includes("CHOICE_BAND"),
  "Bouton Emporter affiche le nom de l'objet sélectionné"
);

btnEmporter.click();
assert.equal(suiteAppelee, true, "suite() appelée après clic Emporter");
assert.ok(sonsJoues.includes("GET_ITEM_1"), "GET_ITEM_1 joué lors du choix de l'objet de départ");
assert.equal(P.coffreLire().CHOICE_BAND, 4, "1 charge de CHOICE_BAND consommée dans le coffre");
const partieCourante = UI.partieCourante ? UI.partieCourante() : P.lire();
const sacCourant = UI.partieCourante ? UI.partieCourante().sac : (P.sac ? P.sac() : {});
assert.equal(sacCourant.CHOICE_BAND, 1, "1 exemplaire de CHOICE_BAND ajouté au sac de la partie");

// 7. Partir sans objet ne consomme aucune charge
suiteAppelee = false;
UI.versCarteOuObjetDepart(suiteMock);
const btnSans2 = mockRacine.querySelector("#pk-objet-depart-sans");
assert.ok(btnSans2, "Bouton #pk-objet-depart-sans présent au re-rendu");
btnSans2.click();
assert.equal(suiteAppelee, true, "suite() appelée après clic Partir sans objet");
assert.equal(P.coffreLire().CHOICE_BAND, 4, "Charges de CHOICE_BAND inchangées (4)");
assert.equal(P.coffreLire().LEFTOVERS, 3, "Charges de LEFTOVERS inchangées (3)");

// 8. Intégration du flux de départ : choixCompagnon dirige vers l'écran d'objet de départ si le coffre est non-vide
UI.definirPartie({ compare: false, sac: {}, regle: "voyage", starter: 1, equipe: [{ n: 1, niveau: 5 }] });
assert.ok(P.coffreCompte() > 0, "Coffre non-vide pour le test d'intégration");
UI.mesurerCompagnon();
assert.ok(
  mockRacine.innerHTML.includes("pkdx-ecran-objet-depart") || mockRacine.innerHTML.includes(UI.T("objetDepartTitre")),
  "choixCompagnon (sans compagnon dispo) mène à l'écran d'objet de départ"
);

console.log("✓ Task 4: Tests unitaires de l'écran d'objet de départ réussis !");


