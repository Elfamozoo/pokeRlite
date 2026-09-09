/**
 * tests/run_all_tests.mjs
 * Comprehensive automated test suite for Road to Legends — Mode Pokémon.
 *
 * Verifies:
 *  1. ordre.js module architecture, script lists, and dependency order.
 *  2. Strict pure NOYAU execution in isolated Node.js environment (zero window/document).
 *  3. Static analysis: zero unauthorized non-deterministic calls (Math.random, Date.now, etc.) in executable code.
 *  4. Static analysis: zero DOM/browser global leaks in NOYAU business logic.
 *  5. PRNG determinism contract (mulberry32), string hashing, draw accounting, and combinatorial unranking.
 *  6. Combat simulation determinism and replay engine daily scoring parity.
 *  7. Manifest and PWA theme color configuration.
 *  8. UI combat capture timeout tracking and lifecycle cleanup.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// ── Test Runner Utilities ───────────────────────────────────────────────────

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const startTime = Date.now();

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

// Strip JS comments (single-line // and multi-line /* ... */)
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n\r]*/g, "");
}

// Helper to evaluate scripts in an isolated sandbox context
function createIsolatedContext(customGlobals = {}) {
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
    ...customGlobals,
  };
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

function loadScriptInContext(filePath, context) {
  const code = fs.readFileSync(path.join(ROOT_DIR, filePath), "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: ordre.js Architecture & File Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Module Architecture & ordre.js Dependency Graph");

let ordreContext;
test("ordre.js evaluates cleanly in isolated context without DOM/window", () => {
  ordreContext = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreContext);
  assert.ok(ordreContext.POKE_ORDRE_NOYAU, "POKE_ORDRE_NOYAU must be defined");
  assert.ok(ordreContext.POKE_ORDRE_ECRANS, "POKE_ORDRE_ECRANS must be defined");
  assert.ok(ordreContext.POKE_ORDRE_GEN2, "POKE_ORDRE_GEN2 must be defined");
  assert.ok(ordreContext.POKE_ORDRE_GEN2_ECRANS, "POKE_ORDRE_GEN2_ECRANS must be defined");
});

test("POKE_ORDRE_GEN2 contains pure logic/data and NO sound files", () => {
  const gen2 = ordreContext.POKE_ORDRE_GEN2;
  assert.ok(Array.isArray(gen2), "POKE_ORDRE_GEN2 must be an array");
  assert.ok(!gen2.includes("js/poke/gen2/sons.js"), "gen2/sons.js must NOT be in GEN2 (NOYAU)");
  assert.ok(!gen2.includes("js/poke/gen2/sons-attaques.js"), "gen2/sons-attaques.js must NOT be in GEN2 (NOYAU)");
});

test("POKE_ORDRE_GEN2_ECRANS contains sound and animation presentation files", () => {
  const gen2Ecrans = ordreContext.POKE_ORDRE_GEN2_ECRANS;
  assert.ok(Array.isArray(gen2Ecrans), "POKE_ORDRE_GEN2_ECRANS must be an array");
  assert.ok(gen2Ecrans.includes("js/poke/gen2/sons.js"), "gen2/sons.js must be in GEN2_ECRANS");
  assert.ok(gen2Ecrans.includes("js/poke/gen2/sons-attaques.js"), "gen2/sons-attaques.js must be in GEN2_ECRANS");
  assert.ok(gen2Ecrans.includes("js/poke/gen2/animations.js"), "gen2/animations.js must be in GEN2_ECRANS");
  assert.ok(gen2Ecrans.includes("js/poke/gen2/anim-attaque.js"), "gen2/anim-attaque.js must be in GEN2_ECRANS");
});

test("Zero intersection between NOYAU and ECRANS file lists", () => {
  const noyau = new Set(ordreContext.POKE_ORDRE_NOYAU);
  const ecrans = new Set(ordreContext.POKE_ORDRE_ECRANS);
  for (const f of ecrans) {
    assert.ok(!noyau.has(f), `File ${f} exists in both NOYAU and ECRANS!`);
  }
});

test("All files in NOYAU, ECRANS, GEN2, and GEN2_ECRANS exist on disk", () => {
  const allFiles = [
    ...ordreContext.POKE_ORDRE_NOYAU,
    ...ordreContext.POKE_ORDRE_ECRANS,
    ...ordreContext.POKE_ORDRE_GEN2,
    ...ordreContext.POKE_ORDRE_GEN2_ECRANS,
  ];
  for (const relPath of allFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Referenced file does not exist on disk: ${relPath}`);
  }
});

test("NOYAU dependency ordering is strictly preserved", () => {
  const noyau = ordreContext.POKE_ORDRE_NOYAU;
  const idxRng = noyau.indexOf("js/poke/rng.js");
  const idxGenre = noyau.indexOf("js/poke/genre.js");
  const idxTypes = noyau.indexOf("js/poke/types.js");
  const idxRegles = noyau.indexOf("js/poke/regles.js");
  const idxEspeces = noyau.indexOf("js/poke/especes.js");
  const idxCombat = noyau.indexOf("js/poke/combat.js");
  const idxPartie = noyau.indexOf("js/poke/partie.js");
  const idxRejeu = noyau.indexOf("js/poke/rejeu.js");

  assert.ok(idxRng < idxGenre, "rng.js must precede genre.js");
  assert.ok(idxGenre < idxTypes, "genre.js must precede types.js");
  assert.ok(idxTypes < idxRegles, "types.js must precede regles.js");
  assert.ok(idxRegles < idxEspeces, "regles.js must precede especes.js");
  assert.ok(idxEspeces < idxCombat, "especes.js must precede combat.js");
  assert.ok(idxCombat < idxPartie, "combat.js must precede partie.js");
  assert.ok(idxPartie < idxRejeu, "partie.js must precede rejeu.js");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Strict Pure NOYAU Execution in Isolated Node.js Context
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Isolated Headless NOYAU Execution (No window / No DOM)");

let noyauContext;
test("Evaluate entire NOYAU stack without window / document pre-aliasing", () => {
  noyauContext = createIsolatedContext();
  assert.equal(typeof noyauContext.window, "undefined", "window must be undefined");
  assert.equal(typeof noyauContext.document, "undefined", "document must be undefined");

  const noyauFiles = ordreContext.POKE_ORDRE_NOYAU;
  for (const f of noyauFiles) {
    try {
      loadScriptInContext(f, noyauContext);
    } catch (e) {
      throw new Error(`Failed loading pure NOYAU file '${f}' in isolated context: ${e.message}`);
    }
  }
});

test("Fixed IIFE trailers (serments.js, chasses.js, sceaux.js) export cleanly to globalThis", () => {
  assert.ok(noyauContext.PokeSerments, "PokeSerments must be defined on globalThis");
  assert.equal(typeof noyauContext.PokeSerments.effet, "function", "PokeSerments.effet must be a function");
  assert.equal(typeof noyauContext.PokeSerments.offrir, "function", "PokeSerments.offrir must be a function");

  assert.ok(noyauContext.PokeChasses, "PokeChasses must be defined on globalThis");
  assert.equal(typeof noyauContext.PokeChasses.evaluer, "function", "PokeChasses.evaluer must be a function");
  assert.equal(typeof noyauContext.PokeChasses.sermentsOuverts, "function", "PokeChasses.sermentsOuverts must be a function");

  assert.ok(noyauContext.PokeSceaux, "PokeSceaux must be defined on globalThis");
  assert.equal(typeof noyauContext.PokeSceaux.appliquer, "function", "PokeSceaux.appliquer must be a function");
});

test("All expected NOYAU APIs and registries are fully exported", () => {
  assert.ok(noyauContext.PokeHasard, "PokeHasard must be exported");
  assert.ok(noyauContext.PokeChoix, "PokeChoix must be exported");
  assert.ok(noyauContext.PokeGenre, "PokeGenre must be exported");
  assert.ok(noyauContext.POKE_TYPES, "POKE_TYPES must be exported");
  assert.ok(noyauContext.POKE_TYPE_TABLE, "POKE_TYPE_TABLE must be exported");
  assert.ok(noyauContext.PokeRegles, "PokeRegles must be exported");
  assert.ok(noyauContext.POKE_ATTAQUES, "POKE_ATTAQUES must be exported");
  assert.ok(noyauContext.POKE_ESPECES, "POKE_ESPECES must be exported");
  assert.ok(noyauContext.POKE_ETAPES, "POKE_ETAPES must be exported");
  assert.ok(noyauContext.POKE_CLES, "POKE_CLES must be exported");
  assert.ok(noyauContext.PokeMoteur, "PokeMoteur must be exported");
  assert.ok(noyauContext.PokeCombat, "PokeCombat must be exported");
  assert.ok(noyauContext.PokeCapture, "PokeCapture must be exported");
  assert.ok(noyauContext.PokeActes, "PokeActes must be exported");
  assert.ok(noyauContext.PokePartie, "PokePartie must be exported");
  assert.ok(noyauContext.PokeRejeu, "PokeRejeu must be exported");
  assert.equal(typeof noyauContext.replayDaily, "function", "root replayDaily must be exported");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Static Analysis — Zero Unauthorized Non-Determinism & Zero DOM Leaks
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Static Analysis — Zero Non-Deterministic Calls & Zero DOM Leaks in NOYAU");

const noyauList = ordreContext.POKE_ORDRE_NOYAU;

test("Zero occurrences of Math.random(), Date.now(), new Date(), performance.now() across all NOYAU code", () => {
  const forbiddenPatterns = [
    { pattern: /\bMath\.random\s*\(/g, name: "Math.random()" },
    { pattern: /\bDate\.now\s*\(/g, name: "Date.now()" },
    { pattern: /\bnew\s+Date\b/g, name: "new Date()" },
    { pattern: /\bperformance\.now\s*\(/g, name: "performance.now()" },
    { pattern: /\bcrypto\.getRandomValues\s*\(/g, name: "crypto.getRandomValues()" },
  ];

  const violations = [];
  for (const relPath of noyauList) {
    const rawContent = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
    const code = stripComments(rawContent);
    for (const { pattern, name } of forbiddenPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push(`${relPath}: unauthorized call to ${name} (${matches.length} matches)`);
      }
    }
  }

  assert.equal(violations.length, 0, `Forbidden non-deterministic calls found:\n${violations.join("\n")}`);
});

test("Zero DOM / browser API leaks across all NOYAU code", () => {
  const forbiddenDOM = [
    { pattern: /\bdocument\./g, name: "document." },
    { pattern: /\blocalStorage\b/g, name: "localStorage" },
    { pattern: /\bsessionStorage\b/g, name: "sessionStorage" },
    { pattern: /\bnavigator\./g, name: "navigator." },
    { pattern: /\bhistory\./g, name: "history." },
    { pattern: /\bfetch\s*\(/g, name: "fetch()" },
    { pattern: /\bXMLHttpRequest\b/g, name: "XMLHttpRequest" },
    { pattern: /\balert\s*\(/g, name: "alert()" },
    { pattern: /\bconfirm\s*\(/g, name: "confirm()" },
    { pattern: /\bprompt\s*\(/g, name: "prompt()" },
    { pattern: /\bsetTimeout\s*\(/g, name: "setTimeout()" },
    { pattern: /\bsetInterval\s*\(/g, name: "setInterval()" },
    { pattern: /\brequestAnimationFrame\s*\(/g, name: "requestAnimationFrame()" },
    { pattern: /\bHTMLElement\b/g, name: "HTMLElement" },
    { pattern: /\bAudioContext\b/g, name: "AudioContext" },
  ];

  const violations = [];
  for (const relPath of noyauList) {
    const rawContent = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
    const code = stripComments(rawContent);
    for (const { pattern, name } of forbiddenDOM) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push(`${relPath}: unauthorized DOM / browser reference to ${name} (${matches.length} matches)`);
      }
    }
  }

  assert.equal(violations.length, 0, `DOM leaks found in NOYAU:\n${violations.join("\n")}`);
});

test("All NOYAU files use strict mode ('use strict')", () => {
  const missingStrict = [];
  for (const relPath of noyauList) {
    const content = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
    if (!content.includes('"use strict";') && !content.includes("'use strict';")) {
      missingStrict.push(relPath);
    }
  }
  assert.equal(missingStrict.length, 0, `Files missing "use strict":\n${missingStrict.join("\n")}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: PRNG Determinism Contract (mulberry32) & Combinatorial Unranking
// ─────────────────────────────────────────────────────────────────────────────
suite("4. PRNG Determinism & Mulberry32 Contract Verification");

test("String hasher (graineDe) produces deterministic uint32 hashes", () => {
  const graineDe = noyauContext.pokeGraineDe;
  assert.equal(typeof graineDe, "function");

  const h1 = graineDe("POKE-JOUR-2026-08-25");
  const h2 = graineDe("POKE-JOUR-2026-08-25");
  assert.equal(h1, h2, "Same string must produce identical hash");
  assert.ok(Number.isInteger(h1) && h1 >= 0 && h1 <= 0xffffffff, "Hash must be uint32");

  const hDiff = graineDe("POKE-JOUR-2026-08-26");
  assert.notEqual(h1, hDiff, "Different strings must produce distinct hashes");
});

test("Mulberry32 PRNG output is bit-identical across runs", () => {
  const Hasard = noyauContext.PokeHasard;
  const h1 = new Hasard("TEST-DETERMINISM-SEED");
  const h2 = new Hasard("TEST-DETERMINISM-SEED");

  for (let i = 0; i < 500; i++) {
    const r1 = h1.brut();
    const r2 = h2.brut();
    assert.equal(r1, r2, `Draw #${i} diverged: ${r1} !== ${r2}`);
  }
  assert.equal(h1.tirages, 500, "Draw counter must be exactly 500");
  assert.equal(h2.tirages, 500, "Draw counter must be exactly 500");
});

test("Draw accounting accuracy across higher-level methods", () => {
  const Hasard = noyauContext.PokeHasard;
  const h = new Hasard(42);

  assert.equal(h.tirages, 0);
  h.entier(10);
  assert.equal(h.tirages, 1, "entier() must consume exactly 1 draw");

  h.entre(5, 15);
  assert.equal(h.tirages, 2, "entre() must consume exactly 1 draw");

  h.chance(50);
  assert.equal(h.tirages, 3, "chance() must consume exactly 1 draw");

  h.pondere([{ p: 10 }, { p: 20 }, { p: 30 }], "p");
  assert.equal(h.tirages, 4, "pondere() must consume exactly 1 draw");

  const list = [1, 2, 3, 4, 5, 6];
  h.melange(list);
  assert.equal(h.tirages, 4 + (list.length - 1), "melange(N) must consume exactly N-1 draws");
});

test("PRNG derive() creates isolated deterministic sub-streams", () => {
  const Hasard = noyauContext.PokeHasard;
  const parent1 = new Hasard("PARENT-SEED");
  const parent2 = new Hasard("PARENT-SEED");

  const child1 = parent1.derive("subsystem-a");
  const child2 = parent2.derive("subsystem-a");

  assert.equal(parent1.tirages, 0, "derive() must not advance parent tirages");
  assert.equal(parent2.tirages, 0, "derive() must not advance parent tirages");

  for (let i = 0; i < 50; i++) {
    assert.equal(child1.brut(), child2.brut(), `Child stream draw #${i} mismatch`);
  }
});

test("Combinatorial unranking (PokeChoix.deRang) is an exact bijective unranking", () => {
  const Choix = noyauContext.PokeChoix;
  const items = ["A", "B", "C", "D", "E", "F"];
  const n = items.length; // 6
  const k = 3;            // Choose 3 => 20 combinations

  const total = Choix.combien(n, k);
  assert.equal(total, 20, `C(6, 3) must be 20, got ${total}`);

  const seen = new Set();
  for (let rank = 0; rank < total; rank++) {
    const subset = Choix.deRang(items, rank, k);
    assert.equal(subset.length, k, `Subset length must be ${k}`);
    const key = subset.join(",");
    assert.ok(!seen.has(key), `Duplicate subset generated for rank ${rank}: ${key}`);
    seen.add(key);
  }
  assert.equal(seen.size, 20, "All 20 unique combinations must be covered without collision");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Combat Simulation & Replay Engine Scoring Parity
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Combat Simulation Determinism & Replay Engine Parity");

test("Deterministic game session state creation from seed", () => {
  const Partie = noyauContext.PokePartie;
  const Hasard = noyauContext.PokeHasard;

  const session1 = Partie.creer({ graine: "POKE-JOUR-2026-08-25" }, new Hasard("POKE-JOUR-2026-08-25"));
  const session2 = Partie.creer({ graine: "POKE-JOUR-2026-08-25" }, new Hasard("POKE-JOUR-2026-08-25"));

  assert.equal(session1.version, session2.version, "Version must be identical");
  assert.equal(session1.graine, session2.graine, "Seed must be identical");
  assert.deepEqual(session1.visite, session2.visite, "Visited map state must be identical");
  assert.equal(session1.argent, session2.argent, "Initial money must be identical");
});

test("Turn-by-turn combat simulation reproduces identical events across independent runs", () => {
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;

  function runSimulatedBattle() {
    const h = new Hasard("BATTLE-REPLAY-SEED-777");
    // Team 1: Pikachu (id 25) lvl 20
    const pikachu = Moteur.creer(25, 20, h);
    // Team 2: Squirtle (id 7) lvl 20
    const squirtle = Moteur.creer(7, 20, h);

    const combatState = Combat.demarrer(
      [pikachu],
      [squirtle],
      { graine: "BATTLE-REPLAY-SEED-777", dresseur: false },
      h
    );

    const eventsLog = [];
    let rounds = 0;
    while (!combatState.fini && rounds < 20) {
      rounds++;
      const actionJoueur = { type: "attaque", index: 0 };
      const actionAdverse = { type: "attaque", index: 0 };
      const ev = Combat.jouerTour(combatState, actionJoueur, h, actionAdverse);
      eventsLog.push({ round: rounds, ev });
    }
    return { combatState, eventsLog, finalTirages: h.tirages };
  }

  const run1 = runSimulatedBattle();
  const run2 = runSimulatedBattle();

  assert.equal(run1.finalTirages, run2.finalTirages, "Total PRNG draws must match exactly");
  assert.equal(run1.combatState.fini, run2.combatState.fini, "Final combat result must match");
  assert.deepEqual(run1.eventsLog, run2.eventsLog, "Turn-by-turn event logs must be 100% identical");
});

test("PokeRejeu.replayDaily produces deterministic scoring parity", () => {
  const replayDaily = noyauContext.replayDaily;
  assert.equal(typeof replayDaily, "function");

  const sampleJournal = [
    {
      badges: 4,
      acte: 5,
      vus: 45,
      pris: 22,
      legendaires: 0,
      ligue: 0,
      equipe: [
        { n: 25, niveau: 38, pv: 100, stats: { pv: 100 } },
        { n: 6, niveau: 40, pv: 120, stats: { pv: 120 } },
        { n: 130, niveau: 39, pv: 130, stats: { pv: 130 } },
      ],
      duree: 650,
      quand: 1771980000000,
    },
  ];

  const result1 = replayDaily("2026-08-25", sampleJournal, { device: "dev-test-123" });
  const result2 = replayDaily("2026-08-25", sampleJournal, { device: "dev-test-123" });

  assert.ok(result1, "replayDaily must return a result object");
  assert.equal(result1.score, result2.score, `Scores must be identical: ${result1.score} !== ${result2.score}`);
  assert.equal(result1.name, result2.name, `Generated trainer names must match: ${result1.name} !== ${result2.name}`);
  assert.ok(result1.score > 0, "Score should be positive for valid progression");
});

test("PokeRejeu enforces level caps and bounds impossible submissions", () => {
  const normaliser = noyauContext.PokeRejeu.normaliser;
  const LIMITES = noyauContext.PokeRejeu.LIMITES;

  const forgedJournal = {
    badges: 99, // Impossible: max 8
    acte: 50,   // Impossible: max 9
    vus: 999,   // Impossible: max 151
    pris: 1000, // Impossible: > vus
    equipe: [
      { n: 25, niveau: 150 }, // Over level 100
      { n: 26, niveau: 150 },
    ],
  };

  const bounded = normaliser(forgedJournal, "2026-08-25");
  assert.ok(bounded.badges <= LIMITES.badges, `Badges must be capped at ${LIMITES.badges}`);
  assert.ok(bounded.acte <= LIMITES.acte, `Acte must be capped at ${LIMITES.acte}`);
  assert.ok(bounded.pris <= bounded.vus, "Prises cannot exceed species seen");
  assert.ok(bounded.equipe.every(m => m.niveau <= 100), "Team levels must be capped <= 100");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6: Manifest & PWA Configuration Integrity
// ─────────────────────────────────────────────────────────────────────────────
suite("6. Manifest & PWA Configuration");

test("manifest.json has background_color and theme_color set to #0d1420", () => {
  const manifestRaw = fs.readFileSync(path.join(ROOT_DIR, "manifest.json"), "utf-8");
  const manifest = JSON.parse(manifestRaw);

  assert.equal(manifest.background_color, "#0d1420", "manifest.json background_color must be #0d1420");
  assert.equal(manifest.theme_color, "#0d1420", "manifest.json theme_color must be #0d1420");
});

test("index.html theme-color meta tag matches #0d1420", () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, "index.html"), "utf-8");
  assert.ok(
    indexHtml.includes('<meta name="theme-color" content="#0d1420">'),
    "index.html must have theme-color meta set to #0d1420"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7: UI Combat Capture Animation Lifecycle & Timeout Cleanup
// ─────────────────────────────────────────────────────────────────────────────
suite("7. UI Combat Capture Timeout Tracking & Lifecycle Cleanup");

function createMockElement(tag = "div") {
  const attrs = new Map();
  const classes = new Set();
  const children = [];
  const styleProps = new Map();
  let _firstChild = null;

  const el = {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: "",
    textContent: "",
    parentNode: { removeChild: () => {} },
    get firstChild() {
      if (!_firstChild && children.length > 0) return children[0];
      if (!_firstChild) _firstChild = createMockElement("i");
      return _firstChild;
    },
    set firstChild(val) {
      _firstChild = val;
    },
    getAttribute: (name) => attrs.get(name) || null,
    setAttribute: (name, val) => attrs.set(name, String(val)),
    removeAttribute: (name) => attrs.delete(name),
    hasAttribute: (name) => attrs.has(name),
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    appendChild: (child) => {
      children.push(child);
      if (!_firstChild) _firstChild = child;
      return child;
    },
    remove: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    style: {
      setProperty: (k, v) => styleProps.set(k, v),
      getPropertyValue: (k) => styleProps.get(k) || "",
    },
    querySelector: (sel) => {
      return createMockElement(sel && sel.includes("img") ? "img" : "div");
    },
    querySelectorAll: () => [],
  };
  return el;
}

test("ui-combat.js defines minuteursCapture and cleanup methods on Ecran.prototype", () => {
  const mockContext = createIsolatedContext({
    document: { createElement: (tag) => createMockElement(tag) },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  });

  // Pre-load required NOYAU dependencies in mock context
  for (const f of ordreContext.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, mockContext);
  }
  loadScriptInContext("js/poke/tempo.js", mockContext);
  loadScriptInContext("js/poke/icones.js", mockContext);
  loadScriptInContext("js/poke/ui-combat.js", mockContext);

  const Ecran = mockContext.PokeUICombat.Ecran;
  assert.ok(Ecran, "PokeUICombat.Ecran must exist");
  assert.equal(typeof Ecran.prototype.nettoyerMinuteursCapture, "function", "nettoyerMinuteursCapture must be a method");
  assert.equal(typeof Ecran.prototype.detruire, "function", "detruire must be a method");
  assert.equal(typeof Ecran.prototype.animerCapture, "function", "animerCapture must be a method");
  assert.equal(typeof Ecran.prototype.terminer, "function", "terminer must be a method");
});

test("animerCapture tracks timeouts and terminer()/detruire() cancels all pending timers", () => {
  const clearedTimerIds = [];
  let timerSeq = 100;
  const activeTimers = new Map();

  const mockContext = createIsolatedContext({
    document: { createElement: (tag) => createMockElement(tag) },
    setTimeout: (fn, ms) => {
      const id = ++timerSeq;
      activeTimers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => {
      clearedTimerIds.push(id);
      activeTimers.delete(id);
    },
  });

  for (const f of ordreContext.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, mockContext);
  }
  loadScriptInContext("js/poke/tempo.js", mockContext);
  loadScriptInContext("js/poke/icones.js", mockContext);
  loadScriptInContext("js/poke/ui-combat.js", mockContext);

  const Ecran = mockContext.PokeUICombat.Ecran;
  const mockHote = createMockElement("div");

  const dummyState = {
    joueur: { equipe: [{ n: 25, pv: 50, stats: { pv: 50 } }], actif: 0 },
    adverse: { equipe: [{ n: 16, pv: 10, stats: { pv: 30 } }], actif: 0 },
    fini: null,
  };

  const ecran = new Ecran(mockHote, dummyState, { hasard: new mockContext.PokeHasard(1), rythme: 900 });
  assert.ok(Array.isArray(ecran.minuteursCapture), "minuteursCapture array must be initialized");

  // Trigger animerCapture
  ecran.animerCapture({ secousses: 3, pris: true });

  assert.ok(ecran.minuteursCapture.length > 0, `Capture timers must be tracked, got ${ecran.minuteursCapture.length}`);
  const initialCount = ecran.minuteursCapture.length;

  // Now terminate combat
  dummyState.fini = "victoire";
  ecran.terminer();

  assert.equal(ecran.minuteursCapture.length, 0, "minuteursCapture must be empty after terminer()");
  assert.equal(clearedTimerIds.length, initialCount, `All ${initialCount} capture timers must have been cleared`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Final Summary & Exit
// ─────────────────────────────────────────────────────────────────────────────
const durationMs = Date.now() - startTime;
console.log(`\n\x1b[1m\x1b[35m------------------------------------------------------------\x1b[0m`);
console.log(`\x1b[1mTest Run Completed in ${durationMs}ms\x1b[0m`);
console.log(`Total Tests: \x1b[1m${totalTests}\x1b[0m | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m`);

if (failedTests > 0) {
  console.log(`\n\x1b[31m\x1b[1mFAILURES:\x1b[0m`);
  for (const { name, err } of failures) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m`);
    console.log(`    ${err.message}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m\x1b[1mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n`);
  process.exit(0);
}
