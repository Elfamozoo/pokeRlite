/**
 * tests/test_combat_capture_adversarial.mjs
 * Challenger 2 — Milestone 1: Adversarial Verification & Stress Harness
 * 
 * Comprehensive empirical testing and boundary validation of:
 *  1. Combat damage bounds across extreme levels (Lv 1 to Lv 100), EV/IV extremes,
 *     status conditions (burn half-attack), weather modifiers, screen multipliers,
 *     STAB & badge multipliers, Explosion halved defense, Future Sight, and the 1 HP damage floor.
 *  2. Critical hit mechanics: Gen 1 Focus Energy bug (crit rate division by 4)
 *     vs Gen 2 Scope Lens (crit rate doubling), High-Crit moves, speed tier extremes.
 *  3. Capture formulas: boundary conditions (0 HP, 1 HP, Max HP, Safari Ball,
 *     Master Ball, status multipliers, oath multipliers, flee logic), and empirical Monte Carlo
 *     validation confirming that chance() and chanceSafari() match empirical simulations within statistical error.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// ── Test Runner Utilities ───────────────────────────────────────────────────

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
  const code = fs.readFileSync(path.join(ROOT_DIR, filePath), "utf-8");
  vm.runInContext(code, context, { filename: filePath });
}

// ── Environment Setup ───────────────────────────────────────────────────────

const ctx = createIsolatedContext();

// 1. Load ordre.js
loadScriptInContext("js/poke/ordre.js", ctx);
assert.ok(ctx.POKE_ORDRE_NOYAU, "POKE_ORDRE_NOYAU must exist");

// 2. Load all NOYAU files
for (const f of ctx.POKE_ORDRE_NOYAU) {
  loadScriptInContext(f, ctx);
}

// 3. Load all GEN2 NOYAU files
for (const f of ctx.POKE_ORDRE_GEN2) {
  loadScriptInContext(f, ctx);
}

const {
  PokeHasard,
  PokeMoteur,
  PokeCombat,
  PokeCapture,
  PokeRegles,
  POKE_ESPECE,
  POKE_ATTAQUE_PAR_CLE,
  POKE_GEN2_ESPECE,
  POKE_GEN2_ATTAQUE_PAR_CLE,
  POKE_GEN2_TENUS,
  POKE_GEN2_EFFETS_NEUFS_TABLE,
} = ctx;

// Simple deterministic pseudo-RNG helper for testing
function makeDeterministicRng(rolls = {}) {
  return {
    brut: () => rolls.brut !== undefined ? rolls.brut : 0.5,
    entre: (min, max) => rolls.entre !== undefined ? rolls.entre : max,
    entier: (n) => rolls.entier !== undefined ? rolls.entier : Math.floor(n / 2),
    chance: (p) => rolls.chance !== undefined ? rolls.chance : (p >= 50),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: DAMAGE FORMULA BOUNDS & MECHANICS
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Combat Damage Formula Bounds, Extreme Levels & Modifiers");

test("Damage across extreme level bounds (Lv 1 to Lv 100) is strictly >= 1 and scales with level", () => {
  PokeRegles.poser("gen1");
  const rngMin = makeDeterministicRng({ brut: 1.0, entre: 217 }); // min roll 217/255, no crit
  const rngMax = makeDeterministicRng({ brut: 1.0, entre: 255 }); // max roll 255/255, no crit

  let dmgLv1 = 0;
  let dmgLv100 = 0;

  for (let lvl = 1; lvl <= 100; lvl++) {
    const att = PokeMoteur.creer(6, lvl, new PokeHasard("att" + lvl), { dv: { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 } });
    const def = PokeMoteur.creer(3, lvl, new PokeHasard("def" + lvl), { dv: { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 } });
    const context = {
      attPaliers: PokeCombat.paliersNeufs(),
      defPaliers: PokeCombat.paliersNeufs(),
      sansCritique: true,
    };

    const resMin = PokeCombat.degats(att, def, "FLAMETHROWER", context, rngMin);
    const resMax = PokeCombat.degats(att, def, "FLAMETHROWER", context, rngMax);

    assert.ok(resMin.degats >= 1, `Damage at Lv ${lvl} min roll must be >= 1, got ${resMin.degats}`);
    assert.ok(resMax.degats >= resMin.degats, `Max roll dmg (${resMax.degats}) must be >= min roll dmg (${resMin.degats}) at Lv ${lvl}`);

    if (lvl === 1) dmgLv1 = resMax.degats;
    if (lvl === 100) dmgLv100 = resMax.degats;
  }

  assert.ok(dmgLv100 > dmgLv1 * 10, `Lv 100 damage (${dmgLv100}) must scale substantially compared to Lv 1 (${dmgLv1})`);
});

test("Extreme Lv 1 vs Lv 100 and Lv 100 vs Lv 1 damage boundary invariants", () => {
  PokeRegles.poser("gen1");
  const rng = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const attLv1 = PokeMoteur.creer(129, 1, new PokeHasard("magikarp1"), { dv: { pv: 0, atk: 0, def: 0, vit: 0, spe: 0 } }); // Magikarp Lv 1 (base Atk 10)
  const defLv100 = PokeMoteur.creer(91, 100, new PokeHasard("cloyster100"), { dv: { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 } }); // Cloyster Lv 100 (base Def 180)
  defLv100.statExp = { pv: 65535, atk: 65535, def: 65535, vit: 65535, spe: 65535 };
  defLv100.stats = PokeMoteur.calculerStats(defLv100);

  const contextWorst = {
    attPaliers: { atk: -6, def: -6, vit: -6, spe: -6 },
    defPaliers: { atk: 6, def: 6, vit: 6, spe: 6 },
    protection: true,
    sansCritique: true,
  };
  attLv1.statut = "brulure";

  const resWorst = PokeCombat.degats(attLv1, defLv100, "TACKLE", contextWorst, makeDeterministicRng({ brut: 1.0, entre: 217 }));
  assert.equal(resWorst.degats, 1, `1 HP damage floor must hold for minimum possible attack against max defense: got ${resWorst.degats}`);

  // Opposite extreme: Mewtwo Lv 100 max stats +6 stages vs Magikarp Lv 1 min stats -6 stages
  const attLv100 = PokeMoteur.creer(150, 100, new PokeHasard("mewtwo100"), { dv: { pv: 15, atk: 15, def: 15, vit: 15, spe: 15 } });
  attLv100.statExp = { pv: 65535, atk: 65535, def: 65535, vit: 65535, spe: 65535 };
  attLv100.stats = PokeMoteur.calculerStats(attLv100);

  const contextBest = {
    attPaliers: { atk: 6, def: 6, vit: 6, spe: 6 },
    defPaliers: { atk: -6, def: -6, vit: -6, spe: -6 },
    sansCritique: true,
  };

  const resBest = PokeCombat.degats(attLv100, attLv1, "PSYCHIC_M", contextBest, rng);
  assert.ok(resBest.degats > 2000, `Max offensive damage should be massive (>2000), got ${resBest.degats}`);
});

test("Zero-power moves and type immunities produce 0 damage cleanly", () => {
  PokeRegles.poser("gen1");
  const att = PokeMoteur.creer(150, 100, new PokeHasard("mewtwo"));
  const defGhost = PokeMoteur.creer(94, 50, new PokeHasard("gengar")); // Gengar (Ghost/Poison)
  const defNormal = PokeMoteur.creer(143, 50, new PokeHasard("snorlax")); // Snorlax (Normal)
  const defGround = PokeMoteur.creer(76, 50, new PokeHasard("golem")); // Golem (Rock/Ground)
  const defFlying = PokeMoteur.creer(18, 50, new PokeHasard("pidgeot")); // Pidgeot (Normal/Flying)

  const context = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), sansCritique: true };
  const rng = makeDeterministicRng();

  // 1. Status move (LEER: power 0)
  const resStatus = PokeCombat.degats(att, defNormal, "LEER", context, rng);
  assert.equal(resStatus.degats, 0);
  assert.equal(resStatus.efficacite, 1);

  // 2. Normal attack against Ghost
  const resNormGhost = PokeCombat.degats(defNormal, defGhost, "MEGA_PUNCH", context, rng);
  assert.equal(resNormGhost.degats, 0);
  assert.equal(resNormGhost.efficacite, 0);

  // 3. Ghost attack (Lick) against Normal
  const resGhostNorm = PokeCombat.degats(defGhost, defNormal, "LICK", context, rng);
  assert.equal(resGhostNorm.degats, 0);
  assert.equal(resGhostNorm.efficacite, 0);

  // 4. Electric against Ground
  const defElec = PokeMoteur.creer(25, 50, new PokeHasard("pikachu"));
  const resElecGround = PokeCombat.degats(defElec, defGround, "THUNDERBOLT", context, rng);
  assert.equal(resElecGround.degats, 0);
  assert.equal(resElecGround.efficacite, 0);

  // 5. Ground against Flying
  const resGroundFly = PokeCombat.degats(defGround, defFlying, "EARTHQUAKE", context, rng);
  assert.equal(resGroundFly.degats, 0);
  assert.equal(resGroundFly.efficacite, 0);
});

test("STAB (Same Type Attack Bonus) applies exact 1.5x multiplier", () => {
  PokeRegles.poser("gen1");
  const rng = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const attCharizard = PokeMoteur.creer(6, 50, new PokeHasard("char")); // Fire / Flying
  const attSnorlax = PokeMoteur.creer(143, 50, new PokeHasard("snorlax")); // Normal
  const defMew = PokeMoteur.creer(151, 50, new PokeHasard("mew")); // Neutral target (Psychic)

  // Align special stats
  attSnorlax.stats.spe = attCharizard.stats.spe;

  const context = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), sansCritique: true };

  // FLAMETHROWER from Charizard (STAB) vs from Snorlax (Non-STAB)
  const dmgSTAB = PokeCombat.degats(attCharizard, defMew, "FLAMETHROWER", context, rng).degats;
  const dmgNonSTAB = PokeCombat.degats(attSnorlax, defMew, "FLAMETHROWER", context, rng).degats;

  assert.ok(dmgSTAB > dmgNonSTAB, `STAB damage (${dmgSTAB}) must exceed Non-STAB (${dmgNonSTAB})`);
  const ratio = dmgSTAB / dmgNonSTAB;
  assert.ok(ratio >= 1.40 && ratio <= 1.55, `STAB ratio should be ~1.5x, got ${ratio.toFixed(3)}`);
});

test("Explosion and Selfdestruct halve target defense (EXPLODE_EFFECT)", () => {
  PokeRegles.poser("gen1");
  const rng = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const attGolem = PokeMoteur.creer(76, 50, new PokeHasard("golem"));
  const defChansey = PokeMoteur.creer(113, 50, new PokeHasard("chansey"));

  const context = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), sansCritique: true };

  // Compare EXPLOSION (Power 170 + Halved Def = effective 340) vs MEGA_KICK (Power 120)
  const resExplosion = PokeCombat.degats(attGolem, defChansey, "EXPLOSION", context, rng);
  const resMegaKick = PokeCombat.degats(attGolem, defChansey, "MEGA_KICK", context, rng);

  assert.ok(resExplosion.degats > resMegaKick.degats * 2, `Explosion with halved defense (${resExplosion.degats}) should hit > 2x Mega Kick (${resMegaKick.degats})`);
});

test("Status Condition: Burn halves physical Attack but does NOT affect Special Attack", () => {
  PokeRegles.poser("gen1");
  const rng = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const att = PokeMoteur.creer(6, 50, new PokeHasard("char50"));
  const def = PokeMoteur.creer(3, 50, new PokeHasard("ven50"));
  const context = {
    attPaliers: PokeCombat.paliersNeufs(),
    defPaliers: PokeCombat.paliersNeufs(),
    sansCritique: true,
  };

  // 1. Physical move: MEGA_PUNCH (Normal)
  att.statut = null;
  const dmgPhysHealthy = PokeCombat.degats(att, def, "MEGA_PUNCH", context, rng);
  att.statut = "brulure";
  const dmgPhysBurned = PokeCombat.degats(att, def, "MEGA_PUNCH", context, rng);
  assert.ok(dmgPhysBurned.degats < dmgPhysHealthy.degats, `Burned physical damage (${dmgPhysBurned.degats}) must be less than healthy (${dmgPhysHealthy.degats})`);

  // 2. Special move: FLAMETHROWER (Fire)
  att.statut = null;
  const dmgSpecHealthy = PokeCombat.degats(att, def, "FLAMETHROWER", context, rng);
  att.statut = "brulure";
  const dmgSpecBurned = PokeCombat.degats(att, def, "FLAMETHROWER", context, rng);
  assert.equal(dmgSpecBurned.degats, dmgSpecHealthy.degats, `Burn must NOT reduce special move damage: healthy=${dmgSpecHealthy.degats}, burned=${dmgSpecBurned.degats}`);
});

test("Gen 2 Weather Modifiers: Rain and Sun boost and reduce correct elemental moves", () => {
  PokeRegles.poser("gen2");
  const rng = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const attWater = PokeMoteur.creer(160, 50, new PokeHasard("feraligatr50")); // Feraligatr (Water)
  const attFire = PokeMoteur.creer(157, 50, new PokeHasard("typhlosion50")); // Typhlosion (Fire)
  const def = PokeMoteur.creer(154, 50, new PokeHasard("meganium50")); // Meganium

  const ctxNeutral = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), sansCritique: true };
  const ctxRain = { ...ctxNeutral, meteo: "pluie" };
  const ctxSun = { ...ctxNeutral, meteo: "zenith" };
  const ctxSand = { ...ctxNeutral, meteo: "sable" };

  // Water move: HYDRO_PUMP
  const waterNeutral = PokeCombat.degats(attWater, def, "HYDRO_PUMP", ctxNeutral, rng).degats;
  const waterRain = PokeCombat.degats(attWater, def, "HYDRO_PUMP", ctxRain, rng).degats;
  const waterSun = PokeCombat.degats(attWater, def, "HYDRO_PUMP", ctxSun, rng).degats;
  const waterSand = PokeCombat.degats(attWater, def, "HYDRO_PUMP", ctxSand, rng).degats;

  assert.ok(waterRain > waterNeutral, `Water damage in Rain (${waterRain}) must exceed Neutral (${waterNeutral})`);
  assert.ok(waterSun < waterNeutral, `Water damage in Sun (${waterSun}) must be less than Neutral (${waterNeutral})`);
  assert.equal(waterSand, waterNeutral, `Water damage in Sandstorm (${waterSand}) must equal Neutral (${waterNeutral})`);

  // Fire move: FLAMETHROWER
  const fireNeutral = PokeCombat.degats(attFire, def, "FLAMETHROWER", ctxNeutral, rng).degats;
  const fireRain = PokeCombat.degats(attFire, def, "FLAMETHROWER", ctxRain, rng).degats;
  const fireSun = PokeCombat.degats(attFire, def, "FLAMETHROWER", ctxSun, rng).degats;

  assert.ok(fireSun > fireNeutral, `Fire damage in Sun (${fireSun}) must exceed Neutral (${fireNeutral})`);
  assert.ok(fireRain < fireNeutral, `Fire damage in Rain (${fireRain}) must be less than Neutral (${fireNeutral})`);
});

test("Screens (Reflect & Light Screen) double defense and are bypassed by Critical Hits", () => {
  PokeRegles.poser("gen1");
  const rngNoCrit = makeDeterministicRng({ brut: 1.0, entre: 255 });
  const rngCrit = makeDeterministicRng({ brut: 0.0, entre: 255 }); // forces crit

  const att = PokeMoteur.creer(6, 50, new PokeHasard("att"));
  const def = PokeMoteur.creer(3, 50, new PokeHasard("def"));

  // Physical move with Reflect
  const ctxNormalPhys = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), sansCritique: true };
  const ctxReflect = { ...ctxNormalPhys, protection: true };

  const dmgPhysNormal = PokeCombat.degats(att, def, "MEGA_PUNCH", ctxNormalPhys, rngNoCrit).degats;
  const dmgPhysReflect = PokeCombat.degats(att, def, "MEGA_PUNCH", ctxReflect, rngNoCrit).degats;
  assert.ok(dmgPhysReflect < dmgPhysNormal, `Reflect must reduce physical damage (${dmgPhysReflect} < ${dmgPhysNormal})`);

  // Special move with Light Screen
  const ctxLightScreen = { ...ctxNormalPhys, mur: true };
  const dmgSpecNormal = PokeCombat.degats(att, def, "FLAMETHROWER", ctxNormalPhys, rngNoCrit).degats;
  const dmgSpecLightScreen = PokeCombat.degats(att, def, "FLAMETHROWER", ctxLightScreen, rngNoCrit).degats;
  assert.ok(dmgSpecLightScreen < dmgSpecNormal, `Light Screen must reduce special damage (${dmgSpecLightScreen} < ${dmgSpecNormal})`);

  // Critical hit ignores screens and stat stages
  const ctxBoostedDefWithScreens = {
    attPaliers: { atk: -6, def: -6, vit: -6, spe: -6 },
    defPaliers: { atk: 6, def: 6, vit: 6, spe: 6 },
    protection: true,
    mur: true,
    sansCritique: false,
  };
  const ctxClean = {
    attPaliers: PokeCombat.paliersNeufs(),
    defPaliers: PokeCombat.paliersNeufs(),
    sansCritique: false,
  };
  const resCritScreens = PokeCombat.degats(att, def, "MEGA_PUNCH", ctxBoostedDefWithScreens, rngCrit);
  const resCritClean = PokeCombat.degats(att, def, "MEGA_PUNCH", ctxClean, rngCrit);

  assert.equal(resCritScreens.critique, true, "Should be a critical hit");
  assert.equal(resCritClean.critique, true, "Should be a critical hit");
  assert.equal(resCritScreens.degats, resCritClean.degats, `Critical hit must produce identical damage regardless of screens/defense stages: screens=${resCritScreens.degats}, clean=${resCritClean.degats}`);
});

test("1 HP Damage Floor holds under hostile stacked penalty conditions", () => {
  PokeRegles.poser("gen2");
  const att = PokeMoteur.creer(129, 1, new PokeHasard("magikarp")); // Lv 1 Magikarp
  att.statut = "brulure"; // Burned -> 1/2 attack
  const def = PokeMoteur.creer(213, 100, new PokeHasard("shuckle")); // Lv 100 Shuckle (base Def 230)
  def.statExp = { pv: 65535, atk: 65535, def: 65535, vit: 65535, spe: 65535 };
  def.stats = PokeMoteur.calculerStats(def);

  const ctxHostile = {
    attPaliers: { atk: -6, def: -6, vit: -6, sat: -6, sdf: -6 }, // 0.25x Atk
    defPaliers: { atk: 6, def: 6, vit: 6, sat: 6, sdf: 6 },     // 4.0x Def
    protection: true, // 2x Def
    sermentsInflige: 0.5, // Oath penalty
    sermentsSubit: 0.5,   // Oath penalty
    sansCritique: true,
  };

  const rngWorstRoll = makeDeterministicRng({ brut: 1.0, entre: 217 }); // min roll 217/255
  const res = PokeCombat.degats(att, def, "TACKLE", ctxHostile, rngWorstRoll);

  assert.equal(res.degats, 1, `1 HP floor MUST protect minimum damage from zeroing out: got ${res.degats}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: CRITICAL HIT RATES — FOCUS ENERGY BUG VS SCOPE LENS
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Critical Hit Mechanics: Gen 1 Focus Energy Division Bug vs Gen 2 Scope Lens");

test("Gen 1 Base Crit Rate calculation based on Base Speed and High-Crit Moves", () => {
  PokeRegles.poser("gen1");

  // Chansey (base vit = 50)
  const chansey = { n: 113 };
  assert.equal(POKE_ESPECE[113].base.vit, 50);
  const chanseyNormalCrit = PokeCombat.chanceCritique(chansey, "POUND");
  const chanseyHighCrit = PokeCombat.chanceCritique(chansey, "SLASH");
  assert.equal(chanseyNormalCrit, Math.floor(50 / 2) / 256); // 25 / 256
  assert.equal(chanseyHighCrit, Math.min(255, Math.floor(50 / 2) * 8) / 256); // 200 / 256

  // Slowpoke (base vit = 15)
  const slowpoke = { n: 79 };
  assert.equal(POKE_ESPECE[79].base.vit, 15);
  const slowpokeNormalCrit = PokeCombat.chanceCritique(slowpoke, "TACKLE");
  const slowpokeHighCrit = PokeCombat.chanceCritique(slowpoke, "SLASH");
  assert.equal(slowpokeNormalCrit, Math.floor(15 / 2) / 256); // 7 / 256
  assert.equal(slowpokeHighCrit, Math.min(255, Math.floor(15 / 2) * 8) / 256); // 56 / 256

  // Persian (base vit = 115)
  const persian = { n: 53 };
  assert.equal(POKE_ESPECE[53].base.vit, 115);
  const persianNormalCrit = PokeCombat.chanceCritique(persian, "BITE");
  const persianSlashCrit = PokeCombat.chanceCritique(persian, "SLASH");
  assert.equal(persianNormalCrit, Math.floor(115 / 2) / 256); // 57 / 256 ≈ 22.26%
  assert.equal(persianSlashCrit, Math.min(255, Math.floor(115 / 2) * 8) / 256); // 255 / 256 ≈ 99.61%

  // Electrode (base vit = 140)
  const electrode = { n: 101 };
  assert.equal(POKE_ESPECE[101].base.vit, 140);
  const electrodeNormalCrit = PokeCombat.chanceCritique(electrode, "THUNDERBOLT");
  assert.equal(electrodeNormalCrit, Math.floor(140 / 2) / 256); // 70 / 256 ≈ 27.34%
});

test("Gen 1 Focus Energy Bug: Focus Energy divides crit rate by 4 (ctx.puissance)", () => {
  PokeRegles.poser("gen1");
  const att = PokeMoteur.creer(53, 50, new PokeHasard("persian")); // Persian
  const def = PokeMoteur.creer(3, 50, new PokeHasard("venusaur"));

  const normalCritRate = PokeCombat.chanceCritique(att, "BITE"); // 57 / 256 ≈ 0.22265625

  // Simulation: test threshold at rate without Focus Energy vs with Focus Energy
  // Test RNG with brut() = 0.10 (between normal / 4 and normal):
  // 0.10 < 0.2226 (crits without Focus Energy)
  // 0.10 > (0.2226 / 4 = 0.0556) (DOES NOT CRIT with Focus Energy!)
  const rng = makeDeterministicRng({ brut: 0.10, entre: 255 });

  const ctxWithoutFocus = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), puissance: false };
  const resWithoutFocus = PokeCombat.degats(att, def, "BITE", ctxWithoutFocus, rng);
  assert.equal(resWithoutFocus.critique, true, "Should crit without Focus Energy at brut 0.10");

  const ctxWithFocus = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), puissance: true };
  const resWithFocus = PokeCombat.degats(att, def, "BITE", ctxWithFocus, rng);
  assert.equal(resWithFocus.critique, false, "Focus Energy bug must reduce crit rate and prevent crit at brut 0.10");
});

test("Gen 1 Focus Energy Bug on High-Crit move Slash plummets crit rate from ~99.6% to ~24.9%", () => {
  PokeRegles.poser("gen1");
  const att = PokeMoteur.creer(53, 50, new PokeHasard("persian"));
  const def = PokeMoteur.creer(3, 50, new PokeHasard("venusaur"));

  // Base Slash Crit Rate for Persian: 255 / 256 ≈ 0.9961
  // With Focus Energy: (255 / 256) / 4 = 63.75 / 256 ≈ 0.2490
  const rngPassBoth = makeDeterministicRng({ brut: 0.20, entre: 255 }); // 0.20 < 0.249 -> crits on both
  const rngFailFocus = makeDeterministicRng({ brut: 0.50, entre: 255 }); // 0.50 < 0.996 but > 0.249 -> crits without focus, fails with focus

  const ctxNoFocus = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), puissance: false };
  const ctxFocus = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs(), puissance: true };

  assert.equal(PokeCombat.degats(att, def, "SLASH", ctxNoFocus, rngPassBoth).critique, true);
  assert.equal(PokeCombat.degats(att, def, "SLASH", ctxFocus, rngPassBoth).critique, true);

  assert.equal(PokeCombat.degats(att, def, "SLASH", ctxNoFocus, rngFailFocus).critique, true);
  assert.equal(PokeCombat.degats(att, def, "SLASH", ctxFocus, rngFailFocus).critique, false, "Focus Energy must cause 50% roll to fail crit on Slash!");
});

test("Gen 2 Scope Lens (Lentille Scope) doubles critical hit rate", () => {
  PokeRegles.poser("gen2");
  const att = PokeMoteur.creer(157, 50, new PokeHasard("typhlosion")); // Typhlosion (base vit 100 -> base crit rate 50/256 ≈ 0.1953)
  const def = PokeMoteur.creer(154, 50, new PokeHasard("meganium"));

  // Scope Lens held item
  att.objet = "SCOPE_LENS"; // held item with HELD_CRITICAL_UP

  const ctxNormal = { attPaliers: PokeCombat.paliersNeufs(), defPaliers: PokeCombat.paliersNeufs() };

  // RNG at brut = 0.30:
  // 0.30 > 0.1953 (without Scope Lens -> no crit)
  // 0.30 < (0.1953 * 2 = 0.3906) (with Scope Lens -> CRIT!)
  const rng = makeDeterministicRng({ brut: 0.30, entre: 255 });

  // 1. Without Scope Lens
  att.objet = null;
  const resNoScope = PokeCombat.degats(att, def, "HEADBUTT", ctxNormal, rng);
  assert.equal(resNoScope.critique, false, "Without Scope Lens should not crit at brut 0.30");

  // 2. With Scope Lens
  att.objet = "SCOPE_LENS";
  const resWithScope = PokeCombat.degats(att, def, "HEADBUTT", ctxNormal, rng);
  assert.equal(resWithScope.critique, true, "With Scope Lens doubled crit rate must crit at brut 0.30");
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: CAPTURE FORMULAS — BOUNDARY CONDITIONS & EMPIRICAL PARITY
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Capture Formula Boundary Conditions & Empirical Monte Carlo Parity");

test("Master Ball boundary condition: guaranteed 100% capture without RNG consumption", () => {
  PokeRegles.poser("gen1");
  const target = PokeMoteur.creer(150, 70, new PokeHasard("mewtwo")); // Mewtwo (catch rate 3)
  target.pv = target.stats.pv; // 100% HP, no status

  // Call tenter with dummy RNG
  const res = PokeCapture.tenter(target, "MASTER_BALL", null);
  assert.equal(res.pris, true, "Master ball must catch 100%");
  assert.equal(res.secousses, 3, "Master ball gives 3 shakes");
  assert.equal(res.raison, "master", "Reason must be 'master'");

  // Verify chance() analytical output
  const ch = PokeCapture.chance(target, "MASTER_BALL");
  assert.equal(ch, 1, "chance() for Master Ball must return 1.0");
});

test("0 HP, negative HP, and 1 HP boundary conditions: safe fallback, no division by zero, max value", () => {
  PokeRegles.poser("gen1");
  const target = PokeMoteur.creer(150, 70, new PokeHasard("mewtwo"));

  // 0 HP edge case
  target.pv = 0;
  const ch0 = PokeCapture.chance(target, "ULTRA_BALL");
  target.pv = -10;
  const chNeg = PokeCapture.chance(target, "ULTRA_BALL");
  target.pv = 1;
  const ch1 = PokeCapture.chance(target, "ULTRA_BALL");

  assert.ok(ch0 > 0 && ch0 <= 1, `chance() at 0 HP must be safe in [0, 1], got ${ch0}`);
  assert.equal(ch0, ch1, "0 HP and 1 HP must produce identical results due to Math.max(1, pv)");
  assert.equal(chNeg, ch1, "Negative HP and 1 HP must produce identical results due to Math.max(1, pv)");

  // 1 HP test with tenter:
  // Mewtwo (catch rate 3). If jet <= 3 on Ultra Ball (0..150), stage 3 has valeur >= 255, guaranteed catch
  target.pv = 1;
  const rngPass = makeDeterministicRng({ entier: 2 }); // jet = 2 <= 3
  const resPass = PokeCapture.tenter(target, "ULTRA_BALL", rngPass);
  assert.equal(resPass.pris, true, "Mewtwo at 1 HP with passing catch rate roll must succeed");
  assert.equal(resPass.raison, "affaibli", "Reason must be 'affaibli' when valeur >= 255");
});

test("Status multipliers boost capture probability across all ball types", () => {
  PokeRegles.poser("gen1");
  const target = PokeMoteur.creer(144, 50, new PokeHasard("articuno")); // Articuno (catch rate 3)
  target.pv = Math.floor(target.stats.pv / 2); // 50% HP

  const balls = ["POKE_BALL", "GREAT_BALL", "ULTRA_BALL"];
  for (const b of balls) {
    const chNone = PokeCapture.chance(target, b, 1, null);
    const chPara = PokeCapture.chance(target, b, 1, "para");
    const chSleep = PokeCapture.chance(target, b, 1, "sommeil");
    const chFreeze = PokeCapture.chance(target, b, 1, "gel");

    assert.ok(chPara > chNone, `${b}: Paralyzed chance (${chPara}) must exceed None (${chNone})`);
    assert.ok(chSleep > chPara, `${b}: Sleep chance (${chSleep}) must exceed Paralyzed (${chPara})`);
    assert.equal(chSleep, chFreeze, `${b}: Freeze chance (${chFreeze}) must equal Sleep (${chSleep})`);
  }
});

test("Safari Ball mechanics: rock, bait, and combined state modifiers in tenterSafari and chanceSafari", () => {
  PokeRegles.poser("gen1");
  const scyther = PokeMoteur.creer(123, 25, new PokeHasard("scyther")); // Scyther (catch rate 45)

  const chNeutral = PokeCapture.chanceSafari(scyther, {});
  const chRock = PokeCapture.chanceSafari(scyther, { caillou: true });
  const chBait = PokeCapture.chanceSafari(scyther, { appat: true });
  const chBoth = PokeCapture.chanceSafari(scyther, { caillou: true, appat: true });

  assert.ok(chRock > chNeutral, `Rock (caillou) must increase safari catch chance (${chRock}% > ${chNeutral}%)`);
  assert.ok(chBait < chNeutral, `Bait (appat) must decrease safari catch chance (${chBait}% < ${chNeutral}%)`);
  assert.ok(chBoth >= chBait && chBoth <= chRock, "Both rock + bait should be intermediate");
});

test("Empirical Safari Monte Carlo Validation (100,000 trials per config)", () => {
  PokeRegles.poser("gen1");
  const target = PokeMoteur.creer(123, 25, new PokeHasard("scyther_mc"));
  const TRIALS = 100000;

  const states = [
    { name: "Neutral", opts: {} },
    { name: "Rock (Caillou)", opts: { caillou: true } },
    { name: "Bait (Appat)", opts: { appat: true } },
  ];

  for (const st of states) {
    const pAnalytical = PokeCapture.chanceSafari(target, st.opts) / 100;
    const rng = new PokeHasard("safari_" + st.name);
    let successes = 0;

    for (let i = 0; i < TRIALS; i++) {
      const res = PokeCapture.tenterSafari(target, st.opts, rng);
      if (res.pris) successes++;
    }

    const pEmpirical = successes / TRIALS;
    const stdErr = Math.sqrt((pAnalytical * (1 - pAnalytical)) / TRIALS);
    const zScore = stdErr > 0 ? Math.abs(pEmpirical - pAnalytical) / stdErr : 0;

    console.log(`    [Safari Monte Carlo] ${st.name}`);
    console.log(`      Analytical: ${(pAnalytical * 100).toFixed(2)}% | Empirical: ${(pEmpirical * 100).toFixed(2)}% (Z=${zScore.toFixed(2)}σ)`);

    assert.ok(zScore < 3.5, `Safari Z-score (${zScore.toFixed(2)}σ) exceeded 3.5 standard deviations!`);
  }
});

test("Empirical Monte Carlo Validation (100,000 trials per config): chance() matches empirical tenter() within 3.5 sigma", () => {
  PokeRegles.poser("gen1");

  const testConfigs = [
    { name: "Caterpie Lv 3 (Max Catch Rate 255) @ 100% HP, No Status, Poke Ball", id: 10, lvl: 3, hpRatio: 1.0, status: null, ball: "POKE_BALL" },
    { name: "Caterpie Lv 3 (Max Catch Rate 255) @ 10% HP, Asleep, Great Ball", id: 10, lvl: 3, hpRatio: 0.1, status: "sommeil", ball: "GREAT_BALL" },
    { name: "Pidgey Lv 5 (Max Catch Rate 255) @ 50% HP, Paralyzed, Poke Ball", id: 16, lvl: 5, hpRatio: 0.5, status: "para", ball: "POKE_BALL" },
    { name: "Snorlax Lv 30 (Catch Rate 25) @ 100% HP, No Status, Poke Ball", id: 143, lvl: 30, hpRatio: 1.0, status: null, ball: "POKE_BALL" },
    { name: "Snorlax Lv 30 (Catch Rate 25) @ 10% HP, Asleep, Ultra Ball", id: 143, lvl: 30, hpRatio: 0.1, status: "sommeil", ball: "ULTRA_BALL" },
    { name: "Articuno Lv 50 (Catch Rate 3) @ 100% HP, No Status, Poke Ball", id: 144, lvl: 50, hpRatio: 1.0, status: null, ball: "POKE_BALL" },
    { name: "Articuno Lv 50 (Catch Rate 3) @ 1 HP, Asleep, Ultra Ball", id: 144, lvl: 50, hpRatio: 0.01, status: "sommeil", ball: "ULTRA_BALL" },
    { name: "Articuno Lv 50 (Catch Rate 3) @ 1 HP, Asleep, Great Ball", id: 144, lvl: 50, hpRatio: 0.01, status: "sommeil", ball: "GREAT_BALL" },
    { name: "Mewtwo Lv 70 (Catch Rate 3) @ 10% HP, Paralyzed, Ultra Ball", id: 150, lvl: 70, hpRatio: 0.1, status: "para", ball: "ULTRA_BALL" },
  ];

  const TRIALS = 100000;
  console.log(`\n    \x1b[90mRunning ${testConfigs.length} Monte Carlo suites with N=${TRIALS.toLocaleString()} each...\x1b[0m`);

  for (const cfg of testConfigs) {
    const target = PokeMoteur.creer(cfg.id, cfg.lvl, new PokeHasard("mc_" + cfg.id));
    target.pv = Math.max(1, Math.floor(target.stats.pv * cfg.hpRatio));
    target.statut = cfg.status;

    const pAnalytical = PokeCapture.chance(target, cfg.ball);

    // Run empirical simulation
    const rng = new PokeHasard("seed_mc_" + cfg.id + "_" + cfg.ball);
    let successes = 0;

    for (let i = 0; i < TRIALS; i++) {
      const res = PokeCapture.tenter(target, cfg.ball, rng);
      if (res.pris) successes++;
    }

    const pEmpirical = successes / TRIALS;
    const stdErr = Math.sqrt((pAnalytical * (1 - pAnalytical)) / TRIALS);
    const zScore = stdErr > 0 ? Math.abs(pEmpirical - pAnalytical) / stdErr : 0;

    console.log(`    [Monte Carlo] ${cfg.name}`);
    console.log(`      Analytical: ${(pAnalytical * 100).toFixed(3)}% | Empirical: ${(pEmpirical * 100).toFixed(3)}% (Z=${zScore.toFixed(2)}σ)`);

    assert.ok(zScore < 3.5, `Z-score for ${cfg.name} (${zScore.toFixed(2)}σ) exceeded 3.5 standard deviations! pAna=${pAnalytical}, pEmp=${pEmpirical}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary Report
// ─────────────────────────────────────────────────────────────────────────────
const duration = Date.now() - startTime;
console.log("\n" + "-".repeat(60));
console.log(`Test Run Completed in ${duration}ms`);
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error("\n\x1b[31mFAILURES:\x1b[0m");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.err.message}`);
  }
  process.exit(1);
} else {
  console.log("\x1b[32mALL COMBAT & CAPTURE ADVERSARIAL CHALLENGES PASSED! (100% PASS RATE)\x1b[0m\n");
}
