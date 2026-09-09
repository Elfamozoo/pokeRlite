const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const ECRANS = [
  "js/poke/tempo.js",
  "js/poke/icones.js",
  "js/poke/sons.js",
  "js/poke/audio.js",
  "js/poke/animations.js",
  "js/poke/anim-attaque.js",
  "js/poke/progression.js",
  "js/poke/dits-objets.js",
  "js/poke/mesure-arene.js",
  "js/poke/ui-combat.js",
  "js/poke/pokedex-ui.js",
  "js/poke/infobulles.js",
  "js/poke/carte-partage.js",
  "js/poke/classement.js",
  "js/poke/fin.js",
  "js/poke/ui.js",
];

const GEN2_ECRANS = [
  "js/poke/gen2/animations.js",
  "js/poke/gen2/anim-attaque.js",
];

const forbidden = [
  { name: 'Math.random', regex: /Math\.random\s*\(/ },
  { name: 'Date.now', regex: /Date\.now\s*\(/ },
  { name: 'new Date', regex: /new\s+Date\b/ },
  { name: 'Date()', regex: /\bDate\s*\(/ },
  { name: 'performance.now', regex: /performance\.now\s*\(/ },
  { name: 'crypto', regex: /\bcrypto\b/ },
  { name: 'document', regex: /\bdocument\b/ },
  { name: 'window', regex: /\bwindow\b/ },
  { name: 'localStorage', regex: /\blocalStorage\b/ },
  { name: 'sessionStorage', regex: /\bsessionStorage\b/ },
  { name: 'fetch', regex: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { name: 'alert', regex: /\balert\s*\(/ },
  { name: 'confirm', regex: /\bconfirm\s*\(/ },
  { name: 'prompt', regex: /\bprompt\s*\(/ },
  { name: 'setTimeout', regex: /\bsetTimeout\s*\(/ },
  { name: 'setInterval', regex: /\bsetInterval\s*\(/ },
  { name: 'requestAnimationFrame', regex: /\brequestAnimationFrame\s*\(/ },
  { name: 'location', regex: /\blocation\b/ },
  { name: 'navigator', regex: /\bnavigator\b/ }
];

console.log('=== PART 1: FORBIDDEN SYMBOL SCAN IN NOYAU ===');
const allNoyauFiles = [...NOYAU, ...GEN2_NOYAU];

for (const rel of allNoyauFiles) {
  const filePath = path.join(rootDir, rel);
  if (!fs.existsSync(filePath)) {
    console.error('MISSING FILE:', rel);
    continue;
  }
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    // Strip simple // comments for check, but also show original
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      // In comment: only warn if suspicious
      return;
    }
    for (const f of forbidden) {
      if (f.regex.test(line)) {
        console.log(`[FOUND ${f.name}] ${rel}:${idx + 1} -> ${trimmed}`);
      }
    }
  });
}

console.log('\n=== PART 2: VM EVALUATION & DEPENDENCY CHECK (KANTO ONLY) ===');
function testEval(loadGen2 = false) {
  const sandbox = {};
  const context = vm.createContext(sandbox);
  // emulate globalThis / window mapping
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

  let fileList = [];
  if (loadGen2) {
    const iReg = NOYAU.indexOf("js/poke/regles.js");
    fileList = NOYAU.slice(0, iReg).concat(GEN2_NOYAU, NOYAU.slice(iReg));
  } else {
    fileList = NOYAU.slice();
  }

  console.log(`Evaluating ${fileList.length} files (Gen2 = ${loadGen2})...`);
  for (const rel of fileList) {
    const filePath = path.join(rootDir, rel);
    const code = fs.readFileSync(filePath, 'utf8');
    try {
      vm.runInContext(code, context, { filename: rel });
      // console.log(`  OK: ${rel}`);
    } catch (e) {
      console.error(`  FAIL in ${rel}:`, e.message, e.stack);
    }
  }

  const globals = Object.keys(sandbox).filter(k => ![
    'globalThis', 'window', 'console', 'Math', 'JSON', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'RegExp', 'Error', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite'
  ].includes(k));
  console.log(`Exposed globals (${globals.length}):`, globals.join(', '));
  return { sandbox, globals };
}

const kanto = testEval(false);
console.log('\n=== PART 3: VM EVALUATION & DEPENDENCY CHECK (WITH GEN2) ===');
const johto = testEval(true);

