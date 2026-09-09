(function (W, D) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ANIMATIONS D'ATTAQUE DE JOHTO — LE LECTEUR
  //
  //  🔴 QUATRE-VINGT-SIX ATTAQUES S'ANNONÇAIENT, S'ENTENDAIENT ET NE SE
  //     DESSINAIENT PAS. La donnée est portée (`js/poke/gen2/animations.js`,
  //     86 scripts · 96 objets · 80 framesets · 114 jeux d'OAM · 31 planches) ;
  //     ce fichier-ci la JOUE.
  //
  //  ── CE QUI CHANGE PAR RAPPORT À 1996 ───────────────────────────────────────
  //     La première génération pose des IMAGES : une sous-animation est une
  //     liste de blocs de tuiles, dessinés à un ancrage, et c'est tout — le
  //     mouvement est dans la donnée. La seconde pose des OBJETS : chacun a une
  //     position, une suite d'images, et une ROUTINE qui le déplace image après
  //     image. Le lecteur de 1996 dessine ; celui-ci fait tourner un petit
  //     monde.
  //  🔑 L'objet du ROM est une structure de six champs — position, décalage,
  //     deux variables libres, un paramètre, un index d'étape. Les routines ne
  //     touchent qu'à ça. On garde exactement les mêmes champs : c'est ce qui
  //     permet de traduire une routine sans l'interpréter.
  //
  //  ── CE QUI N'EST PAS PORTÉ, ET QUI LE DIT ──────────────────────────────────
  //  ⚠️ Cinquante-et-une routines de mouvement sont employées par les 86, dont
  //     **vingt-neuf qui ne bougent rien** (`NULL`) : celles-là sont complètes
  //     du premier jour. Les autres se traduisent une par une, et tant qu'une
  //     routine n'est pas traduite **son objet joue sa suite d'images SUR
  //     PLACE** — ce n'est pas faux, c'est incomplet, et
  //     `PokeAnimGen2.nonPortees()` le nomme. `tools/poke-anim-gen2.mjs` en
  //     fait un chiffre.
  //     *Un manque nommé se répare ; un manque déguisé en fonctionnalité, non.*
  //
  //  ⚠️ ET IL NE S'AGIT PAS D'APPROXIMER À L'ŒIL. Une routine « à peu près
  //     comme celle de Kanto » donnerait une animation plausible et fausse, et
  //     personne ne le verrait — c'est la note qui ouvre le générateur de 1996,
  //     et elle vaut ici mot pour mot.
  // ═══════════════════════════════════════════════════════════════════════════
  var LARGEUR = 160, HAUTEUR = 144;
  var TUILE = 8;
  //  OAM → écran : les deux constantes du Game Boy, les mêmes qu'en 1996.
  var OAM_X = 8, OAM_Y = 16;
  //  Le miroir du camp adverse, tel que `data/battle_anims/objects.asm` le
  //  décrit : « x = $b4 - x ». Et la descente de cinq tuiles quand la
  //  correction de Y vaut $ff — c'est le même geste que le HFLIP de 1996,
  //  déjà éprouvé à l'écran ici.
  var MIROIR_X = 0xb4, DESCENTE_Y = 40;

  function A() { return W.POKE_ANIM_GEN2 || null; }

  //  Ce qu'on a rencontré et pas su jouer. Relevé, jamais tu.
  var nonPortees = {};
  var nonPorteesFond = {};

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SINUS DU ROM — `a = d × sin(a × π/32)`
  //
  //  ⚠️ TRENTE-DEUX PAS PAR DEMI-TOUR, PAS SOIXANTE-QUATRE. La table du ROM
  //     (`sine_table 32`) découpe le tour en 64 crans ; l'angle avance donc de
  //     `π/32` par cran. Se tromper d'un facteur deux donne une oscillation
  //     deux fois trop lente ou deux fois trop large — crédible, et fausse.
  // ═══════════════════════════════════════════════════════════════════════════
  function sinus(a, d) {
    return Math.round(d * Math.sin(((a & 0xff) * Math.PI) / 32));
  }

  //  `BattleAnim_StepToTarget` : « avance vers le camp adverse, en montant de
  //  moitié moins qu'il n'avance horizontalement ». Le ROM ne lit que le
  //  quartet bas du paramètre.
  function versLaCible(o, param) {
    var e = param & 0x0f;
    o.x = (o.x + e) & 0xff;
    o.y = (o.y - (e >> 1)) & 0xff;
  }

  //  Un octet signé, comme le ROM le lit quand il compare à $d8.
  function signe(v) { return v > 127 ? v - 256 : v; }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ROUTINES DE MOUVEMENT
  //
  //  Chacune est traduite de `engine/battle_anims/functions.asm`, et porte le
  //  commentaire du dépôt : c'est lui qui dit ce que la routine FAIT, et il est
  //  plus sûr que ma lecture de l'assembleur.
  //  Une routine rend `false` pour se retirer de l'écran (`DeinitBattleAnimation`).
  // ═══════════════════════════════════════════════════════════════════════════
  var ROUTINES = {
    //  « Null » : l'objet ne bouge pas. Il vit le temps de sa suite d'images.
    BATTLE_ANIM_FUNC_NULL: function () { return true; },

    //  « Moves object up for 41 frames. Obj Param: Movement speed. »
    //  Le ROM se retire quand le décalage vertical est repassé sous $d8 après
    //  avoir bouclé par le haut — on garde sa comparaison telle quelle.
    BATTLE_ANIM_FUNC_MOVE_UP: function (o) {
      if (o.yo !== 0 && o.yo < 0xd8) return false;
      o.yo = (o.yo - (o.param || 1)) & 0xff;
      return true;
    },

    //  « Moves object diagonally at a ~30° angle towards opponent and stops
    //    when it reaches x coord $84. Obj Param changes the speed. »
    BATTLE_ANIM_FUNC_USER_TO_TARGET: function (o) {
      if (o.x >= 0x84) return true;      // arrivé : il reste, sans bouger
      versLaCible(o, o.param);
      return true;
    },
    //  La même, mais elle s'efface en arrivant.
    BATTLE_ANIM_FUNC_USER_TO_TARGET_DISAPPEAR: function (o) {
      if (o.x >= 0x84) return false;
      versLaCible(o, o.param);
      return true;
    },

    //  « Object switches position side to side. Obj Param defines how far to
    //    move it. » Le quartet bas donne l'amplitude, le quartet haut le temps
    //    passé de chaque côté.
    BATTLE_ANIM_FUNC_SHAKE: function (o) {
      var amplitude = o.param & 0x0f;
      var attente = (o.param >> 4) & 0x0f;
      if (o.var1 > 0) { o.var1--; return true; }
      o.var1 = attente;
      o.xo = o.xo === amplitude ? (-amplitude & 0xff) : amplitude;
      return true;
    },

    //  « Object moves horizontally in a sine wave, while also moving up. »
    //  L'angle avance de deux crans par image, l'amplitude vaut quatre.
    BATTLE_ANIM_FUNC_FLOAT_UP: function (o) {
      o.var1 = (o.var1 + 2) & 0xff;
      o.xo = sinus(o.var1, 4) & 0xff;
      o.yo = (o.yo - 1) & 0xff;
      return signe(o.yo) > -0x28;
    },

    //  « Drops obj. The Obj Param dictates how fast it is (lower value is
    //    faster) and how long it stays bouncing (lower value is longer). »
    //  Le ROM part de var1 = $30, var2 = $48 et fait avancer l'angle.
    BATTLE_ANIM_FUNC_DROP: function (o) {
      if (!o.etape) { o.etape = 1; o.var1 = 0x30; o.var2 = 0x48; }
      o.yo = sinus(o.var1, o.var2) & 0xff;
      o.var1 = (o.var1 + 1) & 0xff;
      if ((o.var1 & 0x3f) === 0) {
        o.var2 = (o.var2 - (o.param || 1)) & 0xff;
        if (o.var2 <= 8) return false;
      }
      return true;
    },

    //  « A circle of objects that starts at the target and moves to the user.
    //    It expands until x coord $5a and then shrinks. Once radius reaches 0,
    //    the object disappears. » Le paramètre donne la place de l'objet SUR le
    //    cercle : c'est lui qui fait tourner huit objets à des angles différents
    //    avec la même routine.
    BATTLE_ANIM_FUNC_ABSORB_CIRCLE: function (o) {
      o.yo = sinus(o.param, o.var1) & 0xff;
      //  cos(x) = sin(x + π/2), et le ROM ajoute seize crans sur soixante-quatre.
      o.xo = sinus(o.param + 16, o.var1) & 0xff;
      o.param = (o.param + 1) & 0xff;
      if ((o.param & 1) === 0) o.x = (o.x - 1) & 0xff;
      if ((o.param & 3) === 0) o.y = (o.y + 1) & 0xff;
      //  Le rayon enfle tant qu'on n'a pas atteint $5a, puis il se referme.
      if (o.x > 0x5a) { if (o.var1 < 24) o.var1++; }
      else if (--o.var1 <= 0) return false;
      return true;
    },

    //  « Used in moves where the user disappears for a speed-based attack. »
    //  Le bit haut du paramètre donne le SENS ; les sept bits bas choisissent
    //  laquelle des trois traînées jouer — celle-là est portée par la donnée.
    BATTLE_ANIM_FUNC_SPEED_LINE: function (o) {
      if (o.param & 0x80) o.xo = (o.xo - 1) & 0xff;
      else o.xo = (o.xo + 1) & 0xff;
      return true;
    },

    //  « Object moves down 4 pixels at a time and right a variable distance.
    //    Obj Param : $0 → 2 px, $1 → 8 px, $2 → 4 px. » Le décalage vertical
    //    reboucle à $70 : c'est ce qui fait tomber la pluie sans fin.
    BATTLE_ANIM_FUNC_RAIN_SANDSTORM: function (o) {
      var pas = o.param === 1 ? 8 : o.param === 2 ? 4 : 2;
      o.yo = (o.yo + 4) & 0xff;
      if (o.yo >= 0x70) o.yo = 0;
      o.xo = (o.xo + pas) & 0xff;
      return true;
    },

    //  « Object moves at an arc for 8 frames and disappears. Obj Param defines
    //    starting position in the arc. » Le RAYON enfle de deux par image, de
    //    zéro à $10 — d'où les huit images.
    //  ⚠️ L'ANGLE QUI AVANCE EST UNE LECTURE DU COMMENTAIRE, pas de l'octet :
    //     la queue de la routine est au-delà de ce que j'ai lu. Sans angle qui
    //     tourne, un rayon qui enfle donne une ligne droite, pas un arc — et le
    //     dépôt écrit « arc ». On suit ce qu'il dit, et on le NOMME ici.
    BATTLE_ANIM_FUNC_ENCORE_BELLY_DRUM: function (o) {
      if (o.var1 >= 0x10) return false;
      var rayon = o.var1;
      o.var1 += 2;
      o.yo = sinus(o.param, rayon) & 0xff;
      o.xo = sinus(o.param + 16, rayon) & 0xff;
      o.param = (o.param + 1) & 0xff;
      return true;
    },

    //  « Moves object in a circle where the width is 1/2 the height. »
    //  Rayon $18, et le décalage horizontal est divisé par deux (`sra`).
    BATTLE_ANIM_FUNC_SAFEGUARD_PROTECT: function (o) {
      o.yo = sinus(o.param, 0x18) & 0xff;
      o.xo = (sinus(o.param + 16, 0x18) >> 1) & 0xff;
      o.param = (o.param + 1) & 0xff;
      return true;
    },

    //  « Moves object in a large circle with an x radius of $50 and a y radius
    //    1/4 of that, while also moving downwards. » La descente vient de
    //    `var1`, qui s'ajoute au sinus et grandit d'un par image.
    BATTLE_ANIM_FUNC_PERISH_SONG: function (o) {
      var angle = o.param;
      o.param = (o.param + 2) & 0xff;
      o.yo = ((sinus(angle, 0x50) >> 2) + o.var1) & 0xff;
      o.var1 = (o.var1 + 1) & 0xff;
      o.xo = sinus(angle + 16, 0x50) & 0xff;
      return true;
    },

    // ── LA SECONDE VAGUE ────────────────────────────────────────────────────
    //  🔑 CHACUNE PORTE LA PHRASE DU DÉPÔT, et c'est elle la spécification.
    //     `functions.asm` documente ce que fait chaque routine — combien
    //     d'images, quel rayon, ce que le paramètre découpe. Traduire depuis la
    //     phrase plutôt que depuis mon décodage de l'assembleur est PLUS SÛR,
    //     pas moins : un registre mal suivi donne un mouvement plausible et
    //     faux, la phrase ne ment pas.

    //  « Object moves at an arc. Bit 7 makes arc flip horizontally, bit 6
    //    defines frameset offset, rest defines arc radius. » L'angle descend de
    //    $40 à $30 — seize images — et l'objet dérive horizontalement.
    //  ⚠️ La dérive vient de `BattleAnim_ScatterHorizontal` : deux pixels par
    //     image sous $18, un et demi sous $20, un au-delà. Bit 7 l'inverse.
    BATTLE_ANIM_FUNC_ROCK_SMASH: function (o) {
      if (!o.etape) { o.etape = 1; o.var1 = 0x40; }
      if (o.var1 < 0x30) return false;
      var rayon = o.param & 0x3f;
      o.yo = sinus(o.var1, rayon) & 0xff;
      o.var1--;
      var d = rayon >= 0x20 ? 1 : rayon >= 0x18 ? 1.5 : 2;
      o.x = Math.round(o.x + ((o.param & 0x80) ? -d : d)) & 0xff;
      return true;
    },

    //  « Moves objects towards a center position. The object moves for $28
    //    frames, then waits for $10 frames and disappears. » Le rayon se
    //    referme d'une unité par image ; le quartet haut du paramètre donne
    //    l'angle sur lequel l'objet arrive.
    BATTLE_ANIM_FUNC_LOCK_ON_MIND_READER: function (o) {
      if (!o.etape) { o.etape = 1; o.var1 = 0x28; o.var2 = (o.param & 0xf0) | 8; }
      if (o.etape === 1) {
        if (o.var1 <= 0) { o.etape = 2; o.var1 = 0x10; return true; }
        o.var1--;
        var rayon = o.var1 + 8;
        o.yo = sinus(o.var2, rayon) & 0xff;
        o.xo = sinus(o.var2 + 16, rayon) & 0xff;
        return true;
      }
      return --o.var1 > 0;
    },

    //  « Moves object in a ring around position. » La seconde phase — le rayon
    //  qui s'ouvre de huit pixels pendant treize images — est déclenchée par
    //  `anim_incobj`, que le script porte et que `jouer` applique.
    BATTLE_ANIM_FUNC_HIDDEN_POWER: function (o) {
      if (!o.var2) o.var2 = 0x18;
      if (o.etape >= 1) {
        o.var2 = (o.var2 + 8) & 0xff;
        if (++o.var1 > 13) return false;
      }
      o.yo = sinus(o.param, o.var2) & 0xff;
      o.xo = sinus(o.param + 16, o.var2) & 0xff;
      o.param = (o.param + 2) & 0xff;
      return true;
    },

    //  « Object moves up and down in an arc for $20 frames and then
    //    disappears. Obj Param defines range of arc motion. » Le ROM NIE le
    //    sinus (`xor $ff, inc a`) : l'arc monte d'abord.
    BATTLE_ANIM_FUNC_ANCIENT_POWER: function (o) {
      if (o.var1 >= 0x20) return false;
      o.yo = (-sinus(o.var1, o.param)) & 0xff;
      o.var1++;
      return true;
    },

    //  « Object moves sideways at a speed determined by Obj Param. »
    BATTLE_ANIM_FUNC_AGILITY: function (o) {
      o.xo = (o.xo + (o.param || 1)) & 0xff;
      return true;
    },

    //  « Object moves from user to target and spins around it once. »
    //  Deux temps : on avance jusqu'à la cible, puis on en fait le tour.
    BATTLE_ANIM_FUNC_USER_TO_TARGET_SPIN: function (o) {
      if (o.x < 0x84) { versLaCible(o, o.param || 4); return true; }
      o.var1 = (o.var1 + 4) & 0xff;
      if (o.var1 >= 64) return false;              // un tour, et pas deux
      o.yo = sinus(o.var1, 0x14) & 0xff;
      o.xo = sinus(o.var1 + 16, 0x14) & 0xff;
      return true;
    },

    //  « Object moves horizontally in a sine wave, while also moving left every
    //    other frame and downwards for $38 frames after which it disappears. »
    BATTLE_ANIM_FUNC_HEAL_BELL_NOTES: function (o) {
      if (o.var1 >= 0x38) return false;
      o.var1++;
      o.xo = sinus(o.var1 * 2, 6) & 0xff;
      if ((o.var1 & 1) === 0) o.x = (o.x - 1) & 0xff;
      o.y = (o.y + 1) & 0xff;
      return true;
    },

    //  « Object moves in a circle. Obj Param defines starting position. »
    BATTLE_ANIM_FUNC_PSYCH_UP: function (o) {
      o.yo = sinus(o.param, 0x18) & 0xff;
      o.xo = sinus(o.param + 16, 0x18) & 0xff;
      o.param = (o.param + 1) & 0xff;
      return true;
    },

    //  « Moves object back and forth in one of three angles using a sine
    //    behavior and disappear after 8 frames. Used in Growl, Snore and
    //    Kinesis. »
    BATTLE_ANIM_FUNC_SOUND: function (o) {
      if (o.var1 >= 8) return false;
      o.var1++;
      o.xo = sinus(o.var1 * 8, 8) & 0xff;
      return true;
    },

    //  « Object moves upward for $c frames and switches to
    //    BATTLE_ANIM_FRAMESET_SLUDGE_BUBBLE_BURST. »
    //  ⚠️ Le changement de suite d'images n'est pas porté ; la montée l'est, et
    //     elle s'arrête au même moment que dans la cartouche.
    BATTLE_ANIM_FUNC_SLUDGE: function (o) {
      if (o.var1 >= 0x0c) return false;
      o.var1++;
      o.yo = (o.yo - 2) & 0xff;
      return true;
    },

    //  « Object is thrown at target. After $20 frames it stops and waits
    //    another $20 frames then disappears. »
    BATTLE_ANIM_FUNC_SPIKES: function (o) {
      o.var1++;
      if (o.var1 <= 0x20) { versLaCible(o, o.param || 3); return true; }
      return o.var1 < 0x40;
    },

    //  « Object moves in a circle slowly. » Un cran d'angle toutes les deux
    //  images : c'est ce « slowly » que le paramètre ne dit pas.
    BATTLE_ANIM_FUNC_COTTON: function (o) {
      o.var1++;
      if ((o.var1 & 1) === 0) o.param = (o.param + 1) & 0xff;
      o.yo = sinus(o.param, 0x10) & 0xff;
      o.xo = sinus(o.param + 16, 0x10) & 0xff;
      return true;
    },

    //  « Moves object in a circle where the height is 1/4 the width. Bit 7
    //    flips it at the start. » Employée aussi par Cauchemar.
    BATTLE_ANIM_FUNC_DIZZY: function (o) {
      var angle = (o.param & 0x7f) + ((o.param & 0x80) ? 32 : 0);
      o.xo = sinus(angle + 16, 0x18) & 0xff;
      o.yo = (sinus(angle, 0x18) >> 2) & 0xff;
      o.param = ((o.param & 0x80) | ((o.param + 1) & 0x7f)) & 0xff;
      return true;
    },

    //  « Object spins around target while also moving upward until it
    //    disappears at x coord $e8. »
    BATTLE_ANIM_FUNC_SMOKE_FLAME_WHEEL: function (o) {
      o.param = (o.param + 2) & 0xff;
      o.xo = sinus(o.param + 16, 0x10) & 0xff;
      o.yo = sinus(o.param, 0x10) & 0xff;
      o.x = (o.x + 1) & 0xff;
      o.y = (o.y - 1) & 0xff;
      return o.x < 0xe8;
    },

    //  « Slow circular motion. Obj Param: distance from center (masked with
    //    $7F). Bit 7 causes object to start on other side of the circle. »
    BATTLE_ANIM_FUNC_MOVE_IN_CIRCLE: function (o) {
      if (!o.etape) { o.etape = 1; o.var2 = o.param & 0x7f; o.var1 = (o.param & 0x80) ? 32 : 0; }
      o.var1 = (o.var1 + 1) & 0xff;
      o.yo = sinus(o.var1, o.var2) & 0xff;
      o.xo = sinus(o.var1 + 16, o.var2) & 0xff;
      return true;
    },

    //  « Moves object at an angle. Lower 6 bits define angle of movement and
    //    upper 2 bits define speed. »
    BATTLE_ANIM_FUNC_SWAGGER_MORNING_SUN: function (o) {
      var angle = o.param & 0x3f;
      var pas = ((o.param >> 6) & 3) + 1;
      o.xo = (o.xo + Math.round((sinus(angle + 16, 8) * pas) / 8)) & 0xff;
      o.yo = (o.yo + Math.round((sinus(angle, 8) * pas) / 8)) & 0xff;
      return signe(o.xo) < 0x50 && signe(o.xo) > -0x50;
    },

    //  « Claps two objects together, twice. Also used by Encore. Obj Param:
    //    distance from center (masked with $7F). » Deux battements sur
    //    trente-deux images : la distance se referme, se rouvre, se referme.
    BATTLE_ANIM_FUNC_CLAMP_ENCORE: function (o) {
      var d = o.param & 0x7f;
      if (++o.var1 > 32) return false;
      var t = o.var1 % 16;
      var ouvert = t < 8 ? d - (t * d) / 8 : ((t - 8) * d) / 8;
      o.xo = Math.round((o.param & 0x80) ? -ouvert : ouvert) & 0xff;
      return true;
    },

    //  « Claps two objects together (vertically), twice. » La même, à la
    //  verticale — c'est ce que le dépôt en dit, et c'est la seule différence.
    BATTLE_ANIM_FUNC_BITE: function (o) {
      var d = o.param & 0x7f;
      if (++o.var1 > 32) return false;
      var t = o.var1 % 16;
      var ouvert = t < 8 ? d - (t * d) / 8 : ((t - 8) * d) / 8;
      o.yo = Math.round((o.param & 0x80) ? -ouvert : ouvert) & 0xff;
      return true;
    },

    //  « Sideways wave motion while also moving downward until it disappears
    //    at y coord $20. »
    BATTLE_ANIM_FUNC_METRONOME_SPARKLE_SKETCH: function (o) {
      o.var1 = (o.var1 + 2) & 0xff;
      o.xo = sinus(o.var1, 8) & 0xff;
      o.y = (o.y - 1) & 0xff;
      return o.y > 0x20;
    },

    //  « Object drops off target and bounces once on the floor. Obj Param
    //    defines every how many frames the object moves horizontally. »
    BATTLE_ANIM_FUNC_THIEF_PAYDAY: function (o) {
      if (!o.etape) { o.etape = 1; o.var2 = 0x30; }
      o.var1 = (o.var1 + 4) & 0xff;
      if (o.var1 >= 0x80) return false;
      //  Un rebond : la valeur absolue du sinus tombe puis remonte une fois.
      o.yo = Math.abs(sinus(o.var1, o.var2)) & 0xff;
      if (o.param && o.var1 % (o.param * 4) === 0) o.x = (o.x + 1) & 0xff;
      return true;
    },

    //  « Object moves down and to the left 2 pixels at a time until it reaches
    //    x coord $30 and disappears. »
    BATTLE_ANIM_FUNC_CURSE: function (o) {
      o.x = (o.x - 2) & 0xff;
      o.y = (o.y + 2) & 0xff;
      return o.x > 0x30;
    },

    //  « Obj moves down and disappears at x coord $38. »
    BATTLE_ANIM_FUNC_POWDER: function (o) {
      o.y = (o.y + 1) & 0xff;
      o.x = (o.x - 1) & 0xff;
      return o.x > 0x38;
    },

    //  « Obj moves in an ever shrinking circle. Obj Param defines initial
    //    position in the circle. »
    BATTLE_ANIM_FUNC_RECOVER: function (o) {
      if (!o.var2) o.var2 = 0x20;
      o.param = (o.param + 2) & 0xff;
      o.yo = sinus(o.param, o.var2) & 0xff;
      o.xo = sinus(o.param + 16, o.var2) & 0xff;
      if ((o.param & 7) === 0 && --o.var2 <= 0) return false;
      return true;
    },

    //  « Inches object in a circular movement where its height is 1/4 the
    //    width », vers le camp adverse.
    BATTLE_ANIM_FUNC_WAVE_TO_TARGET: function (o) {
      o.var1 = (o.var1 + 4) & 0xff;
      o.yo = (sinus(o.var1, 0x20) >> 2) & 0xff;
      versLaCible(o, o.param || 2);
      return o.x < 0x9c;
    },

    //  Le jet vers la cible, qui s'efface en arrivant — la parente de
    //  `USER_TO_TARGET_DISAPPEAR`, en arc plutôt qu'en ligne droite.
    BATTLE_ANIM_FUNC_THROW_TO_TARGET_DISAPPEAR: function (o) {
      o.var1 = (o.var1 + 3) & 0xff;
      o.yo = (-Math.abs(sinus(o.var1, 0x18))) & 0xff;
      versLaCible(o, o.param || 4);
      return o.x < 0x84;
    },

    // ── LA TROISIÈME VAGUE — CELLES QUE LE DÉPÔT NE COMMENTE PAS ────────────
    //  ⚠️ Ici la phrase manque, donc on lit l'assembleur. Trois d'entre elles
    //     NE BOUGENT RIEN dans la cartouche — leur travail est de changer de
    //     suite d'images, ce que la donnée porte déjà. Les traduire par
    //     « rien » n'est pas un renoncement : c'est ce que le ROM fait.

    //  `.zero` choisit une suite d'images et retourne ; `.one` est un `ret`
    //  nu. Aucun déplacement dans la cartouche.
    BATTLE_ANIM_FUNC_STRING: function () { return true; },

    //  « Uses anim_setobj for different kick types ». La phase par défaut est
    //  `.zero`, qui est un `ret` : sans `anim_setobj` — que le script ne pose
    //  pas pour ces objets-ci — le coup de pied ne bouge pas, et c'est le ROM.
    BATTLE_ANIM_FUNC_KICK: function () { return true; },

    //  Phases 0 et 2 : `ret`. Phase 1 : changement de suite d'images. Phase 3 :
    //  l'objet s'efface. C'est `anim_incobj` qui fait avancer les phases.
    BATTLE_ANIM_FUNC_THUNDER_WAVE: function (o) { return o.etape < 3; },

    //  « anim_incobj is used to DeInit object ». Trois objets posés d'un coup,
    //  chacun avec son décalage ; ils attendent d'être effacés par le script.
    BATTLE_ANIM_FUNC_AMNESIA: function (o) { return o.etape < 1; },

    //  Descente en spirale : le sinus divisé par huit donne la nappe, `var2` la
    //  fait descendre d'un cran toutes les huit images, et l'objet s'efface
    //  passé $28.
    BATTLE_ANIM_FUNC_SPIRAL_DESCENT: function (o) {
      o.yo = ((sinus(o.var1, 0x18) >> 3) + o.var2) & 0xff;
      o.xo = sinus(o.var1 + 16, 0x18) & 0xff;
      o.var1 = (o.var1 + 1) & 0xff;
      if ((o.var1 & 7) !== 0) return true;
      if (o.var2 >= 0x28) return false;
      o.var2++;
      return true;
    },

    //  Le gaz avance vers la cible en ondulant, puis descend en spirale — la
    //  seconde phase EST `SPIRAL_DESCENT`, le ROM y saute directement.
    BATTLE_ANIM_FUNC_POISON_GAS: function (o) {
      if (o.etape >= 1) return ROUTINES.BATTLE_ANIM_FUNC_SPIRAL_DESCENT(o);
      if (o.x >= 0x84) { o.etape = 1; o.var1 = 0; o.var2 = 0; return true; }
      o.x = (o.x + 1) & 0xff;
      o.xo = sinus(o.var1 + 16, 0x18) & 0xff;
      o.var1 = (o.var1 + 1) & 0xff;
      if ((o.x & 1) === 0) o.y = (o.y - 1) & 0xff;
      return true;
    },

    //  « Object bounces from user to target and stops at x coord $6c. Uses
    //    anim_incobj to clear object. »
    BATTLE_ANIM_FUNC_PRESENT_SMOKESCREEN: function (o) {
      if (!o.etape) { o.etape = 1; o.var1 = 0x34; o.var2 = 0x10; }
      if (o.etape >= 2) return false;
      if (o.x >= 0x6c) return true;
      versLaCible(o, 2);
      o.var1 = (o.var1 + 6) & 0xff;
      o.yo = (-Math.abs(sinus(o.var1, o.var2))) & 0xff;
      return true;
    },

    //  « Moves object in a circle where the height is 1/8 the width, while also
    //    moving upward 2 pixels per frame for 24 frames after which it
    //    disappears. »
    BATTLE_ANIM_FUNC_SACRED_FIRE: function (o) {
      if (o.var1 >= 24) return false;
      o.var1++;
      o.var2 = (o.var2 - 2) & 0xff;
      o.yo = ((sinus(o.param, 0x18) >> 3) + signe(o.var2)) & 0xff;
      o.xo = sinus(o.param + 16, 0x18) & 0xff;
      o.param = (o.param + 2) & 0xff;
      return true;
    },

    //  La corne avance vers la cible jusqu'à $58, puis s'arrête. La phase de
    //  départ vient du paramètre, comme pour Déflagration.
    BATTLE_ANIM_FUNC_HORN: function (o) {
      if (o.x >= 0x58) return true;
      versLaCible(o, 2);
      return true;
    },

    //  « Object falls vertically and bounces on the ground. Obj Param defines
    //    speed and duration. » L'amplitude se divise par deux toutes les
    //    trente-deux images : c'est le rebond qui s'éteint. À zéro, l'objet
    //    s'en va.
    BATTLE_ANIM_FUNC_BATON_PASS: function (o) {
      if (!o.param) return false;
      o.yo = (-Math.abs(sinus(o.var1, o.param))) & 0xff;
      o.var1 = (o.var1 + 1) & 0xff;
      if ((o.var1 & 0x1f) === 0) o.param = o.param >> 1;
      return true;
    },

    //  « Object moves upwards 4 pixels per frame until it disappears at y
    //    coord $d0. »
    BATTLE_ANIM_FUNC_RAPID_SPIN: function (o) {
      if (o.yo === 0xd0) return false;
      o.yo = (o.yo - 4) & 0xff;
      return true;
    },

    //  Déflagration : la PHASE de l'objet vient de son paramètre. À sept, la
    //  boule part vers la cible en montant, puis tourne en cercle une fois
    //  arrivée ; aux autres valeurs elle ne fait que porter sa suite d'images.
    BATTLE_ANIM_FUNC_FIRE_BLAST: function (o) {
      if (o.param !== 7) return true;
      if (o.etape < 1) {
        if (o.x >= 0x88) { o.etape = 1; o.var1 = 0; return true; }
        o.x = (o.x + 2) & 0xff;
        o.y = (o.y - 1) & 0xff;
        return true;
      }
      o.var1 = (o.var1 + 2) & 0xff;
      o.yo = sinus(o.var1, 0x10) & 0xff;
      o.xo = sinus(o.var1 + 16, 0x10) & 0xff;
      return true;
    },

    //  La bourrasque ondule et avance d'un pixel par image, en montant d'un
    //  toutes les deux — c'est `.move`, et c'est ce que fait le gros de la
    //  routine. Elle s'efface passée l'abscisse $b8.
    //  ⚠️ L'AMPLITUDE DE L'ONDULATION EST UNE LECTURE, PAS UNE MESURE :
    //     `.GustWobble` n'est pas dans ce que j'ai lu. Le reste est du ROM.
    BATTLE_ANIM_FUNC_GUST: function (o) {
      o.var1 = (o.var1 + 3) & 0xff;
      o.yo = sinus(o.var1, 6) & 0xff;
      o.x = (o.x + 1) & 0xff;
      if ((o.x & 1) === 0) o.y = (o.y - 1) & 0xff;
      return o.x < 0xb8;
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS DE FOND
  //
  //  ⚠️ AUCUN N'EST PORTÉ POUR L'INSTANT, et c'est dit. Ils agissent sur
  //     l'ÉCRAN — secousse, éclair, cycles de palette — donc sur la scène
  //     entière et non sur un objet. Les nommer ici, même vides, garde le
  //     compte juste : un effet qu'on ignore en silence disparaît du relevé.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔑 ON RÉEMPLOIE LE VOCABULAIRE DE 1996, ET C'EST UNE DÉCISION. Le lecteur
  //     de Kanto porte depuis des mois un jeu de classes éprouvées —
  //     `est-eclair`, `est-secousse-h`, `est-palette`, `est-efface`… Inventer
  //     un second jeu pour Johto donnerait deux langages visuels dans le même
  //     combat : un éclair de 1996 et un éclair de 1999 qui ne se ressemblent
  //     pas. Le joueur ne voit pas deux moteurs, il voit un jeu.
  //  🔑 ET LES NOMS DU ROM DISENT CE QU'ILS FONT. `FLASH_INVERTED`,
  //     `SHAKE_SCREEN_X`, `FADE_MON_TO_BLACK`, `HIDE_MON` : la correspondance
  //     se lit, elle ne se devine pas. Là où le nom ne suffit pas, l'entrée est
  //     ABSENTE et comptée — jamais approchée au jugé.
  //  ⚠️ TROIS FAMILLES, comme en 1996 : l'ÉCRAN (`classe`), la CRÉATURE
  //     (`sprite`, posé sur le camp qui frappe ou sur celui d'en face), et rien
  //     du tout pour ce qu'on ne sait pas rendre.
  //  ⚠️ ILS NE BLOQUENT PAS LE SCRIPT. En 1996 un effet d'écran est un PAS de
  //     l'animation et on l'attend ; en 1999 il tourne À CÔTÉ des objets. On le
  //     pose et on le retire au minuteur — attendre ici figerait les objets.
  var FONDS = {
    // ── L'écran ────────────────────────────────────────────────────────────
    BATTLE_BG_EFFECT_FLASH_INVERTED: { classe: "est-eclair", duree: 320 },
    BATTLE_BG_EFFECT_WHITE_HUES: { classe: "est-eclair", duree: 260 },
    BATTLE_BG_EFFECT_BLACK_HUES: { classe: "est-noir-bref", duree: 200 },
    BATTLE_BG_EFFECT_ALTERNATE_HUES: { classe: "est-palette", duree: 300 },
    BATTLE_BG_EFFECT_NIGHT_SHADE: { classe: "est-nuit", duree: 420 },
    BATTLE_BG_EFFECT_SHAKE_SCREEN_X: { classe: "est-secousse-h", duree: 300 },
    BATTLE_BG_EFFECT_PSYCHIC: { classe: "est-onde", duree: 560 },
    BATTLE_BG_EFFECT_WHIRLPOOL: { classe: "est-onde", duree: 620 },

    // ── La créature qui frappe : elle s'élance ─────────────────────────────
    //  Le ROM a six façons de lancer le corps en avant ; nous en avons une, et
    //  c'est assez pour dire « il se jette ». Les distinguer demanderait six
    //  animations que personne ne saurait nommer en les voyant.
    BATTLE_BG_EFFECT_TACKLE: { sprite: "est-decale", duree: 240 },
    BATTLE_BG_EFFECT_BODY_SLAM: { sprite: "est-decale", duree: 280 },
    BATTLE_BG_EFFECT_VITAL_THROW: { sprite: "est-decale", duree: 280 },
    BATTLE_BG_EFFECT_FLAIL: { sprite: "est-rebondit", duree: 420 },
    BATTLE_BG_EFFECT_ROLLOUT: { sprite: "est-rebondit", duree: 380 },
    BATTLE_BG_EFFECT_BOUNCE_DOWN: { sprite: "est-rebondit", duree: 380 },
    BATTLE_BG_EFFECT_WOBBLE_MON: { sprite: "est-clignote", duree: 360 },

    // ── La créature d'en face : elle s'efface, elle revient ────────────────
    //  ⚠️ `HIDE` et `SHOW` VONT PAR PAIRE, et c'est pour ça que `SHOW_MON` est
    //     le plus employé des vingt-neuf : il rend ce que `HIDE` a pris. Porter
    //     l'un sans l'autre laisserait un Pokémon effacé pour de bon.
    BATTLE_BG_EFFECT_HIDE_MON: { sprite: "est-efface", duree: 200, tient: true },
    BATTLE_BG_EFFECT_SHOW_MON: { sprite: null, duree: 120 },
    BATTLE_BG_EFFECT_ENTER_MON: { sprite: "est-revient", duree: 240 },
    BATTLE_BG_EFFECT_RETURN_MON: { sprite: "est-revient", duree: 240 },
    BATTLE_BG_EFFECT_FADE_MON_TO_BLACK: { sprite: "est-sombre", duree: 300 },
    BATTLE_BG_EFFECT_FADE_MON_TO_BLACK_REPEATING: { sprite: "est-sombre", duree: 480 },
    BATTLE_BG_EFFECT_FADE_MONS_TO_BLACK_REPEATING: { sprite: "est-sombre", duree: 480 },
    BATTLE_BG_EFFECT_CYCLE_MON_LIGHT_DARK_REPEATING: { sprite: "est-clignote", duree: 420 },
    BATTLE_BG_EFFECT_FADE_MON_TO_LIGHT_REPEATING: { sprite: "est-clignote", duree: 420 },
    BATTLE_BG_EFFECT_FADE_MON_TO_WHITE_WAIT_FADE_BACK: { sprite: "est-clignote", duree: 320 },

    // ── ET CE QU'ON NE REND PAS, NOMMÉ ────────────────────────────────────
    //  `BATTLEROBJ_1ROW` / `_2ROW` recopient les tuiles du COMBATTANT dans les
    //  objets de l'animation : c'est ainsi que Lilliput ou Morphing se servent
    //  du sprite lui-même comme d'un objet. Ça demande la machinerie de tuiles
    //  du Game Boy, pas une classe CSS. Absents de cette table, donc COMPTÉS.
    //  Les deux `CYCLE_*_OBPALS_GRAY_AND_YELLOW` font clignoter la palette des
    //  OBJETS entre gris et jaune — un scintillement électrique. Nos tuiles
    //  sont des images, pas des palettes indexées : le rendre demanderait une
    //  seconde planche recolorée par objet. Absents, donc comptés eux aussi.
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  POSER UN EFFET DE FOND
  //
  //  🔴 ET LE RETIRER, QUOI QU'IL ARRIVE. Une classe qui « tient »
  //     (`est-efface`) laisse un Pokémon invisible ; si l'animation est
  //     interrompue — un second coup, un changement d'écran — elle resterait
  //     posée et la créature disparaîtrait du combat pour de bon. Le lecteur de
  //     1996 nettoie tout à la fin pour exactement cette raison ; on fait
  //     pareil, et `nettoyer()` est appelée sur TOUS les chemins de sortie.
  //  ⚠️ La scène est l'hôte du Game Boy, la créature est `[data-cote] img` :
  //     mêmes sélecteurs qu'en 1996, parce que c'est le même écran.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLASSES_SPRITE = ["est-efface", "est-revient", "est-clignote", "est-decale",
    "est-rebondit", "est-sombre"];
  var CLASSES_ECRAN = ["est-eclair", "est-noir-bref", "est-palette", "est-nuit",
    "est-secousse-h", "est-onde"];

  function spriteDe(hote, cote, adverse) {
    var vise = adverse ? (cote === "joueur" ? "adverse" : "joueur") : cote;
    return hote.querySelector('[data-cote="' + vise + '"] img');
  }

  function nettoyer(hote) {
    if (!hote || !hote.classList) return;
    for (var i = 0; i < CLASSES_ECRAN.length; i++) hote.classList.remove(CLASSES_ECRAN[i]);
    var imgs = hote.querySelectorAll ? hote.querySelectorAll("[data-cote] img") : [];
    for (var j = 0; j < imgs.length; j++) {
      for (var k = 0; k < CLASSES_SPRITE.length; k++) imgs[j].classList.remove(CLASSES_SPRITE[k]);
    }
  }

  function poserFond(hote, nom, cote, ms) {
    var e = FONDS[nom];
    //  Un effet qu'on ne sait pas rendre se COMPTE — il ne disparaît pas.
    if (!e) { nonPorteesFond[nom] = (nonPorteesFond[nom] || 0) + 1; return; }
    var duree = e.duree * Math.max(0.1, ms / IMAGE_MS);

    if (e.sprite !== undefined) {
      var img = spriteDe(hote, cote, e.adverse);
      if (!img || !img.classList) return;
      //  `sprite: null` remet la créature en place : c'est ce que fait
      //  `SHOW_MON`, et c'est pour ça qu'il est le plus employé des vingt-neuf.
      if (!e.sprite) {
        for (var k = 0; k < CLASSES_SPRITE.length; k++) img.classList.remove(CLASSES_SPRITE[k]);
        return;
      }
      img.classList.add(e.sprite);
      if (!e.tient) W.setTimeout(function () { img.classList.remove(e.sprite); }, duree);
      return;
    }
    if (!hote.classList) return;
    hote.classList.add(e.classe);
    W.setTimeout(function () { hote.classList.remove(e.classe); }, duree);
  }

  // ── La couche et les tuiles ────────────────────────────────────────────────
  function creerCouche(hote) {
    var couche = hote.querySelector(".pkdx-anim");
    if (couche) return couche;
    couche = D.createElement("div");
    couche.className = "pkdx-anim";
    couche.setAttribute("aria-hidden", "true");
    hote.appendChild(couche);
    return couche;
  }

  function ajuster(hote, couche) {
    var l = hote.clientWidth || LARGEUR;
    couche.style.setProperty("--echelle", l / LARGEUR);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNE TUILE
  //
  //  ⚠️ LA LARGEUR DE LA PLANCHE EST UNE DONNÉE. Celles de 1996 font toutes
  //     seize tuiles ; celles de 1999 vont de UNE à QUATRE. `p.l` la porte,
  //     lue dans l'en-tête du PNG par le générateur — jamais supposée.
  //  ⚠️ ET UNE TUILE AU-DELÀ DE CE QUE LE ROM CHARGE N'EXISTE PAS : `hit.png`
  //     contient vingt-six tuiles, la table n'en déclare que vingt-et-une.
  //     C'est exactement la garde de 1996, pour la même raison.
  // ═══════════════════════════════════════════════════════════════════════════
  function tuile(planche, t) {
    var p = (A().planches || {})[planche];
    if (!p || !p.img || !p.l) return null;
    if (t >= p.tuiles) return null;
    var e = D.createElement("i");
    e.className = "pkdx-tuile";
    e.style.backgroundImage = "url(assets/img/poke/anim/" + p.img + ")";
    e.style.backgroundPosition = "-" + (t % p.l) * TUILE + "px -" +
      Math.floor(t / p.l) * TUILE + "px";
    return e;
  }

  // ── Un objet vivant ────────────────────────────────────────────────────────
  //  Les six champs du ROM, et rien de plus : c'est ce qui permet de traduire
  //  une routine sans l'interpréter.
  function naitre(def, nom, x, y, param) {
    return {
      def: def, nom: nom,
      x: x & 0xff, y: y & 0xff,     // position, en coordonnées OAM
      xo: 0, yo: 0,                 // décalage, ce que les routines touchent
      var1: 0, var2: 0,             // les deux variables libres du ROM
      param: param & 0xff,
      etape: 0,                     // l'index de la petite table de sauts
      i: 0, t: 0,                   // pas courant de la suite, et son temps
      img: null,                    // l'image AFFICHÉE — voir `rendre`
      el: null, vivant: true, fige: false, tenu: 0,
    };
  }

  //  Dessine l'objet à sa position du moment.
  //  💥 ET IL DESSINE L'IMAGE EN COURS, PAS LA SUIVANTE. Ma première version
  //     lisait `suite[o.i]` — or `tourner` vient d'avancer `o.i` pour préparer
  //     la suite. Sur un frameset de deux pas (`oamframe`, puis `oamdelete`),
  //     elle lisait donc le `oamdelete`, qui ne porte aucune image : **zéro
  //     tuile à l'écran, aucune erreur**. L'objet vivait, la couche existait,
  //     et rien ne se voyait. On garde l'image affichée dans l'objet, comme le
  //     ROM garde son `FRAMESET_ID`.
  function rendre(couche, o, miroir) {
    if (o.el) o.el.remove();
    var anim = A();
    if (!o.img) { o.el = null; return; }
    var jeu = anim.oam[o.img];
    if (!jeu) { o.el = null; return; }
    var groupe = D.createElement("span");
    groupe.style.position = "absolute";
    groupe.style.left = "0"; groupe.style.top = "0";
    var X = (o.x + signe(o.xo)) & 0xff;
    var Y = (o.y + signe(o.yo)) & 0xff;
    if (miroir && o.def.relatif) {
      X = MIROIR_X - X;
      if (o.def.yfix === "$ff") Y = Y + DESCENTE_Y;
    }
    for (var k = 0; k < jeu.t.length; k++) {
      var s = jeu.t[k];
      var e = tuile(o.def.gfx, jeu.d + s.t);
      if (!e) continue;
      e.style.left = (X + s.x - OAM_X) + "px";
      e.style.top = (Y + s.y - OAM_Y) + "px";
      if (s.fx || s.fy) e.style.transform = "scale(" + (s.fx ? -1 : 1) + "," + (s.fy ? -1 : 1) + ")";
      groupe.appendChild(e);
    }
    couche.appendChild(groupe);
    o.el = groupe;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UN TOUR D'OBJET
  //
  //  🔑 TROIS FINS DIFFÉRENTES, ET LES CONFONDRE SE VOIT. `oamdelete` efface
  //     l'objet ; `oamend` termine la suite en le LAISSANT à l'écran ;
  //     `oamwait n` tient la dernière image n images de plus. C'est ce qui
  //     laisse une flamme posée pendant qu'un autre objet arrive.
  // ═══════════════════════════════════════════════════════════════════════════
  function tourner(o) {
    var suite = A().framesets[o.def.frameset] || [];
    //  La routine d'abord : elle peut retirer l'objet avant toute image.
    var r = ROUTINES[o.def.routine];
    if (r) { if (!r(o)) { o.vivant = false; return; } }
    else nonPortees[o.def.routine] = (nonPortees[o.def.routine] || 0) + 1;

    if (o.tenu > 0) { o.tenu--; return; }
    if (o.t > 0) { o.t--; return; }
    //  Image suivante.
    for (var garde = 0; garde < suite.length + 2; garde++) {
      var pas = suite[o.i];
      if (!pas) { o.vivant = false; return; }
      //  🔴 `oamend` LAISSE L'OBJET, IL NE LE TUE PAS — mais il ne doit pas
      //     tenir l'animation en otage. Vu à l'écran : Clairvoyance jouée en
      //     combat réel laissait **six tuiles posées sur la scène** une fois le
      //     menu revenu. Les objets figés vivaient encore, donc la boucle
      //     tournait jusqu'à sa garde de six cents images, donc la couche
      //     n'était jamais vidée. On les marque FIGÉS : ils restent dessinés,
      //     ils ne comptent plus comme « il se passe encore quelque chose ».
      if (pas.fin) {
        o.vivant = !!pas.garde;
        o.fige = !!pas.garde;
        if (!pas.garde && o.el) o.el.remove();
        return;
      }
      if (pas.boucle) { o.i = 0; continue; }
      if (pas.tient) { o.tenu = pas.tient; return; }
      if (pas.rep) { o.i = Math.max(0, o.i - pas.rep); continue; }
      if (pas.o) { o.img = pas.o; o.t = pas.d; o.i++; return; }
      o.i++;
    }
    o.vivant = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  JOUER UN SCRIPT
  //
  //  Le script du ROM est une bande : on la déroule jusqu'à la prochaine
  //  attente, on laisse tourner les objets pendant cette attente, et on
  //  reprend. C'est exactement ce que fait la cartouche, et c'est ce qui rend
  //  les délais fidèles sans avoir à les recalculer.
  //  ⚠️ LE BRUITAGE N'EST PAS JOUÉ ICI : `ui-combat.js` le déclenche déjà par
  //     `PokeRegles.idSon`. Le poser une seconde fois le doublerait.
  // ═══════════════════════════════════════════════════════════════════════════
  var IMAGE_MS = 1000 / 60;
  //  Ce qu'on laisse aux objets APRÈS la fin du script — voir la note plus bas.
  var APRES_MAX = 90;

  //  🔴 UNE NOUVELLE ANIMATION ANNULE LA PRÉCÉDENTE. Sans ça, deux coups
  //     rapprochés font tourner deux boucles sur la même couche : la seconde
  //     la vide au départ, la première continue d'y remettre ses tuiles, et
  //     l'on voit les deux attaques mêlées. Vu en mesurant le miroir du camp
  //     adverse — des tuiles des DEUX côtés à la fois.
  //  ⚠️ Un compteur, pas un booléen : deux annulations imbriquées doivent se
  //     distinguer, sinon la troisième réveille la première.
  var jeton = 0;
  //  Ce qu'a coûté la dernière animation — lu par `tools/poke-anim-gen2.mjs`.
  var derniere = null;

  function jouer(hote, cle, cote, vitesse) {
    var anim = A();
    if (!anim || !hote) return Promise.resolve();
    var pas = (anim.attaques || {})[cle];
    if (!pas || !pas.length) return Promise.resolve();

    var couche = creerCouche(hote);
    ajuster(hote, couche);
    couche.innerHTML = "";
    var moi = ++jeton;
    var miroir = cote !== "joueur";
    var vivants = [];
    var p = 0;
    var attente = 0;
    var apres = 0;
    var ms = IMAGE_MS * (vitesse || 1);

    return new Promise(function (fini) {
      var garde = 0;
      function image() {
        //  Une animation plus récente a pris la main : on se retire sans
        //  toucher à la couche, qui est désormais la sienne.
        //  Une animation plus récente a pris la main : elle nettoiera
        //  elle-même, mais nos effets de sprite doivent partir avec nous.
        if (moi !== jeton) { nettoyer(hote); return fini(); }
        //  Dérouler le script jusqu'à la prochaine attente.
        while (attente <= 0 && p < pas.length) {
          var x = pas[p++];
          if (x.w) { attente = x.w; break; }
          if (x.o) {
            var def = anim.objets[x.o];
            if (def) {
              var a = x.a || [];
              vivants.push(naitre(def, x.o, a[0] || 0, a[1] || 0, a[2] || 0));
            }
            continue;
          }
          if (x.b) { poserFond(hote, x.b, cote, ms); continue; }
          //  🔑 `anim_incobj` FAIT PASSER LES OBJETS À LEUR PHASE SUIVANTE.
          //     C'est par lui que Puissance Cachée ouvre son anneau et que
          //     plusieurs routines quittent leur premier temps. Sans lui, elles
          //     tournent en rond pour toujours — et l'écran attend la garde.
          if (x.x === "anim_incobj") { for (var q = 0; q < vivants.length; q++) vivants[q].etape++; continue; }
          //  `{s}` le bruitage, `{g}` les planches, `{x}` un opcode non porté :
          //  tous nommés dans la donnée, aucun avalé en silence.
          if (x.x) nonPortees[x.x] = (nonPortees[x.x] || 0) + 1;
        }
        if (attente > 0) attente--;

        var reste = [];
        for (var i = 0; i < vivants.length; i++) {
          var o = vivants[i];
          tourner(o);
          if (o.vivant) { rendre(couche, o, miroir); reste.push(o); }
          else if (o.el) o.el.remove();
        }
        vivants = reste;

        //  Fin : plus rien à dérouler, plus rien de vivant. La garde est un
        //  filet — un objet qui boucle sans fin ne doit pas tenir l'écran.
        //  Fini quand il n'y a plus rien à dérouler ET plus rien qui BOUGE.
        //  Un objet figé par `oamend` est dessiné, pas vivant.
        var bouge = false;
        for (var z = 0; z < vivants.length; z++) if (!vivants[z].fige) { bouge = true; break; }
        // ═══════════════════════════════════════════════════════════════
        //  🔴 ET L'APRÈS-SCRIPT EST BORNÉ. Certains objets ne meurent jamais
        //     d'eux-mêmes : Feu Sacré pose trois boules de Déflagration dont
        //     la suite d'images BOUCLE et dont la routine, au paramètre qu'on
        //     leur donne, ne se termine pas. Dans la cartouche, `anim_ret`
        //     démonte l'animation ; ici, sans borne, ils tournaient jusqu'à la
        //     garde de six cents images — et pendant tout ce temps leurs
        //     tuiles restaient posées sur les Pokémon, le menu déjà revenu.
        //  🔑 UNE SECONDE ET DEMIE APRÈS LA FIN DU SCRIPT, ET C'EST TOUT. Ce
        //     qui bouge encore a le temps de finir sa course ; ce qui ne finit
        //     jamais s'arrête là. La garde de six cents images reste, mais elle
        //     redevient ce qu'elle doit être : un filet qu'on ne touche jamais.
        // ═══════════════════════════════════════════════════════════════
        if (p >= pas.length) apres++;
        if ((p >= pas.length && (!bouge || apres > APRES_MAX)) || garde++ > 600) {
          //  🔑 COMBIEN D'IMAGES IL A FALLU, ET S'IL A FALLU LA GARDE. C'est la
          //     seule façon de distinguer « l'animation s'est terminée » de
          //     « la garde l'a coupée » — et c'est cette différence qui laissait
          //     six tuiles sur la scène pendant que le menu était revenu. Une
          //     couche vide À LA FIN ne prouve rien : la garde nettoie aussi.
          derniere = { images: garde, coupee: garde > 600 };
          couche.innerHTML = "";
          //  🔴 ET ON REND SA FORME À LA SCÈNE. Une classe qui « tient » —
          //     `est-efface` — laisserait un Pokémon invisible pour de bon.
          nettoyer(hote);
          return fini();
        }
        W.setTimeout(image, ms);
      }
      image();
    });
  }

  // ── Ce que le mode demande à ce lecteur ────────────────────────────────────
  function animee(cle) {
    var anim = A();
    if (!anim) return false;
    var pas = (anim.attaques || {})[cle];
    if (!pas) return false;
    for (var i = 0; i < pas.length; i++) if (pas[i].o) return true;
    return false;
  }

  //  Une animation est COMPLÈTE quand toutes les routines de ses objets sont
  //  traduites. Sinon elle se joue, en partie, et le dit.
  function complete(cle) {
    var anim = A();
    var pas = (anim && anim.attaques[cle]) || [];
    for (var i = 0; i < pas.length; i++) {
      if (!pas[i].o) continue;
      var def = anim.objets[pas[i].o];
      if (!def || !ROUTINES[def.routine]) return false;
    }
    return true;
  }

  W.PokeAnimGen2 = {
    jouer: jouer,
    animee: animee,
    complete: complete,
    routines: function () { return Object.keys(ROUTINES); },
    nonPortees: function () { return nonPortees; },
    nonPorteesFond: function () { return nonPorteesFond; },
    derniere: function () { return derniere; },
    LARGEUR: LARGEUR, HAUTEUR: HAUTEUR,
  };
})(window, document);
