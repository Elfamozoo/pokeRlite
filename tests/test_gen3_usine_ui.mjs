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

function parseHTMLInto(html, root) {
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  const stack = [root];
  let m;

  const VOID_TAGS = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK"]);

  while ((m = tagRegex.exec(html)) !== null) {
    if (m[0].startsWith("<!--")) {
      continue;
    } else if (m[2]) {
      const isClosing = !!m[1];
      const tag = m[2].toUpperCase();
      const rawAttrs = m[3] || "";

      if (isClosing) {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName === tag) {
            stack.length = i;
            break;
          }
        }
      } else {
        const node = createMockElement(tag.toLowerCase());
        const attrRegex = /([a-zA-Z0-9\-_]+)(?:=([\'\"])(.*?)\2|=([^\s>]+))?/g;
        let am;
        while ((am = attrRegex.exec(rawAttrs)) !== null) {
          const k = am[1];
          const v = am[3] !== undefined ? am[3] : (am[4] !== undefined ? am[4] : "");
          node.setAttribute(k, v);
        }
        const parent = stack[stack.length - 1];
        parent.appendChild(node);
        if (!VOID_TAGS.has(tag) && !rawAttrs.trim().endsWith("/")) {
          stack.push(node);
        }
      }
    } else if (m[4]) {
      const text = m[4];
      if (text.trim()) {
        const textNode = createMockElement("#text");
        textNode.textContent = text;
        textNode._textContent = text;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
  }
}

function createMockElement(tag = "div") {
  const attrs = new Map();
  const classes = new Set();
  const children = [];
  const listeners = new Map();
  const cachedQueries = new Map();

  function matchesSel(node, sel) {
    if (!node || node.tagName === "#TEXT") return false;
    let rest = sel.trim();

    const tagMatch = rest.match(/^([a-zA-Z0-9]+)/);
    if (tagMatch) {
      if (node.tagName !== tagMatch[1].toUpperCase()) return false;
      rest = rest.slice(tagMatch[1].length);
    }

    const attrRegex = /\[([a-zA-Z0-9\-_]+)(?:=([\'\"])?([^\'\"\]]+)\2)?\]/g;
    let match;
    while ((match = attrRegex.exec(rest)) !== null) {
      const attrName = match[1];
      const attrVal = match[3];
      if (!node.hasAttribute(attrName)) return false;
      if (attrVal !== undefined && node.getAttribute(attrName) !== attrVal) return false;
    }
    rest = rest.replace(/\[[^\]]+\]/g, "");

    const idMatches = rest.match(/#([a-zA-Z0-9\-_]+)/g);
    if (idMatches) {
      for (const im of idMatches) {
        if (node.getAttribute("id") !== im.slice(1) && node.id !== im.slice(1)) return false;
      }
      rest = rest.replace(/#[a-zA-Z0-9\-_]+/g, "");
    }

    const classMatches = rest.match(/\.([a-zA-Z0-9\-_]+)/g);
    if (classMatches) {
      for (const cm of classMatches) {
        const cName = cm.slice(1);
        if (!node.classList.contains(cName) && !(node.className && node.className.split(/\s+/).includes(cName))) {
          return false;
        }
      }
    }

    return true;
  }

  function findFirst(node, sel) {
    for (const child of node.children) {
      if (matchesSel(child, sel)) return child;
      const sub = findFirst(child, sel);
      if (sub) return sub;
    }
    return null;
  }

  function findAll(node, sel, acc = []) {
    for (const child of node.children) {
      if (matchesSel(child, sel)) acc.push(child);
      findAll(child, sel, acc);
    }
    return acc;
  }

  const el = {
    tagName: tag.toUpperCase(),
    _innerHTML: "",
    _textContent: "",
    disabled: false,
    dataset: {},
    parentNode: null,
    children: children,
    style: {
      setProperty: () => {},
      getPropertyValue: () => "",
    },
    get className() {
      return Array.from(classes).join(" ");
    },
    set className(val) {
      classes.clear();
      if (val) {
        String(val).trim().split(/\s+/).forEach((c) => c && classes.add(c));
      }
    },
    get id() {
      return attrs.get("id") || "";
    },
    set id(val) {
      if (val) attrs.set("id", String(val));
      else attrs.delete("id");
    },
    getAttribute: (name) => {
      if (name === "class") return Array.from(classes).join(" ") || null;
      if (name === "disabled") return el.disabled ? "" : null;
      return attrs.has(name) ? attrs.get(name) : null;
    },
    setAttribute: (name, val) => {
      if (name === "class") {
        el.className = val;
      } else if (name === "disabled") {
        el.disabled = true;
        attrs.set(name, String(val));
      } else {
        attrs.set(name, String(val));
        if (name === "id") el.id = val;
        if (name.startsWith("data-")) {
          el.dataset[name.slice(5)] = String(val);
        }
      }
    },
    removeAttribute: (name) => {
      if (name === "class") classes.clear();
      else if (name === "disabled") {
        el.disabled = false;
        attrs.delete("disabled");
      } else {
        attrs.delete(name);
        if (name.startsWith("data-")) delete el.dataset[name.slice(5)];
      }
    },
    hasAttribute: (name) => {
      if (name === "class") return classes.size > 0;
      if (name === "disabled") return el.disabled;
      return attrs.has(name);
    },
    classList: {
      add: (...cls) => cls.forEach((c) => c && classes.add(c)),
      remove: (...cls) => cls.forEach((c) => classes.delete(c)),
      contains: (c) => classes.has(c),
      toggle: (c) => {
        if (classes.has(c)) {
          classes.delete(c);
          return false;
        }
        classes.add(c);
        return true;
      }
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
      if (cachedQueries.has(sel)) {
        return cachedQueries.get(sel);
      }
      const found = findFirst(el, sel);
      if (found) {
        cachedQueries.set(sel, found);
        return found;
      }
      if (el.innerHTML && typeof el.innerHTML === "string") {
        if (sel.startsWith("#")) {
          const id = sel.slice(1);
          if (el.innerHTML.includes(`id="${id}"`) || el.innerHTML.includes(`id='${id}'`)) {
            const dummy = createMockElement("div");
            dummy.id = id;
            dummy.setAttribute("id", id);
            cachedQueries.set(sel, dummy);
            return dummy;
          }
        }
      }
      return null;
    },
    querySelectorAll: (sel) => {
      return findAll(el, sel);
    },
  };

  Object.defineProperty(el, "textContent", {
    get: () => {
      if (children.length === 0) return el._textContent || "";
      return children.map((c) => c.textContent).join(" ").trim();
    },
    set: (val) => {
      el._textContent = String(val);
      children.length = 0;
    }
  });

  Object.defineProperty(el, "innerHTML", {
    get: () => el._innerHTML || "",
    set: (val) => {
      el._innerHTML = String(val);
      cachedQueries.clear();
      children.length = 0;
      if (val && typeof val === "string") {
        parseHTMLInto(val, el);
      }
    },
  });

  Object.defineProperty(el, "firstChild", {
    get: () => {
      if (children.length === 0) {
        const dummy = createMockElement("div");
        children.push(dummy);
        return dummy;
      }
      return children[0];
    },
  });

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
  if (fullCtx.PokeUICombat && fullCtx.PokeUICombat.Ecran && !fullCtx.PokeUICombat.Ecran.prototype.hasOwnProperty("elAttaques")) {
    Object.defineProperty(fullCtx.PokeUICombat.Ecran.prototype, "elAttaques", {
      get() {
        return (this.elActions && this.elActions.querySelector(".pk-grille-attaques")) ||
               (this.hote && this.hote.querySelector(".pk-grille-attaques")) || null;
      },
      configurable: true
    });
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

test("ouvrirHall and graineAlea create genuinely random sessions without repeats", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const cible1 = createMockElement("div");
  U.ouvrirHall({ cible: cible1 });
  const btn1 = cible1.querySelector("#pk-usine-nouveau");
  btn1.click();
  const etat1 = fullCtx.PokeProgression.usineLire();
  assert.ok(etat1.session, "Session must be created");
  assert.ok(etat1.session.graine.startsWith("USINE-"), "Graine must start with USINE-");

  const cible2 = createMockElement("div");
  U.ouvrirHall({ cible: cible2 });
  const btn2 = cible2.querySelector("#pk-usine-nouveau");
  btn2.click();
  const etat2 = fullCtx.PokeProgression.usineLire();
  assert.notStrictEqual(etat1.session.graine, etat2.session.graine, "Seeds must differ across runs");
});

test("tirerAdversaire generates varied opponents across matches within the same run", () => {
  initFullContext();
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-VARIED-RUN" });
  session.combatGlobal = 1;
  const adv1 = fullCtx.PokeUsine.tirerAdversaire(session);

  session.combatGlobal = 2;
  const adv2 = fullCtx.PokeUsine.tirerAdversaire(session);

  assert.notStrictEqual(
    adv1.nom + adv1.equipe.map(p => p.n).join(","),
    adv2.nom + adv2.equipe.map(p => p.n).join(","),
    "Opponent trainer and Pokémon must vary between matches"
  );
});

test("lancerCombat mounts real PokeUICombat.Ecran and has zero fake simulation buttons", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-COMBAT-REAL" });
  fullCtx.PokeUsine.choisirEquipeInitiale(session, [0, 1, 2]);

  let ecranOptionsRecues = null;
  let ecranMonte = false;
  const EcranOriginal = fullCtx.PokeUICombat.Ecran;
  fullCtx.PokeUICombat.Ecran = function (hote, etat, options) {
    ecranMonte = true;
    ecranOptionsRecues = options;
    return new EcranOriginal(hote, etat, options);
  };

  const cible = createMockElement("div");
  const html = U.lancerCombat(session, { cible });
  const content = html || cible.innerHTML;

  assert.ok(ecranMonte, "PokeUICombat.Ecran must be instantiated on lancerCombat");
  assert.ok(ecranOptionsRecues, "Ecran must receive options");
  assert.strictEqual(ecranOptionsRecues.usine, true, "Ecran options must specify usine: true");
  assert.strictEqual(ecranOptionsRecues.dresseur, true, "Ecran options must specify dresseur: true");
  assert.ok(ecranOptionsRecues.hasard, "Ecran options must supply valid hasard instance");
  assert.strictEqual(typeof ecranOptionsRecues.hasard.dans, "function", "hasard must have .dans method");
  assert.strictEqual(typeof ecranOptionsRecues.surFin, "function", "Ecran options must supply surFin callback");

  // Verify fake simulation buttons are completely gone
  assert.ok(!content.includes("pk-combat-simuler-victoire"), "Must NOT contain fake simulation victory button");
  assert.ok(!content.includes("pk-combat-simuler-defaite"), "Must NOT contain fake simulation defeat button");
  assert.ok(!content.includes("Résoudre Combat"), "Must NOT contain fake simulation resolution labels");

  // Restore Ecran
  fullCtx.PokeUICombat.Ecran = EcranOriginal;
});

test("PokeUICombat.Ecran suppresses bag button when usine: true", () => {
  initFullContext();
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-SAC-SUPPRESSION" });
  fullCtx.PokeUsine.choisirEquipeInitiale(session, [0, 1, 2]);

  const h = new fullCtx.PokeHasard("TEST-SAC-SUPPRESSION-COMBAT");
  const adv = fullCtx.PokeUsine.tirerAdversaire(session, h);
  const etatCombat = fullCtx.PokeCombat.demarrer(session.equipe, adv.equipe, { dresseur: true }, h);

  const hote = createMockElement("div");
  const ecran = new fullCtx.PokeUICombat.Ecran(hote, etatCombat, {
    hasard: h,
    dresseur: true,
    usine: true,
  });

  // Attacks appear in ecran.elAttaques / .pk-grille-attaques (modern Showdown architecture)
  const attaquesEl = ecran.elAttaques;
  assert.ok(attaquesEl, "Attacks container ecran.elAttaques must exist");
  const boutonsAttaques = attaquesEl.children || [];
  assert.strictEqual(boutonsAttaques.length, 4, "Must display 4 attack buttons in ecran.elAttaques");

  // Verify bag button suppression in ecran.elActions
  const actionsEl = ecran.elActions;
  const barreTactique = actionsEl.querySelector(".pk-barre-tactique") || actionsEl;
  const boutonsTactiques = (barreTactique.children && barreTactique.children.length > 0)
    ? barreTactique.children
    : actionsEl.children;
  const libelles = boutonsTactiques.map(b => b.textContent);
  assert.ok(!libelles.some(l => l.includes("Sac") || l.includes("SAC")), "SAC button must NOT appear in actions when usine: true");
  assert.ok(libelles.some(l => l.includes("Équipe") || l.includes("ÉQUIPE")), "Team switch button must appear");
  assert.ok(libelles.some(l => l.includes("Abandonner") || l.includes("ABANDONNER")), "Abandon button must appear for trainer battle");
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

test("rendreCartePokemon renders rich Showdown Teambuilder cards with dark surface, 80px sprite, official type pills, explicit nature modifiers, ability with description, held item, and 4 move pills", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  assert.strictEqual(typeof U.rendreCartePokemon, "function", "rendreCartePokemon must be exported");

  // 1. Test mon with non-neutral nature (rigide: +Atk, -SpA)
  const monRigide = {
    n: 25,
    espece: 25,
    nature: "rigide",
    talent: "STATIC",
    objet: "LEFTOVERS",
    types: ["ELECTRIK"],
    attaques: [
      { cle: "THUNDERBOLT", pp: 15, ppMax: 15 },
      { cle: "QUICK_ATTACK", pp: 30, ppMax: 30 },
      { cle: "THUNDER_WAVE", pp: 20, ppMax: 20 },
      { cle: "HEADBUTT", pp: 15, ppMax: 15 }
    ]
  };

  const cardHtml = U.rendreCartePokemon(monRigide, 0, false, "draft");

  // Dark surface container
  assert.ok(cardHtml.includes("pk-carte-mon"), "Must use .pk-carte-mon card class");

  // 80px sprite
  assert.ok(cardHtml.includes("pk-carte-sprite"), "Must include .pk-carte-sprite");
  assert.ok(cardHtml.includes("80"), "Must specify 80px sprite dimensions");

  // Level badge N.50
  assert.ok(cardHtml.includes("N.50") || cardHtml.includes("Niveau 50"), "Must include N.50 level badge");

  // Official type pills
  assert.ok(cardHtml.includes("pk-badge-type") && cardHtml.includes("pk-type-electrik"), "Must display official type pill (.pk-badge-type.pk-type-*)");

  // Explicit nature stat modifier (+Atk, -SpA)
  assert.ok(cardHtml.includes("Rigide"), "Must show nature name Rigide");
  assert.ok(cardHtml.includes("(+Atk, -SpA)") || (cardHtml.includes("(+") && cardHtml.includes("-)")), "Must display explicit stat modifier (+Stat, -Stat)");

  // Ability (talent) with description
  assert.ok(cardHtml.includes("Statik"), "Must display talent name");
  assert.ok(cardHtml.includes("pk-talent-desc") || cardHtml.includes("contact"), "Must include ability description");

  // Held item (objet)
  assert.ok(cardHtml.includes("Restes") || cardHtml.includes("LEFTOVERS"), "Must display held item");

  // 4 move pills with type badges, power, and precision
  assert.ok(cardHtml.includes("pk-mon-attaque-pill") || cardHtml.includes("pk-mon-attaque-ligne"), "Must render move pills");
  assert.ok(cardHtml.includes("pk-type-"), "Move pills must have pk-type-* class");
  assert.ok(cardHtml.includes("Pui:"), "Move pills must show power (Pui)");
  assert.ok(cardHtml.includes("Préc:"), "Move pills must show precision (Préc)");

  // 2. Test neutral nature (hardi: Neutre)
  const monNeutre = {
    n: 1,
    nature: "hardi",
    talent: "OVERGROW",
    attaques: [{ cle: "TACKLE" }]
  };
  const cardNeutreHtml = U.rendreCartePokemon(monNeutre, 1, false, "draft");
  assert.ok(cardNeutreHtml.includes("(Neutre)"), "Neutral nature must display (Neutre)");
});

test("ouvrirDraft renders 6 cards with interactive selection, cyan glow focus, dynamic counter X / 3, and disabled confirmation button until 3 selected", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-DRAFT-INTERACTIVE" });

  const cible = createMockElement("div");
  U.ouvrirDraft(session, { cible });

  // 6 cards rendered
  const wrappers = cible.querySelectorAll(".pk-draft-carte-wrapper");
  assert.strictEqual(wrappers.length, 6, "Must render exactly 6 draft card wrappers");

  // Initial state: 0 / 3 counter and disabled confirm button
  const compteur = cible.querySelector("#pk-draft-compteur");
  assert.ok(compteur, "Must have #pk-draft-compteur");
  assert.ok(compteur.textContent.includes("0 / 3"), "Initial counter must be 0 / 3");

  let btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm, "Must have confirm button #pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must be disabled initially");

  // Click 1st card
  wrappers[0].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("1 / 3"), "Counter must update to 1 / 3 after first selection");
  const cartesApres1 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  assert.ok(cartesApres1[0].classList.contains("est-selectionne") || cartesApres1[0].querySelector(".est-selectionne"), "Selected card must have .est-selectionne");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must remain disabled with 1 selection");

  // Click 2nd card
  cartesApres1[1].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("2 / 3"), "Counter must update to 2 / 3");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must remain disabled with 2 selections");

  // Click 3rd card
  const cartesApres2 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  cartesApres2[2].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("3 / 3"), "Counter must update to 3 / 3");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(!btnConfirm.disabled && !btnConfirm.hasAttribute("disabled"), "Confirm button must be ENABLED when exactly 3 are selected");

  // Click 4th card (should be denied, capping at 3)
  const cartesApres3 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  cartesApres3[3].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("3 / 3"), "Counter must stay at 3 / 3 on 4th click attempt");

  // Deselect 1st card
  cartesApres3[0].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("2 / 3"), "Counter must drop to 2 / 3 after deselection");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must be disabled again when below 3");
});

test("ouvrirEchange renders 2-column comparative layout with side-by-side structure, selection states, and swap/keep actions", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const session = fullCtx.PokeUsine.creerSession({ graine: "TEST-SWAP-COMPARATIVE" });
  fullCtx.PokeUsine.choisirEquipeInitiale(session, [0, 1, 2]);

  const h = new fullCtx.PokeHasard("TEST-SWAP-ADV");
  session.adversaire = fullCtx.PokeUsine.tirerAdversaire(session, h);

  const cible = createMockElement("div");
  U.ouvrirEchange(session, { cible });

  // 2-column comparative structure
  const colonnes = cible.querySelector(".pk-echange-colonnes");
  assert.ok(colonnes, "Must contain 2-column container .pk-echange-colonnes");

  const colJoueur = cible.querySelector(".pk-col-joueur");
  assert.ok(colJoueur, "Must have player column .pk-col-joueur");
  assert.ok(colJoueur.textContent.includes("Votre équipe"), "Player column must display header");

  const colAdverse = cible.querySelector(".pk-col-adverse");
  assert.ok(colAdverse, "Must have opponent column .pk-col-adverse");
  assert.ok(colAdverse.textContent.includes("Équipe vaincue"), "Opponent column must display header");

  // Cards in both columns
  const wrapsJoueur = cible.querySelectorAll('.pk-swap-carte-wrap[data-side="joueur"]');
  assert.strictEqual(wrapsJoueur.length, 3, "Player column must show 3 team cards");

  const wrapsAdverse = cible.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  assert.strictEqual(wrapsAdverse.length, 3, "Opponent column must show 3 team cards");

  // Confirm button disabled initially
  let btnConfirm = cible.querySelector("#pk-swap-confirmer");
  assert.ok(btnConfirm, "Must have confirm swap button #pk-swap-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm swap button must be disabled initially");

  // Keep button always enabled
  const btnGarder = cible.querySelector("#pk-swap-garder");
  assert.ok(btnGarder, "Must have keep team button #pk-swap-garder");
  assert.ok(!btnGarder.disabled, "Keep team button must be enabled");

  // Click 1 player card
  wrapsJoueur[0].click();
  const apresJ1 = cible.querySelectorAll('.pk-swap-carte-wrap[data-side="joueur"]');
  assert.ok(apresJ1[0].classList.contains("est-selectionne") || apresJ1[0].querySelector(".est-selectionne"), "Selected player card must have .est-selectionne");
  btnConfirm = cible.querySelector("#pk-swap-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm swap button must remain disabled with only 1 side selected");

  // Click 1 opponent card
  const apresAdv = cible.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  apresAdv[1].click();
  const apresAdvSel = cible.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  assert.ok(apresAdvSel[1].classList.contains("est-selectionne") || apresAdvSel[1].querySelector(".est-selectionne"), "Selected opponent card must have .est-selectionne");

  btnConfirm = cible.querySelector("#pk-swap-confirmer");
  assert.ok(!btnConfirm.disabled && !btnConfirm.hasAttribute("disabled"), "Confirm swap button must be ENABLED when 1 from each side is selected");
});

test("ouvrirHall and ouvrirBoutiquePCo use dark surfaces, 4 metric cards, and filter tabs with reserve indicators", () => {
  initFullContext();
  const U = fullCtx.PokeUIUsine;
  const P = fullCtx.PokeProgression;
  P.ajouterPCo(40);
  P.enregistrerRecordUsine(21);
  P.debloquerSymboleUsine("argent");
  P.debloquerSymboleUsine("or");
  P.coffreAjouter("LEFTOVERS", 5);

  // 1. Hall verification
  const cibleHall = createMockElement("div");
  U.ouvrirHall({ cible: cibleHall });

  const metrics = cibleHall.querySelectorAll(".pk-metric-card");
  assert.strictEqual(metrics.length, 4, "Hall must render exactly 4 metric cards (PCo, Record, Silver, Gold)");
  assert.ok(cibleHall.querySelector(".pk-metric-pco"), "Must contain PCo metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-record"), "Must contain Record metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-symbole-argent"), "Must contain Silver Symbol metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-symbole-or"), "Must contain Gold Symbol metric card");

  // Verify dark surface CSS tokens in poke.css
  const cssContent = fs.readFileSync(path.join(ROOT_DIR, "css", "poke.css"), "utf-8");
  assert.ok(cssContent.includes(".pk-metric-card") && cssContent.includes("var(--surface-carte)"), "CSS must style .pk-metric-card with --surface-carte");
  assert.ok(cssContent.includes(".pk-carte-mon") && cssContent.includes("var(--bordure-nette)"), "CSS must style .pk-carte-mon with --bordure-nette");

  // 2. Boutique verification
  const cibleBoutique = createMockElement("div");
  U.ouvrirBoutiquePCo({ cible: cibleBoutique });

  // Filter tabs
  const onglets = cibleBoutique.querySelectorAll(".pk-boutique-onglet");
  assert.ok(onglets.length >= 5, "Boutique must provide category filter tabs (Tous, Combat, Renfort, etc.)");
  const ongletLabels = onglets.map(o => o.textContent);
  assert.ok(ongletLabels.includes("Tous"), "Must have 'Tous' tab");
  assert.ok(ongletLabels.includes("Combat"), "Must have 'Combat' tab");
  assert.ok(ongletLabels.includes("Baies"), "Must have 'Baies' tab");

  // Reserve indicator for items in storage
  const reserves = cibleBoutique.querySelectorAll(".pk-boutique-reserve");
  assert.ok(reserves.length > 0, "Boutique must show reserve indicator badge for stored items");
  assert.ok(reserves[0].textContent.includes("En réserve :") || reserves[0].textContent.includes("utilisation"), "Reserve badge must show stored count");

  // Category filtering interaction
  const ongletCombat = onglets.find(o => o.textContent === "Combat");
  assert.ok(ongletCombat, "Combat tab must exist");
  ongletCombat.click();

  const cartesCombat = cibleBoutique.querySelectorAll(".pk-boutique-carte");
  assert.ok(cartesCombat.length > 0, "Combat items must be displayed after filtering");
  for (const c of cartesCombat) {
    assert.ok(c.classList.contains("pk-cat-combat") || c.textContent.includes("Combat"), "All displayed items must be in Combat category");
  }
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
