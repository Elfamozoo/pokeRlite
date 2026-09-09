/**
 * tests/test_gen3_trainers.mjs
 * Unit test suite for Gen 3 NOYAU Trainer & Gym Modules.
 *
 * Verifies:
 * 1. Isolated headless execution (Node.js context, zero window/document).
 * 2. Static analysis: strict mode ('use strict'), zero DOM references, zero non-deterministic calls.
 * 3. js/poke/gen3/classes.js:
 *    - Exports W.POKE_GEN3_CLASSES.
 *    - Includes canonical Emerald classes: rich_boy, lady, triathlete, aroma_lady, pokemon_ranger,
 *      collector, ninja_boy, parasol_lady, sailor, fisherman, hiker, youngster, lass,
 *      swimmer_m, swimmer_f, team_aqua, team_magma, leader, elite_four, champion, expert.
 *    - Valid { fr, en } names and prize money multipliers.
 * 4. js/poke/gen3/dresseurs.js:
 *    - Exports W.POKE_GEN3_DRESSEURS (pool of route trainers with unique ID, class, localized name, quotes, team key).
 * 5. js/poke/gen3/equipes.js:
 *    - Exports W.POKE_GEN3_EQUIPES (rosters of Pokémon with species number, level, and moves).
 *    - Level spread across route acts (calibrated across levels 3 to 50).
 * 6. js/poke/gen3/arenes.js:
 *    - Exports W.POKE_GEN3_ARENES (8 canonical Emerald Gym Leaders).
 *    - Exports W.POKE_GEN3_CONSEIL (4 Elite Four members: Sidney, Phoebe, Glacia, Drake).
 *    - Exports W.POKE_GEN3_MAITRE (Champion Wallace / Marc with 6 Pokémon).
 *    - Exports W.POKE_GEN3_STEVEN (Epilogue Boss Steven Stone / Pierre Rochard with 6 Pokémon lv 75-78).
 * 7. js/poke/gen3/rival.js:
 *    - Exports W.POKE_GEN3_RIVAL with 3 starter variants for May/Brendan (Arcko 252, Poussifeu 255, Gobou 258).
 *    - Exports W.POKE_GEN3_TIMMY (Wally) for Victory Road with Gardevoir 282, Altaria 334, Delcatty 301, Roselia 315, Magneton 82.
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

const TRAINER_FILES = [
  "js/poke/gen3/classes.js",
  "js/poke/gen3/dresseurs.js",
  "js/poke/gen3/equipes.js",
  "js/poke/gen3/arenes.js",
  "js/poke/gen3/rival.js",
];

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: File Existence & Strict NOYAU Constraints
// ─────────────────────────────────────────────────────────────────────────────
suite("1. File Existence & Strict NOYAU Constraints");

test("All 5 Gen 3 trainer and gym files exist on disk", () => {
  for (const relPath of TRAINER_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  }
});

test("Strict mode ('use strict') is enforced in all 5 files", () => {
  for (const relPath of TRAINER_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.ok(
      content.includes('"use strict"') || content.includes("'use strict'"),
      `File ${relPath} must enforce 'use strict'`
    );
  }
});

test("Zero non-deterministic calls (Math.random, Date.now, new Date, performance.now)", () => {
  const nonDetRegex = /\b(Math\.random|Date\.now|new\s+Date|performance\.now)\b/;
  for (const relPath of TRAINER_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = stripComments(fs.readFileSync(fullPath, "utf-8"));
    const match = content.match(nonDetRegex);
    assert.ok(
      !match,
      `File ${relPath} contains non-deterministic call: ${match ? match[0] : ""}`
    );
  }
});

test("Zero DOM leaks or browser globals (document, localStorage, sessionStorage, window.)", () => {
  const domRegex = /\b(document|localStorage|sessionStorage|navigator|location)\b/;
  for (const relPath of TRAINER_FILES) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const content = stripComments(fs.readFileSync(fullPath, "utf-8"));
    const match = content.match(domRegex);
    assert.ok(
      !match,
      `File ${relPath} contains prohibited DOM/browser global: ${match ? match[0] : ""}`
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Headless Context Execution & Global Exports
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Headless Context Execution & Global Exports");

let ctx;
test("All 5 files evaluate cleanly in isolated context without DOM", () => {
  ctx = createIsolatedContext();
  for (const relPath of TRAINER_FILES) {
    loadScriptInContext(relPath, ctx);
  }
  assert.ok(ctx.POKE_GEN3_CLASSES, "POKE_GEN3_CLASSES must be exported");
  assert.ok(ctx.POKE_GEN3_DRESSEURS, "POKE_GEN3_DRESSEURS must be exported");
  assert.ok(ctx.POKE_GEN3_EQUIPES, "POKE_GEN3_EQUIPES must be exported");
  assert.ok(ctx.POKE_GEN3_ARENES, "POKE_GEN3_ARENES must be exported");
  assert.ok(ctx.POKE_GEN3_CONSEIL, "POKE_GEN3_CONSEIL must be exported");
  assert.ok(ctx.POKE_GEN3_MAITRE, "POKE_GEN3_MAITRE must be exported");
  assert.ok(ctx.POKE_GEN3_STEVEN, "POKE_GEN3_STEVEN must be exported");
  assert.ok(ctx.POKE_GEN3_RIVAL, "POKE_GEN3_RIVAL must be exported");
  assert.ok(ctx.POKE_GEN3_TIMMY, "POKE_GEN3_TIMMY must be exported");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Trainer Classes Integrity (classes.js)
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Trainer Classes Integrity (classes.js)");

test("Canonical Emerald classes are present in POKE_GEN3_CLASSES", () => {
  const classes = ctx.POKE_GEN3_CLASSES;
  const canonicalList = [
    "rich_boy", "lady", "triathlete", "aroma_lady", "pokemon_ranger",
    "collector", "ninja_boy", "parasol_lady", "sailor", "fisherman",
    "hiker", "youngster", "lass", "swimmer_m", "swimmer_f",
    "team_aqua", "team_magma", "leader", "elite_four", "champion", "expert"
  ];

  for (const cls of canonicalList) {
    assert.ok(
      classes[cls] || classes[cls.replace(/_([a-z])/g, (_, l) => l.toUpperCase())],
      `Canonical class missing: ${cls}`
    );
  }
});

test("Class definitions include valid localized names, multipliers and route flags", () => {
  const classes = ctx.POKE_GEN3_CLASSES;
  const canonicalList = [
    "rich_boy", "lady", "triathlete", "aroma_lady", "pokemon_ranger",
    "collector", "ninja_boy", "parasol_lady", "sailor", "fisherman",
    "hiker", "youngster", "lass", "swimmer_m", "swimmer_f",
    "team_aqua", "team_magma", "leader", "elite_four", "champion", "expert"
  ];

  for (const cls of canonicalList) {
    const def = classes[cls];
    assert.ok(def, `Definition must exist for ${cls}`);
    assert.ok(def.fr && typeof def.fr === "string", `Class ${cls} must have French name`);
    assert.ok(def.en && typeof def.en === "string", `Class ${cls} must have English name`);
    assert.ok(typeof def.mult === "number" && def.mult > 0, `Class ${cls} must have positive multiplier`);
    assert.strictEqual(typeof def.route, "boolean", `Class ${cls} must specify boolean route flag`);
  }

  // Check route flag correctness
  assert.strictEqual(classes.youngster.route, true, "Youngster must be a route class");
  assert.strictEqual(classes.leader.route, false, "Leader must not be a route class");
  assert.strictEqual(classes.elite_four.route, false, "Elite Four must not be a route class");
  assert.strictEqual(classes.champion.route, false, "Champion must not be a route class");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Route Trainers Pool (dresseurs.js)
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Route Trainers Pool (dresseurs.js)");

test("POKE_GEN3_DRESSEURS contains valid trainer definitions with unique IDs", () => {
  const trainers = ctx.POKE_GEN3_DRESSEURS;
  assert.ok(Array.isArray(trainers), "POKE_GEN3_DRESSEURS must be an array");
  assert.ok(trainers.length >= 20, `POKE_GEN3_DRESSEURS should contain at least 20 trainers, found ${trainers.length}`);

  const seenIds = new Set();
  for (const t of trainers) {
    assert.ok(t.id && typeof t.id === "string", "Trainer must have an id string");
    assert.ok(!seenIds.has(t.id), `Duplicate trainer id: ${t.id}`);
    seenIds.add(t.id);

    assert.ok(t.classe && typeof t.classe === "string", `Trainer ${t.id} must have a class`);
    assert.ok(
      ctx.POKE_GEN3_CLASSES[t.classe],
      `Trainer ${t.id} has unknown class: ${t.classe}`
    );

    assert.ok(t.nom && typeof t.nom === "object", `Trainer ${t.id} must have localized name`);
    assert.ok(t.nom.fr && t.nom.en, `Trainer ${t.id} localized name must have fr and en`);

    // Must have quotes / citations
    const quotes = t.quotes || t.citations || t.replique;
    assert.ok(quotes, `Trainer ${t.id} must have dialogue quotes`);

    // Must have team reference
    assert.ok(t.equipeKey || t.equipe, `Trainer ${t.id} must specify a team key or roster`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Route Trainer Rosters (equipes.js)
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Route Trainer Rosters (equipes.js)");

test("POKE_GEN3_EQUIPES maps classes to non-empty arrays of teams", () => {
  const equipes = ctx.POKE_GEN3_EQUIPES;
  assert.ok(equipes && typeof equipes === "object", "POKE_GEN3_EQUIPES must be an object");

  const requiredClasses = ["youngster", "lass", "hiker", "sailor", "fisherman", "rich_boy", "aroma_lady", "triathlete"];
  for (const cls of requiredClasses) {
    const teams = equipes[cls];
    assert.ok(Array.isArray(teams) && teams.length > 0, `Teams for class ${cls} must be non-empty array`);
  }
});

test("Every Pokémon in POKE_GEN3_EQUIPES has valid species (1-386), level, and moves", () => {
  const equipes = ctx.POKE_GEN3_EQUIPES;
  let minLevel = Infinity;
  let maxLevel = -Infinity;
  let count = 0;

  for (const [cls, teams] of Object.entries(equipes)) {
    if (!Array.isArray(teams)) continue;
    for (const team of teams) {
      assert.ok(Array.isArray(team) && team.length >= 1 && team.length <= 6, `Team in ${cls} must have 1-6 Pokémon`);
      for (const poke of team) {
        count++;
        assert.ok(Number.isInteger(poke.n) && poke.n >= 1 && poke.n <= 386, `Invalid species ${poke.n} in ${cls}`);
        assert.ok(Number.isInteger(poke.niveau) && poke.niveau >= 2 && poke.niveau <= 100, `Invalid level ${poke.niveau} in ${cls}`);
        minLevel = Math.min(minLevel, poke.niveau);
        maxLevel = Math.max(maxLevel, poke.niveau);

        if (poke.attaques) {
          assert.ok(Array.isArray(poke.attaques), `Attaques in ${cls} must be an array`);
          assert.ok(poke.attaques.length >= 1 && poke.attaques.length <= 4, `Attaques length in ${cls} must be 1-4`);
          for (const atk of poke.attaques) {
            assert.strictEqual(typeof atk, "string", `Move identifier in ${cls} must be string`);
          }
        }
      }
    }
  }

  assert.ok(count >= 50, `Expected at least 50 roster entries across all teams, found ${count}`);
  assert.ok(minLevel <= 6, `Lowest trainer level should be <= 6, found ${minLevel}`);
  assert.ok(maxLevel >= 45, `Highest trainer level should be >= 45, found ${maxLevel}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6: Gym Leaders, Elite Four, Wallace & Steven (arenes.js)
// ─────────────────────────────────────────────────────────────────────────────
suite("6. Gym Leaders, Elite Four, Wallace & Steven (arenes.js)");

test("Exactly 8 Gym Leaders exist in POKE_GEN3_ARENES with canonical Emerald rosters", () => {
  const arenes = ctx.POKE_GEN3_ARENES;
  assert.ok(Array.isArray(arenes), "POKE_GEN3_ARENES must be an array");
  assert.strictEqual(arenes.length, 8, "POKE_GEN3_ARENES must contain exactly 8 Gym Leaders");

  const expectedGyms = [
    {
      ordre: 1,
      champion: "Roxanne",
      championEn: "Roxanne",
      badge: "Roche",
      type: "Roche",
      roster: [{ n: 74, niveau: 12 }, { n: 74, niveau: 12 }, { n: 299, niveau: 15 }]
    },
    {
      ordre: 2,
      champion: "Brawly",
      championEn: "Brawly",
      badge: "Poing",
      type: "Combat",
      roster: [{ n: 66, niveau: 16 }, { n: 307, niveau: 16 }, { n: 296, niveau: 19 }]
    },
    {
      ordre: 3,
      champion: "Wattson",
      championEn: "Wattson",
      badge: "Dynamo",
      type: "Électrik",
      roster: [{ n: 100, niveau: 20 }, { n: 309, niveau: 20 }, { n: 82, niveau: 22 }, { n: 310, niveau: 24 }]
    },
    {
      ordre: 4,
      champion: "Flannery",
      championEn: "Flannery",
      badge: "Chaleur",
      type: "Feu",
      roster: [{ n: 322, niveau: 24 }, { n: 218, niveau: 24 }, { n: 323, niveau: 26 }, { n: 324, niveau: 29 }]
    },
    {
      ordre: 5,
      champion: "Norman",
      championEn: "Norman",
      badge: "Balancier",
      type: "Normal",
      roster: [{ n: 327, niveau: 27 }, { n: 288, niveau: 27 }, { n: 264, niveau: 29 }, { n: 289, niveau: 31 }]
    },
    {
      ordre: 6,
      champion: "Winona",
      championEn: "Winona",
      badge: "Plume",
      type: "Vol",
      roster: [{ n: 333, niveau: 29 }, { n: 357, niveau: 29 }, { n: 279, niveau: 30 }, { n: 227, niveau: 31 }, { n: 334, niveau: 33 }]
    },
    {
      ordre: 7,
      champion: "Tate & Liza",
      championEn: "Tate & Liza",
      badge: "Esprit",
      type: "Psy",
      roster: [{ n: 344, niveau: 41 }, { n: 178, niveau: 41 }, { n: 337, niveau: 42 }, { n: 338, niveau: 42 }]
    },
    {
      ordre: 8,
      champion: "Juan",
      championEn: "Juan",
      badge: "Pluie",
      type: "Eau",
      roster: [{ n: 370, niveau: 41 }, { n: 340, niveau: 41 }, { n: 364, niveau: 43 }, { n: 342, niveau: 43 }, { n: 230, niveau: 46 }]
    }
  ];

  for (let i = 0; i < 8; i++) {
    const gym = arenes[i];
    const exp = expectedGyms[i];
    assert.strictEqual(gym.ordre, exp.ordre, `Gym ${i+1} ordre mismatch`);
    assert.ok(
      gym.champion.includes(exp.champion) || exp.champion.includes(gym.champion),
      `Gym ${i+1} champion mismatch: expected ${exp.champion}, got ${gym.champion}`
    );
    assert.strictEqual(gym.type, exp.type, `Gym ${i+1} type mismatch`);
    assert.ok(gym.nom && gym.nom.fr && gym.nom.en, `Gym ${i+1} must have localized name`);
    assert.ok(gym.ct, `Gym ${i+1} must specify CT`);

    // Verify roster
    assert.strictEqual(gym.equipe.length, exp.roster.length, `Gym ${i+1} roster length mismatch`);
    for (let p = 0; p < gym.equipe.length; p++) {
      assert.strictEqual(gym.equipe[p].n, exp.roster[p].n, `Gym ${i+1} poke ${p} species mismatch`);
      assert.strictEqual(gym.equipe[p].niveau, exp.roster[p].niveau, `Gym ${i+1} poke ${p} level mismatch`);
      assert.ok(
        Array.isArray(gym.equipe[p].attaques) && gym.equipe[p].attaques.length >= 1,
        `Gym ${i+1} poke ${p} must have attacks`
      );
    }
  }
});

test("Exactly 4 Elite Four members exist in POKE_GEN3_CONSEIL with canonical Emerald rosters", () => {
  const conseil = ctx.POKE_GEN3_CONSEIL;
  assert.ok(Array.isArray(conseil), "POKE_GEN3_CONSEIL must be an array");
  assert.strictEqual(conseil.length, 4, "POKE_GEN3_CONSEIL must contain exactly 4 members");

  const expectedConseil = [
    {
      ordre: 1,
      nomEn: "Sidney",
      roster: [{ n: 262, niveau: 46 }, { n: 275, niveau: 48 }, { n: 332, niveau: 46 }, { n: 342, niveau: 48 }, { n: 359, niveau: 49 }]
    },
    {
      ordre: 2,
      nomEn: "Phoebe",
      roster: [{ n: 356, niveau: 48 }, { n: 354, niveau: 49 }, { n: 302, niveau: 50 }, { n: 354, niveau: 49 }, { n: 356, niveau: 51 }]
    },
    {
      ordre: 3,
      nomEn: "Glacia",
      roster: [{ n: 362, niveau: 50 }, { n: 364, niveau: 50 }, { n: 362, niveau: 52 }, { n: 364, niveau: 52 }, { n: 365, niveau: 53 }]
    },
    {
      ordre: 4,
      nomEn: "Drake",
      roster: [{ n: 372, niveau: 52 }, { n: 334, niveau: 54 }, { n: 230, niveau: 53 }, { n: 330, niveau: 53 }, { n: 373, niveau: 55 }]
    }
  ];

  for (let i = 0; i < 4; i++) {
    const member = conseil[i];
    const exp = expectedConseil[i];
    assert.strictEqual(member.ordre, exp.ordre, `Elite ${i+1} ordre mismatch`);
    assert.ok(
      member.nomEn === exp.nomEn || (member.nom && member.nom.en === exp.nomEn),
      `Elite ${i+1} name mismatch: expected ${exp.nomEn}`
    );
    assert.strictEqual(member.equipe.length, exp.roster.length, `Elite ${i+1} team size mismatch`);
    for (let p = 0; p < member.equipe.length; p++) {
      assert.strictEqual(member.equipe[p].n, exp.roster[p].n, `Elite ${i+1} poke ${p} species mismatch`);
      assert.strictEqual(member.equipe[p].niveau, exp.roster[p].niveau, `Elite ${i+1} poke ${p} level mismatch`);
      assert.ok(Array.isArray(member.equipe[p].attaques) && member.equipe[p].attaques.length >= 1);
    }
  }
});

test("Champion Wallace (Marc) exists in POKE_GEN3_MAITRE with 6 Pokémon", () => {
  const maitre = ctx.POKE_GEN3_MAITRE;
  assert.ok(maitre, "POKE_GEN3_MAITRE must be defined");
  const nameEn = maitre.nomEn || (maitre.nom && maitre.nom.en);
  assert.strictEqual(nameEn, "Wallace", "Champion English name must be Wallace");
  assert.strictEqual(maitre.equipe.length, 6, "Champion must have exactly 6 Pokémon");

  const expectedRoster = [
    { n: 321, niveau: 57 }, // Wailord
    { n: 73, niveau: 55 },  // Tentacruel
    { n: 272, niveau: 56 }, // Ludicolo
    { n: 340, niveau: 56 }, // Whiscash
    { n: 130, niveau: 56 }, // Gyarados
    { n: 350, niveau: 58 }, // Milotic
  ];

  for (let p = 0; p < 6; p++) {
    assert.strictEqual(maitre.equipe[p].n, expectedRoster[p].n, `Wallace poke ${p} species mismatch`);
    assert.strictEqual(maitre.equipe[p].niveau, expectedRoster[p].niveau, `Wallace poke ${p} level mismatch`);
    assert.ok(Array.isArray(maitre.equipe[p].attaques) && maitre.equipe[p].attaques.length >= 1);
  }
});

test("Epilogue Boss Steven Stone exists in POKE_GEN3_STEVEN with 6 Pokémon at lv 75-78", () => {
  const steven = ctx.POKE_GEN3_STEVEN;
  assert.ok(steven, "POKE_GEN3_STEVEN must be defined");
  const nameEn = steven.nomEn || (steven.nom && steven.nom.en);
  assert.strictEqual(nameEn, "Steven", "Steven Stone English name must be Steven");
  assert.strictEqual(steven.equipe.length, 6, "Steven must have exactly 6 Pokémon");

  const expectedRoster = [
    { n: 227, niveau: 77 }, // Skarmory
    { n: 344, niveau: 75 }, // Claydol
    { n: 306, niveau: 76 }, // Aggron
    { n: 346, niveau: 76 }, // Cradily
    { n: 348, niveau: 76 }, // Armaldo
    { n: 376, niveau: 78 }, // Metagross
  ];

  for (let p = 0; p < 6; p++) {
    assert.strictEqual(steven.equipe[p].n, expectedRoster[p].n, `Steven poke ${p} species mismatch`);
    assert.strictEqual(steven.equipe[p].niveau, expectedRoster[p].niveau, `Steven poke ${p} level mismatch`);
    assert.ok(steven.equipe[p].niveau >= 75 && steven.equipe[p].niveau <= 78, `Steven poke ${p} level must be 75-78`);
    assert.ok(Array.isArray(steven.equipe[p].attaques) && steven.equipe[p].attaques.length >= 1);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7: Rival Progression & Wally (rival.js)
// ─────────────────────────────────────────────────────────────────────────────
suite("7. Rival Progression & Wally (rival.js)");

test("POKE_GEN3_RIVAL contains 3 starter variants across key checkpoints", () => {
  const rival = ctx.POKE_GEN3_RIVAL;
  assert.strictEqual(rival.ordre.length, 3, "Rival ordre length must be 3");
  assert.strictEqual(rival.ordre[0], 252, "First starter in rival.ordre must be Arcko (252)");
  assert.strictEqual(rival.ordre[1], 255, "Second starter in rival.ordre must be Poussifeu (255)");
  assert.strictEqual(rival.ordre[2], 258, "Third starter in rival.ordre must be Gobou (258)");
  assert.ok(Array.isArray(rival.debut), "rival.debut must be an array");
  assert.ok(Array.isArray(rival.milieu), "rival.milieu must be an array");

  // Every checkpoint group must be a multiple of 3 (for the 3 starters)
  assert.strictEqual(rival.debut.length % 3, 0, "rival.debut length must be multiple of 3");
  assert.strictEqual(rival.milieu.length % 3, 0, "rival.milieu length must be multiple of 3");

  // First checkpoint: level 5 starter
  assert.strictEqual(rival.debut[0][0].n, 252, "Variant 0 start with Arcko");
  assert.strictEqual(rival.debut[0][0].niveau, 5);
  assert.strictEqual(rival.debut[1][0].n, 255, "Variant 1 start with Poussifeu");
  assert.strictEqual(rival.debut[1][0].niveau, 5);
  assert.strictEqual(rival.debut[2][0].n, 258, "Variant 2 start with Gobou");
  assert.strictEqual(rival.debut[2][0].niveau, 5);
});

test("POKE_GEN3_TIMMY (Wally) is defined with canonical Victory Road team", () => {
  const timmy = ctx.POKE_GEN3_TIMMY;
  assert.ok(timmy, "POKE_GEN3_TIMMY must be defined");
  const nameEn = timmy.nomEn || (timmy.nom && timmy.nom.en);
  assert.strictEqual(nameEn, "Wally", "Timmy English name must be Wally");
  assert.strictEqual(timmy.equipe.length, 5, "Timmy must have 5 Pokémon on Victory Road");

  const species = timmy.equipe.map(p => p.n);
  assert.ok(species.includes(282), "Timmy must have Gardevoir (282)");
  assert.ok(species.includes(334), "Timmy must have Altaria (334)");
  assert.ok(species.includes(301), "Timmy must have Delcatty (301)");
  assert.ok(species.includes(315), "Timmy must have Roselia (315)");
  assert.ok(species.includes(82),  "Timmy must have Magneton (82)");

  for (const p of timmy.equipe) {
    assert.ok(p.niveau >= 41 && p.niveau <= 45, `Timmy poke ${p.n} level ${p.niveau} outside expected 41-45`);
    assert.ok(Array.isArray(p.attaques) && p.attaques.length >= 1, `Timmy poke ${p.n} must have attacks`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "-".repeat(60));
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
if (failedTests > 0) {
  console.log("\x1b[31mSOME TESTS FAILED!\x1b[0m");
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
  process.exit(0);
}
