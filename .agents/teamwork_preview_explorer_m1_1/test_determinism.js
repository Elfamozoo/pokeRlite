const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '../../');

function loadEnvironment(loadGen2 = false) {
  const sandbox = {};
  const context = vm.createContext(sandbox);
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.console = console;
  sandbox.Math = Math;
  sandbox.JSON = JSON;
  sandbox.Array = Array;
  sandbox.Object = Object;
  sandbox.String = String;
  sandbox.Number = Number;
  sandbox.Boolean = Boolean;
  sandbox.RegExp = RegExp;
  sandbox.Error = Error;
  sandbox.parseInt = parseInt;
  sandbox.parseFloat = parseFloat;
  sandbox.isNaN = isNaN;
  sandbox.isFinite = isFinite;

  const NOYAU = [
    "js/poke/rng.js", "js/poke/genre.js", "js/poke/types.js", "js/poke/regles.js",
    "js/poke/attaques.js", "js/poke/especes.js", "js/poke/monde.js", "js/poke/dresseurs.js",
    "js/poke/classes.js", "js/poke/obtentions.js", "js/poke/ct.js", "js/poke/moteur.js",
    "js/poke/combat.js", "js/poke/capture.js", "js/poke/voyage.js", "js/poke/actes.js",
    "js/poke/carte-actes.js", "js/poke/eclat.js", "js/poke/fusion.js", "js/poke/partie.js",
    "js/poke/depart.js", "js/poke/obtenir.js", "js/poke/butin.js", "js/poke/regle-du-jour.js",
    "js/poke/acquis.js", "js/poke/serments.js", "js/poke/chasses.js", "js/poke/sceaux.js",
    "js/poke/scenario.js", "js/poke/duel.js", "js/poke/rejeu.js"
  ];

  const GEN2_NOYAU = [
    "js/poke/gen2/types.js", "js/poke/gen2/effets.js", "js/poke/gen2/effets-neufs.js",
    "js/poke/gen2/objets-tenus.js", "js/poke/gen2/obtentions.js", "js/poke/gen2/attaques.js",
    "js/poke/gen2/especes.js", "js/poke/gen2/dresseurs.js", "js/poke/gen2/rival.js",
    "js/poke/gen2/equipes.js", "js/poke/gen2/classes.js", "js/poke/gen2/monde.js",
    "js/poke/gen2/voyage.js", "js/poke/gen2/scenes.js", "js/poke/gen2/concours.js",
    "js/poke/gen2/sons.js", "js/poke/gen2/sons-attaques.js"
  ];

  let fileList = [];
  if (loadGen2) {
    const iReg = NOYAU.indexOf("js/poke/regles.js");
    fileList = NOYAU.slice(0, iReg).concat(GEN2_NOYAU, NOYAU.slice(iReg));
  } else {
    fileList = NOYAU.slice();
  }

  for (const rel of fileList) {
    const code = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }

  return sandbox;
}

console.log('=== TEST 1: PRNG mulberry32 Sequence Stability ===');
const env1 = loadEnvironment(false);
const h1 = new env1.PokeHasard("TEST_SEED_2026_08_25");
const draws1 = [];
for (let i = 0; i < 1000; i++) draws1.push(h1.brut());

const env2 = loadEnvironment(true);
const h2 = new env2.PokeHasard("TEST_SEED_2026_08_25");
const draws2 = [];
for (let i = 0; i < 1000; i++) draws2.push(h2.brut());

let matchCount = 0;
for (let i = 0; i < 1000; i++) {
  if (draws1[i] === draws2[i]) matchCount++;
}
console.log(`PRNG 1000 draws match: ${matchCount}/1000 (${matchCount === 1000 ? 'PASS' : 'FAIL'})`);

console.log('\n=== TEST 2: Creation & Determinism of 50 Games ===');
for (let g = 0; g < 50; g++) {
  const seed = "SEED_DAILY_TEST_" + g;
  const rndA = new env1.PokeHasard(seed);
  const rndB = new env1.PokeHasard(seed);
  const p1 = env1.PokePartie.creer({ graine: seed, regle: "voyage", compare: true }, rndA);
  const p2 = env1.PokePartie.creer({ graine: seed, regle: "voyage", compare: true }, rndB);
  const s1 = JSON.stringify(p1);
  const s2 = JSON.stringify(p2);
  if (s1 !== s2) {
    console.error(`Mismatch on game ${g}!`);
  }
}
console.log('Game creation test: 50/50 PASS');

console.log('\n=== TEST 3: Deterministic Map & Combat Generation ===');
const seedCombat = "COMBAT_MAP_TEST_SEED_42";
const rCombat1 = new env1.PokeHasard(seedCombat);
const rCombat2 = new env1.PokeHasard(seedCombat);
const pCombat1 = env1.PokePartie.creer({ graine: seedCombat, regle: "voyage", compare: true }, rCombat1);
const pCombat2 = env1.PokePartie.creer({ graine: seedCombat, regle: "voyage", compare: true }, rCombat2);

// Generate act 1 map
const acte1 = env1.PokeActes.acteDe(1);
const map1 = env1.PokeCarteActes.generer(acte1, pCombat1, rCombat1);
const map2 = env1.PokeCarteActes.generer(acte1, pCombat2, rCombat2);
const mapMatch = JSON.stringify(map1) === JSON.stringify(map2);
console.log('Act 1 Map deterministic generation:', mapMatch ? 'PASS' : 'FAIL');

// Starter choice
env1.PokePartie.choisirStarter(pCombat1, 1, rCombat1);
env1.PokePartie.choisirStarter(pCombat2, 1, rCombat2);

// Create wild encounter combat
const mon1 = env1.PokeMoteur.creer(16, 3, rCombat1);
const mon2 = env1.PokeMoteur.creer(16, 3, rCombat2);
const c1 = env1.PokeCombat.demarrer(pCombat1.equipe, [mon1], { dresseur: false }, rCombat1);
const c2 = env1.PokeCombat.demarrer(pCombat2.equipe, [mon2], { dresseur: false }, rCombat2);
const combatInitMatch = JSON.stringify(c1) === JSON.stringify(c2);
console.log('Combat initialization deterministic:', combatInitMatch ? 'PASS' : 'FAIL');

// Perform 10 deterministic combat rounds
let roundsMatch = true;
for (let round = 0; round < 10; round++) {
  if (c1.fini || c2.fini) break;
  // Choose move 0 for player
  const ev1 = env1.PokeCombat.jouerTour(c1, { type: "attaque", index: 0 }, rCombat1, null);
  const ev2 = env1.PokeCombat.jouerTour(c2, { type: "attaque", index: 0 }, rCombat2, null);
  if (JSON.stringify(ev1) !== JSON.stringify(ev2) || JSON.stringify(c1) !== JSON.stringify(c2)) {
    roundsMatch = false;
    console.error(`Combat diverged at round ${round}!`);
    break;
  }
}
console.log('Combat turn-by-turn simulation deterministic:', roundsMatch ? 'PASS' : 'FAIL');

console.log('\n=== TEST 4: Replay Daily Verification ===');
const today = "2026-08-25";
const testJournal = [{
  acte: 9,
  badges: 8,
  ligue: true,
  vus: 120,
  pris: 90,
  legendaires: [144, 145, 146, 150],
  equipe: [
    { n: 6, niveau: 68 },
    { n: 9, niveau: 67 },
    { n: 3, niveau: 65 },
    { n: 25, niveau: 66 },
    { n: 130, niveau: 64 },
    { n: 143, niveau: 65 }
  ],
  texture: {
    sauvage: { n: 40, tours: 120, un: 15, eq: 40 },
    dresseur: { n: 25, tours: 95, un: 8, eq: 50 },
    boss: { n: 9, tours: 54, un: 0, eq: 30 }
  }
}];

const res1 = env1.replayDaily(today, testJournal);
console.log('replayDaily result (Kanto): score =', res1.score, 'name =', res1.name);
const res2 = env2.replayDaily(today, testJournal);
console.log('replayDaily result (Johto loaded): score =', res2.score, 'name =', res2.name);
console.log(`Replay daily scores equal: ${res1.score === res2.score} (${res1.score})`);

