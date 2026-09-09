/**
 * tests/test_gen3_usine_engine.mjs
 * Unit test suite for Gen 3 Battle Factory Engine (PokeUsine) and Canonical Sets (POKE_GEN3_SETS_USINE).
 *
 * Verifies:
 * 1. Structure and completeness of all 4 tiers in POKE_GEN3_SETS_USINE.
 * 2. Set generation and stat scaling by tier (DVs, statExp, natures, held items, full HP).
 * 3. Draft draws (tirerPrets) generate 6 lv 50 mons with distinct species and distinct held items.
 * 4. Initial team selection (choisirEquipeInitiale) validation and opponent generation.
 * 5. Series 7-battle loop, post-combat swap (appliquerEchange), keep team (garderEquipe).
 * 6. Healing between battles (soignerEquipe).
 * 7. Boss Samson (Noland) Silver symbol at combat 21 and Gold symbol at combat 42.
 * 8. PCo battle point calculation per series and boss bonuses.
 * 9. Defeat state transitions.
 * 10. Strict Mulberry32 PRNG determinism across sessions.
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
    Set,
    Map,
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

function loadFullNoyauContext() {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);
  for (const f of ctx.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, ctx);
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Canonical Sets Completeness (POKE_GEN3_SETS_USINE)
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Canonical Emerald Factory Sets (POKE_GEN3_SETS_USINE)");

test("POKE_GEN3_SETS_USINE is exported and contains all 4 tiers", () => {
  const ctx = loadFullNoyauContext();
  assert.ok(ctx.POKE_GEN3_SETS_USINE, "POKE_GEN3_SETS_USINE must be defined");
  const s = ctx.POKE_GEN3_SETS_USINE;
  assert.ok(Array.isArray(s.tier1), "tier1 must be an array");
  assert.ok(Array.isArray(s.tier2), "tier2 must be an array");
  assert.ok(Array.isArray(s.tier3), "tier3 must be an array");
  assert.ok(Array.isArray(s.tier4), "tier4 must be an array");

  assert.ok(s.tier1.length >= 30, `tier1 must have >= 30 sets, got ${s.tier1.length}`);
  assert.ok(s.tier2.length >= 35, `tier2 must have >= 35 sets, got ${s.tier2.length}`);
  assert.ok(s.tier3.length >= 40, `tier3 must have >= 40 sets, got ${s.tier3.length}`);
  assert.ok(s.tier4.length >= 50, `tier4 must have >= 50 sets, got ${s.tier4.length}`);
});

test("All sets have valid species, natures, held items, moves, and repartitions", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const g3 = ctx.PokeRegles.pour("gen3");
  const allMoves = g3.attaques();
  const allNatures = ctx.POKE_GEN3_NATURES;
  const allObjets = ctx.POKE_GEN3_OBJETS;
  const validRepartitions = new Set(["atk_vit", "sat_vit", "pv_def", "pv_sat", "equilibre", "atk_pv"]);

  const tiers = ["tier1", "tier2", "tier3", "tier4"];
  for (const t of tiers) {
    const list = ctx.POKE_GEN3_SETS_USINE[t];
    for (let i = 0; i < list.length; i++) {
      const set = list[i];
      assert.ok(typeof set.espece === "number" && set.espece >= 1 && set.espece <= 386, `${t}[${i}]: invalid species ${set.espece}`);
      assert.ok(allNatures[set.nature], `${t}[${i}]: invalid nature '${set.nature}'`);
      assert.ok(allObjets[set.objet], `${t}[${i}]: invalid held item '${set.objet}'`);
      assert.ok(Array.isArray(set.attaques) && set.attaques.length === 4, `${t}[${i}]: must have exactly 4 attacks`);
      for (const atk of set.attaques) {
        assert.ok(allMoves[atk], `${t}[${i}]: unknown move '${atk}'`);
      }
      assert.ok(validRepartitions.has(set.repartition), `${t}[${i}]: invalid repartition '${set.repartition}'`);
    }
  }
  ctx.PokeRegles.poser("gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Pure NOYAU Engine API (PokeUsine)
// ─────────────────────────────────────────────────────────────────────────────
suite("2. PokeUsine Engine API & Palier Resolution");

test("PokeUsine exports all required NOYAU methods", () => {
  const ctx = loadFullNoyauContext();
  assert.ok(ctx.PokeUsine, "PokeUsine must be defined");
  const U = ctx.PokeUsine;
  assert.strictEqual(typeof U.palierPourCombat, "function");
  assert.strictEqual(typeof U.genererMonDeSet, "function");
  assert.strictEqual(typeof U.tirerPrets, "function");
  assert.strictEqual(typeof U.tirerAdversaire, "function");
  assert.strictEqual(typeof U.creerSession, "function");
  assert.strictEqual(typeof U.choisirEquipeInitiale, "function");
  assert.strictEqual(typeof U.enregistrerResultatCombat, "function");
  assert.strictEqual(typeof U.appliquerEchange, "function");
  assert.strictEqual(typeof U.garderEquipe, "function");
  assert.strictEqual(typeof U.continuerSerie, "function");
  assert.strictEqual(typeof U.soignerEquipe, "function");
  assert.strictEqual(typeof U.calculerGainPCo, "function");
});

test("palierPourCombat resolves correct tiers across all 49+ combats", () => {
  const ctx = loadFullNoyauContext();
  const U = ctx.PokeUsine;

  // Series 1 & 2 (victories 0..13) -> tier1
  assert.strictEqual(U.palierPourCombat(1, 1, 0), "tier1");
  assert.strictEqual(U.palierPourCombat(1, 7, 6), "tier1");
  assert.strictEqual(U.palierPourCombat(2, 1, 7), "tier1");
  assert.strictEqual(U.palierPourCombat(2, 7, 13), "tier1");

  // Series 3 & 4 (victories 14..27) -> tier2
  assert.strictEqual(U.palierPourCombat(3, 1, 14), "tier2");
  assert.strictEqual(U.palierPourCombat(3, 7, 20), "tier2");
  assert.strictEqual(U.palierPourCombat(4, 1, 21), "tier2");
  assert.strictEqual(U.palierPourCombat(4, 7, 27), "tier2");

  // Series 5 (victories 28..34) -> tier3
  assert.strictEqual(U.palierPourCombat(5, 1, 28), "tier3");
  assert.strictEqual(U.palierPourCombat(5, 7, 34), "tier3");

  // Series 6+ / combat 42 -> tier4
  assert.strictEqual(U.palierPourCombat(6, 1, 35), "tier4");
  assert.strictEqual(U.palierPourCombat(6, 7, 41), "tier4");
  assert.strictEqual(U.palierPourCombat(7, 1, 42), "tier4");
});

test("genererMonDeSet sets correct DVs, statExp, nature, item, and full HP per tier", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(777);

  const sampleSet = {
    espece: 260, // Swampert
    nature: "rigide",
    objet: "LEFTOVERS",
    attaques: ["SURF", "EARTHQUAKE", "ICE_BEAM", "PROTECT"],
    repartition: "atk_pv",
  };

  // Tier 1: DVs = 9, statExp = 2000
  const m1 = U.genererMonDeSet(sampleSet, h, "tier1");
  assert.strictEqual(m1.n, 260);
  assert.strictEqual(m1.niveau, 50);
  assert.strictEqual(m1.nature, "rigide");
  assert.strictEqual(m1.objet, "LEFTOVERS");
  assert.strictEqual(m1.pv, m1.stats.pv);
  assert.strictEqual(m1.dv.atk, 9);
  assert.strictEqual(m1.dv.spe, 9);
  assert.strictEqual(m1.statExp.atk, 2000);

  // Tier 2: DVs = 12, statExp = 8000
  const m2 = U.genererMonDeSet(sampleSet, h, "tier2");
  assert.strictEqual(m2.dv.atk, 12);
  assert.strictEqual(m2.statExp.atk, 8000);

  // Tier 3: DVs = 15, statExp = 25000
  const m3 = U.genererMonDeSet(sampleSet, h, "tier3");
  assert.strictEqual(m3.dv.atk, 15);
  assert.strictEqual(m3.statExp.atk, 25000);

  // Tier 4: DVs = 15, statExp = 65535
  const m4 = U.genererMonDeSet(sampleSet, h, "tier4");
  assert.strictEqual(m4.dv.atk, 15);
  assert.strictEqual(m4.statExp.atk, 65535);

  ctx.PokeRegles.poser("gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Draft & Initial Team Selection
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Draft (tirerPrets) & Selection (choisirEquipeInitiale)");

test("tirerPrets generates 6 level 50 Pokemon with distinct species and distinct held items", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard("FACTORY-DRAFT-SEED-1");

  const prets = U.tirerPrets("FACTORY-DRAFT-SEED-1", 1, h);
  assert.strictEqual(prets.length, 6, "Must generate exactly 6 rental Pokemon");

  const species = new Set();
  const items = new Set();
  for (const p of prets) {
    assert.strictEqual(p.niveau, 50);
    assert.ok(p.stats && p.pv === p.stats.pv);
    assert.ok(!species.has(p.n), `Duplicate species #${p.n} in rentals`);
    assert.ok(!items.has(p.objet), `Duplicate held item '${p.objet}' in rentals`);
    species.add(p.n);
    items.add(p.objet);
  }
  ctx.PokeRegles.poser("gen1");
});

test("creerSession initializes state with choix_initial and 6 rentals", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(42);

  const session = U.creerSession({ graine: 42 }, h);
  assert.strictEqual(session.serie, 1);
  assert.strictEqual(session.combat, 1);
  assert.strictEqual(session.combatGlobal, 1);
  assert.strictEqual(session.victoires, 0);
  assert.strictEqual(session.echanges, 0);
  assert.strictEqual(session.prets.length, 6);
  assert.strictEqual(session.equipe.length, 0);
  assert.strictEqual(session.adversaire, null);
  assert.strictEqual(session.statut, "choix_initial");
  assert.strictEqual(session.pcoGagnes, 0);
  assert.strictEqual(session.symboles.argent, false);
  assert.strictEqual(session.symboles.or, false);

  ctx.PokeRegles.poser("gen1");
});

test("choisirEquipeInitiale validates 3 distinct indices and advances to combat", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(42);

  const session = U.creerSession({ graine: 42 }, h);

  // Invalid indices throw
  assert.throws(() => U.choisirEquipeInitiale(session, [0, 1], h));
  assert.throws(() => U.choisirEquipeInitiale(session, [0, 1, 1], h));
  assert.throws(() => U.choisirEquipeInitiale(session, [0, 1, 9], h));

  // Valid indices [0, 2, 4]
  U.choisirEquipeInitiale(session, [0, 2, 4], h);
  assert.strictEqual(session.equipe.length, 3);
  assert.strictEqual(session.equipe[0], session.prets[0]);
  assert.strictEqual(session.equipe[1], session.prets[2]);
  assert.strictEqual(session.equipe[2], session.prets[4]);
  assert.strictEqual(session.statut, "combat");
  assert.ok(session.adversaire, "First opponent must be generated");
  assert.strictEqual(session.adversaire.equipe.length, 3);

  ctx.PokeRegles.poser("gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Battle Loop, Post-Combat Swap, Keep Team, Series Victory & PCo
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Game Loop: Battles, Swaps, Keeping Team & PCo Gains");

test("7 consecutive victories complete Series 1 with 3 PCo and serie_gagnee status", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(999);

  const session = U.creerSession({ graine: 999 }, h);
  U.choisirEquipeInitiale(session, [0, 1, 2], h);

  for (let c = 1; c <= 6; c++) {
    assert.strictEqual(session.combat, c);
    assert.strictEqual(session.statut, "combat");
    // Win battle
    U.enregistrerResultatCombat(session, true, h);
    assert.strictEqual(session.statut, "echange");
    assert.strictEqual(session.victoires, c);

    // Keep team
    U.garderEquipe(session, h);
    assert.strictEqual(session.combat, c + 1);
    assert.strictEqual(session.combatGlobal, c + 1);
    assert.strictEqual(session.statut, "combat");
  }

  // Combat 7 (final in series 1)
  assert.strictEqual(session.combat, 7);
  assert.strictEqual(session.combatGlobal, 7);
  U.enregistrerResultatCombat(session, true, h);

  assert.strictEqual(session.victoires, 7);
  assert.strictEqual(session.statut, "serie_gagnee");
  assert.strictEqual(session.pcoGagnes, 3, "Series 1 must yield 3 PCo");

  // Continue to Series 2
  U.continuerSerie(session, h);
  assert.strictEqual(session.serie, 2);
  assert.strictEqual(session.combat, 1);
  assert.strictEqual(session.combatGlobal, 8);
  assert.strictEqual(session.statut, "combat");

  ctx.PokeRegles.poser("gen1");
});

test("appliquerEchange correctly swaps specified Pokemon and heals team", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(1234);

  const session = U.creerSession({ graine: 1234 }, h);
  U.choisirEquipeInitiale(session, [0, 1, 2], h);

  // Win combat 1
  U.enregistrerResultatCombat(session, true, h);
  assert.strictEqual(session.statut, "echange");

  // Damage player team to check heal on swap
  session.equipe[0].pv = 1;
  session.equipe[0].statut = "brulure";

  const outgoingMon = session.equipe[0];
  const incomingMon = session.adversaire.equipe[1];

  U.appliquerEchange(session, 0, 1, h);

  assert.strictEqual(session.echanges, 1);
  assert.strictEqual(session.equipe[0], incomingMon);
  assert.strictEqual(session.equipe[0].pv, session.equipe[0].stats.pv, "Incoming mon must be fully healed");
  assert.strictEqual(session.equipe[1].pv, session.equipe[1].stats.pv, "Remaining team must be healed");
  assert.strictEqual(session.equipe[1].statut, null);

  assert.strictEqual(session.combat, 2);
  assert.strictEqual(session.combatGlobal, 2);
  assert.strictEqual(session.statut, "combat");

  ctx.PokeRegles.poser("gen1");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Boss Samson (Noland) Silver & Gold Symbols
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Boss Samson (Noland) Silver & Gold Symbols");

test("Boss Noland appears at combat 21 (Silver) and combat 42 (Gold) with symbol rewards", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(5555);

  const session = U.creerSession({ graine: 5555 }, h);
  U.choisirEquipeInitiale(session, [0, 1, 2], h);

  // Fast forward to combat 21 (Series 3, Combat 7)
  session.serie = 3;
  session.combat = 7;
  session.combatGlobal = 21;
  session.victoires = 20;

  session.adversaire = U.tirerAdversaire(session, h);
  assert.ok(session.adversaire, "Opponent must be generated");
  assert.strictEqual(session.adversaire.id, "noland_argent");
  assert.strictEqual(session.adversaire.nom, "Meneur Samson");
  assert.strictEqual(session.adversaire.titre, "Savant de l'Usine");
  assert.strictEqual(session.adversaire.estBoss, true);
  assert.strictEqual(session.adversaire.symbole, "argent");
  assert.strictEqual(session.adversaire.equipe.length, 3);

  // Win combat 21
  U.enregistrerResultatCombat(session, true, h);
  assert.strictEqual(session.symboles.argent, true, "Silver symbol must be awarded");
  assert.strictEqual(session.statut, "serie_gagnee");
  // Series 3 gives 5 PCo + 15 boss silver bonus = 20 PCo
  assert.strictEqual(session.pcoGagnes, 20);

  // Continue and fast forward to combat 42 (Series 6, Combat 7)
  U.continuerSerie(session, h);
  session.serie = 6;
  session.combat = 7;
  session.combatGlobal = 42;
  session.victoires = 41;

  session.adversaire = U.tirerAdversaire(session, h);
  assert.strictEqual(session.adversaire.id, "noland_or");
  assert.strictEqual(session.adversaire.nom, "Meneur Samson");
  assert.strictEqual(session.adversaire.estBoss, true);
  assert.strictEqual(session.adversaire.symbole, "or");

  // Win combat 42
  U.enregistrerResultatCombat(session, true, h);
  assert.strictEqual(session.symboles.or, true, "Gold symbol must be awarded");
  // Series 6 gives 7 PCo + 30 boss gold bonus = 37 PCo -> total 20 + 37 = 57 PCo
  assert.strictEqual(session.pcoGagnes, 57);

  ctx.PokeRegles.poser("gen1");
});

test("Defeat immediately transitions session to 'defaite'", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;
  const h = new ctx.PokeHasard(101);

  const session = U.creerSession({ graine: 101 }, h);
  U.choisirEquipeInitiale(session, [0, 1, 2], h);

  U.enregistrerResultatCombat(session, false, h);
  assert.strictEqual(session.statut, "defaite");

  ctx.PokeRegles.poser("gen1");
});

test("Mulberry32 PRNG determinism produces bit-identical factory sessions", () => {
  const ctx = loadFullNoyauContext();
  ctx.PokeRegles.poser("gen3");
  const U = ctx.PokeUsine;

  const s1 = U.creerSession({ graine: 88888 }, new ctx.PokeHasard(88888));
  const s2 = U.creerSession({ graine: 88888 }, new ctx.PokeHasard(88888));

  assert.strictEqual(s1.prets.length, s2.prets.length);
  for (let i = 0; i < 6; i++) {
    assert.strictEqual(s1.prets[i].n, s2.prets[i].n, `Rental #${i} species mismatch`);
    assert.strictEqual(s1.prets[i].objet, s2.prets[i].objet, `Rental #${i} item mismatch`);
    assert.strictEqual(s1.prets[i].nature, s2.prets[i].nature, `Rental #${i} nature mismatch`);
    assert.strictEqual(s1.prets[i].stats.pv, s2.prets[i].stats.pv, `Rental #${i} PV mismatch`);
  }

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
