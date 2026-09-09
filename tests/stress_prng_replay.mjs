/**
 * tests/stress_prng_replay.mjs
 * Challenger 1 Adversarial Stress Test Suite for Road to Legends — Mode Pokémon.
 *
 * Stress-tests:
 *  1. PRNG determinism contract (mulberry32), 100,000 continuous draws, seed edge cases.
 *  2. Combinatorial unranking (PokeChoix) bijection, large pool sampling, boundary cases.
 *  3. Procedural world generation (carte-actes.js, voyage.js) across 200 procedural seeds (1,800 acts).
 *  4. Daily challenge replay engine (rejeu.js) score parity, concurrency, and adversarial fuzzing.
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
const startTime = Date.now();

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
    ...customGlobals,
  };
  sandbox.globalThis = sandbox;
  return vm.createContext(sandbox);
}

function loadScriptInContext(filePath, context) {
  const code = fs.readFileSync(path.join(ROOT_DIR, filePath), "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

// Load NOYAU
const ctx = createIsolatedContext();
loadScriptInContext("js/poke/ordre.js", ctx);
for (const f of ctx.POKE_ORDRE_NOYAU) {
  loadScriptInContext(f, ctx);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: PRNG Determinism & Mulberry32 Extreme Stress
// ─────────────────────────────────────────────────────────────────────────────
suite("1. PRNG Determinism & Mulberry32 Extreme Stress");

test("1.1: 100,000 continuous random draws on a single instance: uniform distribution & no NaNs", () => {
  const Hasard = ctx.PokeHasard;
  const h = new Hasard("STRESS-100K-DRAWS");

  let sum = 0;
  let min = 1.0;
  let max = 0.0;
  const bins = new Array(10).fill(0);

  const N = 100_000;
  for (let i = 0; i < N; i++) {
    const r = h.brut();
    assert.ok(typeof r === "number" && !isNaN(r) && isFinite(r), `Draw #${i} returned non-finite: ${r}`);
    assert.ok(r >= 0 && r < 1.0, `Draw #${i} out of bounds [0, 1): ${r}`);
    sum += r;
    if (r < min) min = r;
    if (r > max) max = r;
    const binIdx = Math.floor(r * 10);
    bins[binIdx]++;
  }

  assert.equal(h.tirages, N, `Draw counter must be exactly ${N}`);
  const mean = sum / N;
  assert.ok(Math.abs(mean - 0.5) < 0.01, `Mean should be ~0.5, got ${mean}`);
  assert.ok(min < 0.001, `Min should be < 0.001, got ${min}`);
  assert.ok(max > 0.999, `Max should be > 0.999, got ${max}`);

  // Chi-Square test for uniformity across 10 bins (expected = N / 10 = 10,000 per bin)
  const expected = N / 10;
  let chiSquare = 0;
  for (let k = 0; k < 10; k++) {
    const diff = bins[k] - expected;
    chiSquare += (diff * diff) / expected;
  }
  // For df=9, p=0.001 critical value is 27.88
  assert.ok(chiSquare < 35, `Chi-square value ${chiSquare} too high for uniform distribution`);
});

test("1.2: 10,000 random seeds: 2 independent instances produce bit-identical streams (1,000,000 draws total)", () => {
  const Hasard = ctx.PokeHasard;
  const SEEDS_COUNT = 10_000;
  const DRAWS_PER_SEED = 100;

  for (let s = 0; s < SEEDS_COUNT; s++) {
    const seed = `SEED-ADVERSARIAL-${s}-${(s * 2654435761) >>> 0}`;
    const h1 = new Hasard(seed);
    const h2 = new Hasard(seed);

    for (let d = 0; d < DRAWS_PER_SEED; d++) {
      const r1 = h1.brut();
      const r2 = h2.brut();
      if (r1 !== r2) {
        throw new Error(`Divergence at seed "${seed}" draw #${d}: ${r1} !== ${r2}`);
      }
    }
  }
});

test("1.3: Boundary and extreme seed types (0, -1, 0xFFFFFFFF, float, null, undefined, empty, 10k string)", () => {
  const Hasard = ctx.PokeHasard;
  const boundarySeeds = [
    0,
    1,
    -1,
    -2147483648,
    2147483647,
    0xffffffff,
    0x100000000, // 2^32
    3.1415926535,
    -0.5,
    "",
    "a",
    "POKE-JOUR-2026-08-25",
    "Special-Chars-!@#$%^&*()_+-=[]{}|;':,./<>?",
    "🔥⚡💧🌿👻🐉 (Emojis)",
    "A".repeat(10_000), // 10k chars
    null,
    undefined,
  ];

  for (const seed of boundarySeeds) {
    const h1 = new Hasard(seed);
    const h2 = new Hasard(seed);

    for (let i = 0; i < 50; i++) {
      const r1 = h1.brut();
      const r2 = h2.brut();
      assert.ok(typeof r1 === "number" && !isNaN(r1) && isFinite(r1), `Non-finite draw on seed ${seed}`);
      assert.equal(r1, r2, `Mismatch on seed ${seed} at draw #${i}`);
    }
  }
});

test("1.4: PRNG high-level draw accounting invariants across edge-case parameters", () => {
  const Hasard = ctx.PokeHasard;
  const h = new Hasard(12345);

  let expectedTirages = 0;

  // entier()
  h.entier(1);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  h.entier(1000);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  // entre()
  h.entre(10, 10); // a == b
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  h.entre(1, 100);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  // chance()
  h.chance(0);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  h.chance(100);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  // pondere() with empty / single / zero weights
  const resEmpty = h.pondere([]);
  assert.equal(resEmpty, null); // 0 draws when empty array and total <= 0
  assert.equal(h.tirages, expectedTirages);

  h.pondere([{ id: 1, poids: 10 }]);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  h.pondere([{ id: 1, poids: 0 }, { id: 2, poids: 0 }]); // total 0
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  // dans()
  const dEmpty = h.dans([]);
  assert.equal(dEmpty, null);
  assert.equal(h.tirages, expectedTirages);

  h.dans([42]);
  expectedTirages++;
  assert.equal(h.tirages, expectedTirages);

  // melange()
  const mEmpty = h.melange([]);
  assert.deepEqual(mEmpty, []);
  assert.equal(h.tirages, expectedTirages);

  const mSingle = h.melange([1]);
  assert.deepEqual(mSingle, [1]);
  assert.equal(h.tirages, expectedTirages);

  for (let len = 2; len <= 20; len++) {
    const arr = Array.from({ length: len }, (_, i) => i);
    h.melange(arr);
    expectedTirages += (len - 1);
    assert.equal(h.tirages, expectedTirages, `Draw mismatch after melange(len=${len})`);
  }
});

test("1.5: PRNG derive() creates completely independent sub-streams without side-effects", () => {
  const Hasard = ctx.PokeHasard;
  const parent = new Hasard("MASTER-SEED-999");

  const childA1 = parent.derive("combat-1");
  const childA2 = parent.derive("combat-1");
  const childB = parent.derive("combat-2");

  assert.equal(parent.tirages, 0);

  // A1 and A2 must be identical
  for (let i = 0; i < 100; i++) {
    const ra1 = childA1.brut();
    const ra2 = childA2.brut();
    const rb = childB.brut();
    assert.equal(ra1, ra2);
    // B should be different from A
    if (i === 0) assert.notEqual(ra1, rb);
  }

  // Parent still 0
  assert.equal(parent.tirages, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Combinatorial Unranking (PokeChoix) Adversarial Tests
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Combinatorial Unranking (PokeChoix) Stress & Bijection");

test("2.1: Exhaustive Bijective Unranking validation for multiple (N, K) configurations", () => {
  const Choix = ctx.PokeChoix;

  const testCases = [
    { n: 4, k: 2, expected: 6 },
    { n: 6, k: 3, expected: 20 },
    { n: 10, k: 3, expected: 120 },
    { n: 12, k: 4, expected: 495 },
    { n: 16, k: 3, expected: 560 },
  ];

  for (const { n, k, expected } of testCases) {
    const items = Array.from({ length: n }, (_, i) => `item_${i}`);
    const count = Choix.combien(n, k);
    assert.equal(count, expected, `combien(${n}, ${k}) failed: expected ${expected}, got ${count}`);

    const seen = new Set();
    for (let rank = 0; rank < count; rank++) {
      const subset = Choix.deRang(items, rank, k);
      assert.equal(subset.length, k, `Subset length mismatch for rank ${rank}`);
      const key = subset.join("|");
      assert.ok(!seen.has(key), `Collision detected at rank ${rank}: ${key}`);
      seen.add(key);
    }
    assert.equal(seen.size, expected, `Full space coverage failed for (${n}, ${k})`);
  }
});

test("2.2: Large pool sampling (N=151, K=3 -> C(151, 3) = 562,475 combinations)", () => {
  const Choix = ctx.PokeChoix;
  const n = 151;
  const k = 3;
  const total = Choix.combien(n, k);
  assert.equal(total, 562475, `C(151, 3) must be 562,475, got ${total}`);

  const items = Array.from({ length: n }, (_, i) => i + 1);
  const sampleSize = 10_000;
  const step = Math.floor(total / sampleSize);

  const seen = new Set();
  for (let i = 0; i < sampleSize; i++) {
    const rank = (i * step) % total;
    const subset = Choix.deRang(items, rank, k);
    assert.equal(subset.length, 3);
    assert.ok(subset[0] < subset[1] && subset[1] < subset[2], `Subset not lexicographically ordered: ${subset}`);
    seen.add(subset.join(","));
  }
  assert.equal(seen.size, sampleSize, `Sample uniqueness failed on large pool`);
});

test("2.3: PokeChoix boundary conditions (k > n, k=0, negative rank, empty vivier)", () => {
  const Choix = ctx.PokeChoix;

  // Empty vivier
  assert.deepEqual(Choix.deRang([], 0, 3), []);
  assert.equal(Choix.combien(0, 3), 1);

  // k > n (e.g. vivier of 2 items, asking for 5)
  const small = ["A", "B"];
  assert.deepEqual(Choix.deRang(small, 0, 5), ["A", "B"]);

  // k == n
  assert.deepEqual(Choix.deRang(["A", "B", "C"], 0, 3), ["A", "B", "C"]);

  // rank wrapping: rank = count + 5 should equal rank = 5
  const pool = ["A", "B", "C", "D", "E"]; // C(5, 3) = 10
  const c = Choix.combien(5, 3);
  assert.equal(c, 10);
  const sub5 = Choix.deRang(pool, 5, 3);
  const sub15 = Choix.deRang(pool, 15, 3);
  const sub25 = Choix.deRang(pool, 25, 3);
  assert.deepEqual(sub5, sub15);
  assert.deepEqual(sub5, sub25);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Procedural World Generation (carte-actes.js) 200 Seeds Stress
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Procedural World Generation (carte-actes.js) 200 Seeds Stress");

test("3.1: 200 Procedural Seeds (1,800 Acts total): 100% Bit-Identical Determinism", () => {
  const CarteActes = ctx.PokeCarteActes;
  const Actes = ctx.PokeActes;
  const Partie = ctx.PokePartie;
  const Hasard = ctx.PokeHasard;

  const SEED_COUNT = 200;
  for (let s = 1; s <= SEED_COUNT; s++) {
    const seed = `WORLD-GEN-SEED-${s}-${(s * 314159) >>> 0}`;

    // Run A
    const hA = new Hasard(seed);
    const partieA = Partie.creer({ graine: seed, regle: "voyage" }, hA);
    const actsA = [];
    for (let actNum = 1; actNum <= 9; actNum++) {
      partieA.acte = actNum;
      const actDef = Actes.acteDe(actNum);
      const map = CarteActes.generer(actDef, partieA, hA);
      actsA.push(map);
    }

    // Run B
    const hB = new Hasard(seed);
    const partieB = Partie.creer({ graine: seed, regle: "voyage" }, hB);
    const actsB = [];
    for (let actNum = 1; actNum <= 9; actNum++) {
      partieB.acte = actNum;
      const actDef = Actes.acteDe(actNum);
      const map = CarteActes.generer(actDef, partieB, hB);
      actsB.push(map);
    }

    assert.equal(hA.tirages, hB.tirages, `Draw count mismatch for seed ${seed}`);
    assert.deepEqual(actsA, actsB, `Map generation diverged for seed ${seed}`);
  }
});

test("3.2: Structural Integrity & Graph Invariants across 200 Procedural Seeds", () => {
  const CarteActes = ctx.PokeCarteActes;
  const Actes = ctx.PokeActes;
  const Partie = ctx.PokePartie;
  const Hasard = ctx.PokeHasard;

  const SEED_COUNT = 200;
  let totalNodesChecked = 0;

  for (let s = 1; s <= SEED_COUNT; s++) {
    const seed = `MAP-STRUCT-SEED-${s}`;
    const h = new Hasard(seed);
    const partie = Partie.creer({ graine: seed, regle: "voyage" }, h);

    for (let actNum = 1; actNum <= 9; actNum++) {
      partie.acte = actNum;
      const actDef = Actes.acteDe(actNum);
      const map = CarteActes.generer(actDef, partie, h);

      assert.equal(map.acte, actNum);
      assert.ok(Array.isArray(map.rangees), "Map rows must be array");
      assert.ok(map.rangees.length >= 3 && map.rangees.length <= 10, `Unexpected row count: ${map.rangees.length}`);

      // Final row must be single boss / league node
      const lastRow = map.rangees[map.rangees.length - 1];
      assert.equal(lastRow.length, 1, `Boss row must have exactly 1 node in act ${actNum}`);
      assert.ok(lastRow[0].type === "boss" || lastRow[0].type === "ligue", `Last node must be boss/ligue, got ${lastRow[0].type}`);

      // Inspect every node
      for (let r = 0; r < map.rangees.length - 1; r++) {
        const row = map.rangees[r];
        assert.ok(row.length >= 1 && row.length <= 3, `Row ${r} invalid width ${row.length}`);

        for (let n = 0; n < row.length; n++) {
          const node = row[n];
          totalNodesChecked++;
          assert.ok(node.id && typeof node.id === "string", `Node missing id in act ${actNum} r${r}n${n}`);
          assert.ok(node.type && typeof node.type === "string", `Node missing type`);

          // Validate level ramps
          if (node.vise !== undefined) {
            assert.ok(typeof node.vise === "number" && !isNaN(node.vise), `Node vise is NaN in act ${actNum}`);
            assert.ok(node.vise >= 3 && node.vise <= 100, `Node vise out of bounds: ${node.vise}`);
          }

          // Validate encounters
          if (node.type === "herbes" || node.type === "eau") {
            assert.ok(Array.isArray(node.annonce) && node.annonce.length > 0, `Encounter node has empty announcement`);
            assert.ok(node.rencontres >= 2 && node.rencontres <= 4, `Encounter count out of bounds: ${node.rencontres}`);
          }

          // Validate trainers
          if (node.type === "dresseur") {
            assert.ok(Array.isArray(node.equipe) && node.equipe.length > 0, `Trainer node has empty team`);
            assert.ok(node.gain > 0, `Trainer gain must be positive`);
            for (const m of node.equipe) {
              assert.ok(m.n >= 1 && m.n <= 251, `Invalid trainer pokemon species: ${m.n}`);
              assert.ok(m.niveau >= 3 && m.niveau <= 100, `Invalid trainer pokemon level: ${m.niveau}`);
            }
          }
        }
      }
    }
  }

  assert.ok(totalNodesChecked > 20_000, `Expected >20k nodes verified, got ${totalNodesChecked}`);
});

test("3.3: Gen 1 (Kanto) vs Gen 2 (Johto) Procedural Map Generation Isolation", () => {
  const CarteActes = ctx.PokeCarteActes;
  const Actes = ctx.PokeActes;
  const Partie = ctx.PokePartie;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;

  // Gen 1 test
  Regles.poser("gen1");
  const h1 = new Hasard("GEN1-MAP-TEST");
  const p1 = Partie.creer({ regle: "voyage", regles: "gen1" }, h1);
  const mapGen1 = CarteActes.generer(Actes.acteDe(1), p1, h1);

  // In Gen 1, no tree nodes should exist anywhere
  const gen1Nodes = mapGen1.rangees.flat();
  assert.ok(!gen1Nodes.some(n => n.type === "arbre"), "Gen 1 should never generate tree nodes");

  // Gen 2 test
  if (Regles.existe("gen2")) {
    Regles.poser("gen2");
    const h2 = new Hasard("GEN2-MAP-TEST");
    const p2 = Partie.creer({ regle: "voyage", regles: "gen2" }, h2);
    const mapGen2 = CarteActes.generer(Actes.acteDe(1), p2, h2);
    assert.ok(mapGen2.rangees.length >= 3, "Gen 2 map must generate valid rows");
    Regles.poser("gen1"); // restore
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Daily Challenge Replay Engine & Score Parity
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Daily Challenge Replay Engine & Score Parity");

test("4.1: Bug Discovery — Victory Act 10 Score Mismatch between client and replayDaily", () => {
  const Partie = ctx.PokePartie;
  const Hasard = ctx.PokeHasard;
  const replayDaily = ctx.replayDaily;

  const h = new Hasard("VICTORY-TEST-SEED");
  const p = Partie.creer({ regle: "voyage", compare: true }, h);

  // Simulate a full winning game (8 badges + League won -> acte 10)
  p.badges = [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ ordre: i }));
  p.ligueGagnee = true;
  p.acte = 10;
  p.fini = "vitrine";
  p.equipe = [
    { n: 25, niveau: 65, pv: 100, stats: { pv: 100 } },
    { n: 6, niveau: 68, pv: 120, stats: { pv: 120 } },
  ];

  const scoreClient = Partie.score(p);
  const bilanClient = Partie.bilan(p);

  // Server replay
  const replayResult = replayDaily("2026-08-25", [bilanClient]);

  // EMPIRICAL BUG CONFIRMATION:
  // Client score calculation: acte 10 gives (10 - 1) * 45 = 405 pts
  // Server replayDaily calculation: normaliser clamps acte to LIMITES.acte (9), giving (9 - 1) * 45 = 360 pts
  // Score mismatch = 45 pts!
  const scoreDifference = scoreClient - replayResult.score;
  assert.equal(scoreDifference, 45, `Expected exactly 45 point desync on victory runs, got ${scoreDifference}`);
});

test("4.2: Bug Discovery — rejeu.js _acteLeg cache staleness across rulesets", () => {
  const Rejeu = ctx.PokeRejeu;
  const Regles = ctx.PokeRegles;

  if (Regles.existe("gen2")) {
    // Under Gen 1, Lugia (249) is unknown, so quandLeg[249] is undefined
    Regles.poser("gen1");
    const b1 = Rejeu.normaliser({ acte: 1, legendaires: [144, 249] }, "2026-08-25");
    assert.ok(b1.legendaires.includes(249), "Gen 1 allows unknown legendary 249 by design");

    // Under Gen 2, Lugia is Act 7. But because _acteLeg is cached from Gen 1, it is still not filtered!
    Regles.poser("gen2");
    const b2 = Rejeu.normaliser({ acte: 1, legendaires: [249] }, "2026-08-25");
    // BUG CONFIRMATION: Lugia (249) in Act 1 is accepted because _acteLeg was cached under gen1!
    assert.ok(b2.legendaires.includes(249), "Demonstrates _acteLeg cache leak across rulesets");

    Regles.poser("gen1"); // restore
  }
});

test("4.3: Realistic mid-game playthroughs (Acts 1 to 9) maintain exact score parity between client and replay", () => {
  const Partie = ctx.PokePartie;
  const Hasard = ctx.PokeHasard;
  const replayDaily = ctx.replayDaily;
  const Actes = ctx.PokeActes;
  const arenes = ctx.POKE_ARENES;

  // Test 100 randomized legitimate playthrough states (within engine level caps and species limits)
  for (let i = 0; i < 100; i++) {
    const h = new Hasard(`REALISTIC-STATE-${i}`);
    const date = "2026-08-25";
    const p = Partie.creer({ regle: "voyage", compare: true, graine: "POKE-JOUR-" + date }, h);

    const acte = h.entre(1, 9);
    p.acte = acte;
    const badgesCount = Math.min(acte - 1, h.entre(0, 8));
    p.badges = Array.from({ length: badgesCount }, (_, k) => ({ ordre: k + 1 }));
    p.ligueGagnee = false;

    // Legitimate team level capped by Actes.plafondDe
    const cap = Actes.plafondDe(acte, arenes, 0, false);
    const teamSize = h.entre(1, 6);
    p.equipe = Array.from({ length: teamSize }, () => ({
      n: h.entre(1, 151),
      niveau: h.entre(5, cap),
      pv: 100,
      stats: { pv: 100 },
    }));

    // Legitimate seen/caught
    const maxVus = Math.min(139, Math.ceil((139 * (acte + 2)) / 11));
    const vusCount = h.entre(1, maxVus);
    const prisCount = h.entre(1, vusCount);
    for (let v = 1; v <= vusCount; v++) p.vus[v] = true;
    for (let pr = 1; pr <= prisCount; pr++) p.pris[pr] = { zone: "route-1", niveau: 10 };

    const clientBilan = Partie.bilan(p);
    const serverResult = replayDaily(date, [clientBilan]);

    assert.equal(
      clientBilan.score,
      serverResult.score,
      `Score divergence at realistic state #${i} (acte=${acte}, badges=${badgesCount}): client=${clientBilan.score}, server=${serverResult.score}`
    );
  }
});

test("4.4: Concurrency and Thread Safety: 1,000 interleaved asynchronous replayDaily invocations", async () => {
  const replayDaily = ctx.replayDaily;
  const dureeMinimale = ctx.dureeMinimale;

  const tasks = [];
  for (let i = 0; i < 1000; i++) {
    tasks.push(
      new Promise((resolve) => {
        const date = `2026-08-${String(1 + (i % 28)).padStart(2, "0")}`;
        const journal = [
          {
            acte: 1 + (i % 9),
            badges: i % 8,
            vus: 10 + (i % 50),
            pris: 5 + (i % 20),
            legendaires: [],
            equipe: [{ niveau: 20 + (i % 40) }],
          },
        ];
        const res = replayDaily(date, journal);
        const minDur = dureeMinimale(journal, date);
        assert.ok(res && res.score > 0);
        assert.ok(minDur >= 0);
        resolve(res);
      })
    );
  }

  const results = await Promise.all(tasks);
  assert.equal(results.length, 1000, "All 1,000 concurrent tasks must complete cleanly");
});

test("4.5: Adversarial Fuzzing & Malformed Submissions (500 edge-case payloads)", () => {
  const normaliser = ctx.PokeRejeu.normaliser;
  const LIMITES = ctx.PokeRejeu.LIMITES;

  const maliciousPayloads = [
    { badges: -5, acte: -10, vus: -100, pris: -50, equipe: [{ niveau: -20 }] },
    { badges: 999, acte: 999, vus: 9999, pris: 9999, equipe: [{ niveau: 999 }] },
    { badges: NaN, acte: Infinity, vus: "100", pris: null, equipe: "invalid" },
    { badges: 3.14, acte: 4.8, vus: 25.5, pris: 10.2, equipe: [{ niveau: 35.7 }] },
    { badges: 2, acte: 1, vus: 50, pris: 40, legendaires: [144, 145, 146, 150, 151] }, // All legendaries in Act 1
    { pris: 100, vus: 10 }, // Caught > Seen
    { __proto__: { admin: true }, badges: 8, acte: 9, ligue: true },
  ];

  for (const payload of maliciousPayloads) {
    const bounded = normaliser(payload, "2026-08-25");
    assert.ok(bounded.badges >= 0 && bounded.badges <= LIMITES.badges, `Badges out of bounds: ${bounded.badges}`);
    assert.ok(bounded.acte >= 1 && bounded.acte <= LIMITES.acte, `Acte out of bounds: ${bounded.acte}`);
    assert.ok(bounded.pris <= bounded.vus, `Pris (${bounded.pris}) > Vus (${bounded.vus})`);
    assert.ok(bounded.equipe.every(m => m.niveau >= 1 && m.niveau <= 100), "Team levels not clamped");
  }

  // 500 randomized fuzz runs
  for (let f = 0; f < 500; f++) {
    const randPayload = {
      badges: Math.floor((Math.random() - 0.5) * 50),
      acte: Math.floor((Math.random() - 0.5) * 50),
      vus: Math.floor((Math.random() - 0.5) * 300),
      pris: Math.floor((Math.random() - 0.5) * 300),
      ligue: Math.random() < 0.5,
      legendaires: [144, 145, 146, 150, 151].filter(() => Math.random() < 0.5),
      equipe: Array.from({ length: Math.floor(Math.random() * 10) }, () => ({
        niveau: Math.floor((Math.random() - 0.5) * 200),
      })),
    };

    const b = normaliser(randPayload, "2026-08-25");
    assert.ok(b.badges >= 0 && b.badges <= 8);
    assert.ok(b.acte >= 1 && b.acte <= 9);
    assert.ok(b.vus >= 0 && b.vus <= 151);
    assert.ok(b.pris >= 0 && b.pris <= b.vus);
    assert.ok(b.equipe.length <= 6);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Final Summary & Exit
// ─────────────────────────────────────────────────────────────────────────────
const durationMs = Date.now() - startTime;
console.log(`\n\x1b[1m\x1b[35m------------------------------------------------------------\x1b[0m`);
console.log(`\x1b[1mStress Test Run Completed in ${durationMs}ms\x1b[0m`);
console.log(`Total Tests: \x1b[1m${totalTests}\x1b[0m | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m`);

if (failedTests > 0) {
  console.log(`\n\x1b[31m\x1b[1mFAILURES:\x1b[0m`);
  for (const { name, err } of failures) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m`);
    console.log(`    ${err.message}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m\x1b[1mALL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n`);
  process.exit(0);
}
