/**
 * tests/test_gen3_combat_talents.mjs
 * Unit test suite for Gen 3 Tactical Combat Engine:
 * - Entrance abilities (INTIMIDATE, DRIZZLE, DROUGHT, SAND_STREAM, TRACE)
 * - Damage calculation abilities (OVERGROW, BLAZE, TORRENT, HUGE_POWER, GUTS, THICK_FAT)
 * - Immunities & absorption abilities (LEVITATE, WONDER_GUARD, VOLT_ABSORB, WATER_ABSORB, FLASH_FIRE, SOUNDPROOF)
 * - Contact & status abilities (STATIC, POISON_POINT, FLAME_BODY, ROUGH_SKIN, SYNCHRONIZE, IMMUNITY, LIMBER, WATER_VEIL, INSOMNIA, OWN_TEMPO)
 * - End of turn abilities & weather (SPEED_BOOST, RAIN_DISH, SHED_SKIN, HAIL, AIR_LOCK)
 * - Gen 3 Held items (CHOICE_BAND, LEFTOVERS, WHITE_HERB, LUM_BERRY)
 * - Cross-generational invariance (Gen 1 & Gen 2 talents are inactive)
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

function mon(ctx, id, lvl = 50, seed = "MON-DEFAULT") {
  const h = new ctx.PokeHasard(seed);
  return ctx.PokeMoteur.creer(id, lvl, h);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: File Existence & Static Constraints
// ─────────────────────────────────────────────────────────────────────────────
suite("1. Gen 3 Held Items File & Registration");

test("js/poke/gen3/objets-tenus.js exists and exports POKE_GEN3_TENUS", () => {
  const ctx = loadFullNoyauContext();
  assert.ok(ctx.POKE_GEN3_TENUS, "POKE_GEN3_TENUS must be defined on window/globalThis");
  assert.strictEqual(typeof ctx.POKE_GEN3_TENUS.boost, "object", "POKE_GEN3_TENUS.boost must be an object");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.boostFacteur, 1.1, "POKE_GEN3_TENUS.boostFacteur must be 1.1");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.leftovers.effet, "HELD_LEFTOVERS");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.choiceBand.effet, "HELD_CHOICE_BAND");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.choiceBand.facteur, 1.5);
  assert.strictEqual(ctx.POKE_GEN3_TENUS.whiteHerb.effet, "HELD_WHITE_HERB");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.quickClaw.effet, "HELD_QUICK_CLAW");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.scopeLens.effet, "HELD_CRITICAL_UP");
  assert.strictEqual(ctx.POKE_GEN3_TENUS.focusBand.effet, "HELD_FOCUS_BAND");
});

test("PokeRegles: talentsActifs() is true only for gen3, false for gen1 and gen2", () => {
  const ctx = loadFullNoyauContext();
  const Regles = ctx.PokeRegles;

  Regles.poser("gen1");
  assert.strictEqual(Regles.talentsActifs(), false, "talentsActifs must be false in Gen 1");

  Regles.poser("gen2");
  assert.strictEqual(Regles.talentsActifs(), false, "talentsActifs must be false in Gen 2");

  Regles.poser("gen3");
  assert.strictEqual(Regles.talentsActifs(), true, "talentsActifs must be true in Gen 3");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: Entrance Abilities (INTIMIDATE, Weather Summons, TRACE)
// ─────────────────────────────────────────────────────────────────────────────
suite("2. Entrance Abilities & Immunity to Stat Drops");

test("INTIMIDATE lowers opponent Attack stage by 1 on entry", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const p1 = mon(ctx, 384, 50, "P1"); // Rayquaza
  const p2 = mon(ctx, 130, 50, "P2"); // Gyarados with INTIMIDATE
  p2.talent = "INTIMIDATE";

  const combat = Combat.demarrer([p1], [p2], { graine: "TEST-INTIMIDATE" });
  assert.strictEqual(combat.joueur.paliers.atk, -1, "Player attack should be lowered by 1 by Intimidate");
});

test("CLEAR_BODY, WHITE_SMOKE and HYPER_CUTTER block INTIMIDATE stat drop", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  // Clear Body (e.g. Metagross #376)
  const pClear = mon(ctx, 376, 50, "CLEAR");
  pClear.talent = "CLEAR_BODY";
  const pIntimidate = mon(ctx, 130, 50, "INTIM");
  pIntimidate.talent = "INTIMIDATE";

  const combat = Combat.demarrer([pClear], [pIntimidate], { graine: "TEST-CLEAR-BODY" });
  assert.strictEqual(combat.joueur.paliers.atk, 0, "Clear Body must prevent Intimidate drop");

  // Hyper Cutter (e.g. Corphish #341)
  const pHyper = mon(ctx, 341, 50, "HYPER");
  pHyper.talent = "HYPER_CUTTER";
  const combat2 = Combat.demarrer([pHyper], [pIntimidate], { graine: "TEST-HYPER-CUTTER" });
  assert.strictEqual(combat2.joueur.paliers.atk, 0, "Hyper Cutter must prevent Attack drop");
});

test("DRIZZLE, DROUGHT, and SAND_STREAM summon weather on entry", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  // Drizzle (Kyogre #382)
  const kyogre = mon(ctx, 382, 50, "KYO");
  kyogre.talent = "DRIZZLE";
  const target = mon(ctx, 25, 50, "T1");
  const combatPluie = Combat.demarrer([kyogre], [target], { graine: "TEST-RAIN" });
  assert.ok(combatPluie.meteo, "Weather should be set");
  assert.strictEqual(combatPluie.meteo.cle, "pluie");

  // Drought (Groudon #383)
  const groudon = mon(ctx, 383, 50, "GROU");
  groudon.talent = "DROUGHT";
  const combatZenith = Combat.demarrer([groudon], [target], { graine: "TEST-SUN" });
  assert.ok(combatZenith.meteo);
  assert.strictEqual(combatZenith.meteo.cle, "zenith");

  // Sand Stream (Tyranitar #248)
  const tyranitar = mon(ctx, 248, 50, "TYRA");
  tyranitar.talent = "SAND_STREAM";
  const combatSable = Combat.demarrer([tyranitar], [target], { graine: "TEST-SAND" });
  assert.ok(combatSable.meteo);
  assert.strictEqual(combatSable.meteo.cle, "sable");
});

test("TRACE copies opponent active talent on entry", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const gardevoir = mon(ctx, 282, 50, "GARD"); // Gardevoir with TRACE
  gardevoir.talent = "TRACE";
  const pikachu = mon(ctx, 25, 50, "PIKA");
  pikachu.talent = "STATIC";

  const combat = Combat.demarrer([gardevoir], [pikachu], { graine: "TEST-TRACE" });
  assert.strictEqual(gardevoir.talent, "STATIC", "Trace should have copied opponent STATIC talent");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: Immunities & Absorption (LEVITATE, WONDER_GUARD, etc.)
// ─────────────────────────────────────────────────────────────────────────────
suite("3. Immunities & Absorptions");

test("LEVITATE grants complete immunity to Ground attacks (EARTHQUAKE)", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const attacker = mon(ctx, 383, 50, "ATK"); // Groudon
  attacker.attaques = [{ cle: "EARTHQUAKE", pp: 10, ppMax: 10 }];

  const defender = mon(ctx, 380, 50, "DEF"); // Latias with LEVITATE
  defender.talent = "LEVITATE";
  const maxPv = defender.pv;

  const combat = Combat.demarrer([attacker], [defender], { graine: "TEST-LEVITATE" });
  const h = new Hasard("TEST-LEVITATE-PRNG");
  const ev = Combat.jouerTour(combat, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });

  assert.strictEqual(defender.pv, maxPv, "Defender with LEVITATE should take zero damage from Earthquake");
  const immuneEv = ev.find(e => e.t === "talentImmunite" && e.talent === "LEVITATE");
  assert.ok(immuneEv, "An event talentImmunite for LEVITATE must be logged");
});

test("WONDER_GUARD blocks non-super-effective damage and permits super-effective damage", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const shedinja = mon(ctx, 292, 20, "SHED");
  shedinja.talent = "WONDER_GUARD";
  shedinja.pv = 1;
  shedinja.attaques = [{ cle: "HARDEN", pp: 30, ppMax: 30 }];

  // 1. Block Water attack (Water Gun)
  const waterAttacker = mon(ctx, 7, 20, "WAT");
  waterAttacker.attaques = [{ cle: "WATER_GUN", pp: 20, ppMax: 20 }];
  const combat1 = Combat.demarrer([waterAttacker], [shedinja], { graine: "TEST-WG-1" });
  const h1 = new Hasard("WG-PRNG-1");
  const ev1 = Combat.jouerTour(combat1, { type: "attaque", index: 0 }, h1, { type: "attaque", index: 0 });

  assert.strictEqual(shedinja.pv, 1, "Water Gun must not damage Shedinja with Wonder Guard");
  const wgEv = ev1.find(e => e.t === "talentGardeMystik");
  assert.ok(wgEv, "Wonder Guard event must be logged");

  // 2. Permit Fire attack (Ember)
  const shedinja2 = mon(ctx, 292, 20, "SHED2");
  shedinja2.talent = "WONDER_GUARD";
  shedinja2.pv = 1;
  shedinja2.attaques = [{ cle: "HARDEN", pp: 30, ppMax: 30 }];
  const fireAttacker = mon(ctx, 4, 20, "FIR");
  fireAttacker.attaques = [{ cle: "EMBER", pp: 20, ppMax: 20 }];
  const combat2 = Combat.demarrer([fireAttacker], [shedinja2], { graine: "TEST-WG-2" });
  const h2 = new Hasard("WG-PRNG-2");
  Combat.jouerTour(combat2, { type: "attaque", index: 0 }, h2, { type: "attaque", index: 0 });

  assert.strictEqual(shedinja2.pv, 0, "Super-effective Ember must KO Shedinja");
});

test("VOLT_ABSORB, WATER_ABSORB and FLASH_FIRE absorb matching elemental moves", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  // Volt Absorb (Lanturn #171)
  const lanturn = mon(ctx, 171, 50, "LAN");
  lanturn.talent = "VOLT_ABSORB";
  lanturn.pv = 100;
  const pika = mon(ctx, 25, 50, "PIK");
  pika.attaques = [{ cle: "THUNDERBOLT", pp: 15, ppMax: 15 }];

  const combatVolt = Combat.demarrer([pika], [lanturn], { graine: "TEST-VA" });
  const h = new Hasard("VA-SEED");
  Combat.jouerTour(combatVolt, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });
  assert.ok(lanturn.pv > 100, "Volt Absorb should heal HP instead of taking damage");

  // Flash Fire (Ninetales #38)
  const ninetales = mon(ctx, 38, 50, "NIN");
  ninetales.talent = "FLASH_FIRE";
  const startPv = ninetales.pv;
  const fireAttacker = mon(ctx, 4, 50, "FIR");
  fireAttacker.attaques = [{ cle: "FLAMETHROWER", pp: 15, ppMax: 15 }];

  const combatFire = Combat.demarrer([fireAttacker], [ninetales], { graine: "TEST-FF" });
  Combat.jouerTour(combatFire, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });
  assert.strictEqual(ninetales.pv, startPv, "Flash Fire should take zero damage from Fire");
  assert.ok(combatFire.adverse.volatils.flashFire, "flashFire volatil flag should be active");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Damage Calculation Abilities (OVERGROW, HUGE_POWER, GUTS, THICK_FAT)
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Damage Modifiers (OVERGROW, HUGE_POWER, GUTS, THICK_FAT, CHOICE_BAND)");

test("OVERGROW / BLAZE / TORRENT boost attack by 1.5x at <= 1/3 HP", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const sceptile = mon(ctx, 254, 50, "SCEP"); // Sceptile with OVERGROW
  sceptile.talent = "OVERGROW";
  const target = mon(ctx, 25, 50, "TAR");

  // Full HP (no boost)
  sceptile.pv = sceptile.stats.pv;
  const dmgFull = Combat.degats(sceptile, target, "MEGA_DRAIN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  // Crisis HP (<= 1/3 max HP)
  sceptile.pv = Math.floor(sceptile.stats.pv / 3);
  const dmgCrisis = Combat.degats(sceptile, target, "MEGA_DRAIN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  assert.ok(dmgCrisis > dmgFull, `Crisis damage (${dmgCrisis}) must be strictly greater than full HP damage (${dmgFull})`);
  const ratio = dmgCrisis / dmgFull;
  assert.ok(ratio >= 1.4 && ratio <= 1.6, `Damage boost should be approximately 1.5x (actual: ${ratio})`);
});

test("HUGE_POWER doubles physical attack and THICK_FAT halves Fire/Ice damage", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const azumarill = mon(ctx, 184, 50, "AZU");
  azumarill.talent = "HUGE_POWER";
  const normalMon = mon(ctx, 184, 50, "AZU");
  normalMon.talent = null;
  const target = mon(ctx, 25, 50, "TAR");

  const dmgNormal = Combat.degats(normalMon, target, "TAKE_DOWN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  const dmgHuge = Combat.degats(azumarill, target, "TAKE_DOWN", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;
  assert.ok(dmgHuge >= dmgNormal * 1.8, `Huge Power should approximately double physical damage (${dmgHuge} vs ${dmgNormal})`);

  // Thick Fat
  const snorlax = mon(ctx, 143, 50, "SNOR");
  snorlax.talent = "THICK_FAT";
  const fireMon = mon(ctx, 4, 50, "FIR");
  const dmgThickFat = Combat.degats(fireMon, snorlax, "FLAMETHROWER", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  const snorlaxNoTalent = mon(ctx, 143, 50, "SNOR2");
  snorlaxNoTalent.talent = null;
  const dmgNoThickFat = Combat.degats(fireMon, snorlaxNoTalent, "FLAMETHROWER", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  assert.ok(dmgThickFat < dmgNoThickFat, `Thick Fat damage (${dmgThickFat}) must be lower than normal damage (${dmgNoThickFat})`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Contact Effects & Status Immunities
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Contact Effects, Status Immunities & Rough Skin");

test("STATIC paralyzes attacker on contact and ROUGH_SKIN deals 1/16 damage", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  // Rough Skin (Sharpedo #319)
  const sharpedo = mon(ctx, 319, 50, "SHARP");
  sharpedo.talent = "ROUGH_SKIN";
  const attacker = mon(ctx, 25, 50, "ATK");
  attacker.attaques = [{ cle: "TACKLE", pp: 35, ppMax: 35 }];
  const startPv = attacker.pv;

  const combat = Combat.demarrer([attacker], [sharpedo], { graine: "TEST-ROUGH-SKIN" });
  const h = new Hasard("ROUGH-SEED");
  Combat.jouerTour(combat, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });

  assert.ok(attacker.pv < startPv, "Attacker should have taken Rough Skin recoil damage on contact");
});

test("Strict status immunities (IMMUNITY, LIMBER, WATER_VEIL, INSOMNIA, OWN_TEMPO)", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const zangoose = mon(ctx, 335, 50, "ZANG");
  zangoose.talent = "IMMUNITY";
  Combat.poserStatut(zangoose, "poison", [], "joueur", null, null);
  assert.strictEqual(zangoose.statut, null, "Immunity talent must prevent poison");

  const limberMon = mon(ctx, 52, 50, "MEOW");
  limberMon.talent = "LIMBER";
  Combat.poserStatut(limberMon, "para", [], "joueur", null, null);
  assert.strictEqual(limberMon.statut, null, "Limber must prevent paralysis");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6: End of Turn, Weather & Air Lock
// ─────────────────────────────────────────────────────────────────────────────
suite("6. End of Turn, Weather (Hail) & Air Lock");

test("SPEED_BOOST increases Speed by 1 stage at end of turn", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Hasard = ctx.PokeHasard;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const ninjask = mon(ctx, 291, 50, "NINJ");
  ninjask.talent = "SPEED_BOOST";
  const dummy = mon(ctx, 25, 50, "DUM");
  dummy.attaques = [{ cle: "TAIL_WHIP", pp: 30, ppMax: 30 }];

  const combat = Combat.demarrer([ninjask], [dummy], { graine: "TEST-TURBO" });
  assert.strictEqual(combat.joueur.paliers.vit, 0);

  const h = new Hasard("SPEED-SEED");
  Combat.jouerTour(combat, { type: "attaque", index: 0 }, h, { type: "attaque", index: 0 });
  assert.strictEqual(combat.joueur.paliers.vit, 1, "Speed Boost must increase speed stage by 1");
});

test("AIR_LOCK negates weather damage and weather multipliers", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const rayquaza = mon(ctx, 384, 50, "RAY");
  rayquaza.talent = "AIR_LOCK";
  const dummy = mon(ctx, 25, 50, "DUM");

  const combat = Combat.demarrer([rayquaza], [dummy], { graine: "TEST-AIRLOCK" });
  combat.meteo = { cle: "sable", reste: 5 };

  // usureMeteo should deal 0 damage because Air Lock is active
  const startPv = dummy.pv;
  const ev = [];
  Combat.usureMeteo(combat, dummy, ev, "adverse");
  assert.strictEqual(dummy.pv, startPv, "Air Lock must prevent sandstorm weather chip damage");
});

test("HAIL deals 1/16 chip damage to non-Ice types and spares Ice types", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const iceMon = mon(ctx, 361, 50, "ICE"); // Snorunt (Ice type)
  const nonIceMon = mon(ctx, 25, 50, "NOICE"); // Pikachu (Electric type)
  const startNonIcePv = nonIceMon.pv;
  const startIcePv = iceMon.pv;

  const combat = Combat.demarrer([iceMon], [nonIceMon], { graine: "TEST-HAIL" });
  combat.meteo = { cle: "grele", reste: 5 };

  const ev = [];
  Combat.usureMeteo(combat, nonIceMon, ev, "adverse");
  assert.ok(nonIceMon.pv < startNonIcePv, "Non-ice type should take hail damage");

  Combat.usureMeteo(combat, iceMon, ev, "joueur");
  assert.strictEqual(iceMon.pv, startIcePv, "Ice type should be immune to hail damage");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7: Gen 3 Held Items (CHOICE_BAND, LEFTOVERS, WHITE_HERB, LUM_BERRY)
// ─────────────────────────────────────────────────────────────────────────────
suite("7. Gen 3 Held Items");

test("CHOICE_BAND boosts physical move damage by 1.5x", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const attacker = mon(ctx, 25, 50, "ATK");
  const target = mon(ctx, 25, 50, "TAR");

  // Without Choice Band
  attacker.objet = null;
  const dmgNormal = Combat.degats(attacker, target, "BODY_SLAM", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  // With Choice Band
  attacker.objet = "CHOICE_BAND";
  const dmgCB = Combat.degats(attacker, target, "BODY_SLAM", { attPaliers: {}, defPaliers: {} }, { brut: () => 0.5, entre: () => 236 }).degats;

  assert.ok(dmgCB > dmgNormal, `Choice Band (${dmgCB}) must deal more damage than unboosted (${dmgNormal})`);
  const ratio = dmgCB / dmgNormal;
  assert.ok(ratio >= 1.4 && ratio <= 1.6, `Choice band boost must be ~1.5x (actual: ${ratio})`);
});

test("LEFTOVERS heals 1/16 HP at end of turn", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const m = mon(ctx, 25, 50, "MON");
  m.objet = "LEFTOVERS";
  m.pv = 50; // Damaged

  const ev = [];
  Combat.usureFinDeTour(m, ev, "joueur", {}, {});
  assert.ok(m.pv > 50, "Leftovers should heal HP");
  assert.strictEqual(m.objet, "LEFTOVERS", "Leftovers is not consumed");
});

test("WHITE_HERB resets negative stages to 0 and is consumed", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const m = mon(ctx, 25, 50, "MON");
  m.objet = "WHITE_HERB";
  const cote = { paliers: { atk: -2, def: 0, vit: -1 } };

  const ev = [];
  Combat.usureFinDeTour(m, ev, "joueur", cote, {});
  assert.strictEqual(cote.paliers.atk, 0, "White herb must reset negative attack palier to 0");
  assert.strictEqual(cote.paliers.vit, 0, "White herb must reset negative speed palier to 0");
  assert.strictEqual(m.objet, null, "White herb must be consumed");
});

test("LUM_BERRY cures status condition & confusion and is consumed", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;
  Regles.poser("gen3");

  const m = mon(ctx, 25, 50, "MON");
  m.objet = "LUM_BERRY";
  m.statut = "brulure";
  const cote = { volatils: { confusion: 3 } };

  const ev = [];
  Combat.usureFinDeTour(m, ev, "joueur", cote, {});
  assert.strictEqual(m.statut, null, "Lum berry must cure burn");
  assert.strictEqual(cote.volatils.confusion, 0, "Lum berry must cure confusion");
  assert.strictEqual(m.objet, null, "Lum berry must be consumed");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8: Cross-Generational Non-Regression (Gen 1 & Gen 2)
// ─────────────────────────────────────────────────────────────────────────────
suite("8. Cross-Generational Non-Regression");

test("Gen 1 and Gen 2 ignore abilities even if assigned on Pokemon object", () => {
  const ctx = loadFullNoyauContext();
  const Combat = ctx.PokeCombat;
  const Regles = ctx.PokeRegles;

  Regles.poser("gen1");
  const p1 = mon(ctx, 130, 50, "P1"); // Gyarados
  p1.talent = "INTIMIDATE";
  const p2 = mon(ctx, 25, 50, "P2");

  const combatGen1 = Combat.demarrer([p1], [p2], { graine: "TEST-G1" });
  assert.strictEqual(combatGen1.adverse.paliers.atk, 0, "Intimidate must NOT trigger in Gen 1");

  Regles.poser("gen2");
  const combatGen2 = Combat.demarrer([p1], [p2], { graine: "TEST-G2" });
  assert.strictEqual(combatGen2.adverse.paliers.atk, 0, "Intimidate must NOT trigger in Gen 2");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error(`\x1b[31m${failedTests} test(s) failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log("\x1b[32mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
  process.exit(0);
}
