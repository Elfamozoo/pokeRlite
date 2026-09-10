import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CSS_PATH = path.join(ROOT_DIR, "css", "poke.css");

console.log("\x1b[1m\x1b[36m=== Test Suite: Showdown CSS Design Tokens & Architecture ===\x1b[0m\n");

assert.ok(fs.existsSync(CSS_PATH), "css/poke.css must exist");
const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    throw err;
  }
}

// 1. Surfaces & Backgrounds
runTest("Defines Showdown dark slate surfaces and borders", () => {
  assert.match(cssContent, /--fond:\s*#080c14/, "--fond must be #080c14");
  assert.match(cssContent, /--surface-base:\s*#0f172a/, "--surface-base must be #0f172a");
  assert.match(cssContent, /--surface-carte:\s*#1e293b/, "--surface-carte must be #1e293b");
  assert.match(cssContent, /--surface-survol:\s*#334155/, "--surface-survol must be #334155");
  assert.match(cssContent, /--bordure-nette:\s*#334155/, "--bordure-nette must be #334155");
  assert.match(cssContent, /--bordure-focus:\s*#38bdf8/, "--bordure-focus must be #38bdf8");
  assert.match(cssContent, /--bordure-douce:\s*rgba\(255,\s*255,\s*255,\s*0\.08\)/, "--bordure-douce must be rgba(255, 255, 255, 0.08)");
});

// 2. Elimination of glaring #ffffff surfaces
runTest("Eliminates #ffffff on --sur-fond and maps to dark slate #1e293b", () => {
  assert.doesNotMatch(cssContent, /--sur-fond:\s*#ffffff/, "--sur-fond must NEVER be #ffffff");
  assert.match(cssContent, /--sur-fond:\s*#1e293b/, "--sur-fond must be #1e293b");
});

runTest("Eliminates #ffffff on --arene-ecran and maps to dark slate #0f172a", () => {
  assert.doesNotMatch(cssContent, /--arene-ecran:\s*#ffffff/, "--arene-ecran must NEVER be #ffffff");
  assert.match(cssContent, /--arene-ecran:\s*#0f172a/, "--arene-ecran must be #0f172a");
});

// 3. Typography Tokens
runTest("Defines high contrast typography tokens", () => {
  assert.match(cssContent, /--texte-principal:\s*#f8fafc/, "--texte-principal must be #f8fafc");
  assert.match(cssContent, /--texte-secondaire:\s*#94a3b8/, "--texte-secondaire must be #94a3b8");
  assert.match(cssContent, /--texte-discret:\s*#64748b/, "--texte-discret must be #64748b");
});

// 4. Showdown 18 Canonical Type Tokens
runTest("Defines all 18 official Pokémon Showdown type tokens", () => {
  const types = {
    normal: "#9099a1",
    feu: "#ff9c54",
    eau: "#4f90d5",
    plante: "#63bb5b",
    electrik: "#f3d23b",
    glace: "#74cec0",
    combat: "#ce4069",
    poison: "#ab6ac8",
    sol: "#d97746",
    vol: "#8fa8dd",
    psy: "#f97176",
    insecte: "#90c12c",
    roche: "#c7b78b",
    spectre: "#5269ac",
    dragon: "#096dc4",
    acier: "#5a8fa3",
    tenebres: "#5a5366",
    fee: "#ec8fe6",
  };

  for (const [type, color] of Object.entries(types)) {
    const reg = new RegExp(`--type-${type}:\\s*${color}`, "i");
    assert.match(cssContent, reg, `--type-${type} must be defined with color ${color}`);
  }
});

// 5. Dynamic Health Gradients
runTest("Defines dynamic health bar gradients for green, amber, and red stages", () => {
  assert.match(cssContent, /--hp-haut:\s*linear-gradient\([^;]*#22c55e[^;]*#16a34a[^;]*\)/, "--hp-haut gradient must contain #22c55e and #16a34a");
  assert.match(cssContent, /--hp-moyen:\s*linear-gradient\([^;]*#eab308[^;]*#ca8a04[^;]*\)/, "--hp-moyen gradient must contain #eab308 and #ca8a04");
  assert.match(cssContent, /--hp-critique:\s*linear-gradient\([^;]*#ef4444[^;]*#dc2626[^;]*\)/, "--hp-critique gradient must contain #ef4444 and #dc2626");
});

// 6. Showdown Layout Classes
runTest("Defines .pk-showdown-combat responsive layout container", () => {
  assert.match(cssContent, /\.pk-showdown-combat\s*\{[^}]*max-width:\s*1100px/s, ".pk-showdown-combat must have max-width: 1100px");
});

runTest("Defines .pk-arene-showdown stadium battlefield", () => {
  assert.match(cssContent, /\.pk-arene-showdown\s*\{[^}]*position:\s*relative/s, ".pk-arene-showdown must have position: relative");
  assert.match(cssContent, /\.pk-arene-showdown\s*\{[^}]*height:\s*(?:380px|calc\(|min\()/s, ".pk-arene-showdown must define stadium height");
});

runTest("Defines .pk-arene-socle for opponent and player battle platforms", () => {
  assert.match(cssContent, /\.pk-arene-socle/s, ".pk-arene-socle must exist");
  assert.match(cssContent, /\.pk-arene-socle\[data-cote="adverse"\]|\.pk-arene-socle\.adverse/s, "Adverse platform styling must exist");
  assert.match(cssContent, /\.pk-arene-socle\[data-cote="joueur"\]|\.pk-arene-socle\.joueur/s, "Player platform styling must exist");
});

runTest("Defines .pk-healthbox floating status panels", () => {
  assert.match(cssContent, /\.pk-healthbox\s*\{[^}]*var\(--surface-carte\)/s, ".pk-healthbox must use --surface-carte");
  assert.match(cssContent, /\.pk-healthbox\s*\{[^}]*border-radius:\s*8px/s, ".pk-healthbox must have 8px rounded corners");
});

runTest("Defines .pk-healthbar dynamic bar", () => {
  assert.match(cssContent, /\.pk-healthbar\s*\{[^}]*height:\s*10px/s, ".pk-healthbar must have 10px height");
  assert.match(cssContent, /\.pk-healthbar\s*\{[^}]*transition:/s, ".pk-healthbar must have smooth transition");
});

runTest("Defines .pk-grille-attaques 2x2 grid", () => {
  assert.match(cssContent, /\.pk-grille-attaques\s*\{[^}]*display:\s*grid/s, ".pk-grille-attaques must be display: grid");
  assert.match(cssContent, /\.pk-grille-attaques\s*\{[^}]*grid-template-columns:\s*(?:1fr\s+1fr|repeat\(2,\s*1fr\))/s, ".pk-grille-attaques must have 2 columns");
});

runTest("Defines .pk-attaque-btn move buttons", () => {
  assert.match(cssContent, /\.pk-attaque-btn\s*\{/s, ".pk-attaque-btn must exist");
  assert.match(cssContent, /\.pk-attaque-btn(?:\.|\:|\s|\{)[^}]*cursor:\s*pointer/s, ".pk-attaque-btn must have cursor: pointer");
});

runTest("Defines .pk-battle-log live battle log panel", () => {
  assert.match(cssContent, /\.pk-battle-log\s*\{[^}]*overflow-y:\s*auto/s, ".pk-battle-log must have overflow-y: auto");
  assert.match(cssContent, /\.pk-battle-log\s*\{[^}]*max-height:\s*380px/s, ".pk-battle-log must have max-height: 380px");
});

console.log(`\n\x1b[32mAll ${passed}/${total} Showdown CSS token and layout tests passed successfully!\x1b[0m\n`);
