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
 * 12. Coffre d'Accueil, Objets de Départ à 5 Charges, Sac & Nuzlocke Invariants.
 * 13. Pokémon Showdown Art Direction & Unified Combat Engine Invariants.
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
  assert.strictEqual(gen3.length, 20, "POKE_ORDRE_GEN3 must contain exactly 20 files");
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
// Suite 12: Coffre d'Accueil, Objets de Départ à 5 Charges, Sac & Nuzlocke Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("12. Coffre d'Accueil, Objets de Départ à 5 Charges, Sac & Nuzlocke Invariants");

function createChestTestContext() {
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
        get disabled() { return !!attrs.disabled; },
        set disabled(v) { attrs.disabled = !!v; },
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
          if (attr === "id") return id;
          if (attr === "disabled") return attrs.disabled ? "" : null;
          return attrs[attr] != null ? attrs[attr] : null;
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
      let autoId = 0;
      while ((match = tagRegex.exec(val)) !== null) {
        const rawAttrs = match[2];
        const idMatch = rawAttrs.match(/id="([^"]+)"/);
        const classMatch = rawAttrs.match(/class="([^"]+)"/);
        const disabled = /\bdisabled\b/.test(rawAttrs);
        const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
        const attrs = { classes, disabled };
        const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
        let am;
        while ((am = attrRegex.exec(rawAttrs)) !== null) {
          attrs[am[1]] = am[2];
        }
        const id = idMatch ? idMatch[1] : (attrs["data-cle"] ? "cle-" + attrs["data-cle"] : "mock-el-" + (++autoId));
        getOrCreateElement(id, attrs);
      }
    },
    classList: { add() {}, remove() {}, contains() { return false; } },
    querySelector(sel) {
      const list = this.querySelectorAll(sel);
      return list.length > 0 ? list[0] : null;
    },
    querySelectorAll(sel) {
      const parts = sel.split(",").map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const res = [];
        for (const p of parts) {
          const sub = this.querySelectorAll(p);
          for (const el of sub) if (!res.includes(el)) res.push(el);
        }
        return res;
      }
      const s = parts[0] || sel;
      if (s.startsWith("#")) {
        const id = s.slice(1);
        return elementMap[id] ? [elementMap[id]] : [];
      }
      if (s.startsWith(".")) {
        const cls = s.slice(1);
        return Object.values(elementMap).filter(el => el.classList.contains(cls));
      }
      const mAttrVal = s.match(/^\[([a-zA-Z0-9_-]+)="([^"]*)"\]$/);
      if (mAttrVal) {
        return Object.values(elementMap).filter(el => el.getAttribute(mAttrVal[1]) === mAttrVal[2]);
      }
      const mAttr = s.match(/^\[([a-zA-Z0-9_-]+)\]$/);
      if (mAttr) {
        return Object.values(elementMap).filter(el => el.getAttribute(mAttr[1]) != null);
      }
      return [];
    }
  };

  const store = {};
  const mockStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; }
  };

  const mockDoc = {
    getElementById: (id) => (id === "poke-racine" ? mockRacine : null),
    querySelector: (s) => mockRacine.querySelector(s),
    querySelectorAll: (s) => mockRacine.querySelectorAll(s),
  };

  const ctx = createIsolatedContext({
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    location: { href: "", search: "", pathname: "", hash: "" },
    history: { replaceState() {} },
    localStorage: mockStorage,
    document: mockDoc,
    POKE_TEST: true,
  });

  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.W = ctx;
  ctx.D = mockDoc;
  ctx.mockRacine = mockRacine;
  ctx.mockStorage = mockStorage;

  const scriptsToLoad = [
    "js/poke/rng.js",
    "js/poke/progression.js",
    "js/poke/ui-usine.js",
    "js/poke/regles.js",
    "js/poke/depart.js",
    "js/poke/icones.js",
    "js/poke/genre.js",
    "js/poke/dits-objets.js",
    "js/poke/gen3/objets.js",
    "js/poke/ui.js",
    "js/poke/partie.js"
  ];

  for (const s of scriptsToLoad) {
    loadScriptInContext(s, ctx);
  }

  if (typeof ctx.PokeDemarrer === "function") {
    ctx.PokeDemarrer();
  }

  return ctx;
}

test("Meta-progression chest API lifecycle in PokeProgression (add 5, cumulative charges, consume, zero cleanup, count)", () => {
  const ctx = createChestTestContext();
  const P = ctx.PokeProgression;
  assert.ok(P, "PokeProgression must be defined");
  assert.strictEqual(typeof P.coffreLire, "function", "coffreLire must be a function");
  assert.strictEqual(typeof P.coffreCompte, "function", "coffreCompte must be a function");
  assert.strictEqual(typeof P.coffreAjouter, "function", "coffreAjouter must be a function");
  assert.strictEqual(typeof P.coffreConsommer, "function", "coffreConsommer must be a function");

  // Initial state: empty chest
  assert.strictEqual(Object.keys(P.coffreLire()).length, 0, "Chest must be initially empty");
  assert.strictEqual(P.coffreCompte(), 0, "Chest item count must be 0 initially");

  // Adding items and cumulative charges
  const c1 = P.coffreAjouter("CHOICE_BAND", 5);
  assert.strictEqual(c1, 5, "Adding 5 charges of CHOICE_BAND must return 5");
  assert.strictEqual(P.coffreCompte(), 1, "Chest must count 1 distinct item");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 5, "5 charges stored for CHOICE_BAND");

  const c2 = P.coffreAjouter("CHOICE_BAND", 5);
  assert.strictEqual(c2, 10, "Accumulating charges must yield 10 charges");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 10, "10 charges stored for CHOICE_BAND");

  // Default charges parameter (5)
  const cDefault = P.coffreAjouter("LEFTOVERS");
  assert.strictEqual(cDefault, 5, "Adding without charges parameter must default to 5 charges");
  assert.strictEqual(P.coffreCompte(), 2, "Chest must count 2 distinct items");
  assert.strictEqual(P.coffreLire().LEFTOVERS, 5, "5 charges stored for LEFTOVERS");

  // Consuming charges
  const rem1 = P.coffreConsommer("CHOICE_BAND");
  assert.strictEqual(rem1, 9, "Consuming 1 charge leaves 9 charges");

  // Consume remaining 9 charges to reach 0
  for (let i = 0; i < 9; i++) {
    P.coffreConsommer("CHOICE_BAND");
  }
  // Zero cleanup: key deleted on exhaustion
  assert.strictEqual(P.coffreLire().CHOICE_BAND, undefined, "CHOICE_BAND key must be deleted on exhaustion");
  assert.strictEqual(P.coffreCompte(), 1, "Chest must count 1 remaining item (LEFTOVERS)");
  assert.strictEqual(P.coffreLire().LEFTOVERS, 5, "LEFTOVERS remains intact at 5 charges");

  // Consuming non-existent item returns 0 without crashing
  const remNone = P.coffreConsommer("OBJET_INEXISTANT");
  assert.strictEqual(remNone, 0, "Consuming non-existent item returns 0");

  // Consume LEFTOVERS to empty chest
  for (let i = 0; i < 5; i++) {
    P.coffreConsommer("LEFTOVERS");
  }
  assert.strictEqual(P.coffreLire().LEFTOVERS, undefined, "LEFTOVERS deleted on exhaustion");
  assert.strictEqual(P.coffreCompte(), 0, "Chest is empty");

  // Edge cases: null, undefined, empty string
  assert.strictEqual(P.coffreAjouter(null), 0, "coffreAjouter(null) returns 0");
  assert.strictEqual(P.coffreAjouter(""), 0, "coffreAjouter('') returns 0");
  assert.strictEqual(P.coffreConsommer(null), 0, "coffreConsommer(null) returns 0");
  assert.strictEqual(P.coffreConsommer(""), 0, "coffreConsommer('') returns 0");
});

test("Decoupled Battle Shop integration (ouvrirBoutiquePCo adds 5 charges to chest, reservation badge displayed, run bag untouched)", () => {
  const ctx = createChestTestContext();
  const P = ctx.PokeProgression;
  const UIUsine = ctx.PokeUIUsine;
  assert.ok(UIUsine, "PokeUIUsine must be defined");
  assert.strictEqual(typeof UIUsine.ouvrirBoutiquePCo, "function");

  // Setup PCo balance and verify chest empty
  P.ajouterPCo(100);
  assert.ok(P.usineLire().pco >= 100, "Initial PCo balance must be >= 100");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, undefined, "CHOICE_BAND not in chest initially");

  // Mock target container
  let targetHTML = "";
  const mockCible = {
    buttons: [],
    get innerHTML() { return targetHTML; },
    set innerHTML(val) {
      targetHTML = val;
      mockCible.buttons = [];
      const regex = /<button[^>]*class="[^"]*pk-boutique-acheter[^"]*"[^>]*data-cle="([^"]+)"[^>]*>/g;
      let match;
      while ((match = regex.exec(val)) !== null) {
        const cle = match[1];
        const listeners = [];
        mockCible.buttons.push({
          cle,
          getAttribute: (attr) => (attr === "data-cle" ? cle : null),
          addEventListener: (evt, fn) => { if (evt === "click") listeners.push(fn); },
          click: () => { for (const fn of listeners) fn({ preventDefault: () => {} }); }
        });
      }
    },
    querySelectorAll: (sel) => (sel === ".pk-boutique-acheter" ? mockCible.buttons : []),
    querySelector: () => null,
  };

  UIUsine.ouvrirBoutiquePCo({ cible: mockCible });
  assert.ok(mockCible.innerHTML.includes("CHOICE_BAND") || mockCible.innerHTML.includes("Bandeau Choix"));
  assert.ok(!mockCible.innerHTML.includes("pk-boutique-reserve"), "No reservation badge initially");

  // Spies
  let depenserCalled = false;
  let coffreAjouterCalled = false;
  let ajouterObjetCalled = false;

  const origDepenser = P.depenserPCo;
  const origCoffreAjouter = P.coffreAjouter;
  const origAjouterObjet = P.ajouterObjet;

  P.depenserPCo = function (...args) {
    depenserCalled = true;
    return origDepenser.apply(this, args);
  };
  P.coffreAjouter = function (...args) {
    coffreAjouterCalled = true;
    return origCoffreAjouter.apply(this, args);
  };
  P.ajouterObjet = function (...args) {
    ajouterObjetCalled = true;
    return origAjouterObjet.apply(this, args);
  };

  const btnChoice = mockCible.buttons.find(b => b.cle === "CHOICE_BAND");
  assert.ok(btnChoice, "Buy button for CHOICE_BAND must exist");

  btnChoice.click();

  // Assertions:
  // 1. P.depenserPCo called
  assert.strictEqual(depenserCalled, true, "depenserPCo must be called");
  // 2. P.coffreAjouter called with 5 charges
  assert.strictEqual(coffreAjouterCalled, true, "coffreAjouter must be called");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 5, "Chest credited with exactly 5 charges");
  // 3. P.ajouterObjet was NOT called (run bag decoupled)
  assert.strictEqual(ajouterObjetCalled, false, "ajouterObjet must NOT be called by Battle Shop");
  const runBag = P.sac ? P.sac() : (P.lire().sac || {});
  assert.strictEqual(runBag.CHOICE_BAND || 0, 0, "run bag must remain untouched");
  // 4. Reservation badge in re-rendered HTML
  assert.ok(mockCible.innerHTML.includes('class="pk-boutique-reserve"'), "Badge .pk-boutique-reserve must be rendered");
  assert.ok(mockCible.innerHTML.includes("En réserve : 5 utilisations"), "Badge must display 5 utilisations");

  // 5. Subsequent purchase accumulates charges
  P.ajouterPCo(100);
  const btnChoice2 = mockCible.buttons.find(b => b.cle === "CHOICE_BAND");
  assert.ok(btnChoice2, "Button found after re-render");
  btnChoice2.click();

  assert.strictEqual(P.coffreLire().CHOICE_BAND, 10, "10 charges accumulated in chest");
  assert.ok(mockCible.innerHTML.includes("En réserve : 10 utilisations"), "Badge must display 10 utilisations");
});

test("Starting loadout selection invariants (daily challenge bypass, empty chest bypass, charge consumption and partie.sac addition, 'Partir sans objet')", () => {
  const ctx = createChestTestContext();
  const P = ctx.PokeProgression;
  const UI = ctx.PokeUI;
  const racine = ctx.mockRacine;

  assert.strictEqual(typeof UI.versCarteOuObjetDepart, "function");
  assert.strictEqual(typeof UI.ecranObjetDepart, "function");

  // Invariant 1: Daily Challenge bypass (partie.compare === true)
  P.coffreAjouter("CHOICE_BAND", 5);
  assert.ok(P.coffreCompte() > 0, "Chest is non-empty");

  let suiteCalled = false;
  const mockSuite = () => { suiteCalled = true; };

  UI.definirPartie({ compare: true, sac: {}, regle: "voyage", vus: {}, pris: {}, badges: [] });
  suiteCalled = false;
  UI.versCarteOuObjetDepart(mockSuite);
  assert.strictEqual(suiteCalled, true, "Daily challenge must immediately bypass to suite()");
  assert.ok(!racine.innerHTML.includes("pkdx-ecran-objet-depart"), "Loadout screen must not render for daily challenge");

  // Invariant 2: Empty chest bypass in normal run
  const pData = P.lire();
  pData.coffre = {};
  P.ecrire(pData);
  assert.strictEqual(P.coffreCompte(), 0, "Chest emptied");

  UI.definirPartie({ compare: false, sac: {}, regle: "voyage", vus: {}, pris: {}, badges: [] });
  suiteCalled = false;
  UI.versCarteOuObjetDepart(mockSuite);
  assert.strictEqual(suiteCalled, true, "Empty chest must immediately bypass to suite()");
  assert.ok(!racine.innerHTML.includes("pkdx-ecran-objet-depart"), "Loadout screen must not render if chest is empty");

  // Invariant 3: Non-empty chest triggers starting loadout selection and charge consumption
  P.coffreAjouter("CHOICE_BAND", 5);
  P.coffreAjouter("LEFTOVERS", 3);
  assert.strictEqual(P.coffreCompte(), 2);

  suiteCalled = false;
  UI.versCarteOuObjetDepart(mockSuite);
  assert.strictEqual(suiteCalled, false, "suite() must not be called immediately when chest has items");
  assert.ok(racine.innerHTML.includes("pkdx-ecran-objet-depart") || racine.innerHTML.includes(UI.T("objetDepartTitre")), "Loadout screen rendered");
  assert.ok(racine.innerHTML.includes("CHOICE_BAND") || racine.innerHTML.includes("Bandeau Choix"));
  assert.ok(racine.innerHTML.includes("LEFTOVERS") || racine.innerHTML.includes("Restes"));

  const btnEmporter = racine.querySelector("#pk-objet-depart-ok");
  const btnSans = racine.querySelector("#pk-objet-depart-sans");
  assert.ok(btnEmporter, "#pk-objet-depart-ok must exist");
  assert.ok(btnSans, "#pk-objet-depart-sans must exist");
  assert.strictEqual(btnEmporter.disabled, true, "Emporter button must be disabled until item selected");

  // Clicking disabled button does nothing
  suiteCalled = false;
  btnEmporter.click();
  assert.strictEqual(suiteCalled, false, "Clicking disabled button does nothing");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 5, "Zero charges consumed on disabled click");

  // Select CHOICE_BAND card
  const cardChoice = racine.querySelector("#pk-objet-depart-CHOICE_BAND");
  assert.ok(cardChoice, "CHOICE_BAND card must exist");
  cardChoice.click();
  assert.strictEqual(btnEmporter.disabled, false, "Emporter button enabled after selection");

  // Confirm selection
  btnEmporter.click();
  assert.strictEqual(suiteCalled, true, "suite() called after Emporter click");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 4, "1 charge consumed from chest (5 -> 4)");
  const sacCourant = UI.partieCourante ? UI.partieCourante().sac : (P.sac ? P.sac() : {});
  assert.strictEqual(sacCourant.CHOICE_BAND, 1, "1 unit of CHOICE_BAND added to partie.sac");

  // Invariant 4: "Partir sans objet"
  suiteCalled = false;
  UI.versCarteOuObjetDepart(mockSuite);
  const btnSans2 = racine.querySelector("#pk-objet-depart-sans");
  assert.ok(btnSans2, "#pk-objet-depart-sans must exist on re-render");
  btnSans2.click();
  assert.strictEqual(suiteCalled, true, "suite() called after 'Partir sans objet'");
  assert.strictEqual(P.coffreLire().CHOICE_BAND, 4, "Charges remain 4");
  assert.strictEqual(P.coffreLire().LEFTOVERS, 3, "Charges remain 3");
});

test("Adventure bag held item category & equipment flow (estObjetTenuOuCombat, RANGS_SAC.tenus, equipping, swapping and recovering old item, reprendre)", () => {
  const ctx = createChestTestContext();
  const UI = ctx.PokeUI;
  const racine = ctx.mockRacine;

  assert.strictEqual(typeof UI.estObjetTenuOuCombat, "function");

  // 1. estObjetTenuOuCombat categorization
  const heldItems = [
    "CHOICE_BAND", "LEFTOVERS", "SHELL_BELL", "FOCUS_BAND", "BRIGHTPOWDER",
    "KINGS_ROCK", "WHITE_HERB", "MENTAL_HERB", "SCOPE_LENS", "QUICK_CLAW"
  ];
  for (const item of heldItems) {
    assert.strictEqual(UI.estObjetTenuOuCombat(item), true, `${item} must be held item`);
  }

  const typeBoosters = ["SILK_SCARF", "CHARCOAL", "MYSTIC_WATER", "MAGNET"];
  for (const item of typeBoosters) {
    assert.strictEqual(UI.estObjetTenuOuCombat(item), true, `${item} must be held item`);
  }

  const berries = ["SITRUS_BERRY", "LUM_BERRY", "CHESTO_BERRY", "LIECHI_BERRY", "SALAC_BERRY"];
  for (const berry of berries) {
    assert.strictEqual(UI.estObjetTenuOuCombat(berry), true, `${berry} must be held item`);
  }

  const nonHeld = ["POTION", "SUPER_POTION", "FIRE_STONE", "WATER_STONE", "PROTEIN", "RARE_CANDY", "POKE_BALL", null, ""];
  for (const item of nonHeld) {
    assert.strictEqual(UI.estObjetTenuOuCombat(item), false, `${item} must not be held item`);
  }

  // 2. RANGS_SAC category
  assert.ok(Array.isArray(UI.RANGS_SAC), "UI.RANGS_SAC must be an array");
  const tenusCat = UI.RANGS_SAC.find(r => r.cle === "tenus");
  assert.ok(tenusCat, "RANGS_SAC must contain 'tenus' category");
  assert.strictEqual(typeof tenusCat.test, "function");

  // 3. Equipment flow: equipping from bag
  const party = {
    sac: { CHOICE_BAND: 1 },
    equipe: [
      { n: 25, niveau: 15, pv: 40, stats: { pv: 40 }, surnom: "Pikachu", objet: null, attaques: [] }
    ],
    regle: "voyage",
    cles: {},
    vus: {},
    pris: {},
    badges: []
  };
  UI.definirPartie(party);
  UI.ecranSac(() => {});

  assert.ok(racine.innerHTML.includes(UI.T("sac_tenus")), "Bag displays OBJETS TENUS section");
  const itemLine = racine.querySelector('[data-objet="CHOICE_BAND"]');
  assert.ok(itemLine, "Clickable CHOICE_BAND line in bag");

  itemLine.click();
  assert.ok(racine.innerHTML.includes("Pikachu"), "choisirPorteur displays team member");
  assert.ok(racine.innerHTML.includes(UI.T("sacPorteRien")), "Shows 'Ne tient aucun objet'");

  const btnMember0 = racine.querySelector('[data-porteur="0"]') || racine.querySelector('[data-cible="0"]');
  assert.ok(btnMember0, "Team member selection button must exist");
  btnMember0.click();

  assert.strictEqual(party.equipe[0].objet, "CHOICE_BAND", "Pikachu now holds CHOICE_BAND");
  assert.strictEqual(party.sac.CHOICE_BAND || 0, 0, "CHOICE_BAND removed from bag");

  // Dismiss dialog
  const btnNext = racine.querySelector("#pk-suivant");
  assert.ok(btnNext, "Confirmation dialog #pk-suivant exists");
  btnNext.click();

  // Bag re-renders: EN MAIN shows Pikachu holding CHOICE_BAND with reprendre button
  assert.ok(racine.innerHTML.includes(UI.T("sac_enMain")), "EN MAIN section displayed");
  assert.ok(racine.querySelector('[data-reprendre="0"]'), "[data-reprendre='0'] button present");

  // 4. Swapping held item and recovering old item back to bag
  party.sac.LEFTOVERS = 1;
  UI.ecranSac(() => {});

  const leftLine = racine.querySelector('[data-objet="LEFTOVERS"]');
  assert.ok(leftLine, "LEFTOVERS item line in bag");
  leftLine.click();

  assert.ok(racine.innerHTML.includes("Porte déjà :") || racine.innerHTML.includes("Bandeau Choix"),
    "Indicates member already holds an item");

  const btnMember0Swap = racine.querySelector('[data-porteur="0"]') || racine.querySelector('[data-cible="0"]');
  btnMember0Swap.click();

  const btnNext2 = racine.querySelector("#pk-suivant");
  assert.ok(btnNext2);
  btnNext2.click();

  assert.strictEqual(party.equipe[0].objet, "LEFTOVERS", "Pikachu now holds LEFTOVERS");
  assert.strictEqual(party.sac.LEFTOVERS || 0, 0, "LEFTOVERS removed from bag");
  assert.strictEqual(party.sac.CHOICE_BAND, 1, "CHOICE_BAND recovered into bag");

  // 5. Reprendre (unequip)
  const btnReprendre = racine.querySelector('[data-reprendre="0"]');
  assert.ok(btnReprendre, "[data-reprendre='0'] button present");
  btnReprendre.click();

  assert.strictEqual(party.equipe[0].objet, null, "Pikachu no longer holds an item");
  assert.strictEqual(party.sac.LEFTOVERS, 1, "LEFTOVERS returned to bag");
  assert.ok(racine.querySelector('[data-objet="LEFTOVERS"]'), "LEFTOVERS displayed under OBJETS TENUS");
  assert.ok(racine.querySelector('[data-objet="CHOICE_BAND"]'), "CHOICE_BAND displayed under OBJETS TENUS");
});

test("Nuzlocke KO held item salvage (nettoyerEquipe salvages held item back to partie.sac, resets mon.objet = null, non-nuzlocke invariance)", () => {
  const PokePartie = noyauContext.PokePartie;
  assert.ok(PokePartie, "PokePartie must be defined in noyauContext");
  assert.strictEqual(typeof PokePartie.nettoyerEquipe, "function", "PokePartie.nettoyerEquipe must be exported");
  assert.strictEqual(PokePartie.nettoyerEquipe, PokePartie.appliquerNuzlocke, "nettoyerEquipe must alias appliquerNuzlocke");

  const nettoyerEquipe = PokePartie.nettoyerEquipe;

  // 1. Nuzlocke: salvage held item on KO
  const monNuzlocke = { n: 25, niveau: 20, pv: 0, objet: "CHOICE_BAND" };
  const partieNuzlocke = {
    regle: "nuzlocke",
    equipe: [monNuzlocke],
    sac: {},
    perdus: [],
    etape: 1
  };

  const partis = nettoyerEquipe(partieNuzlocke);

  assert.strictEqual(partieNuzlocke.sac.CHOICE_BAND, 1, "partie.sac.CHOICE_BAND === 1 after Nuzlocke KO");
  assert.strictEqual(monNuzlocke.objet, null, "Fainted mon.objet must be reset to null");
  assert.strictEqual(partis[0].objet, null, "partis[0].objet must be null");
  assert.strictEqual(partieNuzlocke.equipe.length, 0, "Fainted mon removed from active team");
  assert.strictEqual(partieNuzlocke.perdus.length, 1, "Fainted mon added to partie.perdus");

  // 2. Nuzlocke: multiple KO with cumulative held items
  const monA = { n: 1, niveau: 15, pv: 0, objet: "LEFTOVERS" };
  const monB = { n: 4, niveau: 16, pv: 0, objet: "LEFTOVERS" };
  const partieNuzlockeCumul = {
    regle: "nuzlocke",
    equipe: [monA, monB],
    sac: { LEFTOVERS: 1 },
    perdus: [],
    etape: 2
  };
  nettoyerEquipe(partieNuzlockeCumul);
  assert.strictEqual(partieNuzlockeCumul.sac.LEFTOVERS, 3, "Duplicate held items accumulate in bag (1 + 2 = 3)");
  assert.strictEqual(monA.objet, null);
  assert.strictEqual(monB.objet, null);
  assert.strictEqual(partieNuzlockeCumul.equipe.length, 0);
  assert.strictEqual(partieNuzlockeCumul.perdus.length, 2);

  // 3. Nuzlocke: KO without held item
  const monSansObjet = { n: 7, niveau: 10, pv: 0, objet: null };
  const partieNuzlockeSans = {
    regle: "nuzlocke",
    equipe: [monSansObjet],
    sac: {},
    perdus: [],
    etape: 1
  };
  nettoyerEquipe(partieNuzlockeSans);
  assert.strictEqual(partieNuzlockeSans.equipe.length, 0);
  assert.strictEqual(partieNuzlockeSans.perdus.length, 1);
  assert.strictEqual(Object.keys(partieNuzlockeSans.sac).length, 0, "Bag remains empty when fainted mon had no item");

  // 4. Non-Nuzlocke invariance: fainted mon remains in team and keeps held item
  const monNormalKO = { n: 25, niveau: 20, pv: 0, objet: "CHOICE_BAND" };
  const partieNormale = {
    regle: "voyage",
    equipe: [monNormalKO],
    sac: {},
    perdus: [],
    etape: 1
  };

  const partisNormal = nettoyerEquipe(partieNormale);
  assert.strictEqual(partisNormal.length, 0, "No mon returned in non-nuzlocke mode");
  assert.strictEqual(partieNormale.sac.CHOICE_BAND, undefined, "No item transferred to bag in non-nuzlocke mode");
  assert.strictEqual(monNormalKO.objet, "CHOICE_BAND", "Mon retains held item in non-nuzlocke mode");
  assert.strictEqual(partieNormale.equipe.length, 1, "Mon remains in team in non-nuzlocke mode");
  assert.strictEqual(partieNormale.perdus.length, 0, "partie.perdus remains empty in non-nuzlocke mode");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13: Pokémon Showdown Art Direction & Unified Combat Engine Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("13. Pokémon Showdown Art Direction & Unified Combat Engine Invariants");

// --- Mock DOM Implementation for Showdown UI Invariants ---
class ShowdownMockNode {
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
      this._drawOps = [];
      const drawOps = this._drawOps;
      const c2d = {
        canvas: this,
        save: () => drawOps.push(["save"]),
        restore: () => drawOps.push(["restore"]),
        clearRect: (x, y, w, h) => drawOps.push(["clearRect", x, y, w, h]),
        fillRect: (x, y, w, h) => drawOps.push(["fillRect", x, y, w, h]),
        strokeRect: (x, y, w, h) => drawOps.push(["strokeRect", x, y, w, h]),
        beginPath: () => drawOps.push(["beginPath"]),
        closePath: () => drawOps.push(["closePath"]),
        moveTo: (x, y) => drawOps.push(["moveTo", x, y]),
        lineTo: (x, y) => drawOps.push(["lineTo", x, y]),
        quadraticCurveTo: (cpx, cpy, x, y) => drawOps.push(["quadraticCurveTo", cpx, cpy, x, y]),
        bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => drawOps.push(["bezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y]),
        ellipse: (x, y, rx, ry, rot, sa, ea) => drawOps.push(["ellipse", x, y, rx, ry, rot, sa, ea]),
        arc: (x, y, r, sa, ea) => drawOps.push(["arc", x, y, r, sa, ea]),
        stroke: () => drawOps.push(["stroke"]),
        fill: () => drawOps.push(["fill"]),
        translate: (x, y) => drawOps.push(["translate", x, y]),
        rotate: (a) => drawOps.push(["rotate", a]),
        scale: (sx, sy) => drawOps.push(["scale", sx, sy]),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {},
        fillStyle: "#000",
        strokeStyle: "#000",
        lineWidth: 1,
        globalAlpha: 1,
        shadowBlur: 0,
        shadowColor: "transparent",
      };
      this.getContext = (type) => (type === "2d" ? c2d : null);
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

  get clientWidth() { return this._clientWidth !== undefined ? this._clientWidth : 800; }
  set clientWidth(v) { this._clientWidth = v; }
  get clientHeight() { return this._clientHeight !== undefined ? this._clientHeight : 480; }
  set clientHeight(v) { this._clientHeight = v; }
  get offsetWidth() { return this._clientWidth !== undefined ? this._clientWidth : 800; }
  set offsetWidth(v) { this._clientWidth = v; }
  get offsetHeight() { return this._clientHeight !== undefined ? this._clientHeight : 480; }
  set offsetHeight(v) { this._clientHeight = v; }

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
    if (this.attrs.has(name)) return this.attrs.get(name);
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      return this.dataset[key] !== undefined ? this.dataset[key] : null;
    }
    return null;
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
    if (this.attrs.has(name)) return true;
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      return this.dataset[key] !== undefined;
    }
    return false;
  }

  appendChild(child) {
    if (typeof child === "string") {
      const textNode = new ShowdownMockNode("#text");
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

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  insertBefore(newChild, refChild) {
    if (!refChild) return this.appendChild(newChild);
    const idx = this.children.indexOf(refChild);
    if (idx !== -1) {
      newChild.parentNode = this;
      this.children.splice(idx, 0, newChild);
    } else {
      this.appendChild(newChild);
    }
    return newChild;
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
    return serializeShowdownHTML(this);
  }

  set innerHTML(val) {
    this.children.length = 0;
    this._textContent = "";
    if (val) {
      parseShowdownHTMLInto(val, this);
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
      queryAllDirectShowdown(this, parts[0], results);
    } else {
      let currentSet = [this];
      for (const part of parts) {
        const nextSet = [];
        for (const node of currentSet) {
          queryAllDirectShowdown(node, part, nextSet);
        }
        currentSet = nextSet;
      }
      return currentSet;
    }
    return results;
  }
}

function matchesShowdownSelector(el, sel) {
  if (!el || el.tagName === "#TEXT") return false;
  let rest = sel.trim();

  // ID match #id
  const idMatch = rest.match(/^#([a-zA-Z0-9\-_]+)/);
  if (idMatch) {
    if (el.getAttribute("id") !== idMatch[1] && el.id !== idMatch[1]) return false;
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

function queryAllDirectShowdown(root, sel, results) {
  for (const child of root.children) {
    if (matchesShowdownSelector(child, sel)) {
      results.push(child);
    }
    queryAllDirectShowdown(child, sel, results);
  }
}

function serializeShowdownHTML(el) {
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
      out += `>${serializeShowdownHTML(child)}</${tag}>`;
    }
  }
  return out;
}

function parseShowdownHTMLInto(html, root) {
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
        const node = new ShowdownMockNode(tag);
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
        const textNode = new ShowdownMockNode("#text");
        textNode._textContent = text;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
  }
}

function createShowdownCombatTestContext() {
  const mockDoc = {
    createElement: (tag) => new ShowdownMockNode(tag),
    createTextNode: (text) => {
      const n = new ShowdownMockNode("#text");
      n._textContent = text;
      return n;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    body: new ShowdownMockNode("body"),
  };

  let curRafTime = 0;
  const ctx = createIsolatedContext({
    document: mockDoc,
    window: null,
    Image: function () { this.src = ""; },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    devicePixelRatio: 2,
    requestAnimationFrame: (cb) => {
      curRafTime += 2000;
      if (cb) cb(curRafTime);
      return 1;
    },
    cancelAnimationFrame: () => {},
  });
  ctx.window = ctx;
  loadScriptInContext("js/poke/ordre.js", ctx);
  for (const f of ctx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, ctx);
  }
  loadScriptInContext("js/poke/tempo.js", ctx);
  loadScriptInContext("js/poke/icones.js", ctx);
  loadScriptInContext("js/poke/sprites-showdown.js", ctx);
  loadScriptInContext("js/poke/anim-showdown.js", ctx);
  loadScriptInContext("js/poke/ui-combat.js", ctx);
  return ctx;
}

function createShowdownCentralTestContext() {
  const rootNode = new ShowdownMockNode("div");
  rootNode.setAttribute("id", "poke-racine");

  let store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };

  const mockDoc = {
    createElement: (tag) => new ShowdownMockNode(tag),
    createTextNode: (text) => {
      const n = new ShowdownMockNode("#text");
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

  const ctx = createIsolatedContext({
    document: mockDoc,
    localStorage: mockLocalStorage,
    location: { href: "", search: "", pathname: "", hash: "" },
    history: { replaceState() {} },
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve([]) }),
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    POKE_TEST: true,
  });
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.W = ctx;
  ctx.D = ctx.document;

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

  if (ctx.PokeRegles && typeof ctx.PokeRegles.poser === "function") {
    ctx.PokeRegles.poser("gen3");
  }

  if (ctx.PokeUICombat && ctx.PokeUICombat.Ecran && !ctx.PokeUICombat.Ecran.prototype.hasOwnProperty("elAttaques")) {
    Object.defineProperty(ctx.PokeUICombat.Ecran.prototype, "elAttaques", {
      get() {
        return (this.elActions && this.elActions.querySelector(".pk-grille-attaques")) ||
               (this.hote && this.hote.querySelector(".pk-grille-attaques")) || null;
      },
      configurable: true
    });
  }

  return { ctx, rootNode };
}

function createShowdownDummyState(context) {
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

test("Showdown design tokens, dark surfaces, and elimination of glaring #ffffff container backgrounds", () => {
  const CSS_PATH = path.join(ROOT_DIR, "css", "poke.css");
  assert.ok(fs.existsSync(CSS_PATH), "css/poke.css must exist");
  const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

  // Surfaces & Backgrounds
  assert.match(cssContent, /--fond:\s*#080c14/, "--fond must be #080c14");
  assert.match(cssContent, /--surface-base:\s*#0f172a/, "--surface-base must be #0f172a");
  assert.match(cssContent, /--surface-carte:\s*#1e293b/, "--surface-carte must be #1e293b");
  assert.match(cssContent, /--surface-survol:\s*#334155/, "--surface-survol must be #334155");
  assert.match(cssContent, /--bordure-nette:\s*#334155/, "--bordure-nette must be #334155");
  assert.match(cssContent, /--bordure-focus:\s*#38bdf8/, "--bordure-focus must be #38bdf8");
  assert.match(cssContent, /--bordure-douce:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/, "--bordure-douce must be rgba(255, 255, 255, 0.08)");

  // Elimination of glaring #ffffff surfaces
  assert.doesNotMatch(cssContent, /--sur-fond:\s*#ffffff/, "--sur-fond must NEVER be #ffffff");
  assert.match(cssContent, /--sur-fond:\s*#1e293b/, "--sur-fond must be #1e293b");
  assert.doesNotMatch(cssContent, /--arene-ecran:\s*#ffffff/, "--arene-ecran must NEVER be #ffffff");
  assert.match(cssContent, /--arene-ecran:\s*#0f172a/, "--arene-ecran must be #0f172a");

  // High contrast typography tokens
  assert.match(cssContent, /--texte-principal:\s*#f8fafc/, "--texte-principal must be #f8fafc");
  assert.match(cssContent, /--texte-secondaire:\s*#94a3b8/, "--texte-secondaire must be #94a3b8");
  assert.match(cssContent, /--texte-discret:\s*#64748b/, "--texte-discret must be #64748b");
  assert.doesNotMatch(cssContent, /color:\s*var\(--texte\)/, "Must not use font-family stack --texte as a color value");
  assert.doesNotMatch(cssContent, /color:\s*var\(--sur-fond\)/, "Must not use dark surface token --sur-fond as text color");

  // 18 canonical Showdown type tokens
  const types = {
    normal: "#9099a1",
    feu: "#ff9c54",
    eau: "#4f90d5",
    plante: "#63bb5b",
    electrik: "#f3d23b",
    glace: "#74cec0",
    combat: "#ce4069",
    poison: "#ab6ac8",
    sol: "#d97746",
    vol: "#8fa8dd",
    psy: "#f97176",
    insecte: "#90c12c",
    roche: "#c7b78b",
    spectre: "#5269ac",
    dragon: "#096dc4",
    acier: "#5a8fa3",
    tenebres: "#5a5366",
    fee: "#ec8fe6",
  };
  for (const [type, color] of Object.entries(types)) {
    const reg = new RegExp(`--type-${type}:\\s*${color}`, "i");
    assert.match(cssContent, reg, `--type-${type} must be defined with color ${color}`);
  }

  // Dynamic health gradients
  assert.match(cssContent, /--hp-haut:\s*linear-gradient\([^;]*#22c55e[^;]*#16a34a[^;]*\)/, "--hp-haut gradient must contain #22c55e and #16a34a");
  assert.match(cssContent, /--hp-moyen:\s*linear-gradient\([^;]*#eab308[^;]*#ca8a04[^;]*\)/, "--hp-moyen gradient must contain #eab308 and #ca8a04");
  assert.match(cssContent, /--hp-critique:\s*linear-gradient\([^;]*#ef4444[^;]*#dc2626[^;]*\)/, "--hp-critique gradient must contain #ef4444 and #dc2626");

  // Layout classes
  assert.match(cssContent, /\.pk-showdown-combat\s*\{[^}]*max-width:\s*1100px/s, ".pk-showdown-combat must have max-width: 1100px");
  assert.match(cssContent, /\.pk-arene-showdown\s*\{[^}]*position:\s*relative/s, ".pk-arene-showdown must have position: relative");
  assert.match(cssContent, /\.pk-arene-socle/s, ".pk-arene-socle must exist");
  assert.match(cssContent, /\.pk-healthbox\s*\{[^}]*var\(--surface-carte\)/s, ".pk-healthbox must use --surface-carte");
  assert.match(cssContent, /\.pk-healthbar\s*\{[^}]*height:\s*10px/s, ".pk-healthbar must have 10px height");
  assert.match(cssContent, /\.pk-grille-attaques\s*\{[^}]*display:\s*grid/s, ".pk-grille-attaques must be display: grid");
  assert.match(cssContent, /\.pk-attaque-btn\s*\{/s, ".pk-attaque-btn must exist");
  assert.match(cssContent, /\.pk-battle-log\s*\{[^}]*overflow-y:\s*auto/s, ".pk-battle-log must have overflow-y: auto");
});

test("Unified Showdown Combat Engine presentation (PokeUICombat.Ecran: perspective arena, floating healthboxes, 2x2 move grid, live battle log, bag suppression)", () => {
  const ctx = createShowdownCombatTestContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  assert.ok(Ecran, "PokeUICombat.Ecran constructor must be defined");

  const hote = new ShowdownMockNode("div");
  const etat = createShowdownDummyState(ctx);
  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  // 1. Perspective arena layout
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

  // 2. Floating healthboxes
  const hbAdverse = hote.querySelector('.pk-healthbox[data-cote="adverse"]');
  assert.ok(hbAdverse, "Opponent healthbox must exist");
  const hbJoueur = hote.querySelector('.pk-healthbox[data-cote="joueur"]');
  assert.ok(hbJoueur, "Player healthbox must exist");

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
  assert.match(hbJoueur.querySelector(".pk-hb-nom").textContent, /Pikachu/i, "Player name must be Pikachu");
  assert.match(hbAdverse.querySelector(".pk-hb-nom").textContent, /Bulbizarre/i, "Opponent name must be Bulbizarre");

  // 3. 2x2 move grid & tactical row
  const grille = hote.querySelector(".pk-grille-attaques");
  assert.ok(grille, "Must render .pk-grille-attaques in showdown actions");
  const boutons = grille.querySelectorAll(".pk-attaque-btn");
  assert.equal(boutons.length, 4, "Must render 4 move buttons in 2x2 grid");

  const premier = boutons[0];
  assert.match(premier.textContent, /Tonnerre/i, "First move button must display Tonnerre");
  assert.ok(!premier.textContent.includes("[object Object]"), "Move button must not contain [object Object]");
  const cat = premier.querySelector(".pk-cat-tag");
  assert.ok(cat, "Move button must include category tag .pk-cat-tag");
  assert.match(cat.textContent, /PHY|SPÉ|SPE|STAT/, "Category tag must display PHY, SPÉ, or STAT");
  assert.match(premier.textContent, /Pui/i, "Move button must indicate Power (Pui)");
  assert.match(premier.textContent, /Préc/i, "Move button must indicate Precision (Préc)");
  assert.match(premier.textContent, /PP/i, "Move button must indicate PP");
  assert.match(premier.textContent, /15\s*\/\s*15/, "Move button must show PP");

  const barreTactique = hote.querySelector(".pk-barre-tactique");
  assert.ok(barreTactique, "Must render .pk-barre-tactique");
  assert.match(barreTactique.textContent, /ÉQUIPE|SWITCH/i, "Tactical row must contain Équipe button");
  assert.match(barreTactique.textContent, /ABANDONNER|FUIR/i, "Tactical row must contain Abandonner button");
  assert.match(barreTactique.textContent, /SAC/i, "Tactical row must contain Sac button in standard battle");

  // Move disabled when 0 PP or entrave
  etat.joueur.equipe[0].attaques[0].pp = 0;
  etat.joueur.volatils.entrave = { index: 1, tours: 2 };
  const ecranDisabled = new Ecran(new ShowdownMockNode("div"), etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });
  const boutonsDis = ecranDisabled.hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  assert.ok(boutonsDis[0].disabled || boutonsDis[0].getAttribute("aria-disabled") === "true", "0 PP move must be disabled");
  assert.ok(boutonsDis[1].disabled || boutonsDis[1].getAttribute("aria-disabled") === "true", "Entrave move must be disabled");
  assert.ok(!boutonsDis[2].disabled, "Move with PP must be enabled");

  // 4. Dynamic HP gradients & status pills
  const barreJoueur = hbJoueur.querySelector(".pk-hb-barre-remplie");
  const chiffreJoueur = hbJoueur.querySelector(".pk-hb-chiffre");
  const barreAdverse = hbAdverse.querySelector(".pk-hb-barre-remplie");
  const chiffreAdverse = hbAdverse.querySelector(".pk-hb-chiffre");

  assert.equal(barreJoueur.style.width, "100%", "Initial HP width must be 100%");
  assert.match(barreJoueur.style.background, /var\(--hp-haut\)/, "Initial HP gradient must be --hp-haut");
  assert.match(chiffreJoueur.textContent, /100\s*\/\s*100\s*\(100\s*%\)/, "Player healthbox displays 100/100 (100%)");
  assert.match(chiffreAdverse.textContent, /100\s*%/, "Opponent healthbox displays 100%");

  etat.joueur.equipe[0].pv = 40;
  etat.adverse.equipe[0].pv = 35;
  ecran.rafraichir();
  assert.equal(barreJoueur.style.width, "40%");
  assert.match(barreJoueur.style.background, /var\(--hp-moyen\)/, "40% HP gradient must be --hp-moyen");
  assert.match(chiffreJoueur.textContent, /40\s*\/\s*100\s*\(40\s*%\)/);

  etat.joueur.equipe[0].pv = 15;
  ecran.rafraichir();
  assert.equal(barreJoueur.style.width, "15%");
  assert.match(barreJoueur.style.background, /var\(--hp-critique\)/, "15% HP gradient must be --hp-critique");

  etat.joueur.equipe[0].statut = "brulure";
  ecran.rafraichir();
  const statutPill = hbJoueur.querySelector(".pk-hb-statut-hote");
  assert.match(statutPill.textContent, /BRN|BRU/, "Status pill displays BRN/BRU on burn");

  // 5. Live battle log
  const logFlux = hote.querySelector(".pk-battle-log-flux") || hote.querySelector(".pk-battle-log");
  assert.ok(logFlux, "Battle log flux container must exist");

  ecran.dire("Pikachu lance Tonnerre !");
  assert.equal(toast.textContent, "Pikachu lance Tonnerre !");
  assert.match(logFlux.textContent, /Pikachu lance Tonnerre !/);

  ecran.agir({ type: "attaque", index: 0 });
  assert.match(logFlux.textContent, /---\s*Tour\s*1\s*---/);
  const tourHeader = logFlux.querySelector(".pk-log-tour");
  assert.ok(tourHeader, "Must render .pk-log-tour element");

  if (typeof ecran.ajouterTour === "function") {
    ecran.ajouterTour(2);
    assert.match(logFlux.textContent, /---\s*Tour\s*2\s*---/);
  }
  if (typeof ecran.ajouterLog === "function") {
    ecran.ajouterLog("Coup critique !", "critique");
    assert.match(logFlux.textContent, /Coup critique !/);
  }

  // 6. Bag button suppression in usine/duels
  const hoteUsine = new ShowdownMockNode("div");
  const etatUsine = createShowdownDummyState(ctx);
  new Ecran(hoteUsine, etatUsine, { hasard: new ctx.PokeHasard(1), rythme: 900, usine: true });
  assert.doesNotMatch(hoteUsine.querySelector(".pk-barre-tactique").textContent, /\bSAC\b/i, "Bag button must NOT exist when usine: true");

  const hoteDuel = new ShowdownMockNode("div");
  const etatDuel = createShowdownDummyState(ctx);
  new Ecran(hoteDuel, etatDuel, { hasard: new ctx.PokeHasard(1), rythme: 900, duel: true });
  assert.doesNotMatch(hoteDuel.querySelector(".pk-barre-tactique").textContent, /\bSAC\b/i, "Bag button must NOT exist when duel: true");
});

test("Battle Factory Showdown Teambuilder draft (PokeUIUsine.ouvrirDraft & rendreCartePokemon: 6 rich profile cards, 80px sprites, explicit nature modifiers, ability, item, moves, 3/3 selection validation)", () => {
  const { ctx } = createShowdownCentralTestContext();
  const U = ctx.PokeUIUsine;
  assert.strictEqual(typeof U.rendreCartePokemon, "function", "rendreCartePokemon must be exported");

  // 1. Non-neutral nature (rigide)
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
  assert.ok(cardHtml.includes("pk-carte-mon"), "Must use .pk-carte-mon card class");
  assert.ok(cardHtml.includes("pk-carte-sprite"), "Must include .pk-carte-sprite");
  assert.ok(cardHtml.includes("80"), "Must specify 80px sprite dimensions");
  assert.ok(cardHtml.includes("N.50") || cardHtml.includes("Niveau 50"), "Must include N.50 level badge");
  assert.ok(cardHtml.includes("pk-badge-type") && cardHtml.includes("pk-type-electrik"), "Must display official type pill");
  assert.ok(cardHtml.includes("Rigide"), "Must show nature name Rigide");
  assert.ok(cardHtml.includes("(+Atk, -SpA)") || (cardHtml.includes("(+") && cardHtml.includes("-)")), "Must display explicit stat modifier (+Stat, -Stat)");
  assert.ok(cardHtml.includes("Statik"), "Must display talent name");
  assert.ok(cardHtml.includes("pk-talent-desc") || cardHtml.includes("contact"), "Must include ability description");
  assert.ok(cardHtml.includes("Restes") || cardHtml.includes("LEFTOVERS"), "Must display held item");
  assert.ok(cardHtml.includes("pk-mon-attaque-pill") || cardHtml.includes("pk-mon-attaque-ligne"), "Must render move pills");
  assert.ok(cardHtml.includes("pk-type-"), "Move pills must have pk-type-* class");
  assert.ok(cardHtml.includes("Pui:"), "Move pills must show power (Pui)");
  assert.ok(cardHtml.includes("Préc:"), "Move pills must show precision (Préc)");

  // 2. Neutral nature (hardi)
  const monNeutre = {
    n: 1,
    nature: "hardi",
    talent: "OVERGROW",
    attaques: [{ cle: "TACKLE" }]
  };
  const cardNeutreHtml = U.rendreCartePokemon(monNeutre, 1, false, "draft");
  assert.ok(cardNeutreHtml.includes("(Neutre)"), "Neutral nature must display (Neutre)");

  // 3. Draft selection & 3/3 validation
  const session = ctx.PokeUsine.creerSession({ graine: "TEST-DRAFT-INVARIANTS" });
  const cible = new ShowdownMockNode("div");
  U.ouvrirDraft(session, { cible });

  const wrappers = cible.querySelectorAll(".pk-draft-carte-wrapper");
  assert.strictEqual(wrappers.length, 6, "Must render exactly 6 draft card wrappers");

  const compteur = cible.querySelector("#pk-draft-compteur");
  assert.ok(compteur, "Must have #pk-draft-compteur");
  assert.ok(compteur.textContent.includes("0 / 3"), "Initial counter must be 0 / 3");

  let btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm, "Must have confirm button #pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must be disabled initially");

  // Selection interaction
  wrappers[0].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("1 / 3"), "Counter must update to 1 / 3");
  const cartesApres1 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  assert.ok(cartesApres1[0].classList.contains("est-selectionne") || cartesApres1[0].querySelector(".est-selectionne"), "Selected card must have .est-selectionne");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must remain disabled with 1 selection");

  cartesApres1[1].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("2 / 3"), "Counter must update to 2 / 3");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must remain disabled with 2 selections");

  const cartesApres2 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  cartesApres2[2].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("3 / 3"), "Counter must update to 3 / 3");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(!btnConfirm.disabled && !btnConfirm.hasAttribute("disabled"), "Confirm button must be ENABLED when exactly 3 are selected");

  const cartesApres3 = cible.querySelectorAll(".pk-draft-carte-wrapper");
  cartesApres3[3].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("3 / 3"), "Counter must stay at 3 / 3 on 4th click attempt");

  cartesApres3[0].click();
  assert.ok(cible.querySelector("#pk-draft-compteur").textContent.includes("2 / 3"), "Counter must drop to 2 / 3 after deselection");
  btnConfirm = cible.querySelector("#pk-draft-confirmer");
  assert.ok(btnConfirm.disabled || btnConfirm.hasAttribute("disabled"), "Confirm button must be disabled again when below 3");

  // Re-select 0 to reach 3/3 and confirm
  cartesApres3[0].click();
  ctx.PokeUsine.choisirEquipeInitiale(session, [0, 1, 2]);
  assert.strictEqual(session.equipe.length, 3, "Team must have 3 Pokémon after selection");
  assert.strictEqual(session.statut, "combat", "Status must switch to combat");
  assert.ok(session.adversaire, "Opponent must be drawn");
});

test("Battle Factory comparative 2-column swap (PokeUIUsine.ouvrirEchange), Samson lobby with 4 metric cards, and dark PCo shop with category filter tabs and reserve indicators", () => {
  const { ctx } = createShowdownCentralTestContext();
  const U = ctx.PokeUIUsine;
  const P = ctx.PokeProgression;

  // 1. Comparative 2-column swap
  const sessionSwap = ctx.PokeUsine.creerSession({ graine: "TEST-SWAP-INVARIANTS" });
  ctx.PokeUsine.choisirEquipeInitiale(sessionSwap, [0, 1, 2]);
  const hSwap = new ctx.PokeHasard("TEST-SWAP-ADV-INVARIANTS");
  sessionSwap.adversaire = ctx.PokeUsine.tirerAdversaire(sessionSwap, hSwap);

  const cibleSwap = new ShowdownMockNode("div");
  U.ouvrirEchange(sessionSwap, { cible: cibleSwap });

  const colonnes = cibleSwap.querySelector(".pk-echange-colonnes");
  assert.ok(colonnes, "Must contain 2-column container .pk-echange-colonnes");
  const colJoueur = cibleSwap.querySelector(".pk-col-joueur");
  assert.ok(colJoueur, "Must have player column .pk-col-joueur");
  assert.ok(colJoueur.textContent.includes("Votre équipe"), "Player column must display header");
  const colAdverse = cibleSwap.querySelector(".pk-col-adverse");
  assert.ok(colAdverse, "Must have opponent column .pk-col-adverse");
  assert.ok(colAdverse.textContent.includes("Équipe vaincue"), "Opponent column must display header");

  const wrapsJoueur = cibleSwap.querySelectorAll('.pk-swap-carte-wrap[data-side="joueur"]');
  assert.strictEqual(wrapsJoueur.length, 3, "Player column must show 3 team cards");
  const wrapsAdverse = cibleSwap.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  assert.strictEqual(wrapsAdverse.length, 3, "Opponent column must show 3 team cards");

  let btnConfirmSwap = cibleSwap.querySelector("#pk-swap-confirmer");
  assert.ok(btnConfirmSwap, "Must have confirm swap button #pk-swap-confirmer");
  assert.ok(btnConfirmSwap.disabled || btnConfirmSwap.hasAttribute("disabled"), "Confirm swap button must be disabled initially");

  const btnGarder = cibleSwap.querySelector("#pk-swap-garder");
  assert.ok(btnGarder, "Must have keep team button #pk-swap-garder");
  assert.ok(!btnGarder.disabled, "Keep team button must be enabled");

  wrapsJoueur[0].click();
  const apresJ1 = cibleSwap.querySelectorAll('.pk-swap-carte-wrap[data-side="joueur"]');
  assert.ok(apresJ1[0].classList.contains("est-selectionne") || apresJ1[0].querySelector(".est-selectionne"), "Selected player card must have .est-selectionne");
  btnConfirmSwap = cibleSwap.querySelector("#pk-swap-confirmer");
  assert.ok(btnConfirmSwap.disabled || btnConfirmSwap.hasAttribute("disabled"), "Confirm swap button must remain disabled with only 1 side selected");

  const apresAdv = cibleSwap.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  apresAdv[1].click();
  const apresAdvSel = cibleSwap.querySelectorAll('.pk-swap-carte-wrap[data-side="adverse"]');
  assert.ok(apresAdvSel[1].classList.contains("est-selectionne") || apresAdvSel[1].querySelector(".est-selectionne"), "Selected opponent card must have .est-selectionne");

  btnConfirmSwap = cibleSwap.querySelector("#pk-swap-confirmer");
  assert.ok(!btnConfirmSwap.disabled && !btnConfirmSwap.hasAttribute("disabled"), "Confirm swap button must be ENABLED when 1 from each side is selected");

  // 2. Samson lobby with 4 metric cards
  P.ajouterPCo(40);
  P.enregistrerRecordUsine(21);
  P.debloquerSymboleUsine("argent");
  P.debloquerSymboleUsine("or");
  P.coffreAjouter("LEFTOVERS", 5);

  const cibleHall = new ShowdownMockNode("div");
  U.ouvrirHall({ cible: cibleHall });

  const metrics = cibleHall.querySelectorAll(".pk-metric-card");
  assert.strictEqual(metrics.length, 4, "Hall must render exactly 4 metric cards");
  assert.ok(cibleHall.querySelector(".pk-metric-pco"), "Must contain PCo metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-record"), "Must contain Record metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-symbole-argent"), "Must contain Silver Symbol metric card");
  assert.ok(cibleHall.querySelector(".pk-metric-symbole-or"), "Must contain Gold Symbol metric card");
  assert.ok(cibleHall.textContent.includes("Samson") || cibleHall.textContent.includes("Noland"), "Hall must mention Noland/Samson");

  // 3. Dark PCo shop with category filter tabs and reserve indicators
  const cibleBoutique = new ShowdownMockNode("div");
  U.ouvrirBoutiquePCo({ cible: cibleBoutique });

  const onglets = cibleBoutique.querySelectorAll(".pk-boutique-onglet");
  assert.ok(onglets.length >= 5, "Boutique must provide category filter tabs");
  const ongletLabels = onglets.map(o => o.textContent);
  assert.ok(ongletLabels.includes("Tous"), "Must have 'Tous' tab");
  assert.ok(ongletLabels.includes("Combat"), "Must have 'Combat' tab");
  assert.ok(ongletLabels.includes("Baies"), "Must have 'Baies' tab");

  const reserves = cibleBoutique.querySelectorAll(".pk-boutique-reserve");
  assert.ok(reserves.length > 0, "Boutique must show reserve indicator badge for stored items");
  assert.ok(reserves[0].textContent.includes("En réserve :") || reserves[0].textContent.includes("utilisation"), "Reserve badge must show stored count");

  const ongletCombat = onglets.find(o => o.textContent === "Combat");
  assert.ok(ongletCombat, "Combat tab must exist");
  ongletCombat.click();

  const cartesCombat = cibleBoutique.querySelectorAll(".pk-boutique-carte");
  assert.ok(cartesCombat.length > 0, "Combat items must be displayed after filtering");
  for (const c of cartesCombat) {
    assert.ok(c.classList.contains("pk-cat-combat") || c.textContent.includes("Combat"), "All displayed items must be in Combat category");
  }
});

test("Central UI screens (accueil(), carte(), ecranSac(), ecranCoffre(), and pokedex-ui.js: dark lobby banner with profile stats, mode cards, tactical roadmap nodes, tabbed bag/chest, and Pokédex stat bars)", () => {
  const { ctx, rootNode } = createShowdownCentralTestContext();
  const P = ctx.PokeProgression;
  const UI = ctx.PokeUI;

  // 1. accueil()
  P.ecrire({
    voyages: 12,
    badgesMax: 8,
    pris: { 1: 1, 4: 1, 7: 1, 25: 1 },
    vus: { 1: 1, 2: 1, 3: 1, 4: 1, 7: 1, 25: 1 }
  });
  P.coffreAjouter("CHOICE_BAND", 5);
  P.coffreAjouter("LEFTOVERS", 3);

  ctx.PokeDemarrer();

  const banner = rootNode.querySelector(".pk-lobby-banner") || rootNode.querySelector(".pk-accueil-banner");
  assert.ok(banner, "Lobby must render trainer banner (.pk-lobby-banner or .pk-accueil-banner)");

  const stats = rootNode.querySelector(".pk-accueil-stats") || rootNode.querySelector(".pkdx-compte-releve");
  assert.ok(stats, "Lobby banner must render profile stats container");
  const statsText = stats.textContent;
  assert.match(statsText, /12/, "Stats must display 12 runs/voyages");
  assert.match(statsText, /8\s*\/\s*8/, "Stats must display 8 / 8 badges");
  assert.match(statsText, /4\s*\/\s*(?:151|386)/, "Stats must display dex collected count");

  const modeGrid = rootNode.querySelector(".pk-modes-grille") || rootNode.querySelector(".pk-accueil-modes");
  assert.ok(modeGrid, "Lobby must render mode cards grid (.pk-modes-grille or .pk-accueil-modes)");
  assert.ok(rootNode.querySelector("#pk-go"), "Must render #pk-go");
  assert.ok(rootNode.querySelector("#pk-defi"), "Must render #pk-defi");
  assert.ok(rootNode.querySelector("#pk-usine"), "Must render #pk-usine");
  assert.ok(rootNode.querySelector("#pk-duel"), "Must render #pk-duel");

  const btnCoffre = rootNode.querySelector("#pk-coffre");
  assert.ok(btnCoffre, "Must render #pk-coffre button");
  const compte = rootNode.querySelector("#pk-coffre-compte");
  assert.ok(compte, "Must render #pk-coffre-compte");
  assert.match(compte.textContent, /2/, "Must show 2 distinct items in chest");

  // 2. carte()
  const testPartie = {
    starter: 25,
    acte: 1,
    rangee: 0,
    regle: "voyage",
    equipe: [{ n: 25, niveau: 12, pv: 35, stats: { pv: 35 }, surnom: "Pikachu", objet: null, attaques: [] }],
    boite: [{ n: 16, niveau: 10, pv: 30, stats: { pv: 30 }, attaques: [] }],
    sac: { POTION: 3, POKE_BALL: 5, CHOICE_BAND: 1, PROTEIN: 2, FIRE_STONE: 1 },
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

  const noeudCourant = rootNode.querySelector('.pkdx-rangee[data-etat="courante"] .pk-carte-noeud') ||
                        rootNode.querySelector('.pk-carte-noeud.est-courant') ||
                        rootNode.querySelector('.pk-carte-noeud:not([disabled])');
  assert.ok(noeudCourant, "Active node in current row must be rendered");

  const barreTactique = rootNode.querySelector(".pk-carte-barre-tactique") || rootNode.querySelector(".pkdx-actions.est-carte");
  assert.ok(barreTactique, "Must render tactical access bar (.pk-carte-barre-tactique or .est-carte)");
  assert.ok(rootNode.querySelector("#pk-sac"), "Must render #pk-sac");
  assert.ok(rootNode.querySelector("#pk-boite"), "Must render #pk-boite");
  assert.ok(rootNode.querySelector("#pk-juge"), "Must render #pk-juge");
  assert.ok(rootNode.querySelector("#pk-dex"), "Must render #pk-dex");

  // 3. ecranSac()
  UI.ecranSac(() => {});
  const tabs = rootNode.querySelector(".pk-sac-onglets");
  assert.ok(tabs, "Bag must render category navigation tabs (.pk-sac-onglets)");
  const tabButtons = tabs.querySelectorAll(".pk-sac-onglet");
  assert.ok(tabButtons.length >= 4, "Must render at least 4 category tabs");

  const itemCards = rootNode.querySelectorAll(".pk-sac-carte") || rootNode.querySelectorAll(".pkdx-objet-ligne");
  assert.ok(itemCards.length >= 5, "Must render item cards for bag contents");

  const quantiteBadge = rootNode.querySelector(".pk-badge-quantite") || rootNode.querySelector(".pkdx-objet-n");
  assert.ok(quantiteBadge, "Item cards must display quantity badge");
  assert.match(quantiteBadge.textContent, /×\d+/, "Quantity badge format ×N");

  const btnChoice = rootNode.querySelector('[data-objet="CHOICE_BAND"]');
  assert.ok(btnChoice, "CHOICE_BAND card must be present and clickable");
  btnChoice.click();

  const btnPorteur0 = rootNode.querySelector('[data-porteur="0"]') || rootNode.querySelector('[data-cible="0"]');
  assert.ok(btnPorteur0, "choisirPorteur must display team member button");
  btnPorteur0.click();

  assert.equal(testPartie.equipe[0].objet, "CHOICE_BAND", "Pikachu must now hold CHOICE_BAND");
  assert.equal(testPartie.sac.CHOICE_BAND || 0, 0, "CHOICE_BAND must be removed from bag");

  const btnSuivant = rootNode.querySelector("#pk-suivant");
  if (btnSuivant) btnSuivant.click();
  assert.ok(rootNode.querySelector('[data-reprendre="0"]'), "Bag must render [data-reprendre='0'] button");

  // 4. ecranCoffre()
  UI.ecranCoffre();
  const cartesCoffre = rootNode.querySelectorAll(".pk-coffre-carte");
  assert.equal(cartesCoffre.length, 2, "Must render 2 cards in chest screen");

  const badgeCharges = rootNode.querySelectorAll(".pk-coffre-badge-charges");
  assert.equal(badgeCharges.length, 2, "Must render charges badge on each chest card");
  assert.match(badgeCharges[0].textContent, /⚡\s*5/, "First badge displays ⚡ 5 utilisations");
  assert.match(badgeCharges[1].textContent, /⚡\s*3/, "Second badge displays ⚡ 3 utilisations");
  assert.ok(rootNode.querySelector("#pk-coffre-retour"), "#pk-coffre-retour button must exist");

  // 5. pokedex-ui.js
  const Pokedex = ctx.PokePokedex;
  P.ecrire(Object.assign(P.lire(), {
    pris: { 1: { niveau: 5, zone: "depart" } },
    vus: { 1: true, 4: true }
  }));
  const mockDexPartie = {
    version: "rouge",
    pris: { 1: { niveau: 5, zone: "depart" } },
    vus: { 1: true, 4: true }
  };
  Pokedex.ouvrir(rootNode, mockDexPartie, () => {});

  // Check 3 accessibility states in grid
  assert.equal(rootNode.querySelector('.pkdx-case[data-n="1"]').getAttribute("data-etat"), "pris", "Bulbasaur state must be 'pris'");
  assert.equal(rootNode.querySelector('.pkdx-case[data-n="4"]').getAttribute("data-etat"), "vu", "Charmander state must be 'vu'");
  assert.equal(rootNode.querySelector('.pkdx-case[data-n="7"]').getAttribute("data-etat"), "inconnu", "Squirtle state must be 'inconnu'");

  const case1 = rootNode.querySelector('.pkdx-case[data-n="1"]');
  assert.ok(case1, "Case for Bulbasaur (N°1) must exist in grid");
  case1.click();

  const portrait = rootNode.querySelector(".pk-dex-art") || rootNode.querySelector(".pkdx-portrait");
  assert.ok(portrait, "Must render Sugimori artwork element");
  assert.match(portrait.getAttribute("src"), /assets\/img\/poke\/art\/1\.webp/, "Must point to official Sugimori art");

  const statBars = rootNode.querySelectorAll(".pk-stat-barre") || rootNode.querySelectorAll(".pk-dex-stat");
  assert.ok(statBars.length >= 5, "Must render at least 5 base stats bars");

  const typePills = rootNode.querySelectorAll(".pk-badge-type") || rootNode.querySelectorAll(".pkdx-type");
  assert.ok(typePills.length >= 2, "Must render at least 2 type pills for Bulbasaur");

  const abilitySection = rootNode.querySelector(".pk-dex-talent") || rootNode.querySelector(".pk-dex-ability");
  assert.ok(abilitySection, "Must render ability breakdown section");
  assert.match(abilitySection.textContent, /Engrais|Overgrow/i, "Must display Bulbasaur's canonical ability name");
});

test("Showdown animated sprite routing and resilient offline fallback", () => {
  const ctx = createShowdownCombatTestContext();
  const S = ctx.PokeSpritesShowdown;
  assert.ok(S, "PokeSpritesShowdown must be exported");

  // 1. nomShowdown mapping for canonical and special cases
  assert.strictEqual(S.nomShowdown(1), "bulbasaur", "#1 should be bulbasaur");
  assert.strictEqual(S.nomShowdown(25), "pikachu", "#25 should be pikachu");
  assert.strictEqual(S.nomShowdown(29), "nidoranf", "#29 Nidoran♀ should be nidoranf");
  assert.strictEqual(S.nomShowdown(32), "nidoranm", "#32 Nidoran♂ should be nidoranm");
  assert.strictEqual(S.nomShowdown(83), "farfetchd", "#83 Farfetch'd should be farfetchd");
  assert.strictEqual(S.nomShowdown(122), "mrmime", "#122 Mr. Mime should be mrmime");
  assert.strictEqual(S.nomShowdown(233), "porygon2", "#233 Porygon2 should be porygon2");
  assert.strictEqual(S.nomShowdown(250), "hooh", "#250 Ho-Oh should be hooh");
  assert.strictEqual(S.nomShowdown(386), "deoxys", "#386 Deoxys should be deoxys");

  // Object input & string normalizations
  assert.strictEqual(S.nomShowdown({ n: 25 }), "pikachu");
  assert.strictEqual(S.nomShowdown("Pikachu"), "pikachu");
  assert.strictEqual(S.nomShowdown("Nidoran♀"), "nidoranf");
  assert.strictEqual(S.nomShowdown("Nidoran♂"), "nidoranm");
  assert.strictEqual(S.nomShowdown("Farfetch'd"), "farfetchd");
  assert.strictEqual(S.nomShowdown("Mr. Mime"), "mrmime");
  assert.strictEqual(S.nomShowdown("Ho-Oh"), "hooh");
  assert.strictEqual(S.nomShowdown("Deoxys"), "deoxys");

  // All 386 species map to non-empty lowercase alphanumeric strings
  for (let n = 1; n <= 386; n++) {
    const nom = S.nomShowdown(n);
    assert.ok(nom && typeof nom === "string" && /^[a-z0-9]+$/.test(nom), `Species #${n} must map to valid lowercase alphanumeric string`);
  }

  // 2. Animated GIF URL generation (front, back, shiny)
  assert.strictEqual(S.aniFace(25), "https://play.pokemonshowdown.com/sprites/ani/pikachu.gif");
  assert.strictEqual(S.aniDos(25), "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif");
  assert.strictEqual(S.aniFace({ n: 25, chromatique: true }), "https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif");
  assert.strictEqual(S.aniDos({ n: 25, chromatique: true }), "https://play.pokemonshowdown.com/sprites/ani-back-shiny/pikachu.gif");

  const monStd = { n: 25, chromatique: false };
  const monChroma = { n: 25, chromatique: true };
  assert.strictEqual(S.ani(monStd, "joueur"), "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif");
  assert.strictEqual(S.ani(monStd, "adversaire"), "https://play.pokemonshowdown.com/sprites/ani/pikachu.gif");
  assert.strictEqual(S.ani(monChroma, "joueur"), "https://play.pokemonshowdown.com/sprites/ani-back-shiny/pikachu.gif");
  assert.strictEqual(S.ani(monChroma, "adversaire"), "https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif");

  // 3. Local GBA fallback URLs
  assert.strictEqual(S.repliFace(25), "assets/img/poke/gen3/face/25.png?i=6");
  assert.strictEqual(S.repliDos(25), "assets/img/poke/gen3/dos/25.png?i=6");
  assert.strictEqual(S.repli(monStd, "joueur"), "assets/img/poke/gen3/dos/25.png?i=6");
  assert.strictEqual(S.repli(monStd, "adversaire"), "assets/img/poke/gen3/face/25.png?i=6");

  // 4. monterCamp rendering with pk-sprite-combattant, animated GIF URL and onerror local GBA fallback
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new ShowdownMockNode("div");
  const etat = createShowdownDummyState(ctx);
  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  const imgJoueur = ecran.elJoueur.querySelector("img");
  assert.ok(imgJoueur, "Player combatant must render an <img> sprite");
  assert.ok(imgJoueur.classList.contains("pk-sprite-combattant"), "Player img must have .pk-sprite-combattant class");
  assert.strictEqual(imgJoueur.getAttribute("src"), "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif");
  const onerrorJoueur = imgJoueur.getAttribute("onerror");
  assert.ok(onerrorJoueur && onerrorJoueur.includes("this.onerror=null;"), "Player img must have self-clearing onerror");
  assert.ok(onerrorJoueur.includes("assets/img/poke/gen3/dos/25.png"), "Player onerror must fallback to local GBA back sprite");

  const imgAdverse = ecran.elAdverse.querySelector("img");
  assert.ok(imgAdverse, "Opponent combatant must render an <img> sprite");
  assert.ok(imgAdverse.classList.contains("pk-sprite-combattant"), "Opponent img must have .pk-sprite-combattant class");
  assert.strictEqual(imgAdverse.getAttribute("src"), "https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif");
  const onerrorAdverse = imgAdverse.getAttribute("onerror");
  assert.ok(onerrorAdverse && onerrorAdverse.includes("this.onerror=null;"), "Opponent img must have self-clearing onerror");
  assert.ok(onerrorAdverse.includes("assets/img/poke/gen3/face/1.png"), "Opponent onerror must fallback to local GBA front sprite");
});

test("Modern Canvas FX engine and signature attack dispatcher", () => {
  const ctx = createShowdownCombatTestContext();
  const A = ctx.PokeAnimShowdown;
  assert.ok(A, "PokeAnimShowdown must be exported");

  // 1. PokeAnimShowdown.monter(hote) creates <canvas class="pk-arene-fx"> with HiDPI sizing and styling
  const fakeHote = new ShowdownMockNode("div");
  fakeHote.clientWidth = 600;
  fakeHote.clientHeight = 400;

  const canvas1 = A.monter(fakeHote);
  assert.ok(canvas1, "monter must return canvas element");
  assert.ok(canvas1.classList.contains("pk-arene-fx"), "Canvas must have class .pk-arene-fx");
  // HiDPI sizing: 600x400 with dpr 2 = 1200x800
  assert.strictEqual(canvas1.width, 1200, "Canvas width must be scaled by dpr");
  assert.strictEqual(canvas1.height, 800, "Canvas height must be scaled by dpr");
  assert.strictEqual(canvas1.style.position, "absolute");
  assert.strictEqual(canvas1.style.pointerEvents, "none");
  assert.strictEqual(canvas1.style.zIndex, "4");

  // Canvas reuse
  const canvas2 = A.monter(fakeHote);
  assert.strictEqual(canvas2, canvas1, "monter must reuse existing canvas in hote");

  // 2. estAttaqueSignature detects the 7 signature moves
  const signatures = [
    "tonnerre", "Tonnerre", "THUNDERBOLT", "fatal-foudre",
    "surf", "Surf", "SURF", "cascade",
    "seisme", "Séisme", "EARTHQUAKE", "ampleur",
    "lance-flammes", "Lance-Flammes", "FLAMETHROWER", "deflagration",
    "laser-glace", "Laser Glace", "ICE_BEAM", "blizzard",
    "tranche", "Tranche", "SLASH", "griffe", "morsure",
    "psyko", "Psyko", "PSYCHIC_M", "ball-ombre", "vibrobscur"
  ];
  for (const sig of signatures) {
    assert.strictEqual(A.estAttaqueSignature(sig), true, `Expected ${sig} to be recognized as signature move`);
  }
  // Object attack form
  assert.strictEqual(A.estAttaqueSignature({ cle: "THUNDERBOLT" }), true);
  assert.strictEqual(A.estAttaqueSignature({ nom: { fr: "Lance-Flammes" } }), true);

  // Non-signatures
  assert.strictEqual(A.estAttaqueSignature("charge"), false);
  assert.strictEqual(A.estAttaqueSignature("tackle"), false);
  assert.strictEqual(A.estAttaqueSignature("rugissement"), false);
  assert.strictEqual(A.estAttaqueSignature("growl"), false);
  assert.strictEqual(A.estAttaqueSignature(null), false);

  // 3. jouerAttaque dispatches signature attacks and procedural fallback
  const testMoves = ["tonnerre", "surf", "seisme", "lance-flammes", "laser-glace", "tranche", "psyko"];
  for (const moveKey of testMoves) {
    const testCanvas = new ShowdownMockNode("canvas");
    let cbCalled = false;
    A.jouerAttaque(testCanvas, moveKey, "joueur", () => { cbCalled = true; });
    assert.ok(cbCalled, `Signature ${moveKey}: callback must be called upon completion`);
    assert.ok(testCanvas._drawOps.length > 0, `Signature ${moveKey}: canvas operations must be executed`);
    assert.ok(testCanvas._drawOps.some(op => op[0] === "clearRect"), `Signature ${moveKey}: canvas must be cleared`);
  }

  // Procedural fallback
  const genericMoves = [
    { cle: "charge", categorie: "physique" },
    { cle: "bulles-do", categorie: "special" },
    { cle: "rugissement", categorie: "statut" }
  ];
  for (const gMove of genericMoves) {
    const testCanvas = new ShowdownMockNode("canvas");
    let cbCalled = false;
    A.jouerAttaque(testCanvas, gMove, "joueur", () => { cbCalled = true; });
    assert.ok(cbCalled, `Generic ${gMove.cle}: callback must be called`);
    assert.ok(testCanvas._drawOps.length > 0, `Generic ${gMove.cle}: canvas operations must be executed`);
  }

  // Headless resilience: null canvas
  let cbNull = false;
  A.jouerAttaque(null, "tonnerre", "joueur", () => { cbNull = true; });
  assert.strictEqual(cbNull, true, "jouerAttaque with null canvas must invoke callback");

  // 4. jouerStatAura handles positive boost and negative drop
  // Boost (delta > 0)
  {
    const testCanvas = new ShowdownMockNode("canvas");
    let cbBoost = false;
    A.jouerStatAura(testCanvas, "joueur", 1, () => { cbBoost = true; });
    assert.ok(cbBoost, "Stat boost: callback must be called");
    assert.ok(testCanvas._drawOps.length > 0, "Stat boost: canvas ops must be executed");
  }

  // Drop (delta < 0)
  {
    const testCanvas = new ShowdownMockNode("canvas");
    let cbDrop = false;
    A.jouerStatAura(testCanvas, "adverse", -1, () => { cbDrop = true; });
    assert.ok(cbDrop, "Stat drop: callback must be called");
    assert.ok(testCanvas._drawOps.length > 0, "Stat drop: canvas ops must be executed");
  }

  // Zero delta
  {
    const testCanvas = new ShowdownMockNode("canvas");
    let cbZero = false;
    A.jouerStatAura(testCanvas, "joueur", 0, () => { cbZero = true; });
    assert.ok(cbZero, "Zero delta: callback must still be invoked safely");
  }
});

test("Healthbox stat stage pills and tactical move effectiveness badges", () => {
  const ctx = createShowdownCombatTestContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new ShowdownMockNode("div");
  const etat = createShowdownDummyState(ctx);
  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  // 1. Healthbox stat stage pills inside .pk-hb-paliers
  const paliersJoueur = ecran.elHbJoueur.querySelector(".pk-hb-paliers");
  assert.ok(paliersJoueur, "Player healthbox must contain .pk-hb-paliers container");
  assert.strictEqual(paliersJoueur.querySelectorAll(".pk-palier-pill").length, 0, "Neutral 0 stat stages must not render any pills");

  // Non-zero stat stages: atk +2, def -1, vit 0
  etat.joueur.paliers.atk = 2;
  etat.joueur.paliers.def = -1;
  etat.joueur.paliers.vit = 0;

  // Opponent stages: def +1, vit -2
  etat.adverse.paliers.def = 1;
  etat.adverse.paliers.vit = -2;

  ecran.rafraichirHealthboxes();

  const pillsJoueur = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsJoueur.length, 2, "Player should have exactly 2 pills for non-zero stages");

  const pillAtk = pillsJoueur[0];
  assert.ok(pillAtk.classList.contains("est-hausse"), "Positive stat stage must have .est-hausse class");
  assert.match(pillAtk.textContent, /\+2\s*(ATQ|ATK)/i, "Pill must display '+2 ATQ/ATK'");

  const pillDef = pillsJoueur[1];
  assert.ok(pillDef.classList.contains("est-baisse"), "Negative stat stage must have .est-baisse class");
  assert.match(pillDef.textContent, /\-1\s*(DÉF|DEF)/i, "Pill must display '-1 DÉF/DEF'");

  const paliersAdverse = ecran.elHbAdverse.querySelector(".pk-hb-paliers");
  assert.ok(paliersAdverse, "Opponent healthbox must contain .pk-hb-paliers container");
  const pillsAdv = paliersAdverse.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsAdv.length, 2, "Opponent should have exactly 2 pills for non-zero stages");
  assert.ok(pillsAdv[0].classList.contains("est-hausse"), "Opponent Def +1 must have .est-hausse");
  assert.match(pillsAdv[0].textContent, /\+1\s*(DÉF|DEF)/i);
  assert.ok(pillsAdv[1].classList.contains("est-baisse"), "Opponent Vit -2 must have .est-baisse");
  assert.match(pillsAdv[1].textContent, /\-2\s*(VIT|SPD)/i);

  // Gen 2/3 Special stats (sat, sde)
  etat.joueur.paliers.sat = 2;
  etat.joueur.paliers.sde = -1;
  ecran.rafraichirHealthboxes();

  const pillsJoueurGen3 = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsJoueurGen3.length, 4, "Player should have 4 pills including sat and sde");
  const pillSat = pillsJoueurGen3[2];
  assert.ok(pillSat.classList.contains("est-hausse"), "sat +2 must be .est-hausse");
  assert.match(pillSat.textContent, /\+2\s*SpA/i, "sat pill must display '+2 SpA'");
  const pillSde = pillsJoueurGen3[3];
  assert.ok(pillSde.classList.contains("est-baisse"), "sde -1 must be .est-baisse");
  assert.match(pillSde.textContent, /\-1\s*SpD/i, "sde pill must display '-1 SpD'");

  // 2. Tactical move effectiveness badges in .pk-grille-attaques
  // Opponent is Bulbizarre (Plante / Poison)
  // Move 0: Tonnerre (Électrik) -> 0.5x on Plant -> .est-peu with ×½
  // Move 1: Quick Attack (Normal) -> 1.0x -> neutral, no badge
  // Move 2: Thunder Wave (Status) -> .est-statut with STAT
  const boutons = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  assert.strictEqual(boutons.length, 4, "Must render 4 move buttons in grid");

  const badge0 = boutons[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badge0, "Move 0 (Tonnerre vs Plant/Poison) must have .pk-attaque-efficacite badge");
  assert.ok(badge0.classList.contains("est-peu"), "0.5x multiplier must have class .est-peu");
  assert.match(badge0.textContent, /×½/, "0.5x multiplier badge text must be ×½");

  const badge1 = boutons[1].querySelector(".pk-attaque-efficacite");
  assert.ok(!badge1 || badge1.textContent.trim() === "", "Neutral 1x offensive move has no badge");

  const badge2 = boutons[2].querySelector(".pk-attaque-efficacite");
  assert.ok(badge2, "Status move (Cage-Éclair) must have .pk-attaque-efficacite badge");
  assert.ok(badge2.classList.contains("est-statut"), "Status move must have class .est-statut");
  assert.strictEqual(badge2.textContent.trim(), "STAT", "Status move badge text must be STAT");

  // Opponent Leviator (#130, Eau / Vol) -> 4x multiplier
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
  assert.ok(badgeLev, "Tonnerre vs Leviator must render badge");
  assert.ok(badgeLev.classList.contains("est-super"), "4x multiplier must have class .est-super");
  assert.match(badgeLev.textContent, /×4/, "4x multiplier badge text must be ×4");

  // Opponent Racaillou (#74, Roche / Sol) -> 0x multiplier
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
  assert.ok(badgeRac, "Tonnerre vs Racaillou must render badge");
  assert.ok(badgeRac.classList.contains("est-inutile"), "0x multiplier must have class .est-inutile");
  assert.match(badgeRac.textContent, /×0/, "0x multiplier badge text must be ×0");

  // Opponent Carapuce (#7, Eau) -> 2x multiplier
  etat.adverse.equipe[0] = {
    n: 7,
    nom: "Carapuce",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 48, def: 65, spe: 50, vit: 43 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsCara = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeCara = boutonsCara[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeCara, "Tonnerre vs Carapuce must render badge");
  assert.ok(badgeCara.classList.contains("est-super"), "2x multiplier must have class .est-super");
  assert.match(badgeCara.textContent, /×2/, "2x multiplier badge text must be ×2");

  // Opponent with typesForces = ["grass", "dragon"] -> 0.25x (×¼)
  etat.adverse.equipe[0].typesForces = ["grass", "dragon"];
  ecran.menuAttaques();
  const boutonsTransQuart = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeTransQuart = boutonsTransQuart[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeTransQuart, "Tonnerre vs typesForces=['grass','dragon'] must render badge");
  assert.ok(badgeTransQuart.classList.contains("est-peu"), "0.25x multiplier on typesForces must have class .est-peu");
  assert.match(badgeTransQuart.textContent, /×¼/, "0.25x multiplier badge text must be ×¼");

  // Opponent with typesForces = ["ground"] (Conversion / Morphing) -> 0x
  etat.adverse.equipe[0].typesForces = ["ground"];
  ecran.menuAttaques();
  const boutonsTrans = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeTrans = boutonsTrans[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeTrans, "Tonnerre vs typesForces=['ground'] must render badge");
  assert.ok(badgeTrans.classList.contains("est-inutile"), "0x multiplier on typesForces must have class .est-inutile");
  assert.match(badgeTrans.textContent, /×0/);

  // Opponent with typesForces = ["water", "flying"] -> 4x
  etat.adverse.equipe[0].typesForces = ["water", "flying"];
  ecran.menuAttaques();
  const boutonsTrans4 = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeTrans4 = boutonsTrans4[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeTrans4, "Tonnerre vs typesForces=['water','flying'] must render badge");
  assert.ok(badgeTrans4.classList.contains("est-super"), "4x multiplier on typesForces must have class .est-super");
  assert.match(badgeTrans4.textContent, /×4/);

  // 3. Integration with combat animation hooks
  let statAuraTriggered = false;
  const origJouerStatAura = ctx.PokeAnimShowdown.jouerStatAura;
  ctx.PokeAnimShowdown.jouerStatAura = (canvas, cote, delta, cb) => {
    statAuraTriggered = true;
    if (typeof cb === "function") cb();
  };
  ecran.animer({ t: "palier", cote: "joueur", stat: "atk", delta: 1 });
  assert.strictEqual(statAuraTriggered, true, "Stat boost event must trigger jouerStatAura");
  ctx.PokeAnimShowdown.jouerStatAura = origJouerStatAura;

  let attackTriggered = false;
  const origJouerAttaque = ctx.PokeAnimShowdown.jouerAttaque;
  ctx.PokeAnimShowdown.jouerAttaque = (canvas, att, cote, cb) => {
    attackTriggered = true;
    if (typeof cb === "function") cb();
  };
  const animDesc = ecran.animationDe({
    premier: true,
    ev: { t: "utilise", attaque: "THUNDERBOLT", cote: "joueur" }
  });
  assert.ok(animDesc && typeof animDesc.jouer === "function", "animationDe must return anim object");
  animDesc.jouer();
  assert.strictEqual(attackTriggered, true, "animationDe must call PokeAnimShowdown.jouerAttaque");
  ctx.PokeAnimShowdown.jouerAttaque = origJouerAttaque;
});

test("Replay engine determinism and Mulberry32 PRNG bit-level parity across Gen 1, Gen 2, and Gen 3 runs", () => {
  const Hasard = noyauContext.PokeHasard;
  const Partie = noyauContext.PokePartie;
  const Regles = noyauContext.PokeRegles;
  const Combat = noyauContext.PokeCombat;
  const Moteur = noyauContext.PokeMoteur;
  const Usine = noyauContext.PokeUsine;
  const replayDaily = noyauContext.replayDaily;

  // 1. Bit-identical Mulberry32 sequence across generations
  const testSeeds = ["REPLAY-SEED-GEN1", "REPLAY-SEED-GEN2", "REPLAY-SEED-GEN3"];
  for (const seed of testSeeds) {
    const h1 = new Hasard(seed);
    const h2 = new Hasard(seed);
    for (let i = 0; i < 500; i++) {
      assert.strictEqual(h1.brut(), h2.brut(), `Mulberry32 diverged for seed ${seed} at draw ${i}`);
    }
    assert.strictEqual(h1.tirages, 500);
    assert.strictEqual(h2.tirages, 500);
  }

  // 2. Deterministic game session state across generations
  for (const gen of ["gen1", "gen2", "gen3"]) {
    Regles.poser(gen);
    const s1 = Partie.creer({ graine: `SESSION-DETERMINISM-${gen}`, regles: gen }, new Hasard(`SESSION-DETERMINISM-${gen}`));
    const s2 = Partie.creer({ graine: `SESSION-DETERMINISM-${gen}`, regles: gen }, new Hasard(`SESSION-DETERMINISM-${gen}`));
    assert.strictEqual(s1.version, s2.version);
    assert.strictEqual(s1.graine, s2.graine);
    assert.deepStrictEqual(s1.visite, s2.visite);
    assert.strictEqual(s1.argent, s2.argent);
  }
  Regles.poser("gen1");

  // 3. Turn-by-turn combat simulation reproducibility across Gen 1, 2, 3
  function runSimBattle(gen, seed, p1Id, p2Id) {
    Regles.poser(gen);
    const h = new Hasard(seed);
    const p1 = Moteur.creer(p1Id, 25, h);
    const p2 = Moteur.creer(p2Id, 25, h);
    const combat = Combat.demarrer([p1], [p2], { graine: seed, dresseur: false }, h);
    const events = [];
    let tours = 0;
    while (!combat.fini && tours < 25) {
      tours++;
      const ev = Combat.jouerTour(combat, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });
      events.push(...ev.map(e => ({ t: e.t, degats: e.degats, pv: e.pv })));
      if (p1.pv <= 0 || p2.pv <= 0) break;
    }
    return { events, tirages: h.tirages, fini: combat.fini };
  }

  const g1A = runSimBattle("gen1", "SIM-REPLAY-G1", 25, 7);
  const g1B = runSimBattle("gen1", "SIM-REPLAY-G1", 25, 7);
  assert.strictEqual(g1A.tirages, g1B.tirages, "Gen 1 PRNG draws must match bit-identically");
  assert.deepStrictEqual(g1A.events, g1B.events, "Gen 1 combat replay events must be identical");

  const g2A = runSimBattle("gen2", "SIM-REPLAY-G2", 155, 158);
  const g2B = runSimBattle("gen2", "SIM-REPLAY-G2", 155, 158);
  assert.strictEqual(g2A.tirages, g2B.tirages, "Gen 2 PRNG draws must match bit-identically");
  assert.deepStrictEqual(g2A.events, g2B.events, "Gen 2 combat replay events must be identical");

  const g3A = runSimBattle("gen3", "SIM-REPLAY-G3", 252, 255);
  const g3B = runSimBattle("gen3", "SIM-REPLAY-G3", 252, 255);
  assert.strictEqual(g3A.tirages, g3B.tirages, "Gen 3 PRNG draws must match bit-identically");
  assert.deepStrictEqual(g3A.events, g3B.events, "Gen 3 combat replay events must be identical");

  // 4. Cross-generational isolation: Gen 1 replay invariance after Gen 3 execution
  const g1Post = runSimBattle("gen1", "SIM-REPLAY-G1", 25, 7);
  assert.strictEqual(g1A.tirages, g1Post.tirages, "Gen 1 PRNG draws must remain unchanged after Gen 3 runs");
  assert.deepStrictEqual(g1A.events, g1Post.events, "Gen 1 events must remain identical after Gen 3 runs");

  // 5. Battle Factory determinism
  Regles.poser("gen3");
  const fSession1 = Usine.creerSession({ graine: "FACTORY-REPLAY-PARITY" });
  const fSession2 = Usine.creerSession({ graine: "FACTORY-REPLAY-PARITY" });
  assert.deepStrictEqual(
    fSession1.prets.map(p => ({ n: p.n, nature: p.nature, talent: p.talent, objet: p.objet })),
    fSession2.prets.map(p => ({ n: p.n, nature: p.nature, talent: p.talent, objet: p.objet })),
    "Factory rentals must match bit-identically for identical seed"
  );
  Regles.poser("gen1");

  // 6. replayDaily scoring parity
  const journal = [
    {
      badges: 6,
      acte: 7,
      vus: 60,
      pris: 30,
      legendaires: 1,
      ligue: 0,
      equipe: [{ n: 25, niveau: 45, pv: 110, stats: { pv: 110 } }],
      duree: 800,
      quand: 1771980000000,
    },
  ];
  const r1 = replayDaily("2026-09-11", journal, { device: "test-device-parity" });
  const r2 = replayDaily("2026-09-11", journal, { device: "test-device-parity" });
  assert.strictEqual(r1.score, r2.score, "Daily scores must match identically across runs");
  assert.strictEqual(r1.name, r2.name, "Daily trainer name must match identically across runs");
  assert.ok(r1.score > 0, "Score must be positive");
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
