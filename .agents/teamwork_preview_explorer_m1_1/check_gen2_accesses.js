const fs = require('fs');
const path = require('path');

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

console.log('=== CHECKING GEN2 ACCESSES IN KANTO NOYAU ===');
NOYAU.forEach(rel => {
  const code = fs.readFileSync(path.join(rootDir, rel), 'utf8');
  const lines = code.split('\n');
  lines.forEach((l, i) => {
    const trimmed = l.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    if (l.includes('GEN2') || l.includes('Gen2') || l.includes('gen2')) {
      console.log(`${rel}:${i + 1} -> ${trimmed}`);
    }
  });
});
