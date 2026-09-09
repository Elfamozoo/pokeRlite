(function (W, D) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE LECTEUR D'ANIMATIONS D'ATTAQUE
  //
  //  Il rejoue les scripts de Rouge/Bleu, portés par `tools/poke-animations.mjs`
  //  depuis la désassemblée. Rien n'est inventé ici : la position de chaque
  //  tuile, l'ordre des images et le délai entre elles viennent du ROM.
  //
  //  ── Comment une animation est faite ────────────────────────────────────────
  //    une ATTAQUE      = une suite de pas
  //    un PAS           = une sous-animation (avec sa planche et son délai),
  //                       ou un effet d'écran (secousse, éclair, palette)
  //    une SOUS-ANIM    = une suite d'images
  //    une IMAGE        = un bloc de tuiles posé à un ancrage
  //    une TUILE        = 8×8 pixels pris dans une des deux planches
  //
  //  ── Deux décisions à justifier ────────────────────────────────────────────
  //  🔴 L'ÉCHELLE. Le Game Boy affiche 160×144. On dessine dans ce repère exact,
  //     puis on met à l'échelle d'un bloc : sans ça, il faudrait convertir
  //     chaque coordonnée du ROM, et la moindre erreur d'arrondi décalerait
  //     l'animation d'un pixel sans que rien ne le dise.
  //
  //  🔴 LE FOND BLANC. Les planches sont du trait NOIR SUR BLANC, en quatre gris.
  //     On les superpose en `multiply` sur une scène blanche : le blanc
  //     disparaît, le trait reste. Aucun détourage — c'est justement le
  //     traitement qui avait mangé le corps du Pikachu de dos. Et comme les
  //     tuiles sont en niveaux de gris, `multiply` ne peut TEINDRE personne :
  //     le piège qui avait viré Salamèche au brun ne s'applique pas ici.
  // ═══════════════════════════════════════════════════════════════════════════

  var LARGEUR = 160, HAUTEUR = 144;   // l'écran du Game Boy, en pixels
  var TUILE = 8;
  var COLONNES = 16;                  // les planches font 16 tuiles de large
  var IMAGE = 1000 / 60;              // une image du Game Boy

  var A = function () { return W.POKE_ANIM; };

  // Les effets d'écran que le lecteur sait jouer. Chacun DIT quelque chose ;
  // ceux qu'on ne sait pas encore rendre sont comptés, jamais tus.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 VINGT POUR CENT DES EFFETS SEULEMENT ÉTAIENT RENDUS — mesuré, pas
  //     estimé : 40 emplois couverts sur 198. Le reste tombait dans `inconnus`
  //     et ne produisait rien à l'écran. Des attaques entières se jouaient donc
  //     sans le tiers de leur mise en scène, et personne ne pouvait le voir
  //     puisqu'il ne manquait rien de visible — il manquait ce qui n'a jamais
  //     été là.
  //
  //  🔴 ON TRAITE PAR VOLUME RÉEL, pas dans l'ordre du fichier. Le compte des
  //     attaques qui emploient chaque effet est écrit en face de chacun : c'est
  //     lui qui décide de l'ordre du travail, et il évite de passer une heure
  //     sur un effet employé une fois.
  //
  //  Trois familles :
  //   · l'ÉCRAN — un voile, une secousse, une onde ; pur CSS sur la scène ;
  //   · le TEMPS — une pause, une remise à zéro ; rien à dessiner, mais le
  //     rythme du ROM en dépend ;
  //   · le SPRITE — glisser, clignoter, disparaître ; ça touche la créature,
  //     donc le camp, et pas la couche d'animation.
  // ═══════════════════════════════════════════════════════════════════════════
  var EFFETS = {
    // ── L'écran ──────────────────────────────────────────────────────────────
    SE_FLASH_SCREEN_LONG: { classe: "est-eclair", duree: 320 },            // 6
    SE_WAVY_SCREEN: { classe: "est-onde", duree: 700 },                    // 4
    SE_LIGHT_SCREEN_PALETTE: { classe: "est-palette", duree: 260 },        // 23
    SE_DARKEN_MON_PALETTE: { classe: "est-sombre", duree: 260 },           // 7
    SE_DARK_SCREEN_FLASH: { classe: "est-noir-bref", duree: 130 },         // 21
    SE_DARK_SCREEN_PALETTE: { classe: "est-nuit", duree: 300 },            // 12
    // 🔴 CINQ ENTRÉES `ANIMATIONTYPE_SHAKE_*` ET UNE `SE_FLASH_SCREEN` ONT ÉTÉ
    //    RETIRÉES D'ICI. Elles ne pouvaient JAMAIS se déclencher : les types de
    //    sous-animation sont numériques dans les données, pas nommés, et aucune
    //    attaque ne cite ces noms. Elles laissaient croire que les secousses
    //    d'écran étaient traitées par elles — alors que le ROM les demande sous
    //    le nom `SE_SHAKE_SCREEN`, juste dessous. Une entrée morte dans une
    //    table de correspondance est pire qu'une entrée absente : elle ment sur
    //    la couverture. Trouvée par `poke-effets`, écrit dix minutes plus tôt.
    SE_SHAKE_SCREEN: { classe: "est-secousse-h", duree: 300 },             // 4
    SE_SHAKE_BACK_AND_FORTH: { classe: "est-secousse-h", duree: 420 },
    SE_SHAKE_ENEMY_HUD: { classe: "est-secousse-h", duree: 220 },
    // 🔴 LE ROM EN A DEUX, LA TABLE N'EN CONNAISSAIT QU'UN. `SE_SHAKE_ENEMY_HUD_2`
    //    est dans `animations.js` et tombait dans la branche « effet inconnu » —
    //    silencieuse jusqu'à aujourd'hui. Trouvé en cherchant à qui servait
    //    `est-secousse-v` : à personne, mais la recherche a levé celui-ci.
    SE_SHAKE_ENEMY_HUD_2: { classe: "est-secousse-h", duree: 220 },
    SE_WATER_DROPLETS_EVERYWHERE: { classe: "est-gouttes", duree: 520 },   // 4
    SE_LEAVES_FALLING: { classe: "est-chute", duree: 620 },
    SE_PETALS_FALLING: { classe: "est-chute", duree: 620 },
    // La spirale de billes du ROM — dix attaques l'emploient, dont les coups
    // psychiques. Elle converge vers le centre : c'est ce qui la distingue des
    // deux suivantes, qui partent vers le haut.
    SE_SPIRAL_BALLS_INWARD: { classe: "est-spirale", duree: 560 },
    SE_SHOOT_BALLS_UPWARD: { classe: "est-jaillit", duree: 420 },
    SE_SHOOT_MANY_BALLS_UPWARD: { classe: "est-jaillit", duree: 560 },

    // ── Le temps ─────────────────────────────────────────────────────────────
    //  🔴 CE NE SONT PAS DES EFFETS VIDES, CE SONT DES RESPIRATIONS. Le ROM
    //     rend la palette d'origine après l'avoir changée ; comme nos voiles
    //     sont des animations courtes qui se retirent seules, la remise à zéro
    //     n'a rien à défaire — mais elle marque un temps, et sans lui le
    //     rythme de l'attaque n'est pas celui du jeu. Quarante et un emplois.
    SE_RESET_SCREEN_PALETTE: { pause: 60 },                                // 41
    SE_DELAY_ANIMATION_10: { pause: 160 },                                 // 6

    // ── Le sprite ────────────────────────────────────────────────────────────
    //  Ils touchent la CRÉATURE, pas la scène : la classe se pose sur l'image
    //  du camp qui frappe — ou sur celle d'en face quand le nom le dit.
    SE_SHOW_MON_PIC: { sprite: "est-revient", duree: 200 },                // 11
    SE_HIDE_MON_PIC: { sprite: "est-efface", duree: 200, tient: true },
    SE_SLIDE_MON_OFF: { sprite: "est-sort", duree: 320, tient: true },     // 6
    SE_SLIDE_MON_HALF_OFF: { sprite: "est-sort-moitie", duree: 260, tient: true },
    SE_SLIDE_MON_DOWN: { sprite: "est-descend", duree: 300, tient: true },
    SE_SLIDE_MON_DOWN_AND_HIDE: { sprite: "est-descend", duree: 300, tient: true },
    SE_SLIDE_MON_UP: { sprite: "est-monte", duree: 300 },
    SE_MOVE_MON_HORIZONTALLY: { sprite: "est-decale", duree: 220, tient: true },  // 7
    SE_RESET_MON_POSITION: { sprite: null, duree: 120 },                   // 7
    SE_BLINK_MON: { sprite: "est-clignote", duree: 360 },
    SE_FLASH_MON_PIC: { sprite: "est-clignote", duree: 240 },
    SE_SQUISH_MON_PIC: { sprite: "est-ecrase", duree: 300 },
    SE_MINIMIZE_MON: { sprite: "est-minimise", duree: 320, tient: true },
    SE_BOUNCE_UP_AND_DOWN: { sprite: "est-rebondit", duree: 480 },
    SE_TRANSFORM_MON: { sprite: "est-transforme", duree: 420 },
    SE_SUBSTITUTE_MON: { sprite: "est-clone", duree: 320 },
    SE_BLINK_ENEMY_MON: { sprite: "est-clignote", duree: 360, adverse: true },
    SE_HIDE_ENEMY_MON_PIC: { sprite: "est-efface", duree: 200, adverse: true, tient: true },
    SE_SHOW_ENEMY_MON_PIC: { sprite: "est-revient", duree: 200, adverse: true },
    SE_SLIDE_ENEMY_MON_OFF: { sprite: "est-sort", duree: 320, adverse: true, tient: true },
  };

  // Les classes de sprite qui « tiennent » restent posées jusqu'à la fin de
  // l'attaque : glisser hors champ puis revenir tout seul n'aurait aucun sens.
  // 🔴 Elles se retirent TOUTES à la fin, quoi qu'il arrive — une créature
  //    laissée hors cadre par une animation interrompue disparaîtrait du
  //    combat pour de bon.
  var CLASSES_SPRITE = [
    "est-revient", "est-efface", "est-sort", "est-sort-moitie", "est-descend",
    "est-monte", "est-decale", "est-clignote", "est-ecrase", "est-minimise",
    "est-rebondit", "est-transforme", "est-clone",
  ];
  // 🔴 Un effet sans rendu ne disparaît pas en silence : on le compte, et
  //    `PokeAnimAttaque.inconnus()` le rend. C'est la même règle que pour un
  //    événement de combat sans texte — ce que le jeu sait, il doit le dire.
  var inconnus = {};

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'HÔTE EST L'ÉCRAN GB ENTIER — 160 × 144 (chantier du 12/08)
  //
  //  🔴 L'HISTOIRE, pour ne pas la repayer : l'audit a montré que le ROM
  //     dessine sur sa boîte de texte (jamais `OAM_BEHIND_BG`, 0 sur 745
  //     sprites) — HFLIP (tour adverse, Y+40) y envoie les impacts aux pieds
  //     du joueur. L'arène de 96 lignes coupait cette bande : Jet d'Eau
  //     adverse perdait 86 % de ses tuiles-instants, Flammèche 50 %. Une
  //     « fenêtre qui déborde sous l'arène » a été essayée et RETIRÉE le jour
  //     même : sur le panneau sombre du mode, les tuiles au blanc opaque se
  //     montraient en carrés blancs (prouvé au navigateur).
  //  ✅ La vraie réponse est STRUCTURELLE : l'hôte (`.pkdx-ecran-gb`) fait
  //     désormais les 144 lignes du GB, boîte de texte blanche comprise. La
  //     couche le couvre en entier, il n'y a plus rien à couper — le blanc de
  //     la boîte est celui pour lequel les planches ont été dessinées.
  // ═══════════════════════════════════════════════════════════════════════════
  function creerCouche(hote) {
    var couche = hote.querySelector(".pkdx-anim");
    if (couche) return couche;
    couche = D.createElement("div");
    couche.className = "pkdx-anim";
    couche.setAttribute("aria-hidden", "true");
    hote.appendChild(couche);
    return couche;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MISE À L'ÉCHELLE — ELLE SE CALE SUR LA LARGEUR, ET RIEN D'AUTRE
  //
  //  🔴 DEUX VERSIONS FAUSSES AVANT CELLE-CI, ET LA MÊME CAUSE DERRIÈRE.
  //     La première ne regardait que la largeur d'une scène qui contenait
  //     AUSSI le journal et les boutons : les flammes tombaient sur la boîte
  //     de dialogue. J'ai « corrigé » en prenant la plus petite des deux
  //     échelles et en centrant — ce qui a produit le défaut signalé par le
  //     propriétaire, « c'est même pas cadré » : sur une scène deux fois et
  //     demie plus large que haute, le repère du Game Boy se réduisait à une
  //     bande centrale de 333 px pendant que les créatures se tenaient aux
  //     deux extrémités.
  //
  //  ✅ L'échelle se cale sur la LARGEUR : 160 colonnes du ROM = la largeur de
  //     l'hôte, exactement. Depuis le 12/08, l'hôte (`.pkdx-ecran-gb`) porte
  //     AUSSI les 144 lignes — la couche et lui ont les mêmes proportions, et
  //     les coordonnées du ROM tombent au pixel près, sans marge ni
  //     correction. C'est ce qui permet de poser les créatures aux mêmes
  //     coordonnées côté feuille de style.
  // ═══════════════════════════════════════════════════════════════════════════
  function ajuster(hote, couche) {
    var l = hote.clientWidth || LARGEUR;
    var echelle = l / LARGEUR;
    couche.style.setProperty("--echelle", echelle);
  }

  function tuile(planche, t) {
    var p = A().planches[planche] || A().planches[0];
    // 🔴 Une tuile hors de la planche chargée n'existe pas dans le jeu : la
    //    planche 2 n'en charge que 64 alors que le fichier en contient 79.
    if (t >= p.tuiles) return null;
    var e = D.createElement("i");
    e.className = "pkdx-tuile";
    e.style.backgroundImage = "url(assets/img/poke/anim/" + p.img + ")";
    e.style.backgroundPosition = "-" + (t % COLONNES) * TUILE + "px -" +
      Math.floor(t / COLONNES) * TUILE + "px";
    return e;
  }

  //  (12/08) `etendue()` et le miroir « autour du bloc » sont partis avec la
  //  refonte des transformations : le ROM ne miroite pas un bloc dans son
  //  étendue, il inverse la COORDONNÉE FINALE autour de 168/136 — voir
  //  `poserImage`. La leçon d'alors (« un retournement autour de zéro expulse
  //  les tuiles ») reste vraie ; elle est simplement traitée au bon endroit.

  // Une image : les tuiles d'un bloc, posées à leur ancrage.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES COORDONNÉES DU ROM, ENFIN DANS SON REPÈRE — 12/08/2026
  //
  //  🔴 DEUX SIGNALEMENTS LE MÊME SOIR : « Flammèche s'anime sur MA barre de
  //     vie » puis « l'attaque adverse PART DE NOTRE Pokémon ». Mesuré au banc
  //     (échantillonnage des tuiles) : Flammèche à x 120-143 / y 64-72 ROM —
  //     colonne adverse, ligne joueur, pile la fiche PV.
  //  🔴 LA CAUSE, lue dans pokered (`DrawFrameBlock`) : les ancrages de
  //     `base_coords.asm` sont en coordonnées OAM — décalées de (+8, +16) par
  //     rapport à l'écran — et nous les dessinions BRUTES pendant que les
  //     créatures, elles, sont posées en coordonnées ÉCRAN par la feuille
  //     (`--rom-adv-*`). Tout partait donc 8 px à droite et 16 px trop bas.
  //  🔴 ET LES TRANSFORMATIONS N'ÉTAIENT PAS CELLES DU ROM. Le nôtre
  //     miroirait les tuiles À L'INTÉRIEUR du bloc et retournait la couche
  //     d'un demi-tour pour tout coup adverse. Le ROM, lui :
  //       · résout la transformation PAR TOUR (`GetSubanimationTransform1/2`) —
  //         un type déclaré ne s'applique qu'au tour ADVERSE (sauf ENEMY,
  //         qui devient HFLIP au tour du joueur) ;
  //       · HVFLIP : X' = 168 − X, Y' = 136 − Y, dessins retournés ;
  //       · HFLIP  : X' = 168 − X, Y' = Y + 40 (TRANSLATION vers le bas !) ;
  //       · COORDFLIP : seule la BASE s'inverse, les offsets restent droits.
  //     Le demi-tour de couche v543 approximait HVFLIP à (8, 40) près — assez
  //     pour que « ça parte du mauvais Pokémon ».
  // ═══════════════════════════════════════════════════════════════════════════
  var OAM_X = 8, OAM_Y = 16;   // OAM → écran, les constantes du Game Boy

  //  🔴 ELLE N'EFFACE PLUS LA COUCHE (12/08, « Griffe bouge dans tous les
  //     sens ») : c'est `jouerSous` qui décide de ce qui reste à l'écran,
  //     selon le MODE de chaque image — voir la table des modes là-bas. Elle
  //     rend le GROUPE posé, pour que le mode 04 puisse écraser le sien.
  function poserImage(couche, planche, idBloc, idAncrage, mode) {
    var anim = A();
    var T = anim.types;
    var bloc = anim.blocs[idBloc] || [];
    var ancrage = anim.bases[idAncrage] || [0, 0];
    var bx = ancrage[0], by = ancrage[1];
    if (mode === T.COORDFLIP) { bx = 168 - bx; by = 136 - by; }
    // Un groupe à (0,0) sans étendue : les tuiles gardent leurs coordonnées,
    // et le groupe se retire d'un seul geste.
    var groupe = D.createElement("span");
    groupe.style.position = "absolute";
    groupe.style.left = "0"; groupe.style.top = "0";
    for (var i = 0; i < bloc.length; i++) {
      var s = bloc[i];
      var e = tuile(planche, s.t);
      if (!e) continue;
      var X = bx + s.x, Y = by + s.y;   // OAM, comme le ROM les additionne
      var fx = s.fx, fy = s.fy;
      if (mode === T.HVFLIP) {
        X = 168 - X; Y = 136 - Y; fx = fx ^ 1; fy = fy ^ 1;
      } else if (mode === T.HFLIP) {
        X = 168 - X; Y = Y + 40; fx = fx ^ 1;
      }
      e.style.left = (X - OAM_X) + "px";
      e.style.top = (Y - OAM_Y) + "px";
      if (fx || fy) e.style.transform = "scale(" + (fx ? -1 : 1) + "," + (fy ? -1 : 1) + ")";
      groupe.appendChild(e);
    }
    couche.appendChild(groupe);
    return groupe;
  }

  function dodo(ms) { return new Promise(function (r) { W.setTimeout(r, ms); }); }

  // ── Un pas de sous-animation ────────────────────────────────────────────────
  //  La résolution PAR TOUR du ROM (`GetSubanimationTransform1/2`) : le type
  //  DÉCLARÉ ne s'applique qu'au tour ADVERSE ; au tour du joueur, tout se
  //  joue BRUT — sauf le type ENEMY, qui devient HFLIP. Même l'ordre inversé
  //  (REVERSE) n'existe qu'au tour adverse : c'est le ROM qui le dit.
  function modeDe(declare, cote) {
    var T = A().types;
    if (declare === T.ENEMY) return cote === "joueur" ? T.HFLIP : T.NORMAL;
    return cote === "joueur" ? T.NORMAL : declare;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MODE DE CHAQUE IMAGE — LE TROISIÈME CHAMP, ENFIN LU (12/08)
  //
  //  🔴 « L'ANIMATION DE GRIFFE BOUGE DANS TOUS LES SENS » (Tatsu). Chaque
  //     image d'une sous-animation porte TROIS champs : bloc, ancrage, MODE —
  //     et le lecteur ignorait le mode. Or c'est lui qui dit ce qui RESTE à
  //     l'écran (`DrawFrameBlock`, engine/battle/animations.asm) :
  //       · MODE_02 : dessine SANS délai, sans effacer — les blocs s'empilent ;
  //       · MODE_03 : délai, on garde tout ;
  //       · MODE_04 : délai, on garde — et le bloc SUIVANT écrase celui-ci ;
  //       · MODE_00/01 : délai, puis on efface tout — la fin d'une image.
  //     Griffe est faite de trios (02, 02, 00) : la MÊME entaille à trois
  //     ancrages EN MÊME TEMPS — la traînée diagonale. En jouant chaque
  //     entrée comme une image seule, l'entaille sautait d'un ancrage à
  //     l'autre : « dans tous les sens », exactement.
  //  ⚠️ Le ROM n'efface pas l'OAM sur GROWL (cas spécial) ni sur un mode 04
  //     à tuiles inégales — deux nuances de recouvrement d'adresses sans
  //     équivalent DOM : ici un groupe se remplace en entier, ce qui rend le
  //     même dessin sans le clignotement que l'OAM évitait.
  // ═══════════════════════════════════════════════════════════════════════════
  async function jouerSous(couche, pas, vitesse, cote) {
    var anim = A();
    var sous = anim.sous[pas.s];
    if (!sous || !sous.i.length) return;
    var T = anim.types;
    var mode = modeDe(sous.t, cote);
    var images = mode === T.REVERSE ? sous.i.slice().reverse() : sous.i;
    // Le délai du ROM est en IMAGES DE GAME BOY. Une image dure un soixantième
    // de seconde ; le délai vaut au minimum une image, sinon rien ne se voit.
    var pause = Math.max(1, pas.d) * IMAGE * vitesse;
    couche.innerHTML = "";
    var aEcraser = null;   // le groupe posé en MODE_04 : le suivant le remplace
    for (var i = 0; i < images.length; i++) {
      if (aEcraser) { couche.removeChild(aEcraser); aEcraser = null; }
      var groupe = poserImage(couche, pas.p, images[i][0], images[i][1], mode);
      var m = images[i][2];
      if (m === 2) continue;                          // MODE_02 — sans délai
      await dodo(pause);
      if (m === 3) continue;                          // MODE_03 — on garde
      if (m === 4) { aEcraser = groupe; continue; }   // MODE_04 — à écraser
      couche.innerHTML = ""; aEcraser = null;         // MODE_00/01 — on efface
    }
    couche.innerHTML = "";
  }

  // ── Un pas d'effet d'écran ──────────────────────────────────────────────────
  // L'image d'un camp. `cote` est celui qui FRAPPE ; un effet marqué `adverse`
  // vise l'autre — c'est le ROM qui le dit dans le nom de l'effet.
  function spriteDe(scene, cote, adverse) {
    var vise = adverse ? (cote === "joueur" ? "adverse" : "joueur") : cote;
    return scene.querySelector('[data-cote="' + vise + '"] img');
  }

  function nettoyerSprites(scene) {
    var imgs = scene.querySelectorAll("[data-cote] img");
    for (var i = 0; i < imgs.length; i++) {
      for (var k = 0; k < CLASSES_SPRITE.length; k++) imgs[i].classList.remove(CLASSES_SPRITE[k]);
    }
  }

  async function jouerEffet(scene, pas, vitesse, cote) {
    var nom = A().effets[pas.e];
    var e = EFFETS[nom];
    // 🔴 UN EFFET INTROUVABLE SE TAISAIT. Le compteur n'était lisible qu'en
    //    appelant `PokeAnimAttaque.inconnus()` à la main — donc jamais. Le
    //    pendant de ce cas dans `ui-combat` (`NON_DITS`) fait, lui, un
    //    `console.warn` : deux compteurs de la même faute, un seul qui rougit.
    //    ⚠️ UNE FOIS PAR CLÉ, pas une fois par image : une animation joue ses
    //       pas soixante fois par seconde, et un avertissement en boucle noie
    //       la console au lieu de la servir.
    if (!e) {
      var cleInc = nom || pas.e;
      if (!inconnus[cleInc] && W.console && W.console.warn) {
        W.console.warn("[poke] effet d'animation inconnu : " + cleInc);
      }
      inconnus[cleInc] = (inconnus[cleInc] || 0) + 1;
      return;
    }

    // Une respiration : rien à dessiner, mais le rythme du ROM en dépend.
    if (e.pause) { await dodo(e.pause * vitesse); return; }

    // Un effet de sprite : il touche la créature, donc le camp.
    if (e.sprite !== undefined) {
      var img = spriteDe(scene, cote, e.adverse);
      if (!img) { await dodo(e.duree * vitesse); return; }
      // `sprite: null` remet la créature en place : on retire tout.
      if (!e.sprite) {
        for (var k = 0; k < CLASSES_SPRITE.length; k++) img.classList.remove(CLASSES_SPRITE[k]);
        await dodo(e.duree * vitesse);
        return;
      }
      img.classList.add(e.sprite);
      await dodo(e.duree * vitesse);
      if (!e.tient) img.classList.remove(e.sprite);
      return;
    }

    scene.classList.add(e.classe);
    await dodo(e.duree * vitesse);
    scene.classList.remove(e.classe);
  }

  // ── L'animation d'une attaque ───────────────────────────────────────────────
  //  `cote` est le camp qui FRAPPE. Le ROM écrit ses coordonnées du point de vue
  //  du joueur ; quand l'adversaire attaque, le Game Boy retourne la scène d'un
  //  demi-tour. On fait pareil, d'un seul bloc.
  async function jouer(scene, idAttaque, cote, options) {
    var anim = A();
    if (!anim) return 0;
    var pas = anim.attaques[idAttaque];
    if (!pas || !pas.length) return 0;
    var o = options || {};
    var vitesse = o.vitesse == null ? 1 : o.vitesse;
    if (vitesse <= 0) return 0;

    var couche = creerCouche(scene);
    ajuster(scene, couche);
    // 🔴 LA TEINTE VIENT DU TYPE DE L'ATTAQUE, et c'est doublement justifié.
    //    D'abord parce que le Game Boy d'origine était monochrome mais que la
    //    Super Game Boy et la Game Boy Color coloraient ces mêmes tuiles par
    //    type — le gris n'est pas plus « canon » que la couleur, il est
    //    seulement la limite d'une machine de 1989. Ensuite parce que la loi du
    //    mode l'exige : toute couleur à l'écran nomme un type. Ici elle nomme
    //    celui de l'attaque, que le journal vient d'annoncer par son nom.
    //    Les tuiles sont en niveaux de gris : `screen` remplace leur noir par
    //    la teinte et laisse leur blanc blanc, puis `multiply` efface ce blanc
    //    sur la scène. Aucun détourage, aucune créature teintée.
    W.PokeType.poser(couche, o.type);
    //  Plus de demi-tour de couche : les transformations du ROM se calculent
    //  tuile par tuile dans `poserImage`, par tour et par mode (12/08).
    couche.classList.add("est-visible");
    var debut = W.performance ? W.performance.now() : 0;
    try {
      for (var i = 0; i < pas.length; i++) {
        if (pas[i].e !== undefined) await jouerEffet(scene, pas[i], vitesse, cote);
        else await jouerSous(couche, pas[i], vitesse, cote);
      }
    } finally {
      couche.innerHTML = "";
      couche.classList.remove("est-visible");
      // 🔴 TOUTE CLASSE DE SPRITE SE RETIRE ICI, quoi qu'il arrive. Une
      //    animation interrompue — onglet caché, joueur qui clique vite —
      //    laisserait sinon une créature hors cadre ou effacée pour de bon.
      nettoyerSprites(scene);
    }
    return W.performance ? W.performance.now() - debut : 0;
  }

  // Combien de temps une attaque va durer, SANS la jouer. L'écran de combat en
  // a besoin pour caler son temps de lecture : une phrase qui disparaît avant
  // la fin de l'animation, ou une animation qui déborde sur la suivante, se
  // lisent toutes deux comme un défaut.
  function duree(idAttaque, vitesse) {
    var anim = A();
    if (!anim) return 0;
    var pas = anim.attaques[idAttaque];
    if (!pas || !pas.length) return 0;
    var v = vitesse == null ? 1 : vitesse;
    var total = 0;
    for (var i = 0; i < pas.length; i++) {
      if (pas[i].e !== undefined) {
        // 🔴 LES RESPIRATIONS COMPTENT AUSSI. Un effet qui ne dessine rien
        //    prend quand même du temps à l'exécution : l'oublier ici ferait
        //    revenir la désynchronisation entre le texte et l'image, corrigée
        //    une première fois le 07/08 et signalée par le propriétaire.
        var e = EFFETS[anim.effets[pas[i].e]];
        total += e ? (e.duree || e.pause || 0) : 0;
      } else {
        var s = anim.sous[pas[i].s];
        if (s) total += s.i.length * Math.max(1, pas[i].d) * IMAGE;
      }
    }
    return total * v;
  }

  function animee(idAttaque) {
    var anim = A();
    return !!(anim && anim.attaques[idAttaque] && anim.attaques[idAttaque].length);
  }

  W.PokeAnimAttaque = {
    jouer: jouer, duree: duree, animee: animee,
    inconnus: function () { return inconnus; },
    LARGEUR: LARGEUR, HAUTEUR: HAUTEUR,
  };
})(window, document);
