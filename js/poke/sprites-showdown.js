// ═══════════════════════════════════════════════════════════════════════════
//  POKÉMON SHOWDOWN ANIMATED SPRITES MAPPER & OFFLINE-FIRST PROXY
//
//  Fournit la résolution d'adresses pour les sprites animés Showdown (GIF)
//  des 386 espèces (Kanto, Johto, Hoenn) avec repli instantané hors-ligne
//  vers les sprites locaux GBA (assets/img/poke/gen3/).
//
//  Zéro DOM · Zéro état mutable · Zéro Math.random · Zéro dépendance externe.
// ═══════════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  // Table normalisée des 386 espèces Pokémon (Générations 1 à 3)
  // Index 0 = #1 (Bulbizarre / Bulbasaur) ... Index 385 = #386 (Deoxys)
  var NOMS_SHOWDOWN = [
    "bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard",
    "squirtle","wartortle","blastoise","caterpie","metapod","butterfree",
    "weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot",
    "rattata","raticate","spearow","fearow","ekans","arbok",
    "pikachu","raichu","sandshrew","sandslash","nidoranf","nidorina",
    "nidoqueen","nidoranm","nidorino","nidoking","clefairy","clefable",
    "vulpix","ninetales","jigglypuff","wigglytuff","zubat","golbat",
    "oddish","gloom","vileplume","paras","parasect","venonat",
    "venomoth","diglett","dugtrio","meowth","persian","psyduck",
    "golduck","mankey","primeape","growlithe","arcanine","poliwag",
    "poliwhirl","poliwrath","abra","kadabra","alakazam","machop",
    "machoke","machamp","bellsprout","weepinbell","victreebel","tentacool",
    "tentacruel","geodude","graveler","golem","ponyta","rapidash",
    "slowpoke","slowbro","magnemite","magneton","farfetchd","doduo",
    "dodrio","seel","dewgong","grimer","muk","shellder",
    "cloyster","gastly","haunter","gengar","onix","drowzee",
    "hypno","krabby","kingler","voltorb","electrode","exeggcute",
    "exeggutor","cubone","marowak","hitmonlee","hitmonchan","lickitung",
    "koffing","weezing","rhyhorn","rhydon","chansey","tangela",
    "kangaskhan","horsea","seadra","goldeen","seaking","staryu",
    "starmie","mrmime","scyther","jynx","electabuzz","magmar",
    "pinsir","tauros","magikarp","gyarados","lapras","ditto",
    "eevee","vaporeon","jolteon","flareon","porygon","omanyte",
    "omastar","kabuto","kabutops","aerodactyl","snorlax","articuno",
    "zapdos","moltres","dratini","dragonair","dragonite","mewtwo",
    "mew","chikorita","bayleef","meganium","cyndaquil","quilava",
    "typhlosion","totodile","croconaw","feraligatr","sentret","furret",
    "hoothoot","noctowl","ledyba","ledian","spinarak","ariados",
    "crobat","chinchou","lanturn","pichu","cleffa","igglybuff",
    "togepi","togetic","natu","xatu","mareep","flaaffy",
    "ampharos","bellossom","marill","azumarill","sudowoodo","politoed",
    "hoppip","skiploom","jumpluff","aipom","sunkern","sunflora",
    "yanma","wooper","quagsire","espeon","umbreon","murkrow",
    "slowking","misdreavus","unown","wobbuffet","girafarig","pineco",
    "forretress","dunsparce","gligar","steelix","snubbull","granbull",
    "qwilfish","scizor","shuckle","heracross","sneasel","teddiursa",
    "ursaring","slugma","magcargo","swinub","piloswine","corsola",
    "remoraid","octillery","delibird","mantine","skarmory","houndour",
    "houndoom","kingdra","phanpy","donphan","porygon2","stantler",
    "smeargle","tyrogue","hitmontop","smoochum","elekid","magby",
    "miltank","blissey","raikou","entei","suicune","larvitar",
    "pupitar","tyranitar","lugia","hooh","celebi","treecko",
    "grovyle","sceptile","torchic","combusken","blaziken","mudkip",
    "marshtomp","swampert","poochyena","mightyena","zigzagoon","linoone",
    "wurmple","silcoon","beautifly","cascoon","dustox","lotad",
    "lombre","ludicolo","seedot","nuzleaf","shiftry","taillow",
    "swellow","wingull","pelipper","ralts","kirlia","gardevoir",
    "surskit","masquerain","shroomish","breloom","slakoth","vigoroth",
    "slaking","nincada","ninjask","shedinja","whismur","loudred",
    "exploud","makuhita","hariyama","azurill","nosepass","skitty",
    "delcatty","sableye","mawile","aron","lairon","aggron",
    "meditite","medicham","electrike","manectric","plusle","minun",
    "volbeat","illumise","roselia","gulpin","swalot","carvanha",
    "sharpedo","wailmer","wailord","numel","camerupt","torkoal",
    "spoink","grumpig","spinda","trapinch","vibrava","flygon",
    "cacnea","cacturne","swablu","altaria","zangoose","seviper",
    "lunatone","solrock","barboach","whiscash","corphish","crawdaunt",
    "baltoy","claydol","lileep","cradily","anorith","armaldo",
    "feebas","milotic","castform","kecleon","shuppet","banette",
    "duskull","dusclops","tropius","chimecho","absol","wynaut",
    "snorunt","glalie","spheal","sealeo","walrein","clamperl",
    "huntail","gorebyss","relicanth","luvdisc","bagon","shelgon",
    "salamence","beldum","metang","metagross","regirock","regice",
    "registeel","latias","latios","kyogre","groudon","rayquaza",
    "jirachi","deoxys"
  ];

  function normaliserNom(s) {
    if (!s) return "";
    var str = String(s).trim().toLowerCase();
    str = str.replace(/[♀]/g, "f").replace(/[♂]/g, "m");
    return str.replace(/[^a-z0-9]/g, "");
  }

  function numDe(mon) {
    if (mon == null) return 0;
    if (typeof mon === "number") return mon;
    if (typeof mon === "object") {
      if (typeof mon.n === "number") return mon.n;
      if (typeof mon.n === "string" && !isNaN(Number(mon.n))) return Number(mon.n);
    }
    if (typeof mon === "string" && !isNaN(Number(mon))) return Number(mon);
    return 0;
  }

  function nomShowdown(mon) {
    var n = numDe(mon);
    if (n >= 1 && n <= 386) {
      return NOMS_SHOWDOWN[n - 1];
    }
    if (typeof mon === "object" && mon !== null) {
      if (mon.nom && mon.nom.en) return normaliserNom(mon.nom.en);
      if (mon.cle) return normaliserNom(mon.cle);
    } else if (typeof mon === "string") {
      return normaliserNom(mon);
    }
    return "";
  }

  function aniFace(mon, suffixe) {
    var nom = nomShowdown(mon);
    var sfx = suffixe ? (suffixe.charAt(0) === "-" ? suffixe : "-" + suffixe) : "";
    var dossier = (mon && mon.chromatique) ? "ani-shiny/" : "ani/";
    return "https://play.pokemonshowdown.com/sprites/" + dossier + nom + sfx + ".gif";
  }

  function aniDos(mon, suffixe) {
    var nom = nomShowdown(mon);
    var sfx = suffixe ? (suffixe.charAt(0) === "-" ? suffixe : "-" + suffixe) : "";
    var dossier = (mon && mon.chromatique) ? "ani-back-shiny/" : "ani-back/";
    return "https://play.pokemonshowdown.com/sprites/" + dossier + nom + sfx + ".gif";
  }

  function repliFace(mon) {
    var id = numDe(mon) || ((typeof mon === "object" && mon !== null) ? mon.n : mon);
    return "assets/img/poke/gen3/face/" + id + ".png?i=6";
  }

  function repliDos(mon) {
    var id = numDe(mon) || ((typeof mon === "object" && mon !== null) ? mon.n : mon);
    return "assets/img/poke/gen3/dos/" + id + ".png?i=6";
  }

  function ani(mon, cote, suffixe) {
    return cote === "joueur" ? aniDos(mon, suffixe) : aniFace(mon, suffixe);
  }

  function repli(mon, cote) {
    return cote === "joueur" ? repliDos(mon) : repliFace(mon);
  }

  var PokeSpritesShowdown = {
    nomShowdown: nomShowdown,
    aniFace: aniFace,
    aniDos: aniDos,
    repliFace: repliFace,
    repliDos: repliDos,
    ani: ani,
    repli: repli,
    NOMS: NOMS_SHOWDOWN
  };

  W.PokeSpritesShowdown = PokeSpritesShowdown;

})(typeof window !== "undefined" ? window : globalThis);
