(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOENN (GEN 3) — LES 76 TALENTS CANONIQUES & HELPER PokeTalents
  //  Base de données exhaustive des talents introduits en 3e génération.
  // ═══════════════════════════════════════════════════════════════════════════

  var TALENTS = {
    STENCH:        { id: "STENCH",        nom: { fr: "Puanteur",        en: "Stench" },        desc: { fr: "Éloigne les Pokémon sauvages.",                  en: "Helps repel wild Pokémon." } },
    DRIZZLE:       { id: "DRIZZLE",       nom: { fr: "Crachin",         en: "Drizzle" },       desc: { fr: "Invoque la pluie en entrant en combat.",        en: "Summons rain in battle." } },
    SPEED_BOOST:   { id: "SPEED_BOOST",   nom: { fr: "Turbo",           en: "Speed Boost" },   desc: { fr: "Augmente la Vitesse à chaque tour.",            en: "Gradually boosts Speed." } },
    BATTLE_ARMOR:  { id: "BATTLE_ARMOR",  nom: { fr: "Armurbaston",     en: "Battle Armor" },  desc: { fr: "Empêche l'ennemi de porter des coups critiques.", en: "Blocks critical hits." } },
    STURDY:        { id: "STURDY",        nom: { fr: "Fermeté",         en: "Sturdy" },        desc: { fr: "Protège contre les attaques de K.O. en un coup.", en: "Negates 1-hit KO attacks." } },
    DAMP:          { id: "DAMP",          nom: { fr: "Moiteur",         en: "Damp" },          desc: { fr: "Empêche l'utilisation de Destruction et Explosion.", en: "Prevents combatants from self-destructing." } },
    LIMBER:        { id: "LIMBER",        nom: { fr: "Échauffement",    en: "Limber" },        desc: { fr: "Immunise le Pokémon contre la paralysie.",       en: "Prevents paralysis." } },
    SAND_VEIL:     { id: "SAND_VEIL",     nom: { fr: "Voile Sable",     en: "Sand Veil" },     desc: { fr: "Augmente l'esquive sous la tempête de sable.",   en: "Ups evasion in a sandstorm." } },
    STATIC:        { id: "STATIC",        nom: { fr: "Statik",          en: "Static" },        desc: { fr: "Peut paralyser au contact.",                     en: "Paralyzes on contact." } },
    VOLT_ABSORB:   { id: "VOLT_ABSORB",   nom: { fr: "Absorb Volt",     en: "Volt Absorb" },   desc: { fr: "Rend des PV si touché par une attaque Électrik.", en: "Turns electricity into HP." } },
    WATER_ABSORB:  { id: "WATER_ABSORB",  nom: { fr: "Absorb Eau",      en: "Water Absorb" },  desc: { fr: "Rend des PV si touché par une attaque Eau.",     en: "Turns water into HP." } },
    OBLIVIOUS:     { id: "OBLIVIOUS",     nom: { fr: "Benêt",           en: "Oblivious" },     desc: { fr: "Immunise le Pokémon contre l'attraction.",       en: "Prevents attraction." } },
    CLOUD_NINE:    { id: "CLOUD_NINE",    nom: { fr: "Ciel Gris",       en: "Cloud Nine" },    desc: { fr: "Neutralise les effets de la météo.",             en: "Negates weather effects." } },
    COMPOUND_EYES: { id: "COMPOUND_EYES", nom: { fr: "Œil Composé",     en: "Compound Eyes" }, desc: { fr: "Augmente la précision des attaques.",            en: "Raises accuracy." } },
    INSOMNIA:      { id: "INSOMNIA",      nom: { fr: "Insomnie",        en: "Insomnia" },      desc: { fr: "Empêche le Pokémon de s'endormir.",              en: "Prevents sleep." } },
    COLOR_CHANGE:  { id: "COLOR_CHANGE",  nom: { fr: "Déguisement",     en: "Color Change" },  desc: { fr: "Prend le type de l'attaque ennemie reçue.",      en: "Changes type to foe's move." } },
    IMMUNITY:      { id: "IMMUNITY",      nom: { fr: "Vaccin",          en: "Immunity" },      desc: { fr: "Immunise le Pokémon contre l'empoisonnement.",   en: "Prevents poisoning." } },
    FLASH_FIRE:    { id: "FLASH_FIRE",    nom: { fr: "Torche",          en: "Flash Fire" },    desc: { fr: "Immunise au Feu et renforce ses attaques Feu.",  en: "Powers up if hit by fire." } },
    SHIELD_DUST:   { id: "SHIELD_DUST",   nom: { fr: "Écran Poudre",    en: "Shield Dust" },   desc: { fr: "Bloque les effets secondaires des attaques adverses.", en: "Prevents added effects." } },
    OWN_TEMPO:     { id: "OWN_TEMPO",     nom: { fr: "Tempo Perso",     en: "Own Tempo" },     desc: { fr: "Empêche le Pokémon d'être confus.",              en: "Prevents confusion." } },
    SUCTION_CUPS:  { id: "SUCTION_CUPS",  nom: { fr: "Ventouse",        en: "Suction Cups" },  desc: { fr: "Empêche d'être forcé à quitter le combat.",      en: "Firmly anchors the body." } },
    INTIMIDATE:    { id: "INTIMIDATE",    nom: { fr: "Intimidation",    en: "Intimidate" },    desc: { fr: "Baisse l'Attaque ennemie à l'entrée.",           en: "Lowers the foe's Attack." } },
    SHADOW_TAG:    { id: "SHADOW_TAG",    nom: { fr: "Marque Ombre",    en: "Shadow Tag" },    desc: { fr: "Empêche le Pokémon ennemi de fuir.",             en: "Prevents the foe's escape." } },
    ROUGH_SKIN:    { id: "ROUGH_SKIN",    nom: { fr: "Peau Dure",       en: "Rough Skin" },    desc: { fr: "Blesse l'ennemi en cas de contact.",             en: "Hurts on contact." } },
    WONDER_GUARD:  { id: "WONDER_GUARD",  nom: { fr: "Garde Mystik",    en: "Wonder Guard" },  desc: { fr: "Seules les attaques super efficaces blessent.",  en: "Only super-effective hits harm." } },
    LEVITATE:      { id: "LEVITATE",      nom: { fr: "Lévitation",      en: "Levitate" },      desc: { fr: "Immunise contre les attaques de type Sol.",       en: "Not hit by Ground attacks." } },
    EFFECT_SPORE:  { id: "EFFECT_SPORE",  nom: { fr: "Pose Spore",      en: "Effect Spore" },  desc: { fr: "Peut paralyser, empoisonner ou endormir au contact.", en: "Leaves spores on contact." } },
    SYNCHRONIZE:   { id: "SYNCHRONIZE",   nom: { fr: "Synchro",         en: "Synchronize" },   desc: { fr: "Transmet le poison, la paralysie ou la brûlure.", en: "Passes on status problems." } },
    CLEAR_BODY:    { id: "CLEAR_BODY",    nom: { fr: "Corps Sain",      en: "Clear Body" },    desc: { fr: "Empêche la réduction des statistiques.",         en: "Prevents ability reduction." } },
    NATURAL_CURE:  { id: "NATURAL_CURE",  nom: { fr: "Médic Nature",    en: "Natural Cure" },  desc: { fr: "Soigne les statuts en quittant le combat.",      en: "Heals upon switching out." } },
    LIGHTNING_ROD: { id: "LIGHTNING_ROD", nom: { fr: "Paratonnerre",    en: "Lightning Rod" }, desc: { fr: "Attire les attaques Électrik.",                  en: "Draws electrical moves." } },
    SERENE_GRACE:  { id: "SERENE_GRACE",  nom: { fr: "Sérénité",        en: "Serene Grace" },  desc: { fr: "Double les chances des effets secondaires.",      en: "Promotes added effects." } },
    SWIFT_SWIM:    { id: "SWIFT_SWIM",    nom: { fr: "Glissade",        en: "Swift Swim" },    desc: { fr: "Double la Vitesse sous la pluie.",               en: "Raises Speed in rain." } },
    CHLOROPHYLL:   { id: "CHLOROPHYLL",   nom: { fr: "Chlorophylle",    en: "Chlorophyll" },   desc: { fr: "Double la Vitesse sous le soleil.",              en: "Raises Speed in sunshine." } },
    ILLUMINATE:    { id: "ILLUMINATE",    nom: { fr: "Lumiattirance",   en: "Illuminate" },    desc: { fr: "Attire les Pokémon sauvages.",                   en: "Encounter rate increases." } },
    TRACE:         { id: "TRACE",         nom: { fr: "Calque",          en: "Trace" },         desc: { fr: "Imite le talent de l'adversaire à l'entrée.",    en: "Copies special ability." } },
    HUGE_POWER:    { id: "HUGE_POWER",    nom: { fr: "Coloforce",       en: "Huge Power" },    desc: { fr: "Double l'Attaque du Pokémon.",                   en: "Raises Attack." } },
    POISON_POINT:  { id: "POISON_POINT",  nom: { fr: "Point Poison",    en: "Poison Point" },  desc: { fr: "Peut empoisonner au contact.",                   en: "Poisons foe on contact." } },
    INNER_FOCUS:   { id: "INNER_FOCUS",   nom: { fr: "Attention",       en: "Inner Focus" },   desc: { fr: "Empêche le Pokémon d'avoir peur.",               en: "Prevents flinching." } },
    MAGMA_ARMOR:   { id: "MAGMA_ARMOR",   nom: { fr: "Armumagma",       en: "Magma Armor" },   desc: { fr: "Immunise le Pokémon contre le gel.",             en: "Prevents freezing." } },
    WATER_VEIL:    { id: "WATER_VEIL",    nom: { fr: "Ignifu-Voile",    en: "Water Veil" },    desc: { fr: "Immunise le Pokémon contre les brûlures.",        en: "Prevents burns." } },
    MAGNET_PULL:   { id: "MAGNET_PULL",   nom: { fr: "Magnépiège",      en: "Magnet Pull" },   desc: { fr: "Empêche les Pokémon Acier de fuir.",             en: "Traps Steel-type Pokémon." } },
    SOUNDPROOF:    { id: "SOUNDPROOF",    nom: { fr: "Anti-Bruit",      en: "Soundproof" },    desc: { fr: "Immunise contre les attaques sonores.",          en: "Avoids sound-based moves." } },
    RAIN_DISH:     { id: "RAIN_DISH",     nom: { fr: "Cuvette",         en: "Rain Dish" },     desc: { fr: "Régénère des PV sous la pluie.",                 en: "Slight HP recovery in rain." } },
    SAND_STREAM:   { id: "SAND_STREAM",   nom: { fr: "Sable Volant",    en: "Sand Stream" },   desc: { fr: "Invoque une tempête de sable en entrant en combat.", en: "Summons a sandstorm." } },
    PRESSURE:      { id: "PRESSURE",      nom: { fr: "Pression",        en: "Pressure" },      desc: { fr: "Force l'ennemi à dépenser 2 PP par coup.",       en: "Raises foe's PP usage." } },
    THICK_FAT:     { id: "THICK_FAT",     nom: { fr: "Isograisse",      en: "Thick Fat" },     desc: { fr: "Divise par 2 les dégâts Feu et Glace reçus.",    en: "Heat-and-cold protection." } },
    EARLY_BIRD:    { id: "EARLY_BIRD",    nom: { fr: "Matinal",         en: "Early Bird" },    desc: { fr: "Le Pokémon se réveille deux fois plus vite.",    en: "Awakens quickly from sleep." } },
    FLAME_BODY:    { id: "FLAME_BODY",    nom: { fr: "Corps Ardent",    en: "Flame Body" },    desc: { fr: "Peut brûler au contact.",                        en: "Burns the foe on contact." } },
    RUN_AWAY:      { id: "RUN_AWAY",      nom: { fr: "Fuite",           en: "Run Away" },      desc: { fr: "Permet de fuir n'importe quel combat sauvage.",  en: "Makes escaping easier." } },
    KEEN_EYE:      { id: "KEEN_EYE",      nom: { fr: "Regard Vif",      en: "Keen Eye" },      desc: { fr: "Empêche la précision de baisser.",               en: "Prevents loss of accuracy." } },
    HYPER_CUTTER:  { id: "HYPER_CUTTER",  nom: { fr: "Hyper Cutter",    en: "Hyper Cutter" },  desc: { fr: "Empêche l'Attaque de baisser.",                  en: "Prevents Attack reduction." } },
    PICKUP:        { id: "PICKUP",        nom: { fr: "Ramassage",       en: "Pickup" },        desc: { fr: "Permet parfois de trouver des objets après un combat.", en: "May pick up items." } },
    TRUANT:        { id: "TRUANT",        nom: { fr: "Absentéisme",     en: "Truant" },        desc: { fr: "Le Pokémon n'agit qu'un tour sur deux.",         en: "Moves only every two turns." } },
    HUSTLE:        { id: "HUSTLE",        nom: { fr: "Agitation",       en: "Hustle" },        desc: { fr: "Augmente l'Attaque mais réduit la précision.",    en: "Powers up moves, but unaligned." } },
    CUTE_CHARM:    { id: "CUTE_CHARM",    nom: { fr: "Joli Sourire",    en: "Cute Charm" },    desc: { fr: "Peut rendre amoureux au contact.",               en: "Infatuates on contact." } },
    PLUS:          { id: "PLUS",          nom: { fr: "Plus",            en: "Plus" },          desc: { fr: "Améliore l'Attaque Spéciale si un allié a Minus.", en: "Powers up with Minus." } },
    MINUS:         { id: "MINUS",         nom: { fr: "Minus",           en: "Minus" },         desc: { fr: "Améliore l'Attaque Spéciale si un allié a Plus.",  en: "Powers up with Plus." } },
    FORECAST:      { id: "FORECAST",      nom: { fr: "Météo",           en: "Forecast" },      desc: { fr: "Change la forme et le type selon le climat.",    en: "Changes with the weather." } },
    STICKY_HOLD:   { id: "STICKY_HOLD",   nom: { fr: "Glue",            en: "Sticky Hold" },   desc: { fr: "Empêche le vol de l'objet tenu.",                en: "Prevents item theft." } },
    SHED_SKIN:     { id: "SHED_SKIN",     nom: { fr: "Mue",             en: "Shed Skin" },     desc: { fr: "Peut guérir d'un statut à la fin du tour.",      en: "Heals the body by shedding." } },
    GUTS:          { id: "GUTS",          nom: { fr: "Cran",            en: "Guts" },          desc: { fr: "Augmente l'Attaque en cas d'altération de statut.", en: "Boosts Attack on status." } },
    MARVEL_SCALE:  { id: "MARVEL_SCALE",  nom: { fr: "Écaille Spéciale", en: "Marvel Scale" }, desc: { fr: "Augmente la Défense en cas de statut.",           en: "Ups Defense on status." } },
    LIQUID_OOZE:   { id: "LIQUID_OOZE",   nom: { fr: "Suintement",      en: "Liquid Ooze" },   desc: { fr: "Blesse l'ennemi qui draine des PV.",             en: "Draining causes damage." } },
    OVERGROW:      { id: "OVERGROW",      nom: { fr: "Engrais",         en: "Overgrow" },      desc: { fr: "Booste les attaques Plante en cas de crise.",    en: "Ups Grass moves in a pinch." } },
    BLAZE:         { id: "BLAZE",         nom: { fr: "Brasier",         en: "Blaze" },         desc: { fr: "Booste les attaques Feu en cas de crise.",       en: "Ups Fire moves in a pinch." } },
    TORRENT:       { id: "TORRENT",       nom: { fr: "Torrent",         en: "Torrent" },       desc: { fr: "Booste les attaques Eau en cas de crise.",       en: "Ups Water moves in a pinch." } },
    SWARM:         { id: "SWARM",         nom: { fr: "Essaim",          en: "Swarm" },         desc: { fr: "Booste les attaques Insecte en cas de crise.",    en: "Ups Bug moves in a pinch." } },
    ROCK_HEAD:     { id: "ROCK_HEAD",     nom: { fr: "Tête de Roc",     en: "Rock Head" },     desc: { fr: "Empêche les dégâts de recul.",                   en: "Prevents recoil damage." } },
    DROUGHT:       { id: "DROUGHT",       nom: { fr: "Sécheresse",      en: "Drought" },       desc: { fr: "Invoque le soleil en entrant en combat.",        en: "Summons sunlight in battle." } },
    ARENA_TRAP:    { id: "ARENA_TRAP",    nom: { fr: "Piège Sable",     en: "Arena Trap" },    desc: { fr: "Empêche l'ennemi au sol de fuir.",               en: "Prevents fleeing." } },
    VITAL_SPIRIT:  { id: "VITAL_SPIRIT",  nom: { fr: "Esprit Vital",    en: "Vital Spirit" },  desc: { fr: "Empêche le Pokémon de s'endormir.",              en: "Prevents sleep." } },
    WHITE_SMOKE:   { id: "WHITE_SMOKE",   nom: { fr: "Écran Fumée",     en: "White Smoke" },   desc: { fr: "Empêche la réduction des statistiques.",         en: "Prevents ability reduction." } },
    PURE_POWER:    { id: "PURE_POWER",    nom: { fr: "Force Pure",      en: "Pure Power" },    desc: { fr: "Double l'Attaque du Pokémon.",                   en: "Raises Attack." } },
    SHELL_ARMOR:   { id: "SHELL_ARMOR",   nom: { fr: "Coque Armure",    en: "Shell Armor" },   desc: { fr: "Empêche les coups critiques adverses.",          en: "Blocks critical hits." } },
    AIR_LOCK:      { id: "AIR_LOCK",      nom: { fr: "Air Lock",        en: "Air Lock" },      desc: { fr: "Neutralise tous les effets de la météo.",        en: "Negates weather effects." } }
  };

  var CLES = Object.keys(TALENTS);

  function table() {
    return TALENTS;
  }

  function cles() {
    return CLES.slice();
  }

  function liste() {
    return CLES.slice();
  }

  function nom(cle, lang) {
    var t = TALENTS[cle];
    if (!t) return cle || "";
    var l = lang || "fr";
    return (t.nom && (t.nom[l] || t.nom.fr)) || cle;
  }

  function desc(cle, lang) {
    var t = TALENTS[cle];
    if (!t) return "";
    var l = lang || "fr";
    return (t.desc && (t.desc[l] || t.desc.fr)) || "";
  }

  function de(p) {
    if (!p) return null;
    if (p.talent) return p.talent;
    if (p.n) {
      var esp = W.PokeRegles ? W.PokeRegles.especes() : (W.POKE_GEN3_ESPECE || W.POKE_GEN2_ESPECE || W.POKE_ESPECE);
      if (esp && esp[p.n] && esp[p.n].talent) return esp[p.n].talent;
    }
    return null;
  }

  W.POKE_GEN3_TALENTS = TALENTS;
  W.PokeTalents = {
    table: table,
    cles: cles,
    liste: liste,
    nom: nom,
    desc: desc,
    de: de,
  };
})(typeof window !== "undefined" ? window : globalThis);
