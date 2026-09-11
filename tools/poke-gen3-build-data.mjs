
const GEN3_TALENTS_MAP = {"1":"OVERGROW","2":"OVERGROW","3":"OVERGROW","4":"BLAZE","5":"BLAZE","6":"BLAZE","7":"TORRENT","8":"TORRENT","9":"TORRENT","10":"SHIELD_DUST","11":"SHED_SKIN","12":"COMPOUND_EYES","13":"SHIELD_DUST","14":"SHED_SKIN","15":"SWARM","16":"KEEN_EYE","17":"KEEN_EYE","18":"KEEN_EYE","19":"RUN_AWAY","20":"RUN_AWAY","21":"KEEN_EYE","22":"KEEN_EYE","23":"INTIMIDATE","24":"INTIMIDATE","25":"STATIC","26":"STATIC","27":"SAND_VEIL","28":"SAND_VEIL","29":"POISON_POINT","30":"POISON_POINT","31":"POISON_POINT","32":"POISON_POINT","33":"POISON_POINT","34":"POISON_POINT","35":"CUTE_CHARM","36":"CUTE_CHARM","37":"FLASH_FIRE","38":"FLASH_FIRE","39":"CUTE_CHARM","40":"CUTE_CHARM","41":"INNER_FOCUS","42":"INNER_FOCUS","43":"CHLOROPHYLL","44":"CHLOROPHYLL","45":"CHLOROPHYLL","46":"EFFECT_SPORE","47":"EFFECT_SPORE","48":"COMPOUND_EYES","49":"SHIELD_DUST","50":"ARENA_TRAP","51":"ARENA_TRAP","52":"PICKUP","53":"LIMBER","54":"DAMP","55":"DAMP","56":"VITAL_SPIRIT","57":"VITAL_SPIRIT","58":"INTIMIDATE","59":"INTIMIDATE","60":"WATER_ABSORB","61":"WATER_ABSORB","62":"WATER_ABSORB","63":"SYNCHRONIZE","64":"SYNCHRONIZE","65":"SYNCHRONIZE","66":"GUTS","67":"GUTS","68":"GUTS","69":"CHLOROPHYLL","70":"CHLOROPHYLL","71":"CHLOROPHYLL","72":"CLEAR_BODY","73":"CLEAR_BODY","74":"ROCK_HEAD","75":"ROCK_HEAD","76":"ROCK_HEAD","77":"FLASH_FIRE","78":"FLASH_FIRE","79":"OBLIVIOUS","80":"OBLIVIOUS","81":"MAGNET_PULL","82":"MAGNET_PULL","83":"KEEN_EYE","84":"EARLY_BIRD","85":"EARLY_BIRD","86":"THICK_FAT","87":"THICK_FAT","88":"STENCH","89":"STENCH","90":"SHELL_ARMOR","91":"SHELL_ARMOR","92":"LEVITATE","93":"LEVITATE","94":"LEVITATE","95":"ROCK_HEAD","96":"INSOMNIA","97":"INSOMNIA","98":"HYPER_CUTTER","99":"HYPER_CUTTER","100":"SOUNDPROOF","101":"SOUNDPROOF","102":"CHLOROPHYLL","103":"CHLOROPHYLL","104":"ROCK_HEAD","105":"ROCK_HEAD","106":"LIMBER","107":"KEEN_EYE","108":"OWN_TEMPO","109":"LEVITATE","110":"LEVITATE","111":"LIGHTNING_ROD","112":"LIGHTNING_ROD","113":"NATURAL_CURE","114":"CHLOROPHYLL","115":"EARLY_BIRD","116":"SWIFT_SWIM","117":"POISON_POINT","118":"WATER_VEIL","119":"WATER_VEIL","120":"NATURAL_CURE","121":"NATURAL_CURE","122":"SOUNDPROOF","123":"SWARM","124":"OBLIVIOUS","125":"STATIC","126":"FLAME_BODY","127":"HYPER_CUTTER","128":"INTIMIDATE","129":"SWIFT_SWIM","130":"INTIMIDATE","131":"WATER_ABSORB","132":"LIMBER","133":"RUN_AWAY","134":"WATER_ABSORB","135":"VOLT_ABSORB","136":"FLASH_FIRE","137":"TRACE","138":"SWIFT_SWIM","139":"SWIFT_SWIM","140":"BATTLE_ARMOR","141":"BATTLE_ARMOR","142":"ROCK_HEAD","143":"IMMUNITY","144":"PRESSURE","145":"PRESSURE","146":"PRESSURE","147":"SHED_SKIN","148":"SHED_SKIN","149":"INNER_FOCUS","150":"PRESSURE","151":"SYNCHRONIZE","152":"OVERGROW","153":"OVERGROW","154":"OVERGROW","155":"BLAZE","156":"BLAZE","157":"BLAZE","158":"TORRENT","159":"TORRENT","160":"TORRENT","161":"RUN_AWAY","162":"RUN_AWAY","163":"INSOMNIA","164":"INSOMNIA","165":"SWARM","166":"SWARM","167":"SWARM","168":"SWARM","169":"INNER_FOCUS","170":"VOLT_ABSORB","171":"VOLT_ABSORB","172":"STATIC","173":"CUTE_CHARM","174":"CUTE_CHARM","175":"SERENE_GRACE","176":"SERENE_GRACE","177":"SYNCHRONIZE","178":"SYNCHRONIZE","179":"STATIC","180":"STATIC","181":"STATIC","182":"CHLOROPHYLL","183":"HUGE_POWER","184":"HUGE_POWER","185":"STURDY","186":"WATER_ABSORB","187":"CHLOROPHYLL","188":"CHLOROPHYLL","189":"CHLOROPHYLL","190":"PICKUP","191":"CHLOROPHYLL","192":"CHLOROPHYLL","193":"SPEED_BOOST","194":"WATER_ABSORB","195":"WATER_ABSORB","196":"SYNCHRONIZE","197":"SYNCHRONIZE","198":"INSOMNIA","199":"OBLIVIOUS","200":"LEVITATE","201":"LEVITATE","202":"SHADOW_TAG","203":"EARLY_BIRD","204":"STURDY","205":"STURDY","206":"SERENE_GRACE","207":"HYPER_CUTTER","208":"ROCK_HEAD","209":"INTIMIDATE","210":"INTIMIDATE","211":"POISON_POINT","212":"SWARM","213":"STURDY","214":"GUTS","215":"INNER_FOCUS","216":"PICKUP","217":"GUTS","218":"MAGMA_ARMOR","219":"MAGMA_ARMOR","220":"OBLIVIOUS","221":"OBLIVIOUS","222":"NATURAL_CURE","223":"HUSTLE","224":"SUCTION_CUPS","225":"VITAL_SPIRIT","226":"WATER_ABSORB","227":"STURDY","228":"FLASH_FIRE","229":"FLASH_FIRE","230":"SWIFT_SWIM","231":"PICKUP","232":"STURDY","233":"TRACE","234":"INTIMIDATE","235":"OWN_TEMPO","236":"GUTS","237":"INTIMIDATE","238":"OBLIVIOUS","239":"STATIC","240":"FLAME_BODY","241":"THICK_FAT","242":"NATURAL_CURE","243":"PRESSURE","244":"PRESSURE","245":"PRESSURE","246":"GUTS","247":"SHED_SKIN","248":"SAND_STREAM","249":"PRESSURE","250":"PRESSURE","251":"NATURAL_CURE","252":"OVERGROW","253":"OVERGROW","254":"OVERGROW","255":"BLAZE","256":"BLAZE","257":"BLAZE","258":"TORRENT","259":"TORRENT","260":"TORRENT","261":"INTIMIDATE","262":"INTIMIDATE","263":"PICKUP","264":"PICKUP","265":"SHIELD_DUST","266":"SHIELD_DUST","267":"SWARM","268":"SHIELD_DUST","269":"SHIELD_DUST","270":"SWIFT_SWIM","271":"SWIFT_SWIM","272":"SWIFT_SWIM","273":"CHLOROPHYLL","274":"CHLOROPHYLL","275":"CHLOROPHYLL","276":"GUTS","277":"GUTS","278":"KEEN_EYE","279":"KEEN_EYE","280":"SYNCHRONIZE","281":"SYNCHRONIZE","282":"SYNCHRONIZE","283":"SWIFT_SWIM","284":"INTIMIDATE","285":"EFFECT_SPORE","286":"EFFECT_SPORE","287":"TRUANT","288":"VITAL_SPIRIT","289":"TRUANT","290":"COMPOUND_EYES","291":"SPEED_BOOST","292":"WONDER_GUARD","293":"SOUNDPROOF","294":"SOUNDPROOF","295":"SOUNDPROOF","296":"THICK_FAT","297":"THICK_FAT","298":"HUGE_POWER","299":"STURDY","300":"CUTE_CHARM","301":"CUTE_CHARM","302":"KEEN_EYE","303":"HYPER_CUTTER","304":"ROCK_HEAD","305":"ROCK_HEAD","306":"ROCK_HEAD","307":"PURE_POWER","308":"PURE_POWER","309":"STATIC","310":"STATIC","311":"PLUS","312":"MINUS","313":"SWARM","314":"SWARM","315":"NATURAL_CURE","316":"LIQUID_OOZE","317":"LIQUID_OOZE","318":"ROUGH_SKIN","319":"ROUGH_SKIN","320":"WATER_VEIL","321":"WATER_VEIL","322":"MAGMA_ARMOR","323":"MAGMA_ARMOR","324":"WHITE_SMOKE","325":"THICK_FAT","326":"THICK_FAT","327":"OWN_TEMPO","328":"HYPER_CUTTER","329":"LEVITATE","330":"LEVITATE","331":"SAND_VEIL","332":"SAND_VEIL","333":"NATURAL_CURE","334":"NATURAL_CURE","335":"IMMUNITY","336":"SHED_SKIN","337":"LEVITATE","338":"LEVITATE","339":"OBLIVIOUS","340":"OBLIVIOUS","341":"HYPER_CUTTER","342":"HYPER_CUTTER","343":"LEVITATE","344":"LEVITATE","345":"SUCTION_CUPS","346":"SUCTION_CUPS","347":"BATTLE_ARMOR","348":"BATTLE_ARMOR","349":"SWIFT_SWIM","350":"MARVEL_SCALE","351":"FORECAST","352":"COLOR_CHANGE","353":"INSOMNIA","354":"INSOMNIA","355":"LEVITATE","356":"LEVITATE","357":"CHLOROPHYLL","358":"LEVITATE","359":"PRESSURE","360":"SHADOW_TAG","361":"INNER_FOCUS","362":"INNER_FOCUS","363":"THICK_FAT","364":"THICK_FAT","365":"THICK_FAT","366":"SHELL_ARMOR","367":"SWIFT_SWIM","368":"SWIFT_SWIM","369":"SWIFT_SWIM","370":"SWIFT_SWIM","371":"ROCK_HEAD","372":"ROCK_HEAD","373":"INTIMIDATE","374":"CLEAR_BODY","375":"CLEAR_BODY","376":"CLEAR_BODY","377":"CLEAR_BODY","378":"CLEAR_BODY","379":"CLEAR_BODY","380":"LEVITATE","381":"LEVITATE","382":"DRIZZLE","383":"DROUGHT","384":"AIR_LOCK","385":"SERENE_GRACE","386":"PRESSURE"};
/**
 * tools/poke-gen3-build-data.mjs
 * Tool to compile and sanitize Gen 3 data modules from notes-data/:
 * - js/poke/gen3/attaques.js
 * - js/poke/gen3/especes.js
 * - js/poke/gen3/objets.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// ── 1. Attaques (103 moves) ──────────────────────────────────────────────────
console.log("Generating js/poke/gen3/attaques.js...");
const rawMoves = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "notes-data/POKE_GEN3_ATTAQUES.json"), "utf-8"));
const SPECIAUX = new Set(["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"]);

const moves = rawMoves.map(m => {
  return {
    id: m.id,
    cle: m.cle,
    nom: m.nom,
    type: m.type,
    categorie: m.puissance === 0 ? "statut" : (SPECIAUX.has(m.type) ? "special" : "physique"),
    puissance: m.puissance,
    precision: m.precision,
    pp: m.pp,
    effet: m.effet,
    chance: m.chance || 0,
    dit: m.dit
  };
});

const contentAttaques = `// ═══════════════════════════════════════════════════════════════════════
//  FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
//  Produit par : node tools/poke-gen3-build-data.mjs
//  Source     : notes-data/POKE_GEN3_ATTAQUES.json
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  W.POKE_GEN3_ATTAQUES = ${JSON.stringify(moves)};

  W.POKE_GEN3_ATTAQUE_PAR_CLE = {};
  for (var i = 0; i < W.POKE_GEN3_ATTAQUES.length; i++) {
    W.POKE_GEN3_ATTAQUE_PAR_CLE[W.POKE_GEN3_ATTAQUES[i].cle] = W.POKE_GEN3_ATTAQUES[i];
  }
})(typeof window !== "undefined" ? window : globalThis);
`;

fs.writeFileSync(path.join(ROOT_DIR, "js/poke/gen3/attaques.js"), contentAttaques, "utf-8");
console.log(`✓ js/poke/gen3/attaques.js written (${moves.length} moves).`);

// ── 2. Espèces (135 species) ─────────────────────────────────────────────────
console.log("Generating js/poke/gen3/especes.js with sanitization...");
const rawSpecies = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "notes-data/POKE_GEN3_ESPECES.json"), "utf-8"));

const MOVE_KEY_MAP = {
  SOLAR_BEAM: "SOLARBEAM",
  PSYCHIC: "PSYCHIC_M",
  FEINT_ATTACK: "FAINT_ATTACK",
  BUBBLE_BEAM: "BUBBLEBEAM",
  POISON_POWDER: "POISONPOWDER",
  DYNAMIC_PUNCH: "DYNAMICPUNCH",
  DOUBLE_SLAP: "DOUBLESLAP",
  VICE_GRIP: "VICEGRIP",
  HIGH_JUMP_KICK: "HI_JUMP_KICK",
  THUNDER_PUNCH: "THUNDERPUNCH",
  DRAGON_BREATH: "DRAGONBREATH",
  SELF_DESTRUCT: "SELFDESTRUCT",
  ANCIENT_POWER: "ANCIENTPOWER",
  EXTREME_SPEED: "EXTREMESPEED",
};

function normalizeMove(m) {
  return MOVE_KEY_MAP[m] || m;
}

const species = rawSpecies.map(p => {
  const c = { ...p };
  if (GEN3_TALENTS_MAP[c.n]) c.talent = GEN3_TALENTS_MAP[c.n];

  // 1. Move normalization
  c.depart = (c.depart || []).map(normalizeMove);
  c.apprend = (c.apprend || []).map(([lvl, m]) => [lvl, normalizeMove(m)]);
  c.ct = (c.ct || []).map(normalizeMove);

  // 2. Pre-Fairy typing confirmation
  if (c.n === 280 || c.n === 281 || c.n === 282) c.types = ["psychic"];
  if (c.n === 298) c.types = ["normal"];
  if (c.n === 303) c.types = ["steel"];

  // 3. Evolution sanitization
  if (c.n === 264) {
    // Linoone: no Obstagoon in Gen 3
    c.evolue = [];
  } else if (c.n === 299) {
    // Nosepass: no Probopass in Gen 3
    c.evolue = [];
  } else if (c.n === 315) {
    // Roselia: no Roserade in Gen 3
    c.evolue = [];
  } else if (c.n === 356) {
    // Dusclops: no Dusknoir in Gen 3
    c.evolue = [];
  } else if (c.n === 281) {
    // Kirlia: only Gardevoir (282) at lv 30 (no Gallade 475)
    c.evolue = [{ vers: 282, par: "niveau", niveau: 30 }];
  } else if (c.n === 361) {
    // Snorunt: only Glalie (362) at lv 42 (no Froslass 478)
    c.evolue = [{ vers: 362, par: "niveau", niveau: 42 }];
  } else if (c.n === 263) {
    // Zigzagoon: clean duplicate evolution to Linoone (264)
    c.evolue = [{ vers: 264, par: "niveau", niveau: 20 }];
  } else if (c.n === 290) {
    // Nincada: evolves into Ninjask (291) & Shedinja (292) at level 20
    c.evolue = [
      { vers: 291, par: "niveau", niveau: 20 },
      { vers: 292, par: "niveau", niveau: 20 }
    ];
  } else if (c.n === 349) {
    // Feebas: evolves into Milotic (350)
    c.evolue = [{ vers: 350, par: "bonheur" }];
  } else {
    // General purge of any evolution targeting species > 386
    c.evolue = (c.evolue || []).filter(ev => ev.vers >= 1 && ev.vers <= 386);
  }

  return c;
});

const contentEspeces = `// ═══════════════════════════════════════════════════════════════════════
//  FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
//  Produit par : node tools/poke-gen3-build-data.mjs
//  Source     : notes-data/POKE_GEN3_ESPECES.json
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  W.POKE_GEN3_ESPECES = ${JSON.stringify(species)};

  W.POKE_GEN3_ESPECE = {};
  for (var i = 0; i < W.POKE_GEN3_ESPECES.length; i++) {
    W.POKE_GEN3_ESPECE[W.POKE_GEN3_ESPECES[i].n] = W.POKE_GEN3_ESPECES[i];
    W.POKE_GEN3_ESPECE[W.POKE_GEN3_ESPECES[i].cle] = W.POKE_GEN3_ESPECES[i];
  }
})(typeof window !== "undefined" ? window : globalThis);
`;

fs.writeFileSync(path.join(ROOT_DIR, "js/poke/gen3/especes.js"), contentEspeces, "utf-8");
console.log(`✓ js/poke/gen3/especes.js written (${species.length} species).`);

// ── 3. Objets (Hoenn items, berries, stones, key items) ──────────────────────
console.log("Generating js/poke/gen3/objets.js...");

const objets = {
  // ── Balls ────────────────────────────────────────────────────────────────
  POKE_BALL: { nom: { fr: "Poké Ball", en: "Poké Ball" }, prix: 200, tenu: null },
  GREAT_BALL: { nom: { fr: "Super Ball", en: "Great Ball" }, prix: 600, tenu: null },
  ULTRA_BALL: { nom: { fr: "Hyper Ball", en: "Ultra Ball" }, prix: 1200, tenu: null },
  MASTER_BALL: { nom: { fr: "Master Ball", en: "Master Ball" }, prix: 0, tenu: null },
  NET_BALL: { nom: { fr: "Filet Ball", en: "Net Ball" }, prix: 1000, tenu: null },
  DIVE_BALL: { nom: { fr: "Scuba Ball", en: "Dive Ball" }, prix: 1000, tenu: null },
  NEST_BALL: { nom: { fr: "Faiblo Ball", en: "Nest Ball" }, prix: 1000, tenu: null },
  REPEAT_BALL: { nom: { fr: "Bis Ball", en: "Repeat Ball" }, prix: 1000, tenu: null },
  TIMER_BALL: { nom: { fr: "Chrono Ball", en: "Timer Ball" }, prix: 1000, tenu: null },
  LUXURY_BALL: { nom: { fr: "Luxe Ball", en: "Luxury Ball" }, prix: 1000, tenu: null },
  PREMIER_BALL: { nom: { fr: "Honor Ball", en: "Premier Ball" }, prix: 200, tenu: null },

  // ── Soins & Potions ──────────────────────────────────────────────────────
  POTION: { nom: { fr: "Potion", en: "Potion" }, prix: 300, tenu: null },
  SUPER_POTION: { nom: { fr: "Super Potion", en: "Super Potion" }, prix: 700, tenu: null },
  HYPER_POTION: { nom: { fr: "Hyper Potion", en: "Hyper Potion" }, prix: 1200, tenu: null },
  MAX_POTION: { nom: { fr: "Potion Max", en: "Max Potion" }, prix: 2500, tenu: null },
  FULL_RESTORE: { nom: { fr: "Guérison", en: "Full Restore" }, prix: 3000, tenu: null },
  REVIVE: { nom: { fr: "Rappel", en: "Revive" }, prix: 1500, tenu: null },
  MAX_REVIVE: { nom: { fr: "Rappel Max", en: "Max Revive" }, prix: 4000, tenu: null },
  ANTIDOTE: { nom: { fr: "Antidote", en: "Antidote" }, prix: 100, tenu: null },
  BURN_HEAL: { nom: { fr: "Anti-Brûle", en: "Burn Heal" }, prix: 250, tenu: null },
  ICE_HEAL: { nom: { fr: "Antigel", en: "Ice Heal" }, prix: 250, tenu: null },
  AWAKENING: { nom: { fr: "Réveil", en: "Awakening" }, prix: 250, tenu: null },
  PARLYZ_HEAL: { nom: { fr: "Anti-Para", en: "Parlyz Heal" }, prix: 200, tenu: null },
  FULL_HEAL: { nom: { fr: "Total Soin", en: "Full Heal" }, prix: 600, tenu: null },
  ETHER: { nom: { fr: "Huile", en: "Ether" }, prix: 1200, tenu: null },
  MAX_ETHER: { nom: { fr: "Huile Max", en: "Max Ether" }, prix: 2000, tenu: null },
  ELIXER: { nom: { fr: "Élixir", en: "Elixir" }, prix: 3000, tenu: null },
  MAX_ELIXER: { nom: { fr: "Élixir Max", en: "Max Elixir" }, prix: 4500, tenu: null },

  // ── Pierres d'évolution ──────────────────────────────────────────────────
  FIRE_STONE: { nom: { fr: "Pierre Feu", en: "Fire Stone" }, prix: 2100, tenu: null },
  WATER_STONE: { nom: { fr: "Pierre Eau", en: "Water Stone" }, prix: 2100, tenu: null },
  THUNDERSTONE: { nom: { fr: "Pierre Foudre", en: "Thunderstone" }, prix: 2100, tenu: null },
  LEAF_STONE: { nom: { fr: "Pierre Plante", en: "Leaf Stone" }, prix: 2100, tenu: null },
  MOON_STONE: { nom: { fr: "Pierre Lune", en: "Moon Stone" }, prix: 0, tenu: null },
  SUN_STONE: { nom: { fr: "Pierre Soleil", en: "Sun Stone" }, prix: 2100, tenu: null },

  // ── Vitamines ────────────────────────────────────────────────────────────
  HP_UP: { nom: { fr: "PV Plus", en: "HP Up" }, prix: 9800, tenu: null },
  PROTEIN: { nom: { fr: "Protéine", en: "Protein" }, prix: 9800, tenu: null },
  IRON: { nom: { fr: "Fer", en: "Iron" }, prix: 9800, tenu: null },
  CARBOS: { nom: { fr: "Carbone", en: "Carbos" }, prix: 9800, tenu: null },
  CALCIUM: { nom: { fr: "Calcium", en: "Calcium" }, prix: 9800, tenu: null },
  ZINC: { nom: { fr: "Zinc", en: "Zinc" }, prix: 9800, tenu: null },
  RARE_CANDY: { nom: { fr: "Super Bonbon", en: "Rare Candy" }, prix: 4800, tenu: null },
  PP_UP: { nom: { fr: "PP Plus", en: "PP Up" }, prix: 9800, tenu: null },
  PP_MAX: { nom: { fr: "PP Max", en: "PP Max" }, prix: 9800, tenu: null },

  // ── Objets de terrain & combat ───────────────────────────────────────────
  ESCAPE_ROPE: { nom: { fr: "Corde Sortie", en: "Escape Rope" }, prix: 550, tenu: null },
  REPEL: { nom: { fr: "Repousse", en: "Repel" }, prix: 350, tenu: null },
  SUPER_REPEL: { nom: { fr: "Super Repousse", en: "Super Repel" }, prix: 500, tenu: null },
  MAX_REPEL: { nom: { fr: "Repousse Max", en: "Max Repel" }, prix: 700, tenu: null },
  POKE_DOLL: { nom: { fr: "Poké Poupée", en: "Poké Doll" }, prix: 1000, tenu: null },
  FLUFFY_TAIL: { nom: { fr: "Queue Skitty", en: "Fluffy Tail" }, prix: 1000, tenu: null },
  X_ATTACK: { nom: { fr: "Attaque +", en: "X Attack" }, prix: 500, tenu: null },
  X_DEFEND: { nom: { fr: "Défense +", en: "X Defend" }, prix: 550, tenu: null },
  X_SPEED: { nom: { fr: "Vitesse +", en: "X Speed" }, prix: 350, tenu: null },
  X_SPECIAL: { nom: { fr: "Atq. Spé. +", en: "X Special" }, prix: 350, tenu: null },
  X_ACCURACY: { nom: { fr: "Précision +", en: "X Accuracy" }, prix: 950, tenu: null },
  DIRE_HIT: { nom: { fr: "Muscle +", en: "Dire Hit" }, prix: 650, tenu: null },
  GUARD_SPEC: { nom: { fr: "Garde-Stats", en: "Guard Spec." }, prix: 700, tenu: null },
  NUGGET: { nom: { fr: "Pépite", en: "Nugget" }, prix: 10000, tenu: null },
  BIG_PEARL: { nom: { fr: "Grande Perle", en: "Big Pearl" }, prix: 7500, tenu: null },
  PEARL: { nom: { fr: "Perle", en: "Pearl" }, prix: 1400, tenu: null },
  STARDUST: { nom: { fr: "Poussière Étoile", en: "Stardust" }, prix: 2000, tenu: null },
  STAR_PIECE: { nom: { fr: "Morceau d’Étoile", en: "Star Piece" }, prix: 9800, tenu: null },

  // ── Objets tenus ─────────────────────────────────────────────────────────
  SOUL_DEW: { nom: { fr: "Rosée Âme", en: "Soul Dew" }, prix: 200, tenu: "HELD_SOUL_DEW" },
  DEEP_SEA_TOOTH: { nom: { fr: "Dent Océan", en: "Deep Sea Tooth" }, prix: 200, tenu: "HELD_DEEP_SEA_TOOTH" },
  DEEP_SEA_SCALE: { nom: { fr: "Écaille Océan", en: "Deep Sea Scale" }, prix: 200, tenu: "HELD_DEEP_SEA_SCALE" },
  CHOICE_BAND: { nom: { fr: "Bandeau Choix", en: "Choice Band" }, prix: 200, tenu: "HELD_CHOICE_BAND" },
  FOCUS_BAND: { nom: { fr: "Bandeau", en: "Focus Band" }, prix: 200, tenu: "HELD_FOCUS_BAND" },
  SCOPE_LENS: { nom: { fr: "Lentilscope", en: "Scope Lens" }, prix: 200, tenu: "HELD_CRITICAL_UP" },
  LEFTOVERS: { nom: { fr: "Restes", en: "Leftovers" }, prix: 200, tenu: "HELD_LEFTOVERS" },
  EXP_SHARE: { nom: { fr: "Multi Exp", en: "Exp. Share" }, prix: 3000, tenu: null },
  QUICK_CLAW: { nom: { fr: "Vive Griffe", en: "Quick Claw" }, prix: 100, tenu: "HELD_QUICK_CLAW" },
  KINGS_ROCK: { nom: { fr: "Roche Royale", en: "King's Rock" }, prix: 100, tenu: "HELD_FLINCH" },
  AMULET_COIN: { nom: { fr: "Pièce Rune", en: "Amulet Coin" }, prix: 100, tenu: "HELD_AMULET_COIN" },
  CLEANSE_TAG: { nom: { fr: "Rune Purifiante", en: "Cleanse Tag" }, prix: 200, tenu: "HELD_CLEANSE_TAG" },
  SMOKE_BALL: { nom: { fr: "Boule Fumée", en: "Smoke Ball" }, prix: 200, tenu: "HELD_ESCAPE" },
  EVERSTONE: { nom: { fr: "Pierre Stase", en: "Everstone" }, prix: 200, tenu: null },
  MACHO_BRACE: { nom: { fr: "Braceg. Macho", en: "Macho Brace" }, prix: 200, tenu: "HELD_MACHO_BRACE" },
  WHITE_HERB: { nom: { fr: "Herbe Blanche", en: "White Herb" }, prix: 100, tenu: "HELD_WHITE_HERB" },
  MENTAL_HERB: { nom: { fr: "Herbe Mental", en: "Mental Herb" }, prix: 100, tenu: "HELD_MENTAL_HERB" },
  SHELL_BELL: { nom: { fr: "Grelot Coque", en: "Shell Bell" }, prix: 200, tenu: "HELD_SHELL_BELL" },
  SILK_SCARF: { nom: { fr: "Mouchoir Soie", en: "Silk Scarf" }, prix: 100, tenu: "HELD_NORMAL_BOOST" },
  BRIGHTPOWDER: { nom: { fr: "Poudre Claire", en: "BrightPowder" }, prix: 10, tenu: "HELD_BRIGHTPOWDER" },
  SEA_INCENSE: { nom: { fr: "Encens Mer", en: "Sea Incense" }, prix: 9600, tenu: "HELD_WATER_BOOST" },
  LAX_INCENSE: { nom: { fr: "Encens Doux", en: "Lax Incense" }, prix: 9600, tenu: "HELD_BRIGHTPOWDER" },
  CHARCOAL: { nom: { fr: "Charbon", en: "Charcoal" }, prix: 9800, tenu: "HELD_FIRE_BOOST" },
  MYSTIC_WATER: { nom: { fr: "Eau Mystique", en: "Mystic Water" }, prix: 100, tenu: "HELD_WATER_BOOST" },
  MIRACLE_SEED: { nom: { fr: "Graine Miracle", en: "Miracle Seed" }, prix: 100, tenu: "HELD_GRASS_BOOST" },
  MAGNET: { nom: { fr: "Aimant", en: "Magnet" }, prix: 100, tenu: "HELD_ELECTRIC_BOOST" },
  HARD_STONE: { nom: { fr: "Pierre Dure", en: "Hard Stone" }, prix: 100, tenu: "HELD_ROCK_BOOST" },
  NEVERMELTICE: { nom: { fr: "Glace Éternelle", en: "NeverMeltIce" }, prix: 100, tenu: "HELD_ICE_BOOST" },
  POISON_BARB: { nom: { fr: "Pic Venin", en: "Poison Barb" }, prix: 100, tenu: "HELD_POISON_BOOST" },
  SHARP_BEAK: { nom: { fr: "Bec Pointu", en: "Sharp Beak" }, prix: 100, tenu: "HELD_FLYING_BOOST" },
  SOFT_SAND: { nom: { fr: "Sable Doux", en: "Soft Sand" }, prix: 100, tenu: "HELD_GROUND_BOOST" },
  BLACKBELT_I: { nom: { fr: "Ceinture Noire", en: "Black Belt" }, prix: 100, tenu: "HELD_FIGHTING_BOOST" },
  BLACKGLASSES: { nom: { fr: "Lunettes Noires", en: "BlackGlasses" }, prix: 100, tenu: "HELD_DARK_BOOST" },
  SPELL_TAG: { nom: { fr: "Rune Sort", en: "Spell Tag" }, prix: 100, tenu: "HELD_GHOST_BOOST" },
  TWISTEDSPOON: { nom: { fr: "Cuillère Tordue", en: "TwistedSpoon" }, prix: 100, tenu: "HELD_PSYCHIC_BOOST" },
  SILVERPOWDER: { nom: { fr: "Poudre Argentée", en: "SilverPowder" }, prix: 100, tenu: "HELD_BUG_BOOST" },
  DRAGON_FANG: { nom: { fr: "Croc Dragon", en: "Dragon Fang" }, prix: 100, tenu: "HELD_DRAGON_BOOST" },
  METAL_COAT: { nom: { fr: "Peau Métal", en: "Metal Coat" }, prix: 100, tenu: "HELD_STEEL_BOOST" },
  DRAGON_SCALE: { nom: { fr: "Écaille Draco", en: "Dragon Scale" }, prix: 2100, tenu: "HELD_DRAGON_BOOST" },

  // ── Baies Hoenn ──────────────────────────────────────────────────────────
  CHERI_BERRY: { nom: { fr: "Baie Ceriz", en: "Cheri Berry" }, prix: 20, tenu: "HELD_HEAL_PARALYZE" },
  CHESTO_BERRY: { nom: { fr: "Baie Maron", en: "Chesto Berry" }, prix: 20, tenu: "HELD_HEAL_SLEEP" },
  PECHA_BERRY: { nom: { fr: "Baie Pêcha", en: "Pecha Berry" }, prix: 20, tenu: "HELD_HEAL_POISON" },
  RAWST_BERRY: { nom: { fr: "Baie Fraive", en: "Rawst Berry" }, prix: 20, tenu: "HELD_HEAL_BURN" },
  ASPEAR_BERRY: { nom: { fr: "Baie Willia", en: "Aspear Berry" }, prix: 20, tenu: "HELD_HEAL_FREEZE" },
  LEPPA_BERRY: { nom: { fr: "Baie Mepo", en: "Leppa Berry" }, prix: 20, tenu: "HELD_RESTORE_PP" },
  ORAN_BERRY: { nom: { fr: "Baie Oran", en: "Oran Berry" }, prix: 20, tenu: "HELD_BERRY" },
  PERSIM_BERRY: { nom: { fr: "Baie Kika", en: "Persim Berry" }, prix: 20, tenu: "HELD_HEAL_CONFUSION" },
  LUM_BERRY: { nom: { fr: "Baie Prine", en: "Lum Berry" }, prix: 20, tenu: "HELD_HEAL_STATUS" },
  SITRUS_BERRY: { nom: { fr: "Baie Sitrus", en: "Sitrus Berry" }, prix: 20, tenu: "HELD_SITRUS_BERRY" },
  FIGY_BERRY: { nom: { fr: "Baie Figuy", en: "Figy Berry" }, prix: 20, tenu: "HELD_BERRY" },
  WIKI_BERRY: { nom: { fr: "Baie Wiki", en: "Wiki Berry" }, prix: 20, tenu: "HELD_BERRY" },
  MAGO_BERRY: { nom: { fr: "Baie Mago", en: "Mago Berry" }, prix: 20, tenu: "HELD_BERRY" },
  AGUAV_BERRY: { nom: { fr: "Baie Gowav", en: "Aguav Berry" }, prix: 20, tenu: "HELD_BERRY" },
  IAPAPA_BERRY: { nom: { fr: "Baie Papaye", en: "Iapapa Berry" }, prix: 20, tenu: "HELD_BERRY" },
  RAZZ_BERRY: { nom: { fr: "Baie Framby", en: "Razz Berry" }, prix: 20, tenu: null },
  BLUK_BERRY: { nom: { fr: "Baie Remu", en: "Bluk Berry" }, prix: 20, tenu: null },
  NANAB_BERRY: { nom: { fr: "Baie Nanab", en: "Nanab Berry" }, prix: 20, tenu: null },
  WEPEAR_BERRY: { nom: { fr: "Baie Repan", en: "Wepear Berry" }, prix: 20, tenu: null },
  PINAP_BERRY: { nom: { fr: "Baie Nanana", en: "Pinap Berry" }, prix: 20, tenu: null },
  LIECHI_BERRY: { nom: { fr: "Baie Litchii", en: "Liechi Berry" }, prix: 50, tenu: "HELD_ATTACK_BOOST" },
  GANLON_BERRY: { nom: { fr: "Baie Lingan", en: "Ganlon Berry" }, prix: 50, tenu: "HELD_DEFENSE_BOOST" },
  SALAC_BERRY: { nom: { fr: "Baie Sailak", en: "Salac Berry" }, prix: 50, tenu: "HELD_SPEED_BOOST" },
  PETAYA_BERRY: { nom: { fr: "Baie Pitaye", en: "Petaya Berry" }, prix: 50, tenu: "HELD_SPECIAL_BOOST" },
  APICOT_BERRY: { nom: { fr: "Baie Abriko", en: "Apicot Berry" }, prix: 50, tenu: "HELD_SPECIAL_DEF_BOOST" },

  // ── Clés, Fossiles & Objets rares ────────────────────────────────────────
  CLAW_FOSSIL: { nom: { fr: "Fossile Griffe", en: "Claw Fossil" }, prix: 1000, tenu: null },
  ROOT_FOSSIL: { nom: { fr: "Fossile Racine", en: "Root Fossil" }, prix: 1000, tenu: null },
  DEVON_SCOPE: { nom: { fr: "Devon Scope", en: "Devon Scope" }, prix: 0, tenu: null },
  GO_GOGGLES: { nom: { fr: "Lunet. Sable", en: "Go-Goggles" }, prix: 0, tenu: null },
  LETTER: { nom: { fr: "Lettre", en: "Letter" }, prix: 0, tenu: null },
  DEVON_GOODS: { nom: { fr: "Pack Devon", en: "Devon Goods" }, prix: 0, tenu: null },
  METEORITE: { nom: { fr: "Météorite", en: "Meteorite" }, prix: 0, tenu: null },
  BASEMENT_KEY: { nom: { fr: "Clé Sous-Sol", en: "Basement Key" }, prix: 0, tenu: null },
  STORAGE_KEY: { nom: { fr: "Clé Stockage", en: "Storage Key" }, prix: 0, tenu: null },
  ROOM_1_KEY: { nom: { fr: "Clé Salle 1", en: "Room 1 Key" }, prix: 0, tenu: null },
  ROOM_2_KEY: { nom: { fr: "Clé Salle 2", en: "Room 2 Key" }, prix: 0, tenu: null },
  ROOM_4_KEY: { nom: { fr: "Clé Salle 4", en: "Room 4 Key" }, prix: 0, tenu: null },
  ROOM_6_KEY: { nom: { fr: "Clé Salle 6", en: "Room 6 Key" }, prix: 0, tenu: null },
  RED_ORB: { nom: { fr: "Orbe Rouge", en: "Red Orb" }, prix: 0, tenu: null },
  BLUE_ORB: { nom: { fr: "Orbe Bleu", en: "Blue Orb" }, prix: 0, tenu: null },
  MAGMA_EMBLEM: { nom: { fr: "Emblème Magma", en: "Magma Emblem" }, prix: 0, tenu: null },
  OLD_SEA_MAP: { nom: { fr: "Vieille Carte", en: "Old Sea Map" }, prix: 0, tenu: null },
  EON_TICKET: { nom: { fr: "Passe Éon", en: "Eon Ticket" }, prix: 0, tenu: null },
  AURORA_TICKET: { nom: { fr: "Ticket Aurora", en: "Aurora Ticket" }, prix: 0, tenu: null },
  MYSTIC_TICKET: { nom: { fr: "Ticket Mystic", en: "Mystic Ticket" }, prix: 0, tenu: null },
  ACRO_BIKE: { nom: { fr: "Vélo Cross", en: "Acro Bike" }, prix: 0, tenu: null },
  MACH_BIKE: { nom: { fr: "Vélo Course", en: "Mach Bike" }, prix: 0, tenu: null },
  POKENAV: { nom: { fr: "PokéNav", en: "PokéNav" }, prix: 0, tenu: null },
  COIN_CASE: { nom: { fr: "Boîte Jetons", en: "Coin Case" }, prix: 0, tenu: null },
  WAILMER_PAIL: { nom: { fr: "Seau Wailmer", en: "Wailmer Pail" }, prix: 0, tenu: null },
  POKEBLOCK_CASE: { nom: { fr: "Boîte Bonbons", en: "Pokéblock Case" }, prix: 0, tenu: null }
};

const contentObjets = `// ═══════════════════════════════════════════════════════════════════════
//  LES OBJETS DE LA TROISIÈME GÉNÉRATION (HOENN — ÉMERAUDE)
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  W.POKE_GEN3_OBJETS = ${JSON.stringify(objets, null, 2)};

})(typeof window !== "undefined" ? window : globalThis);
`;

fs.writeFileSync(path.join(ROOT_DIR, "js/poke/gen3/objets.js"), contentObjets, "utf-8");
console.log(`✓ js/poke/gen3/objets.js written (${Object.keys(objets).length} items).`);
console.log("All Gen 3 data modules generated successfully!");
