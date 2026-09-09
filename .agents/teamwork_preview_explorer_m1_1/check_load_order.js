const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '../../');

function traceLoadOrder(loadGen2 = false) {
  console.log(`\n========================================`);
  console.log(`TRACING LOAD ORDER (loadGen2 = ${loadGen2})`);
  console.log(`========================================`);

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

  const baseGlobals = new Set([
    'globalThis', 'window', 'console', 'Math', 'JSON', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'RegExp', 'Error', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite', 'Date', 'Promise', 'Map', 'Set', 'Symbol', 'Infinity', 'NaN', 'undefined'
  ]);

  const target = {};
  let currentFile = "";
  const missingReads = [];

  const proxy = new Proxy(target, {
    get(t, prop) {
      if (typeof prop === 'string' && !baseGlobals.has(prop)) {
        if (!(prop in t)) {
          missingReads.push({ file: currentFile, prop });
        }
      }
      return t[prop] || globalThis[prop];
    },
    set(t, prop, val) {
      t[prop] = val;
      return true;
    }
  });

  const ctx = vm.createContext(proxy);
  ctx.globalThis = proxy;
  ctx.window = proxy;

  fileList.forEach((rel, idx) => {
    currentFile = rel;
    const code = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    const beforeKeys = Object.keys(target).length;
    vm.runInContext(code, ctx, { filename: rel });
    const afterKeys = Object.keys(target).length;
    // console.log(`[#${idx + 1}] ${rel} -> added ${afterKeys - beforeKeys} globals`);
  });

  console.log(`Top-level missing global reads count: ${missingReads.length}`);
  missingReads.forEach(m => {
    console.log(`  [MISSING AT EVAL TIME] in ${m.file}: accessed W.${m.prop} before it was defined!`);
  });
}

traceLoadOrder(false);
traceLoadOrder(true);
