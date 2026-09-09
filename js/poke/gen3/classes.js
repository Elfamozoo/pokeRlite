(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  Classes de Dresseur pour la région d'Hoenn (Génération 3 - Émeraude).
  //  Noms officiels en français et anglais, multiplicateurs de gains et
  //  drapeau `route` indiquant l'éligibilité pour les nœuds de route.
  // ═══════════════════════════════════════════════════════════════════════════

  var CLASSES = {
    "rich_boy": { "fr": "Fils de Famille", "en": "Rich Boy", "route": true, "mult": 200 },
    "lady": { "fr": "Mademoiselle", "en": "Lady", "route": true, "mult": 200 },
    "triathlete": { "fr": "Triathlète", "en": "Triathlete", "route": true, "mult": 40 },
    "aroma_lady": { "fr": "Arômathérapeute", "en": "Aroma Lady", "route": true, "mult": 40 },
    "pokemon_ranger": { "fr": "Pokémon Ranger", "en": "Pokémon Ranger", "route": true, "mult": 48 },
    "collector": { "fr": "Collectionneur", "en": "Collector", "route": true, "mult": 60 },
    "ninja_boy": { "fr": "Ninja Fan", "en": "Ninja Boy", "route": true, "mult": 12 },
    "parasol_lady": { "fr": "Mademoiselle Parapluie", "en": "Parasol Lady", "route": true, "mult": 40 },
    "sailor": { "fr": "Marin", "en": "Sailor", "route": true, "mult": 32 },
    "fisherman": { "fr": "Pêcheur", "en": "Fisherman", "route": true, "mult": 40 },
    "hiker": { "fr": "Montagnard", "en": "Hiker", "route": true, "mult": 40 },
    "youngster": { "fr": "Gamin", "en": "Youngster", "route": true, "mult": 16 },
    "lass": { "fr": "Fillette", "en": "Lass", "route": true, "mult": 16 },
    "swimmer_m": { "fr": "Nageur", "en": "Swimmer♂", "route": true, "mult": 8 },
    "swimmer_f": { "fr": "Nageuse", "en": "Swimmer♀", "route": true, "mult": 8 },
    "team_aqua": { "fr": "Sbire Aqua", "en": "Team Aqua", "route": false, "mult": 20 },
    "team_magma": { "fr": "Sbire Magma", "en": "Team Magma", "route": false, "mult": 20 },
    "leader": { "fr": "Champion d'Arène", "en": "Gym Leader", "route": false, "mult": 100 },
    "elite_four": { "fr": "Conseil 4", "en": "Elite Four", "route": false, "mult": 100 },
    "champion": { "fr": "Maître", "en": "Champion", "route": false, "mult": 200 },
    "expert": { "fr": "Expert", "en": "Expert", "route": true, "mult": 70 },
    "bug_catcher": { "fr": "Scout", "en": "Bug Catcher", "route": true, "mult": 16 },
    "camper": { "fr": "Campeur", "en": "Camper", "route": true, "mult": 16 },
    "picnicker": { "fr": "Pique-Nique", "en": "Picnicker", "route": true, "mult": 16 },
    "cooltrainer_m": { "fr": "Topdresseur♂", "en": "Cooltrainer♂", "route": true, "mult": 48 },
    "cooltrainer_f": { "fr": "Topdresseur♀", "en": "Cooltrainer♀", "route": true, "mult": 48 },
    "guitarist": { "fr": "Guitariste", "en": "Guitarist", "route": true, "mult": 32 },
    "bird_keeper": { "fr": "Ornithologue", "en": "Bird Keeper", "route": true, "mult": 32 },
    "black_belt": { "fr": "Karatéka", "en": "Black Belt", "route": true, "mult": 32 },
    "battle_girl": { "fr": "Combattante", "en": "Battle Girl", "route": true, "mult": 24 },
    "psychic": { "fr": "Kinésiste", "en": "Psychic", "route": true, "mult": 24 },
    "gentleman": { "fr": "Gentleman", "en": "Gentleman", "route": true, "mult": 72 },
    "beauty": { "fr": "Canon", "en": "Beauty", "route": true, "mult": 72 },
    "ruin_maniac": { "fr": "Ruine Maniac", "en": "Ruin Maniac", "route": true, "mult": 48 },
    "pokemaniac": { "fr": "Pokémaniac", "en": "Pokémaniac", "route": true, "mult": 60 },
    "hex_maniac": { "fr": "Kinésiste", "en": "Hex Maniac", "route": true, "mult": 24 },
    "dragon_tamer": { "fr": "Dracologue", "en": "Dragon Tamer", "route": true, "mult": 48 },
    "tuber": { "fr": "Flotteur", "en": "Tuber", "route": true, "mult": 4 },
    "kindler": { "fr": "Crache-Feu", "en": "Kindler", "route": true, "mult": 32 },
    "twins": { "fr": "Jumelles", "en": "Twins", "route": true, "mult": 24 }
  };

  // Alias PascalCase pour interopérabilité maximale avec les moteurs Gen 1 / Gen 2
  var pascalMap = {
    "RichBoy": "rich_boy",
    "Lady": "lady",
    "Triathlete": "triathlete",
    "AromaLady": "aroma_lady",
    "PokemonRanger": "pokemon_ranger",
    "Collector": "collector",
    "NinjaBoy": "ninja_boy",
    "ParasolLady": "parasol_lady",
    "Sailor": "sailor",
    "Fisherman": "fisherman",
    "Hiker": "hiker",
    "Youngster": "youngster",
    "Lass": "lass",
    "SwimmerM": "swimmer_m",
    "SwimmerF": "swimmer_f",
    "TeamAqua": "team_aqua",
    "TeamMagma": "team_magma",
    "Leader": "leader",
    "EliteFour": "elite_four",
    "Champion": "champion",
    "Expert": "expert",
    "BugCatcher": "bug_catcher",
    "Camper": "camper",
    "Picnicker": "picnicker",
    "CooltrainerM": "cooltrainer_m",
    "CooltrainerF": "cooltrainer_f",
    "Guitarist": "guitarist",
    "BirdKeeper": "bird_keeper",
    "BlackBelt": "black_belt",
    "BattleGirl": "battle_girl",
    "Psychic": "psychic",
    "Gentleman": "gentleman",
    "Beauty": "beauty",
    "RuinManiac": "ruin_maniac",
    "Pokemaniac": "pokemaniac",
    "HexManiac": "hex_maniac",
    "DragonTamer": "dragon_tamer",
    "Tuber": "tuber",
    "Kindler": "kindler",
    "Twins": "twins"
  };

  for (var pKey in pascalMap) {
    var target = CLASSES[pascalMap[pKey]];
    if (target && !CLASSES[pKey]) {
      CLASSES[pKey] = target;
    }
  }

  W.POKE_GEN3_CLASSES = CLASSES;

})(typeof window !== "undefined" ? window : globalThis);
