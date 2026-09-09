/**
 * tests/run_all_tests.mjs
 * Comprehensive automated test suite for Road to Legends — Mode Pokémon.
 *
 * Verifies:
 *  1. ordre.js module architecture, script lists, and dependency order (Gen 1, Gen 2, Gen 3).
 *  2. Strict pure NOYAU execution in isolated Node.js environment (zero window/document) for Gen 1, Gen 2, Gen 3.
 *  3. Static analysis: zero unauthorized non-deterministic calls (Math.random, Date.now, etc.) in executable code.
 *  4. Static analysis: zero DOM/browser global leaks in NOYAU business logic and Gen 3 core files.
 *  5. PRNG determinism contract (mulberry32), string hashing, draw accounting, and combinatorial unranking.
 *  6. Combat simulation determinism and replay engine daily scoring parity across Gen 1, Gen 2, and Gen 3.
 *  7. Manifest and PWA theme color configuration.
 *  8. UI combat capture timeout tracking and lifecycle cleanup.
 *  9. Gen 3 (Hoenn) species completeness, 9-act roguelite structure, boss reachability, and legendary mapping.
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
  assert.ok(ordreContext.POKE_ORDRE_GEN3, "POKE_ORDRE_GEN3 must be defined");
  assert.ok(ordreContext.POKE_ORDRE_GEN3_ECRANS, "POKE_ORDRE_GEN3_ECRANS must be defined");
  assert.strictEqual(ordreContext.POKE_HOENN_ETAT, "ouvert", "POKE_HOENN_ETAT must be 'ouvert'");
  assert.strictEqual(ordreContext.POKE_BANC_HOENN, true, "POKE_BANC_HOENN must be true");
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

test("POKE_ORDRE_GEN3 contains pure logic/data and NO sound/animation files", () => {
  const gen3 = ordreContext.POKE_ORDRE_GEN3;
  assert.ok(Array.isArray(gen3), "POKE_ORDRE_GEN3 must be an array");
  assert.strictEqual(gen3.length, 14, "POKE_ORDRE_GEN3 must contain exactly 14 files");
  for (const f of gen3) {
    assert.ok(!f.includes("sons"), `File ${f} must NOT be in GEN3 (NOYAU)`);
    assert.ok(!f.includes("anim"), `File ${f} must NOT be in GEN3 (NOYAU)`);
  }
});

test("POKE_ORDRE_GEN3_ECRANS contains sound presentation files", () => {
  const gen3Ecrans = ordreContext.POKE_ORDRE_GEN3_ECRANS;
  assert.ok(Array.isArray(gen3Ecrans), "POKE_ORDRE_GEN3_ECRANS must be an array");
  assert.ok(gen3Ecrans.includes("js/poke/gen3/sons.js"), "gen3/sons.js must be in GEN3_ECRANS");
});

test("Zero intersection between NOYAU and ECRANS file lists", () => {
  const noyau = new Set(ordreContext.POKE_ORDRE_NOYAU);
  const ecrans = new Set(ordreContext.POKE_ORDRE_ECRANS);
  for (const f of ecrans) {
    assert.ok(!noyau.has(f), `File ${f} exists in both NOYAU and ECRANS!`);
  }
});

test("All files in NOYAU, ECRANS, GEN2, GEN2_ECRANS, GEN3, and GEN3_ECRANS exist on disk", () => {
  const allFiles = [
    ...ordreContext.POKE_ORDRE_NOYAU,
    ...ordreContext.POKE_ORDRE_ECRANS,
    ...ordreContext.POKE_ORDRE_GEN2,
    ...ordreContext.POKE_ORDRE_GEN2_ECRANS,
    ...ordreContext.POKE_ORDRE_GEN3,
    ...ordreContext.POKE_ORDRE_GEN3_ECRANS,
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
  const idxGen3Types = noyau.indexOf("js/poke/gen3/types.js");
  const idxRegles = noyau.indexOf("js/poke/regles.js");
  const idxEspeces = noyau.indexOf("js/poke/especes.js");
  const idxCombat = noyau.indexOf("js/poke/combat.js");
  const idxPartie = noyau.indexOf("js/poke/partie.js");
  const idxRejeu = noyau.indexOf("js/poke/rejeu.js");

  assert.ok(idxRng < idxGenre, "rng.js must precede genre.js");
  assert.ok(idxGenre < idxTypes, "genre.js must precede types.js");
  assert.ok(idxTypes < idxGen3Types, "types.js must precede gen3/types.js");
  assert.ok(idxGen3Types < idxRegles, "gen3/types.js must precede regles.js");
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

test("All expected NOYAU APIs, registries, and Gen 3 globals are fully exported", () => {
  // Gen 1 & Core APIs
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

  // Gen 3 Globals
  assert.ok(noyauContext.POKE_GEN3_ESPECES, "POKE_GEN3_ESPECES must be exported");
  assert.ok(noyauContext.POKE_GEN3_ATTAQUES, "POKE_GEN3_ATTAQUES must be exported");
  assert.ok(noyauContext.POKE_GEN3_ARENES, "POKE_GEN3_ARENES must be exported");
  assert.ok(noyauContext.POKE_GEN3_ETAPES, "POKE_GEN3_ETAPES must be exported");
  assert.ok(noyauContext.POKE_GEN3_ZONES, "POKE_GEN3_ZONES must be exported");
  assert.ok(noyauContext.POKE_GEN3_LIEUX, "POKE_GEN3_LIEUX must be exported");
  assert.ok(noyauContext.POKE_GEN3_CLES, "POKE_GEN3_CLES must be exported");
  assert.ok(noyauContext.POKE_GEN3_OBJETS, "POKE_GEN3_OBJETS must be exported");

  // PokeRegles Gen 3 Profile
  assert.strictEqual(noyauContext.PokeRegles.existe("gen3"), true, "PokeRegles must recognize 'gen3'");
  const g3 = noyauContext.PokeRegles.pour("gen3");
  assert.ok(g3, "PokeRegles.pour('gen3') must return JEUX.gen3 profile");
  assert.strictEqual(g3.dexTotal, 386, "Gen 3 dexTotal must be 386");
  assert.strictEqual(g3.nom, "Troisième génération");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Static Analysis — Zero Unauthorized Non-Determinism & Zero DOM Leaks
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Static Analysis — Zero Non-Deterministic Calls & Zero DOM Leaks in NOYAU & Gen 3");

const noyauList = ordreContext.POKE_ORDRE_NOYAU;
const gen3Files = fs.readdirSync(path.join(ROOT_DIR, "js/poke/gen3"))
  .filter((f) => f.endsWith(".js"))
  .map((f) => `js/poke/gen3/${f}`);

test("Zero occurrences of Math.random(), Date.now(), new Date(), performance.now() across NOYAU and Gen 3", () => {
  const forbiddenPatterns = [
    { pattern: /\bMath\.random\s*\(/g, name: "Math.random()" },
    { pattern: /\bDate\.now\s*\(/g, name: "Date.now()" },
    { pattern: /\bnew\s+Date\b/g, name: "new Date()" },
    { pattern: /\bperformance\.now\s*\(/g, name: "performance.now()" },
    { pattern: /\bcrypto\.getRandomValues\s*\(/g, name: "crypto.getRandomValues()" },
  ];

  const filesToCheck = Array.from(new Set([...noyauList, ...gen3Files]));
  const violations = [];
  for (const relPath of filesToCheck) {
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

test("Zero DOM / browser API leaks across all NOYAU and Gen 3 files", () => {
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

  const filesToCheck = Array.from(new Set([...noyauList, ...gen3Files]));
  const violations = [];
  for (const relPath of filesToCheck) {
    const rawContent = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
    const code = stripComments(rawContent);
    for (const { pattern, name } of forbiddenDOM) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push(`${relPath}: unauthorized DOM / browser reference to ${name} (${matches.length} matches)`);
      }
    }
  }

  assert.equal(violations.length, 0, `DOM leaks found in NOYAU / Gen 3:\n${violations.join("\n")}`);
});

test("All NOYAU and Gen 3 files use strict mode ('use strict')", () => {
  const filesToCheck = Array.from(new Set([...noyauList, ...gen3Files]));
  const missingStrict = [];
  for (const relPath of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT_DIR, relPath), "utf-8");
    if (!content.includes('"use strict";') && !content.includes("'use strict';") && !content.includes('"use strict"') && !content.includes("'use strict'")) {
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

test("Mulberry32 PRNG determinism holds across Gen 1, Gen 2, and Gen 3 seeds", () => {
  const Hasard = noyauContext.PokeHasard;
  const testSeeds = ["HOENN-SEED-2026", "JOHTO-SEED-1999", "KANTO-SEED-1996"];

  for (const seed of testSeeds) {
    const hA = new Hasard(seed);
    const hB = new Hasard(seed);
    for (let i = 0; i < 200; i++) {
      assert.strictEqual(hA.brut(), hB.brut(), `Seed ${seed} diverged at draw ${i}`);
    }
    assert.strictEqual(hA.tirages, 200);
    assert.strictEqual(hB.tirages, 200);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Combat Simulation Determinism & Replay Engine Parity
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Combat Simulation Determinism & Replay Engine Parity");

test("Deterministic game session state creation from seed across generations", () => {
  const Partie = noyauContext.PokePartie;
  const Hasard = noyauContext.PokeHasard;

  for (const gen of ["gen1", "gen2", "gen3"]) {
    noyauContext.PokeRegles.poser(gen);
    const session1 = Partie.creer({ graine: `POKE-TEST-${gen}`, regles: gen }, new Hasard(`POKE-TEST-${gen}`));
    const session2 = Partie.creer({ graine: `POKE-TEST-${gen}`, regles: gen }, new Hasard(`POKE-TEST-${gen}`));

    assert.equal(session1.version, session2.version, `${gen}: Version must be identical`);
    assert.equal(session1.graine, session2.graine, `${gen}: Seed must be identical`);
    assert.deepEqual(session1.visite, session2.visite, `${gen}: Visited map state must be identical`);
    assert.equal(session1.argent, session2.argent, `${gen}: Initial money must be identical`);
  }
  noyauContext.PokeRegles.poser("gen1");
});

test("Turn-by-turn combat simulation reproduces identical events in Gen 1", () => {
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;

  function runSimulatedBattle() {
    Regles.poser("gen1");
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

test("Turn-by-turn combat simulation reproduces identical events in Gen 2", () => {
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;

  function runSimulatedGen2Battle() {
    Regles.poser("gen2");
    const h = new Hasard("BATTLE-REPLAY-SEED-GEN2");
    // Cyndaquil (#155) lv 20 vs Totodile (#158) lv 20
    const cyndaquil = Moteur.creer(155, 20, h);
    const totodile = Moteur.creer(158, 20, h);

    const combatState = Combat.demarrer(
      [cyndaquil],
      [totodile],
      { graine: "BATTLE-REPLAY-SEED-GEN2", dresseur: false },
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
    Regles.poser("gen1");
    return { combatState, eventsLog, finalTirages: h.tirages };
  }

  const run1 = runSimulatedGen2Battle();
  const run2 = runSimulatedGen2Battle();

  assert.equal(run1.finalTirages, run2.finalTirages, "Gen 2 PRNG draws must match exactly");
  assert.equal(run1.combatState.fini, run2.combatState.fini, "Gen 2 combat result must match");
  assert.deepEqual(run1.eventsLog, run2.eventsLog, "Gen 2 events must be 100% identical");
});

test("Turn-by-turn combat simulation reproduces identical events in Gen 3", () => {
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;

  function runSimulatedGen3Battle() {
    Regles.poser("gen3");
    const h = new Hasard("BATTLE-REPLAY-SEED-GEN3");
    // Treecko (#252) lv 5 vs Torchic (#255) lv 5 fighting with natural learnset
    const treecko = Moteur.creer(252, 5, h);
    const torchic = Moteur.creer(255, 5, h);

    const combatState = Combat.demarrer(
      [treecko],
      [torchic],
      { graine: "BATTLE-REPLAY-SEED-GEN3", dresseur: false },
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
    Regles.poser("gen1");
    return { combatState, eventsLog, finalTirages: h.tirages };
  }

  const run1 = runSimulatedGen3Battle();
  const run2 = runSimulatedGen3Battle();

  assert.equal(run1.finalTirages, run2.finalTirages, "Gen 3 PRNG draws must match exactly");
  assert.equal(run1.combatState.fini, run2.combatState.fini, "Gen 3 combat result must match");
  assert.deepEqual(run1.eventsLog, run2.eventsLog, "Gen 3 events must be 100% identical");
});

test("Cross-generational non-regression: Gen 1 combat replay invariance after Gen 3 execution", () => {
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;

  function runSimulatedGen1Battle() {
    Regles.poser("gen1");
    const h = new Hasard("BATTLE-REPLAY-SEED-777");
    const pikachu = Moteur.creer(25, 20, h);
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

  const run1 = runSimulatedGen1Battle();

  // Execute Gen 3 code in-between to stress cross-generational state isolation
  Regles.poser("gen3");
  const h3 = new Hasard("INTERLEAVED-GEN3");
  const t = Moteur.creer(252, 5, h3);
  assert.ok(t && t.n === 252 && t.stats, "Gen 3 Treecko must instantiate cleanly");

  // Re-run Gen 1 simulation
  const run2 = runSimulatedGen1Battle();

  assert.ok(run1.combatState.fini, "Combat 1 must finish");
  assert.ok(run2.combatState.fini, "Combat 2 must finish");
  assert.ok(run1.finalTirages > 0, "PRNG draws must have occurred");
  assert.equal(run1.finalTirages, run2.finalTirages, "Gen 1 PRNG draws must match bit-identically after Gen 3 execution");
  assert.equal(run1.combatState.fini, run2.combatState.fini, "Gen 1 combat result must match after Gen 3 execution");
  assert.deepEqual(run1.eventsLog, run2.eventsLog, "Gen 1 combat events must be 100% bit-identical after Gen 3 execution");
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
// Suite 8: Gen 3 (Hoenn) Completeness & Progression Validation
// ─────────────────────────────────────────────────────────────────────────────
suite("8. Gen 3 (Hoenn) Completeness & Progression Validation");

test("All 135 species (252-386) have 6 valid base stats, valid capture rates, and valid types", () => {
  const especes = noyauContext.POKE_GEN3_ESPECES;
  assert.strictEqual(especes.length, 135, "Must contain exactly 135 Gen 3 species");
  const validTypes = new Set(noyauContext.POKE_GEN3_TYPES);

  for (let i = 0; i < especes.length; i++) {
    const p = especes[i];
    const expectedId = 252 + i;
    assert.strictEqual(p.n, expectedId, `Species id mismatch: expected ${expectedId}, got ${p.n}`);
    assert.ok(p.nom && p.nom.fr && p.nom.en, `Species ${p.n} missing bilingual name`);

    // Base stats: 6 positive integers
    assert.ok(p.base, `Species ${p.n} missing base stats`);
    for (const s of ["pv", "atk", "def", "vit", "sat", "sdf"]) {
      assert.ok(
        typeof p.base[s] === "number" && p.base[s] > 0 && Number.isInteger(p.base[s]),
        `Species ${p.n} invalid base stat '${s}': ${p.base[s]}`
      );
    }

    // Capture rate
    const captureRate = typeof p.capture === "number" ? p.capture : p.taux;
    assert.ok(typeof captureRate === "number" && captureRate > 0, `Species ${p.n} invalid capture rate: ${captureRate}`);

    // Pre-Gen 6 types (no fairy type)
    assert.ok(Array.isArray(p.types) && p.types.length >= 1 && p.types.length <= 2, `Species ${p.n} invalid types array`);
    for (const t of p.types) {
      assert.ok(validTypes.has(t), `Species ${p.n} has invalid type '${t}'`);
      assert.notStrictEqual(t, "fairy", `Species ${p.n} has fairy type which did not exist in Gen 3`);
    }
  }
});

test("PokeActes.construire() generates exactly 9 acts under Gen 3", () => {
  noyauContext.PokeRegles.poser("gen3");
  const acts = noyauContext.PokeActes.construire();
  assert.ok(Array.isArray(acts), "construire() must return an array");
  assert.strictEqual(acts.length, 9, `Expected 9 acts for Hoenn, got ${acts.length}`);

  for (let i = 0; i < 8; i++) {
    assert.strictEqual(acts[i].n, i + 1, `Act ${i + 1} number mismatch`);
    assert.strictEqual(acts[i].boss, i + 1, `Act ${i + 1} boss gym mismatch`);
  }

  assert.strictEqual(acts[8].n, 9, "Act 9 must be number 9");
  assert.strictEqual(acts[8].ligue, true, "Act 9 must be ligue");
  assert.ok(acts[8].epilogue, "Act 9 must have an epilogue");

  noyauContext.PokeRegles.poser("gen1");
});

test("Steven Stone is reachable as dresseurFinal in meteor falls deep", () => {
  const etapes = noyauContext.POKE_GEN3_ETAPES;
  const stevenStep = etapes.find((e) => e.id === "site-meteore-profondeurs");
  assert.ok(stevenStep, "Step 'site-meteore-profondeurs' must exist in POKE_GEN3_ETAPES");
  assert.strictEqual(stevenStep.dresseurFinal, true, "site-meteore-profondeurs must have dresseurFinal: true");
  assert.strictEqual(stevenStep.apresLigue, true, "Steven Stone must be unlocked after Pokemon League");

  const g3 = noyauContext.PokeRegles.pour("gen3");
  const dresseurFinal = g3.dresseurFinal();
  assert.ok(dresseurFinal, "PokeRegles gen3 profile must return dresseurFinal");
  assert.strictEqual(dresseurFinal.nom, "Pierre Rochard");
  assert.strictEqual(dresseurFinal.nomFr, "Pierre Rochard");
  assert.strictEqual(dresseurFinal.nomEn, "Steven");
  assert.ok(
    Array.isArray(dresseurFinal.equipe) && dresseurFinal.equipe.length === 6,
    "Steven Stone team must contain 6 Pokemon"
  );
});

test("All 8 static legendaries and roaming duo are declared and correctly mapped", () => {
  const etapes = noyauContext.POKE_GEN3_ETAPES;
  const expectedLegendaries = [
    { n: 384, stepId: "pilier-celeste", lieu: "sky-pillar" },    // Rayquaza
    { n: 383, stepId: "grotte-terra", lieu: "terra-cave" },      // Groudon
    { n: 382, stepId: "grotte-marine", lieu: "marine-cave" },    // Kyogre
    { n: 377, stepId: "ruines-desert", lieu: "desert-ruins" },   // Regirock
    { n: 378, stepId: "grotte-ilot", lieu: "island-cave" },      // Regice
    { n: 379, stepId: "tombeau-antique", lieu: "ancient-tomb" }, // Registeel
    { n: 385, stepId: "algatia", lieu: "mossdeep-city" },        // Jirachi
    { n: 386, stepId: "ile-aurore", lieu: "birth-island" },      // Deoxys
  ];

  for (const exp of expectedLegendaries) {
    const step = etapes.find((e) => e.id === exp.stepId);
    assert.ok(step, `Step '${exp.stepId}' for legendary #${exp.n} must exist`);
    assert.strictEqual(step.legendaire, exp.n, `Step '${exp.stepId}' must declare legendary #${exp.n}`);
    assert.strictEqual(step.lieu, exp.lieu, `Step '${exp.stepId}' lieu mismatch`);
  }

  // Roaming duo
  const errants = noyauContext.POKE_GEN3_ERRANTS;
  assert.ok(errants, "POKE_GEN3_ERRANTS must be defined");
  const roamerSpecies = Array.isArray(errants)
    ? errants
    : (errants.liste ? errants.liste.map((x) => x.n) : errants.especes);
  assert.ok(roamerSpecies.includes(380), "Latias (#380) must be declared in roamers");
  assert.ok(roamerSpecies.includes(381), "Latios (#381) must be declared in roamers");

  // Sealed Chamber unlocking Regis
  const sealedStep = etapes.find((e) => e.id === "chambre-scellee");
  assert.ok(sealedStep, "Step 'chambre-scellee' must exist in POKE_GEN3_ETAPES");
  assert.strictEqual(sealedStep.apresLigue, true);
});

test("All Gym Leaders, Elite Four, Wallace, and Steven teams instantiate via PokeMoteur.creer without throwing", () => {
  const Regles = noyauContext.PokeRegles;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const h = new Hasard("TEAMS-INSTANTIATION-GEN3");

  Regles.poser("gen3");

  const g3 = Regles.pour("gen3");
  const arenes = g3.arenes();
  assert.ok(arenes && arenes.length === 8, "Must have 8 gym leaders in Gen 3");
  for (const gym of arenes) {
    assert.ok(gym.equipe && gym.equipe.length > 0, `Gym leader ${gym.champion || gym.nom} missing team`);
    for (const pkmn of gym.equipe) {
      assert.doesNotThrow(() => {
        const inst = Moteur.creer(pkmn.n, pkmn.niveau, h);
        assert.ok(inst && inst.stats && inst.attaques, `Failed instantiating #${pkmn.n} in gym team`);
      }, `Gym leader ${gym.champion || gym.nom} member #${pkmn.n} failed to instantiate`);
    }
  }

  const conseil = g3.conseil();
  assert.ok(conseil && conseil.length === 4, "Must have 4 Elite Four members in Gen 3");
  for (const c of conseil) {
    assert.ok(c.equipe && c.equipe.length > 0, `Elite Four ${c.nom} missing team`);
    for (const pkmn of c.equipe) {
      assert.doesNotThrow(() => {
        const inst = Moteur.creer(pkmn.n, pkmn.niveau, h);
        assert.ok(inst && inst.stats && inst.attaques, `Failed instantiating #${pkmn.n} in ${c.nom}'s team`);
      }, `Elite Four ${c.nom} member #${pkmn.n} failed to instantiate`);
    }
  }

  const maitre = g3.maitre();
  assert.ok(maitre && maitre.equipe && maitre.equipe.length === 6, "Master Wallace must have 6 Pokemon");
  for (const pkmn of maitre.equipe) {
    assert.doesNotThrow(() => {
      const inst = Moteur.creer(pkmn.n, pkmn.niveau, h);
      assert.ok(inst && inst.stats && inst.attaques, `Failed instantiating #${pkmn.n} in Wallace's team`);
    }, `Master Wallace member #${pkmn.n} failed to instantiate`);
  }

  const steven = g3.dresseurFinal();
  assert.ok(steven && steven.equipe && steven.equipe.length === 6, "Steven Stone must have 6 Pokemon");
  for (const pkmn of steven.equipe) {
    assert.doesNotThrow(() => {
      const inst = Moteur.creer(pkmn.n, pkmn.niveau, h);
      assert.ok(inst && inst.stats && inst.attaques, `Failed instantiating #${pkmn.n} in Steven's team`);
    }, `Steven Stone member #${pkmn.n} failed to instantiate`);
  }

  Regles.poser("gen1");
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
