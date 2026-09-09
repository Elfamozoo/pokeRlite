/**
 * tests/test_gen3_ct.mjs
 * Unit test suite for Gen 3 canonical CTs/CSs and registry wiring.
 *
 * Verifies:
 * 1. File existence & strict NOYAU constraints in js/poke/gen3/ct.js.
 * 2. Canonical Gen 3 Technical Machines (CT01 to CT50): order, keys, prices, types.
 * 3. Canonical Gen 3 Hidden Machines (CS01 to CS08): order, keys, cs: true, types.
 * 4. Fast lookup mapping POKE_GEN3_CT_PAR_CLE for CTs and CSs.
 * 5. ordre.js wiring: insertion in GEN3 right after objets.js and before regles.js in NOYAU.
 * 6. regles.js wiring: JEUX.gen1, JEUX.gen2, JEUX.gen3 and unified PokeRegles accessors.
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

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n\r]*/g, "");
}

function createIsolatedContext(customGlobals = {}) {
  const sandbox = {
    console,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    isFinite,
    isNaN,
    parseInt,
    parseFloat,
    ...customGlobals,
  };
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

function loadScriptInContext(filePath, context) {
  const fullPath = path.join(ROOT_DIR, filePath);
  const code = fs.readFileSync(fullPath, "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

// Canonical Gen 3 CT definition
const CANONICAL_CT = [
  { n: 1, cle: "FOCUS_PUNCH", prix: 3000, type: "fighting" },
  { n: 2, cle: "DRAGON_CLAW", prix: 3000, type: "dragon" },
  { n: 3, cle: "WATER_PULSE", prix: 3000, type: "water" },
  { n: 4, cle: "CALM_MIND", prix: 3000, type: "psychic" },
  { n: 5, cle: "ROAR", prix: 1000, type: "normal" },
  { n: 6, cle: "TOXIC", prix: 3000, type: "poison" },
  { n: 7, cle: "HAIL", prix: 3000, type: "ice" },
  { n: 8, cle: "BULK_UP", prix: 3000, type: "fighting" },
  { n: 9, cle: "BULLET_SEED", prix: 2000, type: "grass" },
  { n: 10, cle: "HIDDEN_POWER", prix: 3000, type: "normal" },
  { n: 11, cle: "SUNNY_DAY", prix: 2000, type: "fire" },
  { n: 12, cle: "TAUNT", prix: 3000, type: "dark" },
  { n: 13, cle: "ICE_BEAM", prix: 4000, type: "ice" },
  { n: 14, cle: "BLIZZARD", prix: 5500, type: "ice" },
  { n: 15, cle: "HYPER_BEAM", prix: 7500, type: "normal" },
  { n: 16, cle: "LIGHT_SCREEN", prix: 3000, type: "psychic" },
  { n: 17, cle: "PROTECT", prix: 3000, type: "normal" },
  { n: 18, cle: "RAIN_DANCE", prix: 2000, type: "water" },
  { n: 19, cle: "GIGA_DRAIN", prix: 3000, type: "grass" },
  { n: 20, cle: "SAFEGUARD", prix: 3000, type: "normal" },
  { n: 21, cle: "FRUSTRATION", prix: 1000, type: "normal" },
  { n: 22, cle: "SOLARBEAM", prix: 3000, type: "grass" },
  { n: 23, cle: "IRON_TAIL", prix: 3000, type: "steel" },
  { n: 24, cle: "THUNDERBOLT", prix: 4000, type: "electric" },
  { n: 25, cle: "THUNDER", prix: 5500, type: "electric" },
  { n: 26, cle: "EARTHQUAKE", prix: 3000, type: "ground" },
  { n: 27, cle: "RETURN", prix: 1000, type: "normal" },
  { n: 28, cle: "DIG", prix: 2000, type: "ground" },
  { n: 29, cle: "PSYCHIC_M", prix: 3500, type: "psychic" },
  { n: 30, cle: "SHADOW_BALL", prix: 3000, type: "ghost" },
  { n: 31, cle: "BRICK_BREAK", prix: 3000, type: "fighting" },
  { n: 32, cle: "DOUBLE_TEAM", prix: 2000, type: "normal" },
  { n: 33, cle: "REFLECT", prix: 3000, type: "psychic" },
  { n: 34, cle: "SHOCK_WAVE", prix: 3000, type: "electric" },
  { n: 35, cle: "FLAMETHROWER", prix: 4000, type: "fire" },
  { n: 36, cle: "SLUDGE_BOMB", prix: 3000, type: "poison" },
  { n: 37, cle: "SANDSTORM", prix: 2000, type: "rock" },
  { n: 38, cle: "FIRE_BLAST", prix: 5500, type: "fire" },
  { n: 39, cle: "ROCK_TOMB", prix: 3000, type: "rock" },
  { n: 40, cle: "AERIAL_ACE", prix: 3000, type: "flying" },
  { n: 41, cle: "TORMENT", prix: 3000, type: "dark" },
  { n: 42, cle: "FACADE", prix: 3000, type: "normal" },
  { n: 43, cle: "SECRET_POWER", prix: 3000, type: "normal" },
  { n: 44, cle: "REST", prix: 3000, type: "psychic" },
  { n: 45, cle: "ATTRACT", prix: 3000, type: "normal" },
  { n: 46, cle: "THIEF", prix: 3000, type: "dark" },
  { n: 47, cle: "STEEL_WING", prix: 3000, type: "steel" },
  { n: 48, cle: "SKILL_SWAP", prix: 3000, type: "psychic" },
  { n: 49, cle: "SNATCH", prix: 3000, type: "dark" },
  { n: 50, cle: "OVERHEAT", prix: 3000, type: "fire" }
];

// Canonical Gen 3 CS definition
const CANONICAL_CS = [
  { n: 1, cle: "CUT", cs: true, type: "normal" },
  { n: 2, cle: "FLY", cs: true, type: "flying" },
  { n: 3, cle: "SURF", cs: true, type: "water" },
  { n: 4, cle: "STRENGTH", cs: true, type: "normal" },
  { n: 5, cle: "FLASH", cs: true, type: "normal" },
  { n: 6, cle: "ROCK_SMASH", cs: true, type: "fighting" },
  { n: 7, cle: "WATERFALL", cs: true, type: "water" },
  { n: 8, cle: "DIVE", cs: true, type: "water" }
];

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: File Existence & Strict NOYAU Constraints in js/poke/gen3/ct.js
// ─────────────────────────────────────────────────────────────────────────────
suite("1. File Existence & Strict NOYAU Constraints in ct.js");

test("js/poke/gen3/ct.js exists on disk", () => {
  const fullPath = path.join(ROOT_DIR, "js/poke/gen3/ct.js");
  assert.ok(fs.existsSync(fullPath), "js/poke/gen3/ct.js must exist");
});

test("js/poke/gen3/ct.js enforces 'use strict'", () => {
  const fullPath = path.join(ROOT_DIR, "js/poke/gen3/ct.js");
  const content = fs.readFileSync(fullPath, "utf-8");
  assert.match(content, /"use strict"|'use strict'/, "Must include 'use strict'");
});

test("js/poke/gen3/ct.js has zero Math.random(), Date.now(), or timing calls", () => {
  const fullPath = path.join(ROOT_DIR, "js/poke/gen3/ct.js");
  const content = stripComments(fs.readFileSync(fullPath, "utf-8"));
  assert.ok(!/\bMath\.random\s*\(/.test(content), "Forbidden Math.random()");
  assert.ok(!/\bDate\.now\s*\(/.test(content), "Forbidden Date.now()");
  assert.ok(!/\bnew\s+Date\b/.test(content), "Forbidden new Date()");
  assert.ok(!/\bperformance\.now\s*\(/.test(content), "Forbidden performance.now()");
});

test("js/poke/gen3/ct.js has zero DOM/browser dependencies", () => {
  const fullPath = path.join(ROOT_DIR, "js/poke/gen3/ct.js");
  const content = stripComments(fs.readFileSync(fullPath, "utf-8"));
  assert.ok(!/\bdocument\./.test(content), "Forbidden document reference");
  assert.ok(!/\blocalStorage\b/.test(content), "Forbidden localStorage reference");
  assert.ok(!/\bsessionStorage\b/.test(content), "Forbidden sessionStorage reference");
  assert.ok(!/\bsetTimeout\b/.test(content), "Forbidden setTimeout");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Standalone Evaluation & Data Structures
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Standalone Module Evaluation & Data Structures");

let ctx;
test("js/poke/gen3/ct.js evaluates in isolated context without DOM/window", () => {
  ctx = createIsolatedContext();
  loadScriptInContext("js/poke/gen3/ct.js", ctx);
  assert.ok(ctx.POKE_GEN3_CT, "POKE_GEN3_CT must be defined");
  assert.ok(ctx.POKE_GEN3_CS, "POKE_GEN3_CS must be defined");
  assert.ok(ctx.POKE_GEN3_CT_PAR_CLE, "POKE_GEN3_CT_PAR_CLE must be defined");
});

test("POKE_GEN3_CT contains all 50 canonical CTs matching specifications", () => {
  const ctList = ctx.POKE_GEN3_CT;
  assert.strictEqual(ctList.length, 50, "POKE_GEN3_CT must contain exactly 50 entries");
  for (let i = 0; i < 50; i++) {
    const expected = CANONICAL_CT[i];
    const actual = ctList[i];
    assert.strictEqual(actual.n, expected.n, `CT #${i + 1} n mismatch`);
    assert.strictEqual(actual.cle, expected.cle, `CT #${i + 1} cle mismatch`);
    assert.strictEqual(actual.prix, expected.prix, `CT #${i + 1} prix mismatch`);
    assert.strictEqual(actual.type, expected.type, `CT #${i + 1} type mismatch`);
  }
});

test("POKE_GEN3_CS contains all 8 canonical CSs matching specifications", () => {
  const csList = ctx.POKE_GEN3_CS;
  assert.strictEqual(csList.length, 8, "POKE_GEN3_CS must contain exactly 8 entries");
  for (let i = 0; i < 8; i++) {
    const expected = CANONICAL_CS[i];
    const actual = csList[i];
    assert.strictEqual(actual.n, expected.n, `CS #${i + 1} n mismatch`);
    assert.strictEqual(actual.cle, expected.cle, `CS #${i + 1} cle mismatch`);
    assert.strictEqual(actual.cs, true, `CS #${i + 1} must have cs: true`);
    assert.strictEqual(actual.type, expected.type, `CS #${i + 1} type mismatch`);
  }
});

test("POKE_GEN3_CT_PAR_CLE maps all 50 CTs and 8 CSs correctly", () => {
  const map = ctx.POKE_GEN3_CT_PAR_CLE;
  assert.ok(typeof map === "object" && map !== null, "POKE_GEN3_CT_PAR_CLE must be an object");

  // Check CTs
  for (const ct of CANONICAL_CT) {
    assert.ok(map[ct.cle], `Missing CT key in map: ${ct.cle}`);
    assert.strictEqual(map[ct.cle].n, ct.n, `Map entry n mismatch for ${ct.cle}`);
    assert.strictEqual(map[ct.cle].cle, ct.cle, `Map entry cle mismatch for ${ct.cle}`);
  }

  // Check CSs
  for (const cs of CANONICAL_CS) {
    assert.ok(map[cs.cle], `Missing CS key in map: ${cs.cle}`);
    assert.strictEqual(map[cs.cle].n, cs.n, `Map entry n mismatch for ${cs.cle}`);
    assert.strictEqual(map[cs.cle].cle, cs.cle, `Map entry cle mismatch for ${cs.cle}`);
    assert.strictEqual(map[cs.cle].cs, true, `Map entry cs flag mismatch for ${cs.cle}`);
  }

  // Specific canonical checks
  assert.strictEqual(map["FOCUS_PUNCH"].n, 1);
  assert.strictEqual(map["OVERHEAT"].n, 50);
  assert.strictEqual(map["DIVE"].n, 8);
  assert.strictEqual(map["DIVE"].cs, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: ordre.js Integration
// ─────────────────────────────────────────────────────────────────────────────
suite("3. ordre.js Integration");

let ordreCtx;
test("ordre.js includes js/poke/gen3/ct.js in POKE_ORDRE_GEN3", () => {
  ordreCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreCtx);

  const gen3 = ordreCtx.POKE_ORDRE_GEN3;
  assert.ok(gen3.includes("js/poke/gen3/ct.js"), "GEN3 must include js/poke/gen3/ct.js");

  const idxObjets = gen3.indexOf("js/poke/gen3/objets.js");
  const idxCt = gen3.indexOf("js/poke/gen3/ct.js");
  assert.strictEqual(idxCt, idxObjets + 1, "js/poke/gen3/ct.js must immediately follow js/poke/gen3/objets.js");
});

test("POKE_ORDRE_NOYAU injects ct.js before regles.js", () => {
  const noyau = ordreCtx.POKE_ORDRE_NOYAU;
  const idxCt = noyau.indexOf("js/poke/gen3/ct.js");
  const idxRegles = noyau.indexOf("js/poke/regles.js");
  assert.ok(idxCt >= 0, "ct.js must be in NOYAU");
  assert.ok(idxRegles > idxCt, "ct.js must precede regles.js in NOYAU");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: regles.js Integration & Accessors
// ─────────────────────────────────────────────────────────────────────────────
suite("4. regles.js Integration & PokeRegles Accessors");

let stackCtx;
test("Full NOYAU stack loads cleanly with gen3/ct.js", () => {
  stackCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", stackCtx);
  for (const f of stackCtx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, stackCtx);
  }
  assert.ok(stackCtx.PokeRegles, "PokeRegles must be exported");
  assert.ok(stackCtx.POKE_CT, "POKE_CT must exist");
  assert.ok(stackCtx.POKE_GEN3_CT, "POKE_GEN3_CT must exist");
});

test("JEUX entries define ct, cs, and ctParCle methods", () => {
  const PokeRegles = stackCtx.PokeRegles;

  const g1 = PokeRegles.pour("gen1");
  assert.equal(typeof g1.ct, "function", "JEUX.gen1.ct must be a function");
  assert.equal(typeof g1.cs, "function", "JEUX.gen1.cs must be a function");
  assert.equal(typeof g1.ctParCle, "function", "JEUX.gen1.ctParCle must be a function");
  assert.strictEqual(g1.ct(), stackCtx.POKE_CT, "JEUX.gen1.ct() must return W.POKE_CT");
  assert.strictEqual(g1.cs(), null, "JEUX.gen1.cs() must return null");
  assert.strictEqual(g1.ctParCle(), stackCtx.POKE_CT_PAR_CLE, "JEUX.gen1.ctParCle() must return W.POKE_CT_PAR_CLE");

  const g2 = PokeRegles.pour("gen2");
  assert.equal(typeof g2.ct, "function", "JEUX.gen2.ct must be a function");
  assert.equal(typeof g2.cs, "function", "JEUX.gen2.cs must be a function");
  assert.strictEqual(g2.ct(), stackCtx.POKE_GEN2_CT || stackCtx.POKE_CT, "JEUX.gen2.ct() must return POKE_GEN2_CT or POKE_CT");
  assert.strictEqual(g2.cs(), null, "JEUX.gen2.cs() must return null");

  const g3 = PokeRegles.pour("gen3");
  assert.equal(typeof g3.ct, "function", "JEUX.gen3.ct must be a function");
  assert.equal(typeof g3.cs, "function", "JEUX.gen3.cs must be a function");
  assert.equal(typeof g3.ctParCle, "function", "JEUX.gen3.ctParCle must be a function");
  assert.strictEqual(g3.ct(), stackCtx.POKE_GEN3_CT, "JEUX.gen3.ct() must return W.POKE_GEN3_CT");
  assert.strictEqual(g3.cs(), stackCtx.POKE_GEN3_CS, "JEUX.gen3.cs() must return W.POKE_GEN3_CS");
  assert.strictEqual(g3.ctParCle(), stackCtx.POKE_GEN3_CT_PAR_CLE, "JEUX.gen3.ctParCle() must return W.POKE_GEN3_CT_PAR_CLE");
});

test("PokeRegles accessor functions resolve by string key", () => {
  const PokeRegles = stackCtx.PokeRegles;

  // Gen 3
  assert.strictEqual(PokeRegles.ct("gen3"), stackCtx.POKE_GEN3_CT);
  assert.strictEqual(PokeRegles.cs("gen3"), stackCtx.POKE_GEN3_CS);
  assert.strictEqual(PokeRegles.ctParCle("gen3"), stackCtx.POKE_GEN3_CT_PAR_CLE);

  // Gen 1
  assert.strictEqual(PokeRegles.ct("gen1"), stackCtx.POKE_CT);
  assert.strictEqual(PokeRegles.cs("gen1"), null);
  assert.strictEqual(PokeRegles.ctParCle("gen1"), stackCtx.POKE_CT_PAR_CLE);
});

test("PokeRegles accessor functions resolve by partie object", () => {
  const PokeRegles = stackCtx.PokeRegles;

  const partieGen3 = { regles: "gen3" };
  assert.strictEqual(PokeRegles.ct(partieGen3), stackCtx.POKE_GEN3_CT);
  assert.strictEqual(PokeRegles.cs(partieGen3), stackCtx.POKE_GEN3_CS);
  assert.strictEqual(PokeRegles.ctParCle(partieGen3), stackCtx.POKE_GEN3_CT_PAR_CLE);

  const partieGen1 = { regles: "gen1" };
  assert.strictEqual(PokeRegles.ct(partieGen1), stackCtx.POKE_CT);
  assert.strictEqual(PokeRegles.cs(partieGen1), null);
  assert.strictEqual(PokeRegles.ctParCle(partieGen1), stackCtx.POKE_CT_PAR_CLE);
});

test("PokeRegles accessor functions resolve by active game state (poser)", () => {
  const PokeRegles = stackCtx.PokeRegles;

  PokeRegles.poser("gen3");
  assert.strictEqual(PokeRegles.ct(), stackCtx.POKE_GEN3_CT);
  assert.strictEqual(PokeRegles.cs(), stackCtx.POKE_GEN3_CS);
  assert.strictEqual(PokeRegles.ctParCle(), stackCtx.POKE_GEN3_CT_PAR_CLE);

  PokeRegles.poser("gen1");
  assert.strictEqual(PokeRegles.ct(), stackCtx.POKE_CT);
  assert.strictEqual(PokeRegles.cs(), null);
  assert.strictEqual(PokeRegles.ctParCle(), stackCtx.POKE_CT_PAR_CLE);
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n------------------------------------------------------------");
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
if (failedTests > 0) {
  console.log(`\x1b[31mFAILURES: ${failedTests}\x1b[0m`);
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
}
