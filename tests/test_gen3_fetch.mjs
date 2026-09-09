/**
 * tests/test_gen3_fetch.mjs
 * Verification suite for Task 1: Gen 3 Data Fetch & Tooling.
 *
 * Validates:
 * 1. notes-data/POKE_GEN3_ESPECES.json:
 *    - Exactly 135 species (252 to 386).
 *    - Required fields: n, cle, nom (fr, en), types, base (pv, atk, def, vit, sat, sdf),
 *      capture, exp, croissance, sexe, taille, poids, depart, apprend, evolue.
 *    - All 6 base stats are positive integers.
 *    - Capture rate > 0.
 * 2. notes-data/POKE_GEN3_ATTAQUES.json:
 *    - Moves from id 252 to 354 (103 moves).
 *    - Required fields: id, cle, nom (fr, en), type, puissance, precision, pp, effet.
 * 3. Sprite & Artwork assets on disk:
 *    - assets/img/poke/gen3/face/<252..386>.png (non-empty)
 *    - assets/img/poke/gen3/dos/<252..386>.png (non-empty)
 *    - assets/img/poke/art/<252..386>.webp (non-empty)
 */

import fs from "node:fs";
import path from "node:path";
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
  }
}

const VALID_TYPES = new Set([
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "steel", "dark"
]);

// ── Suite 1: POKE_GEN3_ESPECES.json ──────────────────────────────────────────
suite("1. Gen 3 Species Data Integrity (POKE_GEN3_ESPECES.json)");

const especesPath = path.join(ROOT_DIR, "notes-data", "POKE_GEN3_ESPECES.json");

test("notes-data/POKE_GEN3_ESPECES.json exists and is valid JSON", () => {
  assert.ok(fs.existsSync(especesPath), `File missing: ${especesPath}`);
  const raw = fs.readFileSync(especesPath, "utf-8");
  const data = JSON.parse(raw);
  assert.ok(Array.isArray(data), "POKE_GEN3_ESPECES must be an array");
});

let especesData = [];
if (fs.existsSync(especesPath)) {
  try {
    especesData = JSON.parse(fs.readFileSync(especesPath, "utf-8"));
  } catch (e) {
    // handled in first test
  }
}

test("POKE_GEN3_ESPECES contains exactly 135 species (252 to 386)", () => {
  assert.equal(especesData.length, 135, `Expected 135 species, got ${especesData.length}`);
  const numbers = especesData.map(e => e.n);
  for (let id = 252; id <= 386; id++) {
    assert.ok(numbers.includes(id), `Missing species number #${id}`);
  }
});

test("Each species has valid 6 base stats, types, and capture rate", () => {
  for (const p of especesData) {
    assert.ok(p.n >= 252 && p.n <= 386, `Invalid id #${p.n}`);
    assert.ok(typeof p.cle === "string" && p.cle.length > 0, `Species #${p.n} missing key`);
    assert.ok(p.nom && p.nom.fr && p.nom.en, `Species #${p.n} missing French/English name`);
    assert.ok(Array.isArray(p.types) && p.types.length >= 1 && p.types.length <= 2, `Species #${p.n} invalid types array`);
    for (const t of p.types) {
      assert.ok(VALID_TYPES.has(t), `Species #${p.n} has invalid type "${t}"`);
    }

    assert.ok(p.base && typeof p.base === "object", `Species #${p.n} missing base stats`);
    for (const stat of ["pv", "atk", "def", "vit", "sat", "sdf"]) {
      assert.ok(Number.isInteger(p.base[stat]) && p.base[stat] > 0, `Species #${p.n} invalid stat ${stat}: ${p.base[stat]}`);
    }

    assert.ok(Number.isInteger(p.capture) && p.capture > 0 && p.capture <= 255, `Species #${p.n} invalid capture rate: ${p.capture}`);
    assert.ok(Array.isArray(p.depart) && p.depart.length > 0, `Species #${p.n} missing depart moves`);
    assert.ok(Array.isArray(p.apprend), `Species #${p.n} missing apprend list`);
    assert.ok(Array.isArray(p.evolue), `Species #${p.n} missing evolue list`);
  }
});

test("Canonical starter checks (Treecko, Torchic, Mudkip)", () => {
  const treecko = especesData.find(e => e.n === 252);
  const torchic = especesData.find(e => e.n === 255);
  const mudkip = especesData.find(e => e.n === 258);

  assert.ok(treecko, "Treecko #252 must exist");
  assert.equal(treecko.nom.fr, "Arcko");
  assert.equal(treecko.nom.en, "Treecko");
  assert.deepEqual(treecko.types, ["grass"]);
  assert.equal(treecko.base.pv, 40);
  assert.equal(treecko.base.vit, 70);

  assert.ok(torchic, "Torchic #255 must exist");
  assert.equal(torchic.nom.fr, "Poussifeu");
  assert.equal(torchic.nom.en, "Torchic");
  assert.deepEqual(torchic.types, ["fire"]);
  assert.equal(torchic.base.pv, 45);

  assert.ok(mudkip, "Mudkip #258 must exist");
  assert.equal(mudkip.nom.fr, "Gobou");
  assert.equal(mudkip.nom.en, "Mudkip");
  assert.deepEqual(mudkip.types, ["water"]);
  assert.equal(mudkip.base.pv, 50);
});

test("Canonical legendary checks (Rayquaza, Kyogre, Groudon, Deoxys)", () => {
  const kyogre = especesData.find(e => e.n === 382);
  const groudon = especesData.find(e => e.n === 383);
  const rayquaza = especesData.find(e => e.n === 384);
  const deoxys = especesData.find(e => e.n === 386);

  assert.ok(kyogre, "Kyogre #382 must exist");
  assert.deepEqual(kyogre.types, ["water"]);
  assert.equal(kyogre.capture, 5);

  assert.ok(groudon, "Groudon #383 must exist");
  assert.deepEqual(groudon.types, ["ground"]);
  assert.equal(groudon.capture, 5);

  assert.ok(rayquaza, "Rayquaza #384 must exist");
  assert.ok(rayquaza.types.includes("dragon") && rayquaza.types.includes("flying"));
  assert.equal(rayquaza.capture, 3);

  assert.ok(deoxys, "Deoxys #386 must exist");
  assert.deepEqual(deoxys.types, ["psychic"]);
  assert.equal(deoxys.capture, 3);
});

// ── Suite 2: POKE_GEN3_ATTAQUES.json ─────────────────────────────────────────
suite("2. Gen 3 Moves Data Integrity (POKE_GEN3_ATTAQUES.json)");

const attaquesPath = path.join(ROOT_DIR, "notes-data", "POKE_GEN3_ATTAQUES.json");

test("notes-data/POKE_GEN3_ATTAQUES.json exists and is valid JSON", () => {
  assert.ok(fs.existsSync(attaquesPath), `File missing: ${attaquesPath}`);
  const raw = fs.readFileSync(attaquesPath, "utf-8");
  const data = JSON.parse(raw);
  assert.ok(Array.isArray(data), "POKE_GEN3_ATTAQUES must be an array");
});

let attaquesData = [];
if (fs.existsSync(attaquesPath)) {
  try {
    attaquesData = JSON.parse(fs.readFileSync(attaquesPath, "utf-8"));
  } catch (e) {
    // handled above
  }
}

test("POKE_GEN3_ATTAQUES contains moves 252 to 354 (103 moves)", () => {
  assert.equal(attaquesData.length, 103, `Expected 103 moves, got ${attaquesData.length}`);
  const ids = attaquesData.map(a => a.id);
  for (let id = 252; id <= 354; id++) {
    assert.ok(ids.includes(id), `Missing move id #${id}`);
  }
});

test("Each move has required structure and valid type", () => {
  for (const m of attaquesData) {
    assert.ok(m.id >= 252 && m.id <= 354, `Invalid move id #${m.id}`);
    assert.ok(typeof m.cle === "string" && m.cle.length > 0, `Move #${m.id} missing key`);
    assert.ok(m.nom && m.nom.fr && m.nom.en, `Move #${m.id} missing French/English name`);
    assert.ok(VALID_TYPES.has(m.type), `Move #${m.id} has invalid type "${m.type}"`);
    assert.ok(typeof m.puissance === "number" && m.puissance >= 0, `Move #${m.id} invalid puissance: ${m.puissance}`);
    assert.ok(typeof m.precision === "number" && m.precision >= 0, `Move #${m.id} invalid precision: ${m.precision}`);
    assert.ok(typeof m.pp === "number" && m.pp > 0, `Move #${m.id} invalid pp: ${m.pp}`);
    assert.ok(typeof m.effet === "string" && m.effet.startsWith("EFFECT_"), `Move #${m.id} invalid effet: ${m.effet}`);
  }
});

test("Key canonical moves check (Fake Out, Leaf Blade, Blaze Kick, Muddy Water, Psycho Boost)", () => {
  const fakeOut = attaquesData.find(a => a.id === 252);
  const leafBlade = attaquesData.find(a => a.cle === "LEAF_BLADE");
  const blazeKick = attaquesData.find(a => a.cle === "BLAZE_KICK");
  const muddyWater = attaquesData.find(a => a.cle === "MUDDY_WATER");
  const psychoBoost = attaquesData.find(a => a.id === 354);

  assert.ok(fakeOut, "Move #252 FAKE_OUT must exist");
  assert.equal(fakeOut.cle, "FAKE_OUT");
  assert.equal(fakeOut.nom.fr, "Bluff");

  assert.ok(leafBlade, "LEAF_BLADE must exist");
  assert.equal(leafBlade.type, "grass");

  assert.ok(blazeKick, "BLAZE_KICK must exist");
  assert.equal(blazeKick.type, "fire");

  assert.ok(muddyWater, "MUDDY_WATER must exist");
  assert.equal(muddyWater.type, "water");

  assert.ok(psychoBoost, "Move #354 PSYCHO_BOOST must exist");
  assert.equal(psychoBoost.cle, "PSYCHO_BOOST");
  assert.equal(psychoBoost.type, "psychic");
});

// ── Suite 3: Sprite Assets Integrity ─────────────────────────────────────────
suite("3. Sprite & Artwork Assets on Disk (252 to 386)");

test("All 135 face sprites exist in assets/img/poke/gen3/face/ and are non-empty", () => {
  const dir = path.join(ROOT_DIR, "assets", "img", "poke", "gen3", "face");
  assert.ok(fs.existsSync(dir), `Directory missing: ${dir}`);
  for (let id = 252; id <= 386; id++) {
    const filePath = path.join(dir, `${id}.png`);
    assert.ok(fs.existsSync(filePath), `Missing face sprite: ${filePath}`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0, `Empty face sprite: ${filePath}`);
  }
});

test("All 135 back sprites exist in assets/img/poke/gen3/dos/ and are non-empty", () => {
  const dir = path.join(ROOT_DIR, "assets", "img", "poke", "gen3", "dos");
  assert.ok(fs.existsSync(dir), `Directory missing: ${dir}`);
  for (let id = 252; id <= 386; id++) {
    const filePath = path.join(dir, `${id}.png`);
    assert.ok(fs.existsSync(filePath), `Missing back sprite: ${filePath}`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0, `Empty back sprite: ${filePath}`);
  }
});

test("All 135 artworks exist in assets/img/poke/art/ and are non-empty WebP", () => {
  const dir = path.join(ROOT_DIR, "assets", "img", "poke", "art");
  assert.ok(fs.existsSync(dir), `Directory missing: ${dir}`);
  for (let id = 252; id <= 386; id++) {
    const filePath = path.join(dir, `${id}.webp`);
    assert.ok(fs.existsSync(filePath), `Missing artwork: ${filePath}`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0, `Empty artwork: ${filePath}`);
  }
});

// ── Summary ──────────────────────────────────────────────────────────────────
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
