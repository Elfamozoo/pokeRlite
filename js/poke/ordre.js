(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ORDRE DE CHARGEMENT — LA SOURCE UNIQUE
  //
  //  🔴 IL EXISTAIT EN QUATRE COPIES : la page, le verrou, le harnais de
  //     simulation et le serveur. Quatre listes à tenir d'accord à la main,
  //     c'est une divergence qui finit par arriver — et une divergence d'ordre
  //     entre le client et le serveur, c'est un `score_mismatch` chez un joueur
  //     honnête. Les modes ninja et Dragon Ball en refusent environ un quart.
  //
  //  Désormais il est écrit ICI, et nulle part ailleurs :
  //   · `js/poke/gate.js` charge ce fichier en premier, puis lit la liste ;
  //   · `tools/poke-sim.mjs` la lit depuis le disque ;
  //   · `api/server.mjs` la lit pour monter le moteur de rejeu.
  //
  //  Le monde AVANT le moteur, le moteur AVANT l'interface. Charger un corpus
  //  avant les données qui le déclarent l'efface sans un mot.
  // ═══════════════════════════════════════════════════════════════════════════

  // Le NOYAU : tout ce que le serveur rejoue. Aucun texte, aucun DOM.
  var NOYAU = [
    "js/poke/rng.js",
    "js/poke/genre.js",
    "js/poke/types.js",
    "js/poke/regles.js",
    "js/poke/attaques.js",
    "js/poke/especes.js",
    "js/poke/monde.js",
    "js/poke/dresseurs.js",
    "js/poke/classes.js",
    // Les autres façons d'obtenir un Pokémon : échanges, Casino, fossiles,
    // cadeaux, pierres. La donnée d'abord, la mécanique ensuite.
    "js/poke/obtentions.js",
    "js/poke/ct.js",
    "js/poke/moteur.js",
    "js/poke/combat.js",
    "js/poke/capture.js",
    "js/poke/voyage.js",
    "js/poke/actes.js",
    "js/poke/carte-actes.js",
    // L'éclat lit les valeurs déterminantes que `moteur.js` tire déjà. Il vit
    // dans le NOYAU parce qu'il est de la DONNÉE de partie, pas de l'affichage :
    // le serveur doit pouvoir dire d'une créature scellée si elle est
    // chromatique, sinon la vitrine et le classement se croiraient sur parole.
    "js/poke/eclat.js",
    // 🔴 [17/08] LA FUSION DE DEUX PROGRESSIONS EST DANS LE NOYAU, ET ELLE LE
    //    DOIT. Le client l'emploie pour fondre sa collection avec celle du
    //    nuage, le SERVEUR pour fondre ce qui arrive avec ce qu'il garde — les
    //    deux unissent, personne ne remplace, et c'est ce qui rend l'ordre des
    //    écritures sans importance. Deux copies de cette règle EFFACERAIENT DES
    //    POKÉDEX le jour où elles divergeraient. Fichier pur : ni DOM, ni
    //    stockage, ni réseau.
    "js/poke/fusion.js",
    "js/poke/partie.js",
    // Le vivier de départ lit la progression du COMPTE : il vient donc après
    // la partie, et l'écran de création s'en sert pour ouvrir ses cases.
    "js/poke/depart.js",
    "js/poke/obtenir.js",
    // Le butin : trois cartes après chaque nœud. C'est le moteur de choix du
    // mode, donc il vit dans le NOYAU — le serveur doit pouvoir le rejouer.
    "js/poke/butin.js",
    // 🔴 LES SERMENTS SONT DANS LE NOYAU, ET IL LE FAUT. Ils modifient les
    //    dégâts, la capture et l'expérience : un rejeu serveur qui ne les
    //    lirait pas recalculerait un voyage différent de celui qui a été joué.
    //    Le fichier ne contient que de la donnée et une composition d'effets —
    //    aucun écran, aucun texte d'interface.
    // 🔴 LA RÈGLE DU JOUR VIENT AVANT LES SERMENTS : c'est `PokeSerments.effet`
    //    qui la fond dans le composé, et elle doit donc exister quand il tourne.
    //    Elle est dans le NOYAU pour la même raison qu'eux — elle change les
    //    dégâts, la capture et l'expérience, et le serveur rejoue le voyage.
    "js/poke/regle-du-jour.js",
    // 🔴 LES ACQUIS AVANT LES SERMENTS, pour la même raison que la règle du
    //    jour : c'est `PokeSerments.effet` qui les fond dans le composé, et ils
    //    doivent exister quand il tourne. Dans le NOYAU, parce qu'un acquis
    //    change les dégâts, la capture, l'argent et l'expérience — un rejeu
    //    serveur qui les ignorerait recalculerait un tout autre voyage.
    "js/poke/acquis.js",
    "js/poke/serments.js",
    // 🔴 LES CHASSES LISENT LES SERMENTS (elles en ouvrent), donc elles
    //    viennent après. Elles sont dans le NOYAU parce qu'elles se jugent sur
    //    le BILAN d'une partie — de la donnée, pas de l'affichage.
    "js/poke/chasses.js",
    // 🔴 LES SCEAUX MODIFIENT L'EFFET COMPOSÉ DES SERMENTS — ils viennent donc
    //    après, et dans le NOYAU : un rejeu serveur qui ignorerait le palier de
    //    difficulté recalculerait un tout autre voyage.
    "js/poke/sceaux.js",
    "js/poke/scenario.js",
    "js/poke/duel.js",
    // 🔴 LE REJEU DU DÉFI EN DERNIER : il lit le barème de `partie.js`, les
    //    plafonds de `actes.js` et les équipes des arènes. Dans le NOYAU parce
    //    que c'est LUI que le serveur appelle pour vérifier un score — un
    //    classement dont la vérification vivrait dans l'interface se croirait
    //    sur parole.
    "js/poke/rejeu.js",
  ];

  // L'INTERFACE : jamais chargée par le serveur. Elle ne décide de rien, donc
  // elle ne peut pas faire diverger un rejeu.
  var ECRANS = [
    // Le tempo en premier : tout écran qui attend passe par lui, et une attente
    // de zéro doit rendre la main sans passer par un minuteur — voir tempo.js.
    "js/poke/tempo.js",
    "js/poke/icones.js",
    // Le son : les programmes du ROM d'abord, la puce qui les joue ensuite.
    // 🔴 Ils vivent dans les ÉCRANS : le serveur rejoue un combat sans jamais
    //    rien émettre, et un son ne décide de rien.
    "js/poke/sons.js",
    "js/poke/audio.js",
    // Les animations d'attaque : la donnée d'abord, le lecteur ensuite.
    // 🔴 Elles vivent dans les ÉCRANS, pas dans le noyau : le serveur rejoue un
    //    combat sans jamais dessiner, et une animation ne décide de rien.
    "js/poke/animations.js",
    "js/poke/anim-attaque.js",
    "js/poke/progression.js",
    // La phrase d'un objet, une fois pour toutes : la carte de butin, l'étal de
    // la boutique et l'infobulle du sac la lisent au même endroit. Elle vient
    // avant les écrans qui l'emploient.
    "js/poke/dits-objets.js",
    // Comment mon équipe se mesure à celle du Champion. Pure lecture des types
    // et des attaques : elle ne décide de rien, elle vient donc dans les écrans.
    "js/poke/mesure-arene.js",
    "js/poke/ui-combat.js",
    "js/poke/pokedex-ui.js",
    "js/poke/infobulles.js",
    "js/poke/carte-partage.js",
    "js/poke/classement.js",
    "js/poke/fin.js",
    "js/poke/ui.js",
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  JOHTO NE S'OUVRE QUE SUR LE BANC  [19/08/2026]
  //
  //  🔴 LA CONSIGNE A CHANGÉ DE CAMP, ET J'AVAIS PRIS LA MAUVAISE. « Pas
  //     dispo » voulait dire EN PRODUCTION — pas ici. Une seconde génération
  //     qu'on ne peut pas ouvrir sur son propre banc ne se teste pas, donc ne
  //     s'approuve pas, donc ne sort jamais : le verrou fermait la porte par
  //     laquelle il aurait fallu passer.
  //
  //  🔑 LA PORTE EST L'ADRESSE, ET C'EST CE QUI LA REND SÛRE. Elle ne dépend ni
  //     d'un drapeau qu'on oublie d'éteindre, ni d'un paramètre d'URL qu'un
  //     joueur devine : `roadtolegends.com` n'est pas `127.0.0.1`, et aucune
  //     manipulation côté joueur ne change le nom d'hôte qui sert la page.
  //     `tools/poke-gen2-close.mjs` monte ce fichier SOUS LES DEUX ADRESSES et
  //     exige les deux réponses — c'est un contrôle de comportement, pas un
  //     grep, et il tombe le jour où la condition se relâche.
  //
  //  ⚠️ LES DONNÉES DE 1999 PASSENT AVANT `regles.js`, et il n'y a pas le
  //     choix : le registre n'inscrit Johto que si les globales existent DÉJÀ
  //     quand il s'évalue. Chargées après, elles ne seraient lues par personne
  //     et la seconde génération serait présente et introuvable.
  //  ⚠️ HORS NAVIGATEUR — le serveur de rejeu, `tools/poke-sim.mjs` — il n'y a
  //     pas de `location` : la porte est fermée, et le noyau est exactement
  //     celui d'aujourd'hui.
  // ═══════════════════════════════════════════════════════════════════════════
  var GEN2 = [
    "js/poke/gen2/types.js",
    "js/poke/gen2/effets.js",
    "js/poke/gen2/effets-neufs.js",
    "js/poke/gen2/objets-tenus.js",
    "js/poke/gen2/obtentions.js",
    "js/poke/gen2/attaques.js",
    "js/poke/gen2/especes.js",
    "js/poke/gen2/dresseurs.js",
    "js/poke/gen2/rival.js",
    "js/poke/gen2/equipes.js",
    "js/poke/gen2/classes.js",
    "js/poke/gen2/monde.js",
    "js/poke/gen2/voyage.js",
    "js/poke/gen2/scenes.js",
    "js/poke/gen2/concours.js",
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE JOHTO AJOUTE AUX ÉCRANS, ET QUE LE SERVEUR NE DOIT PAS VOIR
  //
  //  🔴 DEUX LISTES, PARCE QUE DEUX RÔLES. `GEN2` entre dans le NOYAU : ce sont
  //     des données que le registre lit, et le serveur de rejeu les charge comme
  //     la production — c'est ce que `poke-meme-noyau-client-serveur.mjs` exige.
  //     Les sons et animations, eux, vivent dans les ÉCRANS pour la même raison
  //     que ceux de 1996 : **le serveur rejoue un combat sans jamais émettre ni
  //     dessiner**, et un son ou une animation ne décide de rien.
  //  ⚠️ Les glisser dans `GEN2` aurait fait charger 62 Ko de sons et 109 Ko de
  //     tuiles au serveur à chaque démarrage, et surtout : le noyau du serveur
  //     n'aurait plus été celui de la production.
  //  ⚠️ ET L'ORDRE COMPTE ICI AUSSI : le son et la donnée d'abord, le lecteur ensuite.
  // ═══════════════════════════════════════════════════════════════════════════
  var GEN2_ECRANS = [
    "js/poke/gen2/sons.js",
    "js/poke/gen2/sons-attaques.js",
    "js/poke/gen2/animations.js",
    "js/poke/gen2/anim-attaque.js",
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOENN — TROISIÈME GÉNÉRATION (RUBIS / SAPHIR / ÉMERAUDE)  [09/09/2026]
  // ═══════════════════════════════════════════════════════════════════════════
  var GEN3 = [
    "js/poke/gen3/types.js",
    "js/poke/gen3/effets.js",
    "js/poke/gen3/objets.js",
    "js/poke/gen3/ct.js",
    "js/poke/gen3/obtentions.js",
    "js/poke/gen3/attaques.js",
    "js/poke/gen3/especes.js",
    "js/poke/gen3/natures.js",
    "js/poke/gen3/talents.js",
    "js/poke/gen3/objets-tenus.js",
    "js/poke/gen3/dresseurs.js",
    "js/poke/gen3/classes.js",
    "js/poke/gen3/equipes.js",
    "js/poke/gen3/arenes.js",
    "js/poke/gen3/rival.js",
    "js/poke/gen3/monde.js",
    "js/poke/gen3/voyage.js",
  ];

  var GEN3_ECRANS = [
    "js/poke/gen3/sons.js",
  ];

  function surLeBanc() {
    try {
      var h = W.location && W.location.hostname;
      if (typeof h !== "string") return false;
      return h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]";
    } catch (e) {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉTAT DE JOHTO — UN SEUL MOT, LU DES DEUX CÔTÉS  [19/08/2026, nuit]
  //
  //    "ferme"  : personne ne le charge. Ni la page, ni le serveur de rejeu.
  //    "banc"   : le navigateur du banc SEUL. La production ne le charge pas,
  //               le serveur non plus — et c'est ce qui les garde d'accord.
  //    "ouvert" : tout le monde, y compris le serveur de rejeu.
  //
  //  🔴 LE JOUR DE L'OUVERTURE, ON CHANGE CE MOT ET RIEN D'AUTRE — et c'est
  //     tout l'objet de ce bloc. Le geste évident était d'ajouter
  //     `roadtolegends.com` à la liste des hôtes du banc. Il aurait ouvert
  //     Johto aux JOUEURS sans l'ouvrir au SERVEUR : hors navigateur il n'y a
  //     pas de `location`, donc le rejeu aurait tourné avec les règles de 1996
  //     sur un voyage de 1999, et **chaque score honnête serait revenu en
  //     `score_mismatch`**. Un piège qui ne se déclenche qu'à l'ouverture, sur
  //     le premier joueur, et qu'aucun contrôle d'aujourd'hui ne voit.
  //     La liste d'hôtes n'est donc plus une porte : elle ne sert QUE dans
  //     l'état « banc », où le serveur n'a rien à rejouer.
  //
  //  ✅ ET CHARGER JOHTO NE CHANGE RIEN À KANTO — mesuré, pas supposé : 200
  //     combats de 1996 rejoués avec et sans les données de 1999, 1 819 lignes
  //     d'événements identiques à la ligne près. C'est ce qui rend l'état
  //     « ouvert » sûr pour les joueurs qui ne mettront jamais les pieds à
  //     Johto.
  //  🧪 `tools/poke-meme-noyau-client-serveur.mjs` monte ce fichier dans les
  //     TROIS rôles — serveur, navigateur de production, navigateur du banc —
  //     et refuse tout état où le serveur et la production ne chargeraient pas
  //     le même noyau.
  // ═══════════════════════════════════════════════════════════════════════════
  var JOHTO = "ouvert";

  function johtoCharge() {
    if (JOHTO === "ouvert") return true;
    if (JOHTO !== "banc") return false;
    return surLeBanc();
  }

  W.POKE_ORDRE_GEN2 = GEN2;
  W.POKE_ORDRE_GEN2_ECRANS = GEN2_ECRANS;
  W.POKE_JOHTO_ETAT = JOHTO;
  W.POKE_BANC_JOHTO = johtoCharge();
  if (W.POKE_BANC_JOHTO) {
    var iReg = NOYAU.indexOf("js/poke/regles.js");
    NOYAU = NOYAU.slice(0, iReg).concat(GEN2, NOYAU.slice(iReg));
    //  Les animations de Johto se posent juste après celles de 1996 : le
    //  lecteur de 1999 n'a pas à exister avant que la donnée de 1996 soit là,
    //  et l'écran de combat choisit entre les deux au moment du coup.
    var iAnim = ECRANS.indexOf("js/poke/anim-attaque.js");
    ECRANS = ECRANS.slice(0, iAnim + 1).concat(GEN2_ECRANS, ECRANS.slice(iAnim + 1));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉTAT DE HOENN — UN SEUL MOT, LU DES DEUX CÔTÉS  [09/09/2026]
  // ═══════════════════════════════════════════════════════════════════════════
  var HOENN = "ouvert";

  function hoennCharge() {
    if (HOENN === "ouvert") return true;
    if (HOENN !== "banc") return false;
    return surLeBanc();
  }

  W.POKE_ORDRE_GEN3 = GEN3;
  W.POKE_ORDRE_GEN3_ECRANS = GEN3_ECRANS;
  W.POKE_HOENN_ETAT = HOENN;
  W.POKE_BANC_HOENN = hoennCharge();
  if (W.POKE_BANC_HOENN) {
    var iReg3 = NOYAU.indexOf("js/poke/regles.js");
    NOYAU = NOYAU.slice(0, iReg3).concat(GEN3, NOYAU.slice(iReg3));
    var iGen2Fin = GEN2_ECRANS.length > 0 ? ECRANS.indexOf(GEN2_ECRANS[GEN2_ECRANS.length - 1]) : -1;
    var iPos3 = iGen2Fin >= 0 ? iGen2Fin : ECRANS.indexOf("js/poke/anim-attaque.js");
    if (iPos3 >= 0) {
      ECRANS = ECRANS.slice(0, iPos3 + 1).concat(GEN3_ECRANS, ECRANS.slice(iPos3 + 1));
    } else {
      ECRANS = ECRANS.concat(GEN3_ECRANS);
    }
  }

  W.POKE_ORDRE_NOYAU = NOYAU;
  W.POKE_ORDRE_ECRANS = ECRANS;
  W.POKE_ORDRE = NOYAU.concat(ECRANS);

  // ═══════════════════════════════════════════════════════════════════════════
  //  DIRECTION « L'ENCRE » — INTERRUPTEUR  [18/08/2026]
  //
  //  Jumeau de celui de `game.js`. Il vit ICI parce que ce module est le seul
  //  que la page charge AVANT tout le reste et qui n'a pas de rôle de verrou :
  //  la classe doit être posée avant le premier rendu, sinon l'écran clignote
  //  de l'ancien monde au nouveau.
  //
  //  🟢 [19/08] ALLUMÉE POUR TOUT LE MONDE. `?encre=0` est le coupe-circuit :
  //     il rend l'ancien habillage à l'onglet, sans redéploiement.
  //  ⚠️ Toute règle de la direction est scopée `body.encre`. Une seule règle
  //     non scopée fuit chez tout le monde.
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    var q = new URLSearchParams(W.location.search).get("encre");
    if (q === "0") W.sessionStorage.setItem("rtl_encre", "0");
    if (q === "1") W.sessionStorage.removeItem("rtl_encre");
    if (W.sessionStorage.getItem("rtl_encre") !== "0" && W.document && W.document.body) {
      W.document.body.classList.add("encre");
    }
  } catch (e) {
    // Stockage refusé : on allume quand même. La refonte est l'habillage du
    // jeu depuis le 19/08 ; un navigateur qui refuse un stockage de session ne
    // doit pas renvoyer son joueur dans l'ancien monde.
    // ⚠️ `W.document &&` N'EST PAS UNE PRÉCAUTION D'ÉCRITURE : ce module est
    //    évalué HORS NAVIGATEUR par `tools/poke-design.mjs`, où `document`
    //    n'existe pas. Sans la garde, le rattrapage relançait l'erreur qu'il
    //    est censé absorber, et la batterie du mode tombait. Attrapé par elle.
    if (W.document && W.document.body) W.document.body.classList.add("encre");
  }
})(typeof window !== "undefined" ? window : globalThis);
