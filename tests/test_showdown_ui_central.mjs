import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("\x1b[1m\x1b[36m=== Test Suite: Showdown Central UI (Accueil, Carte, Sac, Coffre & Pokédex) ===\x1b[0m\n");

// --- Minimal Robust Mock DOM Tree with HTML parser ---
class MockNode {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = new Map();
    this.classes = new Set();
    this._textContent = "";
    this.disabled = false;
    this.listeners = new Map();
    this.dataset = {};
    this.scrollTop = 0;
    this.scrollHeight = 100;

    const styleProps = new Map();
    this.style = new Proxy({}, {
      get: (target, prop) => {
        if (prop === "setProperty") {
          return (k, v) => styleProps.set(k, String(v));
        }
        if (prop === "getPropertyValue") {
          return (k) => styleProps.get(k) || "";
        }
        return styleProps.get(prop) || "";
      },
      set: (target, prop, val) => {
        styleProps.set(prop, String(val));
        return true;
      }
    });
  }

  get id() {
    return this.getAttribute("id") || "";
  }

  set id(val) {
    if (val) this.setAttribute("id", val);
    else this.removeAttribute("id");
  }

  get className() {
    return Array.from(this.classes).join(" ");
  }

  set className(val) {
    this.classes.clear();
    if (val) {
      String(val).trim().split(/\s+/).forEach((c) => c && this.classes.add(c));
    }
  }

  get classList() {
    return {
      add: (...cls) => cls.forEach((c) => c && this.classes.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classes.delete(c)),
      contains: (c) => this.classes.has(c),
      toggle: (c) => {
        if (this.classes.has(c)) {
          this.classes.delete(c);
          return false;
        }
        this.classes.add(c);
        return true;
      }
    };
  }

  getAttribute(name) {
    if (name === "class") return this.className || null;
    if (name === "disabled") return this.disabled ? "" : null;
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, val) {
    if (name === "class") {
      this.className = val;
    } else if (name === "disabled") {
      this.disabled = true;
      this.attrs.set(name, String(val));
    } else {
      this.attrs.set(name, String(val));
      if (name.startsWith("data-")) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        this.dataset[key] = String(val);
      }
    }
  }

  removeAttribute(name) {
    if (name === "class") {
      this.classes.clear();
    } else if (name === "disabled") {
      this.disabled = false;
      this.attrs.delete(name);
    } else {
      this.attrs.delete(name);
      if (name.startsWith("data-")) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        delete this.dataset[key];
      }
    }
  }

  hasAttribute(name) {
    if (name === "class") return this.classes.size > 0;
    if (name === "disabled") return this.disabled;
    return this.attrs.has(name);
  }

  appendChild(child) {
    if (typeof child === "string") {
      const textNode = new MockNode("#text");
      textNode.textContent = child;
      child = textNode;
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter((f) => f !== fn));
  }

  click() {
    const list = this.listeners.get("click") || [];
    const ev = { target: this, currentTarget: this, preventDefault: () => {}, stopPropagation: () => {} };
    for (const fn of list) fn(ev);
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get textContent() {
    if (this.tagName === "#TEXT") return this._textContent;
    if (this.children.length === 0) return this._textContent;
    return this.children.map((c) => c.textContent).join(" ");
  }

  set textContent(val) {
    this.children.length = 0;
    this._textContent = String(val);
  }

  get innerHTML() {
    return serializeHTML(this);
  }

  set innerHTML(val) {
    this.children.length = 0;
    this._textContent = "";
    if (val) {
      parseHTMLInto(val, this);
    }
  }

  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    const parts = sel.trim().split(/\s+/);
    if (parts.length === 1) {
      queryAllDirect(this, parts[0], results);
    } else {
      let currentSet = [this];
      for (const part of parts) {
        const nextSet = [];
        for (const node of currentSet) {
          queryAllDirect(node, part, nextSet);
        }
        currentSet = nextSet;
      }
      return currentSet;
    }
    return results;
  }
}

function matchesSelector(el, sel) {
  if (!el || el.tagName === "#TEXT") return false;
  let rest = sel.trim();

  // ID match #id
  const idMatch = rest.match(/^#([a-zA-Z0-9\-_]+)/);
  if (idMatch) {
    if (el.getAttribute("id") !== idMatch[1]) return false;
    rest = rest.slice(idMatch[0].length);
  }

  // Tag match
  const tagMatch = rest.match(/^([a-zA-Z0-9]+)/);
  if (tagMatch) {
    if (el.tagName !== tagMatch[1].toUpperCase()) return false;
    rest = rest.slice(tagMatch[1].length);
  }

  // Attribute match [attr="val"] or [attr]
  const attrRegex = /\[([a-zA-Z0-9\-_]+)(?:=([\'\"])?([^\'\"\]]+)\2)?\]/g;
  let match;
  while ((match = attrRegex.exec(rest)) !== null) {
    const attrName = match[1];
    const attrVal = match[3];
    if (!el.hasAttribute(attrName)) return false;
    if (attrVal !== undefined && el.getAttribute(attrName) !== attrVal) return false;
  }
  rest = rest.replace(/\[[^\]]+\]/g, "");

  // Class matches .c1.c2
  const classMatches = rest.match(/\.([a-zA-Z0-9\-_]+)/g);
  if (classMatches) {
    for (const cm of classMatches) {
      if (!el.classList.contains(cm.slice(1))) return false;
    }
  }

  return true;
}

function queryAllDirect(root, sel, results) {
  for (const child of root.children) {
    if (matchesSelector(child, sel)) {
      results.push(child);
    }
    queryAllDirect(child, sel, results);
  }
}

function serializeHTML(el) {
  if (el.tagName === "#TEXT") return el._textContent;
  let out = "";
  for (const child of el.children) {
    if (child.tagName === "#TEXT") {
      out += child._textContent;
    } else {
      const tag = child.tagName.toLowerCase();
      out += `<${tag}`;
      if (child.className) out += ` class="${child.className}"`;
      for (const [k, v] of child.attrs) {
        if (k !== "class") out += ` ${k}="${v}"`;
      }
      out += `>${serializeHTML(child)}</${tag}>`;
    }
  }
  return out;
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
        const node = new MockNode(tag);
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
        const textNode = new MockNode("#text");
        textNode._textContent = text;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
  }
}

function createIsolatedContext(customGlobals = {}) {
  const rootNode = new MockNode("div");
  rootNode.setAttribute("id", "poke-racine");

  let store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };

  const mockDoc = {
    createElement: (tag) => new MockNode(tag),
    createTextNode: (text) => {
      const n = new MockNode("#text");
      n._textContent = text;
      return n;
    },
    getElementById: (id) => (id === "poke-racine" ? rootNode : rootNode.querySelector("#" + id)),
    querySelector: (sel) => (sel === "#poke-racine" ? rootNode : rootNode.querySelector(sel)),
    querySelectorAll: (sel) => (sel === "#poke-racine" ? [rootNode] : rootNode.querySelectorAll(sel)),
    body: rootNode,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const ctx = {
    console,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    TypeError,
    RangeError,
    Map,
    Set,
    JSON,
    localStorage: mockLocalStorage,
    location: { href: "", search: "", pathname: "", hash: "" },
    history: { replaceState() {} },
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve([]) }),
    document: mockDoc,
    window: null,
    setTimeout: () => 1,
    clearTimeout: () => {},
    ...customGlobals,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.W = ctx;
  ctx.D = ctx.document;
  ctx.POKE_TEST = true;
  vm.createContext(ctx);
  return { ctx, rootNode };
}

function loadScriptInContext(relPath, context) {
  const fullPath = path.join(ROOT_DIR, relPath);
  const code = fs.readFileSync(fullPath, "utf-8");
  vm.runInContext(code, context, { filename: fullPath });
}

function setupEnvironment() {
  const { ctx, rootNode } = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);
  for (const f of ctx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, ctx);
  }
  for (const f of ctx.POKE_ORDRE_GEN3) {
    loadScriptInContext(f, ctx);
  }
  loadScriptInContext("js/poke/tempo.js", ctx);
  loadScriptInContext("js/poke/icones.js", ctx);
  loadScriptInContext("js/poke/progression.js", ctx);
  loadScriptInContext("js/poke/dits-objets.js", ctx);
  loadScriptInContext("js/poke/pokedex-ui.js", ctx);
  loadScriptInContext("js/poke/ui-usine.js", ctx);
  loadScriptInContext("js/poke/ui.js", ctx);

  return { ctx, rootNode };
}

let total = 0;
let passed = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home Lobby (accueil) Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\x1b[1m\x1b[33m--- Suite 1: Home Lobby (accueil) ---\x1b[0m");

runTest("accueil() renders dark lobby banner (.pk-lobby-banner or .pk-accueil-banner) with trainer profile stats", () => {
  const { ctx, rootNode } = setupEnvironment();
  const P = ctx.PokeProgression;
  P.ecrire({
    voyages: 12,
    badgesMax: 8,
    pris: { 1: 1, 4: 1, 7: 1, 25: 1 },
    vus: { 1: 1, 2: 1, 3: 1, 4: 1, 7: 1, 25: 1 }
  });

  ctx.PokeDemarrer();

  const banner = rootNode.querySelector(".pk-lobby-banner") || rootNode.querySelector(".pk-accueil-banner");
  assert.ok(banner, "Lobby must render trainer banner (.pk-lobby-banner or .pk-accueil-banner)");

  const stats = rootNode.querySelector(".pk-accueil-stats") || rootNode.querySelector(".pkdx-compte-releve");
  assert.ok(stats, "Lobby banner must render profile stats container");
  const statsText = stats.textContent;
  assert.match(statsText, /12/, "Stats must display 12 runs/voyages");
  assert.match(statsText, /8\s*\/\s*8/, "Stats must display 8 / 8 badges");
  assert.match(statsText, /4\s*\/\s*(?:151|386)/, "Stats must display dex collected count");
});

runTest("accueil() renders prominent mode cards (.pk-modes-grille or .pk-accueil-modes) with Kanto, Usine, Défi and Duel", () => {
  const { ctx, rootNode } = setupEnvironment();
  ctx.PokeDemarrer();

  const modeGrid = rootNode.querySelector(".pk-modes-grille") || rootNode.querySelector(".pk-accueil-modes");
  assert.ok(modeGrid, "Lobby must render mode cards grid (.pk-modes-grille or .pk-accueil-modes)");

  const btnGo = rootNode.querySelector("#pk-go");
  assert.ok(btnGo, "Must render #pk-go (Kanto/adventure mode)");
  assert.ok(btnGo.classList.contains("pk-mode-carte") || btnGo.classList.contains("pkdx-touche"), "Mode card styling");

  const btnDefi = rootNode.querySelector("#pk-defi");
  assert.ok(btnDefi, "Must render #pk-defi (Daily challenge)");

  const btnUsine = rootNode.querySelector("#pk-usine");
  assert.ok(btnUsine, "Must render #pk-usine (Battle Factory)");

  const btnDuel = rootNode.querySelector("#pk-duel");
  assert.ok(btnDuel, "Must render #pk-duel (Master Duel)");
});

runTest("accueil() renders #pk-coffre with dynamic item count on dark surface", () => {
  const { ctx, rootNode } = setupEnvironment();
  const P = ctx.PokeProgression;
  P.coffreAjouter("CHOICE_BAND", 5);
  P.coffreAjouter("LEFTOVERS", 3);

  ctx.PokeDemarrer();

  const btnCoffre = rootNode.querySelector("#pk-coffre");
  assert.ok(btnCoffre, "Must render #pk-coffre button");
  const compte = rootNode.querySelector("#pk-coffre-compte");
  assert.ok(compte, "Must render #pk-coffre-compte");
  assert.match(compte.textContent, /2/, "Must show 2 distinct items in chest");
  assert.ok(btnCoffre.classList.contains("pk-surface-carte") || btnCoffre.classList.contains("pkdx-touche"),
    "#pk-coffre must have dark surface styling");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Tactical Roadmap (carte) Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\x1b[1m\x1b[33m--- Suite 2: Tactical Roadmap (carte) ---\x1b[0m");

runTest("carte() renders act header (.pk-carte-acte or .pkdx-acte-tete) and roadmap nodes (.pk-carte-noeud)", () => {
  const { ctx, rootNode } = setupEnvironment();
  const UI = ctx.PokeUI;

  const testPartie = {
    starter: 25,
    acte: 1,
    rangee: 0,
    regle: "voyage",
    equipe: [{ n: 25, niveau: 12, pv: 35, stats: { pv: 35 }, attaques: [] }],
    boite: [],
    sac: { POTION: 2 },
    cles: {},
    vus: {},
    pris: {},
    noeudsVisites: {},
    noeudsPerdus: {},
    acquis: []
  };
  UI.definirPartie(testPartie);
  UI.carte();

  const acteTete = rootNode.querySelector(".pk-carte-acte") || rootNode.querySelector(".pkdx-acte-tete");
  assert.ok(acteTete, "Map must render act header (.pk-carte-acte or .pkdx-acte-tete)");
  assert.match(acteTete.textContent, /Argenta/i, "Act header must announce destination (Argenta)");

  const noeuds = rootNode.querySelectorAll(".pk-carte-noeud");
  assert.ok(noeuds.length > 0, "Roadmap must render .pk-carte-noeud elements");

  // Current node highlight
  const noeudCourant = rootNode.querySelector('.pkdx-rangee[data-etat="courante"] .pk-carte-noeud') ||
                        rootNode.querySelector('.pk-carte-noeud.est-courant') ||
                        rootNode.querySelector('.pk-carte-noeud:not([disabled])');
  assert.ok(noeudCourant, "Active node in current row must be rendered and available to play");
});

runTest("carte() renders quick tactical access bar (.pk-carte-barre-tactique) with Sac, Boite, Juge, and Dex", () => {
  const { ctx, rootNode } = setupEnvironment();
  const UI = ctx.PokeUI;

  const testPartie = {
    starter: 25,
    acte: 1,
    rangee: 0,
    regle: "voyage",
    equipe: [{ n: 25, niveau: 12, pv: 35, stats: { pv: 35 }, attaques: [] }],
    boite: [{ n: 16, niveau: 10, pv: 30, stats: { pv: 30 }, attaques: [] }],
    sac: { POTION: 2, CHOICE_BAND: 1 },
    cles: {},
    vus: {},
    pris: {},
    noeudsVisites: {},
    noeudsPerdus: {},
    acquis: []
  };
  UI.definirPartie(testPartie);
  UI.carte();

  const barreTactique = rootNode.querySelector(".pk-carte-barre-tactique") || rootNode.querySelector(".pkdx-actions.est-carte");
  assert.ok(barreTactique, "Must render tactical access bar (.pk-carte-barre-tactique or .est-carte)");

  const btnSac = rootNode.querySelector("#pk-sac");
  assert.ok(btnSac, "Must render #pk-sac in quick tactical access bar");

  const btnBoite = rootNode.querySelector("#pk-boite");
  assert.ok(btnBoite, "Must render #pk-boite in quick tactical access bar");

  const btnJuge = rootNode.querySelector("#pk-juge");
  assert.ok(btnJuge, "Must render #pk-juge in quick tactical access bar");

  const btnDex = rootNode.querySelector("#pk-dex");
  assert.ok(btnDex, "Must render #pk-dex in quick tactical access bar");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tabbed Bag & Chest Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\x1b[1m\x1b[33m--- Suite 3: Tabbed Bag (ecranSac) & Chest (ecranCoffre) ---\x1b[0m");

runTest("ecranSac() renders category tabs (.pk-sac-onglets) and item cards on dark surface", () => {
  const { ctx, rootNode } = setupEnvironment();
  const UI = ctx.PokeUI;

  const testPartie = {
    starter: 25,
    acte: 1,
    regle: "voyage",
    equipe: [{ n: 25, niveau: 12, pv: 35, stats: { pv: 35 }, surnom: "Pikachu", objet: null, attaques: [] }],
    boite: [],
    sac: {
      POTION: 3,
      POKE_BALL: 5,
      CHOICE_BAND: 1,
      PROTEIN: 2,
      FIRE_STONE: 1
    },
    cles: {},
    vus: {},
    pris: {},
    noeudsVisites: {},
    noeudsPerdus: {}
  };
  UI.definirPartie(testPartie);
  UI.ecranSac(() => {});

  // Category navigation tabs
  const tabs = rootNode.querySelector(".pk-sac-onglets");
  assert.ok(tabs, "Bag must render category navigation tabs (.pk-sac-onglets)");
  const tabButtons = tabs.querySelectorAll(".pk-sac-onglet");
  assert.ok(tabButtons.length >= 4, "Must render at least 4 category tabs (e.g. Tous, Soins, Balls, Tenus, Vitamines, Pierres)");

  // Item cards
  const itemCards = rootNode.querySelectorAll(".pk-sac-carte") || rootNode.querySelectorAll(".pkdx-objet-ligne");
  assert.ok(itemCards.length >= 5, "Must render item cards for bag contents");

  // Verify quantity badges
  const quantiteBadge = rootNode.querySelector(".pk-badge-quantite") || rootNode.querySelector(".pkdx-objet-n");
  assert.ok(quantiteBadge, "Item cards must display quantity badge (.pk-badge-quantite or .pkdx-objet-n)");
  assert.match(quantiteBadge.textContent, /×\d+/, "Quantity badge format ×N");
});

runTest("ecranSac() held item flow: equips item via choisirPorteur and updates held item", () => {
  const { ctx, rootNode } = setupEnvironment();
  const UI = ctx.PokeUI;

  const testPartie = {
    starter: 25,
    acte: 1,
    regle: "voyage",
    equipe: [{ n: 25, niveau: 12, pv: 35, stats: { pv: 35 }, surnom: "Pikachu", objet: null, attaques: [] }],
    boite: [],
    sac: { CHOICE_BAND: 1 },
    cles: {},
    vus: {},
    pris: {},
    noeudsVisites: {},
    noeudsPerdus: {}
  };
  UI.definirPartie(testPartie);
  UI.ecranSac(() => {});

  const btnChoice = rootNode.querySelector('[data-objet="CHOICE_BAND"]');
  assert.ok(btnChoice, "CHOICE_BAND card must be present and clickable");
  btnChoice.click();

  // choisirPorteur screen
  const btnPorteur0 = rootNode.querySelector('[data-porteur="0"]') || rootNode.querySelector('[data-cible="0"]');
  assert.ok(btnPorteur0, "choisirPorteur must display team member button [data-porteur='0']");
  btnPorteur0.click();

  assert.equal(testPartie.equipe[0].objet, "CHOICE_BAND", "Pikachu must now hold CHOICE_BAND");
  assert.equal(testPartie.sac.CHOICE_BAND || 0, 0, "CHOICE_BAND must be removed from bag");

  // Advance message dialog
  const btnSuivant = rootNode.querySelector("#pk-suivant");
  if (btnSuivant) btnSuivant.click();

  // Re-rendered bag displays En Main
  assert.ok(rootNode.querySelector('[data-reprendre="0"]'), "Bag must render [data-reprendre='0'] button");
});

runTest("ecranCoffre() renders dark cards (.pk-coffre-carte) with charges badge (⚡ X utilisations)", () => {
  const { ctx, rootNode } = setupEnvironment();
  const P = ctx.PokeProgression;
  P.coffreAjouter("CHOICE_BAND", 5);
  P.coffreAjouter("LEFTOVERS", 10);

  ctx.PokeUI.ecranCoffre();

  const cartes = rootNode.querySelectorAll(".pk-coffre-carte");
  assert.equal(cartes.length, 2, "Must render 2 cards in chest screen");

  const badgeCharges = rootNode.querySelectorAll(".pk-coffre-badge-charges");
  assert.equal(badgeCharges.length, 2, "Must render charges badge on each chest card");
  assert.match(badgeCharges[0].textContent, /⚡\s*5/, "First badge displays ⚡ 5 utilisations");
  assert.match(badgeCharges[1].textContent, /⚡\s*10/, "Second badge displays ⚡ 10 utilisations");

  const btnRetour = rootNode.querySelector("#pk-coffre-retour");
  assert.ok(btnRetour, "#pk-coffre-retour button must exist");
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Showdown Pokédex Detail Cards Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\x1b[1m\x1b[33m--- Suite 4: Showdown Pokédex Detail Cards (pokedex-ui.js) ---\x1b[0m");

runTest("PokePokedex renders detail card with Sugimori art backdrop, stat bars, type pills, and ability description", () => {
  const { ctx, rootNode } = setupEnvironment();
  const Pokedex = ctx.PokePokedex;

  const mockPartie = {
    version: "rouge",
    pris: { 1: { niveau: 5, zone: "depart" } },
    vus: { 1: true, 4: true }
  };

  Pokedex.ouvrir(rootNode, mockPartie, () => {});

  // Click on Bulbasaur (#1)
  const case1 = rootNode.querySelector('.pkdx-case[data-n="1"]');
  assert.ok(case1, "Case for Bulbasaur (N°1) must exist in grid");
  case1.click();

  // 1. Sugimori art display
  const portrait = rootNode.querySelector(".pk-dex-art") || rootNode.querySelector(".pkdx-portrait");
  assert.ok(portrait, "Must render Sugimori artwork element");
  assert.match(portrait.getAttribute("src"), /assets\/img\/poke\/art\/1\.webp/, "Must point to official Sugimori art");

  // 2. Base stat bars
  const statBars = rootNode.querySelectorAll(".pk-stat-barre") || rootNode.querySelectorAll(".pk-dex-stat");
  assert.ok(statBars.length >= 5, "Must render at least 5 base stats bars (PV, Atk, Def, Spe/SpA, Vit)");
  const statText = rootNode.textContent;
  assert.match(statText, /PV|HP/i, "Stats must indicate PV / HP");
  assert.match(statText, /ATK|Attaque/i, "Stats must indicate Attaque");
  assert.match(statText, /DEF|Défense/i, "Stats must indicate Défense");
  assert.match(statText, /VIT|Vitesse/i, "Stats must indicate Vitesse");

  // 3. Official canonical type pills (.pk-badge-type.pk-type-*)
  const typePills = rootNode.querySelectorAll(".pk-badge-type") || rootNode.querySelectorAll(".pkdx-type");
  assert.ok(typePills.length >= 2, "Must render at least 2 type pills for Bulbasaur (Plante, Poison)");
  const pillClasses = Array.from(typePills).map(p => p.className).join(" ");
  assert.match(pillClasses, /pk-type-plante|pk-type-grass|data-type="grass"/, "Type pill must carry Plante / Grass type class or attribute");
  assert.match(pillClasses, /pk-type-poison|data-type="poison"/, "Type pill must carry Poison type class or attribute");

  // 4. Ability / Talent breakdown
  const abilitySection = rootNode.querySelector(".pk-dex-talent") || rootNode.querySelector(".pk-dex-ability");
  assert.ok(abilitySection, "Must render ability breakdown section (.pk-dex-talent or .pk-dex-ability)");
  assert.match(abilitySection.textContent, /Engrais|Overgrow/i, "Must display Bulbasaur's canonical ability name");

  // 5. High-contrast Pokédex flavor text
  const notice = rootNode.querySelector(".pk-dex-notice") || rootNode.querySelector(".pkdx-notice");
  assert.ok(notice, "Must render Pokédex notice element");
  assert.match(notice.textContent, /graine/i, "Must contain canonical Pokédex description");
});

runTest("PokePokedex retains the 3 accessibility states: silhouette (unseen), grayscale (seen), full color (caught)", () => {
  const { ctx, rootNode } = setupEnvironment();
  const Pokedex = ctx.PokePokedex;

  const mockPartie = {
    version: "rouge",
    pris: { 1: { niveau: 5 } },
    vus: { 1: true, 4: true } // Bulbasaur caught, Charmander seen, Squirtle unseen
  };

  Pokedex.ouvrir(rootNode, mockPartie, () => {});

  const casePris = rootNode.querySelector('.pkdx-case[data-n="1"]');
  assert.equal(casePris.getAttribute("data-etat"), "pris", "Bulbasaur state must be 'pris'");

  const caseVu = rootNode.querySelector('.pkdx-case[data-n="4"]');
  assert.equal(caseVu.getAttribute("data-etat"), "vu", "Charmander state must be 'vu'");

  const caseInconnu = rootNode.querySelector('.pkdx-case[data-n="7"]');
  assert.equal(caseInconnu.getAttribute("data-etat"), "inconnu", "Squirtle state must be 'inconnu'");
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CSS Rules & Token Integration Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n\x1b[1m\x1b[33m--- Suite 5: CSS Design Rules (css/poke.css) ---\x1b[0m");

runTest("css/poke.css declares supporting classes for modern central screens", () => {
  const cssContent = fs.readFileSync(path.join(ROOT_DIR, "css", "poke.css"), "utf-8");

  // Lobby
  assert.match(cssContent, /\.pk-lobby-banner|\.pk-accueil-banner/, "CSS must define .pk-lobby-banner or .pk-accueil-banner");
  assert.match(cssContent, /\.pk-modes-grille|\.pk-accueil-modes/, "CSS must define .pk-modes-grille or .pk-accueil-modes");

  // Tactical Roadmap
  assert.match(cssContent, /\.pk-carte-noeud/, "CSS must define .pk-carte-noeud");
  assert.match(cssContent, /\.pk-carte-acte/, "CSS must define .pk-carte-acte");
  assert.match(cssContent, /\.pk-carte-barre-tactique/, "CSS must define .pk-carte-barre-tactique");

  // Tabbed Bag & Chest
  assert.match(cssContent, /\.pk-sac-onglets/, "CSS must define .pk-sac-onglets");
  assert.match(cssContent, /\.pk-sac-carte/, "CSS must define .pk-sac-carte");
  assert.match(cssContent, /\.pk-coffre-carte/, "CSS must define .pk-coffre-carte");
  assert.match(cssContent, /\.pk-coffre-badge-charges/, "CSS must define .pk-coffre-badge-charges");

  // Pokédex
  assert.match(cssContent, /\.pk-stat-barre|\.pk-dex-stat/, "CSS must define .pk-stat-barre or .pk-dex-stat");
  assert.match(cssContent, /\.pk-badge-type/, "CSS must define .pk-badge-type");
  assert.match(cssContent, /\.pk-dex-talent|\.pk-dex-ability/, "CSS must define .pk-dex-talent or .pk-dex-ability");
});

console.log(`\n\x1b[32mAll ${passed}/${total} Showdown Central UI tests passed successfully!\x1b[0m\n`);
