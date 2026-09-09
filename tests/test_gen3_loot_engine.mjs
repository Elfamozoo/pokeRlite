/**
 * tests/test_gen3_loot_engine.mjs
 * Unit test suite for Gen 3 Loot & Rewards adaptation (Task 2).
 *
 * Verifies:
 * 1. Strict NOYAU constraints on modified files.
 * 2. POKE_GEN3_MARTS definition in js/poke/gen3/obtentions.js (Emerald town marts + Lilycove counters).
 * 3. PokeObtenir adaptations:
 *    - inventaire(nomMart) lookup across Gen 3, Gen 2, and Gen 1 marts.
 *    - martPour(p) mapping acts 1-9 to Hoenn marts when in Gen 3.
 *    - martMachines(p) -> 'LilycoveDept4F' in Gen 3, 'CeladonMart2FClerk2Text' otherwise.
 *    - martCombat(p) -> 'LilycoveDept3F' in Gen 3, 'CeladonMart5FClerk1Text' otherwise.
 *    - machinePour(cle, p) resolving 'TM39', 'TM08', 39, 'TM_ROCK_TOMB', move keys.
 *    - ctDe(p) resolving acquired CTs dynamically using active generation CT table.
 *    - VITAMINES_GEN3 and employerVitamine handling ZINC & CALCIUM with statExp.sdf & statExp.sat.
 * 4. PokeMoteur.calculerStats handling expSa / expSd from statExp.sat / statExp.sdf (fallback to statExp.spe).
 * 5. PokeButin adaptations:
 *    - apprenables(p) using active generation CT table (PokeRegles.ct(p)).
 *    - pierresUtiles(p) recognizing all canonical stone evolutions (including Gen 3).
 *    - vitamine.tirer PRNG determinism: exactly 5 vitamins in Gen 1 & 2, 6 vitamins in Gen 3.
 * 6. PokeCarteActes noeudBoutique rare shelf:
 *    - Gen 3: includes ZINC, MOON_STONE, SUN_STONE.
 *    - Gen 1 & 2: strictly invariant.
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

function createStubRng(sequence = [0.1, 0.5, 0.9]) {
  let idx = 0;
  return {
    brut: function () {
      const val = sequence[idx % sequence.length];
      idx++;
      return val;
    },
    entier: function (max) {
      const b = this.brut();
      return Math.floor(b * max);
    },
    entre: function (min, max) {
      return min + this.entier(max - min + 1);
    },
    dans: function (liste) {
      if (!liste || !liste.length) return null;
      return liste[this.entier(liste.length)];
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Strict NOYAU Constraints on Modified Files
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Strict NOYAU Constraints on Modified Files");

const FILES_TO_CHECK = [
  "js/poke/gen3/obtentions.js",
  "js/poke/butin.js",
  "js/poke/obtenir.js",
  "js/poke/carte-actes.js",
  "js/poke/moteur.js",
];

for (const relPath of FILES_TO_CHECK) {
  test(`${relPath} enforces 'use strict' and NO DOM/Math.random/Date.now`, () => {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist on disk`);
    const raw = fs.readFileSync(fullPath, "utf-8");
    assert.match(raw, /"use strict"|'use strict'/, `${relPath} must enforce 'use strict'`);

    const code = stripComments(raw);
    assert.ok(!/\bMath\.random\s*\(/.test(code), `${relPath} contains forbidden Math.random()`);
    assert.ok(!/\bDate\.now\s*\(/.test(code), `${relPath} contains forbidden Date.now()`);
    assert.ok(!/\bnew\s+Date\b/.test(code), `${relPath} contains forbidden new Date()`);
    assert.ok(!/\bperformance\.now\s*\(/.test(code), `${relPath} contains forbidden performance.now()`);
    assert.ok(!/\bdocument\./.test(code), `${relPath} contains forbidden document access`);
    assert.ok(!/\blocalStorage\b/.test(code), `${relPath} contains forbidden localStorage`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: POKE_GEN3_MARTS Definition & Inventories
// ─────────────────────────────────────────────────────────────────────────────
suite("2. POKE_GEN3_MARTS in obtentions.js");

test("W.POKE_GEN3_MARTS is defined with canonical Emerald town marts and Lilycove counters", () => {
  const ctx = loadFullNoyauContext();
  assert.ok(ctx.POKE_GEN3_MARTS, "W.POKE_GEN3_MARTS must be defined");

  const requiredMarts = [
    "RustboroMart",
    "DewfordMart",
    "MauvilleMart",
    "LavaridgeMart",
    "VerdanturfMart",
    "FortreeMart",
    "LilycoveDept2F",
    "LilycoveDept3F",
    "LilycoveDept4F",
    "LilycoveDept5F",
    "MossdeepMart",
    "EverGrandeMart"
  ];

  for (const mart of requiredMarts) {
    assert.ok(Array.isArray(ctx.POKE_GEN3_MARTS[mart]), `POKE_GEN3_MARTS.${mart} must be an array`);
    assert.ok(ctx.POKE_GEN3_MARTS[mart].length > 0, `POKE_GEN3_MARTS.${mart} must not be empty`);
  }

  const tmCounter = ctx.POKE_GEN3_MARTS["LilycoveDept4F"];
  const expectedTMs = [
    "TM_FIRE_BLAST",
    "TM_THUNDER",
    "TM_BLIZZARD",
    "TM_HYPER_BEAM",
    "TM_PROTECT",
    "TM_SAFEGUARD",
    "TM_REFLECT",
    "TM_LIGHT_SCREEN"
  ];
  for (const tm of expectedTMs) {
    assert.ok(tmCounter.includes(tm), `LilycoveDept4F must sell ${tm}`);
  }

  const combatCounter = ctx.POKE_GEN3_MARTS["LilycoveDept3F"];
  assert.ok(combatCounter.includes("ZINC"), "LilycoveDept3F must sell ZINC");
  assert.ok(combatCounter.includes("PROTEIN"), "LilycoveDept3F must sell PROTEIN");
  assert.ok(combatCounter.includes("X_ATTACK"), "LilycoveDept3F must sell X_ATTACK");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: PokeObtenir Mart Resolution & Inventories
// ─────────────────────────────────────────────────────────────────────────────
suite("3. PokeObtenir Mart Resolution & Inventories");

test("inventaire(nomMart) resolves across Gen 3, Gen 2, and Gen 1 marts", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  const rustboro = O.inventaire("RustboroMart");
  assert.ok(rustboro.length > 0, "inventaire('RustboroMart') must return items");
  assert.ok(rustboro.includes("POKE_BALL"), "Rustboro must sell POKE_BALL");
  assert.ok(!rustboro.includes("ESCAPE_ROPE"), "Escape rope must be filtered by HORS_MONDE");

  const dept4F = O.inventaire("LilycoveDept4F");
  assert.strictEqual(dept4F.length, 8, "LilycoveDept4F must return 8 canonical TMs");
  assert.ok(dept4F.includes("TM_FIRE_BLAST"), "LilycoveDept4F includes TM_FIRE_BLAST");

  const viridian = O.inventaire("ViridianMartClerkText");
  assert.ok(viridian.length > 0, "Viridian mart must resolve for Gen 1");
  assert.ok(viridian.includes("POKE_BALL"), "Viridian sells POKE_BALL");
});

test("martPour(p) returns Hoenn marts for acts 1-9 in Gen 3, Kanto marts in Gen 1", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  const hoennMarts = [
    "RustboroMart",
    "DewfordMart",
    "MauvilleMart",
    "LavaridgeMart",
    "VerdanturfMart",
    "FortreeMart",
    "LilycoveDept2F",
    "MossdeepMart",
    "EverGrandeMart"
  ];

  for (let acte = 1; acte <= 9; acte++) {
    const pGen3 = { regles: "gen3", acte: acte };
    assert.strictEqual(O.martPour(pGen3), hoennMarts[acte - 1], `Gen 3 Act ${acte} must map to ${hoennMarts[acte - 1]}`);
  }

  const pGen1 = { regles: "gen1", acte: 1 };
  assert.strictEqual(O.martPour(pGen1), "ViridianMartClerkText", "Gen 1 Act 1 must map to Viridian");
});

test("martMachines(p) and martCombat(p) adapt to Gen 3", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  assert.equal(typeof O.martMachines, "function", "martMachines must be exported");
  assert.equal(typeof O.martCombat, "function", "martCombat must be exported");

  const pGen3 = { regles: "gen3" };
  const pGen1 = { regles: "gen1" };

  assert.strictEqual(O.martMachines(pGen3), "LilycoveDept4F", "Gen 3 martMachines must be LilycoveDept4F");
  assert.strictEqual(O.martMachines(pGen1), O.MART_MACHINES, "Gen 1 martMachines must be CeladonMart2FClerk2Text");

  assert.strictEqual(O.martCombat(pGen3), "LilycoveDept3F", "Gen 3 martCombat must be LilycoveDept3F");
  assert.strictEqual(O.martCombat(pGen1), O.MART_COMBAT, "Gen 1 martCombat must be CeladonMart5FClerk1Text");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: PokeObtenir machinePour, donnerCT and ctDe
// ─────────────────────────────────────────────────────────────────────────────
suite("4. PokeObtenir machinePour, donnerCT and ctDe");

test("machinePour resolves 'TM39', 'TM08', numeric 39, and move keys in Gen 3", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;
  const pGen3 = { regles: "gen3" };

  const tm39 = O.machinePour("TM39", pGen3);
  assert.ok(tm39, "TM39 must resolve in Gen 3");
  assert.strictEqual(tm39.n, 39);
  assert.strictEqual(tm39.cle, "ROCK_TOMB");

  const tm08 = O.machinePour("TM08", pGen3);
  assert.ok(tm08, "TM08 must resolve in Gen 3");
  assert.strictEqual(tm08.n, 8);
  assert.strictEqual(tm08.cle, "BULK_UP");

  const tmByNum = O.machinePour(39, pGen3);
  assert.ok(tmByNum, "39 as number must resolve");
  assert.strictEqual(tmByNum.cle, "ROCK_TOMB");

  const tmPrefix = O.machinePour("TM_ROCK_TOMB", pGen3);
  assert.ok(tmPrefix, "TM_ROCK_TOMB must resolve");
  assert.strictEqual(tmPrefix.n, 39);

  const tmBare = O.machinePour("ROCK_TOMB", pGen3);
  assert.ok(tmBare, "ROCK_TOMB move key must resolve");
  assert.strictEqual(tmBare.n, 39);
});

test("machinePour maintains canonical Gen 1 resolution when in Gen 1", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;
  const pGen1 = { regles: "gen1" };

  const tm39Gen1 = O.machinePour("TM39", pGen1);
  assert.ok(tm39Gen1, "TM39 resolves in Gen 1");
  assert.strictEqual(tm39Gen1.cle, "SWIFT");

  const bide = O.machinePour("TM_BIDE", pGen1);
  assert.ok(bide, "TM_BIDE resolves in Gen 1");
  assert.strictEqual(bide.n, 34);
});

test("ctDe(p) returns active generation CT definitions", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  const pGen3 = { regles: "gen3", ct: { 39: 1, 8: 2 } };
  const ctsGen3 = O.ctDe(pGen3);
  assert.strictEqual(ctsGen3.length, 2);
  assert.strictEqual(ctsGen3[0].n, 8);
  assert.strictEqual(ctsGen3[0].cle, "BULK_UP");
  assert.strictEqual(ctsGen3[1].n, 39);
  assert.strictEqual(ctsGen3[1].cle, "ROCK_TOMB");

  const pGen1 = { regles: "gen1", ct: { 39: 1 } };
  const ctsGen1 = O.ctDe(pGen1);
  assert.strictEqual(ctsGen1.length, 1);
  assert.strictEqual(ctsGen1[0].cle, "SWIFT");
});

test("donnerCT handles gym leader TM string 'TM39' correctly", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  const p = { regles: "gen3", ct: {} };
  const res = O.donnerCT(p, "TM39");
  assert.ok(res.ok, "donnerCT('TM39') must succeed");
  assert.strictEqual(p.ct[39], 1, "p.ct[39] must be incremented to 1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Vitamins & StatExp (ZINC, CALCIUM, moteur.js:calculerStats)
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Vitamins, StatExp and calculerStats Integration");

test("VITAMINES_GEN3 is defined with sat and sdf mappings", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;

  assert.ok(O.VITAMINES_GEN3, "PokeObtenir.VITAMINES_GEN3 must be exported");
  assert.strictEqual(O.VITAMINES_GEN3.ZINC, "sdf");
  assert.strictEqual(O.VITAMINES_GEN3.CALCIUM, "sat");
  assert.strictEqual(O.VITAMINES_GEN3.HP_UP, "pv");
  assert.strictEqual(O.VITAMINES_GEN3.PROTEIN, "atk");
  assert.strictEqual(O.VITAMINES_GEN3.IRON, "def");
  assert.strictEqual(O.VITAMINES_GEN3.CARBOS, "vit");
});

test("employerVitamine works for ZINC in Gen 3, updating statExp.sdf and stats.sdf", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;
  const M = ctx.PokeMoteur;
  const rng = createStubRng();

  ctx.PokeRegles.poser("gen3");
  const mon = M.creer(252, 20, rng); // Treecko (#252)
  const p = {
    regles: "gen3",
    equipe: [mon],
    sac: { ZINC: 2 }
  };

  const initialSdfExp = (mon.statExp && mon.statExp.sdf) || 0;
  const initialSdfStat = mon.stats.sdf;

  const res = O.employerVitamine(p, 0, "ZINC");
  assert.ok(res.ok, "employerVitamine with ZINC must succeed in Gen 3");
  assert.strictEqual(res.stat, "sdf");
  assert.strictEqual(p.sac.ZINC, 1, "One ZINC must be consumed");
  assert.strictEqual(mon.statExp.sdf, initialSdfExp + O.VITAMINE_GAIN, "statExp.sdf must increase by 2560");
  assert.ok(mon.stats.sdf >= initialSdfStat, "mon.stats.sdf must reflect the statExp gain");
});

test("employerVitamine works for CALCIUM in Gen 3, updating statExp.sat and stats.sat", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;
  const M = ctx.PokeMoteur;
  const rng = createStubRng();

  ctx.PokeRegles.poser("gen3");
  const mon = M.creer(252, 20, rng); // Treecko (#252)
  const p = {
    regles: "gen3",
    equipe: [mon],
    sac: { CALCIUM: 1 }
  };

  const res = O.employerVitamine(p, 0, "CALCIUM");
  assert.ok(res.ok, "employerVitamine with CALCIUM must succeed in Gen 3");
  assert.strictEqual(res.stat, "sat");
  assert.ok(!p.sac.CALCIUM, "CALCIUM must be consumed from bag");
  assert.strictEqual(mon.statExp.sat, O.VITAMINE_GAIN);
});

test("employerVitamine rejects ZINC in Gen 1", () => {
  const ctx = loadFullNoyauContext();
  const O = ctx.PokeObtenir;
  const M = ctx.PokeMoteur;
  const rng = createStubRng();

  ctx.PokeRegles.poser("gen1");
  const mon = M.creer(1, 20, rng); // Bulbasaur (#1)
  const p = {
    regles: "gen1",
    equipe: [mon],
    sac: { ZINC: 1 }
  };

  const res = O.employerVitamine(p, 0, "ZINC");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.raison, "pasUneVitamine");
});

test("calculerStats in moteur.js accounts for e.sat and e.sdf when defined", () => {
  const ctx = loadFullNoyauContext();
  const M = ctx.PokeMoteur;
  const rng = createStubRng();
  ctx.PokeRegles.poser("gen3");

  const mon = M.creer(252, 50, rng); // Treecko level 50
  mon.statExp.sat = 0;
  mon.statExp.sdf = 0;
  const statsBase = M.calculerStats(mon);

  // Increase only Special Defense EV
  mon.statExp.sdf = 25600;
  const statsBoostedSdf = M.calculerStats(mon);

  assert.strictEqual(statsBoostedSdf.sat, statsBase.sat, "sat must remain unchanged when only sdf is boosted");
  assert.ok(statsBoostedSdf.sdf > statsBase.sdf, "sdf must increase when sdf statExp is boosted");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6: PokeButin (apprenables, pierresUtiles, vitamine.tirer determinism)
// ─────────────────────────────────────────────────────────────────────────────
suite("6. PokeButin Engine Adaptation");

test("apprenables(p) returns Gen 3 TMs learnable by party in Gen 3", () => {
  const ctx = loadFullNoyauContext();
  const B = ctx.PokeButin;
  const M = ctx.PokeMoteur;
  const rng = createStubRng();
  ctx.PokeRegles.poser("gen3");

  const treecko = M.creer(252, 15, rng);
  const p = {
    regles: "gen3",
    acte: 5,
    equipe: [treecko],
    ct: {}
  };

  const learnables = B.apprenables(p);
  assert.ok(learnables.length > 0, "Treecko must have learnable TMs in Gen 3");

  // All returned TMs must be in Treecko's Gen 3 CT list
  const espTreecko = ctx.PokeRegles.especes()[252];
  for (const tm of learnables) {
    assert.ok(tm.n >= 1 && tm.n <= 50, `TM #${tm.n} must be a valid Gen 3 TM`);
    assert.ok(espTreecko.ct.includes(tm.cle), `Treecko must be able to learn ${tm.cle}`);
  }

  // Already owned CTs are excluded
  p.ct[learnables[0].n] = 1;
  const filtered = B.apprenables(p);
  assert.ok(!filtered.some(m => m.n === learnables[0].n), "Owned CT must not appear in apprenables");
});

test("pierresUtiles(p) captures canonical Gen 3 stone evolutions", () => {
  const ctx = loadFullNoyauContext();
  const B = ctx.PokeButin;
  const M = ctx.PokeMoteur;
  const rng = createStubRng();
  ctx.PokeRegles.poser("gen3");

  // Lombre (#271) -> Ludicolo by WATER_STONE
  const lombre = M.creer(271, 20, rng);
  const p1 = { equipe: [lombre] };
  const stones1 = B.pierresUtiles(p1);
  assert.ok(stones1.includes("WATER_STONE"), "Lombre needs WATER_STONE");

  // Nuzleaf (#274) -> Shiftry by LEAF_STONE
  const nuzleaf = M.creer(274, 20, rng);
  const p2 = { equipe: [nuzleaf] };
  const stones2 = B.pierresUtiles(p2);
  assert.ok(stones2.includes("LEAF_STONE"), "Nuzleaf needs LEAF_STONE");

  // Skitty (#300) -> Delcatty by MOON_STONE
  const skitty = M.creer(300, 20, rng);
  const p3 = { equipe: [skitty] };
  const stones3 = B.pierresUtiles(p3);
  assert.ok(stones3.includes("MOON_STONE"), "Skitty needs MOON_STONE");
});

test("vitamine.tirer PRNG determinism: Gen 1 strictly 5 keys, Gen 3 includes ZINC", () => {
  const ctx = loadFullNoyauContext();
  const B = ctx.PokeButin;

  // Gen 1 party: draw with stub RNG
  const pGen1 = { regles: "gen1" };
  const drawnGen1 = new Set();
  for (let i = 0; i < 20; i++) {
    const rng = createStubRng([i / 20]);
    const loot = B.FAMILLES.vitamine.tirer(pGen1, rng);
    drawnGen1.add(loot.objet);
  }
  assert.ok(!drawnGen1.has("ZINC"), "Gen 1 must NEVER draw ZINC");
  assert.strictEqual(drawnGen1.size, 5, "Gen 1 draws from exactly the 5 legacy vitamins");

  // Gen 3 party: draw across spectrum
  const pGen3 = { regles: "gen3" };
  const drawnGen3 = new Set();
  for (let i = 0; i < 60; i++) {
    const rng = createStubRng([i / 60]);
    const loot = B.FAMILLES.vitamine.tirer(pGen3, rng);
    drawnGen3.add(loot.objet);
  }
  assert.ok(drawnGen3.has("ZINC"), "Gen 3 must be able to draw ZINC");
  assert.strictEqual(drawnGen3.size, 6, "Gen 3 draws from all 6 vitamins");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7: PokeCarteActes noeudBoutique Rare Shelf
// ─────────────────────────────────────────────────────────────────────────────
suite("7. PokeCarteActes noeudBoutique Rare Shelf");

test("noeudBoutique includes ZINC and MOON_STONE/SUN_STONE on rare shelf in Gen 3", () => {
  const ctx = loadFullNoyauContext();
  const C = ctx.PokeCarteActes;
  assert.equal(typeof C.noeudBoutique, "function", "noeudBoutique must be exported on PokeCarteActes");

  const etape = { id: "lilycove-city", lieu: "lilycove-city" };
  const acte = { ville: "lilycove-city" };
  const pGen3 = { regles: "gen3", acte: 5 };

  const drawnVits = new Set();
  const drawnStones = new Set();

  for (let i = 0; i < 100; i++) {
    const rng = createStubRng([i / 100, (i + 13) / 100]);
    const noeud = C.noeudBoutique(etape, acte, pGen3, rng);
    assert.ok(noeud.rare, "Rare shelf must exist for acte >= 4");
    drawnVits.add(noeud.rare[0]);
    drawnStones.add(noeud.rare[1]);
  }

  assert.ok(drawnVits.has("ZINC"), "Rare shelf must include ZINC in Gen 3");
  assert.ok(drawnStones.has("MOON_STONE"), "Rare shelf must include MOON_STONE in Gen 3");
  assert.ok(drawnStones.has("SUN_STONE"), "Rare shelf must include SUN_STONE in Gen 3");
});

test("noeudBoutique preserves legacy invariant pools for Gen 1 & Gen 2", () => {
  const ctx = loadFullNoyauContext();
  const C = ctx.PokeCarteActes;
  assert.equal(typeof C.noeudBoutique, "function", "noeudBoutique must be exported on PokeCarteActes");

  const etape = { id: "celadon-city", lieu: "celadon-city" };
  const acte = { ville: "celadon-city" };
  const pGen1 = { regles: "gen1", acte: 5 };

  for (let i = 0; i < 50; i++) {
    const rng = createStubRng([i / 50, (i + 7) / 50]);
    const noeud = C.noeudBoutique(etape, acte, pGen1, rng);
    assert.notStrictEqual(noeud.rare[0], "ZINC", "Gen 1 rare shelf must NOT have ZINC");
    assert.notStrictEqual(noeud.rare[1], "MOON_STONE", "Gen 1 rare shelf must NOT have MOON_STONE");
    assert.notStrictEqual(noeud.rare[1], "SUN_STONE", "Gen 1 rare shelf must NOT have SUN_STONE");
  }
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
