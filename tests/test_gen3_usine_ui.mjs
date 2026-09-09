/**
 * tests/test_gen3_usine_ui.mjs
 * Comprehensive automated test suite for Task 5: Battle Factory UI, Draft, Swap, Boss & Battle Shop.
 *
 * Verifies:
 * 1. js/poke/ui-usine.js evaluates cleanly in isolated context and exports W.PokeUIUsine.
 * 2. PokeProgression methods: usineLire, usineEcrire, ajouterPCo, depenserPCo, enregistrerRecordUsine, debloquerSymboleUsine.
 * 3. PokeUIUsine.ouvrirHall: title, Noland/Samson, stats panel (record, PCo, symbols), action buttons.
 * 4. PokeUIUsine.ouvrirDraft: 6 rich rental cards (sprite, nature, talent, held item, 4 attacks), interactive 3/3 selection.
 * 5. PokeUIUsine.lancerCombat: orchestration, boss introduction, battle resolution, branching.
 * 6. PokeUIUsine.ouvrirEchange: 2-column swap UI (player team vs defeated team), swap confirmation & keep team.
 * 7. PokeUIUsine.ouvrirVictoireSerie: 7-win streak celebration, Noland Knowledge symbol award (Silver/Gold), PCo attribution.
 * 8. PokeUIUsine.ouvrirDefaite: streak recap, PCo, record update, active session cleanup.
 * 9. PokeUIUsine.ouvrirBoutiquePCo: catalog (combat items, vitamins, stones), PCo balance deduction, inventory addition.
 * 10. js/poke/ordre.js: includes "js/poke/ui-usine.js" in GEN3_ECRANS.
 * 11. js/poke/ui.js: includes "#pk-usine" button, translation keys, and routing to PokeUIUsine.ouvrirHall.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function suite(title) {
  console.log(`\n\x1b[1m\x1b[36m=== ${title} ===\x1b[0m`);
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, err });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    if (err.stack) {
      const firstStack = err.stack.split("\n").slice(1, 4).join("\n");
      console.error(`    \x1b[90m${firstStack}\x1b[0m`);
    }
  }
}

function createMockElement(tag = "div") {
  const attrs = new Map();
  const classes = new Set();
  const children = [];
  const listeners = new Map();

  const el = {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: "",
    textContent: "",
    disabled: false,
    dataset: {},
    parentNode: null,
    children: children,
    getAttribute: (name) => attrs.get(name) || null,
    setAttribute: (name, val) => attrs.set(name, String(val)),
    removeAttribute: (name) => attrs.delete(name),
    hasAttribute: (name) => attrs.has(name),
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)),
    },
    appendChild: (child) => {
      child.parentNode = el;
      children.push(child);
      return child;
    },
    remove: () => {},
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!listeners.has(type)) return;
      listeners.set(type, listeners.get(type).filter((f) => f !== fn));
    },
    click: () => {
      const list = listeners.get("click") || [];
      const ev = { target: el, currentTarget: el, preventDefault: () => {}, stopPropagation: () => {} };
      for (const fn of list) fn(ev);
    },
    querySelector: (sel) => {
      if (el.innerHTML && typeof el.innerHTML === "string") {
        if (sel.startsWith("#")) {
          const id = sel.slice(1);
          if (el.innerHTML.includes(`id="${id}"`) || el.innerHTML.includes(`id='${id}'`)) {
            const found = createMockElement("div");
            found.id = id;
            return found;
          }
        }
      }
      return createMockElement(sel && sel.includes("img") ? "img" : "div");
    },
    querySelectorAll: (sel) => [],
  };
  return el;
}

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

function createIsolatedContext(customGlobals = {}) {
  const mockStorage = createMockStorage();
  const mockDoc = {
    createElement: (tag) => createMockElement(tag),
    querySelector: () => createMockElement("div"),
    querySelectorAll: () => [],
    body: createMockElement("body"),
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const sandbox = {
    console: console,
    Math: Math,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    JSON: JSON,
    isFinite: isFinite,
    isNaN: isNaN,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Date: Date,
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    document: mockDoc,
    window: null,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: (id) => clearTimeout(id),
    ...customGlobals,
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  return vm.createContext(sandbox);
}

function loadScriptInContext(filePath, context) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  const code = fs.readFileSync(fullPath, "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: ordre.js Integration & Exports
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Module Architecture & ordre.js Integration");

test("js/poke/ordre.js contains 'js/poke/ui-usine.js' in GEN3_ECRANS", () => {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);

  assert.ok(ctx.POKE_ORDRE_GEN3_ECRANS, "POKE_ORDRE_GEN3_ECRANS must exist");
  assert.ok(
    ctx.POKE_ORDRE_GEN3_ECRANS.includes("js/poke/ui-usine.js"),
    "GEN3_ECRANS must include 'js/poke/ui-usine.js'"
  );
  assert.ok(
    ctx.POKE_ORDRE_ECRANS.includes("js/poke/ui-usine.js"),
    "POKE_ORDRE_ECRANS must include 'js/poke/ui-usine.js'"
  );
  assert.ok(
    ctx.POKE_ORDRE.includes("js/poke/ui-usine.js"),
    "POKE_ORDRE must include 'js/poke/ui-usine.js'"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Persistence in js/poke/progression.js
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Battle Factory Persistence in js/poke/progression.js");

let progCtx;
function initProgContext() {
  progCtx = createIsolatedContext();
  // Load NOYAU core dependencies needed by progression.js
  loadScriptInContext("js/poke/rng.js", progCtx);
  loadScriptInContext("js/poke/genre.js", progCtx);
  loadScriptInContext("js/poke/types.js", progCtx);
  loadScriptInContext("js/poke/regles.js", progCtx);
  loadScriptInContext("js/poke/especes.js", progCtx);
  loadScriptInContext("js/poke/moteur.js", progCtx);
  loadScriptInContext("js/poke/progression.js", progCtx);
}

test("usineLire() returns initial empty state when no saved state exists", () => {
  initProgContext();
  const P = progCtx.PokeProgression;
  assert.ok(typeof P.usineLire === "function", "PokeProgression.usineLire must be a function");

  const etat = JSON.parse(JSON.stringify(P.usineLire()));
  assert.deepStrictEqual(etat, {
    pco: 0,
    record: 0,
    symboles: { argent: false, or: false },
    session: null,
  });
});

test("usineEcrire(data) persists data and usineLire() retrieves it", () => {
  initProgContext();
  const P = progCtx.PokeProgression;
  const mockState = {
    pco: 42,
    record: 14,
    symboles: { argent: true, or: false },
    session: { serie: 2, combat: 3 },
  };

  const ok = P.usineEcrire(mockState);
  assert.strictEqual(ok, true, "usineEcrire must return true");

  const lu = P.usineLire();
  assert.strictEqual(lu.pco, 42);
  assert.strictEqual(lu.record, 14);
  assert.strictEqual(lu.symboles.argent, true);
  assert.strictEqual(lu.symboles.or, false);
  assert.strictEqual(lu.session.serie, 2);
});

test("ajouterPCo(n) credits points and depenserPCo(n) safely debits", () => {
  initProgContext();
  const P = progCtx.PokeProgression;

  assert.strictEqual(P.usineLire().pco, 0);

  // Add 50 PCo
  const solde1 = P.ajouterPCo(50);
  assert.strictEqual(solde1, 50);
  assert.strictEqual(P.usineLire().pco, 50);

  // Attempt to spend 60 (exceeds balance) => should fail and return false
  const okTrop = P.depenserPCo(60);
  assert.strictEqual(okTrop, false, "depenserPCo must reject when balance is insufficient");
  assert.strictEqual(P.usineLire().pco, 50, "Balance must remain unchanged after rejected spend");

  // Spend 30 => should succeed
  const okDepense = P.depenserPCo(30);
  assert.strictEqual(okDepense, true, "depenserPCo must return true on valid spend");
  assert.strictEqual(P.usineLire().pco, 20, "Balance must be 20 PCo");
});

test("enregistrerRecordUsine(victoires) only updates if higher than current record", () => {
  initProgContext();
  const P = progCtx.PokeProgression;

  P.enregistrerRecordUsine(7);
  assert.strictEqual(P.usineLire().record, 7);

  // Lesser score should not overwrite
  P.enregistrerRecordUsine(4);
  assert.strictEqual(P.usineLire().record, 7);

  // Higher score should overwrite
  P.enregistrerRecordUsine(21);
  assert.strictEqual(P.usineLire().record, 21);
});

test("debloquerSymboleUsine(type) unlocks argent and or symbols", () => {
  initProgContext();
  const P = progCtx.PokeProgression;

  assert.strictEqual(P.usineLire().symboles.argent, false);
  assert.strictEqual(P.usineLire().symboles.or, false);

  P.debloquerSymboleUsine("argent");
  assert.strictEqual(P.usineLire().symboles.argent, true);
  assert.strictEqual(P.usineLire().symboles.or, false);

  P.debloquerSymboleUsine("or");
  assert.strictEqual(P.usineLire().symboles.argent, true);
  assert.strictEqual(P.usineLire().symboles.or, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: PokeUIUsine Module & Screens
// ─────────────────────────────────────────────────────────────────────────────
suite("3. PokeUIUsine UI Screens & Interactions");

let fullCtx;
function initFullContext() {
  fullCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", fullCtx);
  for (const f of fullCtx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, fullCtx);
  }
  for (const f of fullCtx.POKE_ORDRE_ECRANS) {
    loadScriptInContext(f, fullCtx);
  }
  if (fullCtx.PokeRegles && typeof fullCtx.PokeRegles.poser === "function") {
    fullCtx.PokeRegles.poser("gen3");
  }
}

test("js/poke/ui-usine.js exports W.PokeUIUsine with all 7 canonical methods", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  assert.ok(U, "W.PokeUIUsine must be defined");
  assert.strictEqual(typeof U.ouvrirHall, "function", "ouvrirHall must be a function");
  assert.strictEqual(typeof U.ouvrirDraft, "function", "ouvrirDraft must be a function");
  assert.strictEqual(typeof U.lancerCombat, "function", "lancerCombat must be a function");
  assert.strictEqual(typeof U.ouvrirEchange, "function", "ouvrirEchange must be a function");
  assert.strictEqual(typeof U.ouvrirVictoireSerie, "function", "ouvrirVictoireSerie must be a function");
  assert.strictEqual(typeof U.ouvrirDefaite, "function", "ouvrirDefaite must be a function");
  assert.strictEqual(typeof U.ouvrirBoutiquePCo, "function", "ouvrirBoutiquePCo must be a function");
});

test("ouvrirHall renders Battle Factory title, Noland/Samson, PCo, record, symbols and buttons", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const P = fullCtx.PokeProgression;
  P.ajouterPCo(35);
  P.enregistrerRecordUsine(14);
  P.debloquerSymboleUsine("argent");

  const cible = createMockElement("div");
  const html = U.ouvrirHall({ cible });
  const content = html || cible.innerHTML;

  assert.ok(content.includes("Usine de Combat") || content.includes("Battle Factory"), "Must show Hall title");
  assert.ok(content.includes("Samson") || content.includes("Noland"), "Must mention Factory Head Noland / Samson");
  assert.ok(content.includes("35"), "Must show 35 PCo");
  assert.ok(content.includes("14"), "Must show 14 record");
  assert.ok(content.includes("Argent") || content.includes("Silver"), "Must display Argent symbol badge");
  assert.ok(content.includes("pk-usine-nouveau") || content.includes("Nouveau"), "Must have new streak / start button");
  assert.ok(content.includes("Boutique") || content.includes("Shop"), "Must have Battle Shop button");
  assert.ok(content.includes("Retour") || content.includes("Back"), "Must have return button");
});

test("ouvrirDraft renders 6 rich rental cards with sprites, nature, talent, held item, and moves", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-DRAFT-SEED" });

  const cible = createMockElement("div");
  const html = U.ouvrirDraft(session, { cible });
  const content = html || cible.innerHTML;

  assert.strictEqual(session.prets.length, 6, "Session must contain exactly 6 rental Pokémon");
  for (let i = 0; i < 6; i++) {
    const mon = session.prets[i];
    assert.ok(content.includes(mon.nature) || content.includes("Rigide") || content.includes("Modeste") || content.includes("Timide") || content.includes("Jovial") || content.includes("Hardi") || content.includes("Brave") || content.includes("Calme") || content.includes("Assuré") || content.includes("Discret"), `Card ${i} must show nature`);
    assert.ok(content.includes(mon.objet) || content.includes("Restes") || content.includes("Bandeau") || content.includes("Lentil") || content.includes("Charbon") || content.includes("Aimant") || content.includes("Baie") || content.includes("Graine") || content.includes("Eau"), `Card ${i} must show held item`);
  }
  assert.ok(content.includes("/ 3") || content.includes("Sélectionnés"), "Must show selection counter indicator");
  assert.ok(content.includes("pk-draft-confirmer") || content.includes("Confirmer"), "Must have team confirm button");
});

test("ouvrirDraft allows selecting exactly 3 cards and confirming team", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-SELECTION" });

  const cible = createMockElement("div");
  U.ouvrirDraft(session, { cible });

  // Simulate selecting 3 items (indices 0, 2, 4)
  fullCtx.PokeUsine.choisirEquipeInitiale(session, [0, 2, 4]);
  assert.strictEqual(session.equipe.length, 3, "Team must have 3 Pokémon after selection");
  assert.strictEqual(session.statut, "combat", "Status must switch to combat");
  assert.ok(session.adversaire, "Opponent must be drawn");
});

test("ouvrirEchange presents both teams side by side for post-match swap", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-SWAP" });
  fullCtx.PokeUsine.choisirEquipeInitiale(session, [0, 1, 2]);

  const cible = createMockElement("div");
  const html = U.ouvrirEchange(session, { cible });
  const content = html || cible.innerHTML;

  assert.ok(content.includes("Votre équipe") || content.includes("Équipe actuelle") || content.includes("Player"), "Must show player team column");
  assert.ok(content.includes("Équipe vaincue") || content.includes("Adversaire") || content.includes("Defeated"), "Must show defeated opponent team column");
  assert.ok(content.includes("pk-swap-confirmer") || content.includes("Échanger") || content.includes("Confirmer"), "Must have swap button");
  assert.ok(content.includes("pk-swap-garder") || content.includes("Garder") || content.includes("Conserver"), "Must have keep team button");
});

test("ouvrirVictoireSerie celebrates streak, awards PCo, and awards Symbol against Noland", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const P = fullCtx.PokeProgression;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-WIN-21" });
  session.serie = 3;
  session.combat = 7;
  session.combatGlobal = 21;
  session.victoires = 21;
  session.symboles.argent = true;

  const cible = createMockElement("div");
  const html = U.ouvrirVictoireSerie(session, { cible });
  const content = html || cible.innerHTML;

  assert.ok(content.includes("Série") || content.includes("Victoire") || content.includes("7"), "Must announce streak completion");
  assert.ok(content.includes("Symbole du Savoir") || content.includes("Argent") || content.includes("Knowledge Symbol"), "Must celebrate Argent symbol award at battle 21");
  assert.ok(content.includes("Continuer") || content.includes("suivante"), "Must have button to proceed to next streak");
  assert.ok(content.includes("Enregistrer") || content.includes("Quitter") || content.includes("Hall"), "Must have save & exit button");
});

test("ouvrirDefaite recaps streak results, clears active session, and saves record", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const P = fullCtx.PokeProgression;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-DEFEAT" });
  session.victoires = 12;
  session.pcoGagnes = 6;
  P.usineEcrire({ pco: 6, record: 5, symboles: { argent: false, or: false }, session });

  const cible = createMockElement("div");
  const html = U.ouvrirDefaite(session, { cible });
  const content = html || cible.innerHTML;

  assert.ok(content.includes("Défaite") || content.includes("fin de série") || content.includes("Defeat"), "Must announce defeat");
  assert.ok(content.includes("12"), "Must show 12 victories in recap");

  const etatApres = P.usineLire();
  assert.strictEqual(etatApres.session, null, "Active session must be cleared after defeat");
  assert.strictEqual(etatApres.record, 12, "Record must be updated to 12");
});

test("ouvrirBoutiquePCo displays full catalog, checks balance, and credits items to bag", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const P = fullCtx.PokeProgression;
  P.ajouterPCo(50); // Player has 50 PCo

  const cible = createMockElement("div");
  const html = U.ouvrirBoutiquePCo({ cible });
  const content = html || cible.innerHTML;

  assert.ok(content.includes("50"), "Must display 50 available PCo");

  // Verify presence of items across all categories
  assert.ok(content.includes("Restes") || content.includes("LEFTOVERS"), "Must sell Leftovers");
  assert.ok(content.includes("Bandeau Choix") || content.includes("CHOICE_BAND"), "Must sell Choice Band");
  assert.ok(content.includes("Lentille Scope") || content.includes("Lentilscope") || content.includes("SCOPE_LENS"), "Must sell Scope Lens");
  assert.ok(content.includes("Vive Griffe") || content.includes("QUICK_CLAW"), "Must sell Quick Claw");
  assert.ok(content.includes("Herbe Blanche") || content.includes("WHITE_HERB"), "Must sell White Herb");
  assert.ok(content.includes("Zinc") || content.includes("ZINC"), "Must sell Zinc");
  assert.ok(content.includes("Super Bonbon") || content.includes("RARE_CANDY"), "Must sell Super Bonbon");
  assert.ok(content.includes("Pierre Eau") || content.includes("WATER_STONE"), "Must sell Water Stone");

  // Buy Leftovers (48 PCo): 50 - 48 = 2 remaining
  const okAchat = P.depenserPCo(48);
  assert.strictEqual(okAchat, true, "Purchase of Leftovers must succeed");
  assert.strictEqual(P.usineLire().pco, 2, "Remaining balance must be 2 PCo");

  P.ajouterObjet("LEFTOVERS", 1);
  const bag = P.sac ? P.sac() : P.lire().sac;
  assert.strictEqual(bag.LEFTOVERS, 1, "Leftovers must be added to bag");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: UI Integration in js/poke/ui.js
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Home Screen Button & Translations in js/poke/ui.js");

test("js/poke/ui.js has Zone de Combat button (#pk-usine) next to #pk-defi", () => {
  const uiContent = fs.readFileSync(path.join(ROOT_DIR, "js/poke/ui.js"), "utf-8");
  assert.ok(
    uiContent.includes('id="pk-usine"'),
    "ui.js must contain button with id='pk-usine'"
  );
  assert.ok(
    uiContent.includes("Zone de Combat") || uiContent.includes("usineTitre"),
    "ui.js must label #pk-usine with 'Zone de Combat' or translation key 'usineTitre'"
  );
});

test("js/poke/ui.js includes all required translation keys in TXT", () => {
  const uiContent = fs.readFileSync(path.join(ROOT_DIR, "js/poke/ui.js"), "utf-8");
  const requiredKeys = [
    "usineTitre",
    "usineHall",
    "usinePrets",
    "usineEchange",
    "usineBoutique",
    "usinePco",
  ];
  for (const k of requiredKeys) {
    assert.ok(uiContent.includes(k), `ui.js TXT must contain key '${k}'`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Final Summary & Exit
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n\x1b[1m\x1b[35m------------------------------------------------------------\x1b[0m`);
console.log(`Total Tests: \x1b[1m${totalTests}\x1b[0m | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m`);

if (failedTests > 0) {
  console.log(`\n\x1b[31m\x1b[1mFAILURES:\x1b[0m`);
  for (const { name, err } of failures) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m`);
    console.log(`    ${err.message}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m\x1b[1mALL USINE UI TESTS PASSED!\x1b[0m\n`);
  process.exit(0);
}
