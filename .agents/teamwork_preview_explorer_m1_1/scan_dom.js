const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');

const NOYAU = [
  "js/poke/rng.js",
  "js/poke/genre.js",
  "js/poke/types.js",
  "js/poke/regles.js",
  "js/poke/attaques.js",
  "js/poke/especes.js",
  "js/poke/monde.js",
  "js/poke/dresseurs.js",
  "js/poke/classes.js",
  "js/poke/obtentions.js",
  "js/poke/ct.js",
  "js/poke/moteur.js",
  "js/poke/combat.js",
  "js/poke/capture.js",
  "js/poke/voyage.js",
  "js/poke/actes.js",
  "js/poke/carte-actes.js",
  "js/poke/eclat.js",
  "js/poke/fusion.js",
  "js/poke/partie.js",
  "js/poke/depart.js",
  "js/poke/obtenir.js",
  "js/poke/butin.js",
  "js/poke/regle-du-jour.js",
  "js/poke/acquis.js",
  "js/poke/serments.js",
  "js/poke/chasses.js",
  "js/poke/sceaux.js",
  "js/poke/scenario.js",
  "js/poke/duel.js",
  "js/poke/rejeu.js",
];

const GEN2_NOYAU = [
  "js/poke/gen2/types.js",
  "js/poke/gen2/effets.js",
  "js/poke/gen2/effets-neufs.js",
  "js/poke/gen2/objets-tenus.js",
  "js/poke/gen2/obtentions.js",
  "js/poke/gen2/attaques.js",
  "js/poke/gen2/especes.js",
  "js/poke/gen2/dresseurs.js",
  "js/poke/gen2/rival.js",
  "js/poke/gen2/equipes.js",
  "js/poke/gen2/classes.js",
  "js/poke/gen2/monde.js",
  "js/poke/gen2/voyage.js",
  "js/poke/gen2/scenes.js",
  "js/poke/gen2/concours.js",
  "js/poke/gen2/sons.js",
  "js/poke/gen2/sons-attaques.js",
];

const allNoyau = [...NOYAU, ...GEN2_NOYAU];

const domPatterns = [
  { name: 'document', regex: /\bdocument\b/ },
  { name: 'localStorage', regex: /\blocalStorage\b/ },
  { name: 'sessionStorage', regex: /\bsessionStorage\b/ },
  { name: 'navigator', regex: /\bnavigator\b/ },
  { name: 'location', regex: /\blocation\b/ },
  { name: 'history', regex: /\bhistory\b/ },
  { name: 'fetch', regex: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { name: 'alert', regex: /\balert\s*\(/ },
  { name: 'confirm', regex: /\bconfirm\s*\(/ },
  { name: 'prompt', regex: /\bprompt\s*\(/ },
  { name: 'setTimeout', regex: /\bsetTimeout\s*\(/ },
  { name: 'setInterval', regex: /\bsetInterval\s*\(/ },
  { name: 'requestAnimationFrame', regex: /\brequestAnimationFrame\s*\(/ },
  { name: 'cancelAnimationFrame', regex: /\bcancelAnimationFrame\s*\(/ },
  { name: 'HTMLElement', regex: /\bHTMLElement\b/ },
  { name: 'Element', regex: /\bElement\b/ },
  { name: 'AudioContext', regex: /\bAudioContext\b/ },
  { name: 'webkitAudioContext', regex: /\bwebkitAudioContext\b/ },
  { name: 'Audio', regex: /\bAudio\b/ },
  { name: 'Image', regex: /\bnew\s+Image\b/ },
  { name: 'window_explicit', regex: /\bwindow\.(?!location)/ }
];

console.log('=== SCANNING NOYAU FOR DOM/BROWSER GLOBALS ===');
for (const rel of allNoyau) {
  const filePath = path.join(rootDir, rel);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    // skip IIFE wrapper line
    if (line.includes('(typeof window !== "undefined" ? window : globalThis)')) return;
    if (line.includes('(function (W)')) return;
    if (line.includes('(window);')) return;

    for (const pat of domPatterns) {
      if (pat.regex.test(line)) {
        console.log(`[DOM LEAK] ${rel}:${idx + 1} (${pat.name}) -> ${trimmed}`);
      }
    }
  });
}
