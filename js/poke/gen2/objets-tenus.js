(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES OBJETS TENUS — LA GRANDE MÉCANIQUE DE 1999
  //
  //  🔴 UN POKÉMON DE 1996 NE PORTE RIEN. En 1999, soixante et une espèces
  //     sauvages arrivent avec quelque chose en main — Ronflex a TOUJOURS des
  //     Restes, Pikachu porte parfois une Baie — et c'est ce qui change la
  //     texture d'un combat : un adversaire qui se soigne tout seul, un coup
  //     qui rate parce qu'il tient de la Poudre Claire.
  //
  //  🔑 CE FICHIER NE CONTIENT AUCUNE MÉCANIQUE, seulement des NOMBRES. Le
  //     moteur sait déjà soigner, rater et frapper fort ; ce qu'il ne sait pas,
  //     c'est de combien. Mettre ces valeurs dans `combat.js` y planterait une
  //     connaissance de la gen 2, qui n'a rien à y faire — même raison que la
  //     table de traduction des effets.
  //
  //  🔑 UN TIRAGE QUI NE SE PAIE QUE PAR LE PORTEUR NE COÛTE RIEN AUX AUTRES.
  //     C'est ce qui débloque les trois derniers. On avait écarté Vive Griffe
  //     et Roche Royale comme « un jet par tour » — mais le jet ne se fait QUE
  //     si l'objet est en main, et deux pour cent des créatures en portent un.
  //     La promesse du dossier n'est pas « aucun tirage neuf », c'est « aucun
  //     tirage qu'on n'ait dit » : ils sont dits ici, avec leur seuil.
  //
  //  🔴 RIEN NE CHARGE CE FICHIER — voir `tools/poke-gen2-close.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  //  Les dix-sept renforts de type. ×1,1 sur les dégâts d'un coup du même type
  //  que l'objet — c'est la valeur du ROM, pas une estimation.
  var BOOST = {
    HELD_NORMAL_BOOST: "normal", HELD_FIGHTING_BOOST: "fighting",
    HELD_FLYING_BOOST: "flying", HELD_POISON_BOOST: "poison",
    HELD_GROUND_BOOST: "ground", HELD_ROCK_BOOST: "rock",
    HELD_BUG_BOOST: "bug", HELD_GHOST_BOOST: "ghost", HELD_STEEL_BOOST: "steel",
    HELD_FIRE_BOOST: "fire", HELD_WATER_BOOST: "water", HELD_GRASS_BOOST: "grass",
    HELD_ELECTRIC_BOOST: "electric", HELD_PSYCHIC_BOOST: "psychic",
    HELD_ICE_BOOST: "ice", HELD_DRAGON_BOOST: "dragon", HELD_DARK_BOOST: "dark",
  };

  W.POKE_GEN2_TENUS = {
    // Le renfort de type : ×1,1, arrondi comme le ROM arrondit.
    boost: BOOST,
    boostFacteur: 1.1,

    // Les Restes : un seizième des PV maximum à chaque fin de tour. C'est
    // l'objet le plus visible de la génération, et le plus simple.
    leftovers: { effet: "HELD_LEFTOVERS", part: 16 },

    // La Poudre Claire : le coup adverse perd un dixième de sa précision. Pas
    // de jet en plus — on déplace le seuil d'un jet qui existe déjà.
    brightpowder: { effet: "HELD_BRIGHTPOWDER", precision: 0.9 },

    // La Lentille Scope : le taux de critique double. Même règle, même jet.
    critique: { effet: "HELD_CRITICAL_UP", facteur: 2 },

    // La Poudre Métal : la Défense de Métamorph ×1,5, et seulement la sienne.
    metalPowder: { effet: "HELD_METAL_POWDER", espece: 132, facteur: 1.5 },

    // ═══════════════════════════════════════════════════════════════════════
    //  LES BAIES — ELLES SE CONSOMMENT, ET C'EST CE QUI LES REND JUSTES
    //
    //  🔴 UNE BAIE QUI NE DISPARAÎT PAS EST UN SOIN INFINI. Le seuil se
    //     franchit une fois, l'objet part, et le tour suivant le Pokémon est
    //     seul — c'est le marché du canon, et sans lui un Ronflex sauvage
    //     deviendrait imbattable.
    //  ⚠️ AUCUN TIRAGE : le déclenchement est un SEUIL sur les points de vie,
    //     pas un jet.
    // ═══════════════════════════════════════════════════════════════════════
    baies: {
      HELD_BERRY: { soigne: 10, seuil: 0.5 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  LES TROIS DERNIERS, ET CE QU'ILS COÛTENT  [19/08/2026, nuit]
    //
    //  🔴 LEURS NOMBRES SONT DANS LA TABLE D'OBJETS DU ROM, troisième colonne
    //     de `item_attribute` : Vive Griffe **60**, Roche Royale **30**, sur
    //     256. Baie Mystère porte **−1** et Baie Amère **0** — pas un seuil de
    //     hasard : ces deux-là ne se jouent pas aux dés, et les ranger parmi
    //     « ce qui demande un tirage » était une erreur de lecture.
    // ═══════════════════════════════════════════════════════════════════════
    //  La Vive Griffe : elle passe devant, mais SEULEMENT à priorité égale.
    //  ⚠️ UN TIRAGE, ET SEULEMENT SI QUELQU'UN EN PORTE UNE.
    viveGriffe: { effet: "HELD_QUICK_CLAW", sur: 256, seuil: 60 },
    //  La Roche Royale : elle apeure sur un coup qui a porté.
    //  ⚠️ UN TIRAGE PAR COUP PORTÉ, et seulement par son porteur.
    flinch: { effet: "HELD_FLINCH", sur: 256, seuil: 30 },
    //  La Baie Mystère : cinq points de pouvoir rendus au coup qui vient de
    //  tomber à zéro. Aucun tirage — c'est un seuil, comme les autres baies.
    rendPP: { effet: "HELD_RESTORE_PP", pp: 5 },

    // Les baies de statut : elles lèvent l'état et se consomment.
    soins: {
      HELD_HEAL_POISON: ["poison", "poisonGrave"],
      HELD_HEAL_PARALYZE: ["para"],
      HELD_HEAL_FREEZE: ["gel"],
      HELD_HEAL_BURN: ["brulure"],
      HELD_HEAL_SLEEP: ["sommeil"],
      HELD_HEAL_STATUS: ["poison", "poisonGrave", "para", "gel", "brulure", "sommeil"],
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'AUCUN JOUEUR NE PEUT OBTENIR — ET QU'ON N'ÉCRIT DONC PAS
  //
  //  🔴 CINQ OBJETS TENUS N'ONT AUCUNE PORTE D'ENTRÉE dans ce mode : **aucune
  //     espèce sauvage ne les porte** (leur fiche ne les nomme pas) et
  //     **aucune boutique ne les vend** (vérifié sur les 34 comptoirs de
  //     `POKE_GEN2_MARTS`). Leur écrire une mécanique serait du contenu écrit
  //     et jamais montré — la classe de défaut la plus chère du dossier, et
  //     celle qu'on est le plus content de ne pas créer.
  //  🔑 LA LISTE EST DONC UNE CONSTATATION, PAS UNE DETTE. Le jour où une de
  //     ces portes s'ouvre — une boutique, un butin, une rencontre fixe — la
  //     ligne le dira, et `tools/poke-tenus-atteignables.mjs` fera ROUGIR la
  //     livraison au lieu de laisser l'objet inerte en main du joueur.
  // ═══════════════════════════════════════════════════════════════════════════
  W.POKE_GEN2_TENUS_HORS_DE_PORTEE = {
    HELD_FOCUS_BAND: "Bandeau — survivrait à 1 PV (30/256)",
    HELD_AMULET_COIN: "Pièce Rune — doublerait l'argent, hors combat",
    HELD_CLEANSE_TAG: "Rune Purifiante — éloignerait les sauvages, hors combat",
    HELD_ESCAPE: "Boule Fumée — fuite garantie",
    HELD_HEAL_CONFUSION: "Baie Amère — lèverait la confusion (un volatil, pas un statut)",
  };
})(typeof window !== "undefined" ? window : globalThis);
