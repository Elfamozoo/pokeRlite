import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("\x1b[1m\x1b[36m=== Test Suite: Showdown Combat Engine Presentation & UI ===\x1b[0m\n");

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

    if (this.tagName === "CANVAS") {
      this.width = 800;
      this.height = 480;
      this.getContext = (type) => ({
        save: () => {}, restore: () => {}, clearRect: () => {}, fillRect: () => {}, strokeRect: () => {},
        beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
        scale: () => {}, arc: () => {}
      });
    }

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

  get clientWidth() { return 800; }
  get clientHeight() { return 480; }
  get offsetWidth() { return 800; }
  get offsetHeight() { return 480; }

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

  set firstChild(val) {
    if (this.children.length === 0) {
      if (val) this.appendChild(val);
    } else {
      this.children[0] = val;
    }
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
      // Multiple tokens: e.g. ".pk-showdown-combat .pk-arene-showdown"
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
      continue; // skip comments
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
  const mockDoc = {
    createElement: (tag) => new MockNode(tag),
    createTextNode: (text) => {
      const n = new MockNode("#text");
      n._textContent = text;
      return n;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    body: new MockNode("body"),
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
    MessageChannel: globalThis.MessageChannel || class {
      constructor() {
        this.port1 = { onmessage: null, postMessage: (msg) => { if (this.port2.onmessage) this.port2.onmessage({ data: msg }); } };
        this.port2 = { onmessage: null, postMessage: (msg) => { if (this.port1.onmessage) this.port1.onmessage({ data: msg }); } };
      }
    },
    document: mockDoc,
    window: null,
    setTimeout: () => 1,
    clearTimeout: () => {},
    ...customGlobals,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}

function loadScriptInContext(relPath, context) {
  const fullPath = path.join(ROOT_DIR, relPath);
  const code = fs.readFileSync(fullPath, "utf-8");
  vm.runInContext(code, context, { filename: fullPath });
}

// Prepare execution context
const context = createIsolatedContext();
loadScriptInContext("js/poke/ordre.js", context);
for (const f of context.POKE_ORDRE_NOYAU) {
  loadScriptInContext(f, context);
}
if (context.POKE_ORDRE_GEN3) {
  for (const f of context.POKE_ORDRE_GEN3) {
    loadScriptInContext(f, context);
  }
}
loadScriptInContext("js/poke/tempo.js", context);
loadScriptInContext("js/poke/icones.js", context);
loadScriptInContext("js/poke/sprites-showdown.js", context);
loadScriptInContext("js/poke/anim-showdown.js", context);
loadScriptInContext("js/poke/ui-combat.js", context);

const Ecran = context.PokeUICombat.Ecran;
assert.ok(Ecran, "PokeUICombat.Ecran constructor must be defined");

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

const test = runTest;

function createCombatUIContext() {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);
  for (const f of ctx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, ctx);
  }
  if (ctx.POKE_ORDRE_GEN3) {
    for (const f of ctx.POKE_ORDRE_GEN3) {
      loadScriptInContext(f, ctx);
    }
  }
  loadScriptInContext("js/poke/tempo.js", ctx);
  loadScriptInContext("js/poke/icones.js", ctx);
  loadScriptInContext("js/poke/sprites-showdown.js", ctx);
  loadScriptInContext("js/poke/anim-showdown.js", ctx);
  loadScriptInContext("js/poke/ui-combat.js", ctx);
  return ctx;
}

function createDummyState() {
  return {
    joueur: {
      equipe: [
        {
          n: 25,
          nom: "Pikachu",
          niveau: 50,
          pv: 100,
          stats: { pv: 100, atk: 55, def: 40, spe: 50, vit: 90 },
          statut: null,
          dv: { atk: 15, def: 15, spe: 15, vit: 15 },
          attaques: [
            { cle: "THUNDERBOLT", pp: 15, ppMax: 15 },
            { cle: "QUICK_ATTACK", pp: 30, ppMax: 30 },
            { cle: "THUNDER_WAVE", pp: 20, ppMax: 20 },
            { cle: "HEADBUTT", pp: 15, ppMax: 15 }
          ]
        },
        {
          n: 4,
          nom: "Salameche",
          niveau: 50,
          pv: 90,
          stats: { pv: 90 },
          statut: null,
          attaques: [{ cle: "EMBER", pp: 25, ppMax: 25 }]
        }
      ],
      actif: 0,
      paliers: context.PokeCombat ? context.PokeCombat.paliersNeufs() : { atk: 0, def: 0, spe: 0, vit: 0, precision: 0, esquive: 0 },
      volatils: {},
      participants: { 0: true }
    },
    adverse: {
      dresseur: true,
      equipe: [
        {
          n: 1,
          nom: "Bulbizarre",
          niveau: 50,
          pv: 100,
          stats: { pv: 100, atk: 49, def: 49, spe: 65, vit: 45 },
          statut: null,
          dv: { atk: 15, def: 15, spe: 15, vit: 15 },
          attaques: [
            { cle: "TACKLE", pp: 35, ppMax: 35 },
            { cle: "VINE_WHIP", pp: 25, ppMax: 25 }
          ]
        }
      ],
      actif: 0,
      paliers: context.PokeCombat ? context.PokeCombat.paliersNeufs() : { atk: 0, def: 0, spe: 0, vit: 0, precision: 0, esquive: 0 },
      volatils: {},
      participants: { 0: true }
    },
    tour: 0,
    fini: null
  };
}

// 1. Ecran.prototype.monter() DOM layout
runTest("Ecran.prototype.monter() creates .pk-showdown-combat with .pk-arene-showdown, .pk-actions-showdown, and .pk-battle-log", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const combat = hote.querySelector(".pk-showdown-combat");
  assert.ok(combat, "Container .pk-showdown-combat must exist");

  const arene = hote.querySelector(".pk-arene-showdown");
  assert.ok(arene, "Battlefield .pk-arene-showdown must exist");

  const actions = hote.querySelector(".pk-actions-showdown");
  assert.ok(actions, "Control panel .pk-actions-showdown must exist");

  const logPanel = hote.querySelector(".pk-battle-log");
  assert.ok(logPanel, "Live battle log .pk-battle-log must exist");

  const toast = hote.querySelector(".pk-arene-dialogue-toast");
  assert.ok(toast, "Dialogue toast .pk-arene-dialogue-toast must exist in arena");

  const platforms = hote.querySelectorAll(".pk-arene-socle");
  assert.equal(platforms.length, 2, "Must create 2 battle platforms (.pk-arene-socle)");
});

// 2. Opponent and player floating healthboxes
runTest("Creates opponent and player floating healthboxes (.pk-healthbox[data-cote]) with full identity, status, and HP bar structure", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const hbAdverse = hote.querySelector('.pk-healthbox[data-cote="adverse"]');
  assert.ok(hbAdverse, "Opponent floating healthbox (.pk-healthbox[data-cote='adverse']) must exist");

  const hbJoueur = hote.querySelector('.pk-healthbox[data-cote="joueur"]');
  assert.ok(hbJoueur, "Player floating healthbox (.pk-healthbox[data-cote='joueur']) must exist");

  for (const hb of [hbAdverse, hbJoueur]) {
    assert.ok(hb.querySelector(".pk-hb-identite"), "Healthbox must have .pk-hb-identite");
    assert.ok(hb.querySelector(".pk-hb-nom"), "Healthbox must have .pk-hb-nom");
    assert.ok(hb.querySelector(".pk-hb-niveau"), "Healthbox must have .pk-hb-niveau");
    assert.ok(hb.querySelector(".pk-hb-statut-hote"), "Healthbox must have .pk-hb-statut-hote");
    assert.ok(hb.querySelector(".pk-hb-barre-wrap"), "Healthbox must have .pk-hb-barre-wrap");
    assert.ok(hb.querySelector(".pk-hb-barre"), "Healthbox must have .pk-hb-barre");
    assert.ok(hb.querySelector(".pk-hb-barre-remplie"), "Healthbox must have .pk-hb-barre-remplie");
    assert.ok(hb.querySelector(".pk-hb-chiffre"), "Healthbox must have .pk-hb-chiffre");
  }

  // Names rendered
  assert.match(hbJoueur.querySelector(".pk-hb-nom").textContent, /Pikachu/i, "Player name must be Pikachu");
  assert.match(hbAdverse.querySelector(".pk-hb-nom").textContent, /Bulbizarre/i, "Opponent name must be Bulbizarre");
});

// 3. Move selection renders a 2x2 grid (.pk-grille-attaques) of colored move buttons (.pk-attaque-btn)
runTest("Move selection renders a 2x2 grid (.pk-grille-attaques) of colored move buttons (.pk-attaque-btn) showing name, type, power, precision, and PP", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const grille = hote.querySelector(".pk-grille-attaques");
  assert.ok(grille, "Must render .pk-grille-attaques in showdown actions");

  const boutons = grille.querySelectorAll(".pk-attaque-btn");
  assert.equal(boutons.length, 4, "Must render 4 move buttons in the 2x2 grid");

  const premier = boutons[0];
  const txt = premier.textContent;

  // Move name
  assert.match(txt, /Tonnerre/i, "First move button must display move name (Tonnerre)");
  // Must NEVER output [object Object]
  assert.ok(!txt.includes("[object Object]"), "Move button must never contain [object Object]");
  const typeSpan = premier.querySelector(".pk-attaque-type");
  assert.ok(typeSpan, "Move button must have .pk-attaque-type");
  assert.ok(typeSpan.textContent.length > 0 && !typeSpan.textContent.includes("[object"), "Type name must be a valid localized string");
  // Category pill (PHY, SPÉ, STAT)
  const cat = premier.querySelector(".pk-cat-tag");
  assert.ok(cat, "Move button must include category tag .pk-cat-tag");
  assert.match(cat.textContent, /PHY|SPÉ|SPE|STAT/, "Category tag must display PHY, SPÉ, or STAT");

  // Power, Precision, PP
  assert.match(txt, /Pui/i, "Move button must indicate Power (Pui)");
  assert.match(txt, /Préc/i, "Move button must indicate Precision (Préc)");
  assert.match(txt, /PP/i, "Move button must indicate PP");
  assert.match(txt, /15\s*\/\s*15/, "Move button must show current / max PP");

  // Tactical actions row: ÉQUIPE, ABANDONNER, SAC
  const barreTactique = hote.querySelector(".pk-barre-tactique");
  assert.ok(barreTactique, "Must render .pk-barre-tactique with tactical quick buttons");
  const tacticalText = barreTactique.textContent;
  assert.match(tacticalText, /ÉQUIPE|SWITCH/i, "Tactical row must contain Équipe button");
  assert.match(tacticalText, /ABANDONNER|FUIR/i, "Tactical row must contain Abandonner / Fuir button");
  assert.match(tacticalText, /SAC/i, "Tactical row must contain Sac button in standard battle");
});

// 4. Move button disabled with explanation when PP == 0 or Entrave
runTest("Disables move button with explanation when PP == 0 or move is entrave", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  // Set first move to 0 PP
  etat.joueur.equipe[0].attaques[0].pp = 0;
  // Set second move entrave
  etat.joueur.volatils.entrave = { index: 1, tours: 2 };

  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const boutons = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  assert.ok(boutons[0].disabled || boutons[0].getAttribute("aria-disabled") === "true", "0 PP move must be disabled");
  assert.ok(boutons[1].disabled || boutons[1].getAttribute("aria-disabled") === "true", "Entrave move must be disabled");
  assert.ok(!boutons[2].disabled, "Move with PP and no entrave must be enabled");
});

// 5. Dynamic HP gradient and values updated in healthbox on rafraichir()
runTest("Dynamic HP gradient and values updated in healthbox on rafraichir()", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const hbJoueur = hote.querySelector('.pk-healthbox[data-cote="joueur"]');
  const barreJoueur = hbJoueur.querySelector(".pk-hb-barre-remplie");
  const chiffreJoueur = hbJoueur.querySelector(".pk-hb-chiffre");

  const hbAdverse = hote.querySelector('.pk-healthbox[data-cote="adverse"]');
  const barreAdverse = hbAdverse.querySelector(".pk-hb-barre-remplie");
  const chiffreAdverse = hbAdverse.querySelector(".pk-hb-chiffre");

  // Initial (100% HP)
  assert.equal(barreJoueur.style.width, "100%", "Initial player HP bar width must be 100%");
  assert.match(barreJoueur.style.background, /var\(--hp-haut\)/, "Initial player HP gradient must be --hp-haut (> 50%)");
  assert.match(chiffreJoueur.textContent, /100\s*\/\s*100\s*\(100\s*%\)/, "Player healthbox displays exact numbers and percentage");
  assert.match(chiffreAdverse.textContent, /100\s*%/, "Opponent healthbox displays percentage (100 %)");

  // Mid HP (40% - amber)
  etat.joueur.equipe[0].pv = 40;
  etat.adverse.equipe[0].pv = 35;
  ecran.rafraichir();

  assert.equal(barreJoueur.style.width, "40%", "40/100 HP width must be 40%");
  assert.match(barreJoueur.style.background, /var\(--hp-moyen\)/, "40% HP gradient must be --hp-moyen (20% - 50%)");
  assert.match(chiffreJoueur.textContent, /40\s*\/\s*100\s*\(40\s*%\)/, "Player shows 40 / 100 (40 %)");
  assert.match(chiffreAdverse.textContent, /35\s*%/, "Opponent shows 35 %");

  // Low HP (15% - critical red)
  etat.joueur.equipe[0].pv = 15;
  ecran.rafraichir();

  assert.equal(barreJoueur.style.width, "15%", "15/100 HP width must be 15%");
  assert.match(barreJoueur.style.background, /var\(--hp-critique\)/, "15% HP gradient must be --hp-critique (< 20%)");
  assert.match(chiffreJoueur.textContent, /15\s*\/\s*100\s*\(15\s*%\)/, "Player shows 15 / 100 (15 %)");

  // Status pill display
  etat.joueur.equipe[0].statut = "brulure";
  ecran.rafraichir();
  const statutPill = hbJoueur.querySelector(".pk-hb-statut-hote");
  assert.match(statutPill.textContent, /BRN|BRU/, "Status pill displays BRN/BRU on burn");
});

// 6. Live Battle Log updates on turns and dire()
runTest("Live Battle Log updates on turns and dire()", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const logFlux = hote.querySelector(".pk-battle-log-flux") || hote.querySelector(".pk-battle-log");
  assert.ok(logFlux, "Battle log flux container must exist");

  // dire() updates dialogue toast AND appends to battle log
  ecran.dire("Pikachu lance Tonnerre !");
  const toast = hote.querySelector(".pk-arene-dialogue-toast");
  assert.equal(toast.textContent, "Pikachu lance Tonnerre !", "Toast in arena must display spoken dialogue");
  assert.match(logFlux.textContent, /Pikachu lance Tonnerre !/, "Battle log must record spoken dialogue");

  // Executing an action automatically adds turn header --- Tour 1 ---
  ecran.agir({ type: "attaque", index: 0 });
  assert.match(logFlux.textContent, /---\s*Tour\s*1\s*---/, "Executing ecran.agir automatically adds turn header --- Tour 1 ---");
  const tourHeader = logFlux.querySelector(".pk-log-tour");
  assert.ok(tourHeader, "Must render .pk-log-tour element");
  assert.match(tourHeader.textContent, /---\s*Tour\s*1\s*---/, ".pk-log-tour must contain --- Tour 1 ---");

  // Turn header appending
  if (typeof ecran.ajouterTour === "function") {
    ecran.ajouterTour(2);
    assert.match(logFlux.textContent, /---\s*Tour\s*2\s*---/, "Battle log must record turn header --- Tour 2 ---");
  }

  // Styled log entry with tag
  if (typeof ecran.ajouterLog === "function") {
    ecran.ajouterLog("Coup critique !", "critique");
    assert.match(logFlux.textContent, /Coup critique !/, "Battle log must record tagged message");
    const badge = logFlux.querySelector(".pk-log-badge.critique");
    assert.ok(badge, "Tagged message must render badge .pk-log-badge.critique");
  }
});

// 7. Bag button suppressed when usine: true or duel: true
runTest("Bag button is suppressed when usine: true or duel: true", () => {
  // Test usine: true
  const hoteUsine = new MockNode("div");
  const etatUsine = createDummyState();
  const ecranUsine = new Ecran(hoteUsine, etatUsine, {
    hasard: new context.PokeHasard(1),
    rythme: 900,
    usine: true
  });
  const barreUsine = hoteUsine.querySelector(".pk-barre-tactique");
  assert.doesNotMatch(barreUsine.textContent, /\bSAC\b/i, "Bag button must NOT exist when usine: true");

  // Test duel: true
  const hoteDuel = new MockNode("div");
  const etatDuel = createDummyState();
  const ecranDuel = new Ecran(hoteDuel, etatDuel, {
    hasard: new context.PokeHasard(1),
    rythme: 900,
    duel: true
  });
  const barreDuel = hoteDuel.querySelector(".pk-barre-tactique");
  assert.doesNotMatch(barreDuel.textContent, /\bSAC\b/i, "Bag button must NOT exist when duel: true");

  // Standard battle: Sac button exists
  const hoteStd = new MockNode("div");
  const etatStd = createDummyState();
  const ecranStd = new Ecran(hoteStd, etatStd, {
    hasard: new context.PokeHasard(1),
    rythme: 900
  });
  const barreStd = hoteStd.querySelector(".pk-barre-tactique");
  assert.match(barreStd.textContent, /\bSAC\b/i, "Bag button MUST exist in normal battle");
});

// 8. Canvas FX mount and animated sprite rendering with offline fallback
runTest("Mounts Canvas FX (.pk-arene-fx) and renders Showdown animated GIFs with offline fallback", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const canvas = hote.querySelector("canvas.pk-arene-fx");
  assert.ok(canvas, "Canvas FX (.pk-arene-fx) must be mounted in arena");
  assert.strictEqual(ecran.canvasFx, canvas, "ecran.canvasFx must point to mounted canvas");

  const imgJoueur = ecran.elJoueur.querySelector("img");
  assert.ok(imgJoueur, "Player sprite image must exist");
  assert.strictEqual(imgJoueur.getAttribute("src"), "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif");
  assert.ok(imgJoueur.getAttribute("onerror").includes("assets/img/poke/gen3/dos/25.png"));

  const imgAdverse = ecran.elAdverse.querySelector("img");
  assert.ok(imgAdverse, "Opponent sprite image must exist");
  assert.strictEqual(imgAdverse.getAttribute("src"), "https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif");
  assert.ok(imgAdverse.getAttribute("onerror").includes("assets/img/poke/gen3/face/1.png"));
});

// 9. Healthbox stat stage modifier pills (.pk-hb-paliers)
runTest("Renders stat stage modifier pills (.pk-palier-pill.est-hausse / .est-baisse) in .pk-hb-paliers", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const paliersJoueur = ecran.elHbJoueur.querySelector(".pk-hb-paliers");
  assert.ok(paliersJoueur, "Player healthbox must contain .pk-hb-paliers");
  assert.strictEqual(paliersJoueur.querySelectorAll(".pk-palier-pill").length, 0, "Zero stages render 0 pills");

  // Buff / debuff
  etat.joueur.paliers.atk = 2;
  etat.joueur.paliers.def = -1;
  etat.adverse.paliers.vit = 1;
  ecran.rafraichir();

  const pillsJ = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsJ.length, 2, "Player renders 2 pills for Atk +2 and Def -1");
  assert.ok(pillsJ[0].classList.contains("est-hausse"), "Atk +2 must be .est-hausse");
  assert.match(pillsJ[0].textContent, /\+2\s*(ATQ|ATK)/i);
  assert.ok(pillsJ[1].classList.contains("est-baisse"), "Def -1 must be .est-baisse");
  assert.match(pillsJ[1].textContent, /\-1\s*(DÉF|DEF)/i);

  const pillsA = ecran.elHbAdverse.querySelector(".pk-hb-paliers").querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsA.length, 1, "Opponent renders 1 pill for Vit +1");
  assert.ok(pillsA[0].classList.contains("est-hausse"));
  assert.match(pillsA[0].textContent, /\+1\s*(VIT|SPD)/i);
});

// 10. Tactical move effectiveness badges (.pk-attaque-efficacite)
runTest("Displays tactical move effectiveness badges (.pk-attaque-efficacite) on move buttons", () => {
  const hote = new MockNode("div");
  const etat = createDummyState();
  const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

  const boutons = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  assert.strictEqual(boutons.length, 4, "Must render 4 move buttons");

  // Move 0: Tonnerre (Électrik) vs Bulbizarre (Plante/Poison) -> 0.5x -> .est-peu with ×½
  const badge0 = boutons[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badge0, "Move 0 must have .pk-attaque-efficacite badge");
  assert.ok(badge0.classList.contains("est-peu"), "0.5x multiplier has .est-peu");
  assert.match(badge0.textContent, /×½/);

  // Move 1: Vive-Attaque (Normal) -> 1x -> no badge
  const badge1 = boutons[1].querySelector(".pk-attaque-efficacite");
  assert.ok(!badge1 || badge1.textContent.trim() === "", "1.0x neutral move has no badge");

  // Move 2: Cage-Éclair (Status) -> .est-statut with STAT
  const badge2 = boutons[2].querySelector(".pk-attaque-efficacite");
  assert.ok(badge2, "Status move must have .pk-attaque-efficacite badge");
  assert.ok(badge2.classList.contains("est-statut"), "Status move has .est-statut");
  assert.strictEqual(badge2.textContent.trim(), "STAT");

  // Opponent Leviator (Water/Flying) -> 4x multiplier
  etat.adverse.equipe[0] = {
    n: 130,
    nom: "Leviator",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 125, def: 79, spe: 100, vit: 81 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsLev = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeLev = boutonsLev[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeLev.classList.contains("est-super"), "4x has .est-super");
  assert.match(badgeLev.textContent, /×4/);

  // Opponent Racaillou (Rock/Ground) -> 0x multiplier
  etat.adverse.equipe[0] = {
    n: 74,
    nom: "Racaillou",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 80, def: 100, spe: 30, vit: 20 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsRac = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeRac = boutonsRac[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeRac.classList.contains("est-inutile"), "0x has .est-inutile");
  assert.match(badgeRac.textContent, /×0/);
});

// 11. Move button accuracy displays 'Préc -' for status moves and never-miss moves, never 'Préc 0%'
runTest("Move button accuracy displays 'Préc -' for status moves and never-miss moves, never 'Préc 0%'", () => {
  const ancienneGen = context.PokeRegles && context.PokeRegles.courante && context.PokeRegles.courante();
  if (context.PokeRegles && context.PokeRegles.poser) {
    context.PokeRegles.poser("gen3");
  }
  try {
    const hote = new MockNode("div");
    const etat = createDummyState();
    etat.joueur.equipe[0].attaques = [
      { cle: "BULK_UP", pp: 20, ppMax: 20 },
      { cle: "AERIAL_ACE", pp: 20, ppMax: 20 },
      { cle: "TOXIC", pp: 10, ppMax: 10 },
      { cle: "HYPNOSIS", pp: 20, ppMax: 20 }
    ];
    const ecran = new Ecran(hote, etat, { hasard: new context.PokeHasard(1), rythme: 900 });

    const buttons = ecran.elActions.querySelectorAll(".pk-attaque-btn");
    assert.strictEqual(buttons.length, 4);

    const bulkUpStats = buttons[0].querySelector(".pk-attaque-stats").textContent;
    const aerialAceStats = buttons[1].querySelector(".pk-attaque-stats").textContent;
    const toxicStats = buttons[2].querySelector(".pk-attaque-stats").textContent;
    const hypnosisStats = buttons[3].querySelector(".pk-attaque-stats").textContent;

    assert.ok(bulkUpStats.includes("Préc -"), `Bulk Up stats should show 'Préc -', got: ${bulkUpStats}`);
    assert.ok(!bulkUpStats.includes("Préc 0%"), `Bulk Up stats must NOT show 'Préc 0%'`);
    assert.ok(aerialAceStats.includes("Préc -"), `Aerial Ace stats should show 'Préc -', got: ${aerialAceStats}`);
    assert.ok(!aerialAceStats.includes("Préc 0%"), `Aerial Ace stats must NOT show 'Préc 0%'`);

    assert.ok(toxicStats.includes("Préc 85%"), `Toxic stats should show 'Préc 85%', got: ${toxicStats}`);
    assert.ok(!toxicStats.includes("Préc -"), `Toxic stats must NOT show 'Préc -'`);
    assert.ok(hypnosisStats.includes("Préc 60%"), `Hypnosis stats should show 'Préc 60%', got: ${hypnosisStats}`);
    assert.ok(!hypnosisStats.includes("Préc -"), `Hypnosis stats must NOT show 'Préc -'`);

    const bulkUpCat = buttons[0].querySelector(".pk-cat-tag").textContent;
    const aerialAceCat = buttons[1].querySelector(".pk-cat-tag").textContent;
    const toxicCat = buttons[2].querySelector(".pk-cat-tag").textContent;
    assert.strictEqual(bulkUpCat, "STAT", `Bulk Up category badge should be STAT, got: ${bulkUpCat}`);
    assert.strictEqual(aerialAceCat, "PHY", `Aerial Ace category badge should be PHY, got: ${aerialAceCat}`);
    assert.strictEqual(toxicCat, "STAT", `Toxic category badge should be STAT, got: ${toxicCat}`);
  } finally {
    if (context.PokeRegles && context.PokeRegles.poser && ancienneGen) {
      context.PokeRegles.poser(ancienneGen);
    }
  }
});

// 12. Gen 3 multi-stat moves boost multiple stages simultaneously
test("Gen 3 multi-stat moves boost multiple stages simultaneously", () => {
  const ctx = createCombatUIContext();
  const Combat = ctx.PokeCombat;
  const Moteur = ctx.PokeMoteur;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;

  const prevRegles = Regles.courante ? Regles.courante() : "gen1";
  Regles.poser("gen3");

  try {
    const h = new Hasard("MULTI-STAT-TEST");
    const mon = Moteur.creer(255, 10, h); // Torchic
    const foe = Moteur.creer(1, 10, h);   // Bulbasaur

    const state = Combat.demarrer([mon], [foe], { graine: "MULTI-STAT-TEST", dresseur: false }, h);

    // Execute BULK_UP (+1 Atk, +1 Def)
    const bulkUp = ctx.POKE_GEN3_ATTAQUE_PAR_CLE.BULK_UP;
    assert.ok(bulkUp, "BULK_UP must exist");
    const ev = Combat.jouerCoup(state, "joueur", "adverse", bulkUp, h);

    const palierEvs = ev.filter(e => e.t === "palier" && e.cote === "joueur");
    assert.strictEqual(palierEvs.length, 2, "Bulk Up must emit 2 palier events");
    assert.ok(palierEvs.some(e => e.stat === "atk" && e.delta === 1), "Must boost Attack by +1");
    assert.ok(palierEvs.some(e => e.stat === "def" && e.delta === 1), "Must boost Defense by +1");

    // Execute CALM_MIND (+1 SpA, +1 SpD)
    const calmMind = ctx.POKE_GEN3_ATTAQUE_PAR_CLE.CALM_MIND;
    assert.ok(calmMind, "CALM_MIND must exist");
    const evCm = Combat.jouerCoup(state, "joueur", "adverse", calmMind, h);
    const cmPalierEvs = evCm.filter(e => e.t === "palier" && e.cote === "joueur");
    assert.strictEqual(cmPalierEvs.length, 2, "Calm Mind must emit 2 palier events");
    assert.ok(cmPalierEvs.some(e => e.stat === "sat" && e.delta === 1), "Must boost Sp.Atk by +1");
    assert.ok(cmPalierEvs.some(e => e.stat === "sdf" && e.delta === 1), "Must boost Sp.Def by +1");

    // Execute DRAGON_DANCE (+1 Atk, +1 Speed)
    const dragonDance = ctx.POKE_GEN3_ATTAQUE_PAR_CLE.DRAGON_DANCE;
    assert.ok(dragonDance, "DRAGON_DANCE must exist");
    const evDd = Combat.jouerCoup(state, "joueur", "adverse", dragonDance, h);
    const ddPalierEvs = evDd.filter(e => e.t === "palier" && e.cote === "joueur");
    assert.strictEqual(ddPalierEvs.length, 2, "Dragon Dance must emit 2 palier events");
    assert.ok(ddPalierEvs.some(e => e.stat === "atk" && e.delta === 1), "Must boost Attack by +1");
    assert.ok(ddPalierEvs.some(e => e.stat === "vit" && e.delta === 1), "Must boost Speed by +1");
  } finally {
    Regles.poser(prevRegles);
  }
});

// 13. All Gen 3 moves have valid canonical Showdown properties
test("All Gen 3 moves have valid canonical Showdown properties", () => {
  const moves = context.POKE_GEN3_ATTAQUES;
  assert.ok(Array.isArray(moves), "POKE_GEN3_ATTAQUES must be an array");
  assert.strictEqual(moves.length, 103, "POKE_GEN3_ATTAQUES must contain 103 moves");

  const validCategories = new Set(["physique", "special", "statut"]);

  for (const m of moves) {
    // All 103 moves have categorie in ["physique", "special", "statut"]
    assert.ok(
      validCategories.has(m.categorie),
      `Move ${m.cle} has invalid categorie: ${m.categorie}`
    );

    // If puissance === 0, categorie is "statut"
    if (m.puissance === 0) {
      assert.strictEqual(
        m.categorie,
        "statut",
        `Move ${m.cle} with power 0 must have categorie "statut", got ${m.categorie}`
      );
    }

    // precision is either true or a number > 0. Never 0 or false.
    assert.ok(
      m.precision === true || (typeof m.precision === "number" && m.precision > 0),
      `Move ${m.cle} must have precision true or > 0, got: ${m.precision}`
    );
    assert.notStrictEqual(m.precision, 0, `Move ${m.cle} precision must never be 0`);
    assert.notStrictEqual(m.precision, false, `Move ${m.cle} precision must never be false`);
  }

  const parCle = context.POKE_GEN3_ATTAQUE_PAR_CLE;

  // Specific assertions for BULK_UP, CALM_MIND, DRAGON_DANCE, COSMIC_POWER, AERIAL_ACE, LEAF_BLADE, DIVE, DOOM_DESIRE, STOCKPILE, WILL_O_WISP
  const bulkUp = parCle.BULK_UP;
  assert.ok(bulkUp, "BULK_UP must exist");
  assert.strictEqual(bulkUp.puissance, 0);
  assert.strictEqual(bulkUp.precision, true);
  assert.strictEqual(bulkUp.categorie, "statut");

  const calmMind = parCle.CALM_MIND;
  assert.ok(calmMind, "CALM_MIND must exist");
  assert.strictEqual(calmMind.puissance, 0);
  assert.strictEqual(calmMind.precision, true);
  assert.strictEqual(calmMind.categorie, "statut");

  const dragonDance = parCle.DRAGON_DANCE;
  assert.ok(dragonDance, "DRAGON_DANCE must exist");
  assert.strictEqual(dragonDance.puissance, 0);
  assert.strictEqual(dragonDance.precision, true);
  assert.strictEqual(dragonDance.categorie, "statut");

  const cosmicPower = parCle.COSMIC_POWER;
  assert.ok(cosmicPower, "COSMIC_POWER must exist");
  assert.strictEqual(cosmicPower.puissance, 0);
  assert.strictEqual(cosmicPower.precision, true);
  assert.strictEqual(cosmicPower.categorie, "statut");

  const aerialAce = parCle.AERIAL_ACE;
  assert.ok(aerialAce, "AERIAL_ACE must exist");
  assert.strictEqual(aerialAce.puissance, 60);
  assert.strictEqual(aerialAce.precision, true);
  assert.strictEqual(aerialAce.categorie, "physique");

  const leafBlade = parCle.LEAF_BLADE;
  assert.ok(leafBlade, "LEAF_BLADE must exist");
  assert.strictEqual(leafBlade.puissance, 70, "LEAF_BLADE Gen 3 power must be 70 (not 90)");
  assert.strictEqual(leafBlade.precision, 100);
  assert.strictEqual(leafBlade.categorie, "special", "LEAF_BLADE in Gen 3 is Grass (special)");

  const dive = parCle.DIVE;
  assert.ok(dive, "DIVE must exist");
  assert.strictEqual(dive.puissance, 60, "DIVE Gen 3 power must be 60 (not 80)");
  assert.strictEqual(dive.precision, 100);
  assert.strictEqual(dive.categorie, "special", "DIVE in Gen 3 is Water (special)");

  const doomDesire = parCle.DOOM_DESIRE;
  assert.ok(doomDesire, "DOOM_DESIRE must exist");
  assert.strictEqual(doomDesire.puissance, 120, "DOOM_DESIRE Gen 3 power must be 120 (not 140)");
  assert.strictEqual(doomDesire.precision, 85, "DOOM_DESIRE Gen 3 precision must be 85 (not 100)");
  assert.strictEqual(doomDesire.categorie, "physique", "DOOM_DESIRE in Gen 3 is Steel (physique)");

  const stockpile = parCle.STOCKPILE;
  assert.ok(stockpile, "STOCKPILE must exist");
  assert.strictEqual(stockpile.puissance, 0);
  assert.strictEqual(stockpile.precision, true);
  assert.strictEqual(stockpile.pp, 20);
  assert.strictEqual(stockpile.categorie, "statut");

  const willOWisp = parCle.WILL_O_WISP;
  assert.ok(willOWisp, "WILL_O_WISP must exist");
  assert.strictEqual(willOWisp.puissance, 0);
  assert.strictEqual(willOWisp.precision, 85);
  assert.strictEqual(willOWisp.categorie, "statut");
});

console.log(`\n\x1b[32mAll ${passed}/${total} Showdown combat UI tests completed!\x1b[0m\n`);
