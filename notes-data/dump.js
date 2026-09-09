// Dump les globales POKE_* du noyau de Road to Legends en JSON indenté.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const POKE = '/home/hermes-agent/rtl-pokemon/js/poke';
const OUT = '/home/hermes-agent/rtl-pokemon/notes-data';
fs.mkdirSync(OUT, { recursive: true });

// 1) Évaluer ordre.js pour récupérer POKE_ORDRE_NOYAU
const ctx = vm.createContext({ console, URLSearchParams, sessionStorage: {}, location: { search: '', hostname: '127.0.0.1' }, document: { body: { classList: { add() {} } } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(POKE, 'ordre.js'), 'utf8'), ctx, { filename: 'ordre.js' });
const noyau = ctx.POKE_ORDRE_NOYAU;
console.log('NOYAU:', noyau.length, 'fichiers');

// 2) Charger le noyau dans l'ordre
for (const f of noyau) {
  const full = path.join('/home/hermes-agent/rtl-pokemon', f);
  try {
    vm.runInContext(fs.readFileSync(full, 'utf8'), ctx, { filename: f });
  } catch (e) {
    console.log('ERREUR chargement', f, ':', e.message);
  }
}

// 3) Dumper les globales
function replacer(k, v) {
  if (typeof v === 'function') return '[fonction ' + (v.name || 'anonyme') + ']';
  if (v === undefined) return '[undefined]';
  return v;
}
const cles = Object.keys(ctx).filter(k => /^POKE|^Poke/i.test(k)).sort();
for (const c of cles) {
  const val = ctx[c];
  let dump;
  try { dump = JSON.stringify(val, replacer, 1); }
  catch (e) { dump = '[non sérialisable: ' + e.message + ']'; }
  fs.writeFileSync(path.join(OUT, c + '.json'), dump);
  console.log('dumpé', c, '(' + dump.length + ' octets)');
}
