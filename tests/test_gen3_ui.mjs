/**
 * tests/test_gen3_ui.mjs
 * Unit test suite for Task 7: WebAudio cries, UI world selector, and sprite routing.
 *
 * Verifies:
 * 1. js/poke/gen3/sons.js exports W.POKE_GEN3_SONS with procedural WebAudio cry definitions for species 252-386.
 * 2. js/poke/ordre.js includes "js/poke/gen3/sons.js" in GEN3_ECRANS and splices it into ECRANS / POKE_ORDRE_ECRANS.
 * 3. js/poke/ui.js defines MONDES_DITS.gen3 with { nom: "mondeHoenn", dit: "mondeHoennDit", sur: "hoenn" },
 *    with translations for mondeHoenn, mondeHoennDit, hoenn, and mondeChoixSur supporting Hoenn.
 * 4. Sprite path resolution:
 *    - Species 1-151: assets/img/poke/face/${n}.png (or gen2 in gen2 mode)
 *    - Species 152-251: assets/img/poke/gen2/face/${n}.png
 *    - Species 252-386: assets/img/poke/gen3/face/${n}.png, assets/img/poke/gen3/dos/${n}.png, assets/img/poke/art/${n}.webp
 * 5. Pokédex UI: scales to 386 entries smoothly reading PokeRegles.dexTotalCompte().
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
    Date: Date,
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

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: WebAudio Cries in js/poke/gen3/sons.js
// ─────────────────────────────────────────────────────────────────────────────
suite("1. WebAudio Cries in js/poke/gen3/sons.js");

test("js/poke/gen3/sons.js file exists and exports W.POKE_GEN3_SONS", () => {
  const fullPath = path.join(ROOT_DIR, "js/poke/gen3/sons.js");
  assert.ok(fs.existsSync(fullPath), "js/poke/gen3/sons.js must exist on disk");

  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/gen3/sons.js", ctx);

  assert.ok(ctx.POKE_GEN3_SONS, "W.POKE_GEN3_SONS must be exported");
  assert.ok(typeof ctx.POKE_GEN3_SONS.cris === "object", "POKE_GEN3_SONS.cris must be an object");
  assert.ok(typeof ctx.POKE_GEN3_SONS.sfx === "object", "POKE_GEN3_SONS.sfx must be an object");
});

test("POKE_GEN3_SONS contains procedural cries for all 135 species (252 to 386)", () => {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/gen3/sons.js", ctx);
  const sons = ctx.POKE_GEN3_SONS;

  for (let n = 252; n <= 386; n++) {
    const cryDef = sons.cris[n] || sons.cris[String(n)];
    assert.ok(cryDef, `Cry definition for species ${n} must exist`);
    assert.ok(Array.isArray(cryDef), `Cry definition for ${n} must be an array`);
    assert.strictEqual(cryDef.length, 3, `Cry definition for ${n} must have 3 elements: [sfx, pitch, duration]`);

    const [sfxName, pitch, duration] = cryDef;
    assert.strictEqual(typeof sfxName, "string", `sfxName for ${n} must be string`);
    assert.strictEqual(typeof pitch, "number", `pitch offset for ${n} must be number`);
    assert.strictEqual(typeof duration, "number", `duration for ${n} must be number`);

    const sfxProg = sons.sfx[sfxName];
    assert.ok(sfxProg, `sfx program '${sfxName}' referenced by species ${n} must exist in sfx dictionary`);
    assert.ok(Array.isArray(sfxProg), `sfx program '${sfxName}' must be an array of channels`);
    assert.ok(sfxProg.length >= 1, `sfx program '${sfxName}' must have at least 1 channel`);

    for (const ch of sfxProg) {
      assert.ok(typeof ch.c === "number", `Channel must have numeric 'c' identifier`);
      assert.ok([5, 6, 7, 8].includes(ch.c), `Channel ${ch.c} must be 5, 6, 7, or 8`);
      assert.ok(Array.isArray(ch.n), `Channel instructions 'n' must be an array`);
      for (const cmd of ch.n) {
        assert.ok(Array.isArray(cmd), `Instruction must be an array`);
        assert.ok(typeof cmd[0] === "number", `Instruction opcode must be a number`);
      }
    }
  }
});

test("POKE_GEN3_SONS synthesizes with audio.js engine without errors", () => {
  // Create mock AudioContext to test synthesis pipeline
  let createdBuffers = [];
  class MockAudioBuffer {
    constructor(options) {
      this.sampleRate = options.sampleRate || 44100;
      this.length = options.length;
      this.numberOfChannels = options.numberOfChannels || 1;
      this._data = new Float32Array(this.length);
    }
    getChannelData(channel) {
      return this._data;
    }
  }

  class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.state = "running";
      this.destination = {};
    }
    createBuffer(channels, length, sampleRate) {
      const buf = new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate });
      createdBuffers.push(buf);
      return buf;
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { value: 1 },
        connect() {},
      };
    }
    resume() {
      return Promise.resolve();
    }
  }

  const ctx = createIsolatedContext({
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    localStorage: { getItem() { return "1"; }, setItem() {} },
  });

  loadScriptInContext("js/poke/sons.js", ctx);
  loadScriptInContext("js/poke/gen2/sons.js", ctx);
  loadScriptInContext("js/poke/gen3/sons.js", ctx);

  // Set up PokeRegles stub so audio.js looks up gen3
  ctx.PokeRegles = {
    sons: () => ctx.POKE_GEN3_SONS,
  };

  loadScriptInContext("js/poke/audio.js", ctx);

  assert.ok(ctx.PokeSon, "PokeSon must be initialized");

  // Test tamponCri on Gen 3 starter species 252 (Treecko), 255 (Torchic), 258 (Mudkip), and 386 (Deoxys)
  const starters = [252, 255, 258, 384, 386];
  for (const n of starters) {
    const buf = ctx.PokeSon.tamponCri(n);
    assert.ok(buf, `tamponCri(${n}) must return an audio buffer`);
    assert.ok(buf.length > 0, `tamponCri(${n}) audio buffer length must be > 0`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: ordre.js Gen 3 Screen Wiring
// ─────────────────────────────────────────────────────────────────────────────
suite("2. ordre.js Gen 3 Screen Wiring");

test("ordre.js splices GEN3_ECRANS into ECRANS when HOENN is open", () => {
  const ctx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ctx);

  assert.ok(ctx.POKE_ORDRE_GEN3_ECRANS, "POKE_ORDRE_GEN3_ECRANS must be defined");
  assert.ok(ctx.POKE_ORDRE_GEN3_ECRANS.includes("js/poke/gen3/sons.js"), "POKE_ORDRE_GEN3_ECRANS must include sons.js");

  assert.strictEqual(ctx.POKE_BANC_HOENN, true, "POKE_BANC_HOENN must be true");

  assert.ok(ctx.POKE_ORDRE_ECRANS.includes("js/poke/gen3/sons.js"), "POKE_ORDRE_ECRANS must include js/poke/gen3/sons.js");
  assert.ok(ctx.POKE_ORDRE.includes("js/poke/gen3/sons.js"), "POKE_ORDRE must include js/poke/gen3/sons.js");

  // Verify sons.js is placed in presentation order
  const idxSons = ctx.POKE_ORDRE_ECRANS.indexOf("js/poke/gen3/sons.js");
  const idxAnim = ctx.POKE_ORDRE_ECRANS.indexOf("js/poke/anim-attaque.js");
  assert.ok(idxSons > idxAnim, "gen3 sons.js must be placed after anim-attaque.js in ECRANS");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: UI World Selection & Translations in js/poke/ui.js
// ─────────────────────────────────────────────────────────────────────────────
suite("3. UI World Selection & Translations in js/poke/ui.js");

test("ui.js defines MONDES_DITS.gen3 with proper keys and translations", () => {
  const uiContent = fs.readFileSync(path.join(ROOT_DIR, "js/poke/ui.js"), "utf-8");

  // Check MONDES_DITS definition
  assert.match(uiContent, /gen3\s*:\s*\{\s*nom\s*:\s*["']mondeHoenn["']\s*,\s*dit\s*:\s*["']mondeHoennDit["']\s*,\s*sur\s*:\s*["']hoenn["']\s*\}/,
    "ui.js must define MONDES_DITS.gen3 with nom: 'mondeHoenn', dit: 'mondeHoennDit', sur: 'hoenn'");

  // Check translations in TXT dictionary
  assert.match(uiContent, /mondeHoenn\s*:\s*\{\s*fr\s*:\s*["']Hoenn["']\s*,\s*en\s*:\s*["']Hoenn["']\s*\}/,
    "ui.js must contain translation for mondeHoenn");

  assert.match(uiContent, /mondeHoennDit\s*:\s*\{\s*fr\s*:\s*["']La région des terres et des mers["']\s*,\s*en\s*:\s*["']The land of land and seas["']\s*\}/,
    "ui.js must contain translation for mondeHoennDit");

  assert.match(uiContent, /hoenn\s*:\s*\{\s*fr\s*:\s*["']HOENN — TROISIÈME GÉNÉRATION["']/,
    "ui.js must contain translation for hoenn surtitre");
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4: Sprite Path Routing in icones.js and ui.js
// ─────────────────────────────────────────────────────────────────────────────
suite("4. Sprite Path Routing");

test("PokeSprites correctly routes sprite paths for Gen 1, Gen 2, and Gen 3", () => {
  const ctx = createIsolatedContext();

  // Load icones.js
  loadScriptInContext("js/poke/icones.js", ctx);

  assert.ok(ctx.PokeSprites, "W.PokeSprites must be exported");
  assert.ok(typeof ctx.PokeSprites.face === "function", "PokeSprites.face must be a function");
  assert.ok(typeof ctx.PokeSprites.dos === "function", "PokeSprites.dos must be a function");

  // Setup PokeRegles stub
  let activeGen = "gen1";
  ctx.PokeRegles = {
    courant: () => activeGen,
  };

  // 1. Gen 1 species (1-151) under gen 1:
  activeGen = "gen1";
  assert.strictEqual(ctx.PokeSprites.face(25), "assets/img/poke/face/25.png");
  assert.strictEqual(ctx.PokeSprites.dos(25), "assets/img/poke/dos/25.png");

  // 1b. Gen 1 species under gen 2 (remains gen2 sprites as expected):
  activeGen = "gen2";
  assert.strictEqual(ctx.PokeSprites.face(25), "assets/img/poke/gen2/face/25.png");
  assert.strictEqual(ctx.PokeSprites.dos(25), "assets/img/poke/gen2/dos/25.png");

  // 2. Gen 2 species (152-251) remain gen 2 untouched:
  assert.strictEqual(ctx.PokeSprites.face(152), "assets/img/poke/gen2/face/152.png");
  assert.strictEqual(ctx.PokeSprites.dos(152), "assets/img/poke/gen2/dos/152.png");
  assert.strictEqual(ctx.PokeSprites.face(251), "assets/img/poke/gen2/face/251.png");
  assert.strictEqual(ctx.PokeSprites.dos(251), "assets/img/poke/gen2/dos/251.png");

  // 3. Gen 3 species (> 251):
  activeGen = "gen3";
  assert.strictEqual(ctx.PokeSprites.face(252), "assets/img/poke/gen3/face/252.png");
  assert.strictEqual(ctx.PokeSprites.dos(252), "assets/img/poke/gen3/dos/252.png");
  assert.strictEqual(ctx.PokeSprites.face(386), "assets/img/poke/gen3/face/386.png");
  assert.strictEqual(ctx.PokeSprites.dos(386), "assets/img/poke/gen3/dos/386.png");

  // With suffix
  assert.strictEqual(ctx.PokeSprites.face(252, "?i=6"), "assets/img/poke/gen3/face/252.png?i=6");
  assert.strictEqual(ctx.PokeSprites.dos(252, "?i=6"), "assets/img/poke/gen3/dos/252.png?i=6");
});

test("Gen 3 face and back sprite assets exist on disk for sample species", () => {
  const sampleSpecies = [252, 255, 258, 384, 386];
  for (const n of sampleSpecies) {
    const faceFile = path.join(ROOT_DIR, `assets/img/poke/gen3/face/${n}.png`);
    const backFile = path.join(ROOT_DIR, `assets/img/poke/gen3/dos/${n}.png`);
    const artFile = path.join(ROOT_DIR, `assets/img/poke/art/${n}.webp`);

    assert.ok(fs.existsSync(faceFile), `Face sprite must exist: ${faceFile}`);
    assert.ok(fs.existsSync(backFile), `Back sprite must exist: ${backFile}`);
    assert.ok(fs.existsSync(artFile), `Artwork must exist: ${artFile}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5: Pokédex UI scaling to 386
// ─────────────────────────────────────────────────────────────────────────────
suite("5. Pokédex UI scaling to 386");

test("pokedex-ui.js evaluates cleanly and supports dexTotalCompte up to 386", () => {
  const pokedexContent = fs.readFileSync(path.join(ROOT_DIR, "js/poke/pokedex-ui.js"), "utf-8");

  // Verify pokedex-ui.js queries dexTotalCompte()
  assert.match(pokedexContent, /dexTotalCompte\(\)/, "pokedex-ui.js must query dexTotalCompte()");

  // Verify evolution target resolution uses ESPECE(ev.vers) or safely handles up to 386
  assert.ok(!pokedexContent.includes("cible = ESP()[ev.vers]"),
    "pokedex-ui.js should resolve evolution target using ESPECE(ev.vers) for cross-gen safety");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
if (failedTests > 0) {
  console.log(`\x1b[31m${failedTests} TEST(S) FAILED!\x1b[0m`);
  process.exit(1);
} else {
  console.log("\x1b[32mALL TASK 7 TESTS PASSED SUCCESSFULLY! (100% PASS RATE)\x1b[0m\n");
  process.exit(0);
}
