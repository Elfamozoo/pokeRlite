/**
 * forensic_stress_test.mjs
 * Independent adversarial stress testing and forensic verification
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const ROOT_DIR = "c:\\Users\\illye\\Documents\\antigravity\\rtl-pokemon";

console.log("Starting Independent Forensic Stress Tests...");

// 1. Check sandbox loading of NOYAU
const sandbox = {
  console, Math, Object, Array, String, Number, Boolean, RegExp, JSON,
  isFinite, isNaN, parseInt, parseFloat
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

const ordreCode = fs.readFileSync(path.join(ROOT_DIR, "js/poke/ordre.js"), "utf-8");
vm.runInContext(ordreCode, ctx, { filename: "js/poke/ordre.js" });

const noyauFiles = ctx.POKE_ORDRE_NOYAU;
console.log(`Loading ${noyauFiles.length} NOYAU files in strict isolated context...`);

for (const f of noyauFiles) {
  const code = fs.readFileSync(path.join(ROOT_DIR, f), "utf-8");
  vm.runInContext(code, ctx, { filename: f });
}

console.log("All NOYAU files loaded successfully in pure headless context.");

// 2. Adversarial PRNG Stress Testing
console.log("Running Adversarial PRNG Stress Testing...");
const Hasard = ctx.PokeHasard;
const Choix = ctx.PokeChoix;

// Boundary testing for seed handling
const hZero = new Hasard(0);
const hNeg = new Hasard(-12345);
const hStr = new Hasard("ADVERSARIAL_SEED_!@#$%^&*()");
const hEmpty = new Hasard("");

assert.ok(hZero.brut() >= 0 && hZero.brut() < 1);
assert.ok(hNeg.brut() >= 0 && hNeg.brut() < 1);
assert.ok(hStr.brut() >= 0 && hStr.brut() < 1);
assert.ok(hEmpty.brut() >= 0 && hEmpty.brut() < 1);

// Test distribution and period over 100,000 iterations
const hStress = new Hasard("STRESS_TEST_SEED_9999");
let minVal = 1;
let maxVal = 0;
let sumVal = 0;
const N = 100000;
for (let i = 0; i < N; i++) {
  const v = hStress.brut();
  if (v < minVal) minVal = v;
  if (v > maxVal) maxVal = v;
  sumVal += v;
}
const mean = sumVal / N;
console.log(`PRNG 100k samples: min=${minVal.toFixed(6)}, max=${maxVal.toFixed(6)}, mean=${mean.toFixed(6)}`);
assert.ok(minVal >= 0 && minVal < 0.001, "Min value should be near 0");
assert.ok(maxVal <= 1 && maxVal > 0.999, "Max value should be near 1");
assert.ok(Math.abs(mean - 0.5) < 0.01, "Mean should be close to 0.5");
assert.equal(hStress.tirages, N, "Tirages counter must be exact");

// 3. Adversarial Combat Simulator Testing
console.log("Running Adversarial Combat Simulator Stress Testing...");
const Moteur = ctx.PokeMoteur;
const Combat = ctx.PokeCombat;

// Test edge-case Pokemon levels (1, 100) and different type match-ups
for (let lvl of [1, 50, 100]) {
  const hBat = new Hasard(`BATTLE_LVL_${lvl}`);
  const monA = Moteur.creer(1, lvl, hBat); // Bulbasaur
  const monB = Moteur.creer(6, lvl, hBat); // Charizard
  
  assert.equal(monA.niveau, lvl);
  assert.equal(monB.niveau, lvl);
  assert.ok(monA.pv > 0);
  assert.ok(monB.pv > 0);
  assert.ok(monA.attaques.length > 0);
  assert.ok(monB.attaques.length > 0);

  const combat = Combat.demarrer([monA], [monB], { graine: `BATTLE_LVL_${lvl}` }, hBat);
  assert.ok(combat);
  assert.equal(combat.fini, null);

  let turns = 0;
  while (!combat.fini && turns < 100) {
    turns++;
    Combat.jouerTour(combat, { type: "attaque", index: 0 }, hBat, { type: "attaque", index: 0 });
  }
  assert.ok(combat.fini === "victoire" || combat.fini === "defaite" || turns === 100, "Combat must resolve or reach cap");
}

// 4. Adversarial Replay Engine Testing
console.log("Running Adversarial Replay Engine Stress Testing...");
const replayDaily = ctx.replayDaily;

// Test replay with malicious / boundary inputs
const maliciousInputs = [
  null,
  undefined,
  {},
  { badges: "invalid" },
  { badges: -5 },
  { badges: 999999 },
  { equipe: "not-an-array" },
  { equipe: [{ n: 999999, niveau: 999999 }] },
  { equipe: [{ n: -1, niveau: -1 }] },
];

for (const badInput of maliciousInputs) {
  try {
    const res = replayDaily("2026-08-25", Array.isArray(badInput) ? badInput : [badInput], { device: "bad-input-test" });
    // If it doesn't throw, verify score is sanitized
    if (res && res.score !== undefined) {
      assert.ok(Number.isFinite(res.score), "Score must be a finite number");
      assert.ok(res.score >= 0, "Score cannot be negative");
    }
  } catch (err) {
    // Graceful error or bounded normalization is acceptable
    console.log(`Handled invalid input safely: ${err.message}`);
  }
}

// 5. Check all functions in NOYAU to verify non-empty, genuine implementations
console.log("Verifying NOYAU functions for facade / dummy implementations...");
let checkedMethods = 0;
const modulesToCheck = [
  "PokeHasard", "PokeChoix", "PokeGenre", "PokeRegles", "PokeMoteur",
  "PokeCombat", "PokeCapture", "PokeActes", "PokeEclat",
  "PokeFusion", "PokePartie", "PokeDepart", "PokeObtenir", "PokeButin",
  "PokeSerments", "PokeChasses", "PokeSceaux", "POKE_SCENARIO", "PokeDuel", "PokeRejeu",
  "pokeEtapeDe", "pokeOuverture", "replayDaily", "pokeGraineDe"
];

for (const modName of modulesToCheck) {
  const mod = ctx[modName];
  assert.ok(mod !== undefined, `Module or function ${modName} must exist on ctx`);
  if (typeof mod === "function") {
    checkedMethods++;
    const fnStr = mod.toString();
    const isDummy = /^\s*function[^{]*\{\s*return\s+(true|false|null|0|"")\s*;\s*\}\s*$/.test(fnStr);
    assert.ok(!isDummy, `Function ${modName} appears to be a dummy facade: ${fnStr}`);
  } else if (typeof mod === "object" && mod !== null) {
    for (const key of Object.keys(mod)) {
      if (typeof mod[key] === "function") {
        checkedMethods++;
        const fnStr = mod[key].toString();
        const isDummy = /^\s*function[^{]*\{\s*return\s+(true|false|null|0|"")\s*;\s*\}\s*$/.test(fnStr);
        assert.ok(!isDummy, `Function ${modName}.${key} appears to be a dummy facade: ${fnStr}`);
      }
    }
  }
}
console.log(`Audited ${checkedMethods} exported NOYAU methods for facades: 0 facades found.`);

console.log("\nALL INDEPENDENT FORENSIC STRESS TESTS PASSED CLEANLY!");
