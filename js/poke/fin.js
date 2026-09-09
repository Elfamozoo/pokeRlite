(function (W, D) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA VITRINE DES MAÎTRES — L'ÉCRAN DE FIN
  //
  //  🔴 SANS ELLE, LA BOUCLE N'A PAS DE FIN, et c'est ce que le propriétaire a
  //     vu tout de suite : « je vois plus trop le roguelite carrière ». Une
  //     partie qui ne se referme pas n'est pas une partie, c'est une promenade.
  //
  //  C'est le Hall of Fame du jeu : les six Pokémon enregistrés, les badges, le
  //  Pokédex, le temps. Elle sert AUSSI de carte de partage et de fiche de
  //  classement — 🔴 UNE SEULE SOURCE pour les trois. Le mode ninja a laissé le
  //  bandeau et l'écran de fin diverger parce qu'ils lisaient deux calculs :
  //  le joueur voyait son Rinnegan toute la partie, et la fin ne le nommait pas.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var LANG = function () { return W.POKE_LANG || "fr"; };

  var TXT = {
    // 🔴 « LA VITRINE DES MAÎTRES » S'AFFICHAIT SUR UNE DÉFAITE. Vu à l'écran
    //    le 11/08, la première fois qu'une porte de mesure a permis d'ouvrir
    //    l'écran de fin sur autre chose qu'une victoire : un joueur qui vient
    //    de perdre toute son équipe lisait le titre du Panthéon, puis la
    //    phrase « Tu n'as plus aucun Pokémon » juste en dessous. Le titre et
    //    le texte se contredisaient sur l'écran qui décide de la relance —
    //    c'est-à-dire à l'instant exact du ragequit.
    //  ⚠️ Les trois défaites ne se valent pas et n'ont pas le même mot : on
    //     TOMBE quand l'équipe est à terre, on S'ARRÊTE quand l'acte est
    //     épuisé, on RENTRE quand on a choisi de partir. Un titre unique pour
    //     les trois redirait ce que la phrase dit déjà.
    vitrine: { fr: "LA VITRINE DES MAÎTRES", en: "HALL OF FAME" },
    titreEquipe: { fr: "LE VOYAGE S'ACHÈVE", en: "THE JOURNEY ENDS" },
    titreEpuise: { fr: "LA ROUTE S'ARRÊTE ICI", en: "THE ROAD STOPS HERE" },
    titreAbandon: { fr: "TU RENTRES", en: "YOU HEAD HOME" },
    finVitrine: { fr: "Tu as battu la Ligue. Ton équipe entre dans la Vitrine.", en: "You beat the League. Your team enters the Hall of Fame." },
    // 🔴 `finJours` A ÉTÉ SUPPRIMÉE — « Le voyage s'arrête ici. Le temps a
    //    manqué. » Elle décrivait le BUDGET DE JOURS, un système que la refonte
    //    du 07/08 a retiré du mode : plus aucun voyage ne s'arrête faute de
    //    temps. Et elle servait de REPLI à toute fin inconnue : le jour où une
    //    fin neuve serait ajoutée sans sa phrase, l'écran aurait expliqué au
    //    joueur qu'il a épuisé des jours qui n'existent plus.
    //    Le repli dit maintenant la seule chose vraie dans tous les cas, et
    //    `poke-fins.mjs` refuse qu'une fin du moteur n'ait pas sa phrase.
    finInconnue: { fr: "Le voyage s'arrête ici.", en: "The journey ends here." },
    finEquipe: { fr: "Tu n'as plus aucun Pokémon. Le voyage s'arrête.", en: "You have no Pokémon left. The journey ends." },
    // 🔴 DEUX FINS NEUVES, ET ELLES DOIVENT SE DIRE. Un voyage qui se termine
    //    sous « Le temps a manqué » alors qu'on vient d'échouer trois fois
    //    devant un Champion raconte n'importe quoi — et le mode n'a plus de
    //    compteur de jours depuis la refonte de la carte.
    // 🔴 CE TEXTE MENTAIT DEPUIS QUE LA RÈGLE A CHANGÉ. Le compteur de trois
    //    essais couvre tout l'acte maintenant, pas seulement les Champions —
    //    et cet écran continuait d'annoncer « devant le même Champion » à qui
    //    venait de tomber trois fois contre des dresseurs de route. Vu en jeu,
    //    sur une partie morte à l'acte 1. Un message qui nomme mal ce qu'il
    //    compte apprend une fausse règle au joueur.
    // 🔴 IL DISAIT « TROIS » ALORS QUE `ESSAIS_BOSS` EN VAUT DEUX. Le jumeau
    //    `koEpuise` de `ui.js` recevait déjà le compte, celui-ci était resté
    //    écrit à la plume — et c'est le DERNIER écran d'un voyage perdu, celui
    //    qui enseigne son budget au voyage suivant.
    finEpuise: { fr: "{n} K.O. dans le même acte. Le voyage s'arrête.",
                 en: "{n} blackouts in the same act. The journey ends." },
    // ⚠️ L'INCISE CONTRASTIVE RETIRÉE (relecture d'écriture du 14/08) : « Ta
    //    collection, ELLE, reste » — le pronom de reprise entre deux virgules
    //    est une signature d'auteur automatique. Les deux phrases portent déjà
    //    l'opposition ; le pronom ne fait que la souligner.
    finAbandon: { fr: "Tu as choisi d'arrêter. Ta collection reste.",
                  en: "You chose to stop. Your collection stays." },
    equipe: { fr: "TON ÉQUIPE", en: "YOUR TEAM" },
    badges: { fr: "BADGES", en: "BADGES" },
    pokedex: { fr: "POKÉDEX", en: "POKÉDEX" },
    temps: { fr: "PARCOURS", en: "RUN" },
    score: { fr: "SCORE", en: "SCORE" },
    legendaires: { fr: "LÉGENDAIRES", en: "LEGENDARIES" },
    perdus: { fr: "PERDUS POUR TOUJOURS", en: "LOST FOREVER" },
    jours: { fr: "{a} {a|acte|actes} sur {t} · {n} {n|nœud pris|nœuds pris}, {p} {p|branche laissée|branches laissées}",
             en: "{a} {a|act|acts} of {t} · {n} {n|node|nodes} taken, {p} {p|branch|branches} left behind" },
    surAtteignables: { fr: "{p} {p|attrapé|attrapés} sur {a} atteignables en version {v}",
                       en: "{p} caught of {a} obtainable in {v}" },
    surCompte: { fr: "Ton compte : {p} sur {n}.", en: "Your account: {p} of {n}." },
    //  🔴 LA RÉCOMPENSE DU GRIND SE DIT EN DELTA, PAS EN TOTAL (mandat courbe
    //     de progression, 12/08). « 87 sur 151 » dit où l'on en est ; « ce
    //     voyage en a ajouté 4 » dit ce que l'heure qu'on vient de jouer a
    //     RAPPORTÉ — c'est la phrase qui paie la défaite. Zéro neuve : on se
    //     tait, une ligne à zéro gronderait au pire moment.
    //  🔴 « Ce voyage en a ajouté 4 neuves » — verdict du propriétaire : « ça
    //     veut rien dire ». Il a raison : le sujet (les espèces) était resté
    //     deux phrases plus haut, « neuves » flottait. On NOMME le sujet.
    surCompteNeuves: {
      fr: "{n} {n|espèce|espèces} de ce voyage y {n|entre|entrent} pour la première fois.",
      en: "{n} species from this journey {n|is|are} new to it.",
    },
    // ── CE QUE LE VOYAGE A OUVERT ─────────────────────────────────────────
    //  🔴 L'ÉCRAN DE FIN NE REGARDAIT QUE DERRIÈRE. Il disait ce qu'on avait
    //     fait, jamais ce qui avait CHANGÉ pour la prochaine fois — alors que
    //     le mode déverrouille des départs depuis le début : toute première
    //     forme capturée s'ouvre comme starter. Le joueur ne l'apprenait qu'en
    //     rouvrant l'écran de départ, s'il y pensait.
    //     Un déblocage qui ne s'annonce pas ne récompense rien.
    // ── ET CE QUE LE VOYAGE A SCELLÉ ──────────────────────────────────────
    //  🔴 L'ÉQUIPE SE SCELLE POUR LE DUEL À CHAQUE BADGE, ET RIEN NE LE DISAIT.
    //     Le joueur finissait son voyage, refermait l'onglet, et ne savait pas
    //     qu'il venait de se constituer une équipe de PvP — ni qu'un écran de
    //     duel l'attendait sur l'accueil. C'est la faute n°1 du projet, à
    //     l'échelle d'un mode entier : une mécanique livrée sans sa porte
    //     d'entrée n'existe pas pour le joueur.
    //     Et c'est ICI qu'il faut le dire : c'est le seul instant où il regarde
    //     l'équipe qu'il vient de construire.
    scelle: { fr: "TON ÉQUIPE DE DUEL", en: "YOUR DUEL TEAM" },
    //  🔴 « Scellée » percutait le système des SCEAUX — un mot, deux mécaniques
    //     (balayage « phrases de notaire » du 12/08). On dit l'usage, pas l'état.
    scelleDit: {
      fr: "C'est elle qui te défendra en duel. Donne ton code à un autre dresseur : il pourra te défier.",
      en: "This is the team that defends you in duels. Give your code to another trainer and they can challenge you.",
    },
    // 🔴 ET QUAND CE VOYAGE N'A RIEN REMPLACÉ, ON LE DIT. On garde l'équipe la
    //    plus avancée, pas la dernière — sinon un voyage abandonné effacerait
    //    celle de huit badges. Le joueur doit savoir laquelle il présente.
    scelleGarde: {
      fr: "Ton équipe de duel reste celle de ton meilleur voyage : {n} {n|badge|badges}.",
      en: "Your duel team stays the one from your best run: {n} {n|badge|badges}.",
    },
    scelleAller: { fr: "LE DUEL", en: "THE DUEL" },
    // 🔴 UNE MONTÉE DE RANG SE DISAIT NULLE PART. Le compte changeait de palier
    //    à la clôture du voyage, et le joueur ne l'apprenait qu'en revenant sur
    //    l'accueil — s'il regardait la bonne ligne. C'est le moment le plus rare
    //    du mode, et il passait sous silence.
    rangNeuf: { fr: "NOUVEAU RANG", en: "NEW RANK" },
    copierResume: { fr: "COPIER LE RÉSUMÉ", en: "COPY THE SUMMARY" },
    // 🔴 DEUX FORMATS, PARCE QU'IL Y A DEUX ENDROITS OÙ L'ON PARTAGE. Le
    //    paysage passe sur X et Discord ; posé dans une story ou sur TikTok, il
    //    tient un bandeau au milieu d'un écran noir. Le 9:16 est le seul format
    //    que ces réseaux-là affichent en plein.
    fmtLarge: { fr: "X · DISCORD", en: "X · DISCORD" },
    fmtHaut: { fr: "TIKTOK · STORIES", en: "TIKTOK · STORIES" },
    resumeCopie: { fr: "Résumé copié. Colle-le où tu veux.", en: "Summary copied. Paste it anywhere." },
    ouvert: { fr: "CE VOYAGE A OUVERT", en: "THIS RUN UNLOCKED" },
    // 🔴 « DÉPART » ET « PREMIÈRE FORME » SONT DES MOTS DE NOTRE CODE. Le
    //    propriétaire a refusé leur jumeau à l'écran de départ le 08/08 :
    //    « cette phrase veut rien dire ». Ici on dit la chose : avec quoi on
    //    pourra commencer le prochain voyage.
    ouvertDit: { fr: "{n} {n|Pokémon|Pokémon} de plus avec {n|qui|qui} commencer tes prochains voyages.",
                 en: "{n} more {n|Pokémon|Pokémon} to start your next runs with." },
    ouvertRien: { fr: "Rien de neuf pour commencer. Attrape un Pokémon qui n'a pas encore évolué : il rejoindra la liste.",
                  en: "Nothing new to start with. Catch a Pokémon that has not evolved yet: it will join the list." },
    //  🔴 Même classe que l'écran de départ (v557) : « {o} sur {t} » avec un
    //     dénominateur muet. Ici la règle est déjà connue (l'écran du départ
    //     la dit) — on nomme juste ce que {t} compte.
    ouvertCompte: { fr: "Espèces capables d'ouvrir un voyage : {o} sur {t}.",
                    en: "Species that can open a journey: {o} of {t}." },
    aucun: { fr: "aucun", en: "none" },
    // Le mot du ROM, pas une invention : « fainted » est ce que le jeu de 1996
    // écrit, et le mode suit sa source partout où elle a parlé.
    aTerre: { fr: "à terre", en: "fainted" },
    // 🔴 « CE QUI EST À PORTÉE » et pas « objectifs ». Le mot doit dire que
    //    c'est atteignable au prochain voyage, sinon c'est une liste de
    //    reproches sur un écran de défaite.
    prochaineChasse: { fr: "À PORTÉE", en: "WITHIN REACH" },
    // 🔴 « À PORTÉE » DIT CE QUI RESTE À FAIRE, ET RIEN NE DISAIT CE QU'ON
    //    VENAIT DE DÉCROCHER. Un QA l'a relevé sur un voyage qui accomplissait
    //    CINQ chasses : l'écran de fin n'en montrait aucune. Elles passaient
    //    dans un écran-message transitoire — « CHASSE ACCOMPLIE » — qu'on
    //    chasse d'un clic et qui ne revient jamais. Or c'est le gain PERMANENT
    //    du voyage : le pool de serments passe de dix-sept à vingt-sept.
    //    Un écran de bilan qui ne dit que le manque ne donne pas envie de
    //    relancer, il donne l'impression de n'avoir rien fait.
    decroche: { fr: "CE VOYAGE A DÉCROCHÉ", en: "THIS RUN UNLOCKED" },
    // ── CE QU'ON EMPORTE ────────────────────────────────────────────────────
    //  Les mots disent l'ENJEU, pas le mécanisme : « le prochain commence avec »
    //  se comprend sans rien apprendre. « Acquis persistant » n'aurait rien dit.
    emportTitre: { fr: "CE QUE TU EMPORTES", en: "WHAT YOU TAKE WITH YOU" },
    emportDit: { fr: "Le prochain voyage commence avec. Tu peux en garder {n}.",
                 en: "Your next run starts with it. You can keep {n}." },
    emportPlein: { fr: "Tu en portes déjà {n}. Rends-en un pour en prendre un autre.",
                   en: "You already carry {n}. Give one back to take another." },
    emportRien: { fr: "Ce voyage n'a rien appris à emporter.",
                  en: "This run learned nothing to carry." },
    // 🔴 LE CAS QUI MANQUAIT : on porte déjà son maximum ET ce voyage n'a rien
    //    de neuf. L'écran affichait « Rends-en un pour en prendre un autre »
    //    avec une liste vide en face — et RENDRE était définitif, sans
    //    remplaçant possible.
    emportRienDeNeuf: { fr: "Tu gardes ce que tu portes : ce voyage n'a rien de neuf à emporter.",
                        en: "You keep what you carry: this run has nothing new to take." },
    emportPrendre: { fr: "EMPORTER", en: "TAKE IT" },
    emportRendre: { fr: "RENDRE", en: "GIVE BACK" },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE SCEAU QUI S'OUVRE, ET CELUI QU'ON PROMET
    //
    //  🔴 `sceauMax` MONTAIT EN SILENCE. La seule récompense PERMANENTE de la
    //     victoire — celle qui donne au mode ses huit crans de rejeu — arrivait
    //     sans un mot, et le palier neuf n'apparaissait qu'au prochain écran de
    //     départ, pour qui pensait à regarder.
    //  🔴 ET AVANT LA PREMIÈRE VICTOIRE, RIEN N'EN PARLAIT DU TOUT. L'écran de
    //     départ se tait tant que le premier sceau n'est pas gagné, et c'est la
    //     bonne décision — huit portes fermées ne donnent envie de rien. Mais
    //     du coup PERSONNE n'apprenait que gagner ouvre quelque chose : le plus
    //     gros objectif du mode n'avait aucune promesse. Une seule phrase, ici,
    //     à l'endroit exact où l'on décide de relancer.
    //  ⚠️ Elle ne paraît qu'au voyage LIBRE : le Défi du jour se joue au sceau
    //     zéro pour tout le monde, y promettre un palier serait un mensonge.
    // ═══════════════════════════════════════════════════════════════════════
    sceauOuvert: { fr: "SCEAU OUVERT", en: "SEAL UNLOCKED" },
    // ⚠️ Le jeton s'appelle `quoi`, pas `dit` : `poke-genre` tient une liste
    //    close des jetons connus, et un jeton inventé s'afficherait tel quel à
    //    l'écran. Il l'a refusé dans la seconde — c'est exactement son rôle.
    // ⚠️ ET LE NOM NE SE RÉPÈTE PAS. Vu à l'écran : « Sceau de la Roche · 1/8 ·
    //    Sceau de la Roche t'attend au prochain départ. » Le bloc porte déjà le
    //    nom en titre — c'est la faute exacte déjà corrigée sur `scoreSceau`,
    //    et elle est revenue parce que j'ai recopié la forme sans relire le
    //    rendu. Le pronom suffit.
    sceauOuvertDit: { fr: "Il t'attend au prochain départ. {quoi}",
                      en: "It awaits at your next start. {quoi}" },
    // 🔴 UNE PROMESSE SANS DISTANCE EST UNE RUMEUR. C'est la règle que ce
    //    fichier applique déjà au diplôme (« il dit toujours CE QU'IL RESTE »)
    //    et que la promesse du sceau enfreignait : « franchis la Ligue » ne dit
    //    pas si l'on en est à un badge ou à sept. Le meilleur voyage du compte
    //    donne la distance, et il est déjà là.
    // 🔴 « 44 contre 43 » se juge ; « tu avais un niveau de retard » décide à
    //    la place du joueur, et l'écart n'est pas le seul facteur.
    finMur: {
      fr: "Le prochain était {champion}. Ta tête d'équipe : {a}. La sienne : {b}.",
      en: "{champion} was next. Your lead: {a}. Theirs: {b}.",
    },
    palierAcquis: {
      fr: "Encore {n} {n|espèce|espèces} à capturer, et « {nom} » entre dans tes voyages.",
      en: "Catch {n} more {n|species|species}, and \"{nom}\" joins your runs.",
    },
    // 🔴 LA PROMESSE DISAIT « FRANCHIS LA LIGUE », ET C'EST DEVENU FAUX le
    //    14/08 : les huit badges suffisent désormais à monter d'un cran. Une
    //    promesse qui ne dit plus la vraie condition envoie le joueur au mauvais
    //    endroit — et c'est la condition la plus dure du mode qu'elle nommait.
    sceauPromesse: { fr: "Décroche les huit badges et le premier des huit Sceaux de Kanto s'ouvre.",
                     en: "Take all eight badges and the first of Kanto's eight Seals opens." },
    sceauPromesseLoin: { fr: "Ton meilleur voyage s'est arrêté à {n} {n|badge|badges} sur 8.",
                         en: "Your best run stopped at {n} of 8 badges." },
    sceauPromesseJamais: { fr: "Aucun badge encore. Le premier ouvre la route.",
                           en: "No badge yet. The first one opens the road." },
    sceauPalier: { fr: "Sceau {n} sur {t} franchi. Le suivant s'ouvre en refaisant les huit badges à ce palier.",
                   en: "Seal {n} of {t} cleared. The next opens by taking eight badges again at this tier." },
    // Le sceau explique le score : le palier, son nom, et ce qu'il a valu.
    // ⚠️ « Sceau 3 — Sceau de la Foudre » doublait le mot : les noms de sceaux
    //    commencent tous par « Sceau ». Le numéro se lit déjà dans le bandeau
    //    pendant tout le voyage ; ici c'est le NOM et ce qu'il a rapporté qui
    //    comptent. Vu à l'écran, corrigé à l'écran.
    scoreSceau: {
      fr: "{nom} : le voyage a compté {pc} % de plus.",
      en: "{nom}: the run counted {pc} % more.",
    },
    carnetOuvre: { fr: "Ouvre :", en: "Unlocks:" },
    // 🔴 VOIX SHŌNEN aux écrans de fin — règle du projet. On parle AU joueur,
    //    au présent, avec l'enjeu à vif. Les images standard du genre sont
    //    admises ICI, et seulement ici.
    motChampion: {
      fr: "Tu as traversé Kanto. Ton nom entre dans la Vitrine.",
      en: "You crossed Kanto. Your name enters the Hall.",
    },
    motProche: {
      fr: "Tu y étais presque. La Ligue t'attend encore.",
      frF: "Tu y étais presque. La Ligue t'attend encore.",
      en: "You were close. The League still waits for you.",
    },
    // 🔴 « LE VOYAGE » REVENAIT DEUX FOIS EN DEUX PHRASES, parce que ce mot
    //    suit la ligne qui dit déjà pourquoi le voyage s'arrête. On parle
    //    donc de ce qui RESTE, pas de ce qui vient de finir.
    // 🔴 « CENT CINQUANTE » ÉTAIT ÉCRIT EN TOUTES LETTRES, ET FAUX DÈS LA
    //    DEUXIÈME PARTIE. `motDebut` sort pour TOUT voyage sous cinq badges —
    //    y compris celui d'un joueur qui a déjà cent quarante espèces au
    //    compte. Il lisait alors « il reste cent cinquante espèces à croiser »
    //    en refermant sa collection presque pleine.
    //    *Un compteur qui ment est pire qu'un compteur absent* : celui-ci
    //    disait au joueur que rien de ce qu'il a fait ne compte.
    //    Le chiffre vient maintenant du COMPTE, par la même porte que la ligne
    //    « Ton compte : {p} sur 151 » deux blocs plus bas.
    motDebut: {
      fr: "Il reste {n} {n|espèce|espèces} à croiser. Repars.",
      en: "{n} {n|species is|species are} still out there. Go again.",
    },
    // Et quand il n'en reste plus aucune, on ne dit pas « il reste 0 ».
    motDebutComplet: {
      fr: "Tu les as toutes croisées. Il reste à les garder.",
      en: "You have seen them all. Keeping them is another matter.",
    },
    // 🔴 Un score se compare à une contrainte : « 1 480 » ne dit rien.
    finRegle: { fr: "Règle du jour tenue : {nom}.", en: "Today's rule held: {nom}." },
    rejouer: { fr: "REPARTIR", en: "PLAY AGAIN" },
    carte: { fr: "TA CARTE", en: "YOUR CARD" },
    telecharger: { fr: "ENREGISTRER L'IMAGE", en: "SAVE IMAGE" },
  };

  // 🔴 UNE TABLE, PAS UNE CASCADE DE TERNAIRES. Une fin neuve tombait sinon
  //    dans le cas par défaut et le jeu disait « le temps a manqué » — alors
  //    qu'il n'y a plus de compteur de jours depuis la refonte de la carte, et
  //    qu'on venait d'échouer trois fois devant un Champion.
  var FINS = {
    vitrine: "finVitrine",
    equipe: "finEquipe",
    epuise: "finEpuise",
    abandon: "finAbandon",
  };
  function T(cle, vars, genre) {
    return W.PokeGenre.texte(TXT[cle], LANG(), genre || "h", vars, "fin:" + cle);
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Le mot de la fin dépend de ce qui a été fait, pas d'un tirage. Trois
  // paliers, et chacun dit quelque chose de vrai sur la partie.
  function motDeFin(b) {
    if (b.ligue) return "motChampion";
    if (b.badges >= 5) return "motProche";
    return "motDebut";
  }

  //  Ce qui reste à CROISER sur le compte — pas sur le voyage. Une seule
  //  source, `comptePokedex()`, celle qui écrit déjà « Ton compte : {p} sur
  //  151 » : deux calculs finiraient par ne plus dire la même chose.
  //  ⚠️ « croiser » parle des espèces VUES, pas des prises : c'est la même
  //     promesse que le Pokédex fait au joueur depuis le premier écran.
  function resteACroiser() {
    if (!W.PokeProgression || !W.PokeProgression.comptePokedex) return null;
    var c = W.PokeProgression.comptePokedex();
    return Math.max(0, (c.total || 151) - (c.vus || 0));
  }

  // `surDuel` est optionnel : sans lui, l'écran ne promet rien qu'il ne puisse
  // tenir. 🔴 ET ON VÉRIFIE QUE L'ÉQUIPE EXISTE VRAIMENT avant d'en parler —
  // un tout premier voyage arrêté sans un badge n'en a scellé aucune.
  // `neuf` dit si c'est CE voyage qui vient de la sceller : voir `scelleGarde`.
  function afficher(hote, partie, surRejouer, surDuel, neuf, rangMonte) {
    var b = W.PokePartie.bilan(partie);
    var g = partie.genre;
    var duel = (surDuel && W.PokeProgression && W.PokeProgression.equipeDuel()) || null;

    // 🔴 SIX CRÉATURES EN PLEINE FORME SOUS « LE VOYAGE S'ARRÊTE ». Hors
    //    Nuzlocke, la fin `epuise` laisse l'équipe entière à zéro PV : cette
    //    vitrine les montrait comme au premier jour, juste sous la phrase qui
    //    annonce la défaite. Le jeu savait, et il ne disait pas.
    //  ⚠️ `data-ko` ET LE MOT : c'est la grammaire déjà posée sur l'écran de
    //     réserve, et le mot compte autant que le gris — un joueur daltonien
    //     ou un sprite déjà terne ne laisseraient rien lire du filtre seul.
    var equipe = b.equipe.map(function (m) {
      var e = ESP()[m.n];
      return '<div class="pkdx-vitrine-mon"' + (m.ko ? ' data-ko="oui"' : "") + ">" +
        '<img alt="' + esc(e.nom[LANG()]) + '" src="' + W.PokeSprites.face(m.n, "?i=6") + '">' +
        "<b>" + esc(m.surnom || e.nom[LANG()]) + "</b>" +
        '<span class="pkdx-niveau est-pastille">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
        (m.ko ? '<span class="pkdx-vitrine-ko">' + T("aTerre", null, g) + "</span>" : "") +
      "</div>";
    }).join("") || "<p>" + T("aucun", null, g) + "</p>";

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCRAN DISAIT POURQUOI LE VOYAGE S'ARRÊTE, JAMAIS CONTRE QUI.
    //     « Tu n'as plus aucun Pokémon » nomme la cause immédiate ; il ne dit
    //     pas le MUR. Or c'est le seul fait qui change la partie suivante :
    //     savoir qu'on butait sur Morgane à 44 contre 43 dit quoi faire, et
    //     « le voyage s'arrête » ne dit rien du tout.
    //  ⚠️ On donne les DEUX niveaux, pas l'écart : « 44 contre 43 » se juge,
    //     « tu avais un niveau de retard » décide à la place du joueur — et
    //     l'écart n'est pas le seul facteur, les types comptent aussi.
    //  ⚠️ Rien après huit badges : le mur n'existe plus, et l'annoncer serait
    //     remplacer un manque par une erreur. Rien non plus sans équipe.
    // ═══════════════════════════════════════════════════════════════════════
    var mur = (function () {
      // 🔴 `b` EST LE BILAN, PAS LA PARTIE — et son `badges` est un NOMBRE.
      //    J'ai écrit `(b.badges || []).length` de mémoire : ça rend `undefined`,
      //    donc la recherche d'arène cherchait `ordre === NaN` et la ligne ne
      //    paraissait jamais. Aucune erreur, aucun symptôme : juste une phrase
      //    absente. *Une forme supposée au lieu d'être lue ne casse rien — elle
      //    fabrique un silence.*
      var pris = b.badges || 0;
      if (pris >= 8 || !b.equipe || !b.equipe.length) return "";
      var liste = ARENES() || [], a = null, i;
      for (i = 0; i < liste.length; i++) if (liste[i].ordre === pris + 1) a = liste[i];
      if (!a || !a.equipe || !a.equipe.length) return "";
      var tete = 0, lui = 0;
      for (i = 0; i < b.equipe.length; i++) tete = Math.max(tete, b.equipe[i].niveau || 0);
      for (i = 0; i < a.equipe.length; i++) lui = Math.max(lui, a.equipe[i].niveau || 0);
      if (!tete || !lui) return "";
      return '<p class="pkdx-dit pkdx-mur">' +
        esc(T("finMur", { champion: W.PokeGenre.nomChampion(a), a: tete, b: lui }, g)) + "</p>";
    })();

    var badges = partie.badges.map(function (x) {
      return '<span class="pkdx-badge" data-info="badge" data-info-val="' + x.ordre + '" tabindex="0">' +
        esc(W.PokeGenre.nomBadge(x)) + "</span>";
    }).join(" ") || T("aucun", null, g);

    var leg = b.legendaires.map(function (n) { return esc(ESP()[n].nom[LANG()]); }).join(", ");

    // ── CE QUE CE VOYAGE A OUVERT ─────────────────────────────────────────
    //  On compare le vivier de départ, photographié AVANT la première capture,
    //  à celui d'aujourd'hui. La différence est le gain du voyage — et c'est la
    //  seule ligne de cet écran qui parle de la partie SUIVANTE.
    var ouverture = "";
    if (W.PokeDepart) {
      var avant = partie.vivierDepart || [];
      var apres = W.PokeDepart.vivier();
      var neufs = [];
      for (var i = 0; i < apres.length; i++) {
        if (avant.indexOf(apres[i]) < 0) neufs.push(apres[i]);
      }
      var c = W.PokeDepart.compte();
      ouverture =
        '<h2 class="pkdx-titre">' + T("ouvert", null, g) + "</h2>" +
        (neufs.length
          ? "<p>" + esc(T("ouvertDit", { n: neufs.length }, g)) + "</p>" +
            '<div class="pkdx-vitrine">' + neufs.map(function (n) {
              var e = ESP()[n];
              return '<div class="pkdx-vitrine-mon">' +
                '<img alt="' + esc(e.nom[LANG()]) + '" src="' + W.PokeSprites.face(n, "?i=6") + '">' +
                "<b>" + esc(e.nom[LANG()]) + "</b>" +
              "</div>";
            }).join("") + "</div>"
          : "<p>" + esc(T("ouvertRien", null, g)) + "</p>") +
        "<p>" + esc(T("ouvertCompte", { o: c.ouverts, t: c.ouvrables }, g)) + "</p>";
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LA PROCHAINE CHASSE — LA SEULE LIGNE QUI PARLE DU VOYAGE D'APRÈS
    //
    //  🔴 CET ÉCRAN NE DISAIT QUE CE QUI VIENT DE SE PASSER. Score, Pokédex,
    //     équipe, carte de partage : un bilan complet, et rien sur ce qui est
    //     À PORTÉE. Or c'est là que se joue la relance — un joueur qui vient
    //     de perdre au troisième acte ne relance pas pour refaire le même
    //     voyage, il relance pour DÉCROCHER quelque chose. Les chasses
    //     existent depuis hier ; elles n'apparaissaient qu'une fois gagnées.
    //
    //  🔴 ON N'EN MONTRE QU'UNE, LA PLUS PROCHE. Dix objectifs alignés sur un
    //     écran de défaite, c'est une liste de ce qu'on n'a pas fait. Un seul,
    //     avec son compte et le serment qu'il ouvre, c'est une raison.
    //     ⚠️ « La plus proche » se mesure en PART du chemin fait, pas en écart
    //        brut : deux badges sur quatre est plus près que vingt-huit
    //        espèces sur trente, et un écart de deux dirait l'inverse.
    // ═══════════════════════════════════════════════════════════════════════
    var prochaine = "";
    if (W.PokeChasses && W.PokeProgression) {
      var cpt = W.PokeProgression.lire();
      var lignes = W.PokeChasses.etat(
        { chasses: cpt.chasses, pris: Object.keys(cpt.pris).length }, b
      ).filter(function (l) { return !l.faite && l.sur > 0; });
      lignes.sort(function (x, y) { return (y.fait / y.sur) - (x.fait / x.sur); });
      var p0 = lignes[0];
      if (p0) {
        var serm = p0.ouvre && p0.ouvre.serment && W.PokeSerments
          ? W.PokeSerments.de(p0.ouvre.serment) : null;
        prochaine =
          '<h2 class="pkdx-titre">' + T("prochaineChasse", null, g) + "</h2>" +
          '<div class="pkdx-chasse pkdx-chasse-proche">' +
            '<span class="pkdx-chasse-nom">' + esc(p0.nom[LANG()]) + "</span>" +
            '<span class="pkdx-chasse-etat">' + p0.fait + " / " + p0.sur + "</span>" +
            '<span class="pkdx-chasse-dit">' + esc(p0.dit[LANG()]) + "</span>" +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 LA MÊME BARRE QU'AU CARNET, ET C'EST TOUT L'INTÉRÊT. Vue à
            //     l'écran : la chasse la plus proche s'affichait ici avec « 2 /
            //     3 » nu, alors que le Carnet montre une barre depuis une heure.
            //     Le MÊME composant, la MÊME donnée, deux traitements — le
            //     joueur réapprend à lire à chaque écran. Et c'est ici que ça
            //     compte le plus : c'est l'écran où l'on décide de relancer.
            //  ⚠️ Même règle qu'au Carnet : le plancher de 3 % ne s'applique
            //     qu'au-dessus de zéro, sinon la barre promet un progrès qui
            //     n'existe pas.
            // ═══════════════════════════════════════════════════════════════
            (function () {
              var part = Math.max(0, Math.min(1, p0.fait / p0.sur));
              var large = p0.fait > 0 ? Math.max(3, Math.round(part * 100)) : 0;
              return '<span class="pkdx-barre pkdx-chasse-barre" aria-hidden="true"' +
                  (part >= 0.8 ? ' data-pres="oui"' : "") + ">" +
                '<i style="--part:' + (large / 100) + '"></i>' +
              "</span>";
            })() +
            (serm ? '<span class="pkdx-chasse-ouvre">' + T("carnetOuvre", null, g) + " " +
              esc(serm.nom[LANG()]) + "</span>" : "") +
          "</div>";
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CE QUE LE VOYAGE VIENT DE DÉCROCHER — le pendant de « À PORTÉE »
    //
    //  🔑 `chassesNeuves` EXISTE DÉJÀ : `PokeProgression.fusionner` le remplit
    //     à chaque clôture, précisément pour que quelqu'un puisse le dire. Il
    //     n'était lu que par l'écran-message transitoire.
    //  ⚠️ On nomme le SERMENT que chaque chasse ouvre, pas seulement la chasse :
    //     c'est ce qui change le voyage suivant, donc c'est ce qui décide de
    //     relancer. Sans lui, on annonce un trophée au lieu d'un outil.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ACQUIS QU'ON EMPORTE — construit ici, posé juste au-dessus de REPARTIR
    //
    //  Trois états, et chacun dit la vérité de sa situation :
    //   · on a de la place et des acquis pris → on CHOISIT lequel emporter ;
    //   · le sac d'emport est plein → on dit ce qu'on tient, et qu'il faut en
    //     rendre un pour en prendre un autre (le plafond ne doit pas être une
    //     prison muette) ;
    //   · le voyage n'a pris aucun acquis → rien. On n'annonce pas un vide.
    // ═══════════════════════════════════════════════════════════════════════
    var emporter = (function () {
      var vide = { html: "", pris: [] };
      if (partie.compare) return vide;                 // jamais au Défi du jour
      if (!W.PokeAcquis || !W.PokeProgression || !W.PokeProgression.gardes) return vide;
      var deja = W.PokeProgression.gardes();
      // ⚠️ LE REPLI DISAIT DEUX, LA MESURE A TRANCHÉ À UN. Un repli qui ment
      //    est pire qu'une erreur : il ne se déclenche que le jour où la porte
      //    manque, c'est-à-dire le jour où personne ne regarde.
      var max = W.PokeProgression.GARDES_MAX || 1;
      // Ce que CE voyage a pris, moins ce qu'on emporte déjà.
      var pris = (partie.acquis || []).filter(function (id) { return deja.indexOf(id) < 0; })
        .map(function (id) { return W.PokeAcquis.de(id); }).filter(Boolean);
      if (!pris.length && !deja.length) return vide;
      var tenus = deja.map(function (id) { return W.PokeAcquis.de(id); }).filter(Boolean);
      var plein = deja.length >= max;
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 « RENDS-EN UN POUR EN PRENDRE UN AUTRE » QUAND IL N'Y A RIEN À
      //     PRENDRE. Un voyage mort avant la moindre carte d'acquis affichait
      //     quand même le bouton RENDRE, sans aucune liste en face — et cliquer
      //     rendait l'acquis emporté DÉFINITIVEMENT, sans remplaçant. C'est le
      //     seul écran du mode qui touche `gardes` : le geste était irréversible
      //     et proposé pour rien.
      //  ✅ Sans rien de neuf à emporter, on le DIT et on retire le bouton.
      // ═══════════════════════════════════════════════════════════════════════
      var riensDeNeuf = plein && !pris.length;
      var html = '<h2 class="pkdx-titre">' + T("emportTitre", null, g) + "</h2>" +
        '<p class="pkdx-dit">' +
          esc(riensDeNeuf ? T("emportRienDeNeuf", null, g)
            : plein ? T("emportPlein", { n: max }, g)
            : pris.length ? T("emportDit", { n: max - deja.length }, g)
            : T("emportRien", null, g)) + "</p>";
      if (tenus.length) {
        html += '<ul class="pkdx-emport est-tenus">' + tenus.map(function (a) {
          return '<li class="pkdx-emport-un est-tenu">' +
            "<b>" + esc(a.nom[LANG()]) + "</b>" +
            '<span class="pkdx-emport-dit">' + esc(a.dit[LANG()]) + "</span>" +
            (riensDeNeuf ? ""
              : '<button type="button" class="pkdx-touche est-discrete" data-rendre="' +
                esc(a.id) + '">' + T("emportRendre", null, g) + "</button>") +
          "</li>";
        }).join("") + "</ul>";
      }
      if (!plein && pris.length) {
        html += '<ul class="pkdx-emport">' + pris.map(function (a) {
          return '<li class="pkdx-emport-un">' +
            "<b>" + esc(a.nom[LANG()]) + "</b>" +
            '<span class="pkdx-emport-dit">' + esc(a.dit[LANG()]) + "</span>" +
            '<button type="button" class="pkdx-touche" data-emporter="' +
              esc(a.id) + '">' + T("emportPrendre", null, g) + "</button>" +
          "</li>";
        }).join("") + "</ul>";
      }
      return { html: html, pris: pris };
    })();

    var decroche = "";
    if (W.PokeChasses && W.PokeProgression) {
      var neuves = (W.PokeProgression.lire().chassesNeuves || [])
        .map(function (id) { return W.PokeChasses.de(id); }).filter(Boolean);
      if (neuves.length) {
        decroche =
          '<h2 class="pkdx-titre">' + T("decroche", null, g) + "</h2>" +
          '<div class="pkdx-chasses">' + neuves.map(function (c) {
            var sm = c.ouvre && c.ouvre.serment && W.PokeSerments
              ? W.PokeSerments.de(c.ouvre.serment) : null;
            return '<div class="pkdx-chasse pkdx-chasse-faite">' +
              '<span class="pkdx-chasse-nom">' + esc(c.nom[LANG()]) + "</span>" +
              '<span class="pkdx-chasse-dit">' + esc(c.dit[LANG()]) + "</span>" +
              (sm ? '<span class="pkdx-chasse-ouvre">' + T("carnetOuvre", null, g) + " " +
                esc(sm.nom[LANG()]) + "</span>" : "") +
            "</div>";
          }).join("") + "</div>";
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  L'ÉCHELLE DES SCEAUX — SON OUVERTURE, OU SA PROMESSE
    //
    //  Trois états, un seul bloc : le palier vient de s'ouvrir (on le nomme et
    //  on dit ce qu'il fait), on est déjà sur l'échelle (on dit où l'on en est),
    //  ou on n'y est jamais monté (on dit ce que la victoire ouvre).
    //  🔴 C'est la ligne qui manquait le plus : un joueur peut faire dix voyages
    //     sans jamais apprendre que le mode a huit crans au-dessus de lui.
    // ═══════════════════════════════════════════════════════════════════════
    var echelle = "";
    var palierDit = (function () {
        if (!W.PokeAcquis || !W.PokeAcquis.prochainPalier) return "";
        var pal = W.PokeAcquis.prochainPalier(b);
        if (!pal) return "";
        return '<p class="pkdx-dit pkdx-echelle">' +
          // 🔴 `g` EST LE GENRE, PAS LA LANGUE — audit du 14/08. Cette ligne
          //    testait `g === "en"` alors que `g` vaut `partie.genre` (« h » ou
          //    « f ») : la condition était TOUJOURS fausse, et le nom de
          //    l'acquis sortait en français dans l'écran anglais — « Catch 22
          //    more species, and "La revanche" joins your runs ». La table
          //    portait pourtant sa traduction (« Payback ») depuis toujours.
          //  🔑 Trouvé en balayant les écrans anglais à la recherche de
          //     mots-outils français. Deux variables d'une lettre qui se
          //     ressemblent suffisent : partout ailleurs le fichier écrit
          //     `LANG()`, ici seulement il avait écrit `g`.
          esc(T("palierAcquis", { n: pal.manque, nom: pal.acquis.nom[LANG()] || pal.acquis.nom.fr }, g)) +
          "</p>";
      })();
    if (!b.compare && W.PokeSceaux && W.PokeProgression) {
      var cp = W.PokeProgression.lire();
      var total = W.PokeSceaux.nombre();
      if (cp.sceauNeuf) {
        var sn = W.PokeSceaux.de(cp.sceauNeuf);
        if (sn) {
          echelle =
            '<h2 class="pkdx-titre">' + T("sceauOuvert", null, g) + "</h2>" +
            '<div class="pkdx-chasse pkdx-chasse-proche">' +
              '<span class="pkdx-chasse-nom">' + esc(sn.nom[LANG()]) + "</span>" +
              '<span class="pkdx-chasse-etat">' + cp.sceauNeuf + " / " + total + "</span>" +
              '<span class="pkdx-chasse-dit">' +
                esc(T("sceauOuvertDit", { quoi: sn.dit[LANG()] }, g)) + "</span>" +
            "</div>";
        }
      } else if (cp.sceauMax > 0) {
        echelle = '<p class="pkdx-dit">' +
          esc(T("sceauPalier", { n: cp.sceauMax, t: total }, g)) + "</p>";
      } else {
        // 🔴 LA PROMESSE PORTE SA DISTANCE. Sans elle, « franchis la Ligue » se
        //    lit pareil à un badge et à sept — c'est ce que le diplôme refuse
        //    depuis toujours, et la promesse du sceau l'avait oublié.
        // ⚠️ La distance vient du MEILLEUR voyage du compte, pas de celui qui
        //    vient de finir : on parle d'un objectif qui se poursuit d'un
        //    voyage à l'autre, et le raconter sur la seule partie perdue
        //    donnerait « 0 badge » à un joueur qui en a déjà décroché six.
        var mieux = cp.badgesMax || 0;
        echelle =
          '<p class="pkdx-dit pkdx-echelle">' + esc(T("sceauPromesse", null, g)) + " " +
            esc(mieux > 0 ? T("sceauPromesseLoin", { n: mieux }, g) : T("sceauPromesseJamais", null, g)) +
          "</p>";
      }
    }

    hote.innerHTML =
      // Le titre suit la CAUSE, pas la seule victoire. `b.fini` la porte déjà.
      '<h1 class="pkdx-titre">' + T(
        b.fini === "equipe" ? "titreEquipe"
        : b.fini === "epuise" ? "titreEpuise"
        : b.fini === "abandon" ? "titreAbandon"
        : "vitrine", null, g) + "</h1>" +
      // ── LA RAISON D'ABORD, L'ENCOURAGEMENT ENSUITE ────────────────────────
      // 🔴 L'ÉCRAN DE FIN DISAIT DEUX FOIS LA MÊME CHOSE, dans le mauvais
      //    ordre : « Le voyage a été court. Il en reste cent cinquante à
      //    croiser. » PUIS « Trois échecs devant le même Champion. Le voyage
      //    s'arrête. » Le joueur lisait le commentaire avant de savoir
      //    pourquoi c'était fini, et « le voyage » revenait deux fois en deux
      //    phrases. On dit CE QUI S'EST PASSÉ, puis ce que ça vaut.
      // ⚠️ LE COMPTE VIENT DE LA CONSTANTE, jamais du texte : `finEpuise` le
      //    lit, les autres fins l'ignorent sans dommage.
      "<p>" + esc(T(FINS[b.fini] || "finInconnue",
        { n: (W.PokePartie && W.PokePartie.ESSAIS_BOSS) || 2 }, g)) + "</p>" +
      '<p class="pkdx-verdict">' + esc((function () {
        var cle = motDeFin(b);
        if (cle !== "motDebut") return T(cle, null, g);
        var n = resteACroiser();
        if (n === null) return T("motDebut", { n: 150 }, g);
        return n ? T("motDebut", { n: n }, g) : T("motDebutComplet", null, g);
      })()) + "</p>" +

      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LA RÈGLE DU JOUR SE DIT AUSSI À L'ARRIVÉE. Elle est annoncée sur
      //     l'accueil, sur l'écran du défi, portée dans le bandeau tout le
      //     voyage, et gravée sur la carte qu'on partage — et l'écran de FIN,
      //     celui qu'on regarde le plus longtemps, l'oubliait. Un score se
      //     compare à une contrainte : « 1 480 » ne dit rien, « 1 480 en
      //     Économie de guerre » dit tout.
      //  ⚠️ Seulement en défi : une carrière libre n'a pas de règle du jour, et
      //     l'annoncer inventerait une contrainte qui n'a pas existé.
      (function () {
        if (!partie || !partie.compare || !W.PokeRegleDuJour) return "";
        var r = W.PokeRegleDuJour.de(partie.regleDuJour);
        if (!r) return "";
        return '<p class="pkdx-dit est-note">' +
          esc(T("finRegle", { nom: r.nom[LANG()] }, g)) + "</p>";
      })() +

      // 🔴 LE RANG SE DIT ICI, HAUT, ET SANS COUPER LA VITRINE. C'est déjà
      //    l'écran de la célébration : y insérer un écran de plus avant elle
      //    ferait attendre le joueur pour lui montrer ce qu'il attend. Le nom du
      //    rang est calculé par l'écran appelant — ce fichier ne connaît ni la
      //    table des rangs ni le genre du compte.
      (rangMonte
        ? '<div class="pkdx-rang est-neuf">' +
            "<dt>" + T("rangNeuf", null, g) + "</dt>" +
            "<dd>" + esc(rangMonte) + "</dd>" +
          "</div>"
        : "") +

      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 « REPARTIR » ÉTAIT LE DERNIER ÉLÉMENT DE L'ÉCRAN, APRÈS DIX
      //     SECTIONS. Mesuré le 09/08 : le bouton finissait à **1 767 px sur
      //     une page de 1 869**, dans une vue de 800. Deux écrans et demi de
      //     défilement pour trouver l'action qui relance le jeu — sur l'écran
      //     dont c'est tout le métier.
      //
      //     C'est la même faute que l'accueil venait de payer (COMMENCER à
      //     940 px), et elle coûte plus cher ici : l'écran de fin est le seul
      //     moment où un joueur décide s'il rejoue. Ce qu'on enterre, on le
      //     perd — la moitié des voyages s'arrêtent avant le troisième acte, et
      //     c'est là que se joue la relance.
      //
      //  ⚠️ IL EST DÉPLACÉ, PAS DUPLIQUÉ. Deux boutons de même identifiant, et
      //     `querySelector` n'en câblerait qu'un : l'autre serait une porte
      //     morte, exactement la classe de défaut que ce dossier traque.
      //  ⚠️ Le partage et le duel RESTENT en bas : ce sont des gestes qu'on fait
      //     après avoir lu son bilan, pas avant.
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LA RAISON DE REJOUER SE LIT AVEC LE BOUTON, PAS 500 px PLUS BAS.
      //     Mesuré : REJOUER à 137 px, la promesse de palier à 629. Le joueur
      //     rencontrait la décision un demi-écran avant son motif — et c'est
      //     exactement l'écran où l'on ferme l'onglet ou l'on repart.
      //     Même leçon que le déplacement du bouton lui-même (v390, 1 767 px
      //     → 251) : *ce qui décide et ce qui motive se lisent ensemble.*
      //  ⚠️ Elle se lit JUSTE AVANT le bouton — mesuré : promesse à 121 px,
      //     REJOUER à 169. La raison d'abord, l'action ensuite. Elle reste UNE
      //     ligne : la v390 a remonté ce bouton de 1 767 px à 251, et tout ce
      //     qu'on glisse au-dessus le repousse d'autant.
      // ═══════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      //  CE QUE TU EMPORTES AU VOYAGE SUIVANT — le pilier de la relance
      //
      //  🔴 MESURÉ LE 14/08, 50 COMPTES VIERGES : un voyage mort à l'acte 1
      //     laissait 2,5 espèces, et le premier acquis de compte en demande
      //     25. Perdre ne payait RIEN. C'est la raison mécanique pour laquelle
      //     on ne relance pas — pas une question d'humeur.
      //  ✅ Chaque voyage laisse maintenant UN acquis, CHOISI parmi ceux qu'on
      //     a pris. Il se lit juste au-dessus de REPARTIR, à l'endroit exact où
      //     l'on décide de rejouer : c'est la promesse qui fait relancer, et
      //     elle doit se lire AVEC le bouton, pas cinq écrans plus bas.
      //  ⚠️ Rien en défi (`b.compare`) : aucun avantage hors partie là où l'on
      //     se compare. Rien non plus si le voyage n'a pris aucun acquis — on
      //     n'annonce pas un choix vide.
      // ═══════════════════════════════════════════════════════════════════
      emporter.html +
      palierDit +
      '<div class="pkdx-actions est-relance">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-rejouer">' +
          T("rejouer", null, g) + "</button>" +
      "</div>" +

      '<h2 class="pkdx-titre">' + T("equipe", null, g) + "</h2>" +
      '<div class="pkdx-vitrine">' + equipe + "</div>" +

      '<h2 class="pkdx-titre">' + T("badges", null, g) + "</h2><p>" + badges + "</p>" +
      mur +

      '<h2 class="pkdx-titre">' + T("pokedex", null, g) + "</h2>" +
      "<p>" + esc(T("surAtteignables", { p: b.pris, a: b.atteignables, v: W.PokeGenre.version(b.version) }, g)) + "</p>" +
      // 🔴 Le compteur de COMPTE est ici aussi. Une partie qui finit doit
      //    montrer ce qu'elle a APPORTÉ à la collection, sinon le joueur croit
      //    avoir joué pour rien.
      "<p>" + esc(T("surCompte", (function () {
        var c = W.PokeProgression.comptePokedex();
        return { p: c.pris, n: c.total };
      })(), g)) +
      //  Le delta se calcule contre la photo `pokedexAvant` (posée au départ,
      //  même patron que `vivierDepart`). Une partie d'avant la photo n'a pas
      //  le champ : on se tait — une absence se restaure en absence.
      (function () {
        if (!partie.pokedexAvant) return "";
        var neuves = 0;
        for (var pn in (partie.pris || {})) if (!partie.pokedexAvant[pn]) neuves++;
        return neuves ? " " + esc(T("surCompteNeuves", { n: neuves }, g)) : "";
      })() + "</p>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LA RAISON DE RELANCER SE DIT ICI, ET NULLE PART AILLEURS. C'est
      //     l'écran où l'on décide de rejouer ou de fermer l'onglet. Trois
      //     acquis s'ouvrent à 25, 45 et 70 espèces prises — et sans cette
      //     ligne, le joueur les découvrirait par surprise, c'est-à-dire trop
      //     tard pour que ça pèse sur une décision.
      //  ⚠️ On dit ce qui MANQUE et le NOM de ce qu'on gagne : « encore six »
      //     ne motive pas, « encore six avant Le vétéran » si.
      //  ⚠️ Rien au Défi du jour : le vivier y est le même pour tous, donc la
      //     promesse serait fausse.
      // ═══════════════════════════════════════════════════════════════════════


      ouverture +
      // 🔴 ELLE SE LIT AVANT LA CARTE DE PARTAGE ET AVANT LES BOUTONS. Le
      //    commentaire de la rangée d'actions le dit déjà : « une fois REJOUER
      //    sous les yeux, le joueur ne lit plus rien ». La raison de relancer
      //    doit donc arriver AVANT le bouton qui relance.
      decroche +
      prochaine +
      // 🔴 L'ÉCHELLE JUSTE APRÈS, ET POUR LA MÊME RAISON. « À portée » dit ce
      //    qu'on peut décrocher au prochain voyage ; le sceau dit ce qu'il y a
      //    AU-DESSUS de tout. Les deux répondent à « pourquoi relancer », donc
      //    ils vivent ensemble, et avant le bouton qui relance.
      echelle +

      (leg ? '<h2 class="pkdx-titre">' + T("legendaires", null, g) + "</h2><p>" + leg + "</p>" : "") +
      (b.perdus ? '<h2 class="pkdx-titre">' + T("perdus", null, g) + "</h2>" +
        '<div class="pkdx-adversaires">' + (b.perdusNoms || []).map(function (x) {
          var e = ESP()[x.n];
          return '<span class="pkdx-troc-face">' +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
            "<b>" + esc(e ? e.nom[LANG()] : "?") + "</b>" +
            '<span class="pkdx-troc-note">' + W.PokeGenre.niveau(x.niveau) + "</span></span>";
        }).join("") + "</div>" : "") +

      '<h2 class="pkdx-titre">' + T("temps", null, g) + "</h2>" +
      "<p>" + esc(T("jours", { a: b.acte, t: b.actes, n: b.noeuds, p: b.perdues }, g)) + "</p>" +

      '<h2 class="pkdx-titre">' + T("score", null, g) + "</h2>" +
      '<p class="pkdx-score">' + b.score + "</p>" +
      // 🔴 LE SCEAU EXPLIQUE LE SCORE. Il le multiplie par un dixième et par
      //    palier : au huitième, le même voyage vaut quatre-vingts pour cent de
      //    plus. Un nombre qui gonfle sans qu'on dise pourquoi se lit comme un
      //    défaut — et le joueur qui monte d'un palier veut justement voir ce
      //    que son cran de difficulté lui a rapporté.
      (b.sceau && W.PokeSceaux
        ? '<p class="pkdx-dit">' + esc(T("scoreSceau", {
            n: b.sceau, pc: Math.round(b.sceau * 10),
            nom: (W.PokeSceaux.de(b.sceau) || { nom: { fr: "", en: "" } }).nom[LANG()],
          }, g)) + "</p>"
        : "") +

      '<h2 class="pkdx-titre">' + T("carte", null, g) + "</h2>" +
      // Le choix du format AVANT l'aperçu : on choisit où l'on va poster, et
      // l'image change sous les yeux. L'inverse ferait cliquer à l'aveugle.
      '<div class="pkdx-actions pkdx-formats">' +
        '<button type="button" class="pkdx-touche" data-fmt="large" aria-pressed="true">' + T("fmtLarge", null, g) + "</button>" +
        '<button type="button" class="pkdx-touche" data-fmt="haut" aria-pressed="false">' + T("fmtHaut", null, g) + "</button>" +
      "</div>" +
      '<div id="pk-apercu" class="pkdx-apercu"></div>' +
      // 🔴 LE DUEL SE DIT AVANT LES BOUTONS DE SORTIE, pas après : une fois
      //    « REJOUER » sous les yeux, le joueur ne lit plus rien.
      //    ⚠️ On ne recopie NI le code NI le bouton COPIER ici. Ils vivent sur
      //       l'écran de duel, à un seul endroit — deux rendus d'un même code
      //       finiraient par diverger, et c'est une loi du projet.
      (duel
        ? '<h2 class="pkdx-titre">' + T("scelle", null, g) + "</h2>" +
          "<p>" + esc(neuf
            ? T("scelleDit", null, g)
            : T("scelleGarde", { n: duel.badges }, g)) + "</p>"
        : "") +

      '<div class="pkdx-actions">' +
        // 🔴 LE TEXTE AVANT L'IMAGE. Partager une image demande de la
        //    télécharger, de la retrouver et de la joindre — quatre gestes que
        //    personne ne fait. Un résumé se copie et se colle : c'est comme ça
        //    que les jeux quotidiens se partagent.
        '<button type="button" class="pkdx-touche" id="pk-resume">' + T("copierResume", null, g) + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-png">' + T("telecharger", null, g) + "</button>" +
        (duel ? '<button type="button" class="pkdx-touche" id="pk-duel-fin">' + T("scelleAller", null, g) + "</button>" : "") +
      "</div>" +
      '<p class="pkdx-dit est-note" id="pk-resume-dit"></p>';

    // 🔴 L'APERÇU ET L'IMAGE PASSENT PAR LA MÊME FONCTION. Sur les autres modes,
    //    les deux rendus ont divergé et le joueur partageait une carte
    //    différente de celle qu'il voyait.
    // 🔴 UN SEUL ÉTAT POUR LES DEUX BOUTONS. L'aperçu et le téléchargement
    //    lisent la même variable : sans ça, on regarde un format et on
    //    enregistre l'autre — le genre de divergence qu'on ne voit qu'une fois
    //    l'image publiée.
    var format = "large";
    W.PokeCarte.apercu(hote.querySelector("#pk-apercu"), partie, format);
    var onglets = hote.querySelectorAll("[data-fmt]");
    for (var f = 0; f < onglets.length; f++) {
      onglets[f].addEventListener("click", function (e) {
        format = e.currentTarget.getAttribute("data-fmt");
        for (var k = 0; k < onglets.length; k++) {
          onglets[k].setAttribute("aria-pressed",
            onglets[k].getAttribute("data-fmt") === format ? "true" : "false");
        }
        W.PokeCarte.apercu(hote.querySelector("#pk-apercu"), partie, format);
      });
    }
    hote.querySelector("#pk-png").addEventListener("click", function () { W.PokeCarte.telecharger(partie, format); });
    hote.querySelector("#pk-resume").addEventListener("click", function () {
      var t = W.PokeCarte.resume(partie);
      // Un champ caché pour la voie ancienne du presse-papier, et un repli
      // affiché si aucune des deux ne passe : le joueur doit pouvoir copier.
      var champ = D.createElement("textarea");
      champ.value = t;
      champ.setAttribute("readonly", "readonly");
      champ.style.cssText = "position:fixed;left:-9999px;top:0";
      D.body.appendChild(champ);
      var ok = W.PokeCarte.copier(t, champ);
      champ.remove();
      var dit = hote.querySelector("#pk-resume-dit");
      if (ok) { dit.textContent = T("resumeCopie", null, g); return; }
      dit.textContent = "";
      var vu = D.createElement("textarea");
      vu.className = "pkdx-champ est-code";
      vu.rows = 4;
      vu.value = t;
      dit.appendChild(vu);
      vu.select();
    });
    // ═══════════════════════════════════════════════════════════════════════
    //  EMPORTER UN ACQUIS — le geste qui fait relancer
    //  ⚠️ ON RE-AFFICHE L'ÉCRAN après le choix. Sans ça, le joueur clique et
    //     rien ne bouge : une action qu'on ne voit pas prendre devient une
    //     superstition, et c'est la classe de défaut n°1 du dossier.
    // ═══════════════════════════════════════════════════════════════════════
    hote.querySelectorAll("[data-emporter]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (W.PokeProgression.garder(b.getAttribute("data-emporter"))) {
          afficher(hote, partie, surRejouer, surDuel, neuf, rangMonte);
        }
      });
    });
    hote.querySelectorAll("[data-rendre]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (W.PokeProgression.rendre(b.getAttribute("data-rendre"))) {
          afficher(hote, partie, surRejouer, surDuel, neuf, rangMonte);
        }
      });
    });
    // ⚠️ ENROBÉES — voir `tools/poke-evenement-fuite.mjs`.
    hote.querySelector("#pk-rejouer").addEventListener("click", function () { surRejouer(); });
    var versDuel = hote.querySelector("#pk-duel-fin");
    if (versDuel) versDuel.addEventListener("click", function () { surDuel(); });
    return b;
  }

  W.PokeFin = { afficher: afficher, motDeFin: motDeFin };
})(window, document);
