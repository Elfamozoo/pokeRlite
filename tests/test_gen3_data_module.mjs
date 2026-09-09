/**
 * tests/test_gen3_data_module.mjs
 * Unit test suite for Gen 3 NOYAU Data Modules.
 *
 * Verifies:
 * 1. Isolated headless execution (Node.js context, zero window/document).
 * 2. Static analysis: strict mode ('use strict'), zero DOM references, zero non-deterministic calls.
 * 3. js/poke/gen3/types.js:
 *    - Exports POKE_GEN3_TYPES (17 types), POKE_GEN3_TYPE_NOMS, POKE_GEN3_TYPE_TABLE, POKE_GEN3_TYPES_SPECIAUX (8 types).
 *    - Type matchup assertions.
 * 4. js/poke/gen3/effets.js:
 *    - Exports POKE_GEN3_EFFETS with translations to engine combat handlers.
 * 5. js/poke/gen3/attaques.js:
 *    - Exports POKE_GEN3_ATTAQUES (103 moves, 252-354) & POKE_GEN3_ATTAQUE_PAR_CLE.
 *    - Categorization: "special" for 8 special types, "physique" for 9 physical types.
 *    - Required fields on every move.
 * 6. js/poke/gen3/especes.js:
 *    - Exports POKE_GEN3_ESPECES (135 species, 252-386) & POKE_GEN3_ESPECE.
 *    - Base stats: 6 positive values (pv, atk, def, vit, sat, sdf).
 *    - Pre-gen 6 types (Ralts line Psychic, Mawile Steel, Azurill Normal).
 *    - Cross-gen evolutions > 386 completely purged (Linoone, Nosepass, Roselia, Dusclops, Kirlia, Snorunt).
 *    - Duplicate evolutions cleaned (Zigzagoon).
 *    - Valid `par` for all evolution entries (Nincada -> Ninjask 291 & Shedinja 292).
 *    - Feebas evolves to Milotic with `par: "bonheur"`.
 *    - 14 historical move keys normalized across depart, apprend, and ct.
 * 7. js/poke/gen3/objets.js:
 *    - Exports POKE_GEN3_OBJETS with Hoenn held items, berries, stones, and key items.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert";
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
  }
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n\r]*/g, "");
}

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
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  const code = fs.readFileSync(fullPath, "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

const GEN3_FILES = [
  "js/poke/gen3/types.js",
  "js/poke/gen3/effets.js",
  "js/poke/gen3/attaques.js",
  "js/poke/gen3/especes.js",
  "js/poke/gen3/objets.js",
];

// ── Suite 1: File Existence & Strict NOYAU Constraints ─────────────────────────
suite("1. File Existence & Strict NOYAU Constraints");

test("All 5 Gen 3 NOYAU data files exist on disk", () => {
  for (const relPath of GEN3_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  }
});

test("Strict mode ('use strict') is enforced in all 5 files", () => {
  for (const relPath of GEN3_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.match(content, /"use strict"|'use strict'/, `${relPath} must contain 'use strict'`);
  }
});

test("Zero non-deterministic calls (Math.random, Date.now, new Date, performance.now)", () => {
  const forbiddenPatterns = [
    { pattern: /\bMath\.random\s*\(/g, name: "Math.random()" },
    { pattern: /\bDate\.now\s*\(/g, name: "Date.now()" },
    { pattern: /\bnew\s+Date\b/g, name: "new Date()" },
    { pattern: /\bperformance\.now\s*\(/g, name: "performance.now()" },
    { pattern: /\bcrypto\.getRandomValues\s*\(/g, name: "crypto.getRandomValues()" },
  ];
  for (const relPath of GEN3_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const code = stripComments(fs.readFileSync(fullPath, "utf-8"));
    for (const { pattern, name } of forbiddenPatterns) {
      assert.ok(!pattern.test(code), `${relPath}: forbidden non-deterministic call to ${name}`);
    }
  }
});

test("Zero DOM leaks or browser globals (document, localStorage, etc.)", () => {
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
  for (const relPath of GEN3_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const code = stripComments(fs.readFileSync(fullPath, "utf-8"));
    for (const { pattern, name } of forbiddenDOM) {
      assert.ok(!pattern.test(code), `${relPath}: forbidden DOM/browser reference to ${name}`);
    }
  }
});

// ── Suite 2: Execution in Headless Context ─────────────────────────────────────
suite("2. Headless Context Execution & Global Exports");

let ctx;
test("All 5 files evaluate cleanly in isolated context without DOM", () => {
  ctx = createIsolatedContext();
  assert.equal(typeof ctx.window, "undefined");
  assert.equal(typeof ctx.document, "undefined");

  for (const relPath of GEN3_FILES) {
    loadScriptInContext(relPath, ctx);
  }

  assert.ok(ctx.POKE_GEN3_TYPES, "POKE_GEN3_TYPES must be exported");
  assert.ok(ctx.POKE_GEN3_TYPE_NOMS, "POKE_GEN3_TYPE_NOMS must be exported");
  assert.ok(ctx.POKE_GEN3_TYPE_TABLE, "POKE_GEN3_TYPE_TABLE must be exported");
  assert.ok(ctx.POKE_GEN3_TYPES_SPECIAUX, "POKE_GEN3_TYPES_SPECIAUX must be exported");
  assert.ok(ctx.POKE_GEN3_EFFETS, "POKE_GEN3_EFFETS must be exported");
  assert.ok(ctx.POKE_GEN3_ATTAQUES, "POKE_GEN3_ATTAQUES must be exported");
  assert.ok(ctx.POKE_GEN3_ATTAQUE_PAR_CLE, "POKE_GEN3_ATTAQUE_PAR_CLE must be exported");
  assert.ok(ctx.POKE_GEN3_ESPECES, "POKE_GEN3_ESPECES must be exported");
  assert.ok(ctx.POKE_GEN3_ESPECE, "POKE_GEN3_ESPECE must be exported");
  assert.ok(ctx.POKE_GEN3_OBJETS, "POKE_GEN3_OBJETS must be exported");
});

// ── Suite 3: Types Verification (types.js) ────────────────────────────────────
suite("3. Types & Matchup Table (types.js)");

test("POKE_GEN3_TYPES contains exactly 17 canonical types without fairy", () => {
  const types = ctx.POKE_GEN3_TYPES;
  assert.equal(types.length, 17, "Gen 3 has exactly 17 types");
  assert.ok(!types.includes("fairy"), "Fairy type does NOT exist in Gen 3");
  const expected = [
    "normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel",
    "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"
  ];
  assert.deepEqual(types, expected);
});

test("POKE_GEN3_TYPES_SPECIAUX contains exactly the 8 canonical special types", () => {
  const speciaux = ctx.POKE_GEN3_TYPES_SPECIAUX;
  assert.equal(speciaux.length, 8);
  const expected = ["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"];
  assert.deepEqual(speciaux, expected);
});

test("POKE_GEN3_TYPE_TABLE implements canonical Gen 2/3 effectiveness", () => {
  const table = ctx.POKE_GEN3_TYPE_TABLE;
  assert.equal(table.ghost.psychic, 2, "Ghost super effective against Psychic");
  assert.equal(table.bug.poison, 0.5, "Bug resists or weak? Bug against poison is 0.5");
  assert.equal(table.poison.bug, 1, "Poison against bug is 1 (in gen 2/3)");
  assert.equal(table.ice.fire, 0.5, "Ice against fire is 0.5 (resisted in gen 2/3)");
  assert.equal(table.steel.dark, 1, "Steel against dark is 1");
  assert.equal(table.dark.steel, 0.5, "Steel resists dark in Gen 3 (0.5)");
  assert.equal(table.ghost.steel, 0.5, "Steel resists ghost in Gen 3 (0.5)");
  assert.equal(table.fighting.normal, 2, "Fighting super effective against normal");
  assert.equal(table.ground.electric, 2, "Ground super effective against electric");
  assert.equal(table.electric.ground, 0, "Electric does zero damage to ground");
  assert.equal(table.normal.ghost, 0, "Normal does zero damage to ghost");
});

test("POKE_GEN3_TYPE_NOMS has bilingual entries for all 17 types", () => {
  const noms = ctx.POKE_GEN3_TYPE_NOMS;
  for (const t of ctx.POKE_GEN3_TYPES) {
    assert.ok(noms[t], `Missing name for type ${t}`);
    assert.ok(noms[t].fr, `Missing French name for ${t}`);
    assert.ok(noms[t].en, `Missing English name for ${t}`);
  }
});

// ── Suite 4: Effects Mapping (effets.js) ───────────────────────────────────────
suite("4. Effects Mapping (effets.js)");

test("POKE_GEN3_EFFETS maps Gen 3 move effects to engine handlers", () => {
  const effets = ctx.POKE_GEN3_EFFETS;
  assert.ok(typeof effets === "object" && effets !== null);
  assert.equal(effets.EFFECT_ALWAYS_HIT, "SWIFT_EFFECT");
  assert.equal(effets.EFFECT_MULTI_HIT, "TWO_TO_FIVE_ATTACKS_EFFECT");
  assert.equal(effets.EFFECT_RECOIL_HIT, "RECOIL_EFFECT");
  assert.equal(effets.EFFECT_OHKO, "OHKO_EFFECT");
  assert.equal(effets.EFFECT_HEAL, "HEAL_EFFECT");
  assert.equal(effets.EFFECT_SLEEP, "SLEEP_EFFECT");
  assert.equal(effets.EFFECT_CONFUSE, "CONFUSION_EFFECT");
  assert.equal(effets.EFFECT_BURN_HIT, "BURN_SIDE_EFFECT1");
  assert.equal(effets.EFFECT_FLINCH_HIT, "FLINCH_SIDE_EFFECT1");
  assert.equal(effets.EFFECT_CONFUSE_HIT, "CONFUSION_SIDE_EFFECT");
  assert.equal(effets.EFFECT_TRAP_TARGET, "TRAPPING_EFFECT");
  assert.equal(effets.EFFECT_HYPER_BEAM, "HYPER_BEAM_EFFECT");
  assert.equal(effets.EFFECT_FLY, "FLY_EFFECT");
});

// ── Suite 5: Attacks (attaques.js) ─────────────────────────────────────────────
suite("5. Attacks Integrity & Categorization (attaques.js)");

test("POKE_GEN3_ATTAQUES has exactly 103 moves from id 252 to 354", () => {
  const att = ctx.POKE_GEN3_ATTAQUES;
  assert.equal(att.length, 103);
  assert.equal(att[0].id, 252);
  assert.equal(att[0].cle, "FAKE_OUT");
  assert.equal(att[att.length - 1].id, 354);
  assert.equal(att[att.length - 1].cle, "PSYCHO_BOOST");
});

test("POKE_GEN3_ATTAQUE_PAR_CLE indexes all 103 moves", () => {
  const parCle = ctx.POKE_GEN3_ATTAQUE_PAR_CLE;
  assert.equal(Object.keys(parCle).length, 103);
  assert.ok(parCle.FAKE_OUT);
  assert.ok(parCle.LEAF_BLADE);
  assert.ok(parCle.BLAZE_KICK);
  assert.ok(parCle.MUDDY_WATER);
  assert.ok(parCle.AERIAL_ACE);
  assert.ok(parCle.VOLT_TACKLE);
  assert.ok(parCle.PSYCHO_BOOST);
});

test("Every move has valid schema and Gen 3 type-based categorization", () => {
  const specialTypes = new Set(ctx.POKE_GEN3_TYPES_SPECIAUX);
  for (const a of ctx.POKE_GEN3_ATTAQUES) {
    assert.ok(a.id >= 252 && a.id <= 354, `Invalid id: ${a.id}`);
    assert.ok(typeof a.cle === "string" && a.cle.length > 0, `Invalid cle: ${a.cle}`);
    assert.ok(a.nom && a.nom.fr && a.nom.en, `Invalid nom on ${a.cle}`);
    assert.ok(ctx.POKE_GEN3_TYPES.includes(a.type), `Invalid type ${a.type} on ${a.cle}`);
    assert.ok(typeof a.puissance === "number", `Invalid puissance on ${a.cle}`);
    assert.ok(typeof a.precision === "number", `Invalid precision on ${a.cle}`);
    assert.ok(typeof a.pp === "number" && a.pp > 0, `Invalid pp on ${a.cle}`);
    assert.ok(typeof a.effet === "string", `Invalid effet on ${a.cle}`);

    // Categorization check
    const expectedCat = specialTypes.has(a.type) ? "special" : "physique";
    assert.equal(a.categorie, expectedCat, `Move ${a.cle} type ${a.type} category mismatch: got ${a.categorie}, expected ${expectedCat}`);
  }
});

// ── Suite 6: Species Data & Sanitization (especes.js) ──────────────────────────
suite("6. Species Integrity & Sanitization (especes.js)");

test("POKE_GEN3_ESPECES contains exactly 135 species (252 to 386)", () => {
  const esp = ctx.POKE_GEN3_ESPECES;
  assert.equal(esp.length, 135);
  assert.equal(esp[0].n, 252);
  assert.equal(esp[0].cle, "TREECKO");
  assert.equal(esp[esp.length - 1].n, 386);
  assert.equal(esp[esp.length - 1].cle, "DEOXYS");
});

test("POKE_GEN3_ESPECE indexes by both national dex number and uppercase cle", () => {
  const parIndex = ctx.POKE_GEN3_ESPECE;
  for (let n = 252; n <= 386; n++) {
    assert.ok(parIndex[n], `Missing species by index ${n}`);
    const cle = parIndex[n].cle;
    assert.ok(parIndex[cle], `Missing species by cle ${cle}`);
    assert.equal(parIndex[n], parIndex[cle]);
  }
});

test("Base stats have 6 positive integers (pv, atk, def, vit, sat, sdf)", () => {
  for (const p of ctx.POKE_GEN3_ESPECES) {
    const b = p.base;
    assert.ok(b, `Missing base stats on ${p.cle}`);
    for (const stat of ["pv", "atk", "def", "vit", "sat", "sdf"]) {
      assert.ok(typeof b[stat] === "number" && Number.isInteger(b[stat]) && b[stat] > 0,
        `Invalid ${stat} stat on ${p.cle}: ${b[stat]}`);
    }
  }
});

test("Types strictly adhere to Gen 3 rules (no Fairy type)", () => {
  for (const p of ctx.POKE_GEN3_ESPECES) {
    for (const t of p.types) {
      assert.ok(ctx.POKE_GEN3_TYPES.includes(t), `Invalid type ${t} on ${p.cle}`);
      assert.notEqual(t, "fairy", `Fairy type found on ${p.cle}`);
    }
    if (p.n === 280 || p.n === 281 || p.n === 282) {
      assert.deepEqual(p.types, ["psychic"], `Species ${p.cle} should be pure psychic in Gen 3`);
    }
    if (p.n === 298) {
      assert.deepEqual(p.types, ["normal"], `Azurill should be pure normal in Gen 3`);
    }
    if (p.n === 303) {
      assert.deepEqual(p.types, ["steel"], `Mawile should be pure steel in Gen 3`);
    }
  }
});

test("No evolutions targeting species > 386 exist", () => {
  for (const p of ctx.POKE_GEN3_ESPECES) {
    for (const ev of (p.evolue || [])) {
      assert.ok(ev.vers >= 1 && ev.vers <= 386, `Species ${p.cle} (#${p.n}) has cross-gen evolution to #${ev.vers}`);
    }
  }
});

test("Specific cross-gen evolutions are cleanly removed", () => {
  const esp = ctx.POKE_GEN3_ESPECE;
  // Linoone (264)
  assert.deepEqual(esp[264].evolue, [], "Linoone (264) must have evolue: []");
  // Nosepass (299)
  assert.deepEqual(esp[299].evolue, [], "Nosepass (299) must have evolue: []");
  // Roselia (315)
  assert.deepEqual(esp[315].evolue, [], "Roselia (315) must have evolue: []");
  // Dusclops (356)
  assert.deepEqual(esp[356].evolue, [], "Dusclops (356) must have evolue: []");
  // Kirlia (281) only Gardevoir 282
  assert.equal(esp[281].evolue.length, 1);
  assert.equal(esp[281].evolue[0].vers, 282);
  assert.equal(esp[281].evolue[0].par, "niveau");
  assert.equal(esp[281].evolue[0].niveau, 30);
  // Snorunt (361) only Glalie 362
  assert.equal(esp[361].evolue.length, 1);
  assert.equal(esp[361].evolue[0].vers, 362);
  assert.equal(esp[361].evolue[0].par, "niveau");
  assert.equal(esp[361].evolue[0].niveau, 42);
});

test("Duplicate evolutions are cleaned (Zigzagoon)", () => {
  const esp = ctx.POKE_GEN3_ESPECE;
  assert.equal(esp[263].evolue.length, 1, "Zigzagoon should have exactly 1 evolution entry");
  assert.equal(esp[263].evolue[0].vers, 264);
  assert.equal(esp[263].evolue[0].par, "niveau");
  assert.equal(esp[263].evolue[0].niveau, 20);
});

test("All evolution entries have a valid 'par' property", () => {
  for (const p of ctx.POKE_GEN3_ESPECES) {
    for (const ev of (p.evolue || [])) {
      assert.ok(typeof ev.par === "string" && ev.par.length > 0,
        `Evolution on ${p.cle} missing par: ${JSON.stringify(ev)}`);
    }
  }
  // Nincada check
  const nincada = ctx.POKE_GEN3_ESPECE[290];
  assert.equal(nincada.evolue.length, 2);
  const targets = nincada.evolue.map(e => e.vers).sort();
  assert.deepEqual(targets, [291, 292]);
  for (const ev of nincada.evolue) {
    assert.ok(ev.par, `Nincada evolution to ${ev.vers} must have par`);
    assert.equal(ev.par, "niveau");
    assert.equal(ev.niveau, 20);
  }
});

test("Feebas (349) evolves to Milotic (350) with par: 'bonheur'", () => {
  const feebas = ctx.POKE_GEN3_ESPECE[349];
  assert.ok(feebas.evolue && feebas.evolue.length >= 1);
  assert.equal(feebas.evolue[0].vers, 350);
  assert.equal(feebas.evolue[0].par, "bonheur");
});

test("14 historical move keys are normalized across depart, apprend, and ct", () => {
  const FORBIDDEN_MODERN_KEYS = [
    "SOLAR_BEAM",
    "PSYCHIC",
    "FEINT_ATTACK",
    "BUBBLE_BEAM",
    "POISON_POWDER",
    "DYNAMIC_PUNCH",
    "DOUBLE_SLAP",
    "VICE_GRIP",
    "HIGH_JUMP_KICK",
    "THUNDER_PUNCH",
    "DRAGON_BREATH",
    "SELF_DESTRUCT",
    "ANCIENT_POWER",
    "EXTREME_SPEED",
  ];

  const violations = [];
  for (const p of ctx.POKE_GEN3_ESPECES) {
    for (const m of p.depart || []) {
      if (FORBIDDEN_MODERN_KEYS.includes(m)) violations.push(`${p.cle}.depart has forbidden key ${m}`);
    }
    for (const [lvl, m] of p.apprend || []) {
      if (FORBIDDEN_MODERN_KEYS.includes(m)) violations.push(`${p.cle}.apprend has forbidden key ${m}`);
    }
    for (const m of p.ct || []) {
      if (FORBIDDEN_MODERN_KEYS.includes(m)) violations.push(`${p.cle}.ct has forbidden key ${m}`);
    }
  }

  assert.equal(violations.length, 0, `Found unnormalized move keys:\n${violations.slice(0, 10).join("\n")}`);

  // Confirm historical keys are present
  const esp = ctx.POKE_GEN3_ESPECE;
  // Treecko CT has SOLARBEAM
  assert.ok(esp[252].ct.includes("SOLARBEAM"), "Treecko should have normalized SOLARBEAM");
  // Ralts apprend has PSYCHIC_M
  assert.ok(esp[280].apprend.some(([lvl, m]) => m === "PSYCHIC_M"), "Ralts should have normalized PSYCHIC_M");
  // Rayquaza has EXTREMESPEED & ANCIENTPOWER
  assert.ok(esp[384].apprend.some(([lvl, m]) => m === "EXTREMESPEED"), "Rayquaza should have normalized EXTREMESPEED");
  assert.ok(esp[384].apprend.some(([lvl, m]) => m === "ANCIENTPOWER"), "Rayquaza should have normalized ANCIENTPOWER");
});

// ── Suite 7: Items Data (objets.js) ───────────────────────────────────────────
suite("7. Items Integrity (objets.js)");

test("POKE_GEN3_OBJETS exports valid item dictionary with Hoenn items", () => {
  const objets = ctx.POKE_GEN3_OBJETS;
  assert.ok(typeof objets === "object" && objets !== null);

  const requiredKeys = [
    // Held items
    "SOUL_DEW", "DEEP_SEA_TOOTH", "DEEP_SEA_SCALE", "CHOICE_BAND",
    "SHELL_BELL", "SILK_SCARF", "WHITE_HERB", "MENTAL_HERB",
    // Berries
    "ORAN_BERRY", "SITRUS_BERRY", "CHERI_BERRY", "CHESTO_BERRY", "PECHA_BERRY", "RAWST_BERRY", "LUM_BERRY", "LEPPA_BERRY",
    // Stones
    "FIRE_STONE", "WATER_STONE", "THUNDERSTONE", "LEAF_STONE", "MOON_STONE", "SUN_STONE",
    // Key items & Fossils
    "CLAW_FOSSIL", "ROOT_FOSSIL", "DEVON_SCOPE", "GO_GOGGLES", "RED_ORB", "BLUE_ORB", "MAGMA_EMBLEM"
  ];

  for (const k of requiredKeys) {
    assert.ok(objets[k], `Missing required item: ${k}`);
    assert.ok(objets[k].nom && objets[k].nom.fr && objets[k].nom.en, `Item ${k} missing bilingual nom`);
    assert.ok(typeof objets[k].prix === "number", `Item ${k} missing prix`);
  }
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n------------------------------------------------------------");
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error(`\x1b[31m${failedTests} TEST(S) FAILED.\x1b[0m`);
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
}
