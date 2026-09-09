(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS DE LA SECONDE GÉNÉRATION — LA TABLE DE CORRESPONDANCE
  //
  //  🔴 LES DEUX GÉNÉRATIONS N'ONT PAS UN SEUL NOM D'EFFET EN COMMUN. Mesuré :
  //     68 effets en 1996, 135 en 1999, intersection VIDE. Cristal a tout
  //     renommé (`ATTACK_DOWN1_EFFECT` est devenu `EFFECT_ATTACK_DOWN`), et il
  //     en a ajouté soixante-sept.
  //     Sans cette table, Johto se jouait sans AUCUN effet d'attaque : 2 781
  //     emplois sur 200 combats où seul le dégât brut passait. Une attaque
  //     dont l'effet ne fait rien MENT au joueur — c'est la classe de défaut
  //     n°1 du dossier.
  //
  //  🔑 CE FICHIER NE CONTIENT AUCUNE MÉCANIQUE, seulement des NOMS. Le moteur
  //     de combat sait déjà endormir, brûler, baisser une Défense ; ce qu'il ne
  //     sait pas, c'est que Cristal appelle ça autrement. Traduire est donc du
  //     travail de DONNÉE — le mettre dans `combat.js` y aurait planté une
  //     connaissance de la gen 2, qui n'a rien à y faire.
  //
  //  ⚠️ ON NE TRADUIT QUE CE QUI EST LE MÊME EFFET. Là où la gen 2 a changé la
  //     mécanique (Morsure apeure au lieu de baisser la Défense) ou inventé
  //     autre chose (météo, Baton Pass, Encore, Protection…), la case reste
  //     VIDE et l'attaque ne fait que ses dégâts. Traduire approximativement
  //     donnerait un effet FAUX, ce qui est pire qu'un effet absent : le
  //     premier ment sans se voir, le second se mesure.
  //     `W.POKE_GEN2_EFFETS_NEUFS` porte la liste de ce qui reste à écrire, et
  //     `tools/poke-sim-gen2.mjs` en compte les emplois à chaque mesure.
  //
  //  🔴 RIEN NE CHARGE CE FICHIER. Comme le reste de `js/poke/gen2/` — voir
  //     `tools/poke-gen2-close.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  //  gen 2  →  gen 1, quand c'est le MÊME effet.
  W.POKE_GEN2_EFFETS = {
    // ── Rien de plus que les dégâts ──────────────────────────────────────────
    EFFECT_NORMAL_HIT: "NO_ADDITIONAL_EFFECT",
    EFFECT_ALWAYS_HIT: "SWIFT_EFFECT",
    EFFECT_PRIORITY_HIT: "NO_ADDITIONAL_EFFECT",   // la priorité se joue ailleurs
    EFFECT_FALSE_SWIPE: "NO_ADDITIONAL_EFFECT",    // laisse à 1 PV : non modélisé, dégâts justes
    EFFECT_LEVEL_DAMAGE: "SPECIAL_DAMAGE_EFFECT",
    EFFECT_PSYWAVE: "SPECIAL_DAMAGE_EFFECT",
    EFFECT_SUPER_FANG: "SUPER_FANG_EFFECT",
    EFFECT_OHKO: "OHKO_EFFECT",
    EFFECT_PAY_DAY: "PAY_DAY_EFFECT",
    EFFECT_STATIC_DAMAGE: "SPECIAL_DAMAGE_EFFECT",

    // ── Statuts ──────────────────────────────────────────────────────────────
    EFFECT_SLEEP: "SLEEP_EFFECT",
    EFFECT_POISON: "POISON_EFFECT",
    EFFECT_TOXIC: "POISON_EFFECT",                 // le poison grave se pose de même
    EFFECT_PARALYZE: "PARALYZE_EFFECT",
    EFFECT_CONFUSE: "CONFUSION_EFFECT",
    EFFECT_POISON_HIT: "POISON_SIDE_EFFECT1",
    EFFECT_BURN_HIT: "BURN_SIDE_EFFECT1",
    EFFECT_FREEZE_HIT: "FREEZE_SIDE_EFFECT1",
    EFFECT_PARALYZE_HIT: "PARALYZE_SIDE_EFFECT1",
    EFFECT_CONFUSE_HIT: "CONFUSION_SIDE_EFFECT",
    EFFECT_FLINCH_HIT: "FLINCH_SIDE_EFFECT1",
    EFFECT_SACRED_FIRE: "BURN_SIDE_EFFECT1",
    EFFECT_FLAME_WHEEL: "BURN_SIDE_EFFECT1",
    EFFECT_TRI_ATTACK: "NO_ADDITIONAL_EFFECT",     // gén. 2 : brûlure/gel/para au hasard — non modélisé
    EFFECT_THUNDER: "PARALYZE_SIDE_EFFECT1",
    EFFECT_POISON_MULTI_HIT: "TWINEEDLE_EFFECT",

    // ── Paliers, sur soi ─────────────────────────────────────────────────────
    EFFECT_ATTACK_UP: "ATTACK_UP1_EFFECT",
    EFFECT_DEFENSE_UP: "DEFENSE_UP1_EFFECT",
    EFFECT_SP_ATK_UP: "SPECIAL_UP1_EFFECT",
    EFFECT_EVASION_UP: "EVASION_UP1_EFFECT",
    EFFECT_ATTACK_UP_2: "ATTACK_UP2_EFFECT",
    EFFECT_DEFENSE_UP_2: "DEFENSE_UP2_EFFECT",
    EFFECT_SPEED_UP_2: "SPEED_UP2_EFFECT",
    EFFECT_SP_DEF_UP_2: "SPECIAL_UP2_EFFECT",
    EFFECT_DEFENSE_CURL: "DEFENSE_UP1_EFFECT",
    EFFECT_FOCUS_ENERGY: "FOCUS_ENERGY_EFFECT",

    // ── Paliers, sur l'autre ─────────────────────────────────────────────────
    EFFECT_ATTACK_DOWN: "ATTACK_DOWN1_EFFECT",
    EFFECT_DEFENSE_DOWN: "DEFENSE_DOWN1_EFFECT",
    EFFECT_SPEED_DOWN: "SPEED_DOWN1_EFFECT",
    EFFECT_ACCURACY_DOWN: "ACCURACY_DOWN1_EFFECT",
    EFFECT_DEFENSE_DOWN_2: "DEFENSE_DOWN2_EFFECT",
    EFFECT_ATTACK_DOWN_HIT: "ATTACK_DOWN_SIDE_EFFECT",
    EFFECT_DEFENSE_DOWN_HIT: "DEFENSE_DOWN_SIDE_EFFECT",
    EFFECT_SPEED_DOWN_HIT: "SPEED_DOWN_SIDE_EFFECT",
    EFFECT_SP_DEF_DOWN_HIT: "SPECIAL_DOWN_SIDE_EFFECT",
    EFFECT_ACCURACY_DOWN_HIT: "ACCURACY_DOWN1_EFFECT",

    // ── Coups répétés, recul, charge ─────────────────────────────────────────
    EFFECT_MULTI_HIT: "TWO_TO_FIVE_ATTACKS_EFFECT",
    EFFECT_DOUBLE_HIT: "ATTACK_TWICE_EFFECT",
    EFFECT_RECOIL_HIT: "RECOIL_EFFECT",
    EFFECT_JUMP_KICK: "JUMP_KICK_EFFECT",
    EFFECT_SELFDESTRUCT: "EXPLODE_EFFECT",
    EFFECT_HYPER_BEAM: "HYPER_BEAM_EFFECT",
    EFFECT_RAZOR_WIND: "CHARGE_EFFECT",
    EFFECT_SKULL_BASH: "CHARGE_EFFECT",
    EFFECT_SKY_ATTACK: "CHARGE_EFFECT",
    EFFECT_SOLARBEAM: "CHARGE_EFFECT",
    EFFECT_FLY: "FLY_EFFECT",
    EFFECT_RAMPAGE: "THRASH_PETAL_DANCE_EFFECT",
    EFFECT_TRAP_TARGET: "TRAPPING_EFFECT",
    EFFECT_RAGE: "RAGE_EFFECT",
    EFFECT_BIDE: "BIDE_EFFECT",
    EFFECT_COUNTER: "NO_ADDITIONAL_EFFECT",        // la riposte se joue ailleurs

    // ── Soin, drain, divers ──────────────────────────────────────────────────
    EFFECT_HEAL: "HEAL_EFFECT",
    EFFECT_MORNING_SUN: "HEAL_EFFECT",
    EFFECT_SYNTHESIS: "HEAL_EFFECT",
    EFFECT_MOONLIGHT: "HEAL_EFFECT",
    EFFECT_LEECH_HIT: "DRAIN_HP_EFFECT",
    EFFECT_DREAM_EATER: "DREAM_EATER_EFFECT",
    EFFECT_LEECH_SEED: "LEECH_SEED_EFFECT",
    EFFECT_REFLECT: "REFLECT_EFFECT",
    EFFECT_LIGHT_SCREEN: "LIGHT_SCREEN_EFFECT",
    EFFECT_MIST: "MIST_EFFECT",
    EFFECT_RESET_STATS: "HAZE_EFFECT",
    EFFECT_SUBSTITUTE: "SUBSTITUTE_EFFECT",
    EFFECT_TRANSFORM: "TRANSFORM_EFFECT",
    EFFECT_CONVERSION: "CONVERSION_EFFECT",
    EFFECT_DISABLE: "DISABLE_EFFECT",
    EFFECT_MIMIC: "MIMIC_EFFECT",
    EFFECT_MIRROR_MOVE: "MIRROR_MOVE_EFFECT",
    EFFECT_METRONOME: "METRONOME_EFFECT",
    EFFECT_SPLASH: "SPLASH_EFFECT",
    EFFECT_TELEPORT: "SWITCH_AND_TELEPORT_EFFECT",
    EFFECT_FORCE_SWITCH: "SWITCH_AND_TELEPORT_EFFECT",
    EFFECT_STOMP: "FLINCH_SIDE_EFFECT1",
    EFFECT_GUST: "NO_ADDITIONAL_EFFECT",
    EFFECT_EARTHQUAKE: "NO_ADDITIONAL_EFFECT",
    EFFECT_TWISTER: "FLINCH_SIDE_EFFECT1",
    EFFECT_SNORE: "FLINCH_SIDE_EFFECT1",
    EFFECT_RETURN: "NO_ADDITIONAL_EFFECT",
    EFFECT_FRUSTRATION: "NO_ADDITIONAL_EFFECT",
    EFFECT_HIDDEN_POWER: "NO_ADDITIONAL_EFFECT",
    EFFECT_REVERSAL: "NO_ADDITIONAL_EFFECT",
    EFFECT_MAGNITUDE: "NO_ADDITIONAL_EFFECT",
    EFFECT_PRESENT: "NO_ADDITIONAL_EFFECT",
    EFFECT_TRIPLE_KICK: "ATTACK_TWICE_EFFECT",
    EFFECT_FURY_CUTTER: "NO_ADDITIONAL_EFFECT",
    EFFECT_ROLLOUT: "NO_ADDITIONAL_EFFECT",
    EFFECT_PURSUIT: "NO_ADDITIONAL_EFFECT",
    EFFECT_RAPID_SPIN: "NO_ADDITIONAL_EFFECT",
    EFFECT_THIEF: "NO_ADDITIONAL_EFFECT",
    EFFECT_BEAT_UP: "NO_ADDITIONAL_EFFECT",
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TOUT CE QUE 1999 AJOUTE ET QUE 1996 N'A PAS
  //
  //  🔴 CES EFFETS N'EXISTENT PAS EN 1996 : il n'y a rien à quoi les renvoyer.
  //     Les livrer traduits « au plus proche » donnerait un effet FAUX. On les
  //     nomme ici, le simulateur en compte les emplois, et la décision de les
  //     écrire se prend sur un chiffre.
  //
  //  🔴 CE N'EST PLUS « CE QUI RESTE À ÉCRIRE », ET C'EST UNE CORRECTION.
  //     La liste était tenue À LA MAIN et retirée à la main : le 19/08 au soir,
  //     elle nommait encore comme manquants la météo, le Relais, le Requiem, le
  //     Regard Noir, le Verrouillage, la Rune Protect et six autres qui étaient
  //     ÉCRITS depuis des heures. *Un inventaire de manques qui compte des
  //     manques comblés apprend à être lu de travers*, et c'est la note que
  //     `poke-gen2-close.mjs` porte lui-même dans son en-tête.
  //  ✅ ELLE DÉCLARE DONC L'ENSEMBLE, et le RESTE se CALCULE : ce qui n'est ni
  //     dans `sansJet`, ni dans `avecJet`, ni dans les durées, la météo ou les
  //     paliers de `effets-neufs.js`. Une clé écrite disparaît du compte toute
  //     seule, le jour même. C'est la loi du dossier : comparer les clés
  //     DÉFINIES aux clés LUES, jamais tenir deux listes.
  // ═══════════════════════════════════════════════════════════════════════════
  W.POKE_GEN2_EFFETS_NEUFS = {
    EFFECT_RAIN_DANCE: "météo — le mode n'a pas de météo",
    EFFECT_SUNNY_DAY: "météo — le mode n'a pas de météo",
    EFFECT_SANDSTORM: "météo — le mode n'a pas de météo",
    EFFECT_PROTECT: "annule le coup du tour",
    EFFECT_ENDURE: "survit à 1 PV",
    EFFECT_ENCORE: "force la répétition d'une attaque",
    EFFECT_BATON_PASS: "transmet les paliers au remplaçant",
    EFFECT_PERISH_SONG: "compte à rebours sur les deux camps",
    EFFECT_SPIKES: "pièges à l'entrée",
    EFFECT_ATTRACT: "immobilise selon le sexe — le mode n'a pas de sexe",
    EFFECT_DESTINY_BOND: "emporte l'adversaire dans sa chute",
    EFFECT_MEAN_LOOK: "interdit la fuite et le changement",
    EFFECT_NIGHTMARE: "dégâts pendant le sommeil",
    EFFECT_FORESIGHT: "annule les immunités",
    EFFECT_LOCK_ON: "garantit le coup suivant",
    EFFECT_SPITE: "retire des PP",
    EFFECT_SAFEGUARD: "protège des statuts",
    EFFECT_PSYCH_UP: "copie les paliers de l'autre",
    EFFECT_MIRROR_COAT: "riposte spéciale",
    EFFECT_FUTURE_SIGHT: "frappe deux tours plus tard",
    EFFECT_SLEEP_TALK: "agit en dormant",
    EFFECT_SKETCH: "copie une attaque définitivement",
    EFFECT_CONVERSION2: "change de type selon le dernier coup reçu",
    EFFECT_ALL_UP_HIT: "monte toutes les statistiques",
    EFFECT_ATTACK_UP_HIT: "monte l'Attaque en frappant",
    EFFECT_DEFENSE_UP_HIT: "monte la Défense en frappant",
    EFFECT_SWAGGER: "confusion contre Attaque doublée",
    EFFECT_ATTACK_DOWN_2: "baisse l'Attaque de deux crans",
    EFFECT_SPEED_DOWN_2: "baisse la Vitesse de deux crans",
    EFFECT_EVASION_DOWN: "baisse l'esquive",
  };
})(typeof window !== "undefined" ? window : globalThis);
