/**
 * tests/test_gen3_natures.mjs
 * Unit test suite for Gen 3 canonical natures & stat calculation modifiers.
 *
 * Verifies:
 * 1. File existence & strict NOYAU constraints in js/poke/gen3/natures.js.
 * 2. All 25 canonical Gen 3 natures defined with exact +/- stat modifiers.
 * 3. 5 neutral natures have plus: null, moins: null.
 * 4. Helper PokeNatures methods: table, cles, liste, nom, de, tirer.
 * 5. ordre.js wiring: "js/poke/gen3/natures.js" registered in GEN3 immediately after "js/poke/gen3/especes.js".
 * 6. Stat calculation:
 *    - Rigide: Atk +10% (floor(s.atk * 1.1)), Sat -10% (floor(s.sat * 0.9)).
 *    - Timide: Vit +10% (floor(s.vit * 1.1)), Atk -10% (floor(s.atk * 0.9)).
 *    - PV is never modified by nature.
 *    - Without p.nature, stats are bit-identical to original.
 * 7. PokeMoteur.creer propagation:
 *    - Explicit o.nature preserved.
 *    - o.genererNature consumes 1 draw from h when requested.
 *    - Without o.genererNature, ZERO PRNG draws consumed (Gen 1 / Gen 2 invariance).
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

function loadFullNoyauContext() {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);
  for (const f of ctx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, ctx);
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: File Existence & Static Invariants
// ─────────────────────────────────────────────────────────────────────────────
suite("1. File Existence & Static Constraints (js/poke/gen3/natures.js)");

const NATURES_PATH = "js/poke/gen3/natures.js";

test("natures.js exists on disk", () => {
  const fullPath = path.join(ROOT_DIR, NATURES_PATH);
  assert.ok(fs.existsSync(fullPath), `File not found: ${NATURES_PATH}`);
});

test("natures.js respects strict mode and has zero non-deterministic / DOM calls", () => {
  const fullPath = path.join(ROOT_DIR, NATURES_PATH);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Cannot perform static analysis: ${NATURES_PATH} does not exist`);
  }
  const rawCode = fs.readFileSync(fullPath, "utf-8");
  const cleanCode = stripComments(rawCode);

  assert.ok(
    cleanCode.includes('"use strict"') || cleanCode.includes("'use strict'"),
    "natures.js must declare 'use strict'"
  );

  const nonDetPatterns = [
    /\bMath\.random\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\b/,
    /\bperformance\.now\s*\(/,
    /\bcrypto\.getRandomValues\s*\(/,
  ];
  for (const pat of nonDetPatterns) {
    assert.ok(!pat.test(cleanCode), `Forbidden non-deterministic pattern detected: ${pat}`);
  }

  const domPatterns = [
    /\bdocument\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bnavigator\./,
    /\bhistory\./,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\balert\s*\(/,
    /\bconfirm\s*\(/,
    /\bprompt\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bsetInterval\s*\(/,
  ];
  for (const pat of domPatterns) {
    assert.ok(!pat.test(cleanCode), `Forbidden DOM / browser pattern detected: ${pat}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: ordre.js Integration
// ─────────────────────────────────────────────────────────────────────────────
suite("2. ordre.js Dependency Wiring");

test("ordre.js includes natures.js in GEN3 immediately after especes.js", () => {
  const ordreCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreCtx);

  const gen3 = ordreCtx.POKE_ORDRE_GEN3;
  assert.ok(Array.isArray(gen3), "POKE_ORDRE_GEN3 must be an array");

  const idxEspeces = gen3.indexOf("js/poke/gen3/especes.js");
  const idxNatures = gen3.indexOf("js/poke/gen3/natures.js");

  assert.ok(idxEspeces !== -1, "especes.js must be in POKE_ORDRE_GEN3");
  assert.ok(idxNatures !== -1, "natures.js must be in POKE_ORDRE_GEN3");
  assert.strictEqual(
    idxNatures,
    idxEspeces + 1,
    "natures.js must be located immediately after especes.js in POKE_ORDRE_GEN3"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: 25 Canonical Natures & Helper APIs
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Canonical Natures Definitions & PokeNatures Helpers");

const EXPECTED_NATURES = {
  hardi:   { plus: null,  moins: null, fr: "Hardi",   en: "Hardy" },
  docile:  { plus: null,  moins: null, fr: "Docile",  en: "Docile" },
  pudique: { plus: null,  moins: null, fr: "Pudique", en: "Bashful" },
  bizarre: { plus: null,  moins: null, fr: "Bizarre", en: "Quirky" },
  serieux: { plus: null,  moins: null, fr: "Sérieux", en: "Serious" },

  rigide:  { plus: "atk", moins: "sat", fr: "Rigide",  en: "Adamant" },
  brave:   { plus: "atk", moins: "vit", fr: "Brave",   en: "Brave" },
  mauvais: { plus: "atk", moins: "sdf", fr: "Mauvais", en: "Naughty" },
  solo:    { plus: "atk", moins: "def", fr: "Solo",    en: "Lonely" },

  assure:  { plus: "def", moins: "atk", fr: "Assuré",  en: "Bold" },
  relax:   { plus: "def", moins: "vit", fr: "Relax",   en: "Relaxed" },
  malin:   { plus: "def", moins: "sat", fr: "Malin",   en: "Impish" },
  lache:   { plus: "def", moins: "sdf", fr: "Lâche",   en: "Lax" },

  modeste: { plus: "sat", moins: "atk", fr: "Modeste", en: "Modest" },
  doux:    { plus: "sat", moins: "def", fr: "Doux",    en: "Mild" },
  discret: { plus: "sat", moins: "vit", fr: "Discret", en: "Quiet" },
  foufou:  { plus: "sat", moins: "sdf", fr: "Foufou",  en: "Rash" },

  calme:   { plus: "sdf", moins: "atk", fr: "Calme",   en: "Calm" },
  gentil:  { plus: "sdf", moins: "def", fr: "Gentil",  en: "Gentle" },
  malpoli: { plus: "sdf", moins: "vit", fr: "Malpoli", en: "Sassy" },
  prudent: { plus: "sdf", moins: "sat", fr: "Prudent", en: "Careful" },

  timide:  { plus: "vit", moins: "atk", fr: "Timide",  en: "Timid" },
  presse:  { plus: "vit", moins: "def", fr: "Pressé",  en: "Hasty" },
  jovial:  { plus: "vit", moins: "sat", fr: "Jovial",  en: "Jolly" },
  naif:    { plus: "vit", moins: "sdf", fr: "Naïf",    en: "Naive" },
};

let isolatedCtx;

test("natures.js evaluates and exports POKE_GEN3_NATURES and PokeNatures", () => {
  isolatedCtx = createIsolatedContext();
  loadScriptInContext(NATURES_PATH, isolatedCtx);

  assert.ok(isolatedCtx.POKE_GEN3_NATURES, "POKE_GEN3_NATURES must be defined");
  assert.ok(isolatedCtx.PokeNatures, "PokeNatures must be defined");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.table, "function");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.cles, "function");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.liste, "function");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.nom, "function");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.de, "function");
  assert.strictEqual(typeof isolatedCtx.PokeNatures.tirer, "function");
});

test("POKE_GEN3_NATURES contains exactly 25 natures with canonical definitions", () => {
  const natures = isolatedCtx.POKE_GEN3_NATURES;
  const keys = Object.keys(natures);
  assert.strictEqual(keys.length, 25, "Must contain exactly 25 natures");

  for (const [id, expected] of Object.entries(EXPECTED_NATURES)) {
    const n = natures[id];
    assert.ok(n, `Nature ${id} must exist in POKE_GEN3_NATURES`);
    assert.strictEqual(n.id, id);
    assert.strictEqual(n.plus, expected.plus);
    assert.strictEqual(n.moins, expected.moins);
    assert.strictEqual(n.nom.fr, expected.fr);
    assert.strictEqual(n.nom.en, expected.en);
  }
});

test("5 neutral natures have plus: null and moins: null", () => {
  const neutral = ["hardi", "docile", "pudique", "bizarre", "serieux"];
  const natures = isolatedCtx.POKE_GEN3_NATURES;
  for (const id of neutral) {
    assert.strictEqual(natures[id].plus, null, `${id} must have plus: null`);
    assert.strictEqual(natures[id].moins, null, `${id} must have moins: null`);
  }
});

test("PokeNatures helper functions work as expected", () => {
  const PN = isolatedCtx.PokeNatures;
  assert.strictEqual(PN.table(), isolatedCtx.POKE_GEN3_NATURES);

  const cles = PN.cles();
  const liste = PN.liste();
  assert.strictEqual(cles.length, 25);
  assert.strictEqual(liste.length, 25);
  assert.deepStrictEqual(cles, liste);

  assert.strictEqual(PN.nom("rigide"), "Rigide");
  assert.strictEqual(PN.nom("rigide", "fr"), "Rigide");
  assert.strictEqual(PN.nom("rigide", "en"), "Adamant");
  assert.strictEqual(PN.nom("unknown"), "unknown");

  assert.strictEqual(PN.de({ nature: "modeste" }), "modeste");
  assert.strictEqual(PN.de({}), null);
  assert.strictEqual(PN.de(null), null);

  // Test tirer(h) with mock providing choisir
  const mockHChoisir = {
    choisir: (items) => items[0],
  };
  assert.strictEqual(PN.tirer(mockHChoisir), "hardi");

  // Test tirer(h) with mock providing entier
  const mockHEntier = {
    entier: (max) => 5, // index 5 is "rigide"
  };
  assert.strictEqual(PN.tirer(mockHEntier), "rigide");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Engine Integration & Stat Calculations
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Engine Integration: calculerStats & creer");

test("Stat calculations apply +/- 10% with floor and preserve PV", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");

  // Test with Treecko (Arcko, n: 252) at level 50
  const fixedDV = { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 };
  const fixedExp = { pv: 0, atk: 0, def: 0, vit: 0, spe: 0 };

  const pNeutre = {
    n: 252,
    niveau: 50,
    dv: fixedDV,
    statExp: fixedExp,
    nature: "hardi",
  };
  const statsNeutre = ctx.PokeMoteur.calculerStats(pNeutre);

  const pSansNature = {
    n: 252,
    niveau: 50,
    dv: fixedDV,
    statExp: fixedExp,
  };
  const statsSansNature = ctx.PokeMoteur.calculerStats(pSansNature);

  // Invariance check: neutral nature == no nature
  assert.deepStrictEqual(
    statsNeutre,
    statsSansNature,
    "Neutral nature must produce identical stats to no nature"
  );

  // Rigide: +atk, -sat
  const pRigide = {
    n: 252,
    niveau: 50,
    dv: fixedDV,
    statExp: fixedExp,
    nature: "rigide",
  };
  const statsRigide = ctx.PokeMoteur.calculerStats(pRigide);

  assert.strictEqual(statsRigide.pv, statsNeutre.pv, "PV must NEVER be modified by nature");
  assert.strictEqual(
    statsRigide.atk,
    Math.floor(statsNeutre.atk * 1.1),
    "Rigide must grant floor(atk * 1.1)"
  );
  assert.strictEqual(
    statsRigide.sat,
    Math.floor(statsNeutre.sat * 0.9),
    "Rigide must apply floor(sat * 0.9)"
  );
  assert.strictEqual(statsRigide.def, statsNeutre.def, "Def must be unaffected");
  assert.strictEqual(statsRigide.vit, statsNeutre.vit, "Vit must be unaffected");
  assert.strictEqual(statsRigide.sdf, statsNeutre.sdf, "Sdf must be unaffected");

  // Timide: +vit, -atk
  const pTimide = {
    n: 252,
    niveau: 50,
    dv: fixedDV,
    statExp: fixedExp,
    nature: "timide",
  };
  const statsTimide = ctx.PokeMoteur.calculerStats(pTimide);

  assert.strictEqual(statsTimide.pv, statsNeutre.pv, "PV must NEVER be modified by nature");
  assert.strictEqual(
    statsTimide.vit,
    Math.floor(statsNeutre.vit * 1.1),
    "Timide must grant floor(vit * 1.1)"
  );
  assert.strictEqual(
    statsTimide.atk,
    Math.floor(statsNeutre.atk * 0.9),
    "Timide must apply floor(atk * 0.9)"
  );
  assert.strictEqual(statsTimide.def, statsNeutre.def, "Def must be unaffected");
  assert.strictEqual(statsTimide.sat, statsNeutre.sat, "Sat must be unaffected");
  assert.strictEqual(statsTimide.sdf, statsNeutre.sdf, "Sdf must be unaffected");
});

test("PokeMoteur.creer respects o.nature and consumes zero PRNG without o.genererNature", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");

  const h1 = new ctx.PokeHasard("test_seed_1");
  const p1 = ctx.PokeMoteur.creer(252, 5, h1, { nature: "modeste" });
  assert.strictEqual(p1.nature, "modeste");
  assert.strictEqual(p1.stats.sat, Math.floor(ctx.PokeMoteur.calculerStats({ ...p1, nature: "hardi" }).sat * 1.1));

  // Verify that without o.genererNature and without o.nature, nature is undefined and NO extra PRNG is consumed
  const h2a = new ctx.PokeHasard("seed_invariance");
  const pDefault = ctx.PokeMoteur.creer(25, 5, h2a); // Pikachu
  const drawsDefault = h2a.tirages;
  assert.strictEqual(pDefault.nature, undefined);

  // Now create with o.genererNature: true
  const h2b = new ctx.PokeHasard("seed_invariance");
  const pGenerated = ctx.PokeMoteur.creer(25, 5, h2b, { genererNature: true });
  assert.ok(pGenerated.nature, "Generated Pokemon should have a nature");
  assert.ok(ctx.PokeNatures.liste().includes(pGenerated.nature));
  assert.strictEqual(h2b.tirages, drawsDefault + 1, "genererNature should consume exactly 1 PRNG draw");
});

test("Cross-generational invariance: Gen 1 & Gen 2 creer behavior unchanged", () => {
  const ctx = loadFullNoyauContext();

  // Gen 1
  ctx.PokeRegles.poser("gen1");
  const hGen1 = new ctx.PokeHasard("seed_gen1");
  const pGen1 = ctx.PokeMoteur.creer(1, 5, hGen1);
  assert.strictEqual(pGen1.nature, undefined, "Gen 1 creature must have undefined nature");

  // Gen 2
  ctx.PokeRegles.poser("gen2");
  const hGen2 = new ctx.PokeHasard("seed_gen2");
  const pGen2 = ctx.PokeMoteur.creer(152, 5, hGen2);
  assert.strictEqual(pGen2.nature, undefined, "Gen 2 creature must have undefined nature");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n------------------------------------------------------------");
console.log(`Test Run Completed`);
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log(`\x1b[31mSOME TESTS FAILED!\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m`);
  process.exit(0);
}
