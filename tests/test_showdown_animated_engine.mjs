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
// Task 3 Tests: Combat UI Integration — Canvas FX, Sprites, Pills & Badges
// ─────────────────────────────────────────────────────────────────────────────

class MockDOMNode {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = new Map();
    this.classes = new Set();
    this._textContent = "";
    this.disabled = false;
    this.listeners = new Map();
    this.dataset = {};
    this.scrollTop = 0;
    this.scrollHeight = 100;

    if (this.tagName === "CANVAS") {
      const mockCanvas = createMockCanvas(800, 480);
      this.width = mockCanvas.canvas.width;
      this.height = mockCanvas.canvas.height;
      this.getContext = mockCanvas.canvas.getContext;
      this._drawOps = mockCanvas.drawOps;
    }

    const styleProps = new Map();
    this.style = new Proxy({}, {
      get: (target, prop) => {
        if (prop === "setProperty") {
          return (k, v) => styleProps.set(k, String(v));
        }
        if (prop === "getPropertyValue") {
          return (k) => styleProps.get(k) || "";
        }
        return styleProps.get(prop) || "";
      },
      set: (target, prop, val) => {
        styleProps.set(prop, String(val));
        return true;
      }
    });
  }

  get clientWidth() { return 800; }
  get clientHeight() { return 480; }
  get offsetWidth() { return 800; }
  get offsetHeight() { return 480; }

  get className() {
    return Array.from(this.classes).join(" ");
  }

  set className(val) {
    this.classes.clear();
    if (val) {
      String(val).trim().split(/\s+/).forEach((c) => c && this.classes.add(c));
    }
  }

  get classList() {
    return {
      add: (...cls) => cls.forEach((c) => c && this.classes.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classes.delete(c)),
      contains: (c) => this.classes.has(c),
      toggle: (c) => {
        if (this.classes.has(c)) {
          this.classes.delete(c);
          return false;
        }
        this.classes.add(c);
        return true;
      }
    };
  }

  getAttribute(name) {
    if (name === "class") return this.className || null;
    if (name === "disabled") return this.disabled ? "" : null;
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, val) {
    if (name === "class") {
      this.className = val;
    } else if (name === "disabled") {
      this.disabled = true;
      this.attrs.set(name, String(val));
    } else {
      this.attrs.set(name, String(val));
    }
  }

  removeAttribute(name) {
    if (name === "class") {
      this.classes.clear();
    } else if (name === "disabled") {
      this.disabled = false;
      this.attrs.delete(name);
    } else {
      this.attrs.delete(name);
    }
  }

  hasAttribute(name) {
    if (name === "class") return this.classes.size > 0;
    if (name === "disabled") return this.disabled;
    return this.attrs.has(name);
  }

  appendChild(child) {
    if (typeof child === "string") {
      const textNode = new MockDOMNode("#text");
      textNode.textContent = child;
      child = textNode;
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newChild, refChild) {
    if (!refChild) return this.appendChild(newChild);
    const idx = this.children.indexOf(refChild);
    if (idx !== -1) {
      newChild.parentNode = this;
      this.children.splice(idx, 0, newChild);
    } else {
      this.appendChild(newChild);
    }
    return newChild;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter((f) => f !== fn));
  }

  click() {
    const list = this.listeners.get("click") || [];
    const ev = { target: this, currentTarget: this, preventDefault: () => {}, stopPropagation: () => {} };
    for (const fn of list) fn(ev);
  }

  get firstChild() {
    return this.children[0] || null;
  }

  set firstChild(val) {
    if (this.children.length === 0) {
      if (val) this.appendChild(val);
    } else {
      this.children[0] = val;
    }
  }

  get textContent() {
    if (this.tagName === "#TEXT") return this._textContent;
    if (this.children.length === 0) return this._textContent;
    return this.children.map((c) => c.textContent).join(" ");
  }

  set textContent(val) {
    this.children.length = 0;
    this._textContent = String(val);
  }

  get innerHTML() {
    return serializeDOM(this);
  }

  set innerHTML(val) {
    this.children.length = 0;
    this._textContent = "";
    if (val) {
      parseHTML(val, this);
    }
  }

  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    const parts = sel.trim().split(/\s+/);
    if (parts.length === 1) {
      queryAllDOM(this, parts[0], results);
    } else {
      let currentSet = [this];
      for (const part of parts) {
        const nextSet = [];
        for (const node of currentSet) {
          queryAllDOM(node, part, nextSet);
        }
        currentSet = nextSet;
      }
      return currentSet;
    }
    return results;
  }
}

function matchesDOMSelector(el, sel) {
  if (!el || el.tagName === "#TEXT") return false;
  let rest = sel.trim();

  const tagMatch = rest.match(/^([a-zA-Z0-9]+)/);
  if (tagMatch) {
    if (el.tagName !== tagMatch[1].toUpperCase()) return false;
    rest = rest.slice(tagMatch[1].length);
  }

  const attrRegex = /\[([a-zA-Z0-9\-_]+)(?:=([\'\"])?([^\'\"\]]+)\2)?\]/g;
  let match;
  while ((match = attrRegex.exec(rest)) !== null) {
    const attrName = match[1];
    const attrVal = match[3];
    if (!el.hasAttribute(attrName)) return false;
    if (attrVal !== undefined && el.getAttribute(attrName) !== attrVal) return false;
  }
  rest = rest.replace(/\[[^\]]+\]/g, "");

  const classMatches = rest.match(/\.([a-zA-Z0-9\-_]+)/g);
  if (classMatches) {
    for (const cm of classMatches) {
      if (!el.classList.contains(cm.slice(1))) return false;
    }
  }

  return true;
}

function queryAllDOM(root, sel, results) {
  for (const child of root.children) {
    if (matchesDOMSelector(child, sel)) {
      results.push(child);
    }
    queryAllDOM(child, sel, results);
  }
}

function serializeDOM(el) {
  if (el.tagName === "#TEXT") return el._textContent;
  let out = "";
  for (const child of el.children) {
    if (child.tagName === "#TEXT") {
      out += child._textContent;
    } else {
      const tag = child.tagName.toLowerCase();
      out += `<${tag}`;
      if (child.className) out += ` class="${child.className}"`;
      for (const [k, v] of child.attrs) {
        if (k !== "class") out += ` ${k}="${v}"`;
      }
      out += `>${serializeDOM(child)}</${tag}>`;
    }
  }
  return out;
}

function parseHTML(html, root) {
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  const stack = [root];
  let m;
  const VOID_TAGS = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK"]);

  while ((m = tagRegex.exec(html)) !== null) {
    if (m[0].startsWith("<!--")) {
      continue;
    } else if (m[2]) {
      const isClosing = !!m[1];
      const tag = m[2].toUpperCase();
      const rawAttrs = m[3] || "";

      if (isClosing) {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName === tag) {
            stack.length = i;
            break;
          }
        }
      } else {
        const node = new MockDOMNode(tag);
        const attrRegex = /([a-zA-Z0-9\-_]+)(?:=([\'\"])(.*?)\2|=([^\s>]+))?/g;
        let am;
        while ((am = attrRegex.exec(rawAttrs)) !== null) {
          const k = am[1];
          const v = am[3] !== undefined ? am[3] : (am[4] !== undefined ? am[4] : "");
          node.setAttribute(k, v);
        }
        const parent = stack[stack.length - 1];
        parent.appendChild(node);
        if (!VOID_TAGS.has(tag) && !rawAttrs.trim().endsWith("/")) {
          stack.push(node);
        }
      }
    } else if (m[4]) {
      const text = m[4];
      if (text.trim()) {
        const textNode = new MockDOMNode("#text");
        textNode._textContent = text;
        stack[stack.length - 1].appendChild(textNode);
      }
    }
  }
}

function createCombatUIContext() {
  const mockDoc = {
    createElement: (tag) => new MockDOMNode(tag),
    createTextNode: (text) => {
      const n = new MockDOMNode("#text");
      n._textContent = text;
      return n;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    body: new MockDOMNode("body"),
  };

  const context = createIsolatedContext({
    document: mockDoc,
    window: null,
    setTimeout: (fn) => { if (fn) fn(); return 1; },
    clearTimeout: () => {},
    devicePixelRatio: 2,
    requestAnimationFrame: (cb) => { if (cb) cb(50); return 1; },
    cancelAnimationFrame: () => {},
  });
  context.window = context;

  loadScriptInContext("js/poke/ordre.js", context);
  for (const f of context.POKE_ORDRE_NOYAU) {
    loadScriptInContext(f, context);
  }
  loadScriptInContext("js/poke/tempo.js", context);
  loadScriptInContext("js/poke/icones.js", context);
  loadScriptInContext("js/poke/sprites-showdown.js", context);
  loadScriptInContext("js/poke/anim-showdown.js", context);
  loadScriptInContext("js/poke/ui-combat.js", context);

  return context;
}

function createTestBattleState(ctx) {
  return {
    joueur: {
      equipe: [
        {
          n: 25,
          nom: "Pikachu",
          niveau: 50,
          pv: 100,
          stats: { pv: 100, atk: 55, def: 40, spe: 50, vit: 90 },
          statut: null,
          dv: { atk: 15, def: 15, spe: 15, vit: 15 },
          attaques: [
            { cle: "THUNDERBOLT", pp: 15, ppMax: 15 },
            { cle: "QUICK_ATTACK", pp: 30, ppMax: 30 },
            { cle: "THUNDER_WAVE", pp: 20, ppMax: 20 },
            { cle: "HEADBUTT", pp: 15, ppMax: 15 }
          ]
        }
      ],
      actif: 0,
      paliers: ctx.PokeCombat ? ctx.PokeCombat.paliersNeufs() : { atk: 0, def: 0, spe: 0, vit: 0, precision: 0, esquive: 0 },
      volatils: {},
      participants: { 0: true }
    },
    adverse: {
      dresseur: true,
      equipe: [
        {
          n: 1,
          nom: "Bulbizarre",
          niveau: 50,
          pv: 100,
          stats: { pv: 100, atk: 49, def: 49, spe: 65, vit: 45 },
          statut: null,
          dv: { atk: 15, def: 15, spe: 15, vit: 15 },
          attaques: [
            { cle: "TACKLE", pp: 35, ppMax: 35 },
            { cle: "VINE_WHIP", pp: 25, ppMax: 25 }
          ]
        }
      ],
      actif: 0,
      paliers: ctx.PokeCombat ? ctx.PokeCombat.paliersNeufs() : { atk: 0, def: 0, spe: 0, vit: 0, precision: 0, esquive: 0 },
      volatils: {},
      participants: { 0: true }
    },
    tour: 0,
    fini: null
  };
}

test("Task 3: Ecran.prototype.monter() mounts <canvas class=\"pk-arene-fx\"> and sets ecran.canvasFx", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });
  const canvas = hote.querySelector("canvas.pk-arene-fx");
  assert.ok(canvas, "Canvas with class 'pk-arene-fx' must be mounted in arena");
  assert.strictEqual(ecran.canvasFx, canvas, "ecran.canvasFx must reference the mounted canvas");
});

test("Task 3: monterCamp renders Showdown animated GIF with onerror fallback to local GBA sprite", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  const imgJoueur = ecran.elJoueur.querySelector("img");
  assert.ok(imgJoueur, "Player combatant must render an <img> sprite");
  const srcJoueur = imgJoueur.getAttribute("src");
  assert.strictEqual(srcJoueur, "https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif", "Player sprite must use Showdown animated back GIF");
  const onerrorJoueur = imgJoueur.getAttribute("onerror");
  assert.ok(onerrorJoueur && onerrorJoueur.includes("this.onerror=null;"), "Player img must have onerror handler clearing itself");
  assert.ok(onerrorJoueur.includes("assets/img/poke/gen3/dos/25.png"), "Player onerror must fallback to local GBA back sprite");

  const imgAdverse = ecran.elAdverse.querySelector("img");
  assert.ok(imgAdverse, "Opponent combatant must render an <img> sprite");
  const srcAdverse = imgAdverse.getAttribute("src");
  assert.strictEqual(srcAdverse, "https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif", "Opponent sprite must use Showdown animated front GIF");
  const onerrorAdverse = imgAdverse.getAttribute("onerror");
  assert.ok(onerrorAdverse && onerrorAdverse.includes("this.onerror=null;"), "Opponent img must have onerror handler");
  assert.ok(onerrorAdverse.includes("assets/img/poke/gen3/face/1.png"), "Opponent onerror must fallback to local GBA front sprite");
});

test("Task 3: rafraichir() renders stat stage pills inside .pk-hb-paliers for non-zero stats (+1 Atk, -1 Def)", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  // Initial: all stages 0, no pills rendered
  const paliersJoueur = ecran.elHbJoueur.querySelector(".pk-hb-paliers");
  assert.ok(paliersJoueur, "Player healthbox must contain .pk-hb-paliers container");
  const pillsInit = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsInit.length, 0, "Neutral 0 stat stages must not render any pills");

  // Modify stages: Player has Atk +2, Def -1, Vit 0
  etat.joueur.paliers.atk = 2;
  etat.joueur.paliers.def = -1;
  etat.joueur.paliers.vit = 0;

  // Opponent has Def +1, Vit -2
  etat.adverse.paliers.def = 1;
  etat.adverse.paliers.vit = -2;

  ecran.rafraichir();

  const pillsJoueur = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsJoueur.length, 2, "Player should have exactly 2 pills for non-zero stages");

  const pillAtk = pillsJoueur[0];
  assert.ok(pillAtk.classList.contains("est-hausse"), "Positive stat stage must have .est-hausse class");
  assert.match(pillAtk.textContent, /\+2\s*(ATQ|ATK)/i, "Pill must display '+2 ATQ/ATK'");

  const pillDef = pillsJoueur[1];
  assert.ok(pillDef.classList.contains("est-baisse"), "Negative stat stage must have .est-baisse class");
  assert.match(pillDef.textContent, /\-1\s*(DÉF|DEF)/i, "Pill must display '-1 DÉF/DEF'");

  const paliersAdverse = ecran.elHbAdverse.querySelector(".pk-hb-paliers");
  assert.ok(paliersAdverse, "Opponent healthbox must contain .pk-hb-paliers container");
  const pillsAdv = paliersAdverse.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsAdv.length, 2, "Opponent should have exactly 2 pills for non-zero stages");
  assert.ok(pillsAdv[0].classList.contains("est-hausse"), "Def +1 must be .est-hausse");
  assert.match(pillsAdv[0].textContent, /\+1\s*(DÉF|DEF)/i, "Opponent Def +1 pill");
  assert.ok(pillsAdv[1].classList.contains("est-baisse"), "Vit -2 must be .est-baisse");
  assert.match(pillsAdv[1].textContent, /\-2\s*(VIT|SPD)/i, "Opponent Vit -2 pill");

  // Gen 2/3 Special stats (sat, sde)
  etat.joueur.paliers.sat = 2;
  etat.joueur.paliers.sde = -1;
  ecran.rafraichir();

  const pillsJoueurGen3 = paliersJoueur.querySelectorAll(".pk-palier-pill");
  assert.strictEqual(pillsJoueurGen3.length, 4, "Player should have 4 pills including sat and sde");
  const pillSat = pillsJoueurGen3[2];
  assert.ok(pillSat.classList.contains("est-hausse"), "sat +2 must be .est-hausse");
  assert.match(pillSat.textContent, /\+2\s*SpA/i, "sat pill must display '+2 SpA'");
  const pillSde = pillsJoueurGen3[3];
  assert.ok(pillSde.classList.contains("est-baisse"), "sde -1 must be .est-baisse");
  assert.match(pillSde.textContent, /\-1\s*SpD/i, "sde pill must display '-1 SpD'");
});

test("Task 3: Move buttons in .pk-grille-attaques display live effectiveness badge (.pk-attaque-efficacite)", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  // Opponent is Bulbizarre (Plante / Poison)
  // Move 0: Tonnerre (Électrik) -> 0.5x on Plant -> .est-peu with ×½
  // Move 1: Vive-Attaque (Normal) -> 1.0x -> neutral, no badge
  // Move 2: Cage-Éclair (Status) -> .est-statut with STAT
  const boutons = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  assert.strictEqual(boutons.length, 4, "Must render 4 move buttons");

  const badge0 = boutons[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badge0, "Move 0 (Tonnerre vs Plant/Poison) must have .pk-attaque-efficacite badge");
  assert.ok(badge0.classList.contains("est-peu"), "0.5x multiplier must have class .est-peu");
  assert.match(badge0.textContent, /×½|×0\.5/, "0.5x multiplier badge text must be ×½");

  const badge1 = boutons[1].querySelector(".pk-attaque-efficacite");
  assert.ok(!badge1 || badge1.textContent.trim() === "", "Neutral 1x offensive move has no badge");

  const badge2 = boutons[2].querySelector(".pk-attaque-efficacite");
  assert.ok(badge2, "Status move (Cage-Éclair) must have .pk-attaque-efficacite badge");
  assert.ok(badge2.classList.contains("est-statut"), "Status move must have class .est-statut");
  assert.strictEqual(badge2.textContent.trim(), "STAT", "Status move badge text must be STAT");

  // Switch opponent to Water/Flying (e.g. Léviator #130) -> 4x multiplier
  etat.adverse.equipe[0] = {
    n: 130,
    nom: "Leviator",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 125, def: 79, spe: 100, vit: 81 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsLev = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeLev = boutonsLev[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeLev, "Tonnerre vs Leviator (Water/Flying) must render badge");
  assert.ok(badgeLev.classList.contains("est-super"), "4x multiplier must have class .est-super");
  assert.match(badgeLev.textContent, /×4/, "4x multiplier badge text must be ×4");

  // Switch opponent to Ground/Rock (e.g. Racaillou #74) -> 0x multiplier
  etat.adverse.equipe[0] = {
    n: 74,
    nom: "Racaillou",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 80, def: 100, spe: 30, vit: 20 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsRac = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeRac = boutonsRac[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeRac, "Tonnerre vs Racaillou (Rock/Ground) must render badge");
  assert.ok(badgeRac.classList.contains("est-inutile"), "0x multiplier must have class .est-inutile");
  assert.match(badgeRac.textContent, /×0/, "0x multiplier badge text must be ×0");

  // Switch opponent to Pure Water (e.g. Carapuce #7) -> 2x multiplier
  etat.adverse.equipe[0] = {
    n: 7,
    nom: "Carapuce",
    niveau: 50,
    pv: 100,
    stats: { pv: 100, atk: 48, def: 65, spe: 50, vit: 43 },
    statut: null,
    attaques: [{ cle: "TACKLE", pp: 35, ppMax: 35 }]
  };
  ecran.menuAttaques();
  const boutonsCara = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeCara = boutonsCara[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeCara, "Tonnerre vs Carapuce (Water) must render badge");
  assert.ok(badgeCara.classList.contains("est-super"), "2x multiplier must have class .est-super");
  assert.match(badgeCara.textContent, /×2/, "2x multiplier badge text must be ×2");

  // Transformed types (typesForces) via Conversion / Morphing
  // Give Carapuce typesForces = ["ground"] -> Tonnerre becomes ineffective (0x)
  etat.adverse.equipe[0].typesForces = ["ground"];
  ecran.menuAttaques();
  const boutonsTrans = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeTrans = boutonsTrans[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeTrans, "Tonnerre vs typesForces=['ground'] must render badge");
  assert.ok(badgeTrans.classList.contains("est-inutile"), "0x multiplier on typesForces must have class .est-inutile");
  assert.match(badgeTrans.textContent, /×0/, "Badge text must be ×0 for typesForces ground");

  // Change typesForces to ["water", "flying"] -> Tonnerre becomes 4x super effective
  etat.adverse.equipe[0].typesForces = ["water", "flying"];
  ecran.menuAttaques();
  const boutonsTrans4 = hote.querySelectorAll(".pk-grille-attaques .pk-attaque-btn");
  const badgeTrans4 = boutonsTrans4[0].querySelector(".pk-attaque-efficacite");
  assert.ok(badgeTrans4, "Tonnerre vs typesForces=['water','flying'] must render badge");
  assert.ok(badgeTrans4.classList.contains("est-super"), "4x multiplier on typesForces must have class .est-super");
  assert.match(badgeTrans4.textContent, /×4/, "Badge text must be ×4 for typesForces water/flying");
});

test("Task 3: Stat change events trigger PokeAnimShowdown.jouerStatAura", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  let auraCalls = [];
  const origJouerStatAura = ctx.PokeAnimShowdown.jouerStatAura;
  ctx.PokeAnimShowdown.jouerStatAura = function (canvas, cote, delta, cb) {
    auraCalls.push({ canvas, cote, delta });
    if (typeof cb === "function") cb();
  };

  // Stat boost event
  ecran.animer({ t: "palier", cote: "joueur", stat: "atk", delta: 1 });
  assert.strictEqual(auraCalls.length, 1, "Stat boost must trigger jouerStatAura");
  assert.strictEqual(auraCalls[0].cote, "joueur");
  assert.strictEqual(auraCalls[0].delta, 1);
  assert.strictEqual(auraCalls[0].canvas, ecran.canvasFx);

  // Stat drop event
  ecran.animer({ t: "palier", cote: "adverse", stat: "def", delta: -1 });
  assert.strictEqual(auraCalls.length, 2, "Stat drop must trigger jouerStatAura");
  assert.strictEqual(auraCalls[1].cote, "adverse");
  assert.strictEqual(auraCalls[1].delta, -1);

  // Blocked stat change must not trigger aura
  ecran.animer({ t: "palier", cote: "joueur", stat: "atk", delta: 1, bloque: true });
  assert.strictEqual(auraCalls.length, 2, "Blocked stat change must NOT trigger jouerStatAura");

  ctx.PokeAnimShowdown.jouerStatAura = origJouerStatAura;
});

test("Task 3: animationDe hooks PokeAnimShowdown.jouerAttaque when PokeAnimShowdown is available", () => {
  const ctx = createCombatUIContext();
  const Ecran = ctx.PokeUICombat.Ecran;
  const hote = new MockDOMNode("div");
  const etat = createTestBattleState(ctx);

  const ecran = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 900 });

  let attackCalls = [];
  const origJouerAttaque = ctx.PokeAnimShowdown.jouerAttaque;
  ctx.PokeAnimShowdown.jouerAttaque = function (canvas, att, cote, cb) {
    attackCalls.push({ canvas, att, cote });
    if (typeof cb === "function") cb();
  };

  const anim = ecran.animationDe({
    premier: true,
    ev: { t: "utilise", attaque: "THUNDERBOLT", cote: "joueur" }
  });

  assert.ok(anim, "animationDe must return an animation descriptor");
  assert.strictEqual(typeof anim.jouer, "function", "anim.jouer must be a function");
  assert.ok(typeof anim.duree === "number" && anim.duree > 0, "anim.duree must be positive number");

  const promise = anim.jouer();
  assert.ok(promise && typeof promise.then === "function", "anim.jouer() must return a Promise");
  assert.strictEqual(attackCalls.length, 1, "jouerAttaque must be called");
  assert.strictEqual(attackCalls[0].att, "THUNDERBOLT");
  assert.strictEqual(attackCalls[0].cote, "joueur");
  assert.strictEqual(attackCalls[0].canvas, ecran.canvasFx);

  // Defensive check: when PokeAnimShowdown.jouerAttaque is missing, animationDe falls back cleanly
  ctx.PokeAnimShowdown.jouerAttaque = null;
  const animNoAtt = ecran.animationDe({
    premier: true,
    ev: { t: "utilise", attaque: "THUNDERBOLT", cote: "joueur" }
  });
  assert.strictEqual(animNoAtt, null, "animationDe without jouerAttaque falls back cleanly");
  ctx.PokeAnimShowdown.jouerAttaque = origJouerAttaque;

  // Auto-player fast rhythm (< 0.2, i.e. rythme < 180) skips animation
  const ecranFast = new Ecran(hote, etat, { hasard: new ctx.PokeHasard(1), rythme: 100 });
  const animFast = ecranFast.animationDe({
    premier: true,
    ev: { t: "utilise", attaque: "THUNDERBOLT", cote: "joueur" }
  });
  assert.strictEqual(animFast, null, "animationDe skips animation when rhythm is under 0.2 (auto-player)");
});

test("Task 3: CSS rules for .pk-arene-fx, .pk-hb-paliers, .pk-palier-pill, and .pk-attaque-efficacite exist in css/poke.css", () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, "css/poke.css"), "utf-8");
  assert.match(css, /\.pk-arene-fx\b/, "Must define .pk-arene-fx in poke.css");
  assert.match(css, /\.pk-hb-paliers\b/, "Must define .pk-hb-paliers in poke.css");
  assert.match(css, /\.pk-palier-pill\b/, "Must define .pk-palier-pill in poke.css");
  assert.match(css, /\.pk-palier-pill\.est-hausse\b/, "Must define .pk-palier-pill.est-hausse in poke.css");
  assert.match(css, /\.pk-palier-pill\.est-baisse\b/, "Must define .pk-palier-pill.est-baisse in poke.css");
  assert.match(css, /\.pk-attaque-efficacite\b/, "Must define .pk-attaque-efficacite in poke.css");
  assert.match(css, /\.pk-attaque-efficacite\.est-super\b/, "Must define .pk-attaque-efficacite.est-super in poke.css");
  assert.match(css, /\.pk-attaque-efficacite\.est-peu\b/, "Must define .pk-attaque-efficacite.est-peu in poke.css");
  assert.match(css, /\.pk-attaque-efficacite\.est-inutile\b/, "Must define .pk-attaque-efficacite.est-inutile in poke.css");
  assert.match(css, /\.pk-attaque-efficacite\.est-statut\b/, "Must define .pk-attaque-efficacite.est-statut in poke.css");
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

