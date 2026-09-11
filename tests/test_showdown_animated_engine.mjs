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
  assert.strictEqual(S.nomShowdown("Nidoran ♀"), "nidoranf");
  assert.strictEqual(S.nomShowdown("Nidoran ♂"), "nidoranm");
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

  assert.strictEqual(S.repliFace("25"), "assets/img/poke/gen3/face/25.png?i=6");
  assert.strictEqual(S.repliDos("25"), "assets/img/poke/gen3/dos/25.png?i=6");
  assert.strictEqual(S.repliFace({ n: "25" }), "assets/img/poke/gen3/face/25.png?i=6");
  assert.strictEqual(S.repliDos({ n: "25" }), "assets/img/poke/gen3/dos/25.png?i=6");
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
// Task 2 Tests: Modern Attack FX Canvas Engine (anim-showdown.js)
// ─────────────────────────────────────────────────────────────────────────────
const animScriptPath = "js/poke/anim-showdown.js";

function createMockCanvas(width = 800, height = 480) {
  const drawOps = [];
  const ctx = {
    canvas: null,
    save: () => drawOps.push(["save"]),
    restore: () => drawOps.push(["restore"]),
    clearRect: (x, y, w, h) => drawOps.push(["clearRect", x, y, w, h]),
    fillRect: (x, y, w, h) => drawOps.push(["fillRect", x, y, w, h]),
    strokeRect: (x, y, w, h) => drawOps.push(["strokeRect", x, y, w, h]),
    beginPath: () => drawOps.push(["beginPath"]),
    closePath: () => drawOps.push(["closePath"]),
    moveTo: (x, y) => drawOps.push(["moveTo", x, y]),
    lineTo: (x, y) => drawOps.push(["lineTo", x, y]),
    quadraticCurveTo: (cpx, cpy, x, y) => drawOps.push(["quadraticCurveTo", cpx, cpy, x, y]),
    bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => drawOps.push(["bezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y]),
    ellipse: (x, y, rx, ry, rot, sa, ea) => drawOps.push(["ellipse", x, y, rx, ry, rot, sa, ea]),
    arc: (x, y, r, sa, ea) => drawOps.push(["arc", x, y, r, sa, ea]),
    stroke: () => drawOps.push(["stroke"]),
    fill: () => drawOps.push(["fill"]),
    translate: (x, y) => drawOps.push(["translate", x, y]),
    rotate: (a) => drawOps.push(["rotate", a]),
    scale: (sx, sy) => drawOps.push(["scale", sx, sy]),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: "transparent",
  };
  const canvas = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    style: {},
    className: "",
    getContext: (type) => (type === "2d" ? ctx : null),
  };
  ctx.canvas = canvas;
  return { canvas, ctx, drawOps };
}

function createAnimContext(customProps = {}) {
  let pendingCallbacks = [];
  let currentTime = 0;
  const animCtx = createIsolatedContext({
    devicePixelRatio: 2,
    requestAnimationFrame: (cb) => {
      pendingCallbacks.push(cb);
      return pendingCallbacks.length;
    },
    cancelAnimationFrame: () => {},
    setTimeout: (cb, ms) => {
      pendingCallbacks.push(() => cb());
      return 1;
    },
    clearTimeout: () => {},
    ...customProps,
  });

  const pumpFrames = (frameCount = 10, timeStep = 50) => {
    for (let f = 0; f < frameCount; f++) {
      currentTime += timeStep;
      const currentCbs = pendingCallbacks;
      pendingCallbacks = [];
      for (const cb of currentCbs) {
        cb(currentTime);
      }
    }
  };

  return { animCtx, pumpFrames, getPendingCount: () => pendingCallbacks.length };
}

test("anim-showdown.js loads and exports W.PokeAnimShowdown", () => {
  assert.ok(fs.existsSync(path.join(ROOT_DIR, animScriptPath)), `File ${animScriptPath} must exist`);
  const { animCtx } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  assert.ok(animCtx.PokeAnimShowdown, "PokeAnimShowdown must be defined on globalThis");
  assert.strictEqual(typeof animCtx.PokeAnimShowdown.monter, "function", "monter must be a function");
  assert.strictEqual(typeof animCtx.PokeAnimShowdown.jouerAttaque, "function", "jouerAttaque must be a function");
  assert.strictEqual(typeof animCtx.PokeAnimShowdown.jouerStatAura, "function", "jouerStatAura must be a function");
  assert.strictEqual(typeof animCtx.PokeAnimShowdown.estAttaqueSignature, "function", "estAttaqueSignature must be a function");
});

test("anim-showdown.js is registered in ordre.js in ECRANS right after anim-attaque.js", () => {
  const ordreCtx = createIsolatedContext();
  loadScriptInContext("js/poke/ordre.js", ordreCtx);
  const screens = ordreCtx.POKE_ORDRE_ECRANS;
  assert.ok(screens.includes("js/poke/anim-showdown.js"), "anim-showdown.js must be registered in POKE_ORDRE_ECRANS");
  const idxAnimAttaque = screens.indexOf("js/poke/anim-attaque.js");
  const idxAnimShowdown = screens.indexOf("js/poke/anim-showdown.js");
  assert.ok(idxAnimAttaque >= 0, "anim-attaque.js must exist in POKE_ORDRE_ECRANS");
  assert.ok(idxAnimShowdown > idxAnimAttaque, "anim-showdown.js must come after anim-attaque.js in POKE_ORDRE_ECRANS");

  const rawOrdre = fs.readFileSync(path.join(ROOT_DIR, "js/poke/ordre.js"), "utf-8");
  assert.ok(
    /["']js\/poke\/anim-attaque\.js["'],\s*["']js\/poke\/anim-showdown\.js["']/.test(rawOrdre),
    "anim-showdown.js must be declared in ECRANS immediately after anim-attaque.js"
  );
});

test("monter(hote) creates canvas with proper class, HiDPI scaling, styling, and reuse", () => {
  const { animCtx } = createAnimContext({ devicePixelRatio: 2 });
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  const children = [];
  const fakeDoc = {
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        style: {},
        width: 0,
        height: 0,
        getContext: () => null,
      };
      return el;
    },
  };
  animCtx.document = fakeDoc;

  const mockHote = {
    clientWidth: 600,
    clientHeight: 400,
    children: children,
    querySelector: (sel) => {
      if (sel === "canvas.pk-arene-fx" || sel === ".pk-arene-fx") {
        return children.find((c) => c.className && c.className.includes("pk-arene-fx")) || null;
      }
      return null;
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
  };

  const canvas1 = A.monter(mockHote);
  assert.ok(canvas1, "monter must return the canvas element");
  assert.strictEqual(children.length, 1, "Canvas must be appended to hote");
  assert.ok(canvas1.className.includes("pk-arene-fx"), "Canvas must have pk-arene-fx class");
  // HiDPI check: 600x400 * dpr 2 = 1200x800
  assert.strictEqual(canvas1.width, 1200, "Canvas width must be clientWidth * dpr");
  assert.strictEqual(canvas1.height, 800, "Canvas height must be clientHeight * dpr");
  assert.strictEqual(canvas1.style.position, "absolute");
  assert.strictEqual(canvas1.style.pointerEvents, "none");
  assert.strictEqual(canvas1.style.zIndex, "4");

  // Re-call monter on same hote must reuse existing canvas
  const canvas2 = A.monter(mockHote);
  assert.strictEqual(canvas2, canvas1, "monter must reuse existing canvas instead of creating a second one");
  assert.strictEqual(children.length, 1, "Only one canvas element should exist in hote");
});

test("estAttaqueSignature correctly identifies signature attack keys and objects", () => {
  const { animCtx } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  // Signature moves in French and English
  const signatures = [
    "tonnerre", "Tonnerre", "THUNDERBOLT", "fatal-foudre", "Fatal-Foudre", "THUNDER",
    "surf", "Surf", "SURF", "cascade", "Cascade", "WATERFALL",
    "seisme", "Séisme", "EARTHQUAKE", "ampleur", "Ampleur", "MAGNITUDE",
    "lance-flammes", "Lance-Flammes", "FLAMETHROWER", "deflagration", "Déflagration", "FIRE_BLAST",
    "laser-glace", "Laser Glace", "ICE_BEAM", "blizzard", "Blizzard", "BLIZZARD",
    "tranche", "Tranche", "SLASH", "griffe", "Griffe", "SCRATCH", "morsure", "Morsure", "BITE",
    "psyko", "Psyko", "PSYCHIC_M", "ball-ombre", "Ball'Ombre", "SHADOW_BALL", "vibrobscur", "Vibrobscur", "DARK_PULSE",
  ];

  for (const sig of signatures) {
    assert.strictEqual(A.estAttaqueSignature(sig), true, `Expected ${sig} to be recognized as signature move`);
  }

  // Attack object forms
  assert.strictEqual(A.estAttaqueSignature({ cle: "THUNDERBOLT" }), true);
  assert.strictEqual(A.estAttaqueSignature({ nom: { fr: "Lance-Flammes" } }), true);
  assert.strictEqual(A.estAttaqueSignature({ cle: "SURF" }), true);

  // Generic / non-signature moves
  assert.strictEqual(A.estAttaqueSignature("charge"), false);
  assert.strictEqual(A.estAttaqueSignature("tackle"), false);
  assert.strictEqual(A.estAttaqueSignature("rugissement"), false);
  assert.strictEqual(A.estAttaqueSignature("growl"), false);
  assert.strictEqual(A.estAttaqueSignature("vive-attaque"), false);
  assert.strictEqual(A.estAttaqueSignature("repos"), false);
  assert.strictEqual(A.estAttaqueSignature(null), false);
  assert.strictEqual(A.estAttaqueSignature(undefined), false);
});

test("jouerAttaque dispatches all 7 signature moves and completes via callback", () => {
  const { animCtx, pumpFrames } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  const testMoves = [
    { key: "tonnerre", name: "Tonnerre (Electric Lightning)" },
    { key: "surf", name: "Surf (Tidal Crest Wave)" },
    { key: "seisme", name: "Séisme (Fissure & Debris)" },
    { key: "lance-flammes", name: "Lance-Flammes (Flame Particles)" },
    { key: "laser-glace", name: "Laser Glace (Cryogenic Beam & Crystals)" },
    { key: "tranche", name: "Tranche (Slashing Kinetic Arcs)" },
    { key: "psyko", name: "Psyko (Chromatic Shockwaves)" },
  ];

  for (const { key, name } of testMoves) {
    const { canvas, drawOps } = createMockCanvas(800, 480);
    let cbCalled = false;

    A.jouerAttaque(canvas, key, "joueur", () => {
      cbCalled = true;
    });

    // Pump frames forward past duration (~500ms)
    pumpFrames(12, 50);

    assert.ok(cbCalled, `${name}: callback must be called when animation completes`);
    assert.ok(drawOps.length > 0, `${name}: canvas operations must be executed`);
    
    // Check that clearRect was called at least once (to clear canvas on end)
    const hasClear = drawOps.some((op) => op[0] === "clearRect");
    assert.ok(hasClear, `${name}: clearRect must be called to reset canvas`);
  }
});

test("jouerAttaque procedural fallback handles physical, special, and status moves", () => {
  const { animCtx, pumpFrames } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  const genericMoves = [
    { key: "charge", cat: "physique", desc: "Generic Physical (Thrust + Impact)" },
    { key: "bulles-do", cat: "special", desc: "Generic Special (Beam / Projectile)" },
    { key: "rugissement", cat: "statut", desc: "Generic Status (Concentric Energy Rings)" },
  ];

  for (const { key, cat, desc } of genericMoves) {
    const { canvas, drawOps } = createMockCanvas(800, 480);
    let cbCalled = false;

    A.jouerAttaque(canvas, { cle: key, categorie: cat }, "joueur", () => {
      cbCalled = true;
    });

    pumpFrames(12, 50);

    assert.ok(cbCalled, `${desc}: callback must be invoked`);
    assert.ok(drawOps.length > 0, `${desc}: drawing operations must be performed`);
    const hasClear = drawOps.some((op) => op[0] === "clearRect");
    assert.ok(hasClear, `${desc}: canvas must be cleared upon completion`);
  }
});

test("jouerStatAura handles positive boost (green chevrons) and negative drop (red chevrons)", () => {
  const { animCtx, pumpFrames } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  // Boost (delta > 0)
  {
    const { canvas, ctx, drawOps } = createMockCanvas(800, 480);
    let cbCalled = false;
    A.jouerStatAura(canvas, "joueur", 1, () => {
      cbCalled = true;
    });
    pumpFrames(10, 50);
    assert.ok(cbCalled, "Stat boost: callback must be called");
    assert.ok(drawOps.length > 0, "Stat boost: canvas operations must be executed");
    const hasClear = drawOps.some((op) => op[0] === "clearRect");
    assert.ok(hasClear, "Stat boost: canvas must be cleared");
  }

  // Drop (delta < 0)
  {
    const { canvas, ctx, drawOps } = createMockCanvas(800, 480);
    let cbCalled = false;
    A.jouerStatAura(canvas, "adverse", -1, () => {
      cbCalled = true;
    });
    pumpFrames(10, 50);
    assert.ok(cbCalled, "Stat drop: callback must be called");
    assert.ok(drawOps.length > 0, "Stat drop: canvas operations must be executed");
    const hasClear = drawOps.some((op) => op[0] === "clearRect");
    assert.ok(hasClear, "Stat drop: canvas must be cleared");
  }

  // Zero delta
  {
    const { canvas } = createMockCanvas(800, 480);
    let cbCalled = false;
    A.jouerStatAura(canvas, "joueur", 0, () => {
      cbCalled = true;
    });
    pumpFrames(10, 50);
    assert.ok(cbCalled, "Zero delta: callback must still be invoked safely");
  }
});

test("PokeAnimShowdown headless and mock resilience", () => {
  const { animCtx } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  // monter with null / invalid hote
  assert.doesNotThrow(() => {
    A.monter(null);
  }, "monter(null) must not throw");

  // jouerAttaque with null canvas
  let cb1 = false;
  assert.doesNotThrow(() => {
    A.jouerAttaque(null, "tonnerre", "joueur", () => { cb1 = true; });
  });
  assert.strictEqual(cb1, true, "jouerAttaque with null canvas must invoke callback");

  // jouerAttaque with canvas returning null context
  let cb2 = false;
  assert.doesNotThrow(() => {
    A.jouerAttaque({ getContext: () => null }, "tonnerre", "joueur", () => { cb2 = true; });
  });
  assert.strictEqual(cb2, true, "jouerAttaque with null 2D context must invoke callback");

  // jouerStatAura with null canvas
  let cb3 = false;
  assert.doesNotThrow(() => {
    A.jouerStatAura(null, "joueur", 1, () => { cb3 = true; });
  });
  assert.strictEqual(cb3, true, "jouerStatAura with null canvas must invoke callback");

  // Missing cb argument
  assert.doesNotThrow(() => {
    A.jouerAttaque(null, "tonnerre", "joueur");
    A.jouerStatAura(null, "joueur", 1);
  }, "Missing cb argument must not throw");
});

test("anim-showdown.js satisfies architectural and NOYAU purity rules", () => {
  const raw = fs.readFileSync(path.join(ROOT_DIR, animScriptPath), "utf-8");
  const code = stripComments(raw);

  // Strict mode check
  assert.ok(
    code.includes('"use strict"') || code.includes("'use strict'"),
    "File must include 'use strict'"
  );

  // Zero non-deterministic calls affecting simulation
  const forbiddenNonDet = [
    /\bMath\.random\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\b/,
    /\bcrypto\.getRandomValues\s*\(/,
  ];
  for (const pat of forbiddenNonDet) {
    assert.ok(!pat.test(code), `Forbidden non-deterministic call found matching ${pat}`);
  }
});

test("HiDPI context scaling applies ctx.scale(dpr, dpr) for crisp high-resolution rendering", () => {
  const { animCtx, pumpFrames } = createAnimContext({ devicePixelRatio: 2 });
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  const { canvas, drawOps } = createMockCanvas(800, 480);
  canvas._dpr = 2;

  A.jouerAttaque(canvas, "tonnerre", "joueur");
  pumpFrames(2, 50);

  const scaleOps = drawOps.filter((op) => op[0] === "scale");
  assert.ok(scaleOps.length > 0, "ctx.scale must be called when dpr > 1");
  assert.deepStrictEqual(scaleOps[0], ["scale", 2, 2], "ctx.scale must be called with (dpr, dpr)");
});

test("Concurrent animation overwrite protection cancels existing animation loop on same canvas", () => {
  let cancelled = false;
  const { animCtx, pumpFrames } = createAnimContext({
    cancelAnimationFrame: () => {
      cancelled = true;
    },
  });
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  const { canvas } = createMockCanvas(800, 480);

  // Start animation 1
  A.jouerAttaque(canvas, "tonnerre", "joueur");
  assert.ok(typeof canvas._animCancel === "function", "canvas._animCancel must be installed on canvas");

  // Start animation 2 on same canvas before 1 finishes
  A.jouerAttaque(canvas, "lance-flammes", "joueur");
  assert.strictEqual(cancelled, true, "Previous animation RAF must be cancelled when new animation begins");
});

test("Wave crest direction adapts based on attacker side (joueur vs adverse)", () => {
  const { animCtx, pumpFrames } = createAnimContext();
  loadScriptInContext(animScriptPath, animCtx);
  const A = animCtx.PokeAnimShowdown;

  // Player -> Opponent (left to right)
  const { canvas: c1, drawOps: ops1 } = createMockCanvas(800, 480);
  A.jouerAttaque(c1, "surf", "joueur");
  pumpFrames(4, 50);

  // Opponent -> Player (right to left)
  const { canvas: c2, drawOps: ops2 } = createMockCanvas(800, 480);
  A.jouerAttaque(c2, "surf", "adverse");
  pumpFrames(4, 50);

  // Check arc calls (crest foam arc has different angles for left-to-right vs right-to-left)
  const arcs1 = ops1.filter((op) => op[0] === "arc");
  const arcs2 = ops2.filter((op) => op[0] === "arc");
  assert.ok(arcs1.length > 0 && arcs2.length > 0, "Both surf animations must draw wave arcs");
  // The first arc in each frame is the foam crest arc
  assert.notDeepStrictEqual(arcs1[0], arcs2[0], "Foam crest arc angles must differ based on wave direction");
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
