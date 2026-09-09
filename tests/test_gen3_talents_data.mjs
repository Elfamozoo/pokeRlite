/**
 * tests/test_gen3_talents_data.mjs
 * Unit test suite for Gen 3 canonical abilities database and 100% species mapping.
 *
 * Verifies:
 * 1. File existence & strict NOYAU constraints in js/poke/gen3/talents.js.
 * 2. Exactly 76 canonical Gen 3 abilities defined in POKE_GEN3_TALENTS with { nom: { fr, en }, desc: { fr, en } }.
 * 3. Helper PokeTalents methods: table, cles, liste, nom, desc, de.
 * 4. ordre.js wiring: "js/poke/gen3/talents.js" registered in GEN3 immediately after "js/poke/gen3/natures.js".
 * 5. 100% of Hoenn species (252 to 386) have a valid canonical talent in POKE_GEN3_TALENTS.
 * 6. 100% of species 1 to 251 have a valid canonical Gen 3 retro talent in POKE_GEN3_TALENTS.
 * 7. Key signature abilities and starter lines (Arcko, Poussifeu, Gobou, Munja, Kyogre, Groudon, Rayquaza, Ectoplasma, Ronflex...).
 * 8. PokeMoteur.creer propagation:
 *    - Defaults to species talent without PRNG draw.
 *    - Explicit o.talent is respected.
 *    - Cross-generational invariance.
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
suite("1. File Existence & Static Constraints (js/poke/gen3/talents.js)");

const TALENTS_PATH = "js/poke/gen3/talents.js";

test("talents.js exists on disk", () => {
  const fullPath = path.join(ROOT_DIR, TALENTS_PATH);
  assert.ok(fs.existsSync(fullPath), `File not found: ${TALENTS_PATH}`);
});

test("talents.js respects strict mode and has zero non-deterministic / DOM calls", () => {
  const fullPath = path.join(ROOT_DIR, TALENTS_PATH);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Cannot perform static analysis: ${TALENTS_PATH} does not exist`);
  }
  const rawCode = fs.readFileSync(fullPath, "utf-8");
  const cleanCode = stripComments(rawCode);

  assert.ok(
    cleanCode.includes('"use strict"') || cleanCode.includes("'use strict'"),
    "talents.js must declare 'use strict'"
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

test("ordre.js includes talents.js in GEN3 immediately after natures.js", () => {
  const ordreCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreCtx);

  const gen3 = ordreCtx.POKE_ORDRE_GEN3;
  assert.ok(Array.isArray(gen3), "POKE_ORDRE_GEN3 must be an array");

  const idxNatures = gen3.indexOf("js/poke/gen3/natures.js");
  const idxTalents = gen3.indexOf("js/poke/gen3/talents.js");

  assert.ok(idxNatures !== -1, "natures.js must be in POKE_ORDRE_GEN3");
  assert.ok(idxTalents !== -1, "talents.js must be in POKE_ORDRE_GEN3");
  assert.strictEqual(
    idxTalents,
    idxNatures + 1,
    "talents.js must be located immediately after natures.js in POKE_ORDRE_GEN3"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: 76 Canonical Gen 3 Talents & PokeTalents Helper
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Canonical Abilities Definitions & PokeTalents Helpers");

const EXPECTED_76_TALENTS = [
  "STENCH", "DRIZZLE", "SPEED_BOOST", "BATTLE_ARMOR", "STURDY", "DAMP", "LIMBER",
  "SAND_VEIL", "STATIC", "VOLT_ABSORB", "WATER_ABSORB", "OBLIVIOUS", "CLOUD_NINE",
  "COMPOUND_EYES", "INSOMNIA", "COLOR_CHANGE", "IMMUNITY", "FLASH_FIRE", "SHIELD_DUST",
  "OWN_TEMPO", "SUCTION_CUPS", "INTIMIDATE", "SHADOW_TAG", "ROUGH_SKIN", "WONDER_GUARD",
  "LEVITATE", "EFFECT_SPORE", "SYNCHRONIZE", "CLEAR_BODY", "NATURAL_CURE", "LIGHTNING_ROD",
  "SERENE_GRACE", "SWIFT_SWIM", "CHLOROPHYLL", "ILLUMINATE", "TRACE", "HUGE_POWER",
  "POISON_POINT", "INNER_FOCUS", "MAGMA_ARMOR", "WATER_VEIL", "MAGNET_PULL", "SOUNDPROOF",
  "RAIN_DISH", "SAND_STREAM", "PRESSURE", "THICK_FAT", "EARLY_BIRD", "FLAME_BODY",
  "RUN_AWAY", "KEEN_EYE", "HYPER_CUTTER", "PICKUP", "TRUANT", "HUSTLE", "CUTE_CHARM",
  "PLUS", "MINUS", "FORECAST", "STICKY_HOLD", "SHED_SKIN", "GUTS", "MARVEL_SCALE",
  "LIQUID_OOZE", "OVERGROW", "BLAZE", "TORRENT", "SWARM", "ROCK_HEAD", "DROUGHT",
  "ARENA_TRAP", "VITAL_SPIRIT", "WHITE_SMOKE", "PURE_POWER", "SHELL_ARMOR", "AIR_LOCK",
];

let isolatedCtx;

test("talents.js evaluates and exports POKE_GEN3_TALENTS and PokeTalents", () => {
  isolatedCtx = createIsolatedContext();
  loadScriptInContext(TALENTS_PATH, isolatedCtx);

  assert.ok(isolatedCtx.POKE_GEN3_TALENTS, "POKE_GEN3_TALENTS must be defined");
  assert.ok(isolatedCtx.PokeTalents, "PokeTalents must be defined");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.table, "function");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.cles, "function");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.liste, "function");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.nom, "function");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.desc, "function");
  assert.strictEqual(typeof isolatedCtx.PokeTalents.de, "function");
});

test("POKE_GEN3_TALENTS contains exactly 76 abilities with valid nom and desc", () => {
  const talents = isolatedCtx.POKE_GEN3_TALENTS;
  const keys = Object.keys(talents);
  assert.strictEqual(keys.length, 76, `Must contain exactly 76 talents, found ${keys.length}`);

  for (const key of EXPECTED_76_TALENTS) {
    const t = talents[key];
    assert.ok(t, `Talent ${key} must exist in POKE_GEN3_TALENTS`);
    assert.ok(t.nom && typeof t.nom.fr === "string" && t.nom.fr.length > 0, `${key} missing nom.fr`);
    assert.ok(t.nom && typeof t.nom.en === "string" && t.nom.en.length > 0, `${key} missing nom.en`);
    assert.ok(t.desc && typeof t.desc.fr === "string" && t.desc.fr.length > 0, `${key} missing desc.fr`);
    assert.ok(t.desc && typeof t.desc.en === "string" && t.desc.en.length > 0, `${key} missing desc.en`);
  }
});

test("PokeTalents helper functions work as expected", () => {
  const PT = isolatedCtx.PokeTalents;
  assert.strictEqual(PT.table(), isolatedCtx.POKE_GEN3_TALENTS);

  const cles = PT.cles();
  const liste = PT.liste();
  assert.strictEqual(cles.length, 76);
  assert.strictEqual(liste.length, 76);
  assert.deepStrictEqual(cles, liste);

  assert.strictEqual(PT.nom("INTIMIDATE"), "Intimidation");
  assert.strictEqual(PT.nom("INTIMIDATE", "fr"), "Intimidation");
  assert.strictEqual(PT.nom("INTIMIDATE", "en"), "Intimidate");
  assert.strictEqual(PT.nom("UNKNOWN"), "UNKNOWN");

  assert.strictEqual(PT.desc("DRIZZLE"), "Invoque la pluie en entrant en combat.");
  assert.strictEqual(PT.desc("DRIZZLE", "fr"), "Invoque la pluie en entrant en combat.");
  assert.strictEqual(PT.desc("DRIZZLE", "en"), "Summons rain in battle.");
  assert.strictEqual(PT.desc("UNKNOWN"), "");

  assert.strictEqual(PT.de({ talent: "LEVITATE" }), "LEVITATE");
  assert.strictEqual(PT.de({}), null);
  assert.strictEqual(PT.de(null), null);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: 100% Species Mapping Verification (1-386)
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Species Talent Mapping Verification (1-386)");

test("All 135 Hoenn species (252-386) have valid canonical talents", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const espTable = ctx.PokeRegles.especes();
  const talents = ctx.POKE_GEN3_TALENTS;

  for (let n = 252; n <= 386; n++) {
    const e = espTable[n];
    assert.ok(e, `Species ${n} must exist in Gen 3`);
    assert.ok(e.talent, `Species ${n} (${e.nom?.fr || e.cle}) must have a 'talent' property`);
    assert.ok(talents[e.talent], `Species ${n} talent '${e.talent}' must exist in POKE_GEN3_TALENTS`);
  }

  // Canonical Hoenn signatures and starters
  assert.strictEqual(espTable[252].talent, "OVERGROW", "Treecko must have OVERGROW");
  assert.strictEqual(espTable[255].talent, "BLAZE", "Torchic must have BLAZE");
  assert.strictEqual(espTable[258].talent, "TORRENT", "Mudkip must have TORRENT");
  assert.strictEqual(espTable[292].talent, "WONDER_GUARD", "Shedinja must have WONDER_GUARD");
  assert.strictEqual(espTable[351].talent, "FORECAST", "Castform must have FORECAST");
  assert.strictEqual(espTable[352].talent, "COLOR_CHANGE", "Kecleon must have COLOR_CHANGE");
  assert.strictEqual(espTable[382].talent, "DRIZZLE", "Kyogre must have DRIZZLE");
  assert.strictEqual(espTable[383].talent, "DROUGHT", "Groudon must have DROUGHT");
  assert.strictEqual(espTable[384].talent, "AIR_LOCK", "Rayquaza must have AIR_LOCK");
  assert.strictEqual(espTable[385].talent, "SERENE_GRACE", "Jirachi must have SERENE_GRACE");
  assert.strictEqual(espTable[386].talent, "PRESSURE", "Deoxys must have PRESSURE");
});

test("All species 1-251 have valid canonical Gen 3 retro-talents", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const espTable = ctx.PokeRegles.especes();
  const talents = ctx.POKE_GEN3_TALENTS;

  for (let n = 1; n <= 251; n++) {
    const e = espTable[n];
    assert.ok(e, `Species ${n} must exist`);
    assert.ok(e.talent, `Species ${n} (${e.nom?.fr || e.cle}) must have a 'talent' property`);
    assert.ok(talents[e.talent], `Species ${n} talent '${e.talent}' must exist in POKE_GEN3_TALENTS`);
  }

  // Canonical Kanto & Johto signatures and starters
  assert.strictEqual(espTable[1].talent, "OVERGROW", "Bulbasaur must have OVERGROW");
  assert.strictEqual(espTable[4].talent, "BLAZE", "Charmander must have BLAZE");
  assert.strictEqual(espTable[7].talent, "TORRENT", "Squirtle must have TORRENT");
  assert.strictEqual(espTable[25].talent, "STATIC", "Pikachu must have STATIC");
  assert.strictEqual(espTable[94].talent, "LEVITATE", "Gengar must have LEVITATE");
  assert.strictEqual(espTable[143].talent, "IMMUNITY", "Snorlax must have IMMUNITY");
  assert.strictEqual(espTable[150].talent, "PRESSURE", "Mewtwo must have PRESSURE");
  assert.strictEqual(espTable[151].talent, "SYNCHRONIZE", "Mew must have SYNCHRONIZE");

  assert.strictEqual(espTable[152].talent, "OVERGROW", "Chikorita must have OVERGROW");
  assert.strictEqual(espTable[155].talent, "BLAZE", "Cyndaquil must have BLAZE");
  assert.strictEqual(espTable[158].talent, "TORRENT", "Totodile must have TORRENT");
  assert.strictEqual(espTable[248].talent, "SAND_STREAM", "Tyranitar must have SAND_STREAM");
  assert.strictEqual(espTable[249].talent, "PRESSURE", "Lugia must have PRESSURE");
  assert.strictEqual(espTable[250].talent, "PRESSURE", "Ho-Oh must have PRESSURE");
  assert.strictEqual(espTable[251].talent, "NATURAL_CURE", "Celebi must have NATURAL_CURE");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: PokeMoteur.creer Integration & PRNG Invariance
// ─────────────────────────────────────────────────────────────────────────────
suite("5. PokeMoteur.creer Integration & PRNG Invariance");

test("creer automatically initializes talent from species", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");

  const h = new ctx.PokeHasard("test_creer_talent_seed");
  const pTreecko = ctx.PokeMoteur.creer(252, 5, h);
  assert.strictEqual(pTreecko.talent, "OVERGROW");

  const pShedinja = ctx.PokeMoteur.creer(292, 20, h);
  assert.strictEqual(pShedinja.talent, "WONDER_GUARD");

  const pGengar = ctx.PokeMoteur.creer(94, 50, h);
  assert.strictEqual(pGengar.talent, "LEVITATE");
});

test("creer respects explicit o.talent override", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");

  const h = new ctx.PokeHasard("test_creer_talent_override");
  const pCustom = ctx.PokeMoteur.creer(252, 5, h, { talent: "SPEED_BOOST" });
  assert.strictEqual(pCustom.talent, "SPEED_BOOST");
});

test("creer talent initialization consumes zero PRNG draws", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");

  const h1 = new ctx.PokeHasard("prng_invariance_test");
  const p1 = ctx.PokeMoteur.creer(252, 5, h1);
  const draws = h1.tirages;

  // DVs consume 5 draws (or 1 for DV object) - verify draws are identical regardless of talent
  const h2 = new ctx.PokeHasard("prng_invariance_test");
  const p2 = ctx.PokeMoteur.creer(252, 5, h2, { talent: "TORRENT" });
  assert.strictEqual(h2.tirages, draws, "Talent initialization must consume zero PRNG draws");
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
