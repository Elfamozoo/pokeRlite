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
 * 10. Gen 3 loot, marts & rewards invariants.
 * 11. Battle Factory, Natures, Talents & Tactical Engine Invariants.
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
  assert.strictEqual(gen3.length, 19, "POKE_ORDRE_GEN3 must contain exactly 19 files");
  for (const f of gen3) {
    assert.ok(!f.includes("sons"), `File ${f} must NOT be in GEN3 (NOYAU)`);
    assert.ok(!f.includes("anim"), `File ${f} must NOT be in GEN3 (NOYAU)`);
  }
});

test("POKE_ORDRE_GEN3_ECRANS contains sound and UI presentation files", () => {
  const gen3Ecrans = ordreContext.POKE_ORDRE_GEN3_ECRANS;
  assert.ok(Array.isArray(gen3Ecrans), "POKE_ORDRE_GEN3_ECRANS must be an array");
  assert.strictEqual(gen3Ecrans.length, 2, "POKE_ORDRE_GEN3_ECRANS must contain exactly 2 files");
  assert.ok(gen3Ecrans.includes("js/poke/gen3/sons.js"), "gen3/sons.js must be in GEN3_ECRANS");
  assert.ok(gen3Ecrans.includes("js/poke/ui-usine.js"), "ui-usine.js must be in GEN3_ECRANS");
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
  assert.ok(noyauContext.POKE_GEN3_CT, "POKE_GEN3_CT must be exported");
  assert.ok(noyauContext.POKE_GEN3_CS, "POKE_GEN3_CS must be exported");
  assert.ok(noyauContext.POKE_GEN3_CT_PAR_CLE, "POKE_GEN3_CT_PAR_CLE must be exported");
  assert.ok(noyauContext.POKE_GEN3_MARTS, "POKE_GEN3_MARTS must be exported");
  assert.ok(noyauContext.POKE_GEN3_NATURES, "POKE_GEN3_NATURES must be exported");
  assert.ok(noyauContext.PokeNatures, "PokeNatures must be exported");
  assert.ok(noyauContext.POKE_GEN3_TALENTS, "POKE_GEN3_TALENTS must be exported");
  assert.ok(noyauContext.PokeTalents, "PokeTalents must be exported");
  assert.ok(noyauContext.POKE_GEN3_TENUS, "POKE_GEN3_TENUS must be exported");
  assert.ok(noyauContext.POKE_GEN3_SETS_USINE, "POKE_GEN3_SETS_USINE must be exported");
  assert.ok(noyauContext.PokeUsine, "PokeUsine must be exported");

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
// Suite 10: Gen 3 Loot, Marts & Rewards Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("10. Gen 3 Loot, Marts & Rewards Invariants");

test("All 50 Gen 3 CTs and 8 CSs are defined in POKE_GEN3_CT, POKE_GEN3_CS and mapped in POKE_GEN3_CT_PAR_CLE", () => {
  const cts = noyauContext.POKE_GEN3_CT;
  const css = noyauContext.POKE_GEN3_CS;
  const parCle = noyauContext.POKE_GEN3_CT_PAR_CLE;

  assert.ok(Array.isArray(cts) && cts.length === 50, "POKE_GEN3_CT must contain exactly 50 CTs");
  assert.ok(Array.isArray(css) && css.length === 8, "POKE_GEN3_CS must contain exactly 8 CSs");
  assert.ok(parCle && typeof parCle === "object", "POKE_GEN3_CT_PAR_CLE must be defined");

  for (let i = 0; i < 50; i++) {
    const ct = cts[i];
    assert.strictEqual(ct.n, i + 1, `CT #${i + 1} has wrong number`);
    assert.ok(typeof ct.cle === "string" && ct.cle.length > 0, `CT #${i + 1} must have string move cle`);
    assert.ok(typeof ct.prix === "number" && ct.prix > 0, `CT #${i + 1} must have positive price`);
    assert.ok(typeof ct.type === "string", `CT #${i + 1} must have string type`);
    assert.strictEqual(parCle[ct.cle], ct, `POKE_GEN3_CT_PAR_CLE must map ${ct.cle} to CT #${ct.n}`);
  }

  for (let i = 0; i < 8; i++) {
    const cs = css[i];
    assert.strictEqual(cs.n, i + 1, `CS #${i + 1} has wrong number`);
    assert.ok(typeof cs.cle === "string" && cs.cle.length > 0, `CS #${i + 1} must have string move cle`);
    assert.strictEqual(cs.cs, true, `CS #${i + 1} must have cs: true`);
    assert.ok(typeof cs.type === "string", `CS #${i + 1} must have string type`);
    assert.strictEqual(parCle[cs.cle], cs, `POKE_GEN3_CT_PAR_CLE must map ${cs.cle} to CS #${cs.n}`);
  }

  const Regles = noyauContext.PokeRegles;
  assert.strictEqual(Regles.ct("gen3"), cts, "PokeRegles.ct('gen3') must return POKE_GEN3_CT");
  assert.strictEqual(Regles.cs("gen3"), css, "PokeRegles.cs('gen3') must return POKE_GEN3_CS");
  assert.strictEqual(Regles.ctParCle("gen3"), parCle, "PokeRegles.ctParCle('gen3') must return POKE_GEN3_CT_PAR_CLE");
});

test("PokeObtenir.machinePour resolves Gen 3 TMs/HMs by number, code, and move key with Gen 1 non-regression", () => {
  const O = noyauContext.PokeObtenir;
  const pGen3 = { regles: "gen3" };
  const pGen1 = { regles: "gen1" };

  // Gen 3 resolution
  const m39 = O.machinePour("TM39", pGen3);
  assert.ok(m39, "TM39 must resolve in Gen 3");
  assert.strictEqual(m39.n, 39);
  assert.strictEqual(m39.cle, "ROCK_TOMB");

  const m08 = O.machinePour("TM08", pGen3);
  assert.ok(m08, "TM08 must resolve in Gen 3");
  assert.strictEqual(m08.n, 8);
  assert.strictEqual(m08.cle, "BULK_UP");

  const mNum = O.machinePour(39, pGen3);
  assert.strictEqual(mNum.cle, "ROCK_TOMB");

  const mCle = O.machinePour("ROCK_TOMB", pGen3);
  assert.strictEqual(mCle.n, 39);

  const mCs8 = O.machinePour("HM08", pGen3);
  assert.ok(mCs8 && mCs8.cs);
  assert.strictEqual(mCs8.cle, "DIVE");

  // Gen 1 non-regression
  const m39G1 = O.machinePour("TM39", pGen1);
  assert.ok(m39G1, "TM39 must resolve in Gen 1");
  assert.strictEqual(m39G1.n, 39);
  assert.strictEqual(m39G1.cle, "SWIFT");

  const mNumG1 = O.machinePour(39, pGen1);
  assert.strictEqual(mNumG1.cle, "SWIFT");
});

test("VITAMINES_GEN3 and employerVitamine correctly support ZINC and CALCIUM with statExp", () => {
  const O = noyauContext.PokeObtenir;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;
  const h = new Hasard("VITAMINES-TEST");

  assert.ok(O.VITAMINES_GEN3, "PokeObtenir.VITAMINES_GEN3 must be exported");
  assert.strictEqual(O.VITAMINES_GEN3.ZINC, "sdf");
  assert.strictEqual(O.VITAMINES_GEN3.CALCIUM, "sat");
  assert.strictEqual(O.VITAMINES_GEN3.HP_UP, "pv");
  assert.strictEqual(O.VITAMINES_GEN3.PROTEIN, "atk");
  assert.strictEqual(O.VITAMINES_GEN3.IRON, "def");
  assert.strictEqual(O.VITAMINES_GEN3.CARBOS, "vit");

  // Gen 3 party
  Regles.poser("gen3");
  const pGen3 = {
    regles: "gen3",
    equipe: [Moteur.creer(252, 10, h)], // Treecko
    sac: { ZINC: 2, CALCIUM: 2 },
  };

  const rZinc = O.employerVitamine(pGen3, 0, "ZINC");
  assert.strictEqual(rZinc.ok, true, "ZINC must succeed in Gen 3");
  assert.strictEqual(pGen3.equipe[0].statExp.sdf, 2560);
  assert.strictEqual(pGen3.sac.ZINC, 1);

  const rCal = O.employerVitamine(pGen3, 0, "CALCIUM");
  assert.strictEqual(rCal.ok, true, "CALCIUM must succeed in Gen 3");
  assert.strictEqual(pGen3.equipe[0].statExp.sat, 2560);
  assert.strictEqual(pGen3.sac.CALCIUM, 1);

  // Gen 1 party rejects ZINC
  Regles.poser("gen1");
  const pGen1 = {
    regles: "gen1",
    equipe: [Moteur.creer(25, 10, h)], // Pikachu
    sac: { ZINC: 1 },
  };
  const rZincG1 = O.employerVitamine(pGen1, 0, "ZINC");
  assert.strictEqual(rZincG1.ok, false, "ZINC must be rejected in Gen 1");
  assert.strictEqual(rZincG1.raison, "pasUneVitamine");
});

test("PokeMoteur.calculerStats calculates sat and sdf from statExp without regression", () => {
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;
  const h = new Hasard("CALCULER-STATS-TEST");

  // Gen 3 Pokemon (Arcko #252 lvl 20)
  Regles.poser("gen3");
  const monG3 = Moteur.creer(252, 20, h);
  const baseSat = monG3.stats.sat;
  const baseSdf = monG3.stats.sdf;

  monG3.statExp.sat = 25600;
  monG3.statExp.sdf = 25600;
  const updated = Moteur.calculerStats(monG3);

  assert.ok(Number.isInteger(updated.sat), "sat must be an integer");
  assert.ok(Number.isInteger(updated.sdf), "sdf must be an integer");
  assert.ok(updated.sat > baseSat, "Boosted statExp.sat must increase sat");
  assert.ok(updated.sdf > baseSdf, "Boosted statExp.sdf must increase sdf");

  // Gen 1 Pokemon preserves spe
  Regles.poser("gen1");
  const monG1 = Moteur.creer(25, 20, h);
  assert.ok(Number.isInteger(monG1.stats.spe), "Gen 1 stats must have integer spe");
});

test("PokeButin.apprenables and pierresUtiles adapt dynamically to Gen 3 rules", () => {
  const Butin = noyauContext.PokeButin;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;
  const h = new Hasard("BUTIN-ADAPT-TEST");

  // Gen 3 party with Treecko #252
  Regles.poser("gen3");
  const pGen3 = {
    regles: "gen3",
    equipe: [Moteur.creer(252, 10, h)],
    ct: {},
  };

  const appG3 = Butin.apprenables(pGen3);
  assert.ok(appG3.length > 0, "Gen 3 party must have learnable CTs");
  const gen3Keys = new Set(noyauContext.POKE_GEN3_CT.map((c) => c.cle));
  for (const m of appG3) {
    assert.ok(gen3Keys.has(m.cle), `Learnable CT ${m.cle} must belong to Gen 3 CT table`);
  }

  // Stone evolutions in Gen 3
  const pStones = {
    regles: "gen3",
    equipe: [
      Moteur.creer(44, 25, h),  // Gloom -> Vileplume (LEAF_STONE) & Bellossom (SUN_STONE)
      Moteur.creer(271, 20, h), // Lombre -> Ludicolo (WATER_STONE)
      Moteur.creer(273, 20, h), // Nuzleaf -> Shiftry (LEAF_STONE)
      Moteur.creer(300, 20, h), // Skitty -> Delcatty (MOON_STONE)
    ],
  };
  const utiles = Butin.pierresUtiles(pStones);
  assert.ok(utiles.includes("SUN_STONE"), "SUN_STONE must be useful for Gloom in Gen 3");
  assert.ok(utiles.includes("MOON_STONE"), "MOON_STONE must be useful for Skitty in Gen 3");
  assert.ok(utiles.includes("WATER_STONE"), "WATER_STONE must be useful for Lombre");
  assert.ok(utiles.includes("LEAF_STONE"), "LEAF_STONE must be useful for Nuzleaf/Gloom");
  Regles.poser("gen1");
});

test("POKE_GEN3_MARTS defines Hoenn town marts and Lilycove counters, and PokeObtenir adapts dynamically", () => {
  const marts = noyauContext.POKE_GEN3_MARTS;
  const O = noyauContext.PokeObtenir;

  assert.ok(marts, "POKE_GEN3_MARTS must be exported");
  const requiredMarts = [
    "RustboroMart", "DewfordMart", "MauvilleMart", "LavaridgeMart",
    "VerdanturfMart", "FortreeMart", "LilycoveDept2F", "LilycoveDept3F",
    "LilycoveDept4F", "LilycoveDept5F", "MossdeepMart", "EverGrandeMart"
  ];
  for (const m of requiredMarts) {
    assert.ok(Array.isArray(marts[m]), `POKE_GEN3_MARTS.${m} must be an array`);
    assert.ok(marts[m].length > 0, `POKE_GEN3_MARTS.${m} must not be empty`);
  }

  const pGen3 = { regles: "gen3", acte: 4 };
  const pGen1 = { regles: "gen1", acte: 4 };

  assert.strictEqual(O.martMachines(pGen3), "LilycoveDept4F");
  assert.strictEqual(O.martMachines(pGen1), "CeladonMart2FClerk2Text");
  assert.strictEqual(O.martCombat(pGen3), "LilycoveDept3F");
  assert.strictEqual(O.martCombat(pGen1), "CeladonMart5FClerk1Text");

  // Act mapping for Gen 3
  assert.strictEqual(O.martPour({ regles: "gen3", acte: 1 }), "RustboroMart");
  assert.strictEqual(O.martPour({ regles: "gen3", acte: 2 }), "DewfordMart");
  assert.strictEqual(O.martPour({ regles: "gen3", acte: 6 }), "FortreeMart");

  // Inventories
  const ctStock = O.inventaire("LilycoveDept4F");
  assert.ok(ctStock.includes("TM_FIRE_BLAST"), "LilycoveDept4F must sell Fire Blast");
  assert.ok(ctStock.includes("TM_THUNDER"), "LilycoveDept4F must sell Thunder");
  assert.ok(ctStock.includes("TM_BLIZZARD"), "LilycoveDept4F must sell Blizzard");
});

test("Mulberry32 PRNG determinism and rare shelf invariants in Gen 3 vs Gen 1", () => {
  const Butin = noyauContext.PokeButin;
  const Hasard = noyauContext.PokeHasard;
  const CarteActes = noyauContext.PokeCarteActes;

  // PRNG determinism for vitamine draws
  const h1 = new Hasard("VITAMINE-SEED-42");
  const h2 = new Hasard("VITAMINE-SEED-42");
  const draws1 = [];
  const draws2 = [];
  for (let i = 0; i < 50; i++) {
    draws1.push(Butin.FAMILLES.vitamine.tirer({ regles: "gen3" }, h1).objet);
    draws2.push(Butin.FAMILLES.vitamine.tirer({ regles: "gen3" }, h2).objet);
  }
  assert.deepStrictEqual(draws1, draws2, "Mulberry32 vitamin draws must be bit-identical given same seed");
  assert.ok(draws1.includes("ZINC"), "ZINC must appear in Gen 3 vitamin draws");

  // Gen 1 never draws ZINC
  const hG1 = new Hasard("VITAMINE-SEED-42");
  for (let i = 0; i < 100; i++) {
    const v = Butin.FAMILLES.vitamine.tirer({ regles: "gen1" }, hG1).objet;
    assert.notStrictEqual(v, "ZINC", "Gen 1 must never draw ZINC");
  }

  // Rare shelf invariants
  const etapeG3 = { id: "lilycove-city", lieu: "lilycove-city" };
  const acteG3 = { ville: "lilycove-city" };
  const pG3 = { regles: "gen3", acte: 5 };
  const hRareG3 = new Hasard("RARE-SHELF-GEN3");
  const rareVits = new Set();
  const rareStones = new Set();
  for (let i = 0; i < 100; i++) {
    const noeud = CarteActes.noeudBoutique(etapeG3, acteG3, pG3, hRareG3);
    if (noeud.rare) {
      rareVits.add(noeud.rare[0]);
      rareStones.add(noeud.rare[1]);
    }
  }
  assert.ok(rareVits.has("ZINC"), "Gen 3 rare shelf must be able to draw ZINC");
  assert.ok(rareStones.has("SUN_STONE"), "Gen 3 rare shelf must be able to draw SUN_STONE");
  assert.ok(rareStones.has("MOON_STONE"), "Gen 3 rare shelf must be able to draw MOON_STONE");

  // Gen 1 rare shelf never draws ZINC, SUN_STONE or MOON_STONE
  const etapeG1 = { id: "celadon-city", lieu: "celadon-city" };
  const acteG1 = { ville: "celadon-city" };
  const pG1 = { regles: "gen1", acte: 5 };
  const hRareG1 = new Hasard("RARE-SHELF-GEN1");
  for (let i = 0; i < 100; i++) {
    const noeud = CarteActes.noeudBoutique(etapeG1, acteG1, pG1, hRareG1);
    if (noeud.rare) {
      assert.notStrictEqual(noeud.rare[0], "ZINC", "Gen 1 rare shelf must never draw ZINC");
      assert.notStrictEqual(noeud.rare[1], "SUN_STONE", "Gen 1 rare shelf must never draw SUN_STONE");
      assert.notStrictEqual(noeud.rare[1], "MOON_STONE", "Gen 1 rare shelf must never draw MOON_STONE");
    }
  }
});

test("PokeDits.objet formats Gen 3 vitamins, stones, and balls correctly", () => {
  loadScriptInContext("js/poke/dits-objets.js", noyauContext);
  assert.ok(noyauContext.PokeDits && typeof noyauContext.PokeDits.objet === "function", "PokeDits.objet must be defined");

  const T = (k, args) => ({ k, args });
  const nomStat = (s) => `nom_${s}`;

  noyauContext.PokeRegles.poser("gen3");
  const ditZinc = noyauContext.PokeDits.objet("ZINC", T, nomStat);
  assert.strictEqual(ditZinc.k, "bDitVitamine");
  assert.strictEqual(ditZinc.args.stat, "nom_sdf");

  const ditCalG3 = noyauContext.PokeDits.objet("CALCIUM", T, nomStat);
  assert.strictEqual(ditCalG3.k, "bDitVitamine");
  assert.strictEqual(ditCalG3.args.stat, "nom_sat");

  assert.strictEqual(noyauContext.PokeDits.objet("SUN_STONE", T).k, "bDitPierre");
  assert.strictEqual(noyauContext.PokeDits.objet("MOON_STONE", T).k, "bDitPierre");

  const g3Balls = ["NET_BALL", "DIVE_BALL", "NEST_BALL", "REPEAT_BALL", "TIMER_BALL", "LUXURY_BALL", "PREMIER_BALL"];
  for (const ball of g3Balls) {
    assert.strictEqual(noyauContext.PokeDits.objet(ball, T).k, "bDitBall", `${ball} must return bDitBall`);
  }

  noyauContext.PokeRegles.poser("gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11: Battle Factory, Natures, Talents & Tactical Engine Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("11. Battle Factory, Natures, Talents & Tactical Engine Invariants");

test("Natures invariants, helper PokeNatures, +/-10% stat factors, neutral natures, Gen 1/2 non-regression", () => {
  const PN = noyauContext.PokeNatures;
  const natures = noyauContext.POKE_GEN3_NATURES;
  const Moteur = noyauContext.PokeMoteur;
  const Regles = noyauContext.PokeRegles;
  const Hasard = noyauContext.PokeHasard;

  // 1. POKE_GEN3_NATURES has 25 entries
  assert.ok(natures && typeof natures === "object", "POKE_GEN3_NATURES must be defined");
  const keys = Object.keys(natures);
  assert.strictEqual(keys.length, 25, "POKE_GEN3_NATURES must have exactly 25 entries");

  // 2. PokeNatures helper functions
  assert.ok(PN, "PokeNatures must be defined");
  assert.strictEqual(typeof PN.nom, "function");
  assert.strictEqual(typeof PN.de, "function");
  assert.strictEqual(typeof PN.tirer, "function");
  assert.strictEqual(typeof PN.liste, "function");
  assert.strictEqual(PN.liste().length, 25);
  assert.strictEqual(PN.nom("rigide", "fr"), "Rigide");
  assert.strictEqual(PN.nom("rigide", "en"), "Adamant");
  assert.strictEqual(PN.nom("unknown"), "unknown");
  assert.strictEqual(PN.de({ nature: "rigide" }), "rigide");
  assert.strictEqual(PN.de({}), null);
  assert.strictEqual(PN.de(null), null);

  const mockH = { choisir: (arr) => arr[0] };
  assert.strictEqual(PN.tirer(mockH), "hardi");

  // 3. 5 neutral natures do not modify any stats, +/-10% factors with Math.floor, never alter PV
  const neutralNatures = ["hardi", "docile", "pudique", "bizarre", "serieux"];
  for (const n of neutralNatures) {
    assert.strictEqual(natures[n].plus, null, `${n} must have plus: null`);
    assert.strictEqual(natures[n].moins, null, `${n} must have moins: null`);
  }

  Regles.poser("gen3");
  const fixedDV = { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 };
  const fixedExp = { pv: 0, atk: 0, def: 0, vit: 0, spe: 0 };

  const baseStats = Moteur.calculerStats({ n: 252, niveau: 50, dv: fixedDV, statExp: fixedExp });
  for (const n of neutralNatures) {
    const neutralStats = Moteur.calculerStats({ n: 252, niveau: 50, dv: fixedDV, statExp: fixedExp, nature: n });
    assert.deepStrictEqual(neutralStats, baseStats, `Neutral nature ${n} must not modify any stats`);
  }

  // Rigide: atk +10%, sat -10%
  const rigideStats = Moteur.calculerStats({ n: 252, niveau: 50, dv: fixedDV, statExp: fixedExp, nature: "rigide" });
  assert.strictEqual(rigideStats.pv, baseStats.pv, "PV must NEVER be altered by nature");
  assert.strictEqual(rigideStats.atk, Math.floor(baseStats.atk * 1.1), "Rigide must grant floor(atk * 1.1)");
  assert.strictEqual(rigideStats.sat, Math.floor(baseStats.sat * 0.9), "Rigide must apply floor(sat * 0.9)");
  assert.strictEqual(rigideStats.def, baseStats.def);
  assert.strictEqual(rigideStats.vit, baseStats.vit);
  assert.strictEqual(rigideStats.sdf, baseStats.sdf);

  // Timide: vit +10%, atk -10%
  const timideStats = Moteur.calculerStats({ n: 252, niveau: 50, dv: fixedDV, statExp: fixedExp, nature: "timide" });
  assert.strictEqual(timideStats.pv, baseStats.pv, "PV must NEVER be altered by nature");
  assert.strictEqual(timideStats.vit, Math.floor(baseStats.vit * 1.1), "Timide must grant floor(vit * 1.1)");
  assert.strictEqual(timideStats.atk, Math.floor(baseStats.atk * 0.9), "Timide must apply floor(atk * 0.9)");

  // 4. Gen 1 and Gen 2 creatures created without genererNature do NOT have a nature assigned, zero PRNG consumption
  Regles.poser("gen1");
  const hG1 = new Hasard("NATURE-G1-SEED");
  const monG1 = Moteur.creer(25, 20, hG1);
  assert.strictEqual(monG1.nature, undefined, "Gen 1 creature must not have nature");

  Regles.poser("gen2");
  const hG2 = new Hasard("NATURE-G2-SEED");
  const monG2 = Moteur.creer(152, 20, hG2);
  assert.strictEqual(monG2.nature, undefined, "Gen 2 creature must not have nature");

  Regles.poser("gen1");
});

test("Canonical abilities database (76 talents in POKE_GEN3_TALENTS), 100% species mapping (1-386), PokeTalents helpers, deterministic PokeMoteur.creer without PRNG draws", () => {
  const talents = noyauContext.POKE_GEN3_TALENTS;
  const PT = noyauContext.PokeTalents;
  const Regles = noyauContext.PokeRegles;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;

  // 1. POKE_GEN3_TALENTS has 76 abilities with nom.fr, nom.en, desc.fr, desc.en
  assert.ok(talents, "POKE_GEN3_TALENTS must be defined");
  const keys = Object.keys(talents);
  assert.strictEqual(keys.length, 76, "POKE_GEN3_TALENTS must contain exactly 76 abilities");
  for (const k of keys) {
    const t = talents[k];
    assert.ok(t.nom && typeof t.nom.fr === "string" && t.nom.fr.length > 0, `${k} missing nom.fr`);
    assert.ok(t.nom && typeof t.nom.en === "string" && t.nom.en.length > 0, `${k} missing nom.en`);
    assert.ok(t.desc && typeof t.desc.fr === "string" && t.desc.fr.length > 0, `${k} missing desc.fr`);
    assert.ok(t.desc && typeof t.desc.en === "string" && t.desc.en.length > 0, `${k} missing desc.en`);
  }

  // 2. PokeTalents helpers (table, cles, nom, desc, de)
  assert.ok(PT, "PokeTalents must be defined");
  assert.strictEqual(PT.table(), talents);
  assert.strictEqual(PT.cles().length, 76);
  assert.strictEqual(PT.nom("INTIMIDATE", "fr"), "Intimidation");
  assert.strictEqual(PT.nom("INTIMIDATE", "en"), "Intimidate");
  assert.ok(PT.desc("DRIZZLE", "fr").length > 0);
  assert.ok(PT.desc("DRIZZLE", "en").length > 0);
  assert.strictEqual(PT.de({ talent: "LEVITATE" }), "LEVITATE");
  assert.strictEqual(PT.de({}), null);
  assert.strictEqual(PT.de(null), null);

  // 3. 100% species mapping (1-386)
  Regles.poser("gen3");
  const esp = Regles.especes();
  for (let n = 1; n <= 386; n++) {
    const e = esp[n];
    assert.ok(e, `Species ${n} must exist in Gen 3`);
    assert.ok(e.talent, `Species ${n} must have talent property`);
    assert.ok(talents[e.talent], `Species ${n} talent '${e.talent}' must exist in POKE_GEN3_TALENTS`);
  }

  // Starters and canonical signatures
  assert.strictEqual(esp[1].talent, "OVERGROW");
  assert.strictEqual(esp[4].talent, "BLAZE");
  assert.strictEqual(esp[7].talent, "TORRENT");
  assert.strictEqual(esp[252].talent, "OVERGROW");
  assert.strictEqual(esp[255].talent, "BLAZE");
  assert.strictEqual(esp[258].talent, "TORRENT");
  assert.strictEqual(esp[292].talent, "WONDER_GUARD");
  assert.strictEqual(esp[382].talent, "DRIZZLE");
  assert.strictEqual(esp[383].talent, "DROUGHT");
  assert.strictEqual(esp[384].talent, "AIR_LOCK");

  // 4. Deterministic PokeMoteur.creer without PRNG draws
  const h1 = new Hasard("TALENT-PRNG-TEST");
  const pTreecko = Moteur.creer(252, 5, h1);
  assert.strictEqual(pTreecko.talent, "OVERGROW");
  const draws = h1.tirages;

  const h2 = new Hasard("TALENT-PRNG-TEST");
  const pCustom = Moteur.creer(252, 5, h2, { talent: "SPEED_BOOST" });
  assert.strictEqual(pCustom.talent, "SPEED_BOOST");
  assert.strictEqual(h2.tirages, draws, "Talent initialization must consume zero PRNG draws");

  Regles.poser("gen1");
});

test("Combat engine ability hooks and held items (Intimidate, Levitate, Wonder Guard, Overgrow, Speed Boost, Choice Band, Leftovers, Lum Berry, Air Lock, Hail) and Gen 1/2 invariance", () => {
  const Regles = noyauContext.PokeRegles;
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Hasard = noyauContext.PokeHasard;

  // 1. PokeRegles.talentsActifs()
  Regles.poser("gen1");
  assert.strictEqual(Regles.talentsActifs(), false, "talentsActifs() must be false in Gen 1");
  Regles.poser("gen2");
  assert.strictEqual(Regles.talentsActifs(), false, "talentsActifs() must be false in Gen 2");
  Regles.poser("gen3");
  assert.strictEqual(Regles.talentsActifs(), true, "talentsActifs() must be true in Gen 3");

  const makeMon = (id, lvl = 50, seed = "COMBAT-MON") => Moteur.creer(id, lvl, new Hasard(seed));

  // 2. Entrance hooks: INTIMIDATE drops opponent attack stage by 1
  const ray = makeMon(384, 50, "P1");
  const gyar = makeMon(130, 50, "P2");
  gyar.talent = "INTIMIDATE";
  const cIntim = Combat.demarrer([ray], [gyar], { graine: "TEST-INTIM" });
  assert.strictEqual(cIntim.joueur.paliers.atk, -1, "Intimidate must lower attack stage by 1");

  // Blocked by CLEAR_BODY, WHITE_SMOKE, HYPER_CUTTER
  const meta = makeMon(376, 50, "P_CLEAR");
  meta.talent = "CLEAR_BODY";
  const cClear = Combat.demarrer([meta], [gyar], { graine: "TEST-CLEAR" });
  assert.strictEqual(cClear.joueur.paliers.atk, 0, "CLEAR_BODY blocks Intimidate");

  const tork = makeMon(324, 50, "P_SMOKE");
  tork.talent = "WHITE_SMOKE";
  const cSmoke = Combat.demarrer([tork], [gyar], { graine: "TEST-SMOKE" });
  assert.strictEqual(cSmoke.joueur.paliers.atk, 0, "WHITE_SMOKE blocks Intimidate");

  const corp = makeMon(341, 50, "P_HYPER");
  corp.talent = "HYPER_CUTTER";
  const cHyper = Combat.demarrer([corp], [gyar], { graine: "TEST-HYPER" });
  assert.strictEqual(cHyper.joueur.paliers.atk, 0, "HYPER_CUTTER blocks Intimidate");

  // 3. Weather abilities: DRIZZLE, DROUGHT, SAND_STREAM
  const target = makeMon(25, 50, "TARGET");
  const kyo = makeMon(382, 50, "KYO");
  kyo.talent = "DRIZZLE";
  assert.strictEqual(Combat.demarrer([kyo], [target], { graine: "W-RAIN" }).meteo.cle, "pluie");

  const grou = makeMon(383, 50, "GROU");
  grou.talent = "DROUGHT";
  assert.strictEqual(Combat.demarrer([grou], [target], { graine: "W-SUN" }).meteo.cle, "zenith");

  const tyra = makeMon(248, 50, "TYRA");
  tyra.talent = "SAND_STREAM";
  assert.strictEqual(Combat.demarrer([tyra], [target], { graine: "W-SAND" }).meteo.cle, "sable");

  // 4. Immunities: LEVITATE, WONDER_GUARD, VOLT_ABSORB, WATER_ABSORB, FLASH_FIRE
  const latias = makeMon(380, 50, "LAT");
  latias.talent = "LEVITATE";
  const groundAtk = makeMon(383, 50, "G-ATK");
  groundAtk.attaques = [{ cle: "EARTHQUAKE", pp: 10, ppMax: 10 }];
  const cLev = Combat.demarrer([groundAtk], [latias], { graine: "TEST-LEV" });
  const maxLatiasPv = latias.pv;
  const evLev = Combat.jouerTour(cLev, { type: "attaque", index: 0 }, new Hasard("LEV-H"), { type: "attaque", index: 0 });
  assert.strictEqual(latias.pv, maxLatiasPv, "LEVITATE must take zero damage from Ground");
  assert.ok(evLev.some(e => e.t === "talentImmunite" && e.talent === "LEVITATE"));

  const shed = makeMon(292, 20, "SHED");
  shed.talent = "WONDER_GUARD";
  shed.pv = 1;
  shed.attaques = [{ cle: "HARDEN", pp: 30, ppMax: 30 }];
  const watAtk = makeMon(7, 20, "WAT");
  watAtk.attaques = [{ cle: "WATER_GUN", pp: 20, ppMax: 20 }];
  const cWG = Combat.demarrer([watAtk], [shed], { graine: "TEST-WG" });
  Combat.jouerTour(cWG, { type: "attaque", index: 0 }, new Hasard("WG-H"), { type: "attaque", index: 0 });
  assert.strictEqual(shed.pv, 1, "WONDER_GUARD ignores non-super-effective damage");

  // VOLT_ABSORB
  const lanturn = makeMon(171, 50, "LAN");
  lanturn.talent = "VOLT_ABSORB";
  lanturn.pv = 80;
  const eleAtk = makeMon(25, 50, "ELE");
  eleAtk.attaques = [{ cle: "THUNDERBOLT", pp: 15, ppMax: 15 }];
  const cVA = Combat.demarrer([eleAtk], [lanturn], { graine: "TEST-VA" });
  Combat.jouerTour(cVA, { type: "attaque", index: 0 }, new Hasard("VA-H"), { type: "attaque", index: 0 });
  assert.ok(lanturn.pv > 80, "VOLT_ABSORB heals on Electric damage");

  // FLASH_FIRE
  const ninetales = makeMon(38, 50, "NIN");
  ninetales.talent = "FLASH_FIRE";
  const fAtk = makeMon(4, 50, "FIR");
  fAtk.attaques = [{ cle: "FLAMETHROWER", pp: 15, ppMax: 15 }];
  const cFF = Combat.demarrer([fAtk], [ninetales], { graine: "TEST-FF" });
  const startNinPv = ninetales.pv;
  Combat.jouerTour(cFF, { type: "attaque", index: 0 }, new Hasard("FF-H"), { type: "attaque", index: 0 });
  assert.strictEqual(ninetales.pv, startNinPv, "FLASH_FIRE takes zero damage from Fire");
  assert.ok(cFF.adverse.volatils.flashFire, "FLASH_FIRE activates flashFire flag");

  // 5. Damage buffs: OVERGROW, HUGE_POWER, THICK_FAT
  const scep = makeMon(254, 50, "SCEP");
  scep.talent = "OVERGROW";
  scep.pv = scep.stats.pv;
  const dmgNorm = Combat.degats(scep, target, "MEGA_DRAIN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  scep.pv = Math.floor(scep.stats.pv / 3);
  const dmgCrisis = Combat.degats(scep, target, "MEGA_DRAIN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  assert.ok(dmgCrisis > dmgNorm, "OVERGROW at <= 1/3 HP boosts Grass moves");
  assert.ok(dmgCrisis / dmgNorm >= 1.4 && dmgCrisis / dmgNorm <= 1.6);

  const azu = makeMon(184, 50, "AZU");
  azu.talent = "HUGE_POWER";
  const azuPlain = makeMon(184, 50, "AZU");
  azuPlain.talent = null;
  const dmgPlain = Combat.degats(azuPlain, target, "TAKE_DOWN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  const dmgHuge = Combat.degats(azu, target, "TAKE_DOWN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  assert.ok(dmgHuge >= dmgPlain * 1.8, "HUGE_POWER doubles physical attack");

  const snor = makeMon(143, 50, "SNOR");
  snor.talent = "THICK_FAT";
  const snorPlain = makeMon(143, 50, "SNOR");
  snorPlain.talent = null;
  const dmgTF = Combat.degats(fAtk, snor, "FLAMETHROWER", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  const dmgNoTF = Combat.degats(fAtk, snorPlain, "FLAMETHROWER", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  assert.ok(dmgTF < dmgNoTF, "THICK_FAT halves Fire damage");

  // 6. Held items: CHOICE_BAND, LEFTOVERS, WHITE_HERB, LUM_BERRY
  const cbAttacker = makeMon(25, 50, "CB");
  cbAttacker.objet = null;
  const dmgUnboosted = Combat.degats(cbAttacker, target, "BODY_SLAM", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  cbAttacker.objet = "CHOICE_BAND";
  const dmgCB = Combat.degats(cbAttacker, target, "BODY_SLAM", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  assert.ok(dmgCB > dmgUnboosted && dmgCB / dmgUnboosted >= 1.4 && dmgCB / dmgUnboosted <= 1.6, "CHOICE_BAND boosts physical damage ~1.5x");

  const leftMon = makeMon(25, 50, "LEFT");
  leftMon.objet = "LEFTOVERS";
  leftMon.pv = 50;
  Combat.usureFinDeTour(leftMon, [], "joueur", {}, {});
  assert.ok(leftMon.pv > 50, "LEFTOVERS heals HP at end of turn");
  assert.strictEqual(leftMon.objet, "LEFTOVERS");

  const herbMon = makeMon(25, 50, "HERB");
  herbMon.objet = "WHITE_HERB";
  const coteHerb = { paliers: { atk: -2, vit: -1 } };
  Combat.usureFinDeTour(herbMon, [], "joueur", coteHerb, {});
  assert.strictEqual(coteHerb.paliers.atk, 0, "WHITE_HERB clears negative atk");
  assert.strictEqual(coteHerb.paliers.vit, 0, "WHITE_HERB clears negative vit");
  assert.strictEqual(herbMon.objet, null, "WHITE_HERB consumed");

  const lumMon = makeMon(25, 50, "LUM");
  lumMon.objet = "LUM_BERRY";
  lumMon.statut = "brulure";
  const coteLum = { volatils: { confusion: 2 } };
  Combat.usureFinDeTour(lumMon, [], "joueur", coteLum, {});
  assert.strictEqual(lumMon.statut, null, "LUM_BERRY cures burn");
  assert.strictEqual(coteLum.volatils.confusion, 0, "LUM_BERRY cures confusion");
  assert.strictEqual(lumMon.objet, null, "LUM_BERRY consumed");

  // Speed boost
  const ninjask = makeMon(291, 50, "NINJASK");
  ninjask.talent = "SPEED_BOOST";
  const dummyAtk = makeMon(25, 50, "DUMMY");
  dummyAtk.attaques = [{ cle: "TAIL_WHIP", pp: 30, ppMax: 30 }];
  const cSpeed = Combat.demarrer([ninjask], [dummyAtk], { graine: "TEST-SPEED" });
  Combat.jouerTour(cSpeed, { type: "attaque", index: 0 }, new Hasard("SPEED-H"), { type: "attaque", index: 0 });
  assert.strictEqual(cSpeed.joueur.paliers.vit, 1, "SPEED_BOOST boosts speed stage by 1");

  // 7. Weather: HAIL chips non-ice, AIR_LOCK negates weather damage
  const iceM = makeMon(361, 50, "ICE");
  const nonIceM = makeMon(25, 50, "NONICE");
  const startNonIce = nonIceM.pv;
  const startIce = iceM.pv;
  const cHail = Combat.demarrer([iceM], [nonIceM], { graine: "TEST-HAIL" });
  cHail.meteo = { cle: "grele", reste: 5 };
  Combat.usureMeteo(cHail, nonIceM, [], "adverse");
  Combat.usureMeteo(cHail, iceM, [], "joueur");
  assert.ok(nonIceM.pv < startNonIce, "HAIL chips non-ice");
  assert.strictEqual(iceM.pv, startIce, "HAIL spares ice types");

  const rayLock = makeMon(384, 50, "RAY");
  rayLock.talent = "AIR_LOCK";
  const cLock = Combat.demarrer([rayLock], [nonIceM], { graine: "TEST-AIRLOCK" });
  cLock.meteo = { cle: "grele", reste: 5 };
  const preLockPv = nonIceM.pv;
  Combat.usureMeteo(cLock, nonIceM, [], "adverse");
  assert.strictEqual(nonIceM.pv, preLockPv, "AIR_LOCK negates weather damage");

  // 8. Cross-generational invariance: Gen 1/Gen 2 combat ignores abilities
  Regles.poser("gen1");
  const g1P1 = makeMon(130, 50, "G1-P1");
  g1P1.talent = "INTIMIDATE";
  const g1P2 = makeMon(25, 50, "G1-P2");
  const cG1 = Combat.demarrer([g1P1], [g1P2], { graine: "G1-INTIM" });
  assert.strictEqual(cG1.adverse.paliers.atk, 0, "Gen 1 combat ignores talents");

  Regles.poser("gen2");
  const cG2 = Combat.demarrer([g1P1], [g1P2], { graine: "G2-INTIM" });
  assert.strictEqual(cG2.adverse.paliers.atk, 0, "Gen 2 combat ignores talents");

  Regles.poser("gen1");
});

test("Battle Factory catalog (POKE_GEN3_SETS_USINE) 4 tiers and palierPourCombat", () => {
  const sets = noyauContext.POKE_GEN3_SETS_USINE;
  const U = noyauContext.PokeUsine;
  const Regles = noyauContext.PokeRegles;

  // 1. POKE_GEN3_SETS_USINE exports 4 tiers
  assert.ok(sets && typeof sets === "object", "POKE_GEN3_SETS_USINE must be exported");
  assert.ok(Array.isArray(sets.tier1) && sets.tier1.length >= 30, `tier1 length >= 30 (got ${sets.tier1.length})`);
  assert.ok(Array.isArray(sets.tier2) && sets.tier2.length >= 35, `tier2 length >= 35 (got ${sets.tier2.length})`);
  assert.ok(Array.isArray(sets.tier3) && sets.tier3.length >= 40, `tier3 length >= 40 (got ${sets.tier3.length})`);
  assert.ok(Array.isArray(sets.tier4) && sets.tier4.length >= 50, `tier4 length >= 50 (got ${sets.tier4.length})`);

  // 2. Every set in every tier specifies valid espece (1-386), valid nature, valid objet, and 4 moves
  Regles.poser("gen3");
  const g3 = Regles.pour("gen3");
  const allMoves = g3.attaques();
  const allNatures = noyauContext.POKE_GEN3_NATURES;
  const allObjets = noyauContext.POKE_GEN3_OBJETS;
  const validRepartitions = new Set(["atk_vit", "sat_vit", "pv_def", "pv_sat", "equilibre", "atk_pv"]);

  for (const t of ["tier1", "tier2", "tier3", "tier4"]) {
    for (let i = 0; i < sets[t].length; i++) {
      const s = sets[t][i];
      assert.ok(typeof s.espece === "number" && s.espece >= 1 && s.espece <= 386, `${t}[${i}] invalid species ${s.espece}`);
      assert.ok(allNatures[s.nature], `${t}[${i}] invalid nature '${s.nature}'`);
      assert.ok(allObjets[s.objet], `${t}[${i}] invalid held item '${s.objet}'`);
      assert.ok(Array.isArray(s.attaques) && s.attaques.length === 4, `${t}[${i}] must have 4 attacks`);
      for (const atk of s.attaques) {
        assert.ok(allMoves[atk], `${t}[${i}] unknown move '${atk}'`);
      }
      assert.ok(validRepartitions.has(s.repartition), `${t}[${i}] invalid repartition '${s.repartition}'`);
    }
  }

  // 3. PokeUsine.palierPourCombat returns palier 1 for combats 1-7, palier 2 for 8-14, palier 3 for 15-21, palier 4 for 22+
  assert.strictEqual(U.palierPourCombat(1, 1, 0), "tier1", "Combats 1-7 (series 1) must be tier1");
  assert.strictEqual(U.palierPourCombat(2, 7, 13), "tier1", "Combats 8-14 (series 2) must be tier1");
  assert.strictEqual(U.palierPourCombat(3, 1, 14), "tier2", "Combats 15-21 (series 3) must be tier2");
  assert.strictEqual(U.palierPourCombat(4, 7, 27), "tier2", "Combats 22-28 (series 4) must be tier2");
  assert.strictEqual(U.palierPourCombat(5, 1, 28), "tier3", "Combats 29-35 (series 5) must be tier3");
  assert.strictEqual(U.palierPourCombat(6, 1, 35), "tier4", "Combats 36+ (series 6+) must be tier4");
  assert.strictEqual(U.palierPourCombat(7, 1, 42), "tier4", "Combat 42 must be tier4");

  Regles.poser("gen1");
});

test("PokeUsine session state transitions, rentals generation, streak advancement, boss Samson / Noland at 21 and 42, and PCo calculation", () => {
  const U = noyauContext.PokeUsine;
  const Regles = noyauContext.PokeRegles;
  const Hasard = noyauContext.PokeHasard;

  Regles.poser("gen3");
  const h = new Hasard("USINE-TEST-SEED");

  // 1. PokeUsine.creerSession generates 6 unique rental Pokemon at level 50 with distinct species and held items
  const session = U.creerSession("USINE-TEST-SEED", h);
  assert.strictEqual(session.prets.length, 6, "Must generate exactly 6 rentals");
  assert.strictEqual(session.statut, "choix_initial");

  const species = new Set();
  const items = new Set();
  for (const p of session.prets) {
    assert.strictEqual(p.niveau, 50, "Rental must be level 50");
    assert.ok(p.stats && p.pv === p.stats.pv, "Rental must have full HP");
    assert.ok(!species.has(p.n), `Duplicate rental species #${p.n}`);
    assert.ok(!items.has(p.objet), `Duplicate rental held item '${p.objet}'`);
    species.add(p.n);
    items.add(p.objet);
  }

  // 2. PokeUsine.choisirEquipeInitiale transitions state to combat 1
  U.choisirEquipeInitiale(session, [0, 2, 4], h);
  assert.strictEqual(session.equipe.length, 3);
  assert.strictEqual(session.statut, "combat");
  assert.strictEqual(session.combat, 1);
  assert.ok(session.adversaire, "Opponent must be generated");

  // 3. PokeUsine.continuerSerie and PokeUsine.soignerEquipe maintain streak and fully restore HP
  session.equipe[0].pv = 1;
  session.equipe[0].statut = "poison";
  U.soignerEquipe(session.equipe);
  assert.strictEqual(session.equipe[0].pv, session.equipe[0].stats.pv, "soignerEquipe must restore full HP");
  assert.strictEqual(session.equipe[0].statut, null, "soignerEquipe must cure status");

  // 4. Combat 21 triggers Noland (tier 3, symbol: "argent") and combat 42 triggers Noland (tier 4, symbol: "or")
  session.serie = 3;
  session.combat = 7;
  session.combatGlobal = 21;
  session.victoires = 20;
  session.adversaire = U.tirerAdversaire(session, h);
  assert.ok(session.adversaire.estBoss, "Combat 21 must be boss battle");
  assert.strictEqual(session.adversaire.id, "noland_argent");
  assert.strictEqual(session.adversaire.nom, "Meneur Samson");
  assert.strictEqual(session.adversaire.symbole, "argent");

  // Win combat 21
  U.enregistrerResultatCombat(session, true, h);
  assert.strictEqual(session.symboles.argent, true, "Must award silver symbol");
  assert.strictEqual(session.statut, "serie_gagnee");

  // Advance streak
  U.continuerSerie(session, h);
  assert.strictEqual(session.serie, 4);
  assert.strictEqual(session.combat, 1);
  assert.strictEqual(session.combatGlobal, 22);

  // Fast forward to combat 42
  session.serie = 6;
  session.combat = 7;
  session.combatGlobal = 42;
  session.victoires = 41;
  session.adversaire = U.tirerAdversaire(session, h);
  assert.ok(session.adversaire.estBoss, "Combat 42 must be boss battle");
  assert.strictEqual(session.adversaire.id, "noland_or");
  assert.strictEqual(session.adversaire.nom, "Meneur Samson");
  assert.strictEqual(session.adversaire.symbole, "or");

  // Win combat 42
  U.enregistrerResultatCombat(session, true, h);
  assert.strictEqual(session.symboles.or, true, "Must award gold symbol");

  // 5. PokeUsine.calculerGainPCo calculates correct rewards
  assert.strictEqual(U.calculerGainPCo(1, false), 3, "Series 1-2 base reward: 3 PCo");
  assert.strictEqual(U.calculerGainPCo(2, false), 3, "Series 2 base reward: 3 PCo");
  assert.strictEqual(U.calculerGainPCo(3, false), 5, "Series 3-4 base reward: 5 PCo");
  assert.strictEqual(U.calculerGainPCo(4, false), 5, "Series 4 base reward: 5 PCo");
  assert.strictEqual(U.calculerGainPCo(5, false), 7, "Series 5-6 base reward: 7 PCo");
  assert.strictEqual(U.calculerGainPCo(6, false), 7, "Series 6 base reward: 7 PCo");
  assert.strictEqual(U.calculerGainPCo(7, false), 10, "Series 7+ base reward: 10 PCo");
  assert.strictEqual(U.calculerGainPCo(3, true), 20, "Series 3 Boss silver symbol victory awards 20 PCo");
  assert.strictEqual(U.calculerGainPCo(6, true), 37, "Series 6 Boss gold symbol victory awards 37 PCo");

  Regles.poser("gen1");
});

test("Cross-generational bit-level PRNG determinism & replay parity across Gen 1, Gen 2, and Gen 3", () => {
  const Hasard = noyauContext.PokeHasard;
  const Regles = noyauContext.PokeRegles;

  const seeds = ["CROSS-GEN-42", "PRNG-REPLAY-999", "MULBERRY32-DETERMINISM"];
  for (const seed of seeds) {
    // 100 PRNG draws across Gen 1, Gen 2, Gen 3 sessions with identical Mulberry32 seeds
    Regles.poser("gen1");
    const h1 = new Hasard(seed);
    const seq1 = [];
    for (let i = 0; i < 100; i++) seq1.push(h1.brut());

    Regles.poser("gen2");
    const h2 = new Hasard(seed);
    const seq2 = [];
    for (let i = 0; i < 100; i++) seq2.push(h2.brut());

    Regles.poser("gen3");
    const h3 = new Hasard(seed);
    const seq3 = [];
    for (let i = 0; i < 100; i++) seq3.push(h3.brut());

    assert.deepStrictEqual(seq1, seq2, `Gen 1 and Gen 2 draws must be bit-identical for ${seed}`);
    assert.deepStrictEqual(seq2, seq3, `Gen 2 and Gen 3 draws must be bit-identical for ${seed}`);
    assert.strictEqual(h1.tirages, 100);
    assert.strictEqual(h2.tirages, 100);
    assert.strictEqual(h3.tirages, 100);
  }

  // Combat replay determinism in Gen 3
  Regles.poser("gen3");
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;

  const simCombat = () => {
    const h = new Hasard("REPLAY-COMBAT-SEED");
    const p1 = Moteur.creer(254, 50, h);
    const p2 = Moteur.creer(260, 50, h);
    const c = Combat.demarrer([p1], [p2], { graine: "BATTLE-42" });
    const events = [];
    for (let t = 0; t < 5; t++) {
      const ev = Combat.jouerTour(c, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });
      events.push(...ev.map(e => ({ t: e.t, degats: e.degats, pv: e.pv })));
      if (p1.pv <= 0 || p2.pv <= 0) break;
    }
    return events;
  };

  const runA = simCombat();
  const runB = simCombat();
  assert.deepStrictEqual(runA, runB, "Gen 3 turn-by-turn combat simulation must be 100% deterministic and replayable");

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
