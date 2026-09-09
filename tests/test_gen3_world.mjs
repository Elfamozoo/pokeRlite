/**
 * tests/test_gen3_world.mjs
 * Unit test suite for Gen 3 NOYAU World & Obtaining Modules.
 *
 * Verifies:
 * 1. Isolated headless execution (Node.js context, zero window/document).
 * 2. Static analysis: strict mode ('use strict'), zero DOM references, zero non-deterministic calls.
 * 3. js/poke/gen3/monde.js:
 *    - Exports W.POKE_GEN3_LIEUX: all Hoenn routes 101-134, towns/cities, and dungeons with { fr, en } names.
 *    - Exports W.POKE_GEN3_ZONES: array of zones with { id, lieu, taux, herbe, eau } matching Emerald canon.
 *    - Exports W.POKE_GEN3_PECHE: fishing tables with canne, bonne, mega (groupes + parCarte).
 * 4. js/poke/gen3/obtentions.js:
 *    - Exports W.POKE_GEN3_FOSSILES: Claw (Anorith 347) and Root (Lileep 345).
 *    - Exports W.POKE_GEN3_CASINO: Mauville Game Corner prizes (Abra, Surskit, Mawile, Porygon, plushies, TMs).
 *    - Exports W.POKE_GEN3_CADEAUX: Castform 351, Wynaut 360, Beldum 374.
 *    - Exports W.POKE_GEN3_ECHANGES: in-game trades (Slakoth->Makuhita, Skitty->Corsola, Pikachu->Skitty, Plusle->Minun).
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

// ── 1. File Existence & Static Constraints ──────────────────────────────────
suite("1. File Existence & Strict NOYAU Constraints");

const REQUIRED_FILES = [
  "js/poke/gen3/monde.js",
  "js/poke/gen3/obtentions.js",
];

test("All 2 Gen 3 world and obtaining files exist on disk", () => {
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  }
});

test("Strict mode ('use strict') is enforced in both files", () => {
  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.ok(
      content.includes('"use strict"') || content.includes("'use strict'"),
      `File ${relPath} must enforce 'use strict'`
    );
  }
});

test("Zero non-deterministic calls (Math.random, Date.now, new Date, performance.now)", () => {
  const forbiddenPatterns = [
    /\bMath\.random\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bperformance\.now\s*\(/,
  ];

  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const rawContent = fs.readFileSync(fullPath, "utf-8");
    const cleanContent = stripComments(rawContent);

    for (const pat of forbiddenPatterns) {
      assert.ok(
        !pat.test(cleanContent),
        `File ${relPath} contains non-deterministic call matching ${pat}`
      );
    }
  }
});

test("Zero DOM leaks or browser globals (document, localStorage, sessionStorage)", () => {
  const forbiddenGlobals = [
    /\bdocument\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bwindow\.[a-zA-Z]/,
  ];

  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const rawContent = fs.readFileSync(fullPath, "utf-8");
    const cleanContent = stripComments(rawContent)
      .replace(/typeof\s+window\s*!==?\s*["']undefined["']\s*\?\s*window\s*:\s*globalThis/g, "");

    for (const pat of forbiddenGlobals) {
      assert.ok(
        !pat.test(cleanContent),
        `File ${relPath} contains browser/DOM global leak matching ${pat}`
      );
    }
  }
});

// ── 2. Headless Context Execution & Global Exports ───────────────────────────
suite("2. Headless Context Execution & Global Exports");

let ctx;

test("Both files evaluate cleanly in isolated context without DOM", () => {
  ctx = createIsolatedContext();

  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const code = fs.readFileSync(fullPath, "utf-8");
    vm.runInContext(code, ctx, { filename: relPath });
  }

  assert.ok(ctx.POKE_GEN3_LIEUX, "POKE_GEN3_LIEUX must be exported");
  assert.ok(ctx.POKE_GEN3_ZONES, "POKE_GEN3_ZONES must be exported");
  assert.ok(ctx.POKE_GEN3_PECHE, "POKE_GEN3_PECHE must be exported");
  assert.ok(ctx.POKE_GEN3_FOSSILES, "POKE_GEN3_FOSSILES must be exported");
  assert.ok(ctx.POKE_GEN3_CASINO, "POKE_GEN3_CASINO must be exported");
  assert.ok(ctx.POKE_GEN3_CADEAUX, "POKE_GEN3_CADEAUX must be exported");
  assert.ok(ctx.POKE_GEN3_ECHANGES, "POKE_GEN3_ECHANGES must be exported");
});

// ── 3. Locations Dictionary (W.POKE_GEN3_LIEUX) ──────────────────────────────
suite("3. Locations Dictionary (W.POKE_GEN3_LIEUX)");

test("POKE_GEN3_LIEUX contains all 16 Hoenn towns and cities", () => {
  const towns = [
    "littleroot-town", "oldale-town", "petalburg-city", "rustboro-city",
    "dewford-town", "slateport-city", "mauville-city", "verdanturf-town",
    "fallarbor-town", "lavaridge-town", "fortree-city", "lilycove-city",
    "mossdeep-city", "sootopolis-city", "pacifidlog-town", "ever-grande-city"
  ];

  for (const t of towns) {
    assert.ok(ctx.POKE_GEN3_LIEUX[t], `Town ${t} must exist in POKE_GEN3_LIEUX`);
    assert.ok(ctx.POKE_GEN3_LIEUX[t].fr, `Town ${t} must have a French name`);
    assert.ok(ctx.POKE_GEN3_LIEUX[t].en, `Town ${t} must have an English name`);
  }
});

test("POKE_GEN3_LIEUX contains all routes from 101 to 134", () => {
  for (let r = 101; r <= 134; r++) {
    const key = `route-${r}`;
    assert.ok(ctx.POKE_GEN3_LIEUX[key], `Route ${key} must exist in POKE_GEN3_LIEUX`);
    assert.ok(ctx.POKE_GEN3_LIEUX[key].fr, `Route ${key} must have a French name`);
    assert.ok(ctx.POKE_GEN3_LIEUX[key].en, `Route ${key} must have an English name`);
  }
});

test("POKE_GEN3_LIEUX contains canonical dungeons and landmarks", () => {
  const dungeons = [
    "petalburg-woods", "rusturf-tunnel", "granite-cave", "fiery-path",
    "jagged-pass", "mt-chimney", "meteor-falls", "route-111-desert",
    "weather-institute", "mt-pyre", "magma-hideout", "aqua-hideout",
    "safari-zone", "shoal-cave", "seafloor-cavern", "cave-of-origin",
    "sky-pillar", "victory-road", "sealed-chamber", "desert-ruins",
    "island-cave", "ancient-tomb", "terra-cave", "marine-cave",
    "birth-island", "mossdeep-space-center"
  ];

  for (const d of dungeons) {
    assert.ok(ctx.POKE_GEN3_LIEUX[d], `Dungeon ${d} must exist in POKE_GEN3_LIEUX`);
    assert.ok(ctx.POKE_GEN3_LIEUX[d].fr, `Dungeon ${d} must have a French name`);
    assert.ok(ctx.POKE_GEN3_LIEUX[d].en, `Dungeon ${d} must have an English name`);
  }
});

// ── 4. Encounter Zones (W.POKE_GEN3_ZONES) ───────────────────────────────────
suite("4. Encounter Zones (W.POKE_GEN3_ZONES)");

test("POKE_GEN3_ZONES is a non-empty array with valid zone objects", () => {
  const zones = ctx.POKE_GEN3_ZONES;
  assert.ok(Array.isArray(zones), "POKE_GEN3_ZONES must be an array");
  assert.ok(zones.length >= 30, `POKE_GEN3_ZONES should contain at least 30 zones (got ${zones.length})`);

  const seenIds = new Set();
  for (const z of zones) {
    assert.ok(typeof z.id === "string" && z.id.length > 0, `Zone must have non-empty string id`);
    assert.ok(!seenIds.has(z.id), `Duplicate zone id: ${z.id}`);
    seenIds.add(z.id);

    assert.ok(typeof z.lieu === "string", `Zone ${z.id} must have lieu string`);
    assert.ok(ctx.POKE_GEN3_LIEUX[z.lieu], `Zone ${z.id} references unknown lieu '${z.lieu}'`);
    assert.strictEqual(typeof z.taux, "number", `Zone ${z.id} must have numeric taux`);
    assert.ok(z.taux >= 0, `Zone ${z.id} taux must be non-negative`);
  }
});

test("POKE_GEN3_ZONES encounter slots have valid species (1-386) and positive levels", () => {
  const zones = ctx.POKE_GEN3_ZONES;
  let totalSlots = 0;

  for (const z of zones) {
    // Test grass encounters
    if (z.herbe) {
      assert.ok(Array.isArray(z.herbe.emeraude), `Zone ${z.id} herbe.emeraude must be an array`);
      for (const slot of z.herbe.emeraude) {
        totalSlots++;
        assert.ok(Number.isInteger(slot.n) && slot.n >= 1 && slot.n <= 386,
          `Invalid species #${slot.n} in grass of zone ${z.id}`);
        assert.ok(Number.isInteger(slot.niveau) && slot.niveau >= 1 && slot.niveau <= 100,
          `Invalid level ${slot.niveau} in grass of zone ${z.id}`);
        assert.ok(typeof slot.poids === "number" && slot.poids > 0,
          `Invalid weight ${slot.poids} in grass of zone ${z.id}`);
      }
    }

    // Test water/surf encounters
    if (z.eau) {
      assert.strictEqual(typeof z.eau.taux, "number", `Zone ${z.id} eau.taux must be a number`);
      assert.ok(Array.isArray(z.eau.emeraude), `Zone ${z.id} eau.emeraude must be an array`);
      for (const slot of z.eau.emeraude) {
        totalSlots++;
        assert.ok(Number.isInteger(slot.n) && slot.n >= 1 && slot.n <= 386,
          `Invalid species #${slot.n} in water of zone ${z.id}`);
        assert.ok(Number.isInteger(slot.niveau) && slot.niveau >= 1 && slot.niveau <= 100,
          `Invalid level ${slot.niveau} in water of zone ${z.id}`);
        assert.ok(typeof slot.poids === "number" && slot.poids > 0,
          `Invalid weight ${slot.poids} in water of zone ${z.id}`);
      }
    }
  }

  assert.ok(totalSlots > 100, `Total encounter slots across Hoenn should be > 100 (got ${totalSlots})`);
});

test("POKE_GEN3_ZONES contains canonical Emerald wild species in key locations", () => {
  const zones = ctx.POKE_GEN3_ZONES;
  const findZone = (id) => zones.find(z => z.id === id);

  // Route 101: Zigzagoon 263, Wurmple 265, Poochyena 261
  const r101 = findZone("ROUTE_101");
  assert.ok(r101, "ROUTE_101 zone must exist");
  const r101Species = r101.herbe.emeraude.map(s => s.n);
  assert.ok(r101Species.includes(263), "Route 101 must contain Zigzagoon (263)");
  assert.ok(r101Species.includes(265), "Route 101 must contain Wurmple (265)");
  assert.ok(r101Species.includes(261), "Route 101 must contain Poochyena (261)");

  // Route 102: Ralts 280, Lotad 270, Seedot 273
  const r102 = findZone("ROUTE_102");
  assert.ok(r102, "ROUTE_102 zone must exist");
  const r102Species = r102.herbe.emeraude.map(s => s.n);
  assert.ok(r102Species.includes(280), "Route 102 must contain Ralts (280)");

  // Petalburg Woods: Slakoth 287, Shroomish 285
  const woods = findZone("PETALBURG_WOODS");
  assert.ok(woods, "PETALBURG_WOODS zone must exist");
  const woodsSpecies = woods.herbe.emeraude.map(s => s.n);
  assert.ok(woodsSpecies.includes(287), "Petalburg Woods must contain Slakoth (287)");
  assert.ok(woodsSpecies.includes(285), "Petalburg Woods must contain Shroomish (285)");

  // Rusturf Tunnel: Whismur 293
  const tunnel = findZone("RUSTURF_TUNNEL");
  assert.ok(tunnel, "RUSTURF_TUNNEL zone must exist");
  const tunnelSpecies = tunnel.herbe.emeraude.map(s => s.n);
  assert.ok(tunnelSpecies.includes(293), "Rusturf Tunnel must contain Whismur (293)");

  // Meteor Falls: Bagon 371
  const meteor = zones.find(z => z.lieu === "meteor-falls" && z.herbe && z.herbe.emeraude.some(s => s.n === 371));
  assert.ok(meteor, "Meteor Falls must contain Bagon (371)");

  // Route 111 Desert: Trapinch 328, Baltoy 343, Cacnea 331
  const desert = findZone("ROUTE_111_DESERT") || zones.find(z => z.lieu === "route-111-desert");
  assert.ok(desert, "Desert zone must exist");
  const desertSpecies = desert.herbe.emeraude.map(s => s.n);
  assert.ok(desertSpecies.includes(328), "Desert must contain Trapinch (328)");
  assert.ok(desertSpecies.includes(343), "Desert must contain Baltoy (343)");
});

// ── 5. Fishing Tables (W.POKE_GEN3_PECHE) ────────────────────────────────────
suite("5. Fishing Tables (W.POKE_GEN3_PECHE)");

test("POKE_GEN3_PECHE exports canonical Old, Good, and Super Rod structures", () => {
  const pe = ctx.POKE_GEN3_PECHE;
  assert.ok(pe, "POKE_GEN3_PECHE must be defined");
  assert.ok(Array.isArray(pe.canne), "POKE_GEN3_PECHE.canne must be an array");
  assert.ok(Array.isArray(pe.bonne), "POKE_GEN3_PECHE.bonne must be an array");
  assert.ok(pe.mega && typeof pe.mega === "object", "POKE_GEN3_PECHE.mega must be an object");
  assert.ok(pe.mega.groupes && typeof pe.mega.groupes === "object", "pe.mega.groupes must be an object");
  assert.ok(pe.mega.parCarte && typeof pe.mega.parCarte === "object", "pe.mega.parCarte must be an object");
});

test("POKE_GEN3_PECHE rods contain valid species and levels", () => {
  const pe = ctx.POKE_GEN3_PECHE;

  // Old Rod
  assert.ok(pe.canne.length > 0, "Old Rod table must not be empty");
  for (const fish of pe.canne) {
    assert.ok(fish.n >= 1 && fish.n <= 386, `Invalid species #${fish.n} in Old Rod`);
    assert.ok(fish.niveau >= 1 && fish.niveau <= 100, `Invalid level ${fish.niveau} in Old Rod`);
  }

  // Good Rod
  assert.ok(pe.bonne.length > 0, "Good Rod table must not be empty");
  for (const fish of pe.bonne) {
    assert.ok(fish.n >= 1 && fish.n <= 386, `Invalid species #${fish.n} in Good Rod`);
    assert.ok(fish.niveau >= 1 && fish.niveau <= 100, `Invalid level ${fish.niveau} in Good Rod`);
  }

  // Super Rod groups
  for (const [groupName, list] of Object.entries(pe.mega.groupes)) {
    assert.ok(Array.isArray(list) && list.length > 0, `Group ${groupName} must be a non-empty array`);
    for (const fish of list) {
      assert.ok(fish.n >= 1 && fish.n <= 386, `Invalid species #${fish.n} in Super Rod group ${groupName}`);
      assert.ok(fish.niveau >= 1 && fish.niveau <= 100, `Invalid level ${fish.niveau} in Super Rod group ${groupName}`);
    }
  }

  // Super Rod parCarte mappings
  for (const [mapName, groupName] of Object.entries(pe.mega.parCarte)) {
    assert.ok(pe.mega.groupes[groupName], `Map ${mapName} maps to unknown group '${groupName}'`);
  }

  // Key fishing species verification
  const allFishSpecies = new Set([
    ...pe.canne.map(f => f.n),
    ...pe.bonne.map(f => f.n),
    ...Object.values(pe.mega.groupes).flatMap(list => list.map(f => f.n)),
  ]);

  assert.ok(allFishSpecies.has(129), "Fishing must contain Magikarp (129)");
  assert.ok(allFishSpecies.has(320), "Fishing must contain Wailmer (320)");
  assert.ok(allFishSpecies.has(319), "Fishing must contain Sharpedo (319)");
  assert.ok(allFishSpecies.has(339), "Fishing must contain Barboach (339)");
  assert.ok(allFishSpecies.has(341), "Fishing must contain Corphish (341)");
  assert.ok(allFishSpecies.has(349), "Fishing must contain Feebas (349)");
});

// ── 6. Obtaining Methods (obtentions.js) ─────────────────────────────────────
suite("6. Obtaining Methods (obtentions.js)");

test("POKE_GEN3_FOSSILES defines Claw (Anorith 347) and Root (Lileep 345) fossils at level 20", () => {
  const fossiles = ctx.POKE_GEN3_FOSSILES;
  assert.ok(fossiles, "POKE_GEN3_FOSSILES must be defined");

  assert.ok(fossiles.griffe, "POKE_GEN3_FOSSILES.griffe must exist");
  assert.strictEqual(fossiles.griffe.n, 347, "Claw fossil must produce Anorith (#347)");
  assert.strictEqual(fossiles.griffe.niveau, 20, "Anorith must be revived at level 20");

  assert.ok(fossiles.racine, "POKE_GEN3_FOSSILES.racine must exist");
  assert.strictEqual(fossiles.racine.n, 345, "Root fossil must produce Lileep (#345)");
  assert.strictEqual(fossiles.racine.niveau, 20, "Lileep must be revived at level 20");
});

test("POKE_GEN3_CASINO defines Mauville Game Corner prizes (Pokémon, plushies, TMs)", () => {
  const casino = ctx.POKE_GEN3_CASINO;
  assert.ok(casino, "POKE_GEN3_CASINO must be defined");

  const pokemonList = casino.emeraude || casino.pokemon || [];
  assert.ok(Array.isArray(pokemonList) && pokemonList.length >= 3, "Casino must offer at least 3 Pokémon prizes");

  const prizeSpecies = pokemonList.map(p => p.n);
  assert.ok(prizeSpecies.includes(63), "Casino must offer Abra (#63)");
  assert.ok(prizeSpecies.includes(283), "Casino must offer Surskit (#283)");
  assert.ok(prizeSpecies.includes(303) || prizeSpecies.includes(137), "Casino must offer Mawile (#303) or Porygon (#137)");

  for (const p of pokemonList) {
    assert.ok(p.n >= 1 && p.n <= 386, `Invalid Pokémon #${p.n} in Casino`);
    assert.ok(p.jetons > 0, `Coins price must be positive for #${p.n}`);
    assert.ok(p.niveau >= 1, `Level must be positive for #${p.n}`);
  }
});

test("POKE_GEN3_CADEAUX defines Castform 351, Wynaut 360, and Beldum 374", () => {
  const cadeaux = ctx.POKE_GEN3_CADEAUX;
  assert.ok(Array.isArray(cadeaux), "POKE_GEN3_CADEAUX must be an array");
  assert.ok(cadeaux.length >= 3, "POKE_GEN3_CADEAUX must have at least 3 gifts");

  const castform = cadeaux.find(c => c.n === 351);
  assert.ok(castform, "Castform (#351) gift must exist");
  assert.ok(castform.lieu.includes("weather") || (castform.etape && castform.etape.includes("weather")),
    "Castform must be gifted at Weather Institute");

  const wynaut = cadeaux.find(c => c.n === 360);
  assert.ok(wynaut, "Wynaut (#360) gift must exist");
  assert.ok(wynaut.lieu.includes("lavaridge") || (wynaut.etape && wynaut.etape.includes("lavaridge")),
    "Wynaut egg must be gifted at Lavaridge");

  const beldum = cadeaux.find(c => c.n === 374);
  assert.ok(beldum, "Beldum (#374) gift must exist");
  assert.ok(beldum.lieu.includes("mossdeep") || (beldum.etape && beldum.etape.includes("mossdeep")),
    "Beldum must be gifted at Mossdeep City");
});

test("POKE_GEN3_ECHANGES defines canonical in-game trades", () => {
  const echanges = ctx.POKE_GEN3_ECHANGES;
  assert.ok(Array.isArray(echanges), "POKE_GEN3_ECHANGES must be an array");
  assert.ok(echanges.length >= 3, "POKE_GEN3_ECHANGES must have at least 3 trades");

  for (const t of echanges) {
    assert.ok(t.donne >= 1 && t.donne <= 386, `Invalid given species #${t.donne}`);
    assert.ok(t.recoit >= 1 && t.recoit <= 386, `Invalid received species #${t.recoit}`);
    assert.ok(typeof t.surnom === "string" && t.surnom.length > 0, `Trade must have nickname`);
    assert.ok(t.etape || t.lieu, `Trade must specify location`);
  }

  // Rustboro: Slakoth (287) -> Makuhita (296)
  const makuhitaTrade = echanges.find(t => t.donne === 287 && t.recoit === 296);
  assert.ok(makuhitaTrade, "Must include trade: Slakoth (#287) for Makuhita (#296)");

  // Fortree: Skitty (300) -> Corsola (222) or Plusle/Minun
  const fortreeTrade = echanges.find(t => (t.donne === 300 && t.recoit === 222) || (t.donne === 313 && t.recoit === 311));
  assert.ok(fortreeTrade, "Must include Fortree trade (Skitty->Corsola or Volbeat->Plusle)");

  // Pacifidlog / other trades
  const pacifidlogTrade = echanges.find(t => (t.donne === 25 && t.recoit === 300) || (t.donne === 311 && t.recoit === 312));
  assert.ok(pacifidlogTrade, "Must include Pacifidlog trade (Pikachu->Skitty or Plusle->Minun)");
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "-".repeat(60));
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error("\x1b[31mSOME TESTS FAILED!\x1b[0m");
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
  process.exit(0);
}
