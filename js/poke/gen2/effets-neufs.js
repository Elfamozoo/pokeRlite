(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS QUE 1996 N'A PAS — LES NOMBRES, PAS LA MÉCANIQUE
  //
  //  🔴 CE FICHIER NE CONTIENT AUCUN CODE DE COMBAT. Le moteur sait déjà
  //     baisser un palier, poser un drapeau et user un Pokémon en fin de tour ;
  //     ce qu'il ne sait pas, c'est de combien et pendant combien de tours.
  //     Mettre ces valeurs dans `combat.js` y planterait une connaissance de la
  //     seconde génération, qui n'a rien à y faire — même raison que la table
  //     de traduction des effets et celle des objets tenus.
  //
  //  🔑 DEUX TABLES, ET LA SÉPARATION EST LA PROMESSE. `SANS_JET` ne coûte pas
  //     un tirage ; `AVEC_JET` en coûte un par emploi, et c'est écrit sur la
  //     porte. Un jet ne s'ajoute jamais sans qu'on le dise — il se dit ici,
  //     effet par effet, avec le nombre exact de tirages qu'il consomme.
  //
  //  🔴 RIEN NE CHARGE CE FICHIER — voir `tools/poke-gen2-close.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Les paliers que la gen 1 ne porte pas ──────────────────────────────────
  //  🔴 ILS NE PEUVENT PAS VIVRE DANS LA TABLE DE `combat.js`. Aucune attaque
  //     de 1996 ne les emploie, et `poke-effets-fantomes` refuse — à juste
  //     titre — une clé morte des deux côtés. Ils s'ajoutent donc PAR LE JEU DE
  //     RÈGLES, et disparaissent avec lui.
  //  Forme : [statistique, crans, pour-cent de déclenchement] — celle du moteur.
  var PALIERS = {
    EFFECT_ATTACK_DOWN_2: ["atk", -2, 100],
    EFFECT_SPEED_DOWN_2: ["vit", -2, 100],
    EFFECT_EVASION_DOWN: ["esquive", -1, 100],
    // ── Les montées qui arrivent EN FRAPPANT  [19/08/2026, nuit] ─────────────────
    //  🔴 1996 N'EN A AUCUNE. Toutes ses montées de palier sont des coups sans
    //     puissance : on passe un tour à se préparer. 1999 invente le coup qui
    //     FRAPPE et qui monte — une fois sur dix, et c'est ce dixième qui rend
    //     Griffe Acier autre chose qu'une Charge en Acier.
    //  🔑 LA MONTÉE VA SUR SOI, et la table le dit déjà : le moteur lit le
    //     signe (un palier positif se pose sur le lanceur). Rien à ajouter —
    //     la règle existait, il n'y avait personne pour l'employer.
    EFFECT_ATTACK_UP_HIT: ["atk", 1, 10],
    EFFECT_DEFENSE_UP_HIT: ["def", 1, 10],
    //  ⚠️ CELLE-CI EN MONTE CINQ D'UN COUP, et c'est toute l'identité de
    //     Pouvoir Antique — le coup de l'Ptéra du Maître. Une LISTE de
    //     statistiques au lieu d'une seule : le moteur boucle, il ne fait pas
    //     un cas à part. Les noms `sat` et `sdf` n'existent que dans ce
    //     monde-ci, et c'est précisément pourquoi cette ligne vit ici.
    EFFECT_ALL_UP_HIT: [["atk", "def", "vit", "sat", "sdf"], 1, 10],
  };

  // ── Les pièges du sol ──────────────────────────────────────────────────────
  //  🔴 UNE MÉCANIQUE QUE 1996 N'A PAS DU TOUT : un coup qui ne vise PERSONNE.
  //     Les Picots se posent sur le terrain d'en face et attendent. Ils ne
  //     touchent pas l'actif, ils touchent le SUIVANT — c'est la première fois
  //     que le jeu fait payer un remplacement, et c'est ce qui donne un sens à
  //     Regard Noir, au Requiem et à tout le jeu de piégeage de la génération.
  //  ⚠️ ILS NE PARTENT PAS AVEC LE POKÉMON. Un piège vit sur le CAMP, pas dans
  //     les volatils : changer est justement ce qu'il punit.
  //  🔑 CE QUI VOLE NE LES TOUCHE PAS. Pas une douceur : le canon, et la seule
  //     raison pour laquelle un type Vol garde une place dans une équipe qui
  //     tourne.
  var PIEGES = [
    { cle: "picots", part: 8, epargneTypes: ["flying"] },
  ];

  // ── Les deux coups qui se jouent EN DORMANT ────────────────────────────────
  //  🔴 SANS CETTE LISTE, LES DEUX SONT INJOUABLES. Le sommeil de 1996 prend le
  //     tour AVANT qu'on sache quel coup a été choisi — c'est la bonne règle
  //     pour 1996, où aucun coup ne se joue endormi. 1999 en ajoute deux, et
  //     ils n'ont de sens QUE là : Blabla Dodo (CT35) rejoue un autre coup en
  //     dormant, Ronflement (CT13) frappe à quarante en ronflant. Écrits tous
  //     les deux, atteignables ni l'un ni l'autre.
  //  🔑 LA LISTE EST ICI, PAS DANS LE MOTEUR : c'est une règle de la seconde
  //     génération, et elle s'en va avec elle.
  var EN_DORMANT = ["SLEEP_TALK", "SNORE"];

  // ── La météo ───────────────────────────────────────────────────────────────
  //  🔴 C'EST LA MÉCANIQUE LA PLUS VISIBLE DE 1999, et elle ne coûte pas un
  //     seul tirage : cinq tours comptés, des multiplicateurs fixes, et une
  //     usure de fin de tour pour la tempête. Danse Pluie double presque l'Eau
  //     et étouffe le Feu ; Zénith fait l'inverse ; Tempête Sable ronge tout ce
  //     qui n'est ni Roche, ni Sol, ni Acier.
  //  ⚠️ LA TEMPÊTE ÉPARGNE TROIS TYPES, et c'est le canon — pas une douceur.
  var METEO = {
    EFFECT_RAIN_DANCE: { cle: "pluie", tours: 5 },
    EFFECT_SUNNY_DAY: { cle: "zenith", tours: 5 },
    EFFECT_SANDSTORM: { cle: "sable", tours: 5 },
  };
  var METEO_DEGATS = {
    // Multiplicateur sur les dégâts, par météo et par type de coup.
    pluie: { water: 1.5, fire: 0.5 },
    zenith: { fire: 1.5, water: 0.5 },
    sable: {},
  };
  var METEO_USURE = {
    // La tempête ronge un seizième par tour, sauf pour ces trois types.
    sable: { part: 16, epargne: ["rock", "ground", "steel"] },
  };

  // ── Les drapeaux à durée ───────────────────────────────────────────────────
  //  Chacun pose un compteur et rien d'autre. Aucun jet.
  var DUREES = {
    // Rune Protect : le camp ne peut plus recevoir de statut.
    EFFECT_SAFEGUARD: { cle: "rune", tours: 5, camp: true },
    // Regard Noir : l'adversaire ne peut plus fuir ni être rappelé.
    EFFECT_MEAN_LOOK: { cle: "regard", tours: 0, cible: true },
    // Requiem : trois tours, puis les deux tombent. Le compte à rebours est
    // posé sur les DEUX camps — c'est ce qui en fait un pari, pas une arme.
    EFFECT_PERISH_SONG: { cle: "requiem", tours: 4, deuxCamps: true },
    // Relais : le lanceur se retire ET passe ses paliers au suivant. On pose
    // un drapeau ; le REMPLACEMENT le lit et décide de garder ou de remettre à
    // zéro — c'est là que la règle vit, pas ici.
    EFFECT_BATON_PASS: { cle: "relais", tours: 1, soi: true },
    // Verrouillage : le coup suivant ne peut pas rater.
    EFFECT_LOCK_ON: { cle: "verrou", tours: 2, soi: true },
    // Clairvoyance : les immunités de l'adversaire tombent.
    EFFECT_FORESIGHT: { cle: "clairvoyance", tours: 0, cible: true },
    // Lien du Destin : si le lanceur tombe ce tour-ci, l'autre tombe avec lui.
    EFFECT_DESTINY_BOND: { cle: "lienDestin", tours: 1, soi: true },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUATRE EFFETS DE PLUS, ET TOUJOURS AUCUN TIRAGE  [19/08/2026]
  //
  //  🔴 MESURÉS AVANT D'ÊTRE ÉCRITS. Sur huit mille combats de Johto, dix-sept
  //     effets ne faisaient rien — mille quatre cent cinquante-trois emplois.
  //     Ces quatre-là en pèsent le tiers À EUX SEULS (450), et ils se calculent
  //     ENTIÈREMENT : une moitié de points de vie, une moyenne, un balayage de
  //     statuts, des crans fixes. Pas un jet. La promesse du dossier tient.
  //  ⚠️ LES TREIZE AUTRES RESTENT NOMMÉS dans `POKE_GEN2_EFFETS_NEUFS` : ils
  //     demandent un jet par emploi, et un tirage ne s'ajoute jamais sans qu'on
  //     le dise.
  // ═══════════════════════════════════════════════════════════════════════════
  var SANS_JET = {
    // ── Malédiction ──────────────────────────────────────────────────────────
    //  🔑 DEUX ATTAQUES DANS UNE, ET C'EST LE TYPE DU LANCEUR QUI TRANCHE. Un
    //     Spectre paie la moitié de ses PV et pose une plaie qui ronge le quart
    //     des PV de sa cible à chaque fin de tour ; tout autre monte Attaque et
    //     Défense et perd de la Vitesse. Le canon de 1999, à la lettre.
    EFFECT_CURSE: {
      quoi: "malediction",
      typeQuiPose: "ghost",
      coutPart: 2,          // le lanceur paie la MOITIÉ de ses PV maximum
      rongePart: 4,         // la cible perd le QUART des siens, chaque tour
      paliers: [["atk", 1], ["def", 1], ["vit", -1]],
    },
    // ── Glas de Soin : toute l'équipe se relève de ses statuts ───────────────
    EFFECT_HEAL_BELL: { quoi: "glasDeSoin" },
    // ── Cognobidon : la moitié des PV contre l'Attaque au maximum ───────────
    //  ⚠️ IL ÉCHOUE SOUS LA MOITIÉ DES PV, et c'est le canon : le marché n'est
    //     pas « gratuit si tu es mourant ».
    EFFECT_BELLY_DRUM: { quoi: "bideEnVrac", coutPart: 2, crans: 6 },
    // ── Balance : les deux repartent avec la moyenne ─────────────────────────
    EFFECT_PAIN_SPLIT: { quoi: "partage" },

    // ═══════════════════════════════════════════════════════════════════════
    //  CINQ DE PLUS, TOUJOURS SANS UN TIRAGE  [19/08/2026, nuit]
    // ═══════════════════════════════════════════════════════════════════════
    // ── Picots : le piège se pose, il ne frappe personne tout de suite ───────
    EFFECT_SPIKES: { quoi: "poserPiege", piege: "picots" },
    // ── Attraction ──────────────────────────────────────────────────────────
    //  🔴 ELLE NE COÛTE RIEN À POSER, et c'est ce qui surprend : le sexe est
    //     déjà dans la créature, donc la pose est une simple comparaison. Le
    //     tirage, lui, se paie CHAQUE TOUR où l'on est amoureux — une chance
    //     sur deux de ne rien faire.
    //  ⚠️ TROIS REFUS, TROIS CAUSES. Même sexe, pas de sexe du tout (vingt et
    //     une espèces, dont tous les légendaires), et déjà amoureux. Les
    //     confondre ferait passer Attraction pour un coup capricieux.
    EFFECT_ATTRACT: { quoi: "attraction", surDeux: 2 },
    // ── Cauchemar : il faut que l'autre DORME ────────────────────────────────
    //  🔑 ET IL S'ÉTEINT AU RÉVEIL. C'est ce qui l'attache au sommeil au lieu
    //     d'en faire une seconde Malédiction : Cauchemar est la moitié d'un
    //     plan, l'autre moitié est Hypnose.
    EFFECT_NIGHTMARE: { quoi: "cauchemar", rongePart: 4 },
    // ── Psykoud'Boul : on COPIE les paliers de l'autre ───────────────────────
    //  ⚠️ ON COPIE, ON NE VOLE PAS : l'autre garde les siens. Le coup ne sert
    //     donc qu'après une préparation adverse — un contre, pas une ouverture.
    EFFECT_PSYCH_UP: { quoi: "copiePaliers" },
    // ── Conversion 2 : prendre un type qui RÉSISTE au dernier coup reçu ──────
    //  🔴 CE N'EST PAS CONVERSION. Celle de 1996 prend les types de la cible ;
    //     celle-ci regarde le dernier coup JOUÉ par la cible et cherche un type
    //     qui l'encaisse mal — c'est une réponse, pas une imitation.
    //  ⚠️ AUCUN TIRAGE, ET C'EST UNE DIVERGENCE ÉCRITE : la cartouche tire au
    //     sort parmi les types qui résistent, on prend ici le premier dans
    //     l'ordre de la table. Un tirage de plus décalerait toutes les graines
    //     du mode pour un choix que le joueur ne peut pas distinguer.
    EFFECT_CONVERSION2: { quoi: "conversionDeux" },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES SIX QUI COÛTENT UN TIRAGE  [19/08/2026]
  //
  //  🔴 ILS ÉTAIENT LES SIX DERNIERS EFFETS MUETS EMPLOYÉS EN JEU — 42 emplois
  //     sur 300 combats de Johto, soit un combat sur sept qui contenait une
  //     attaque ne faisant rien. Quatre demandent un jet par emploi (Protection,
  //     Ténacité, Dépit, Bis), deux n'en demandent aucun (Voile Miroir,
  //     Gribouille) mais avaient besoin des mêmes coutures — l'ordre des tours
  //     et le dernier coup joué — donc ils voyagent ensemble.
  //  ⚠️ CHAQUE ENTRÉE DIT SON COÛT EN TIRAGES. `jets` n'est pas une décoration :
  //     `tools/poke-gen2-effets-avec-jet.mjs` s'en sert pour compter les
  //     tirages réellement consommés et refuser tout écart.
  // ═══════════════════════════════════════════════════════════════════════════
  var AVEC_JET = {
    // ── Protection / Détection ───────────────────────────────────────────────
    //  🔑 LA GARDE S'USE SI ON LA RÉPÈTE, et c'est toute la mécanique : le
    //     premier emploi passe toujours, le deuxième une fois sur deux, le
    //     troisième une fois sur quatre. Sans cette usure, Protection est un
    //     tour gratuit à l'infini et le combat n'avance plus.
    //  ⚠️ LE COMPTEUR EST PARTAGÉ AVEC TÉNACITÉ — c'est le ROM de 1999
    //     (`wPlayerProtectCount`), pas une simplification : alterner les deux
    //     n'esquive pas l'usure.
    EFFECT_PROTECT: { quoi: "abri", compteur: "gardeSuite", sur: 256, depart: 255, jets: 1 },
    // ── Ténacité : on survit à 1 point de vie ────────────────────────────────
    EFFECT_ENDURE: { quoi: "tenacite", compteur: "gardeSuite", sur: 256, depart: 255, jets: 1 },
    // ── Dépit : 2 à 5 points de pouvoir sur le DERNIER coup joué ─────────────
    EFFECT_SPITE: { quoi: "depit", ppMin: 2, ppMax: 5, jets: 1 },
    // ── Bis : la cible rejoue son dernier coup, 3 à 6 tours ──────────────────
    //  ⚠️ LES COUPS QUI NE SE RÉPÈTENT PAS SONT NOMMÉS. Enfermer quelqu'un dans
    //     Métronome ou Gribouille ne veut rien dire : le ROM refuse, et il a
    //     raison — la mécanique de ces coups est de CHANGER à chaque emploi.
    EFFECT_ENCORE: {
      quoi: "bis", toursMin: 3, toursMax: 6, jets: 1,
      refuse: ["ENCORE", "MIMIC", "MIRROR_MOVE", "METRONOME", "SKETCH", "STRUGGLE", "TRANSFORM"],
    },
    // ── Voile Miroir : le double des dégâts SPÉCIAUX encaissés ce tour ───────
    //  ⚠️ AUCUN TIRAGE : elle se calcule sur des dégâts déjà rendus, exactement
    //     comme Riposte en 1996. Elle frappe en DERNIER (voir PRIORITES) —
    //     c'est ce qui la borne, et sans quoi elle serait le meilleur coup du
    //     jeu.
    EFFECT_MIRROR_COAT: { quoi: "voileMiroir", facteur: 2, jets: 0 },
    // ── Gribouille : le dernier coup de la cible, DÉFINITIVEMENT ─────────────
    //  ⚠️ AUCUN TIRAGE non plus, et c'est ce qui le distingue de Copie : Copie
    //     tire au sort et s'efface au repli, Gribouille prend le DERNIER coup
    //     joué et le garde pour toute la partie.
    EFFECT_SKETCH: {
      quoi: "gribouille", jets: 0,
      refuse: ["SKETCH", "STRUGGLE", "METRONOME", "MIMIC", "MIRROR_MOVE", "TRANSFORM"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  TROIS DE PLUS, ET CHACUN DIT SON COÛT  [19/08/2026, nuit]
    // ═══════════════════════════════════════════════════════════════════════
    // ── Vantardise : on rend l'autre furieux ET confus ───────────────────────
    //  🔑 LE MARCHÉ EST LE COUP ENTIER. Monter l'Attaque de l'adversaire de
    //     deux crans est un cadeau ; la confusion est le pari qu'il se frappera
    //     lui-même AVEC ce cadeau. Retirer l'une des deux moitiés donnerait
    //     soit un coup absurde, soit une Onde Folie de plus.
    //  ⚠️ UN TIRAGE : la durée de la confusion, celle du moteur. La montée de
    //     palier, elle, est certaine.
    EFFECT_SWAGGER: { quoi: "vantardise", crans: 2, jets: 1 },
    // ── Prescience : le coup tombe DEUX TOURS PLUS TARD ──────────────────────
    //  🔴 LES DÉGÂTS SE CALCULENT AU LANCER, PAS À L'ARRIVÉE — c'est le canon,
    //     et c'est aussi ce qui le rend jouable : on paie maintenant, sur les
    //     statistiques d'aujourd'hui, et le coup arrive quoi qu'il se passe
    //     entre-temps. Il traverse même un remplacement : le coup différé n'est
    //     pas sur la créature, il est sur le CAMP.
    //  ⚠️ SANS TYPE ET SANS CRITIQUE, tous deux au canon de 1999 : Prescience
    //     ne peut être ni super efficace ni sans effet. D'où UN seul tirage —
    //     l'aléa des dégâts — au lieu des deux d'un coup ordinaire.
    EFFECT_FUTURE_SIGHT: { quoi: "prescience", tours: 3, jets: 1 },
    // ── Blabla Dodo : jouer un de ses autres coups EN DORMANT ────────────────
    //  🔴 IL RETOURNE LE SOMMEIL. C'est le seul coup du jeu qui transforme un
    //     statut subi en tour joué, et c'est pour ça qu'il est la CT35.
    //  ⚠️ UN TIRAGE POUR LE CHOIX, plus ceux du coup tiré — comme Métronome, et
    //     pour la même raison : le coup joué est un vrai coup.
    //  ⚠️ ET LES COUPS À CHARGE SONT REFUSÉS. Un Lance-Soleil tiré en dormant
    //     poserait une charge que le dormeur ne pourrait jamais libérer : le
    //     ROM les écarte, et sans ça le coup rend son porteur inerte.
    EFFECT_SLEEP_TALK: {
      quoi: "blablaDodo", jets: 1,
      refuse: ["SLEEP_TALK", "BIDE", "MIRROR_MOVE", "METRONOME", "SKY_ATTACK",
               "SKULL_BASH", "SOLARBEAM", "RAZOR_WIND", "DIG", "FLY"],
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ORDRE DES TOURS DE 1999 — SIX EFFETS, PAS SIX ATTAQUES
  //
  //  🔴 IL FALLAIT LE PORTER POUR QUE TROIS DES SIX AIENT UN SENS. Protection
  //     et Ténacité doivent se poser AVANT le coup qu'elles encaissent ; Voile
  //     Miroir ne peut rendre que ce qu'elle a déjà reçu, donc elle frappe en
  //     dernier. Sans l'ordre, les trois sont des tours perdus.
  //  🔑 LE ROM CLASSE PAR EFFET, PAS PAR ATTAQUE (`MoveEffectPriorities`), et
  //     la priorité ordinaire y vaut 1 : on écrit donc l'ÉCART à cette
  //     ordinaire, ce que `joueurEnPremier` compare déjà.
  //  ⚠️ AUCUN TIRAGE AJOUTÉ : l'aléa d'égalité se consomme dans tous les cas,
  //     avant même la comparaison des priorités.
  var PRIORITES = {
    EFFECT_PROTECT: 2, EFFECT_ENDURE: 2,
    EFFECT_PRIORITY_HIT: 1,
    EFFECT_COUNTER: -1, EFFECT_MIRROR_COAT: -1, EFFECT_FORCE_SWITCH: -1,
  };

  W.POKE_GEN2_EFFETS_NEUFS_TABLE = {
    avecJet: AVEC_JET,
    priorites: PRIORITES,
    sansJet: SANS_JET,
    paliers: PALIERS,
    pieges: PIEGES,
    enDormant: EN_DORMANT,
    meteo: METEO,
    meteoDegats: METEO_DEGATS,
    meteoUsure: METEO_USURE,
    durees: DUREES,
    // Baton Pass : le remplaçant hérite des paliers. Pas une durée, une RÈGLE
    // de changement — le moteur la lit au moment du remplacement.
    batonPass: "EFFECT_BATON_PASS",
  };
})(typeof window !== "undefined" ? window : globalThis);
