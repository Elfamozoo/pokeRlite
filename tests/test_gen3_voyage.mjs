/**
 * tests/test_gen3_voyage.mjs
 * Unit test suite for Gen 3 NOYAU Roguelite Journey (voyage.js).
 *
 * Verifies:
 * 1. Isolated headless execution (Node.js context, zero window/document).
 * 2. Static analysis: strict mode ('use strict'), zero DOM references, zero non-deterministic calls.
 * 3. Progression Keys & HMs (W.POKE_GEN3_CLES, W.POKE_GEN3_BADGE_POUR_CS):
 *    - All 8 HMs (Cut to Waterfall) and story keys (Go-Goggles, Devon Scope, Master Ball).
 *    - Badges 1 to 8 mapped to each HM.
 * 4. Itinerary & 9 Acts Roguelite Progression (W.POKE_GEN3_ETAPES):
 *    - 9 progressive acts + epilogue constructible via PokeActes.
 *    - 8 Gym Leaders leading to Pokemon League (Wallace / Marc).
 *    - Valid step schema: id, lieu, categorie, tables, donne, exige.
 * 5. Complete Legendary & Mythical Access (100% Reachable):
 *    - Rayquaza (#384) on Sky Pillar.
 *    - Groudon (#383) on Terra Cave & Kyogre (#382) on Marine Cave.
 *    - Regirock (#377), Regice (#378), Registeel (#379) via Sealed Chamber.
 *    - Jirachi (#385) in Mossdeep & Deoxys (#386) on Birth Island.
 * 6. Epilogue Boss & Roamers:
 *    - Steven Stone (Pierre Rochard) on Meteor Falls deep room as dresseurFinal.
 *    - Roaming duo Latias (#380) & Latios (#381) in W.POKE_GEN3_ERRANTS.
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

// ── 1. File Existence & Static Constraints ──────────────────────────────────
suite("1. File Existence & Strict NOYAU Constraints");

const VOYAGE_FILE = "js/poke/gen3/voyage.js";

test("js/poke/gen3/voyage.js exists on disk", () => {
  const fullPath = path.join(ROOT_DIR, VOYAGE_FILE);
  assert.ok(fs.existsSync(fullPath), `Missing required file: ${VOYAGE_FILE}`);
});

test("Strict mode ('use strict') is enforced in voyage.js", () => {
  const fullPath = path.join(ROOT_DIR, VOYAGE_FILE);
  const content = fs.readFileSync(fullPath, "utf-8");
  assert.ok(
    content.includes('"use strict"') || content.includes("'use strict'"),
    "voyage.js must declare 'use strict'"
  );
});

test("Zero non-deterministic calls (Math.random, Date.now, new Date, performance.now)", () => {
  const fullPath = path.join(ROOT_DIR, VOYAGE_FILE);
  const rawCode = fs.readFileSync(fullPath, "utf-8");
  const code = stripComments(rawCode);

  assert.ok(!/\bMath\.random\s*\(/.test(code), "Forbidden Math.random() in NOYAU voyage.js");
  assert.ok(!/\bDate\.now\s*\(/.test(code), "Forbidden Date.now() in NOYAU voyage.js");
  assert.ok(!/\bnew\s+Date\s*\(/.test(code), "Forbidden new Date() in NOYAU voyage.js");
  assert.ok(!/\bperformance\.now\s*\(/.test(code), "Forbidden performance.now() in NOYAU voyage.js");
});

test("Zero DOM leaks or browser globals (document, localStorage, sessionStorage)", () => {
  const fullPath = path.join(ROOT_DIR, VOYAGE_FILE);
  const rawCode = fs.readFileSync(fullPath, "utf-8");
  const code = stripComments(rawCode);

  assert.ok(!/\bdocument\b/.test(code), "Forbidden document access in NOYAU voyage.js");
  assert.ok(!/\blocalStorage\b/.test(code), "Forbidden localStorage in NOYAU voyage.js");
  assert.ok(!/\bsessionStorage\b/.test(code), "Forbidden sessionStorage in NOYAU voyage.js");
});

// ── 2. Headless Context Execution & Global Exports ───────────────────────────
suite("2. Headless Context Execution & Global Exports");

let ctx;

test("voyage.js evaluates cleanly in isolated context without DOM", () => {
  ctx = createIsolatedContext();
  loadScriptInContext("js/poke/gen3/monde.js", ctx);
  loadScriptInContext(VOYAGE_FILE, ctx);

  assert.ok(ctx.POKE_GEN3_CLES, "POKE_GEN3_CLES must be exported");
  assert.ok(ctx.POKE_GEN3_BADGE_POUR_CS, "POKE_GEN3_BADGE_POUR_CS must be exported");
  assert.ok(ctx.POKE_GEN3_ETAPES, "POKE_GEN3_ETAPES must be exported");
  assert.ok(ctx.POKE_GEN3_ERRANTS, "POKE_GEN3_ERRANTS must be exported");
  assert.ok(typeof ctx.pokeGen3EtapeDe === "function", "pokeGen3EtapeDe function must be exported");
});

// ── 3. Progression Keys & CS/HM Mappings ─────────────────────────────────────
suite("3. Progression Keys & HM Badges (POKE_GEN3_CLES, POKE_GEN3_BADGE_POUR_CS)");

test("All 8 HMs are declared in POKE_GEN3_CLES with canonical sources and bilingual names", () => {
  const cles = ctx.POKE_GEN3_CLES;
  const expectedHMs = [
    { key: "coupe", source: "merouville", fr: "CS01 Coupe", en: "HM01 Cut" },
    { key: "flash", source: "grotte-granite", fr: "CS05 Flash", en: "HM05 Flash" },
    { key: "eclateroc", source: "lavandia", fr: "CS06 Éclate-Roc", en: "HM06 Rock Smash" },
    { key: "force", source: "tunnel-merouvergne", fr: "CS04 Force", en: "HM04 Strength" },
    { key: "surf", source: "clementi-ville", fr: "CS03 Surf", en: "HM03 Surf" },
    { key: "vol", source: "route-120", fr: "CS02 Vol", en: "HM02 Fly" },
    { key: "plongee", source: "algatia", fr: "CS08 Plongée", en: "HM08 Dive" },
    { key: "cascade", source: "atalanopolis", fr: "CS07 Cascade", en: "HM07 Waterfall" },
  ];

  for (const exp of expectedHMs) {
    const entry = cles[exp.key];
    assert.ok(entry, `HM key '${exp.key}' must be defined in POKE_GEN3_CLES`);
    assert.strictEqual(entry.source, exp.source, `HM '${exp.key}' source mismatch`);
    assert.ok(entry.nom && entry.nom.fr && entry.nom.en, `HM '${exp.key}' must have bilingual names`);
    assert.strictEqual(entry.nom.fr, exp.fr, `HM '${exp.key}' French name mismatch`);
    assert.strictEqual(entry.nom.en, exp.en, `HM '${exp.key}' English name mismatch`);
  }
});

test("Story progression keys (lunettes, devonScope, master) are declared in POKE_GEN3_CLES", () => {
  const cles = ctx.POKE_GEN3_CLES;

  assert.ok(cles.lunettes, "Key 'lunettes' must exist for Desert Go-Goggles");
  assert.strictEqual(cles.lunettes.source, "vermilava");
  assert.ok(cles.lunettes.nom && cles.lunettes.nom.fr && cles.lunettes.nom.en);

  assert.ok(cles.devonScope, "Key 'devonScope' must exist for Kecleon reveal");
  assert.strictEqual(cles.devonScope.source, "route-120");
  assert.ok(cles.devonScope.nom && cles.devonScope.nom.fr && cles.devonScope.nom.en);

  assert.ok(cles.master, "Key 'master' must exist for Team Hideout Master Ball");
  assert.strictEqual(cles.master.source, "nenucrique");
  assert.ok(cles.master.nom && cles.master.nom.fr && cles.master.nom.en);
});

test("POKE_GEN3_BADGE_POUR_CS correctly maps badges 1-8 to their canonical HMs", () => {
  const b = ctx.POKE_GEN3_BADGE_POUR_CS;
  assert.ok(b, "POKE_GEN3_BADGE_POUR_CS must be defined");
  assert.strictEqual(b.coupe, 1, "coupe requires badge 1");
  assert.strictEqual(b.flash, 2, "flash requires badge 2");
  assert.strictEqual(b.eclateroc, 3, "eclateroc requires badge 3");
  assert.strictEqual(b.force, 4, "force requires badge 4");
  assert.strictEqual(b.surf, 5, "surf requires badge 5");
  assert.strictEqual(b.vol, 6, "vol requires badge 6");
  assert.strictEqual(b.plongee, 7, "plongee requires badge 7");
  assert.strictEqual(b.cascade, 8, "cascade requires badge 8");
  assert.strictEqual(Object.keys(b).length, 8, "Must have exactly 8 HM badge entries");
});

// ── 4. Itinerary Schema & Step Definitions ──────────────────────────────────
suite("4. Itinerary Schema & Step Definitions (POKE_GEN3_ETAPES)");

test("POKE_GEN3_ETAPES is a valid array of at least 50 steps", () => {
  const etapes = ctx.POKE_GEN3_ETAPES;
  assert.ok(Array.isArray(etapes), "POKE_GEN3_ETAPES must be an array");
  assert.ok(etapes.length >= 50, `POKE_GEN3_ETAPES must have >= 50 steps (got ${etapes.length})`);

  const seenIds = new Set();
  for (const e of etapes) {
    assert.ok(typeof e.id === "string" && e.id.length > 0, "Step id must be a non-empty string");
    assert.ok(!seenIds.has(e.id), `Duplicate step id: ${e.id}`);
    seenIds.add(e.id);

    assert.ok(typeof e.lieu === "string", `Step ${e.id} must have lieu string`);
    assert.ok(ctx.POKE_GEN3_LIEUX[e.lieu], `Step ${e.id} references unknown lieu '${e.lieu}'`);
    assert.ok(typeof e.categorie === "string", `Step ${e.id} must have categorie string`);
  }
});

test("First step is bourg-en-vol with depart: true", () => {
  const first = ctx.POKE_GEN3_ETAPES[0];
  assert.strictEqual(first.id, "bourg-en-vol");
  assert.strictEqual(first.lieu, "littleroot-town");
  assert.strictEqual(first.categorie, "ville");
  assert.strictEqual(first.depart, true);
});

test("All encounter tables in POKE_GEN3_ETAPES match valid zone IDs in monde.js", () => {
  const etapes = ctx.POKE_GEN3_ETAPES;
  const validZoneIds = new Set(ctx.POKE_GEN3_ZONES.map(z => z.id));

  let checkedTables = 0;
  for (const e of etapes) {
    if (e.tables && Array.isArray(e.tables)) {
      for (const t of e.tables) {
        checkedTables++;
        assert.ok(validZoneIds.has(t), `Step '${e.id}' references unknown table '${t}' in POKE_GEN3_ZONES`);
      }
    }
  }
  assert.ok(checkedTables >= 25, `Expected at least 25 table references, got ${checkedTables}`);
});

test("All 8 Gyms exist in POKE_GEN3_ETAPES in order 1 to 8", () => {
  const etapes = ctx.POKE_GEN3_ETAPES;
  const gyms = etapes.filter(e => typeof e.arene === "number");
  assert.strictEqual(gyms.length, 8, "Must contain exactly 8 gyms");

  for (let i = 0; i < 8; i++) {
    assert.strictEqual(gyms[i].arene, i + 1, `Gym ${i+1} arene index mismatch`);
  }
});

test("Pokemon League exists with ligue: true, boss: true and requires 8 badges", () => {
  const etapes = ctx.POKE_GEN3_ETAPES;
  const ligueStep = etapes.find(e => e.ligue);
  assert.ok(ligueStep, "Must have a step with ligue: true");
  assert.strictEqual(ligueStep.id, "eternara-ligue");
  assert.strictEqual(ligueStep.lieu, "ever-grande-city");
  assert.strictEqual(ligueStep.boss, true);
  assert.strictEqual(ligueStep.exigeBadges, 8);
});

test("Helper pokeGen3EtapeDe retrieves steps by ID correctly", () => {
  const fn = ctx.pokeGen3EtapeDe;
  assert.strictEqual(typeof fn, "function");

  const start = fn("bourg-en-vol");
  assert.ok(start && start.depart === true);

  const gym1 = fn("merouville");
  assert.ok(gym1 && gym1.arene === 1);

  const nonExistent = fn("kanto-bourg-palette");
  assert.strictEqual(nonExistent, null);
});

test("Helper pokeGen3Ouverture validates key requirements and badge locks", () => {
  const fn = ctx.pokeGen3Ouverture;
  assert.strictEqual(typeof fn, "function");

  const surfStep = ctx.pokeGen3EtapeDe("route-118");
  assert.ok(surfStep && surfStep.exige && surfStep.exige.includes("surf"));

  // Party without surf key
  const resNoKey = fn(surfStep, { cles: {}, badges: [] });
  assert.strictEqual(resNoKey.ouverte, false);
  assert.strictEqual(resNoKey.manque[0].type, "cle");

  // Party with surf key but only 3 badges (requires badge 5)
  const resLowBadge = fn(surfStep, { cles: { surf: true }, badges: [1, 2, 3] });
  assert.strictEqual(resLowBadge.ouverte, false);
  assert.strictEqual(resLowBadge.manque[0].type, "badgeCS");
  assert.strictEqual(resLowBadge.manque[0].requis, 5);

  // Party with surf key and 5 badges
  const resOpen = fn(surfStep, { cles: { surf: true }, badges: [1, 2, 3, 4, 5] });
  assert.strictEqual(resOpen.ouverte, true);
  assert.strictEqual(resOpen.manque.length, 0);
});

// ── 5. Roguelite 9-Act Construction (actes.js) ───────────────────────────────
suite("5. Roguelite 9-Act Construction (actes.js)");

test("PokeActes.construire() builds exactly 9 progressive acts + epilogue from Gen 3 itinerary", () => {
  const fullCtx = createIsolatedContext();
  loadScriptInContext("js/poke/regles.js", fullCtx);
  loadScriptInContext("js/poke/gen3/monde.js", fullCtx);
  loadScriptInContext("js/poke/gen3/arenes.js", fullCtx);
  loadScriptInContext(VOYAGE_FILE, fullCtx);
  loadScriptInContext("js/poke/actes.js", fullCtx);

  // Wire into POKE_ETAPES / POKE_ARENES for headless construction
  fullCtx.POKE_ETAPES = fullCtx.POKE_GEN3_ETAPES;
  fullCtx.POKE_ARENES = fullCtx.POKE_GEN3_ARENES;
  fullCtx.POKE_LIEUX = fullCtx.POKE_GEN3_LIEUX;

  const acts = fullCtx.PokeActes.construire();
  assert.ok(Array.isArray(acts), "PokeActes.construire() must return an array");
  assert.strictEqual(acts.length, 9, `Must construct exactly 9 acts (got ${acts.length})`);

  // Verify all 8 gym bosses in acts 1 to 8
  const expectedGymVilles = [
    "rustboro-city",   // Act 1: Roxanne
    "dewford-town",    // Act 2: Brawly
    "mauville-city",   // Act 3: Wattson
    "lavaridge-town",  // Act 4: Flannery
    "petalburg-city",  // Act 5: Norman
    "fortree-city",    // Act 6: Winona
    "mossdeep-city",   // Act 7: Tate & Liza
    "sootopolis-city", // Act 8: Juan
  ];

  for (let i = 0; i < 8; i++) {
    const act = acts[i];
    assert.strictEqual(act.n, i + 1, `Act ${i+1} number mismatch`);
    assert.strictEqual(act.boss, i + 1, `Act ${i+1} boss gym mismatch`);
    assert.strictEqual(act.ville, expectedGymVilles[i], `Act ${i+1} ville mismatch: expected ${expectedGymVilles[i]}, got ${act.ville}`);
  }

  // Verify Act 9 is the League
  const act9 = acts[8];
  assert.strictEqual(act9.n, 9);
  assert.strictEqual(act9.ligue, true);
  assert.strictEqual(act9.ville, "ever-grande-city");

  // Verify epilogue is attached to act 9
  assert.ok(act9.epilogue, "Act 9 must have epilogue attached");
  assert.ok(act9.epilogue.finals.length >= 1, "Epilogue must include final boss");
  assert.ok(act9.epilogue.legendaires.length >= 6, "Epilogue must include post-game legendaries");
});

// ── 6. Complete Legendary & Mythical Pokémon Access ──────────────────────────
suite("6. Complete Legendary & Mythical Access (100% Reachable)");

test("All 8 Hoenn static legendaries & mythicals are on reachable nodes in POKE_GEN3_ETAPES", () => {
  const etapes = ctx.POKE_GEN3_ETAPES;

  const expectedLegendaries = [
    { n: 384, stepId: "pilier-celeste", lieu: "sky-pillar", niveau: 70 },       // Rayquaza
    { n: 383, stepId: "grotte-terra", lieu: "terra-cave", niveau: 70 },          // Groudon
    { n: 382, stepId: "grotte-marine", lieu: "marine-cave", niveau: 70 },        // Kyogre
    { n: 377, stepId: "ruines-desert", lieu: "desert-ruins", niveau: 40 },       // Regirock
    { n: 378, stepId: "grotte-ilot", lieu: "island-cave", niveau: 40 },          // Regice
    { n: 379, stepId: "tombeau-antique", lieu: "ancient-tomb", niveau: 40 },     // Registeel
    { n: 385, stepId: "algatia", lieu: "mossdeep-city" },                        // Jirachi
    { n: 386, stepId: "ile-aurore", lieu: "birth-island", niveau: 30 },          // Deoxys
  ];

  for (const exp of expectedLegendaries) {
    const step = etapes.find(e => e.id === exp.stepId);
    assert.ok(step, `Step '${exp.stepId}' for legendary #${exp.n} must exist`);
    assert.strictEqual(step.legendaire, exp.n, `Step '${exp.stepId}' must have legendaire #${exp.n}`);
    assert.strictEqual(step.lieu, exp.lieu, `Step '${exp.stepId}' lieu mismatch`);
    if (exp.niveau) {
      assert.strictEqual(step.niveauLegendaire, exp.niveau, `Step '${exp.stepId}' level mismatch`);
    }
  }
});

test("Sealed Chamber (chambre-scellee) unlocks the three Regis", () => {
  const step = ctx.pokeGen3EtapeDe("chambre-scellee");
  assert.ok(step, "Step 'chambre-scellee' must exist");
  assert.strictEqual(step.lieu, "sealed-chamber");
  assert.strictEqual(step.apresLigue, true);
});

// ── 7. Epilogue Boss Steven Stone & Roamers ──────────────────────────────────
suite("7. Epilogue Boss Steven Stone & Roaming Duo (Latios & Latias)");

test("Steven Stone is declared as dresseurFinal on site-meteore-profondeurs", () => {
  const step = ctx.pokeGen3EtapeDe("site-meteore-profondeurs");
  assert.ok(step, "Step 'site-meteore-profondeurs' must exist");
  assert.strictEqual(step.lieu, "meteor-falls");
  assert.strictEqual(step.apresLigue, true);
  assert.strictEqual(step.dresseurFinal, true, "site-meteore-profondeurs must have dresseurFinal: true");
  assert.ok(step.tables && step.tables.includes("METEOR_FALLS_B1F"));
});

test("Roaming duo Latios (#381) and Latias (#380) are declared in POKE_GEN3_ERRANTS", () => {
  const errants = ctx.POKE_GEN3_ERRANTS;
  assert.ok(errants, "POKE_GEN3_ERRANTS must be defined");

  // Verify species list contains 380 and 381
  const listSpecies = Array.isArray(errants)
    ? errants
    : (errants.liste ? errants.liste.map(x => x.n) : errants.especes);

  assert.ok(listSpecies.includes(380), "Latias (380) must be in roaming pool");
  assert.ok(listSpecies.includes(381), "Latios (381) must be in roaming pool");

  // Verify post-league release trigger
  assert.ok(errants.apresLigue === true || errants.depuis === "eternara-ligue");

  // Verify league node marks roamer release
  const ligueStep = ctx.pokeGen3EtapeDe("eternara-ligue");
  assert.strictEqual(ligueStep.libereErrants, true, "eternara-ligue must trigger libereErrants: true");
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
