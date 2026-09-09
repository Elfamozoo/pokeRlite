// ═══════════════════════════════════════════════════════════════════════
//  LES TYPES DE LA TROISIÈME GÉNÉRATION (HOENN — ÉMERAUDE)
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  W.POKE_GEN3_TYPES = [
    "normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel",
    "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"
  ];

  W.POKE_GEN3_TYPE_NOMS = {
    "normal": { "fr": "Normal", "en": "Normal" },
    "fighting": { "fr": "Combat", "en": "Fighting" },
    "flying": { "fr": "Vol", "en": "Flying" },
    "poison": { "fr": "Poison", "en": "Poison" },
    "ground": { "fr": "Sol", "en": "Ground" },
    "rock": { "fr": "Roche", "en": "Rock" },
    "bug": { "fr": "Insecte", "en": "Bug" },
    "ghost": { "fr": "Spectre", "en": "Ghost" },
    "steel": { "fr": "Acier", "en": "Steel" },
    "fire": { "fr": "Feu", "en": "Fire" },
    "water": { "fr": "Eau", "en": "Water" },
    "grass": { "fr": "Plante", "en": "Grass" },
    "electric": { "fr": "Électrik", "en": "Electric" },
    "psychic": { "fr": "Psy", "en": "Psychic" },
    "ice": { "fr": "Glace", "en": "Ice" },
    "dragon": { "fr": "Dragon", "en": "Dragon" },
    "dark": { "fr": "Ténèbres", "en": "Dark" }
  };

  // Table d'efficacité. Lecture : POKE_GEN3_TYPE_TABLE[attaquant][défenseur].
  W.POKE_GEN3_TYPE_TABLE = {
    "normal": { "normal": 1, "fighting": 1, "flying": 1, "poison": 1, "ground": 1, "rock": 0.5, "bug": 1, "ghost": 0, "steel": 0.5, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 1, "ice": 1, "dragon": 1, "dark": 1 },
    "fighting": { "normal": 2, "fighting": 1, "flying": 0.5, "poison": 0.5, "ground": 1, "rock": 2, "bug": 0.5, "ghost": 0, "steel": 2, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 0.5, "ice": 2, "dragon": 1, "dark": 2 },
    "flying": { "normal": 1, "fighting": 2, "flying": 1, "poison": 1, "ground": 1, "rock": 0.5, "bug": 2, "ghost": 1, "steel": 0.5, "fire": 1, "water": 1, "grass": 2, "electric": 0.5, "psychic": 1, "ice": 1, "dragon": 1, "dark": 1 },
    "poison": { "normal": 1, "fighting": 1, "flying": 1, "poison": 0.5, "ground": 0.5, "rock": 0.5, "bug": 1, "ghost": 0.5, "steel": 0, "fire": 1, "water": 1, "grass": 2, "electric": 1, "psychic": 1, "ice": 1, "dragon": 1, "dark": 1 },
    "ground": { "normal": 1, "fighting": 1, "flying": 0, "poison": 2, "ground": 1, "rock": 2, "bug": 0.5, "ghost": 1, "steel": 2, "fire": 2, "water": 1, "grass": 0.5, "electric": 2, "psychic": 1, "ice": 1, "dragon": 1, "dark": 1 },
    "rock": { "normal": 1, "fighting": 0.5, "flying": 2, "poison": 1, "ground": 0.5, "rock": 1, "bug": 2, "ghost": 1, "steel": 0.5, "fire": 2, "water": 1, "grass": 1, "electric": 1, "psychic": 1, "ice": 2, "dragon": 1, "dark": 1 },
    "bug": { "normal": 1, "fighting": 0.5, "flying": 0.5, "poison": 0.5, "ground": 1, "rock": 1, "bug": 1, "ghost": 0.5, "steel": 0.5, "fire": 0.5, "water": 1, "grass": 2, "electric": 1, "psychic": 2, "ice": 1, "dragon": 1, "dark": 2 },
    "ghost": { "normal": 0, "fighting": 1, "flying": 1, "poison": 1, "ground": 1, "rock": 1, "bug": 1, "ghost": 2, "steel": 0.5, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 2, "ice": 1, "dragon": 1, "dark": 0.5 },
    "steel": { "normal": 1, "fighting": 1, "flying": 1, "poison": 1, "ground": 1, "rock": 2, "bug": 1, "ghost": 1, "steel": 0.5, "fire": 0.5, "water": 0.5, "grass": 1, "electric": 0.5, "psychic": 1, "ice": 2, "dragon": 1, "dark": 1 },
    "fire": { "normal": 1, "fighting": 1, "flying": 1, "poison": 1, "ground": 1, "rock": 0.5, "bug": 2, "ghost": 1, "steel": 2, "fire": 0.5, "water": 0.5, "grass": 2, "electric": 1, "psychic": 1, "ice": 2, "dragon": 0.5, "dark": 1 },
    "water": { "normal": 1, "fighting": 1, "flying": 1, "poison": 1, "ground": 2, "rock": 2, "bug": 1, "ghost": 1, "steel": 1, "fire": 2, "water": 0.5, "grass": 0.5, "electric": 1, "psychic": 1, "ice": 1, "dragon": 0.5, "dark": 1 },
    "grass": { "normal": 1, "fighting": 1, "flying": 0.5, "poison": 0.5, "ground": 2, "rock": 2, "bug": 0.5, "ghost": 1, "steel": 0.5, "fire": 0.5, "water": 2, "grass": 0.5, "electric": 1, "psychic": 1, "ice": 1, "dragon": 0.5, "dark": 1 },
    "electric": { "normal": 1, "fighting": 1, "flying": 2, "poison": 1, "ground": 0, "rock": 1, "bug": 1, "ghost": 1, "steel": 1, "fire": 1, "water": 2, "grass": 0.5, "electric": 0.5, "psychic": 1, "ice": 1, "dragon": 0.5, "dark": 1 },
    "psychic": { "normal": 1, "fighting": 2, "flying": 1, "poison": 2, "ground": 1, "rock": 1, "bug": 1, "ghost": 1, "steel": 0.5, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 0.5, "ice": 1, "dragon": 1, "dark": 0 },
    "ice": { "normal": 1, "fighting": 1, "flying": 2, "poison": 1, "ground": 2, "rock": 1, "bug": 1, "ghost": 1, "steel": 0.5, "fire": 0.5, "water": 0.5, "grass": 2, "electric": 1, "psychic": 1, "ice": 0.5, "dragon": 2, "dark": 1 },
    "dragon": { "normal": 1, "fighting": 1, "flying": 1, "poison": 1, "ground": 1, "rock": 1, "bug": 1, "ghost": 1, "steel": 0.5, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 1, "ice": 1, "dragon": 2, "dark": 1 },
    "dark": { "normal": 1, "fighting": 0.5, "flying": 1, "poison": 1, "ground": 1, "rock": 1, "bug": 1, "ghost": 2, "steel": 0.5, "fire": 1, "water": 1, "grass": 1, "electric": 1, "psychic": 2, "ice": 1, "dragon": 1, "dark": 0.5 }
  };

  // En génération 3, la catégorie physique ou spéciale dépend encore strictement du type.
  W.POKE_GEN3_TYPES_SPECIAUX = ["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"];

})(typeof window !== "undefined" ? window : globalThis);
