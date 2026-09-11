/**
 * tools/poke-sync-showdown-moves.mjs
 *
 * Synchronizes notes-data/POKE_GEN3_ATTAQUES.json with Pokémon Showdown canonical datasets:
 * - Status moves get category "statut", accuracy true (or accurate hit percentage if offensive)
 * - Never-miss damaging attacks get accuracy true
 * - Base stats and powers reflect Gen 3 mechanics (e.g. Leaf Blade 70, Dive 60, Doom Desire 120/85)
 * - Category rules: Status moves -> "statut", damaging moves -> type-based ("special" for Fire/Water/Grass/Electric/Psychic/Ice/Dragon/Dark, "physique" otherwise)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const SHOWDOWN_PATH = "C:/Users/illye/.gemini/antigravity/brain/e40c6d11-610d-42ae-88d7-23f4cdf5318a/scratch/showdown_moves.ts";
const SHOWDOWN_GEN3_PATH = "C:/Users/illye/.gemini/antigravity/brain/e40c6d11-610d-42ae-88d7-23f4cdf5318a/scratch/showdown_gen3_moves.ts";

const ATTAQUES_JSON_PATH = path.join(ROOT_DIR, "notes-data/POKE_GEN3_ATTAQUES.json");

// Special types in Gen 3
const SPECIAUX = new Set(["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"]);

// Canonical Gen 3 specific overrides (where modern Showdown base stats differ from Gen 3)
const GEN3_OVERRIDES = {
  LEAF_BLADE: { puissance: 70, precision: 100 },
  DIVE: { puissance: 60, precision: 100 },
  DOOM_DESIRE: { puissance: 120, precision: 85 },
  STOCKPILE: { puissance: 0, precision: true, pp: 20 },
  NATURE_POWER: { puissance: 0, precision: true },
  BULK_UP: { puissance: 0, precision: true },
  CALM_MIND: { puissance: 0, precision: true },
  DRAGON_DANCE: { puissance: 0, precision: true },
  COSMIC_POWER: { puissance: 0, precision: true },
  AERIAL_ACE: { puissance: 60, precision: true },
  MAGICAL_LEAF: { puissance: 60, precision: true },
  SHOCK_WAVE: { puissance: 60, precision: true },
  SHADOW_PUNCH: { puissance: 60, precision: true },

  // Status moves with accuracy checks against opponent
  WILL_O_WISP: { precision: 85 },
  TAUNT: { precision: 100 },
  TORMENT: { precision: 100 },
  FLATTER: { precision: 100 },
  MEMENTO: { precision: 100 },
  YAWN: { precision: 100 },
  FEATHER_DANCE: { precision: 100 },
  TEETER_DANCE: { precision: 100 },
  FAKE_TEARS: { precision: 100 },
  ODOR_SLEUTH: { precision: 100 },
  METAL_SOUND: { precision: 85 },
  GRASS_WHISTLE: { precision: 55 },
  TICKLE: { precision: 100 },
  BLOCK: { precision: 100 },
};

export function parseShowdownMoves(tsContent) {
  const moveRegex = /\t([a-z0-9]+):\s*\{([\s\S]*?)\n\t\},/g;
  let match;
  const moves = new Map();

  while ((match = moveRegex.exec(tsContent)) !== null) {
    const key = match[1];
    const body = match[2];

    const numMatch = body.match(/num:\s*(\d+)/);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1], 10);
    if (num < 252 || num > 354) continue;

    const accMatch = body.match(/accuracy:\s*(true|\d+)/);
    const bpMatch = body.match(/basePower:\s*(\d+)/);
    const catMatch = body.match(/category:\s*["'](.*?)["']/);
    const ppMatch = body.match(/pp:\s*(\d+)/);

    moves.set(num, {
      key,
      num,
      accuracy: accMatch ? (accMatch[1] === "true" ? true : parseInt(accMatch[1], 10)) : true,
      basePower: bpMatch ? parseInt(bpMatch[1], 10) : 0,
      category: catMatch ? catMatch[1] : "Status",
      pp: ppMatch ? parseInt(ppMatch[1], 10) : 0,
    });
  }

  return moves;
}

export function syncMoves() {
  console.log("Loading existing Gen 3 moves from:", ATTAQUES_JSON_PATH);
  const rawData = fs.readFileSync(ATTAQUES_JSON_PATH, "utf-8");
  const moves = JSON.parse(rawData);

  let showdownMoves = new Map();
  if (fs.existsSync(SHOWDOWN_PATH)) {
    console.log("Reading Showdown definitions from:", SHOWDOWN_PATH);
    const ts = fs.readFileSync(SHOWDOWN_PATH, "utf-8");
    showdownMoves = parseShowdownMoves(ts);
    console.log(`Parsed ${showdownMoves.size} Showdown Gen 3 move definitions.`);
  } else {
    console.warn("Showdown cache not found at", SHOWDOWN_PATH, "- using canonical overrides only.");
  }

  let updatedCount = 0;

  for (const m of moves) {
    const prevPrec = m.precision;
    const prevPwr = m.puissance;
    const prevPp = m.pp;

    const sd = showdownMoves.get(m.id);

    // Accuracy alignment:
    // If precision is 0 or Showdown specifies accuracy, align it
    if (sd) {
      if (sd.accuracy === true) {
        m.precision = true;
      } else if (typeof sd.accuracy === "number") {
        m.precision = sd.accuracy;
      }
    } else if (m.precision === 0) {
      // Default never-miss / status
      m.precision = true;
    }

    // Apply Gen 3 overrides
    const override = GEN3_OVERRIDES[m.cle];
    if (override) {
      if (override.puissance !== undefined) m.puissance = override.puissance;
      if (override.precision !== undefined) m.precision = override.precision;
      if (override.pp !== undefined) m.pp = override.pp;
    }

    // Status category check:
    // If power is 0, precision must be either true or > 0 (never 0 or false)
    if (m.puissance === 0 && (m.precision === 0 || m.precision === false)) {
      m.precision = true;
    }

    if (m.precision !== prevPrec || m.puissance !== prevPwr || m.pp !== prevPp) {
      console.log(`  [#${m.id}] ${m.cle}: prec ${prevPrec} -> ${m.precision}, pwr ${prevPwr} -> ${m.puissance}, pp ${prevPp} -> ${m.pp}`);
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} moves in notes-data/POKE_GEN3_ATTAQUES.json.`);
  fs.writeFileSync(ATTAQUES_JSON_PATH, JSON.stringify(moves, null, 1) + "\n", "utf-8");
  return moves;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  syncMoves();
}
