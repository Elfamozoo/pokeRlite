const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '../../');

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

const ECRANS = [
  "js/poke/tempo.js", "js/poke/icones.js", "js/poke/sons.js", "js/poke/audio.js",
  "js/poke/animations.js", "js/poke/anim-attaque.js", "js/poke/progression.js",
  "js/poke/dits-objets.js", "js/poke/mesure-arene.js", "js/poke/ui-combat.js",
  "js/poke/pokedex-ui.js", "js/poke/infobulles.js", "js/poke/carte-partage.js",
  "js/poke/classement.js", "js/poke/fin.js", "js/poke/ui.js"
];

console.log('=== CHECKING EXTERNAL ECRANS REFERENCES IN NOYAU ===');
const allNoyau = [...NOYAU, ...GEN2_NOYAU];

const ecransGlobals = [
  'PokeTempo', 'PokeIcones', 'PokeSons', 'PokeAudio', 'PokeAnimations',
  'PokeAnimAttaque', 'PokeProgression', 'PokeDitsObjets', 'PokeMesureArene',
  'PokeUICombat', 'PokePokedexUI', 'PokeInfobulles', 'PokeCartePartage',
  'PokeClassement', 'PokeFin', 'PokeUI'
];

allNoyau.forEach(rel => {
  const code = fs.readFileSync(path.join(rootDir, rel), 'utf8');
  const lines = code.split('\n');
  lines.forEach((l, i) => {
    const trimmed = l.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    ecransGlobals.forEach(eg => {
      if (l.includes(eg)) {
        console.log(`[ECRANS REF IN NOYAU] ${rel}:${i + 1} (${eg}) -> ${trimmed}`);
      }
    });
  });
});
