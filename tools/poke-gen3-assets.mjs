#!/usr/bin/env node
/**
 * tools/poke-gen3-assets.mjs
 * Downloads Gen 3 Emerald sprites for species 1-251 and all Gen 3 trainer sprites.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const faceDir = path.join(ROOT_DIR, "assets", "img", "poke", "gen3", "face");
const dosDir = path.join(ROOT_DIR, "assets", "img", "poke", "gen3", "dos");
const dresseurDir = path.join(ROOT_DIR, "assets", "img", "poke", "gen3", "dresseur");

fs.mkdirSync(faceDir, { recursive: true });
fs.mkdirSync(dosDir, { recursive: true });
fs.mkdirSync(dresseurDir, { recursive: true });

async function pool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

// 1. Pokémon Sprites 1..251
const POKE_IDS = Array.from({ length: 251 }, (_, i) => i + 1);

console.log("=== Downloading Gen 3 Emerald Pokémon Sprites (1 to 251) ===");
let pokeDownloaded = 0;
await pool(POKE_IDS, 12, async (id) => {
  const faceFile = path.join(faceDir, `${id}.png`);
  if (!fs.existsSync(faceFile) || fs.statSync(faceFile).size === 0) {
    try {
      let r = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/${id}.png`);
      if (!r.ok) {
        r = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${id}.png`);
      }
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(faceFile, buf);
        pokeDownloaded++;
      }
    } catch (e) {
      console.error(`Error downloading face #${id}:`, e.message);
    }
  }

  const dosFile = path.join(dosDir, `${id}.png`);
  if (!fs.existsSync(dosFile) || fs.statSync(dosFile).size === 0) {
    try {
      let r = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/back/${id}.png`);
      if (!r.ok) {
        r = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/back/${id}.png`);
      }
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(dosFile, buf);
      }
    } catch (e) {
      console.error(`Error downloading dos #${id}:`, e.message);
    }
  }
});
console.log(`✓ Pokémon sprites 1-251 ready. Downloaded: ${pokeDownloaded}`);

// 2. Trainer Sprites from pret/pokeemerald
const TRAINERS_MAP = {
  // Arenes
  "arene1.png": "leader_roxanne.png",
  "arene2.png": "leader_brawly.png",
  "arene3.png": "leader_wattson.png",
  "arene4.png": "leader_flannery.png",
  "arene5.png": "leader_norman.png",
  "arene6.png": "leader_winona.png",
  "arene7.png": "leader_tate_and_liza.png",
  "arene8.png": "leader_juan.png",
  // Conseil
  "conseil1.png": "elite_four_sidney.png",
  "conseil2.png": "elite_four_phoebe.png",
  "conseil3.png": "elite_four_glacia.png",
  "conseil4.png": "elite_four_drake.png",
  // Maitre & Boss
  "maitre.png": "champion_wallace.png",
  "steven.png": "steven.png",
  // Rivals & Allies
  "brendan.png": "brendan.png",
  "may.png": "may.png",
  "wally.png": "wally.png",
  // Route Classes
  "youngster.png": "youngster.png",
  "lass.png": "lass.png",
  "bug_catcher.png": "bug_catcher.png",
  "rich_boy.png": "rich_boy.png",
  "lady.png": "lady.png",
  "triathlete.png": "running_triathlete_m.png",
  "aroma_lady.png": "aroma_lady.png",
  "pokemon_ranger.png": "pokemon_ranger_m.png",
  "collector.png": "collector.png",
  "ninja_boy.png": "ninja_boy.png",
  "parasol_lady.png": "parasol_lady.png",
  "sailor.png": "sailor.png",
  "fisherman.png": "fisherman.png",
  "hiker.png": "hiker.png",
  "swimmer_m.png": "swimmer_m.png",
  "swimmer_f.png": "swimmer_f.png",
  "team_aqua.png": "aqua_grunt_m.png",
  "team_magma.png": "magma_grunt_m.png",
  "expert.png": "expert_m.png",
  "cooltrainer_m.png": "cooltrainer_m.png",
  "cooltrainer_f.png": "cooltrainer_f.png",
  "psychic.png": "psychic_m.png",
  "black_belt.png": "black_belt.png",
  "guitarist.png": "guitarist.png",
  "bird_keeper.png": "bird_keeper.png",
  "battle_girl.png": "battle_girl.png",
  "gentleman.png": "gentleman.png",
  "beauty.png": "beauty.png",
  "ruin_maniac.png": "ruin_maniac.png",
  "pokemaniac.png": "pokemaniac.png",
  "hex_maniac.png": "hex_maniac.png",
  "dragon_tamer.png": "dragon_tamer.png",
  "tuber.png": "tuber_m.png",
  "kindler.png": "kindler.png",
  "twins.png": "twins.png",
  "camper.png": "camper.png",
  "picnicker.png": "picnicker.png"
};

console.log("=== Downloading Gen 3 Emerald Trainer Sprites ===");
let trainersDownloaded = 0;
const trainerEntries = Object.entries(TRAINERS_MAP);
await pool(trainerEntries, 8, async ([targetName, sourceName]) => {
  const targetFile = path.join(dresseurDir, targetName);
  if (!fs.existsSync(targetFile) || fs.statSync(targetFile).size === 0) {
    try {
      const url = `https://raw.githubusercontent.com/pret/pokeemerald/master/graphics/trainers/front_pics/${sourceName}`;
      const r = await fetch(url);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(targetFile, buf);
        trainersDownloaded++;
      } else {
        console.error(`Failed to fetch ${sourceName}: status ${r.status}`);
      }
    } catch (e) {
      console.error(`Error downloading ${sourceName}:`, e.message);
    }
  }
});
console.log(`✓ Gen 3 trainer sprites ready. Downloaded: ${trainersDownloaded} / ${trainerEntries.length}`);
