/**
 * tests/test_gen3_registry.mjs
 * Unit test suite for Gen 3 (Hoenn) registration in ordre.js and regles.js.
 *
 * Verifies:
 * 1. ordre.js contains POKE_ORDRE_GEN3 (14 NOYAU files) and POKE_ORDRE_GEN3_ECRANS (sons.js).
 * 2. HOENN = "ouvert", W.POKE_HOENN_ETAT = "ouvert", W.POKE_BANC_HOENN = true.
 * 3. NOYAU ordering: GEN3 files injected before regles.js.
 * 4. Pure NOYAU execution in isolated Node.js context (zero window/document).
 * 5. PokeRegles.cles() includes "gen1", "gen2", "gen3".
 * 6. PokeRegles.pour("gen3") returns complete game profile.
 * 7. PokeRegles.dexTotalCompte() returns 386.
 * 8. PokeRegles.versionsToutes() includes "emeraude".
 * 9. PokeRegles.especeToute(252) and (386) resolve correctly.
 * 10. PokeActes.construire() builds 9 acts under Gen 3.
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
  sandbox.window = sandbox;
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

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: ordre.js Gen 3 Wiring & Exports
// ─────────────────────────────────────────────────────────────────────────────
suite("1. ordre.js Gen 3 Wiring & Module Lists");

const EXPECTED_GEN3_NOYAU = [
  "js/poke/gen3/types.js",
  "js/poke/gen3/effets.js",
  "js/poke/gen3/objets.js",
  "js/poke/gen3/ct.js",
  "js/poke/gen3/obtentions.js",
  "js/poke/gen3/attaques.js",
  "js/poke/gen3/especes.js",
  "js/poke/gen3/dresseurs.js",
  "js/poke/gen3/classes.js",
  "js/poke/gen3/equipes.js",
  "js/poke/gen3/arenes.js",
  "js/poke/gen3/rival.js",
  "js/poke/gen3/monde.js",
  "js/poke/gen3/voyage.js",
];

const EXPECTED_GEN3_ECRANS = [
  "js/poke/gen3/sons.js",
];

let ordreContext;
test("ordre.js exports POKE_ORDRE_GEN3 and POKE_ORDRE_GEN3_ECRANS", () => {
  ordreContext = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreContext);

  assert.ok(ordreContext.POKE_ORDRE_GEN3, "POKE_ORDRE_GEN3 must be defined");
  assert.ok(Array.isArray(ordreContext.POKE_ORDRE_GEN3), "POKE_ORDRE_GEN3 must be an array");
  assert.deepStrictEqual([...ordreContext.POKE_ORDRE_GEN3], EXPECTED_GEN3_NOYAU);

  assert.ok(ordreContext.POKE_ORDRE_GEN3_ECRANS, "POKE_ORDRE_GEN3_ECRANS must be defined");
  assert.ok(Array.isArray(ordreContext.POKE_ORDRE_GEN3_ECRANS), "POKE_ORDRE_GEN3_ECRANS must be an array");
  assert.deepStrictEqual([...ordreContext.POKE_ORDRE_GEN3_ECRANS], EXPECTED_GEN3_ECRANS);
});

test("ordre.js sets HOENN = 'ouvert' and POKE_BANC_HOENN = true", () => {
  assert.strictEqual(ordreContext.POKE_HOENN_ETAT, "ouvert", "POKE_HOENN_ETAT must be 'ouvert'");
  assert.strictEqual(ordreContext.POKE_BANC_HOENN, true, "POKE_BANC_HOENN must be true");
});

test("POKE_ORDRE_NOYAU injects GEN3 files before regles.js", () => {
  const noyau = ordreContext.POKE_ORDRE_NOYAU;
  const idxRegles = noyau.indexOf("js/poke/regles.js");
  assert.ok(idxRegles > 0, "regles.js must exist in NOYAU");

  for (const f of EXPECTED_GEN3_NOYAU) {
    const idx = noyau.indexOf(f);
    assert.ok(idx !== -1, `File ${f} must be present in POKE_ORDRE_NOYAU`);
    assert.ok(idx < idxRegles, `GEN3 file ${f} must appear before regles.js (idx ${idx} vs ${idxRegles})`);
  }
});

test("Zero sound files in POKE_ORDRE_GEN3 (pure NOYAU logic)", () => {
  for (const f of ordreContext.POKE_ORDRE_GEN3) {
    assert.ok(!f.includes("sons"), `NOYAU file ${f} must not be a sound file`);
  }
});

test("All 14 GEN3 files exist on disk", () => {
  for (const relPath of EXPECTED_GEN3_NOYAU) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Gen 3 NOYAU file does not exist on disk: ${relPath}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Isolated Execution of NOYAU Stack with Gen 3
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Headless NOYAU Execution with Gen 3 Stack");

let ctx;
test("Evaluate full NOYAU stack with Gen 3 in isolated Node.js context", () => {
  ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);

  const noyauFiles = ctx.POKE_ORDRE_NOYAU;
  for (const f of noyauFiles) {
    try {
      loadScriptInContext(f, ctx);
    } catch (e) {
      throw new Error(`Failed loading NOYAU file '${f}' with Gen 3: ${e.message}`);
    }
  }

  assert.ok(ctx.PokeRegles, "PokeRegles must be defined");
  assert.ok(ctx.POKE_GEN3_ESPECE, "POKE_GEN3_ESPECE must be loaded");
  assert.ok(ctx.POKE_GEN3_TYPE_TABLE, "POKE_GEN3_TYPE_TABLE must be loaded");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: PokeRegles Registration of Gen 3 (Hoenn)
// ─────────────────────────────────────────────────────────────────────────────
suite("3. PokeRegles Hoenn (gen3) Registration & Profile");

test("PokeRegles.cles() includes 'gen1', 'gen2', and 'gen3'", () => {
  const cles = ctx.PokeRegles.cles();
  assert.ok(cles.includes("gen1"), "cles() must include 'gen1'");
  assert.ok(cles.includes("gen2"), "cles() must include 'gen2'");
  assert.ok(cles.includes("gen3"), "cles() must include 'gen3'");
  assert.strictEqual(ctx.PokeRegles.existe("gen3"), true, "existe('gen3') must return true");
});

test("PokeRegles.pour('gen3') returns complete profile", () => {
  const g3 = ctx.PokeRegles.pour("gen3");
  assert.ok(g3, "pour('gen3') must return profile");

  assert.strictEqual(g3.nom, "Troisième génération");
  assert.strictEqual(g3.dexTotal, 386);
  assert.deepStrictEqual([...g3.canon], [252, 255, 258]);
  assert.deepStrictEqual({ ...g3.professeur }, { fr: "Seko", en: "Birch" });
  assert.deepStrictEqual([...g3.versions], ["emeraude"]);
  assert.deepStrictEqual({ ...g3.versionsNoms.emeraude }, { fr: "Émeraude", en: "Emerald" });
  assert.strictEqual(g3.speAtk, "sat");
  assert.strictEqual(g3.speDef, "sdf");
  assert.deepStrictEqual({ ...g3.badgesStat }, { 1: "atk", 3: "vit", 5: "def", 7: "spe" });

  // Types & Tables
  assert.strictEqual(g3.types(), ctx.POKE_GEN3_TYPES);
  assert.strictEqual(g3.typeNoms(), ctx.POKE_GEN3_TYPE_NOMS);
  assert.strictEqual(g3.table(), ctx.POKE_GEN3_TYPE_TABLE);
  assert.strictEqual(g3.speciaux(), ctx.POKE_GEN3_TYPES_SPECIAUX);

  // Species & Moves (Cumulative across Gen 1, 2, and 3)
  assert.ok(g3.especes()[252] && g3.especes()[1], "especes() must contain Gen 3 and Gen 1 species");
  assert.strictEqual(g3.especesListe().length, 386, "especesListe() must contain all 386 species");
  assert.ok(g3.attaques()["LEAF_BLADE"] && g3.attaques()["TACKLE"], "attaques() must contain Gen 3 and Gen 1 moves");
  assert.ok(g3.attaquesListe().length >= 354, "attaquesListe() must contain all moves up to Gen 3");

  // Journey & Arenas
  assert.strictEqual(g3.arenes(), ctx.POKE_GEN3_ARENES);
  assert.strictEqual(g3.etapes(), ctx.POKE_GEN3_ETAPES);
  assert.strictEqual(g3.clesVoyage(), ctx.POKE_GEN3_CLES);
  assert.strictEqual(g3.badgePourCS(), ctx.POKE_GEN3_BADGE_POUR_CS);

  // Trainers & Bosses
  assert.strictEqual(g3.maitre(), ctx.POKE_GEN3_MAITRE);
  assert.strictEqual(g3.equipes(), ctx.POKE_GEN3_EQUIPES);
  assert.strictEqual(g3.classesDresseur(), ctx.POKE_GEN3_CLASSES);
  assert.strictEqual(g3.rival(), ctx.POKE_GEN3_RIVAL);
  assert.strictEqual(g3.dresseurFinal(), ctx.POKE_GEN3_STEVEN);
  assert.strictEqual(g3.conseil(), ctx.POKE_GEN3_CONSEIL);

  // Content & Scenes
  assert.strictEqual(g3.objetsTable(), ctx.POKE_GEN3_OBJETS);
  assert.strictEqual(g3.errants(), ctx.POKE_GEN3_ERRANTS);
  assert.deepStrictEqual({ ...g3.mythique() }, { n: 385, niveau: 30, lieu: "mossdeep-space-center" });
  assert.strictEqual(g3.echanges(), ctx.POKE_GEN3_ECHANGES);
  assert.strictEqual(g3.casino(), ctx.POKE_GEN3_CASINO);
  assert.strictEqual(g3.cadeaux(), ctx.POKE_GEN3_CADEAUX);
  assert.strictEqual(g3.fossiles(), ctx.POKE_GEN3_FOSSILES);

  // Visages
  assert.ok(g3.visages, "visages must be defined");
  assert.strictEqual(g3.visages.arene.length, 8);
  assert.strictEqual(g3.visages.conseil.length, 4);
  assert.strictEqual(g3.visages.maitre, "gen3/dresseur/maitre");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: PokeRegles Global Aggregations & Switching
// ─────────────────────────────────────────────────────────────────────────────
suite("4. PokeRegles Aggregations & Active World Switching");

test("PokeRegles.dexTotalCompte() returns 386", () => {
  assert.strictEqual(ctx.PokeRegles.dexTotalCompte(), 386);
});

test("PokeRegles.versionsToutes() includes 'emeraude'", () => {
  const versions = ctx.PokeRegles.versionsToutes();
  assert.ok(versions.includes("rouge"), "versionsToutes must include rouge");
  assert.ok(versions.includes("bleu"), "versionsToutes must include bleu");
  assert.ok(versions.includes("cristal"), "versionsToutes must include cristal");
  assert.ok(versions.includes("emeraude"), "versionsToutes must include emeraude");
});

test("PokeRegles.nomVersion('emeraude') resolves fr and en labels", () => {
  ctx.POKE_LANG = "fr";
  assert.strictEqual(ctx.PokeRegles.nomVersion("emeraude"), "Émeraude");
  ctx.POKE_LANG = "en";
  assert.strictEqual(ctx.PokeRegles.nomVersion("emeraude"), "Emerald");
  ctx.POKE_LANG = "fr";
});

test("PokeRegles.especeToute resolves cross-generational species (252 Arcko, 386 Deoxys)", () => {
  const arcko = ctx.PokeRegles.especeToute(252);
  assert.ok(arcko, "Species 252 must resolve");
  assert.strictEqual(arcko.nom.fr, "Arcko");

  const deoxys = ctx.PokeRegles.especeToute(386);
  assert.ok(deoxys, "Species 386 must resolve");
  assert.strictEqual(deoxys.nom.fr, "Deoxys");
});

test("PokeRegles.poser('gen3') activates Hoenn rules", () => {
  ctx.PokeRegles.poser("gen3");
  assert.strictEqual(ctx.PokeRegles.courante(), "gen3");
  assert.strictEqual(ctx.PokeRegles.dexTotal(), 386);
  assert.deepStrictEqual([...ctx.PokeRegles.canon()], [252, 255, 258]);
  assert.strictEqual(ctx.PokeRegles.professeur("fr"), "Seko");
  assert.strictEqual(ctx.PokeRegles.professeur("en"), "Birch");
  assert.strictEqual(ctx.PokeRegles.speAtk(), "sat");
  assert.strictEqual(ctx.PokeRegles.speDef(), "sdf");
  assert.deepStrictEqual([...ctx.PokeRegles.stats()], ["pv", "atk", "def", "vit", "sat", "sdf"]);

  // Reset to default
  ctx.PokeRegles.poser("gen1");
  assert.strictEqual(ctx.PokeRegles.courante(), "gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: PokeActes.construire() with Hoenn Rules
// ─────────────────────────────────────────────────────────────────────────────
suite("5. PokeActes 9-Act Roguelite Construction under Gen 3");

test("PokeActes.construire() generates exactly 9 acts under Gen 3", () => {
  ctx.PokeRegles.poser("gen3");
  const acts = ctx.PokeActes.construire();

  assert.ok(Array.isArray(acts), "construire() must return an array");
  assert.strictEqual(acts.length, 9, `Expected 9 acts for Hoenn, got ${acts.length}`);

  // Act 1 ends at Roxanne
  assert.strictEqual(acts[0].n, 1);
  assert.strictEqual(acts[0].boss, 1);

  // Act 8 ends at Juan
  assert.strictEqual(acts[7].n, 8);
  assert.strictEqual(acts[7].boss, 8);

  // Act 9 is Pokemon League
  assert.strictEqual(acts[8].n, 9);
  assert.strictEqual(acts[8].ligue, true);
  assert.ok(acts[8].epilogue, "Act 9 must have an epilogue");
  assert.ok(acts[8].epilogue.finals.length >= 1, "Epilogue must include Steven Stone");

  ctx.PokeRegles.poser("gen1");
});

// ── Test Summary ─────────────────────────────────────────────────────────────
console.log("\n" + "-".repeat(60));
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error(`\x1b[31m${failedTests} test(s) failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
  process.exit(0);
}
