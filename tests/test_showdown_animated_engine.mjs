import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("\x1b[1m\x1b[36m=== Test Suite: Showdown Animated Sprites Mapper & Offline Proxy ===\x1b[0m\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

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

// Strip comments for static analysis
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n\r]*/g, "");
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

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Module evaluation and exports
// ─────────────────────────────────────────────────────────────────────────────
const spritesScriptPath = "js/poke/sprites-showdown.js";
let ctx;

test("sprites-showdown.js loads and exports W.PokeSpritesShowdown", () => {
  assert.ok(fs.existsSync(path.join(ROOT_DIR, spritesScriptPath)), `File ${spritesScriptPath} must exist`);
  ctx = createIsolatedContext();
  loadScriptInContext(spritesScriptPath, ctx);
  assert.ok(ctx.PokeSpritesShowdown, "PokeSpritesShowdown must be defined on globalThis");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.nomShowdown, "function", "nomShowdown must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.aniFace, "function", "aniFace must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.aniDos, "function", "aniDos must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.repliFace, "function", "repliFace must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.repliDos, "function", "repliDos must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.ani, "function", "ani must be a function");
  assert.strictEqual(typeof ctx.PokeSpritesShowdown.repli, "function", "repli must be a function");
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: All 386 species mapped to valid lowercase alphanumeric Showdown names
// ─────────────────────────────────────────────────────────────────────────────
test("All 386 Pokémon species map to non-empty lowercase alphanumeric strings", () => {
  const S = ctx.PokeSpritesShowdown;
  for (let n = 1; n <= 386; n++) {
    const nom = S.nomShowdown(n);
    assert.ok(nom && typeof nom === "string", `Species #${n} must return a non-empty string`);
    assert.ok(/^[a-z0-9]+$/.test(nom), `Species #${n} (${nom}) must be lowercase alphanumeric`);
    
    // Also test object input { n }
    const nomObj = S.nomShowdown({ n: n });
    assert.strictEqual(nomObj, nom, `nomShowdown({ n: ${n} }) must match nomShowdown(${n})`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Special cases and naming normalization
// ─────────────────────────────────────────────────────────────────────────────
test("Special species cases match Showdown exact identifiers", () => {
  const S = ctx.PokeSpritesShowdown;
  assert.strictEqual(S.nomShowdown(1), "bulbasaur", "#1 should be bulbasaur");
  assert.strictEqual(S.nomShowdown(25), "pikachu", "#25 should be pikachu");
  assert.strictEqual(S.nomShowdown(29), "nidoranf", "#29 Nidoran♀ should be nidoranf");
  assert.strictEqual(S.nomShowdown(32), "nidoranm", "#32 Nidoran♂ should be nidoranm");
  assert.strictEqual(S.nomShowdown(83), "farfetchd", "#83 Farfetch'd should be farfetchd");
  assert.strictEqual(S.nomShowdown(122), "mrmime", "#122 Mr. Mime should be mrmime");
  assert.strictEqual(S.nomShowdown(233), "porygon2", "#233 Porygon2 should be porygon2");
  assert.strictEqual(S.nomShowdown(250), "hooh", "#250 Ho-Oh should be hooh");
  assert.strictEqual(S.nomShowdown(386), "deoxys", "#386 Deoxys should be deoxys");

  // String normalization fallback
  assert.strictEqual(S.nomShowdown("Pikachu"), "pikachu");
  assert.strictEqual(S.nomShowdown("Nidoran♀"), "nidoranf");
  assert.strictEqual(S.nomShowdown("Nidoran♂"), "nidoranm");
  assert.strictEqual(S.nomShowdown("Farfetch'd"), "farfetchd");
  assert.strictEqual(S.nomShowdown("Mr. Mime"), "mrmime");
  assert.strictEqual(S.nomShowdown("Ho-Oh"), "hooh");
  assert.strictEqual(S.nomShowdown("Deoxys"), "deoxys");
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: aniFace and aniDos URL generation (standard and shiny)
// ─────────────────────────────────────────────────────────────────────────────
test("aniFace and aniDos generate correct Showdown GIF CDN URLs", () => {
  const S = ctx.PokeSpritesShowdown;

  // Standard front & back
  assert.strictEqual(
    S.aniFace(25),
    "https://play.pokemonshowdown.com/sprites/ani/pikachu.gif"
  );
  assert.strictEqual(
    S.aniDos(25),
    "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif"
  );

  // Object input without chromatique
  assert.strictEqual(
    S.aniFace({ n: 6 }),
    "https://play.pokemonshowdown.com/sprites/ani/charizard.gif"
  );
  assert.strictEqual(
    S.aniDos({ n: 6 }),
    "https://play.pokemonshowdown.com/sprites/ani-back/charizard.gif"
  );

  // Shiny front & back
  assert.strictEqual(
    S.aniFace({ n: 25, chromatique: true }),
    "https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif"
  );
  assert.strictEqual(
    S.aniDos({ n: 25, chromatique: true }),
    "https://play.pokemonshowdown.com/sprites/ani-back-shiny/pikachu.gif"
  );

  // Special cases URLs
  assert.strictEqual(
    S.aniFace(29),
    "https://play.pokemonshowdown.com/sprites/ani/nidoranf.gif"
  );
  assert.strictEqual(
    S.aniFace(32),
    "https://play.pokemonshowdown.com/sprites/ani/nidoranm.gif"
  );
  assert.strictEqual(
    S.aniFace(83),
    "https://play.pokemonshowdown.com/sprites/ani/farfetchd.gif"
  );
  assert.strictEqual(
    S.aniFace(122),
    "https://play.pokemonshowdown.com/sprites/ani/mrmime.gif"
  );
  assert.strictEqual(
    S.aniFace(250),
    "https://play.pokemonshowdown.com/sprites/ani/hooh.gif"
  );
  assert.strictEqual(
    S.aniFace(386),
    "https://play.pokemonshowdown.com/sprites/ani/deoxys.gif"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Local GBA sprite fallback URLs (repliFace and repliDos)
// ─────────────────────────────────────────────────────────────────────────────
test("repliFace and repliDos generate correct local GBA fallback URLs", () => {
  const S = ctx.PokeSpritesShowdown;

  assert.strictEqual(S.repliFace(25), "assets/img/poke/gen3/face/25.png?i=6");
  assert.strictEqual(S.repliDos(25), "assets/img/poke/gen3/dos/25.png?i=6");

  assert.strictEqual(S.repliFace({ n: 25 }), "assets/img/poke/gen3/face/25.png?i=6");
  assert.strictEqual(S.repliDos({ n: 25 }), "assets/img/poke/gen3/dos/25.png?i=6");

  assert.strictEqual(S.repliFace(386), "assets/img/poke/gen3/face/386.png?i=6");
  assert.strictEqual(S.repliDos(386), "assets/img/poke/gen3/dos/386.png?i=6");
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Directional convenience helpers ani(mon, cote) and repli(mon, cote)
// ─────────────────────────────────────────────────────────────────────────────
test("ani and repli select correct front or back based on cote", () => {
  const S = ctx.PokeSpritesShowdown;

  const mon = { n: 25, chromatique: false };
  const monChroma = { n: 25, chromatique: true };

  // ani helper
  assert.strictEqual(
    S.ani(mon, "joueur"),
    "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif"
  );
  assert.strictEqual(
    S.ani(mon, "adversaire"),
    "https://play.pokemonshowdown.com/sprites/ani/pikachu.gif"
  );
  assert.strictEqual(
    S.ani(monChroma, "joueur"),
    "https://play.pokemonshowdown.com/sprites/ani-back-shiny/pikachu.gif"
  );
  assert.strictEqual(
    S.ani(monChroma, "adversaire"),
    "https://play.pokemonshowdown.com/sprites/ani-shiny/pikachu.gif"
  );

  // repli helper
  assert.strictEqual(S.repli(mon, "joueur"), "assets/img/poke/gen3/dos/25.png?i=6");
  assert.strictEqual(S.repli(mon, "adversaire"), "assets/img/poke/gen3/face/25.png?i=6");
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Static analysis & architecture invariants
// ─────────────────────────────────────────────────────────────────────────────
test("sprites-showdown.js satisfies architectural and NOYAU purity rules", () => {
  const raw = fs.readFileSync(path.join(ROOT_DIR, spritesScriptPath), "utf-8");
  const code = stripComments(raw);

  // Strict mode check
  assert.ok(
    code.includes('"use strict"') || code.includes("'use strict'"),
    "File must include 'use strict'"
  );

  // No DOM leaks
  const forbiddenDOM = [
    /\bdocument\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bnavigator\./,
    /\bwindow\./,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bsetTimeout\s*\(/,
    /\bsetInterval\s*\(/,
    /\bHTMLElement\b/,
  ];
  for (const pat of forbiddenDOM) {
    assert.ok(!pat.test(code), `Forbidden DOM reference found matching ${pat}`);
  }

  // Zero non-deterministic calls
  const forbiddenNonDet = [
    /\bMath\.random\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\b/,
    /\bperformance\.now\s*\(/,
    /\bcrypto\.getRandomValues\s*\(/,
  ];
  for (const pat of forbiddenNonDet) {
    assert.ok(!pat.test(code), `Forbidden non-deterministic call found matching ${pat}`);
  }
});

test("sprites-showdown.js is registered in ordre.js POKE_ORDRE_ECRANS", () => {
  const ordreCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreCtx);
  assert.ok(
    ordreCtx.POKE_ORDRE_ECRANS.includes("js/poke/sprites-showdown.js"),
    "js/poke/sprites-showdown.js must be registered in POKE_ORDRE_ECRANS"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n\x1b[1m\x1b[35m------------------------------------------------------------\x1b[0m`);
console.log(`Total Tests: \x1b[1m${totalTests}\x1b[0m | Passed: \x1b[32m${passedTests}\x1b[0m | Failed: \x1b[31m${failedTests}\x1b[0m`);

if (failedTests > 0) {
  console.log(`\n\x1b[31m\x1b[1mFAILURES:\x1b[0m`);
  for (const { name, err } of failures) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m`);
    console.log(`    ${err.message}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m\x1b[1mALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n`);
  process.exit(0);
}
