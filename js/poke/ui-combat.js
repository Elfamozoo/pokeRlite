(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCRAN DE COMBAT
  //
  //  Le moteur rend des ÉVÉNEMENTS ; ce fichier les met en mots et en mouvement.
  //  🔴 Séparation stricte : aucune règle de jeu ici, aucun tirage, aucun texte
  //     dans `combat.js`. C'est ce qui permet au serveur de rejouer un combat
  //     sans charger une seule chaîne de langue.
  //
  //  Écriture : phrases courtes, ≤ 14 mots, vocabulaire du jeu, zéro métaphore.
  //  Les libellés sont ceux que le joueur connaît — « C'est super efficace ! »,
  //  « Le Pokémon sauvage s'enfuit ! ». On ne les réinvente pas.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };
  //  Les noms de types du monde COURANT : 1999 en ajoute deux, et une lecture
  //  directe de la table de 1996 les afficherait en anglais brut.
  var TYPES_NOMS = function () {
    return (W.PokeRegles && W.PokeRegles.typeNoms && W.PokeRegles.typeNoms()) || W.POKE_TYPE_NOMS;
  };
  var LANG = function () { return W.POKE_LANG || "fr"; };

  // ── Les textes ─────────────────────────────────────────────────────────────
  //  Aucun accord de genre n'est nécessaire ici : le combat parle des Pokémon,
  //  jamais du dresseur. Les rares lignes qui s'adressent au joueur sont
  //  neutres, et c'est délibéré — voir `poke-genre.mjs` pour le reste du jeu.
  var TXT = {
    // Les statistiques, pour la phrase courte d'un coup sans puissance.
    sAtk: { fr: "Attaque", en: "Attack" }, sDef: { fr: "Défense", en: "Defense" },
    sVit: { fr: "Vitesse", en: "Speed" }, sSpe: { fr: "Spécial", en: "Special" },
    sPrecision: { fr: "Précision", en: "Accuracy" }, sEsquive: { fr: "Esquive", en: "Evasion" },
    // 🔴 LE POSSESSIF PORTE LA MOITIÉ DU SENS : en première génération, monter
    //    vise SOI et baisser vise l'ADVERSAIRE. « Ta » contre « Sa ».
    cMonte: { fr: "{p} {stat} monte", en: "Your {stat} rises" },
    cMonte2: { fr: "{p} {stat} monte beaucoup", en: "Your {stat} rises sharply" },
    cBaisse: { fr: "{p} {stat} baisse", en: "Its {stat} falls" },
    cBaisse2: { fr: "{p} {stat} baisse beaucoup", en: "Its {stat} falls sharply" },
    // Les quatre possessifs, élidés ou non. L'anglais ignore le jeton {p} de
    // ses gabarits — Your/Its y sont écrits en dur, à raison.
    possTa: { fr: "Ta", en: "" }, possTonV: { fr: "Ton", en: "" },
    possSa: { fr: "Sa", en: "" }, possSonV: { fr: "Son", en: "" },
    cEndort: { fr: "Endort", en: "Puts to sleep" },
    cEmpoisonne: { fr: "Empoisonne", en: "Poisons" },
    cParalyse: { fr: "Paralyse", en: "Paralyzes" },
    cConfus: { fr: "Rend confus", en: "Confuses" },
    cSoigne: { fr: "Rend la moitié des PV", en: "Restores half the HP" },
    cGraine: { fr: "Draine à chaque tour", en: "Drains each turn" },
    cReflet: { fr: "Double ta Défense", en: "Doubles your Defense" },
    // ⚠️ LE SPÉCIAL N'EST DOUBLÉ QU'EN DÉFENSE — le moteur ne touche pas
    //    l'attaque spéciale. « Double ton Spécial » laissait croire l'inverse.
    cMur: { fr: "Double ta Défense contre les coups spéciaux", en: "Doubles your Defense against special moves" },
    cBrume: { fr: "Protège tes statistiques", en: "Guards your stats" },
    cEfface: { fr: "Efface tous les paliers", en: "Clears all stat changes" },
    cCritiques: { fr: "Plus de coups critiques", en: "More critical hits" },
    cPatiente: { fr: "Encaisse, puis rend le double", en: "Takes hits, then returns double" },
    cBloque: { fr: "Bloque une de ses attaques", en: "Disables one of its moves" },
    cCopie: { fr: "Copie une de ses attaques", en: "Copies one of its moves" },
    cFuit: { fr: "Met fin au combat", en: "Ends the battle" },
    cFixe: { fr: "Dégâts fixes", en: "Fixed damage" },
    cConversion: { fr: "Prend son type", en: "Takes its type" },
    cSubstitut: { fr: "Un leurre encaisse à ta place", en: "A decoy takes the hits" },
    cTransforme: { fr: "Tu deviens lui", en: "You become it" },
    cRien: { fr: "Ne fait rien", en: "Does nothing" },
    cVampire: { fr: "Rend la moitié des dégâts", en: "Restores half the damage" },
    cRecharge: { fr: "Immobilise au tour suivant", en: "Locks you next turn" },
    envoiJoueur: { fr: "{nom}, go !", en: "Go, {nom}!" },
    envoiAdverse: { fr: "L'adversaire envoie {nom} !", en: "The opponent sent out {nom}!" },
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 PERSONNE N'AVAIT DE NOM. Chaque combat de dresseur du mode disait
    //    « L'adversaire envoie Racaillou ! » — y compris les huit Champions
    //    d'Arène et les cinq combats de la Ligue. Pierre, Koga, Giovanni,
    //    Olga, Peter : anonymes, du premier badge au sommet du jeu.
    //    Le nœud de carte, lui, ANNONCE la classe depuis toujours
    //    (« Pêcheur · 3 Pokémon ») — l'information existait, elle mourait au
    //    moment précis où elle sert. Le jeu sait, et il ne dit pas.
    //
    // 🔴 ET CE N'EST PAS QUE DE L'AMBIANCE. La classe est un SIGNAL DE JEU :
    //    un Pêcheur aligne de l'Eau, un Scout de l'Insecte, un Ornithologue
    //    du Vol. Savoir qui entre, c'est savoir quoi envoyer — le joueur
    //    choisissait déjà son nœud là-dessus, et le combat le lui reprenait.
    //
    // ⚠️ LA FORME EST CELLE DU ROM : la classe sert de TITRE, sans article
    //    (« SCOUT Louis envoie RATTATA ! »). C'est aussi ce qui rend la
    //    règle sûre — « Canon » est un nom masculin porté par une femme,
    //    « Fillette » est féminin : tout article obligeait à trancher un
    //    genre grammatical pour vingt-sept classes, et à se tromper.
    // ═══════════════════════════════════════════════════════════════════════
    envoiAdverseQui: { fr: "{qui} envoie {nom} !", en: "{qui} sent out {nom}!" },
    apparait: { fr: "Un {nom} sauvage apparaît !", en: "A wild {nom} appeared!" },
    // « Ça mord ! » est la touche du jeu d'origine ; le nom suit, parce qu'ici
    // le combat s'ouvre dans la foulée et qu'un écran de plus casserait le
    // rythme d'un nœud qui enchaîne trois prises.
    ferre: { fr: "Ça mord ! Un {nom} !", en: "Oh! A bite! A {nom}!" },
    // 🔴 UN SCARHINO NE MORD PAS À L'HAMEÇON. Le nœud d'arbre passe par la
    //    même boucle que la pêche : sans phrase à lui, il aurait hérité de
    //    « Ça mord ! » sur une créature qui vient de tomber d'un tronc.
    tombe: { fr: "L'arbre tremble… Un {nom} tombe !", en: "The tree shakes... A {nom} falls out!" },
    brise: { fr: "Le rocher se brise ! Un {nom} sort !", en: "The rock cracks open! A {nom} appears!" },
    utilise: { fr: "{nom} utilise {attaque} !", en: "{nom} used {attaque}!" },
    superEfficace: { fr: "C'est super efficace !", en: "It's super effective!" },
    peuEfficace: { fr: "Ce n'est pas très efficace…", en: "It's not very effective…" },
    sansEffet: { fr: "Ça n'affecte pas {nom}.", en: "It doesn't affect {nom}." },
    // 🔴 LES MÊMES FAITS, EN DEUX MOTS, AVANT LE COUP. Les phrases ci-dessus
    //    arrivent APRÈS — quand le tour est joué et le PP dépensé. Sur le
    //    bouton, il faut un mot qui tienne à côté d'un nom d'attaque.
    effForte: { fr: "super efficace", en: "super effective" },
    effFaible: { fr: "peu efficace", en: "not very effective" },
    effNulle: { fr: "sans effet", en: "no effect" },
    // 🔴 CE QU'IL VA ENCAISSER EN ENTRANT, dit en un mot — et dans le
    //    VOCABULAIRE DE 1996 (12/08) : « faiblesse », « résiste », « super
    //    efficace », « peu efficace » — les mêmes mots que les boutons
    //    d'attaque (`effForte`/`effFaible`) et que les verdicts d'équipe
    //    (`vFort`…). Un seul lexique pour la même table des types.
    relaisSolide: { fr: "résiste", en: "resists" },
    relaisFragile: { fr: "faiblesse", en: "weakness" },
    // 🔴 LE CÔTÉ OFFENSIF DU RELAIS, QUI N'EXISTAIT PAS : le menu ne disait
    //    que ce qu'on encaisse. On ne choisit pas un remplaçant sur la moitié
    //    de la question.
    relaisFrappe: { fr: "super efficace", en: "super effective" },
    relaisMord: { fr: "peu efficace", en: "not very effective" },
    critique: { fr: "Coup critique !", en: "A critical hit!" },
    rate: { fr: "{nom} rate son attaque.", en: "{nom}'s attack missed!" },
    ko: { fr: "{nom} est K.O. !", en: "{nom} fainted!" },
    // 🔴 LE TEXTE `lutte` A ÉTÉ RETIRÉ LE 14/08 : la refonte du 13/08 fait
    //    passer Lutte par le VRAI pipeline, qui annonce déjà « utilise Lutte ! »
    //    puis raconte le contrecoup. Cette phrase-ci ne pouvait plus sortir —
    //    `poke-coherence` la relevait à chaque passage (« texte prévu pour
    //    lutte, que le combat n'émet jamais ») et le relevé n'était pas lu.
    //    *Un texte qu'aucun événement n'atteint est un texte mort, même quand
    //    il est juste.*
    rappelle: { fr: "{nom}, reviens !", en: "{nom}, come back!" },
    // ── Les vingt et un effets réparés le 07/08/2026 ───────────────────────
    //  🔴 CHAQUE EFFET DOIT SE DIRE. Un effet qui se pose sans une ligne, c'est
    //     la classe de défaut n°1 du projet : le jeu sait, et il ne dit pas.
    //     `poke-coherence` réclame un texte pour chaque événement du combat, et
    //     il a raison — c'est lui qui a listé ces vingt-quatre lignes.
    soin: { fr: "{nom} récupère des forces.", en: "{nom} regained health." },
    repos: { fr: "{nom} s'endort et récupère tout.", en: "{nom} fell asleep and became healthy!" },
    trempette: { fr: "Mais il ne se passe rien…", en: "But nothing happened…" },
    buee: { fr: "Tous les changements sont annulés !", en: "All stat changes were eliminated!" },
    // 🔴 LA BUÉE NOIRE LÈVE AUSSI LE STATUT DE LA CIBLE — l'asymétrie de 1996,
    //    et le fait le plus décisif du coup. La ligne d'au-dessus parle des
    //    PALIERS : un joueur endormi qui se réveille d'un coup n'apprenait nulle
    //    part pourquoi. On le dit, sur sa propre ligne.
    bueeLeve: { fr: "{nom} n'a plus rien à soigner.", en: "{nom} is cured of its status." },
    brume: { fr: "{nom} est protégé par la brume.", en: "{nom} became shrouded in mist!" },
    murLumiere: { fr: "{nom} dresse un mur de lumière.", en: "{nom}'s Light Screen went up!" },
    protection: { fr: "{nom} se couvre d'un reflet protecteur.", en: "{nom} was protected by Reflect!" },
    puissance: { fr: "{nom} concentre son énergie.", en: "{nom} is getting pumped!" },
    graine: { fr: "Une graine se plante sur {nom} !", en: "{nom} was seeded!" },
    graineDraine: { fr: "La graine puise la force {de|nom}.", en: "{nom}'s health is sapped by Leech Seed!" },
    // 🔴 L'AUTRE MOITIÉ DE LA VAMPIGRAINE, MUETTE JUSQU'AU 14/08. Elle disait
    //    ce qu'elle RETIRE et taisait ce qu'elle REND : le joueur voyait une
    //    barre remonter sans une ligne pour l'expliquer — « par moment des
    //    Pokémon perdent de la vie sans aucune raison particulière », vu de
    //    l'autre côté. Une mécanique à moitié annoncée se lit comme un bug.
    graineRend: { fr: "La graine rend {n} PV à {nom}.", en: "Leech Seed restores {n} HP to {nom}." },
    clone: { fr: "{nom} fabrique un clone !", en: "{nom} made a substitute!" },
    cloneEncaisse: { fr: "Le clone encaisse le coup.", en: "The substitute took the hit!" },
    cloneCasse: { fr: "Le clone est détruit.", en: "The substitute broke!" },
    entrave: { fr: "{attaque} {de|nom} est bloquée !", en: "{nom}'s {attaque} was disabled!" },
    entraveBloque: { fr: "{attaque} est bloquée, {nom} ne peut pas s'en servir.", en: "{nom}'s {attaque} is disabled!" },
    finEntrave: { fr: "{nom} peut de nouveau attaquer normalement.", en: "{nom}'s move is no longer disabled!" },
    coupEntrave: { fr: "Bloquée par Entrave", en: "Disabled" },
    pleinePara: { fr: "{nom} est paralysé ! Il ne peut pas attaquer !", en: "{nom} is paralyzed! It can't move!" },
    brumeProtege: { fr: "La brume protège {nom} !", en: "{nom}'s protected by mist!" },
    // 🔴 LE CLONE N'ARRÊTAIT QUE LES DÉGÂTS ; il arrête désormais aussi le
    //    statut, les baisses de palier, la peur, la confusion et la graine —
    //    c'est le canon de 1996. Sans cette phrase, le joueur verrait son Toxik
    //    ne rien faire et n'aurait aucun moyen de comprendre pourquoi.
    cloneTient: { fr: "Le clone encaisse à la place {de|nom} !", en: "The substitute takes it for {nom}!" },
    // ⚠️ Un repli refusé ne doit pas être silencieux : le moteur écrivait
    //    l'index sans garde, et un index aberrant plantait le rejeu.
    replisRefuse: { fr: "Impossible d'envoyer celui-là.", en: "That one cannot be sent out." },
    copie: { fr: "{nom} copie {attaque} !", en: "{nom} learned {attaque}!" },
    imite: { fr: "{nom} imite l'attaque : {attaque} !", en: "{nom} mirrored {attaque}!" },
    metronome: { fr: "Le doigt s'agite… {attaque} !", en: "The finger waggles… {attaque}!" },
    conversion: { fr: "{nom} change de type.", en: "{nom} changed type!" },
    morphing: { fr: "{nom} se transforme !", en: "{nom} transformed!" },
    patience: { fr: "{nom} encaisse et attend…", en: "{nom} is storing energy…" },
    patienceRend: { fr: "{nom} rend le coup au double !", en: "{nom} unleashed energy!" },
    patienceVide: { fr: "{nom} n'avait rien à rendre.", en: "{nom} had nothing to unleash." },
    // Statuts
    statut_para: { fr: "{nom} est paralysé.", en: "{nom} is paralyzed!" },
    statut_brulure: { fr: "{nom} est brûlé.", en: "{nom} was burned!" },
    statut_gel: { fr: "{nom} est gelé.", en: "{nom} was frozen solid!" },
    statut_sommeil: { fr: "{nom} s'endort.", en: "{nom} fell asleep!" },
    statut_poison: { fr: "{nom} est empoisonné.", en: "{nom} was poisoned!" },
    statut_poisonGrave: { fr: "{nom} est gravement empoisonné.", en: "{nom} was badly poisoned!" },
    statutImmune: { fr: "Ça ne marche pas sur {nom}.", en: "It doesn't work on {nom}." },
    statutRefuse: { fr: "{nom} est déjà atteint.", en: "{nom} is already affected." },
    dort: { fr: "{nom} dort profondément.", en: "{nom} is fast asleep." },
    reveil: { fr: "{nom} se réveille !", en: "{nom} woke up!" },
    gele: { fr: "{nom} est pris dans la glace.", en: "{nom} is frozen solid!" },
    degel: { fr: "{nom} se dégèle !", en: "{nom} thawed out!" },
    peur: { fr: "{nom} a un mouvement de recul.", en: "{nom} flinched!" },
    confusion: { fr: "{nom} est confus.", en: "{nom} became confused!" },
    confusTient: { fr: "{nom} est confus…", en: "{nom} is confused…" },
    confus: { fr: "{nom} se blesse dans sa confusion.", en: "{nom} hurt itself in confusion!" },
    finConfusion: { fr: "{nom} n'est plus confus.", en: "{nom} snapped out of confusion!" },
    usure_poison: { fr: "Le poison ronge {nom}.", en: "{nom} is hurt by poison!" },
    usure_poisonGrave: { fr: "Le poison ronge {nom}.", en: "{nom} is hurt by poison!" },
    usure_brulure: { fr: "La brûlure ronge {nom}.", en: "{nom} is hurt by its burn!" },
    // Paliers
    palierHausse: { fr: "{stat} {de|nom} augmente.", en: "{nom}'s {stat} rose!" },
    palierHausse2: { fr: "{stat} {de|nom} augmente beaucoup.", en: "{nom}'s {stat} sharply rose!" },
    palierBaisse: { fr: "{stat} {de|nom} baisse.", en: "{nom}'s {stat} fell!" },
    palierBaisse2: { fr: "{stat} {de|nom} baisse beaucoup.", en: "{nom}'s {stat} harshly fell!" },
    palierBloque: { fr: "{stat} {de|nom} ne peut plus bouger.", en: "{nom}'s {stat} won't go any lower!" },
    // La garde tient tout le combat : elle se compte avec les paliers.
    palierGarde: { fr: "GARDE", en: "GUARD" },
    // Capture et fuite
    lance: { fr: "Tu lances une {ball} !", en: "You threw a {ball}!" },
    pris: { fr: "{nom} est attrapé !", en: "Gotcha! {nom} was caught!" },
    echappe0: { fr: "La Poké Ball s'ouvre aussitôt.", en: "The Poké Ball opened right away." },
    echappe1: { fr: "Presque ! Il s'échappe.", en: "Aww! It appeared to be caught!" },
    echappe2: { fr: "Il était tout près d'être attrapé.", en: "Aargh! Almost had it!" },
    echappe3: { fr: "À un cheveu près !", en: "Shoot! It was so close too!" },
    // Le libellé du jeu. Il parle du Pokémon d'en face, pas de son propriétaire,
    // et il échappe donc à l'accord — ce qui vaut mieux qu'un masculin
    // générique dans un mode où les Dresseuses existent.
    ballRefusee: { fr: "Ce Pokémon appartient à quelqu'un !", en: "You can't catch another trainer's Pokémon!" },
    // L'objet en combat. Il consomme le tour : la phrase le dit en le montrant,
    // l'adversaire attaque juste après.
    objetSoigne: { fr: "{quoi} rend {n} PV à {nom}.", en: "{quoi} restores {n} HP to {nom}." },
    objetGuerit: { fr: "{quoi} remet {nom} d'aplomb.", en: "{quoi} clears {nom} up." },
    objetEmploie: { fr: "Tu emploies {quoi} sur {nom}.", en: "You use {quoi} on {nom}." },
    // 🔴 L'OBJET TENU N'EST PAS L'OBJET EMPLOYÉ. Celui-là agit tout seul,
    //    personne ne l'a sorti du sac — et la phrase ne doit donc pas dire
    //    « tu ». Deux causes, deux clés : c'est la règle des clés doublées.
    // ═══════════════════════════════════════════════════════════════════════
    //  LA MÉTÉO ET LES DRAPEAUX DE 1999
    //
    //  🔴 CHAQUE ÉVÉNEMENT A SA PHRASE, et `poke-coherence` a exigé les huit
    //     avant que j'aie fini d'écrire le moteur : « le jeu sait et ne dit
    //     pas ». Une tempête qui ronge sans un mot se lit comme un bug — la
    //     Vampigraine l'a prouvé le 14/08.
    //  ⚠️ LE NOM DE LA MÉTÉO EST UNE DONNÉE, pas une chaîne recopiée : trois
    //     clés, trois phrases, et l'écran choisit.
    // ═══════════════════════════════════════════════════════════════════════
    meteoPluie: { fr: "La pluie se met à tomber.", en: "It started to rain." },
    meteoZenith: { fr: "Le soleil devient brûlant.", en: "The sunlight got bright." },
    meteoSable: { fr: "Une tempête de sable se lève.", en: "A sandstorm kicked up." },
    meteoFinPluie: { fr: "La pluie s'arrête.", en: "The rain stopped." },
    meteoFinZenith: { fr: "Le soleil redevient normal.", en: "The sunlight faded." },
    meteoFinSable: { fr: "La tempête retombe.", en: "The sandstorm subsided." },
    meteoRonge: { fr: "La tempête blesse {nom}.", en: "The sandstorm hits {nom}." },
    // ── Les quatre effets sans tirage de 1999 ────────────────────────────────
    //  ⚠️ CHAQUE PHRASE DIT CE QUI S'EST PASSÉ, PAS LA RÈGLE. « Il paie la
    //     moitié de ses PV pour poser une plaie qui ronge » est une note de
    //     conception ; « {nom} s'ouvre le flanc » est ce que le joueur voit.
    maledictionPaye: { fr: "{nom} s'ouvre le flanc.", en: "{nom} tears at its own side." },
    maledictionPose: { fr: "Une plaie s'ouvre sur {nom}.", en: "A wound opens on {nom}." },
    maledictionRonge: { fr: "La plaie ronge {nom}.", en: "The wound gnaws at {nom}." },
    //  🔴 ZÉRO SOIGNÉ SE DIT AUSSI : le joueur a payé son tour, il doit savoir
    //     ce qu'il a acheté. Deux phrases, pas un pluriel figé.
    glasDeSoin: { fr: "Le carillon sonne. {n} {n|Pokémon se relève|Pokémon se relèvent}.",
                  en: "The bell rings. {n} {n|Pokémon recovers|Pokémon recover}." },
    glasDeSoinRien: { fr: "Le carillon sonne. Personne n'en avait besoin.",
                      en: "The bell rings. Nobody needed it." },
    bideEnVrac: { fr: "{nom} se frappe le ventre. Son Attaque explose.",
                  en: "{nom} drums its belly. Its Attack surges." },
    bideEnVracRefuse: { fr: "{nom} n'a plus assez de forces.", en: "{nom} does not have the strength." },
    partage: { fr: "Les douleurs se mélangent.", en: "The pain is shared out." },
    // ── Les six derniers effets de 1999 ──────────────────────────────────────
    //  ⚠️ MÊME RÈGLE QUE POUR LES QUATRE AUTRES : la phrase dit CE QUI SE PASSE.
    //     « La garde s'use de moitié à chaque emploi consécutif » est une note
    //     de conception ; « {nom} n'a pas pu se remettre en garde » est ce que
    //     le joueur voit. Et l'échec se dit toujours — un coup qui rate en
    //     silence se lit comme un défaut de l'écran.
    abriPose: { fr: "{nom} se met en garde.", en: "{nom} braces itself." },
    abriTient: { fr: "La garde tient. {nom} n'est pas touché.", en: "The guard holds. {nom} is not hit." },
    abriCede: { fr: "{nom} n'a pas pu se remettre en garde.", en: "{nom} could not brace again." },
    tenacitePose: { fr: "{nom} plante ses appuis.", en: "{nom} digs in." },
    tenaciteTient: { fr: "{nom} tient debout à un souffle.", en: "{nom} endures the hit." },
    tenaciteCede: { fr: "{nom} n'a pas pu tenir ses appuis.", en: "{nom} could not dig in again." },
    depit: { fr: "{attaque} {de|nom} perd {n} {n|point de pouvoir|points de pouvoir}.",
             en: "{nom}'s {attaque} loses {n} {n|PP|PP}." },
    bis: { fr: "{nom} est forcé de rejouer {attaque} !", en: "{nom} must repeat {attaque}!" },
    bisFinit: { fr: "{nom} retrouve ses autres coups.", en: "{nom} can choose again." },
    voileMiroirRend: { fr: "Le voile renvoie le coup, doublé.", en: "The veil sends the hit back, doubled." },
    voileMiroirPerdu: { fr: "{nom} n'avait rien à renvoyer.", en: "{nom} had nothing to send back." },
    gribouille: { fr: "{nom} note {attaque}. Il la connaît pour de bon.",
                  en: "{nom} sketches {attaque}. It knows it for good." },
    //  🔴 TROIS REFUS, TROIS CAUSES. « Ça n'affecte pas X » est la phrase de
    //     l'immunité de type : la servir ici ferait ranger le coup comme
    //     inutile alors qu'il suffit d'attendre un tour.
    rienAPrendreDepit: { fr: "{nom} n'a encore rien joué.", en: "{nom} has not used a move yet." },
    rienAPrendreBis: { fr: "{nom} n'a encore rien joué.", en: "{nom} has not used a move yet." },
    rienAPrendreGribouille: { fr: "Il n'y a rien à noter.", en: "There is nothing to sketch." },
    bisDeja: { fr: "{nom} est déjà forcé de se répéter.", en: "{nom} is already forced to repeat itself." },
    bisRefuse: { fr: "{attaque} ne se répète pas.", en: "{attaque} cannot be repeated." },
    gribouilleDeja: { fr: "{nom} connaît déjà {attaque}.", en: "{nom} already knows {attaque}." },
    // ═══════════════════════════════════════════════════════════════════════
    //  LES ONZE DERNIERS DE JOHTO  [19/08/2026, nuit]
    //
    //  🔴 SEPT D'ENTRE EUX SONT DES REFUS, et c'est voulu : ces coups-là ratent
    //     souvent, et chaque façon de rater est une information. « Ils sont du
    //     même sexe » se corrige en changeant de Pokémon ; « il n'a pas de
    //     sexe » ne se corrige pas du tout ; « il est déjà amoureux » veut dire
    //     que le coup a marché il y a deux tours. Une seule phrase pour les
    //     trois ferait passer Attraction pour un coup capricieux.
    // ═══════════════════════════════════════════════════════════════════════
    picotsPose: { fr: "Des picots se répandent au sol.", en: "Spikes scatter on the ground." },
    picotsDeja: { fr: "Le sol en est déjà couvert.", en: "The ground is already covered." },
    picotsMord: { fr: "{nom} se blesse en arrivant.", en: "{nom} is hurt as it lands." },
    picotsVole: { fr: "{nom} passe au-dessus.", en: "{nom} floats over them." },
    attraction: { fr: "{nom} tombe amoureux.", en: "{nom} falls in love." },
    attractionDeja: { fr: "{nom} est déjà amoureux.", en: "{nom} is already in love." },
    attractionMemeSexe: { fr: "{nom} n'y est pas sensible.", en: "{nom} is not moved by it." },
    attractionSansSexe: { fr: "{nom} n'a pas de sexe.", en: "{nom} has no gender." },
    amoureux: { fr: "{nom} n'a d'yeux que pour son adversaire.", en: "{nom} only has eyes for its foe." },
    amourImmobilise: { fr: "{nom} ne bouge pas.", en: "{nom} does not move." },
    cauchemar: { fr: "{nom} fait un mauvais rêve.", en: "{nom} is caught in a nightmare." },
    cauchemarDeja: { fr: "{nom} rêve déjà mal.", en: "{nom} is already dreaming badly." },
    cauchemarEveille: { fr: "{nom} ne dort pas.", en: "{nom} is not asleep." },
    cauchemarRonge: { fr: "Le mauvais rêve ronge {nom}.", en: "The nightmare eats away at {nom}." },
    cauchemarFinit: { fr: "{nom} se réveille. Le rêve s'arrête.", en: "{nom} wakes up. The dream ends." },
    copiePaliers: { fr: "{nom} copie l'état de son adversaire.", en: "{nom} copies its foe's state." },
    copiePaliersRien: { fr: "{nom} n'a rien trouvé à copier.", en: "{nom} found nothing to copy." },
    conversionDeux: { fr: "{nom} devient de type {type}.", en: "{nom} becomes a {type} type." },
    conversionSansAbri: { fr: "Aucun type ne résiste à ça.", en: "No type resists that." },
    rienAPrendreConversion: { fr: "{nom} n'a encore rien joué.", en: "{nom} has not used a move yet." },
    vantardiseDeja: { fr: "{nom} est déjà confus.", en: "{nom} is already confused." },
    prescience: { fr: "{nom} sent une menace se former.", en: "{nom} senses something coming." },
    prescienceDeja: { fr: "Une menace plane déjà.", en: "Something is already coming." },
    prescienceTombe: { fr: "La menace s'abat sur {nom} !", en: "The threat strikes {nom}!" },
    blablaDodo: { fr: "{nom} marmonne {attaque} en dormant.", en: "{nom} mumbles {attaque} in its sleep." },
    blablaEveille: { fr: "{nom} est bien réveillé.", en: "{nom} is wide awake." },
    rienAPrendreBlabla: { fr: "{nom} n'a aucun autre coup.", en: "{nom} has no other move." },
    // ⚠️ « des statuts » se lit comme un pluriel figé pour `poke-genre`, qui a
    //    déjà repris ce fichier une fois aujourd hui. Il crie à côté et il a
    //    raison au fond : deux phrases courtes valent mieux qu’une longue.
    runePose: { fr: "Un voile enveloppe {nom}. Plus rien ne peut l’affecter.", en: "A veil wraps {nom}. Nothing can afflict it." },
    runeProtege: { fr: "Le voile tient. {nom} n'est pas touché.", en: "The veil holds. {nom} is unaffected." },
    runeFinit: { fr: "Le voile se dissipe.", en: "The veil faded." },
    regardPose: { fr: "{nom} ne peut plus fuir.", en: "{nom} can no longer flee." },
    requiemPose: { fr: "Un chant s'élève. Tout le monde l'entend.", en: "A song rises. Everyone hears it." },
    requiem: { fr: "Le chant se rapproche — encore {n}.", en: "The song draws closer — {n} left." },
    requiemTombe: { fr: "Le chant emporte {nom}.", en: "The song takes {nom}." },
    clairvoyancePose: { fr: "{nom} ne peut plus se dérober.", en: "{nom} can no longer evade." },
    lienDestinPose: { fr: "{nom} scelle son sort à celui d'en face.", en: "{nom} ties its fate to the foe." },
    relaisPose: { fr: "{nom} se prépare à passer le témoin.", en: "{nom} prepares to pass it on." },
    relais: { fr: "Le témoin passe. Rien n'est perdu.", en: "The baton is passed. Nothing is lost." },
    verrouPose: { fr: "{nom} verrouille sa cible.", en: "{nom} locks on." },
    //  🔴 « Restes rend 12 PV à Fouinette. » — le nom d'objet était SUJET, et
    //     les Restes sont un pluriel : le verbe ne pouvait pas s'accorder. Le
    //     mettre en complément ne suffisait pas non plus (« grâce à Restes » —
    //     il aurait fallu deviner l'article). On le pose donc en TÊTE, suivi
    //     de deux-points : un nom d'objet s'annonce, il ne se décline pas, et
    //     la phrase qui suit a pour sujet la créature, toujours singulière.
    //  🔑 C'est aussi le bon ordre pour le joueur : ce qu'il doit lire d'abord,
    //     c'est QUEL objet vient d'agir.
    tenuSoigne: { fr: "{quoi} : {nom} récupère {n} PV.",
                  en: "{quoi}: {nom} restored {n} HP." },
    //  Même forme, même raison.
    tenuGuerit: { fr: "{quoi} : {nom} se remet d'aplomb.",
                  en: "{quoi}: {nom} was cured." },
    //  Les trois derniers objets tenus. ⚠️ La griffe et la roche TIRENT AUX
    //  DÉS : sans une ligne, le joueur voit un tour d'ordre inversé et un coup
    //  qui apeure sans raison — c'est-à-dire un bug.
    viveGriffe: { fr: "{quoi} : {nom} bondit le premier !", en: "{quoi}: {nom} moved first!" },
    tenuApeure: { fr: "{quoi} : {nom} recule.", en: "{quoi}: {nom} flinched." },
    tenuRendPP: { fr: "{quoi} : {attaque} retrouve des points de pouvoir.",
                  en: "{quoi}: {attaque} regained PP." },
    // Le soin du dresseur d'en face. Trois lignes courtes : ce qu'il fait, ce
    // qu'il lui reste, et le moment où il n'a plus rien — c'est celui-là qu'on
    // attend, et il doit s'entendre.
    advSoigne: { fr: "Il emploie {quoi} sur {nom}.", en: "They use {quoi} on {nom}." },
    advReste: { fr: "Il lui en reste {n}.", en: "They have {n} left." },
    advVide: { fr: "Il n'en a plus.", en: "They have none left." },
    objetRanime: { fr: "{quoi} ranime {nom}.", en: "{quoi} revives {nom}." },
    objetRefuse: { fr: "Ça ne servirait à rien maintenant.", en: "That would do nothing right now." },
    sacVide: { fr: "SAC VIDE", en: "BAG EMPTY" },
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ÉTAT DU SOIGNÉ, DANS LE SAC — signalé par le propriétaire (16/08) :
    //  « quand on utilise une potion on ne voit pas la barre de vie de notre
    //  pokémon, donc on sait pas s'il lui reste des PV à soigner. »
    //  Le sac s'ouvre à la place des commandes, et sur téléphone la liste
    //  descend sous l'écran : la fiche du combattant sort du cadre AU MOMENT
    //  EXACT où l'on choisit un soin. Mesuré à 390 × 844, sac garni :
    //  l'écran de combat était à −105 px, entièrement au-dessus du regard.
    //  Deux réponses, et la seconde tient même hors de vue : la barre revient
    //  EN TÊTE du sac, et chaque soin annonce ce qu'il rendrait VRAIMENT.
    // ═══════════════════════════════════════════════════════════════════════
    sacManque: { fr: "{n} {n|PV manquant|PV manquants}", en: "{n} HP missing" },
    sacPlein: { fr: "au maximum", en: "at full HP" },
    // ⚠️ Le chiffre est celui du MOTEUR appliqué sur une copie, pas celui de la
    //    table : une Potion de 20 sur un blessé de 12 rend 12, et c'est ce
    //    nombre-là qui décide entre elle et la Super Potion.
    sacRendra: { fr: "rendra {n} PV", en: "restores {n} HP" },
    // La chance de prise, sur le bouton de la Ball. Elle bouge à chaque coup
    // porté et à chaque statut posé : c'est ainsi qu'elle enseigne la mécanique.
    // ⚠️ Le mot compte : « 16 % » seul, sur un bouton qui porte déjà « ×5 », se
    //    lit comme une quantité. « prise 16 % » ne se lit que d'une façon.
    chancePrise: { fr: "prise {n}", en: "catch {n}" },
    errantPart: { fr: "{nom} s'échappe et disparaît.", en: "{nom} breaks away and vanishes." },
    fuiteOk: { fr: "Tu prends la fuite.", en: "Got away safely!" },
    fuiteRatee: { fr: "Impossible de fuir !", en: "Can't escape!" },
    fuiteRefusee: { fr: "Impossible de fuir un combat de dresseurs !", en: "No! There's no running from a trainer battle!" },
    // Les deux familles rendues vivantes le 09/08 : sans phrase, un vol de
    // vie ressemble à un défaut d'affichage de la barre.
    vol: { fr: "{nom} absorbe l'énergie de son adversaire !",
           en: "{nom} sucked health from the foe!" },
    contrecoup: { fr: "{nom} est blessé par le contrecoup !",
                  en: "{nom} is hit by the recoil!" },
    recharge: { fr: "{nom} doit se recharger !", en: "{nom} must recharge!" },
    sacrifice: { fr: "{nom} se sacrifie dans l'explosion !", en: "{nom} blew up!" },
    // 🔴 CHAQUE CHARGE A SA RÉPLIQUE DANS LE ROM, et c'est ce qui la rend
    //    lisible : « il absorbe la lumière » dit pourquoi le tour est perdu,
    //    « il prépare son attaque » ne dit rien. Le moteur envoie la CLÉ de
    //    l'attaque ; le choix de la phrase reste ici, avec les autres textes.
    charge: { fr: "{nom} prépare son attaque !", en: "{nom} is charging!" },
    charge_SOLARBEAM: { fr: "{nom} absorbe la lumière !", en: "{nom} took in sunlight!" },
    charge_DIG: { fr: "{nom} creuse sous terre !", en: "{nom} burrowed underground!" },
    charge_FLY: { fr: "{nom} s'envole très haut !", en: "{nom} flew up high!" },
    charge_SKULL_BASH: { fr: "{nom} baisse la tête !", en: "{nom} lowered its head!" },
    // ⚠️ « intensément » RETIRÉ : le ROM dit « is glowing! », rien de plus, et
    //    l'anglais frère le disait déjà. Le français brodait là où la loi du
    //    mode est de suivre la source.
    charge_SKY_ATTACK: { fr: "{nom} se met à briller !", en: "{nom} is glowing!" },
    charge_RAZOR_WIND: { fr: "{nom} soulève un tourbillon !", en: "{nom} made a whirlwind!" },
    chargePerdue: { fr: "{nom} perd sa concentration !", en: "{nom} lost its focus!" },
    horsAtteinte: { fr: "{nom} est hors d'atteinte !", en: "{nom} is out of reach!" },
    ohko: { fr: "K.O. en un coup !", en: "It's a one-hit KO!" },
    ohkoTropLent: { fr: "{nom} n'est pas assez rapide !", en: "{nom} is not fast enough!" },
    coupsMultiples: { fr: "Touché {n} {n|fois|fois} !", en: "Hit {n} {n|time|times}!" },
    chute: { fr: "{nom} s'écrase au sol !", en: "{nom} kept going and crashed!" },
    jackpot: { fr: "Des pièces tombent au sol !", en: "Coins scattered everywhere!" },
    reveEveille: { fr: "{nom} ne dort pas !", en: "{nom} is not asleep!" },
    // Riposte : elle ne rend que ce qu'elle vient d'encaisser. Les deux issues
    // se disent, sinon le joueur croirait à un coup qui rate.
    riposteRend: { fr: "{nom} renvoie le coup !", en: "{nom} struck back!" },
    ripostePerdue: { fr: "{nom} n'a rien à renvoyer !", en: "{nom} had nothing to strike back at!" },
    etreinte: { fr: "{nom} est pris au piège !", en: "{nom} was trapped!" },
    etreint: { fr: "{nom} ne peut pas bouger !", en: "{nom} can't move!" },
    finEtreinte: { fr: "{nom} se libère !", en: "{nom} broke free!" },
    fureurFinie: { fr: "{nom} s'épuise à force de frapper !", en: "{nom} is worn out from thrashing!" },
    rageMonte: { fr: "La colère {de|nom} monte !", en: "{nom}'s rage is building!" },
    sEnfuit: { fr: "{nom} s'enfuit.", en: "{nom} fled!" },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE GESTE RETOUR, EN PLEIN COMBAT — signalé le 16/08 : « le bouton
    //  précédent renvoie sur la page d'accueil de Road to Legends ».
    //  🔴 ET LE COMBAT, LUI, N'EST PAS SAUVEGARDÉ : `voyageEcrire` ne garde
    //     qu'à la CARTE, exprès (« sauver en plein combat laisserait reprendre
    //     AVANT un coup perdu, ce qui est de la triche »). Un geste retour de
    //     travers — le plus facile à déclencher au pouce — coûtait donc le
    //     combat en cours, sans un mot.
    //  ⚠️ ON NE RAMÈNE PAS À LA CARTE : quitter un combat de dresseur à la
    //     demande, ce serait une fuite gratuite, et la fuite est une RÈGLE.
    //     On demande, et c'est tout : rester, ou sortir du mode.
    quitterDit: { fr: "Quitter le voyage ? Le combat en cours sera perdu.",
                  en: "Leave the journey? This battle will be lost." },
    quitterRester: { fr: "RESTER", en: "STAY" },
    quitterPartir: { fr: "QUITTER", en: "LEAVE" },
    // Actions
    aAttaquer: { fr: "ATTAQUE", en: "FIGHT" },
    aSac: { fr: "SAC", en: "BAG" },
    aEquipe: { fr: "ÉQUIPE", en: "POKÉMON" },
    aFuir: { fr: "FUITE", en: "RUN" },
    // ⚠️ ON NE FUIT PAS UN DRESSEUR — MAIS ON PEUT ABANDONNER. Devant un
    //    dresseur, la fuite est refusée par la règle du jeu ; ce bouton prend
    //    donc sa place pour offrir la seule sortie qui reste quand le combat
    //    est perdu et qu'on ne peut pas le fuir : déclarer forfait.
    aAbandonner: { fr: "ABANDONNER", en: "GIVE UP" },
    // ⚠️ « UN COMBAT DE DRESSEURS », pas « un dresseur » : même tournure que
    //    `fuiteRefusee`, et elle évite l'écueil du genre — « un dresseur » se
    //    lit comme un rôle qu'on prête au joueur, et `poke-genre` a raison de
    //    s'en méfier même quand, ici, il désigne l'adversaire.
    abandonDit: {
      fr: "On ne fuit pas un combat de dresseurs. Abandonner, c'est perdre : ton équipe tombe, et la moitié de ton argent avec.",
      en: "There's no fleeing a trainer battle. Giving up means losing: your team falls, and half your money with it.",
    },
    abandonOui: { fr: "J'ABANDONNE", en: "I GIVE UP" },
    abandonFait: { fr: "Tu jettes l'éponge.", en: "You throw in the towel." },
    retour: { fr: "RETOUR", en: "BACK" },
    lutter: { fr: "LUTTE", en: "STRUGGLE" },
    plusDePP: { fr: "Plus aucun point de pouvoir. Il ne reste que Lutte.", en: "No power points left. Only Struggle remains." },
    pp: { fr: "PP", en: "PP" },
    //  La catégorie de 1996 : elle suit le TYPE de l'attaque (Feu, Eau, Élec,
    //  Glace, Plante, Psy, Dragon frappent en Spécial ; tout le reste au
    //  physique). Le moteur l'applique depuis toujours — l'écran la dit.
    coupPhysique: { fr: "PHYSIQUE", en: "PHYSICAL" },
    coupSpecial: { fr: "SPÉCIAL", en: "SPECIAL" },
    personne: { fr: "Personne d'autre ne peut entrer.", en: "Nobody else can step in." },
    victoire: { fr: "Tu remportes le combat.", en: "You won the battle." },
    defaite: { fr: "Tu n'as plus de Pokémon en état de combattre.", en: "You have no more Pokémon that can fight." },
  };

  var STATS = {
    atk: { fr: "L'Attaque", en: "Attack" }, def: { fr: "La Défense", en: "Defense" },
    vit: { fr: "La Vitesse", en: "Speed" }, spe: { fr: "Le Spécial", en: "Special" },
    precision: { fr: "La Précision", en: "accuracy" }, esquive: { fr: "L'Esquive", en: "evasiveness" },
  };

  // 🔴 PORTE UNIQUE. Cette fonction substituait les variables elle-même — comme
  //    trois autres écrans — et court-circuitait donc l'accord en genre ET en
  //    nombre. Le corpus était juste, c'est la RÉSOLUTION qui différait d'un
  //    écran à l'autre : exactement « ce qui est recopié diverge », en six
  //    exemplaires. Tout passe désormais par `PokeGenre`.
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE FAIT UN COUP SANS PUISSANCE — DIT SUR LA CARTE
  //
  //  🔴 RELEVÉ EN JOUANT, SUR TÉLÉPHONE. La carte d'un coup montre son type,
  //     son nom, sa puissance et ses PP. Un coup de statut n'a PAS de
  //     puissance : la case reste vide, et « Mimi-Queue » ne dit rien à qui
  //     découvre le jeu. L'infobulle, elle, dit tout — mais sur téléphone
  //     l'appui qui l'ouvre JOUE AUSSI LE COUP. Mesuré : `touchstart` ouvre la
  //     bulle, le `click` qui suit lance l'attaque.
  //     ➜ **On ne pouvait pas lire un coup sans l'utiliser.** Sur l'écran le
  //     plus fréquent du jeu, et sur le support où il se joue le plus.
  //
  //  ⚠️ LA MOITIÉ DES PHRASES SE GÉNÈRE, et c'est ce qui rend la chose tenable :
  //     les effets de statistique suivent tous `<STAT>_UP1|UP2|DOWN1|DOWN2`.
  //     Une attaque neuve qui monte une Défense n'aura donc aucun texte à
  //     écrire. Seuls les effets nommés — dormir, empoisonner, soigner — ont
  //     leur mot, parce qu'aucun motif ne les décrit.
  //  ⚠️ EN GEN 1, `UP` VISE SOI ET `DOWN` VISE L'ADVERSAIRE. La phrase le dit
  //     par le possessif (« Ta Défense monte » contre « Sa Défense baisse ») :
  //     sans lui, le joueur ne sait pas qui subit, et c'est toute la décision.
  // ═══════════════════════════════════════════════════════════════════════════
  var STAT_COUP = { ATTACK: "atk", DEFENSE: "def", SPEED: "vit", SPECIAL: "spe",
                    ACCURACY: "precision", EVASION: "esquive" };
  var EFFET_MOT = {
    SLEEP_EFFECT: "cEndort", POISON_EFFECT: "cEmpoisonne",
    PARALYZE_EFFECT: "cParalyse", CONFUSION_EFFECT: "cConfus",
    HEAL_EFFECT: "cSoigne", LEECH_SEED_EFFECT: "cGraine",
    REFLECT_EFFECT: "cReflet", LIGHT_SCREEN_EFFECT: "cMur",
    MIST_EFFECT: "cBrume", HAZE_EFFECT: "cEfface",
    FOCUS_ENERGY_EFFECT: "cCritiques", BIDE_EFFECT: "cPatiente",
    DISABLE_EFFECT: "cBloque", MIMIC_EFFECT: "cCopie",
    SWITCH_AND_TELEPORT_EFFECT: "cFuit", SPECIAL_DAMAGE_EFFECT: "cFixe",
    CONVERSION_EFFECT: "cConversion", SUBSTITUTE_EFFECT: "cSubstitut",
    TRANSFORM_EFFECT: "cTransforme", SPLASH_EFFECT: "cRien",
    LEECH_LIFE_EFFECT: "cVampire", RECHARGE_EFFECT: "cRecharge",
  };
  function ditEffetCourt(a) {
    if (!a || a.puissance) return "";
    var m = /^([A-Z]+)_(UP|DOWN)([12])_EFFECT$/.exec(a.effet || "");
    if (m && STAT_COUP[m[1]]) {
      var cle = (m[2] === "UP" ? "cMonte" : "cBaisse") + (m[3] === "2" ? "2" : "");
      var nom = nomStatCoup(STAT_COUP[m[1]]);
      // 🔴 « SA ATTAQUE BAISSE » — vu en jouant, sur la carte de Rugissement.
      //    Le possessif français S'ÉLIDE devant une voyelle : « Son Attaque »,
      //    « Ton Esquive » — même au féminin, comme « son épée ». Un gabarit à
      //    possessif figé est faux une stat sur trois ; on le calcule sur la
      //    première lettre du nom, et l'anglais n'en a pas besoin.
      var voy = /^[aeéèêiouh]/i.test(nom);
      var poss = m[2] === "UP" ? (voy ? "possTonV" : "possTa") : (voy ? "possSonV" : "possSa");
      return '<span class="pkdx-coup-dit">' + esc(T(cle, { p: T(poss), stat: nom })) + "</span>";
    }
    var mot = EFFET_MOT[a.effet];
    return mot ? '<span class="pkdx-coup-dit">' + esc(T(mot)) + "</span>" : "";
  }
  function nomStatCoup(s) {
    var n = { atk: "sAtk", def: "sDef", vit: "sVit", spe: "sSpe",
              precision: "sPrecision", esquive: "sEsquive" }[s];
    return n ? T(n) : s;
  }

  function T(cle, vars) {
    return W.PokeGenre.pour(TXT, cle, vars, "combat");
  }

  var nomDe = function (mon) { return mon.surnom || ESP()[mon.n].nom[LANG()]; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // ── Le rendu d'un camp ─────────────────────────────────────────────────────
  //  🔴 LA VUE DE COMBAT : ton DOS et la FACE de l'adversaire. C'est la lecture
  //     d'un combat Pokémon, et c'est pour ça qu'on emploie les sprites
  //     d'époque plutôt que les artworks — l'artwork n'a pas de vue de dos.
  function sprite(mon, cote) {
    // `?i=` : un sprite remplacé sous la même adresse reste en cache, côté
    // navigateur ET côté Cloudflare. On bump à chaque retraitement.
    // 🔴 LE DOSSIER SUIT LE MONDE — voir `PokeSprites`. Écrit en dur ici, il
    //    montrait un cadre vide pour toute créature de Johto, sur l'écran le
    //    plus regardé du mode.
    return cote === "joueur" ? W.PokeSprites.dos(mon.n, "?i=6") : W.PokeSprites.face(mon.n, "?i=6");
  }

  function niveauPv(mon) {
    var part = mon.pv / mon.stats.pv;
    return part > 0.5 ? "haut" : part > 0.25 ? "moyen" : "bas";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA BARRE DE VIE, DANS LE SAC
  //
  //  🔴 LE SEUL ENDROIT OÙ LES PV DÉCIDENT, ET LE SEUL QUI NE LES MONTRAIT PAS.
  //     Le sac remplace les commandes ; sur téléphone sa liste descend sous le
  //     cadre du combat, et la fiche du combattant — nom, barre, chiffres —
  //     sort du regard AU MOMENT où l'on choisit un soin. C'est la même classe
  //     que le compte des Balls sur la fiche adverse : l'information existe,
  //     elle n'est pas là où la décision se prend.
  //  ⚠️ AUCUN COMPOSANT NEUF : `.pkdx-barre.pkdx-pv` est la barre du combat,
  //     `--part` et `data-niveau` se posent comme dans `monterCamp`. Une barre
  //     de plus, c'est une couleur de plus à faire diverger.
  //  ⚠️ ET C'EST LE MANQUE QU'ON NOMME, pas seulement les PV restants : la
  //     question du joueur n'est pas « combien lui reste-t-il » mais « y a-t-il
  //     quelque chose à rendre ».
  // ═══════════════════════════════════════════════════════════════════════════
  function etatDuSoigne(mon) {
    var d = W.document.createElement("div");
    d.className = "pkdx-sac-etat";
    var nom = W.document.createElement("b");
    nom.textContent = nomDe(mon);
    var barre = W.document.createElement("div");
    barre.className = "pkdx-barre pkdx-pv";
    barre.setAttribute("data-niveau", niveauPv(mon));
    var jauge = W.document.createElement("i");
    jauge.style.setProperty("--part", Math.max(0, mon.pv / mon.stats.pv));
    barre.appendChild(jauge);
    var chiffre = W.document.createElement("span");
    chiffre.className = "pkdx-chiffre";
    chiffre.textContent = mon.pv + " / " + mon.stats.pv;
    var manque = mon.stats.pv - mon.pv;
    var dit = W.document.createElement("span");
    dit.className = "pkdx-sac-manque";
    dit.textContent = manque > 0 ? T("sacManque", { n: manque }) : T("sacPlein");
    d.appendChild(nom);
    d.appendChild(barre);
    d.appendChild(chiffre);
    d.appendChild(dit);
    return d;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CAMP — MONTÉ UNE FOIS, MIS À JOUR ENSUITE
  //
  //  🔴 IL SE RECONSTRUISAIT ENTIÈREMENT À CHAQUE TOUR, et c'était la cause de
  //     « les animations des attaques ne semblent pas synchro », signalé par le
  //     propriétaire. Réécrire `innerHTML` DÉTRUIT le `<img>` et en crée un
  //     autre : le navigateur rejoue alors son animation d'entrée, qui part de
  //     `translateX(±120 %)`. À chaque tour, les deux créatures repartaient donc
  //     hors du cadre et re-glissaient pendant que le journal parlait des
  //     dégâts. Mesuré : le sprite du joueur était à x=200 pour un cadre qui
  //     commence à x=386 — soit 168 px × 1,2, la position de départ exacte.
  //
  //     Deux autres dégâts au passage, invisibles mais réels :
  //       · `hote.className = "pkdx-camp"` effaçait `est-ko`, donc la chute du
  //         Pokémon à terre était coupée net au rafraîchissement suivant ;
  //       · reconstruire la barre de vie remet son `<i>` à zéro, ce qui annule
  //         la transition de 600 ms en cours — la barre sautait au lieu de
  //         descendre.
  //
  //  L'entrée n'appartient donc plus au `<img>` mais à une classe posée UNE
  //  FOIS, au moment où la créature entre vraiment : début de combat, ou relais.
  // ═══════════════════════════════════════════════════════════════════════════
  function monterCamp(hote, mon, cote) {
    var e = ESP()[mon.n];
    hote.className = "pkdx-camp";
    hote.setAttribute("data-cote", cote);
    hote.innerHTML =
      '<div class="pkdx-fiche">' +
        "<b></b> " + '<span class="pkdx-niveau est-pastille"></span>' +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LE SEUL ÉCRAN OÙ LE TYPE DÉCIDE, ET LE SEUL QUI NE LE MONTRAIT
        //    PAS. La carte annonce les types de chaque rencontre, le Pokédex
        //    les affiche, l'écran d'arène aussi, le casino et la réserve
        //    depuis cette nuit — et le combat, où l'on choisit précisément une
        //    attaque CONTRE un type, laissait le joueur les deviner.
        //    Il fallait connaître les cent cinquante et une espèces par cœur,
        //    ou perdre. Ce n'est pas de la difficulté, c'est un savoir absent.
        // ═══════════════════════════════════════════════════════════════════
        '<span class="pkdx-fiche-types">' +
          e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
        '<div class="pkdx-barre pkdx-pv"><i></i></div>' +
        // Les points de vie ne s'affichent QUE de ton côté : c'est la règle du
        // jeu, et c'est ce qui rend la capture incertaine.
        (cote === "joueur" ? '<span class="pkdx-chiffre"></span>' : "") +
        '<span class="pkdx-statut-hote"></span>' +
        // Les paliers de statistique, quand il y en a. Voir `rendrePaliers`.
        '<span class="pkdx-paliers-hote"></span>' +
        // ═══════════════════════════════════════════════════════════════════
        //  COMBIEN IL EN RESTE — L'INFORMATION QUE LE JEU D'ORIGINE DONNE ET
        //  QUE NOUS AVIONS PERDUE
        //
        //  🔴 EN COMBAT DE DRESSEUR, ON NE SAVAIT PAS COMBIEN DE POKÉMON IL
        //     RESTAIT EN FACE. Le jeu de 1996 aligne des Balls au début du
        //     combat, et c'est ce qui permet de décider : garder ses soins ou
        //     tout dépenser, tenter la capture ou frapper. Sans ce compte, on
        //     joue chaque tour comme s'il pouvait être le dernier — ou comme
        //     s'il en restait cinq. Deux façons de se tromper.
        //  🔴 ET DE NOTRE CÔTÉ AUSSI : la fiche ne montre que le Pokémon actif.
        //     Savoir qu'il ne reste qu'un remplaçant change ce qu'on risque.
        //  ⚠️ RIEN CONTRE UN SAUVAGE. Il est seul, et aligner une Ball unique
        //     ferait croire à une équipe. Le compte ne s'affiche que là où il
        //     y a un choix à éclairer.
        // ═══════════════════════════════════════════════════════════════════
        '<span class="pkdx-restants" aria-hidden="true"></span>' +
      "</div>" +
      // ── LE CHROMATIQUE SE VOIT AVANT DE SE LIRE ────────────────────────────
      // 🔴 UNE CHANCE SUR 8192, ET IL FAUT LA RECONNAÎTRE EN UN CLIN D'ŒIL.
      //    L'attribut est posé sur l'IMAGE : c'est elle qu'on regarde. Le
      //    dire seulement dans le journal, c'est le rater quand on lit vite —
      //    et un joueur qui apprend APRÈS coup qu'il vient de laisser filer un
      //    chromatique ne rejoue pas, il ferme.
      // ⚠️ ET IL N'A JAMAIS ÉTÉ POSÉ. L'attribut s'insérait AVANT la fermeture
      //    du guillemet de `data-mon` : le navigateur lisait
      //    `data-mon="16 data-chromatique="` puis `oui""` comme un attribut à
      //    part. `img[data-chromatique]` ne correspondait donc jamais, et le
      //    halo doré — la chose la plus rare du jeu, une chance sur 8192 — n'a
      //    JAMAIS été affiché. Le `data-mon` était corrompu par-dessus le
      //    marché, si bien qu'un chromatique remontait son camp à chaque
      //    rafraîchissement.
      //    Trouvé en forçant les valeurs déterminantes dans le navigateur :
      //    l'attribut ressortait `null`. Aucune relecture ne l'aurait montré —
      //    une concaténation fausse se lit très bien.
      // 🔴 AUCUN FILET SUR LE SPRITE DU COMBAT. Deux QA ont vu la même chose :
      //    une image qui rate affiche l'icône cassée du navigateur AVEC son
      //    texte alternatif par-dessus le panneau de l'adversaire, et l'écran
      //    est défiguré. Chez eux la cause était le serveur local saturé — pas
      //    le jeu — mais l'enseignement tient : c'est l'écran le plus vu du
      //    mode, et il n'avait aucun repli. L'écran de départ, lui, en a un
      //    depuis toujours (`onerror` vers la face).
      //  ⚠️ `this.onerror = null` AVANT de changer la source : sans ça, un repli
      //     qui rate lui aussi boucle indéfiniment sur le même gestionnaire.
      //  ⚠️ La face est le bon repli : elle existe pour les 151 espèces, elle
      //     est déjà chargée ailleurs, et un Pokémon vu de face reste lisible.
      '<img class="est-entrant" alt="' + esc(e.nom[LANG()]) + '" data-mon="' + mon.n + '"' +
        " onerror=\"this.onerror=null;this.src='" + W.PokeSprites.face(mon.n) + "'\"" +
        (W.PokeEclat && W.PokeEclat.chromatique(mon.dv) ? ' data-chromatique="oui"' : "") +
        ' src="' + sprite(mon, cote) + '">';
    // L'entrée ne se joue qu'une fois : la classe part dès que l'animation est
    // finie, donc plus rien ne la relance.
    // ⚠️ La minuterie n'est pas une ceinture de plus, elle est NÉCESSAIRE :
    //    mesuré dans le navigateur, `animationend` n'était pas remonté sur ce
    //    `<img>` — la classe restait posée neuf cents millisecondes après une
    //    animation de trois cent quarante. Sans repli, un état « en train
    //    d'entrer » resterait vrai pour toujours.
    var img = hote.querySelector("img");
    var finie = function () { img.classList.remove("est-entrant"); };
    img.addEventListener("animationend", finie);
    W.setTimeout(finie, 400);

    // ── LA VOIX ARRIVE AVEC LA SILHOUETTE ────────────────────────────────────
    // 🔴 C'EST LE MOMENT LE PLUS RECONNAISSABLE DE POKÉMON, ET IL ÉTAIT MUET.
    //    L'événement `envoie` sonne bien — mais l'entrée en combat ne passe PAS
    //    par lui : les deux camps sont montés directement, sans événement. Le
    //    son était donc branché sur la seule entrée qui n'arrive jamais.
    //    Trouvé en jouant, pas en relisant : un cri absent ne fait aucun bruit.
    //
    //    Le cri part avec l'animation d'entrée, pas avant : une voix qui
    //    précède la silhouette se lit comme un décalage.
    if (W.PokeSon) W.setTimeout(function () { W.PokeSon.cri(mon.n); }, cote === "adverse" ? 120 : 260);

    // 🔴 ET IL S'ENTEND. Le scintillement de `SHOOTING_STAR` arrive APRÈS le
    //    cri : deux sons ensemble n'en font qu'un seul, confus. On regarde
    //    l'écran quand on entend quelque chose qu'on n'entend jamais.
    if (W.PokeSon && W.PokeEclat && W.PokeEclat.chromatique(mon.dv)) {
      W.setTimeout(function () { W.PokeSon.jouer("SHOOTING_STAR"); }, 620);
    }
  }

  function rendreCamp(hote, mon, cote) {
    // Un camp sans créature garde ce qu'il montre : l'effacer laisserait un
    // trou pendant la chute du Pokémon à terre.
    if (!hote || !mon) return;
    var img = hote.querySelector("img");
    // Une créature différente, c'est une ENTRÉE : on remonte le camp, et
    // l'animation d'entrée reprend son sens.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'IDENTITÉ ÉTAIT L'ESPÈCE, PAS L'INDIVIDU — et un remplaçant de la
    //     MÊME espèce restait donc INVISIBLE tout le reste du combat.
    //     `est-ko` n'est effacé que par `monterCamp` (qui réécrit la classe du
    //     camp), et la feuille fige l'image à `opacity: 0` en fin d'animation :
    //     un Aspicot tombe, un second Aspicot entre, `data-mon` ne bouge pas,
    //     le camp reste vide jusqu'à la fin. **101 équipes du jeu portent une
    //     espèce en double** (Agatha 94/42/93/24/94, Olga 95/107/106/95/68), et
    //     le camp du joueur est exposé pareil avec deux Rattata.
    //  ✅ ON LIT L'ÉTAT, PAS LA DÉCLARATION : si le camp AFFICHE un tombé alors
    //     que le Pokémon est debout, c'est forcément quelqu'un d'autre. La
    //     règle ne dépend plus d'un identifiant qui ne distingue pas deux
    //     individus — c'est la leçon du drapeau contre l'état, déjà payée deux
    //     fois dans ce dossier.
    // ═══════════════════════════════════════════════════════════════════════
    var campMort = hote.classList.contains("est-ko") || hote.classList.contains("est-happe");
    if (!img || img.getAttribute("data-mon") !== String(mon.n) || (campMort && mon.pv > 0)) {
      monterCamp(hote, mon, cote);
    }
    var fiche = hote.querySelector(".pkdx-fiche");
    fiche.querySelector("b").textContent = nomDe(mon);
    fiche.querySelector(".pkdx-niveau").textContent = W.PokeGenre.niveau(mon.niveau);
    var barre = fiche.querySelector(".pkdx-pv");
    barre.setAttribute("data-niveau", niveauPv(mon));
    barre.firstChild.style.setProperty("--part", Math.max(0, mon.pv / mon.stats.pv));
    var chiffre = fiche.querySelector(".pkdx-chiffre");
    if (chiffre) chiffre.textContent = mon.pv + " / " + mon.stats.pv;
    // Le statut vit dans son propre hôte : on ne réécrit que lui, donc le reste
    // de la fiche ne bouge pas et l'infobulle des autres éléments survit.
    fiche.querySelector(".pkdx-statut-hote").innerHTML = mon.statut
      ? '<span class="pkdx-statut" data-statut="' + mon.statut + '" data-info="statut" data-info-val="' +
        mon.statut + '" tabindex="0">' + abrege(mon.statut) + "</span>"
      : "";
  }

  // Les statuts s'affichent comme dans le jeu : trois lettres, pas une icône.
  var ABREGE = {
    fr: { para: "PAR", brulure: "BRU", gel: "GEL", sommeil: "SOM", poison: "PSN", poisonGrave: "PSN" },
    en: { para: "PAR", brulure: "BRN", gel: "FRZ", sommeil: "SLP", poison: "PSN", poisonGrave: "PSN" },
  };
  function abrege(s) { return (ABREGE[LANG()] || ABREGE.fr)[s] || ""; }

  // ── La mise en mots d'un événement ─────────────────────────────────────────
  //  🔴 UN ÉVÉNEMENT NON TRAITÉ NE DOIT PAS SE TAIRE. S'il ne rend rien, il est
  //     signalé dans la console : un combat où il se passe quelque chose sans
  //     qu'une ligne le dise, c'est la classe de défaut n°1 du projet.
  var NON_DITS = {};

  // Le rang qui PART sur un changement : `rappelle` et `envoie` le portent tous
  //  les deux sous `de`. Un vieux `envoie` sans `de` (rejeu enregistré avant le
  //  15/08) rend `null` — on retombe alors sur l'actif, comme avant.
  function rangQuiPart(ev) {
    if (ev.t !== "rappelle" && ev.t !== "envoie") return null;
    return typeof ev.de === "number" ? ev.de : null;
  }

  // Le rang qui ENTRE : `rappelle` le nomme `vers`, `envoie` le nomme `index`.
  function rangQuiEntre(ev) {
    var r = ev.t === "rappelle" ? ev.vers : ev.t === "envoie" ? ev.index : null;
    return typeof r === "number" ? r : null;
  }

  // On rembobine : le rang de départ d'un camp est celui que dit son PREMIER
  // changement. Un camp qui ne change pas de la liste garde son actif.
  function rangsAuDebut(evenements, etat) {
    var rangs = { joueur: etat.joueur.actif, adverse: etat.adverse.actif };
    var fige = {};
    for (var i = 0; i < evenements.length; i++) {
      var ev = evenements[i];
      var c = ev.cote;
      if ((c !== "joueur" && c !== "adverse") || fige[c]) continue;
      if (ev.t !== "rappelle" && ev.t !== "envoie") continue;
      // Le premier changement du camp fait foi, même muet : au-delà, les rangs
      // ont déjà bougé et un `de` plus tardif ne dit plus le DÉBUT de la liste.
      fige[c] = true;
      var de = rangQuiPart(ev);
      if (de !== null) rangs[c] = de;
    }
    return rangs;
  }

  function avancerRangs(rangs, ev) {
    if (ev.cote !== "joueur" && ev.cote !== "adverse") return;
    var vers = rangQuiEntre(ev);
    if (vers !== null) rangs[ev.cote] = vers;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LE TOUR EST MIS EN MOTS QUAND IL EST DÉJÀ FINI. `jouerTour` résout le
  //    tour ENTIER puis rend sa liste d'événements ; l'écran ne la traduit
  //    qu'après. Tant que personne ne change de Pokémon, lire l'ACTIF suffit.
  //    Dès qu'un camp en change — et le camp adverse en change TOUJOURS après
  //    un K.O., à la fin du même tour — l'actif lu ici est le REMPLAÇANT, et
  //    toutes les lignes de ce camp nomment la mauvaise créature. Rapport de
  //    joueur du 15/08 : « Machoc est K.O. ! » pendant qu'Ortide tombe à
  //    l'écran, puis « le dresseur envoie Machoc ». Le sprite, lui, était
  //    juste : `animer` redessine le camp SUR l'événement `envoie`. Le jeu
  //    montrait juste et il DISAIT faux.
  // 🔑 `rangs` EST LE CURSEUR DU RÉCIT : le rang réellement en piste au moment
  //    de CET événement, avancé par la boucle d'empilement à chaque `rappelle`
  //    et chaque `envoie`. On ne fige aucun nom dans le moteur — le journal du
  //    rejeu ne bouge pas d'un événement.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 `qui` VOYAGE EN PARAMÈTRE, JAMAIS DANS `etat`. Le nom du dresseur d'en
  //    face est du DÉCOR : le serveur rejoue `etat`, et tout ce qu'on y pose
  //    devient du contrat de rejeu. La loi du mode sépare le NOYAU des ÉCRANS.
  function phrases(ev, etat, qui, rangs) {
    var lignes = [];
    var mon = function (cote) {
      var equipe = etat[cote] && etat[cote].equipe;
      var r = rangs ? rangs[cote] : null;
      if (equipe && typeof r === "number" && equipe[r]) return equipe[r];
      return W.PokeCombat.actif(etat[cote]);
    };
    var n = function (cote) { return nomDe(mon(cote)); };

    switch (ev.t) {
      case "utilise": lignes.push(T("utilise", { nom: n(ev.cote), attaque: ATT()[ev.attaque].nom[LANG()] })); break;
      case "degats":
        if (ev.critique) lignes.push(T("critique"));
        if (ev.efficacite > 1) lignes.push(T("superEfficace"));
        else if (ev.efficacite < 1 && ev.efficacite > 0) lignes.push(T("peuEfficace"));
        break;
      case "sansEffet": lignes.push(T("sansEffet", { nom: n(ev.cote) })); break;
      case "rate": lignes.push(T("rate", { nom: n(ev.cote) })); break;
      case "ko": lignes.push(T("ko", { nom: n(ev.cote) })); break;
      case "vol": lignes.push(T("vol", { nom: n(ev.cote) })); break;
      case "contrecoup": lignes.push(T("contrecoup", { nom: n(ev.cote) })); break;
      case "recharge": lignes.push(T("recharge", { nom: n(ev.cote) })); break;
      case "sacrifice": lignes.push(T("sacrifice", { nom: n(ev.cote) })); break;
      case "charge":
        // La réplique propre à l'attaque si elle existe, la générale sinon :
        // une charge neuve parle donc dès son premier tour.
        lignes.push(T(TXT["charge_" + ev.attaque] ? "charge_" + ev.attaque : "charge",
                      { nom: n(ev.cote) }));
        break;
      case "chargePerdue": lignes.push(T("chargePerdue", { nom: n(ev.cote) })); break;
      case "horsAtteinte": lignes.push(T("horsAtteinte", { nom: n(ev.cote) })); break;
      case "ohko": lignes.push(T("ohko")); break;
      case "ohkoTropLent": lignes.push(T("ohkoTropLent", { nom: n(ev.cote) })); break;
      case "coupsMultiples": lignes.push(T("coupsMultiples", { n: ev.n })); break;
      case "chute": lignes.push(T("chute", { nom: n(ev.cote) })); break;
      case "jackpot": lignes.push(T("jackpot")); break;
      case "reveEveille": lignes.push(T("reveEveille", { nom: n(ev.cote) })); break;
      case "riposteRend": lignes.push(T("riposteRend", { nom: n(ev.cote) })); break;
      case "ripostePerdue": lignes.push(T("ripostePerdue", { nom: n(ev.cote) })); break;
      case "etreinte": lignes.push(T("etreinte", { nom: n(ev.cote) })); break;
      case "etreint": lignes.push(T("etreint", { nom: n(ev.cote) })); break;
      case "finEtreinte": lignes.push(T("finEtreinte", { nom: n(ev.cote) })); break;
      case "fureurFinie": lignes.push(T("fureurFinie", { nom: n(ev.cote) })); break;
      case "rageMonte": lignes.push(T("rageMonte", { nom: n(ev.cote) })); break;
      //  🔑 CHAQUE CAMP GARDE SA FORMULE. « Go ! » est ce qu'on crie à son
      //     propre Pokémon, jamais à celui d'en face — et depuis que l'entrée
      //     en jeu passe par une porte unique, c'est le JOUEUR aussi qui
      //     envoie par cet événement-là, après un K.O.
      //  ⚠️ ET LE SURNOM SURVIT. Du côté du joueur on nomme la CRÉATURE, pas
      //     l'espèce : un Pokémon surnommé s'annonce par son surnom, sinon
      //     l'écran renomme la bête du joueur au pire moment, celui où elle
      //     entre pour remplacer un mort.
      case "envoie":
        lignes.push(ev.cote === "joueur"
          ? T("envoiJoueur", { nom: nomDe(etat.joueur.equipe[ev.index]) })
          : qui
            ? T("envoiAdverseQui", { qui: qui, nom: ESP()[ev.n].nom[LANG()] })
            : T("envoiAdverse", { nom: ESP()[ev.n].nom[LANG()] }));
        break;
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 IL LISAIT TOUJOURS L'ÉQUIPE DU JOUEUR. `ev.de` est un rang dans
      //     l'équipe DU CAMP QUI SE REPLIE : quand c'est l'adversaire qui
      //     rappelle — ce que la politique de duel fait —, la ligne allait
      //     chercher le Pokémon du JOUEUR au même rang et annonçait « Carapuce,
      //     reviens ! » pendant que l'autre camp changeait. Un journal qui
      //     nomme la mauvaise créature est pire que muet : on croit avoir vu.
      //  🔴 ET LE REMPLAÇANT N'ÉTAIT NOMMÉ NULLE PART. On lisait « X, reviens ! »
      //     puis directement le coup adverse — le jeu de 1996 dit « Go, Y ! »,
      //     et c'est cette phrase qui explique QUI encaisse le coup suivant.
      //     La ligne se compose ICI, jamais dans le moteur : le journal du
      //     rejeu ne bouge pas d'un événement.
      // ═══════════════════════════════════════════════════════════════════════
      case "rappelle": {
        var adv = ev.cote === "adverse";
        var banc = etat[adv ? "adverse" : "joueur"].equipe;
        if (banc[ev.de]) lignes.push(T("rappelle", { nom: nomDe(banc[ev.de]) }));
        //  ⚠️ Et chaque camp garde SA formule : « Go ! » est ce qu'on crie à son
        //     propre Pokémon, jamais à celui d'en face. Les deux existaient déjà
        //     pour l'entrée après un K.O. ; on réemploie, on ne réécrit pas.
        if (banc[ev.vers]) {
          var nomEntrant = nomDe(banc[ev.vers]);
          lignes.push(adv
            ? (qui ? T("envoiAdverseQui", { qui: qui, nom: nomEntrant })
                   : T("envoiAdverse", { nom: nomEntrant }))
            : T("envoiJoueur", { nom: nomEntrant }));
        }
        break;
      }
      case "statut": lignes.push(T("statut_" + ev.statut, { nom: n(ev.cote) })); break;
      case "statutImmune": lignes.push(T("statutImmune", { nom: n(ev.cote) })); break;
      case "statutRefuse": lignes.push(T("statutRefuse", { nom: n(ev.cote) })); break;
      case "usure": lignes.push(T("usure_" + ev.statut, { nom: n(ev.cote) })); break;
      // La graine rend au buveur : la ligne DIT le montant, parce que c'est lui
      // qui explique une barre qui remonte.
      case "graineRend": lignes.push(T("graineRend", { nom: n(ev.cote), n: ev.pv || 0 })); break;
      case "bueeLeve": lignes.push(T("bueeLeve", { nom: n(ev.cote) })); break;
      case "dort": case "reveil": case "gele": case "degel": case "peur":
      case "confusion": case "confusTient": case "confus": case "finConfusion":
      // Les effets réparés le 07/08 : ceux qui ne nomment qu'un Pokémon.
      case "soin": case "repos": case "trempette": case "buee": case "brume":
      case "murLumiere": case "protection": case "puissance": case "graine":
      case "graineDraine": case "clone": case "cloneEncaisse": case "cloneCasse":
      case "finEntrave": case "conversion": case "morphing": case "patience":
      case "patienceRend": case "patienceVide": case "pleinePara": case "brumeProtege":
      case "cloneTient":
        lignes.push(T(ev.t, { nom: n(ev.cote) })); break;
      // Un refus n'a pas de porteur : il ne nomme personne.
      case "replisRefuse":
        lignes.push(T(ev.t)); break;
      // Et ceux qui nomment aussi une ATTAQUE — la ligne doit la dire, sinon le
      // joueur voit « Le doigt s'agite… » sans savoir ce qui est sorti.
      case "entrave": case "entraveBloque": case "copie": case "imite": case "metronome":
      case "bis": case "gribouille": case "bisRefuse": case "gribouilleDeja":
      case "blablaDodo":
        lignes.push(T(ev.t, {
          nom: n(ev.cote),
          attaque: ATT()[ev.attaque] ? ATT()[ev.attaque].nom[LANG()] : ev.attaque,
        }));
        break;
      case "palier": {
        var st = STATS[ev.stat] ? STATS[ev.stat][LANG()] : ev.stat;
        if (ev.bloque) lignes.push(T("palierBloque", { nom: n(ev.cote), stat: st }));
        else if (ev.delta >= 2) lignes.push(T("palierHausse2", { nom: n(ev.cote), stat: st }));
        else if (ev.delta > 0) lignes.push(T("palierHausse", { nom: n(ev.cote), stat: st }));
        else if (ev.delta <= -2) lignes.push(T("palierBaisse2", { nom: n(ev.cote), stat: st }));
        else lignes.push(T("palierBaisse", { nom: n(ev.cote), stat: st }));
        break;
      }
      case "ball":
        lignes.push(T("lance", { ball: nomBall(ev.ball) }));
        lignes.push(ev.pris ? T("pris", { nom: n("adverse") }) : T("echappe" + ev.secousses));
        break;
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LE SOIN DE L'ADVERSAIRE SE DIT, ET IL DIT COMBIEN IL LUI EN RESTE.
      //    Une barre de vie qui remonte sans un mot se lit comme un bug ; et
      //    savoir qu'il n'a plus qu'une potion change la façon dont on joue
      //    les trois tours suivants. C'est la loi du mode : ce que le jeu
      //    sait, il le dit.
      // ═══════════════════════════════════════════════════════════════════
      case "objetAdverse": {
        var objAdv = W.PokeRegles ? W.PokeRegles.nomObjet(ev.objet) : ev.objet;
        lignes.push(T("advSoigne", { quoi: objAdv, nom: n("adverse") }));
        if (ev.reste > 0) lignes.push(T("advReste", { n: ev.reste }));
        else lignes.push(T("advVide"));
        break;
      }
      case "objet": {
        var nomObj = W.PokeRegles ? W.PokeRegles.nomObjet(ev.objet) : ev.objet;
        // ⚠️ `nomCible`, PAS `qui` : `qui` est le troisième PARAMÈTRE de cette
        //    fonction, et `var` ne crée pas de nouvelle liaison — c'était donc
        //    une ÉCRITURE dessus. Aucun bug aujourd'hui (un seul `case`
        //    s'exécute par appel), mais le jour où un cas combine un objet et
        //    un envoi, le nom du dresseur devient un nom de Pokémon, en silence.
        var nomCible = nomDe(etat.joueur.equipe[ev.cible]);
        if (ev.ranime) lignes.push(T("objetRanime", { quoi: nomObj, nom: nomCible }));
        else if (ev.soigne) lignes.push(T("objetSoigne", { quoi: nomObj, nom: nomCible, n: ev.soigne }));
        // 🔴 UN OBJET DE STATISTIQUE NE « GUÉRIT » RIEN. Il tombait dans la
        //    ligne des soins — « Attaque + guérit Roucool » — ce qui décrit un
        //    effet qui n'existe pas. Ce qu'il fait, c'est l'événement `palier`
        //    juste après, qui le dit déjà.
        else if (W.PokeCombat.OBJETS_STAT && W.PokeCombat.OBJETS_STAT[ev.objet]) {
          lignes.push(T("objetEmploie", { quoi: nomObj, nom: nomCible }));
        } else lignes.push(T("objetGuerit", { quoi: nomObj, nom: nomCible }));
        break;
      }
      case "objetRefuse": lignes.push(T("objetRefuse")); break;
      case "ballRefusee": lignes.push(T("ballRefusee")); break;
      case "fuite": lignes.push(ev.reussi ? T("fuiteOk") : T("fuiteRatee")); break;
      // 🔴 CE N'EST PAS LE JOUEUR QUI FUIT, C'EST LA BÊTE. Sans cette ligne,
      //    l'adversaire disparaissait sans un mot au bout de trois tours — et
      //    ça se lit comme un bug, pas comme une mécanique. Relevé par
      //    `poke-coherence` : « le jeu sait et ne dit pas ».
      case "fuiteErrant": lignes.push(T("errantPart", { nom: ESP()[ev.n].nom[LANG()] })); break;
      //  Le nom de l'objet vient de la TABLE du jeu de règles, jamais d'ici :
      //  Johto renumérote ses objets, et un nom recopié dériverait.
      //  La météo : trois clés, trois phrases. Le nom vient de la donnée.
      case "meteo":
        lignes.push(T(ev.cle === "pluie" ? "meteoPluie" : ev.cle === "zenith" ? "meteoZenith" : "meteoSable"));
        break;
      case "meteoFinit":
        lignes.push(T(ev.cle === "pluie" ? "meteoFinPluie" : ev.cle === "zenith" ? "meteoFinZenith" : "meteoFinSable"));
        break;
      case "meteoRonge": lignes.push(T("meteoRonge", { nom: nomDe(mon(ev.cote)) })); break;
      //  Les quatre effets sans tirage. Chacun a sa phrase, et le refus aussi :
      //  un coup qui échoue en silence se lit comme un bug.
      case "maledictionPaye": lignes.push(T("maledictionPaye", { nom: nomDe(mon(ev.cote)) })); break;
      case "maledictionPose": lignes.push(T("maledictionPose", { nom: nomDe(mon(ev.cote)) })); break;
      case "maledictionRonge": lignes.push(T("maledictionRonge", { nom: nomDe(mon(ev.cote)) })); break;
      case "glasDeSoin":
        lignes.push(ev.soignes > 0 ? T("glasDeSoin", { n: ev.soignes }) : T("glasDeSoinRien"));
        break;
      case "bideEnVrac": lignes.push(T("bideEnVrac", { nom: nomDe(mon(ev.cote)) })); break;
      case "bideRefuse": lignes.push(T("bideEnVracRefuse", { nom: nomDe(mon(ev.cote)) })); break;
      case "partage": lignes.push(T("partage")); break;
      //  Les six derniers. `quoi` dit LAQUELLE des deux gardes : un seul
      //  événement pour deux coups qui partagent leur compteur, comme le ROM.
      case "garde":
        lignes.push(T(ev.quoi === "tenacite" ? "tenacitePose" : "abriPose", { nom: nomDe(mon(ev.cote)) }));
        break;
      case "gardeCede":
        lignes.push(T(ev.quoi === "tenacite" ? "tenaciteCede" : "abriCede", { nom: nomDe(mon(ev.cote)) }));
        break;
      case "abriTient": lignes.push(T("abriTient", { nom: nomDe(mon(ev.cote)) })); break;
      case "tenaciteTient": lignes.push(T("tenaciteTient", { nom: nomDe(mon(ev.cote)) })); break;
      case "depit":
        lignes.push(T("depit", {
          nom: nomDe(mon(ev.cote)), n: ev.pp,
          attaque: ATT()[ev.attaque] ? ATT()[ev.attaque].nom[LANG()] : ev.attaque,
        }));
        break;
      case "bisFinit": lignes.push(T("bisFinit", { nom: nomDe(mon(ev.cote)) })); break;
      case "voileMiroirRend": lignes.push(T("voileMiroirRend")); break;
      case "voileMiroirPerdu": lignes.push(T("voileMiroirPerdu", { nom: nomDe(mon(ev.cote)) })); break;
      case "rienAPrendre": {
        var _rp = { depit: "rienAPrendreDepit", bis: "rienAPrendreBis",
                    gribouille: "rienAPrendreGribouille",
                    conversionDeux: "rienAPrendreConversion",
                    blablaDodo: "rienAPrendreBlabla" }[ev.quoi];
        if (_rp) lignes.push(T(_rp, { nom: nomDe(mon(ev.cote)) }));
        break;
      }
      case "bisDeja": lignes.push(T("bisDeja", { nom: nomDe(mon(ev.cote)) })); break;
      // ═══════════════════════════════════════════════════════════════════════
      //  LES ONZE DERNIERS DE JOHTO
      //
      //  🔑 CEUX QUI NE NOMMENT QUE LE PORTEUR passent tous par la même ligne :
      //     ajouter un `case` à cette liste est le geste le moins coûteux du
      //     fichier, et c'est ce qui fait qu'un effet neuf n'arrive jamais muet.
      // ═══════════════════════════════════════════════════════════════════════
      case "attraction": case "attractionDeja": case "attractionMemeSexe":
      case "attractionSansSexe": case "amoureux": case "amourImmobilise":
      case "cauchemar": case "cauchemarDeja": case "cauchemarEveille":
      case "cauchemarRonge": case "cauchemarFinit":
      case "vantardiseDeja": case "prescience": case "prescienceTombe":
      case "blablaEveille":
        lignes.push(T(ev.t, { nom: nomDe(mon(ev.cote)) })); break;
      //  Ceux qui ne nomment personne : le sol, la menace.
      case "prescienceDeja": case "conversionSansAbri":
        lignes.push(T(ev.t)); break;
      //  🔴 UN PIÈGE PORTE SA CLÉ, comme les drapeaux à durée : un seul
      //     événement, autant de phrases qu'il y a de pièges, et une clé
      //     inconnue ne dit rien plutôt que n'importe quoi.
      case "piegePose": case "piegeDeja": case "piege": case "piegeEpargne": {
        var _pg = { picots: { piegePose: "picotsPose", piegeDeja: "picotsDeja",
                              piege: "picotsMord", piegeEpargne: "picotsVole" } }[ev.cle];
        if (_pg && _pg[ev.t]) lignes.push(T(_pg[ev.t], { nom: nomDe(mon(ev.cote)) }));
        break;
      }
      //  ⚠️ ZÉRO COPIÉ A SA PROPRE PHRASE. « {nom} copie l'état de son
      //     adversaire » devant deux adversaires vierges de tout palier serait
      //     un mensonge poli — le joueur a payé son tour et doit savoir que le
      //     coup arrive trop tôt.
      case "copiePaliers":
        lignes.push(T(ev.change ? "copiePaliers" : "copiePaliersRien",
                      { nom: nomDe(mon(ev.cote)) })); break;
      case "conversionDeux":
        lignes.push(T("conversionDeux", {
          nom: nomDe(mon(ev.cote)),
          type: (TYPES_NOMS()[ev.type] || {})[LANG()] || ev.type,
        })); break;
      //  Les drapeaux à durée. Un seul événement, cinq phrases : c'est la CLÉ
      //  qui dit laquelle, et une clé inconnue ne dit rien plutôt que n'importe
      //  quoi.
      case "drapeau": {
        var _dp = { rune: "runePose", regard: "regardPose", requiem: "requiemPose",
                    clairvoyance: "clairvoyancePose", lienDestin: "lienDestinPose",
                    relais: "relaisPose", verrou: "verrouPose" }[ev.cle];
        if (_dp) lignes.push(T(_dp, { nom: nomDe(mon(ev.cote)) }));
        break;
      }
      case "relais": lignes.push(T("relais")); break;
      case "runeProtege": lignes.push(T("runeProtege", { nom: nomDe(mon(ev.cote)) })); break;
      case "runeFinit": lignes.push(T("runeFinit")); break;
      case "requiem": lignes.push(T("requiem", { n: ev.reste })); break;
      case "requiemTombe": lignes.push(T("requiemTombe", { nom: nomDe(mon(ev.cote)) })); break;
      case "tenuSoigne":
        lignes.push(T("tenuSoigne", { quoi: nomObjet(ev.objet), n: ev.soin, nom: nomDe(mon(ev.cote)) }));
        break;
      case "viveGriffe":
        //  L'objet n'est pas porté par l'événement : il est dans la main de
        //  celui qui vient de passer devant, et c'est là qu'on le lit.
        lignes.push(T("viveGriffe", { quoi: nomObjet(mon(ev.cote).objet), nom: nomDe(mon(ev.cote)) }));
        break;
      case "tenuApeure":
        lignes.push(T("tenuApeure", { quoi: nomObjet(ev.objet), nom: nomDe(mon(ev.cote)) }));
        break;
      case "tenuRendPP":
        lignes.push(T("tenuRendPP", {
          quoi: nomObjet(ev.objet),
          attaque: ATT()[ev.attaque] ? ATT()[ev.attaque].nom[LANG()] : ev.attaque,
        }));
        break;
      case "tenuGuerit":
        lignes.push(T("tenuGuerit", { quoi: nomObjet(ev.objet), nom: nomDe(mon(ev.cote)) }));
        break;
      case "fuiteRefusee": lignes.push(T("fuiteRefusee")); break;
      case "abandon": lignes.push(T("abandonFait")); break;
      default:
        NON_DITS[ev.t] = (NON_DITS[ev.t] || 0) + 1;
        if (W.console && W.console.warn) W.console.warn("[poke] événement sans texte : " + ev.t);
    }
    return lignes;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TOUT UN TOUR MIS EN MOTS — la seule entrée, pour l'écran comme pour la
  //  mesure. `tools/poke-nomme-qui-tombe.mjs` appelle CECI, pas une copie du
  //  curseur : un contrôle qui rejoue sa propre version de la boucle ne prouve
  //  rien de la boucle qui tourne chez le joueur.
  //  Rend un tableau de tableaux : `dites[i]` = les lignes de `evenements[i]`.
  // ═══════════════════════════════════════════════════════════════════════════
  function mettreEnMots(evenements, etat, qui) {
    var rangs = rangsAuDebut(evenements, etat);
    var dites = [];
    for (var i = 0; i < evenements.length; i++) {
      dites.push(phrases(evenements[i], etat, qui, rangs));
      avancerRangs(rangs, evenements[i]);
    }
    return dites;
  }

  var NOMS_BALL = {
    POKE_BALL: { fr: "Poké Ball", en: "Poké Ball" }, GREAT_BALL: { fr: "Super Ball", en: "Great Poké Ball" },
    ULTRA_BALL: { fr: "Hyper Ball", en: "Ultra Poké Ball" }, MASTER_BALL: { fr: "Master Ball", en: "Master Ball" },
    SAFARI_BALL: { fr: "Poké Ball Safari", en: "Safari Ball" },
  };
  function nomBall(c) { return (NOMS_BALL[c] || { fr: c, en: c })[LANG()]; }

  // 🔴 UN POURCENTAGE QUI AFFICHE « 0 % » SUR UNE CHANCE RÉELLE MENT. Mewtwo à
  //    la Poké Ball pleine vie tombe sous le demi-point : arrondi bêtement, le
  //    bouton annonce l'impossible et le joueur ne lance jamais — alors que la
  //    porte est ouverte. Plancher à « <1 % », donc, et plafond symétrique à
  //    « >99 % » : une chance de 99,6 % arrondie à 100 promettrait une certitude
  //    qui n'en est pas une, et c'est la promesse qu'on n'oublie pas quand elle
  //    casse.
  // ⚠️ « 100 % » EXISTE POURTANT, et il est vrai : un sauvage commun descendu au
  //    rouge est une prise ACQUISE en première génération, la Master Ball n'a
  //    pas l'exclusivité. Vérifié à l'écran — un Rattata passe de 34 % à 100 %
  //    en un coup. C'est la mécanique de 1996, et l'afficher l'enseigne.
  function pourCent(p) {
    if (p >= 1) return "100 %";
    if (p > 0.99) return ">99 %";
    if (p <= 0) return "0 %";
    if (p < 0.01) return "<1 %";
    return Math.round(p * 100) + " %";
  }

  // ── L'écran ────────────────────────────────────────────────────────────────
  function Ecran(hote, etat, options) {
    this.hote = hote;
    this.etat = etat;
    this.opt = options || {};
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN COMBAT SANS GRAINE NE PLANTE PAS ICI — IL PLANTE TROIS APPELS PLUS
    //    LOIN. Sans `hasard`, l'écran se monte, les sprites s'affichent, les
    //    boutons répondent, et c'est au PREMIER coup porté que `choixAdverse`
    //    lit `.dans` sur un `undefined`. Le journal de la console garde la
    //    trace de ce plantage : `TypeError: Cannot read properties of
    //    undefined (reading 'dans')`, à l'intérieur du moteur, alors que la
    //    faute est à la construction de l'écran.
    // 🔴 ET LA CAUSE EST INTROUVABLE DEPUIS LA PILE D'APPELS, parce que le
    //    tour ne sait pas d'où il vient. On refuse donc au montage, en nommant
    //    la faute — c'est la seule seconde où elle est encore lisible.
    // ═══════════════════════════════════════════════════════════════════════
    if (!this.opt.hasard || typeof this.opt.hasard.dans !== "function") {
      throw new Error("[poke] écran de combat monté sans `hasard` : le premier coup planterait dans le moteur.");
    }
    this.file = [];
    this.enCours = false;
    this.minuteursCapture = [];
    this.monter();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES REMPLAÇANTS ARRIVENT AVEC LEUR IMAGE — 11/08/2026
  //
  //  🔴 CE QUE ÇA RÉPARE. Le sprite d'un Pokémon n'était demandé qu'au moment
  //     où il ENTRE — au relais, ou quand l'adversaire envoie le suivant. Or
  //     l'entrée est une animation qui part immédiatement de `translateX(±120 %)`
  //     : sur une connexion lente, la créature glisse en scène pendant que son
  //     image est encore en vol, et le joueur voit une case vide traverser
  //     l'arène. Personne ne le signalerait — ça ressemble à un défaut d'écran.
  //  ⚠️ LE PRIX EST DÉRISOIRE, ET C'EST CE QUI TRANCHE : mesuré, un sprite de
  //     face pèse 731 octets en moyenne, un sprite de dos 301. Les douze
  //     participants d'un combat tiennent dans SIX kilo-octets — moins qu'une
  //     seule illustration du Pokédex.
  //  ⚠️ Aucun tirage, aucun DOM, aucune mise en page : `new Image()` ne fait
  //     que remplir le cache du navigateur. Le contrat de rejeu ne bouge pas.
  // ═══════════════════════════════════════════════════════════════════════════
  Ecran.prototype.prechargerLesSprites = function () {
    if (!W.Image) return;
    var cotes = [["joueur", this.etat.joueur], ["adverse", this.etat.adverse]];
    for (var c = 0; c < cotes.length; c++) {
      var equipe = (cotes[c][1] && cotes[c][1].equipe) || [];
      for (var i = 0; i < equipe.length; i++) {
        var im = new W.Image();
        im.src = sprite(equipe[i], cotes[c][0]);
      }
    }
  };

  Ecran.prototype.monter = function () {
    this.hote.innerHTML =
      '<div class="pkdx-combat">' +
        // ═══ L'ÉCRAN DU GAME BOY EN ENTIER — 160 × 144 (chantier 12/08) ═════
        // 🔴 L'ARÈNE SEULE (96 lignes) COUPAIT LES ANIMATIONS : le ROM dessine
        //    sur sa boîte de texte (jamais `OAM_BEHIND_BG`) — Jet d'Eau
        //    adverse y perdait 86 % de ses tuiles. Et la bande sous l'arène
        //    étant sombre, aucun débordement ne pouvait s'y afficher (les
        //    planches sont du trait sur blanc opaque).
        // ✅ On rend donc l'ÉCRAN COMPLET de 1996 : l'arène (96 lignes) et la
        //    BOÎTE DE TEXTE blanche (48 lignes) dans un même cadre. Le journal
        //    vit dans la boîte — il affiche une phrase à la fois, comme elle —
        //    et la couche d'animation couvre les 144 lignes : plus rien à
        //    couper, le blanc de la boîte est celui pour lequel les tuiles ont
        //    été dessinées.
        // 🔴 LES CAMPS RESTENT DANS L'ARÈNE (34 sprites au fond blanc opaque,
        //    voir `--arene-ecran`) : ses coordonnées `--rom-*` ne bougent pas.
        '<div class="pkdx-ecran-gb">' +
          '<div class="pkdx-arene">' +
            '<div class="pkdx-camp" data-cote="adverse"></div>' +
            '<div class="pkdx-camp" data-cote="joueur"></div>' +
          "</div>" +
          '<div class="pkdx-boite">' +
            '<div class="pkdx-dialogue" role="status" aria-live="polite"></div>' +
          "</div>" +
        "</div>" +
        '<div class="pkdx-actions"></div>' +
      "</div>";
    this.elAdverse = this.hote.querySelector('[data-cote="adverse"]');
    this.elJoueur = this.hote.querySelector('[data-cote="joueur"]');
    // La scène : c'est elle qui porte la couche d'animation et les effets
    // d'écran du ROM (secousse, éclair, palette).
    this.elCombat = this.hote.querySelector(".pkdx-combat");
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 L'ANIMATION SE CALE SUR L'ÉCRAN GB, PAS SUR LE BLOC DE COMBAT. La
    //    leçon d'origine (« c'est même pas cadré ») reste : l'hôte doit être
    //    EXACTEMENT le repère du ROM, jamais un bloc qui contient d'autres
    //    choses. Ce repère est aujourd'hui `.pkdx-ecran-gb` — arène + boîte,
    //    160 × 144, l'écran entier de 1996 — et les effets d'écran (secousse,
    //    éclair, palette, pluie) le suivent en entier, comme sur la machine :
    //    le Game Boy secouait AUSSI sa boîte de texte.
    // ═══════════════════════════════════════════════════════════════════════
    this.elArene = this.hote.querySelector(".pkdx-arene") || this.elCombat;
    this.elEcran = this.hote.querySelector(".pkdx-ecran-gb") || this.elArene;
    this.elTexte = this.hote.querySelector(".pkdx-dialogue");
    this.elActions = this.hote.querySelector(".pkdx-actions");
    this.prechargerLesSprites();
    this.resynchroniser();
    this.rafraichir();
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE COMBAT S'OUVRAIT SUR UNE BOÎTE VIDE. La zone de dialogue est
    //    dessinée, cadrée, réservée — et le premier écran de chaque combat n'y
    //    écrivait rien. La phrase canonique existait pourtant dans la table
    //    depuis toujours, `apparait` : « Un Roucool sauvage apparaît ! ». Elle
    //    n'était CITÉE nulle part. Un texte déclaré et jamais employé ne lève
    //    aucune erreur — `poke-textes` vérifie l'inverse, que ce qui est cité
    //    existe — donc rien ne l'a jamais dit.
    //    C'est le premier instant du combat, celui qu'on voit le plus souvent
    //    dans tout le jeu, et il commençait par un trou.
    // ═══════════════════════════════════════════════════════════════════════
    var adverse = W.PokeCombat.actif(this.etat.adverse);
    // 🔴 UN POISSON NE « PARAÎT » PAS, ON LE FERRE. La pêche empruntait la
    //    phrase des hautes herbes : « Un Magicarpe sauvage apparaît ! » sur une
    //    créature qu'on vient de tirer de l'eau. Le jeu d'origine annonce la
    //    touche avant le combat ; ici la ligne de rencontre le dit elle-même.
    var cle = this.etat.adverse.dresseur
      ? (this.opt.qui ? "envoiAdverseQui" : "envoiAdverse")
      : (this.opt.arbre ? (this.opt.arbre === "rocher" ? "brise" : "tombe")
                        : (this.opt.peche ? "ferre" : "apparait"));
    this.dire(T(cle, { nom: ESP()[adverse.n].nom[LANG()], qui: this.opt.qui || "" }));
    this.menuPrincipal();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES POINTS DE VIE AFFICHÉS SUIVENT LES ÉVÉNEMENTS, PAS L'ÉTAT
  //
  //  🔴 SIGNALÉ PAR LE PROPRIÉTAIRE : « quand j'utilise une attaque, le Pokémon
  //     d'en face attaque en même temps, ça donne l'impression qu'on prend des
  //     dégâts quand on attaque ». Mesuré le 08/08, et c'était exactement ça —
  //     mais pas pour la raison qu'on croit : la file d'événements EST bien
  //     séquentielle (0 ms, 2 008 ms, 2 998 ms, 4 007 ms relevés).
  //
  //     Le vrai défaut est ailleurs : `jouerTour` résout LE TOUR ENTIER d'un
  //     coup avant qu'une seule image ne bouge, et la barre lisait `mon.pv`,
  //     c'est-à-dire l'état FINAL. Relevé à la quatrième milliseconde après le
  //     clic : « pv 0 / 45 » — le joueur voyait ses propres points de vie tomber
  //     à zéro à l'instant où il choisissait son attaque, avant même la
  //     première phrase. Le combat racontait la fin avant le début.
  //
  //  🔴 LA BARRE SUIT DONC LES ÉVÉNEMENTS, un par un, comme le texte. Chacun
  //     porte déjà son delta — `degats`, `usure` et `soin` le disent — et
  //     l'écran ne fait que les appliquer au rythme où il les raconte.
  //     Filet de sûreté : à la fin de la file, on se resynchronise sur l'état.
  //     Un type d'événement oublié laisse une barre en retard d'un instant, pas
  //     une barre fausse.
  // ═══════════════════════════════════════════════════════════════════════════
  Ecran.prototype.resynchroniser = function () {
    this.affiche = {
      joueur: W.PokeCombat.actif(this.etat.joueur).pv,
      adverse: W.PokeCombat.actif(this.etat.adverse).pv,
    };
  };

  Ecran.prototype.suivreEvenement = function (ev) {
    if (!this.affiche || !ev || !ev.cote) return;
    var borne = function (v, max) { return Math.max(0, Math.min(max, v)); };
    var mon = W.PokeCombat.actif(this.etat[ev.cote]);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CINQ FAÇONS DE PERDRE DES PV NE BOUGEAIENT PAS LA BARRE. Trouvées le
    //     18/08 par `poke-pv-affiches`, en cherchant tout autre chose : le coup
    //     qu'on se porte dans la confusion, la chute des attaques qui ratent
    //     leur cible, le contrecoup, et les deux restitutions — Riposte et
    //     Patience. Le moteur les annonce toutes, avec leur montant ;
    //     l'écran n'en connaissait aucune. La barre restait donc immobile
    //     pendant la phrase qui dit le dégât, puis la resynchronisation de fin
    //     de file la faisait chuter d'un coup, sans texte en face.
    //     C'est le même défaut que le repli, cinq fois — et c'est pour ça qu'un
    //     contrôle vaut mieux qu'un correctif : il trouve la CLASSE.
    //  ⚠️ `cloneEncaisse` n'est PAS de la liste, et c'est voulu : le Clone prend
    //     le coup à la place du Pokémon, qui ne perd rien.
    // ═══════════════════════════════════════════════════════════════════════
    if (ev.t === "degats" || ev.t === "usure" || ev.t === "confus" ||
        ev.t === "chute" || ev.t === "contrecoup" ||
        ev.t === "riposteRend" || ev.t === "patienceRend") {
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] - (ev.degats || 0), mon.stats.pv);
    } else if (ev.t === "soin") {
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] + (ev.pv || 0), mon.stats.pv);
    } else if (ev.t === "ko") {
      this.affiche[ev.cote] = 0;
    } else if (ev.t === "objetAdverse") {
      // 🔴 SON SOIN EST UN ÉTAT, PAS UN DELTA. On relit la vie réelle du camp
      //    adverse : suivre un « + soigné » serait faux dès que la potion
      //    dépasse ce qui manquait, et la barre finirait au-dessus du plein.
      this.affiche.adverse = W.PokeCombat.actif(this.etat.adverse).pv;
    } else if (ev.t === "objet") {
      // 🔴 UN SOIN DU JOUEUR EST UN DELTA, PAS L'ÉTAT DE FIN DE TOUR. Relevé par
      //    un joueur : « mon poke tombe à 0 et après récupère avec la potion ».
      //    On lisait `mon.pv` — l'état APRÈS le soin ET la riposte adverse du
      //    MÊME tour (`jouerTour` résout tout le tour d'un coup). La barre
      //    montait au soin, l'événement `degats` suivant la faisait chuter
      //    (parfois à zéro), puis la resynchro finale la « récupérait » à sa
      //    vraie valeur. `ev.soigne` est le montant réellement rendu, borné à ce
      //    qui manquait : l'appliquer en delta suit le soin sans jamais dépasser
      //    le plein, et la barre cesse de mentir. La vitesse de l'adversaire n'y
      //    était pour rien — il frappe simplement APRÈS la potion, dans le tour.
      //    ⚠️ Une vitamine passe aussi par « objet » avec `soigne` à zéro : delta
      //       nul, les PV ne bougent pas, c'est correct.
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] + (ev.soigne || 0), mon.stats.pv);
    } else if (ev.t === "rappelle" || ev.t === "envoie") {
      // Un changement de Pokémon : l'état absolu du nouvel actif fait autorité,
      // il ne s'agit plus d'un delta qu'on peut suivre.
      // 🔴 « ENVOIE » EN FAISAIT PARTIE ET MANQUAIT. Vu en jouant : le Scout
      //    perd son Aspicot (barre à zéro), envoie Coconfort — et Coconfort
      //    ENTRE AVEC LA BARRE VIDE, pleine vie, jusqu'au premier dégât qui
      //    resynchronise. Un remplaçant qui arrive « déjà mort » se lit comme
      //    un bug ; le relais du joueur ne le montrait pas, lui, parce que
      //    « rappelle » précède son envoi et resynchronisait déjà.
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 ET « RAPPELLE » LISAIT UNE FIN DE TOUR QUI N'ÉTAIT PAS ARRIVÉE.
      //    `mon.pv` est l'état APRÈS le tour entier ; or le repli du joueur se
      //    joue en PREMIER, la riposte adverse tombe ensuite sur le remplaçant.
      //    La barre affichait donc le remplaçant déjà entamé au moment où il
      //    entre — aucune ligne pour le dire —, puis l'événement `degats`
      //    retirait le même coup une seconde fois, puis la resynchronisation
      //    finale le rendait. « Le jeu nous retire des PV quand on change de
      //    Pokémon » (rapport du 18/08) : c'est exactement ce qu'on lui montrait.
      //    Le moteur porte maintenant les PV DE L'INSTANT sur l'événement ; on
      //    les prend quand ils sont là, et l'état ne sert plus que de repli pour
      //    un journal enregistré avant ce correctif.
      // ═══════════════════════════════════════════════════════════════════════
      this.affiche[ev.cote] = typeof ev.pv === "number" ? ev.pv : mon.pv;
    } else if (ev.t === "vol") {
      // 🔴 « L'ATTAQUE LE SOIGNE UNIQUEMENT À LA FIN DU TOUR » (rapport de
      //    testeur, 12/08) — le moteur draine À L'IMPACT, mais ce suivi ne
      //    connaissait pas `vol` : la barre du voleur n'apprenait son soin
      //    qu'à la resynchro finale, après la riposte. Le delta est porté
      //    par l'événement, on le suit comme les autres.
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] + (ev.soin || 0), mon.stats.pv);
    } else if (ev.t === "graineDraine") {
      // Même famille : la Vampigraine mordait sans que la barre bouge.
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] - (ev.degats || 0), mon.stats.pv);
    } else if (ev.t === "graineRend") {
      // 🔴 CE BLOC RATTRAPAIT LA BARRE DU BUVEUR À LA MAIN, faute d'événement —
      //    « le buveur, qui n'a pas d'événement à lui, gagnait en silence ».
      //    C'était vrai de la BARRE et du JOURNAL : le moteur ne poussait rien,
      //    donc aucune ligne ne pouvait sortir, et le joueur voyait des points
      //    de vie remonter sans raison (rapport du 14/08). Le moteur pousse
      //    maintenant `graineRend` ; la rustine devient une porte comme les
      //    autres, et la phrase existe.
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] + (ev.pv || 0), mon.stats.pv);
    } else if (ev.t === "repos") {
      // Repos rend TOUT : un état absolu, comme le moteur l'écrit.
      this.affiche[ev.cote] = mon.stats.pv;
    } else if (ev.t === "clone") {
      // Le Clone coûte un quart des PV à la pose — la barre le paie au moment
      // où la phrase le dit.
      this.affiche[ev.cote] = borne(this.affiche[ev.cote] - (ev.pv || 0), mon.stats.pv);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE COMPTE SE REDESSINE À CHAQUE RAFRAÎCHISSEMENT, ET SEULEMENT LÀ. Le
  //     poser une fois au montage l'aurait figé sur l'état du premier tour :
  //     les Balls seraient restées pleines pendant qu'on met l'équipe adverse
  //     à terre, ce qui est exactement le mensonge qu'on veut éviter.
  //  ⚠️ Le camp du JOUEUR compte aussi ses tombés, mais il ne se cache rien :
  //     il connaît son équipe. Le camp ADVERSE, lui, ne montre le compte que
  //     s'il s'agit d'un dresseur — un sauvage est seul, et aligner une Ball
  //     unique laisserait croire à une équipe.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  OÙ EN SONT LES PALIERS — LE COMPTE D'UN INVESTISSEMENT INVISIBLE
  //
  //  🔴 LES PALIERS NE S'ANNONÇAIENT QU'AU PASSAGE. « L'Attaque de Salamèche
  //     augmente » défile, puis deux tours plus tard le joueur ne sait plus
  //     s'il est à +1, +3 ou au plafond. C'est le canon de 1996 — mais 1996
  //     ne vendait pas ces paliers 950 ₽ pièce. Depuis que l'étal de
  //     Céladopole est ouvert, un cran d'Attaque est un ACHAT : le joueur a
  //     renoncé à six potions pour lui, et rien à l'écran ne lui dit ce qu'il
  //     a obtenu ni quand il ne peut plus en acheter.
  //
  //  🔴 SEULEMENT CE QUI N'EST PAS À ZÉRO. Six pastilles neutres en permanence
  //     ne distingueraient plus rien — c'est la même loi que pour les verdicts
  //     d'arène : l'ordinaire ne se dit pas.
  //
  //  🔴 ET LES DEUX CAMPS. Un Champion qui monte sa Défense trois fois change
  //     le combat autant qu'un objet acheté ; le cacher rendrait ses tours
  //     incompréhensibles — « pourquoi mes coups ne font plus rien ».
  // ═══════════════════════════════════════════════════════════════════════════
  var COURT = {
    atk: { fr: "ATQ", en: "ATK" }, def: { fr: "DÉF", en: "DEF" },
    vit: { fr: "VIT", en: "SPD" }, spe: { fr: "SPÉ", en: "SPC" },
    precision: { fr: "PRÉ", en: "ACC" }, esquive: { fr: "ESQ", en: "EVA" },
    critique: { fr: "CRIT", en: "CRIT" },
  };

  function rendrePaliers(hote, cote, etat) {
    var el = hote.querySelector(".pkdx-paliers-hote");
    if (!el) return;
    var c = etat[cote];
    var paliers = (c && c.paliers) || {};
    var out = "";
    for (var s in COURT) {
      var v = paliers[s] || 0;
      if (!v) continue;
      var nom = COURT[s][LANG()] || COURT[s].fr;
      out += '<span class="pkdx-palier"' + (v < 0 ? ' data-sens="bas"' : "") + ">" +
        nom + " " + (v > 0 ? "+" : "−") + Math.abs(v) + "</span>";
    }
    // La garde des statistiques est un palier comme un autre pour le joueur :
    // elle s'achète, elle dure le combat, et rien ne la montrait.
    // ⚠️ `brume` EST LE DRAPEAU QUE LE MOTEUR LIT (`bougerPalier`). Cet écran
    //    lisait `gardeStats`, posé par l'objet et consulté par personne : il
    //    annonçait donc une protection qui n'existait pas.
    if (c && c.volatils && c.volatils.brume) {
      out += '<span class="pkdx-palier">' + T("palierGarde") + "</span>";
    }
    el.innerHTML = out;
  }

  function rendreReste(hote, cote, etat) {
    var el = hote.querySelector(".pkdx-restants");
    if (!el) return;
    var c = etat[cote];
    if (cote === "adverse" && !c.dresseur) { el.innerHTML = ""; return; }
    var out = "";
    for (var i = 0; i < c.equipe.length; i++) {
      out += '<i' + (c.equipe[i].pv > 0 ? "" : ' data-ko="oui"') + "></i>";
    }
    el.innerHTML = out;
  }

  Ecran.prototype.rafraichir = function () {
    this.resynchroniser();
    rendreCamp(this.elAdverse, W.PokeCombat.actif(this.etat.adverse), "adverse");
    rendreCamp(this.elJoueur, W.PokeCombat.actif(this.etat.joueur), "joueur");
    rendreReste(this.elAdverse, "adverse", this.etat);
    rendreReste(this.elJoueur, "joueur", this.etat);
    rendrePaliers(this.elAdverse, "adverse", this.etat);
    rendrePaliers(this.elJoueur, "joueur", this.etat);
    //  🔴 Les nappes de type autour de l'arène (v563) sont RETIRÉES sur
    //     verdict du propriétaire : « une aura qui sert à rien ». Il a
    //     raison — sur un adversaire Normal, la lumière beige se lisait comme
    //     une tache dans le vide, pas comme une information. La place du
    //     type en combat, ce sont les pastilles des fiches, déjà là.
  };

  Ecran.prototype.dire = function (texte) {
    this.elTexte.textContent = texte;
  };

  // Les événements qui FRAPPENT. Ils ne prennent pas leur propre temps : ils se
  // replient sur celui de la phrase qui les annonce, parce qu'un coup se voit
  // pendant qu'on lit « X utilise Y ! », pas après.
  var EST_IMPACT = { degats: true };

  // Les animations sont posées PAR ÉVÉNEMENT, et chacune dit quelque chose :
  // le clignotement dit « touché », la secousse dit « super efficace », la
  // chute dit « K.O. ». Aucune n'est décorative.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SON — UNE SEULE PORTE, LA MÊME QUE L'ANIMATION
  //
  //  Un événement de combat dit une chose ; il la dit à l'œil ET à l'oreille,
  //  au même instant, depuis le même endroit. Éparpiller les appels au son
  //  dans la boucle de lecture, c'est se garantir qu'un jour l'un partira sans
  //  l'autre — et un coup qu'on entend sans le voir se lit comme un bogue.
  //
  //  🔴 CHAQUE SON DIT QUELQUE CHOSE, AUCUN N'EST DÉCORATIF. C'est la même loi
  //     que pour les animations. Un tapis de bruits noie l'information : si
  //     tout sonne, plus rien ne s'entend.
  // ═══════════════════════════════════════════════════════════════════════════
  var SONS = {
    ko: "FAINT_FALL",
    soin: "HEAL_HP",
    // ⚠️ `statut` COUVRE CINQ ÉTATS AVEC LE SON DU POISON — paralysie, brûlure,
    //    gel et sommeil compris. Le ROM n'a qu'un SFX d'altération, et c'est
    //    celui-là : on le garde, c'est la famille qui parle. Mais on le note,
    //    parce que ce n'est vrai QU'AU SON — le texte, lui, nomme l'état.
    statut: "POISONED",
    rate: "DENIED",
    sansEffet: "DENIED",
    fuite: "RUN",
    fuiteRefusee: "DENIED",
    ballRefusee: "DENIED",
    objet: "HEAL_HP",
    objetRefuse: "DENIED",
    statutRefuse: "DENIED",
    entraveBloque: "DENIED",
    cloneCasse: "FAINT_THUD",
    // 🔴 `palier: "LEVEL_UP"` — LE JINGLE DE MONTÉE DE NIVEAU SUR UNE BAISSE DE
    //    STATISTIQUE. Signalé par le propriétaire : « des sons qui n'ont aucun
    //    rapport avec les actions ». Il a raison, et c'était le pire cas : une
    //    attaque qui BAISSE ta Défense te jouait la fanfare de la progression.
    // 🔑 ET LA BONNE RÉPONSE N'EST PAS UN AUTRE JINGLE, C'EST LE SILENCE. Le
    //    changement de palier suit toujours une attaque, dont le son PROPRE
    //    vient de retentir une ligne plus haut (`ev.t === "utilise"`). En 1996,
    //    Rugissement baisse l'Attaque et l'on entend Rugissement — pas un
    //    second effet par-dessus. Un son de plus ici, c'est deux sons pour un
    //    seul geste, et c'est ce qui donnait cette impression de désordre.
    //    ⚠️ Le palier reste ÉCRIT dans le journal et MONTRÉ sur la fiche
    //       (« DÉF −1 ») : on retire un doublon sonore, pas une information.
    repos: "HEAL_AILMENT",
    reveil: "HEAL_AILMENT",
    degel: "HEAL_AILMENT",
    usure: "DAMAGE",
    graineDraine: "DAMAGE",
    confusion: "DAMAGE",
    patienceRend: "BATTLE_0D",
    rappelle: "SWITCH",
  };

  Ecran.prototype.sonner = function (ev) {
    var S = W.PokeSon;
    if (!S || (this.opt.rythme || 900) < 200) return;   // l'auto-joueur n'écoute pas
    if (ev.t === "utilise") {
      // Le son PROPRE de l'attaque, avec son décalage et son tempo.
      // 🔴 L'IDENTIFIANT PASSE PAR LA GARDE D'IDENTITÉ. Les 166 bruitages
      //    d'attaque de 1996 débordent des 165 attaques : Johto en compte 251,
      //    et lui laisser employer son propre numéro donnerait à Dessin le
      //    bruitage d'un état. `idKanto` ne rend un numéro que si l'attaque de
      //    Kanto qui le porte est la même attaque.
      var att = ATT()[ev.attaque];
      //  🔑 ON DEMANDE AU REGISTRE, QUI SAIT SI LE MONDE A SA BANQUE. Depuis
      //     que Johto porte ses 248 bruitages de Cristal, il n'emprunte plus
      //     rien à Kanto — et l'écran n'a pas à connaître cette bascule.
      var idSon = W.PokeRegles ? W.PokeRegles.idSon(att) : (att && att.id);
      if (idSon) S.attaque(idSon);
      return;
    }
    if (ev.t === "envoie") {
      // Une créature qui entre CRIE. C'est le seul endroit du jeu où on entend
      // les 151 voix, et c'est ce qui donne à chaque rencontre son visage.
      var mon = W.PokeCombat.actif(this.etat[ev.cote]);
      if (mon) S.cri(mon.n);
      return;
    }
    if (ev.t === "degats") {
      // L'efficacité PARLE : c'est l'information la plus utile du combat, et
      // l'oreille la reçoit plus vite que l'œil.
      if (ev.efficacite > 1) S.jouer("SUPER_EFFECTIVE");
      else if (ev.efficacite > 0 && ev.efficacite < 1) S.jouer("NOT_VERY_EFFECTIVE");
      return;
    }
    if (ev.t === "ball") return;                        // la capture a sa scène
    // 🔴 UN OBJET DE STATISTIQUE JOUAIT LE JINGLE DU SOIN. `SONS.objet` vaut
    //    `HEAL_HP`, et le moteur pousse `objet` aussi bien pour une Potion que
    //    pour une Attaque + : l'oreille entendait « soigné » quand rien n'était
    //    soigné. Le TEXTE distingue déjà les deux (`objetEmploie` contre
    //    `objetSoigne`) ; le son, non — contre la loi « chaque son dit quelque
    //    chose », écrite dix lignes plus haut.
    //  ⚠️ On se TAIT plutôt que d'inventer un bruitage : le `palier` qui suit
    //     immédiatement porte déjà son propre son, et deux sons collés n'en
    //     font qu'un seul, confus.
    if (ev.t === "objet" && W.PokeCombat.OBJETS_STAT && W.PokeCombat.OBJETS_STAT[ev.objet]) return;
    if (SONS[ev.t]) S.jouer(SONS[ev.t]);
  };

  Ecran.prototype.animer = function (ev) {
    // La barre bouge AVEC le coup, pas avant. C'est le seul endroit qui la fait
    // descendre — l'état, lui, a déjà tout résolu.
    this.suivreEvenement(ev);
    this.sonner(ev);
    var camp = ev.cote === "joueur" ? this.elJoueur : this.elAdverse;
    if (!camp) return;
    if (ev.t === "degats") {
      camp.classList.remove("est-touche", "est-efficace");
      void camp.offsetWidth;                       // relance l'animation
      camp.classList.add("est-touche");
      if (ev.efficacite > 1) camp.classList.add("est-efficace");
    } else if (ev.t === "ko") {
      camp.classList.add("est-ko");
    } else if (ev.t === "ball") {
      this.animerCapture(ev);
    } else if (ev.t === "rappelle" || ev.t === "envoie") {
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 « LE SWITCH N'A PAS LA PRIORITÉ » — RAPPORT DE TESTEUR DU 14/08.
      //     « J'ai switché et AVANT le Pokémon adverse m'a attaqué, puis j'ai
      //     switché. » Le testeur a raison de ce qu'il VOIT, et le moteur avait
      //     raison de ce qu'il FAIT : `poke-priorite-repli.mjs` rejoue quarante
      //     tours contre un adversaire cinquante fois plus rapide, le repli
      //     sort toujours en premier et **celui qui part n'encaisse rien**.
      //
      //  🔴 C'EST LA MISE EN SCÈNE QUI MENTAIT. `animer` ne connaissait pas
      //     `rappelle` : il en jouait le SON et rien d'autre. Or la boucle de
      //     lecture n'appelle `rafraichir()` qu'une fois la file VIDE — donc
      //     l'ancien sprite restait à l'écran pendant tout le tour, encaissait
      //     le coup adverse avec son clignotement, et le remplaçant
      //     n'apparaissait qu'après. On voyait exactement l'inverse de ce qui
      //     s'était produit, sur la seule mécanique où l'ordre est la règle.
      //     🔑 *Le jeu faisait juste, et il montrait faux.*
      //
      //  ⚠️ ON NE PEUT PAS APPELER `rafraichir()` ICI : il passe par
      //     `resynchroniser()`, qui recale `this.affiche` sur l'état de FIN DE
      //     TOUR — les barres sauteraient à leur valeur finale et toute la
      //     mécanique de delta documentée plus haut tomberait. On redessine
      //     donc le SEUL camp qui change, sans toucher au suivi des barres.
      //     `suivreEvenement` a déjà recalé `affiche[cote]` sur le remplaçant
      //     deux lignes plus haut, et `rendreCamp` ne remonte que si l'espèce
      //     diffère — l'animation d'entrée reprend son sens toute seule.
      // ═══════════════════════════════════════════════════════════════════════
      var entrant = W.PokeCombat.actif(this.etat[ev.cote]);
      rendreCamp(camp, entrant, ev.cote);
      rendreReste(camp, ev.cote, this.etat);
      rendrePaliers(camp, ev.cote, this.etat);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CAPTURE — 07/08/2026
  //
  //  🔴 ELLE N'AVAIT AUCUN VISUEL. La feuille portait bien l'animation de la
  //     Ball qui tremble, avec ses trois secousses — mais AUCUN code ne posait
  //     jamais l'élément. Une règle de style qui ne s'applique à rien est une
  //     classe citée et non stylée, à l'envers : le dessin existait, la scène
  //     ne l'appelait pas. Le joueur lisait « Ça bouge… » sans rien voir.
  //
  //  🔴 LE NOMBRE DE SECOUSSES VIENT DU CALCUL, JAMAIS DE L'ANIMATION.
  //     `capture.js` le rend dans l'événement ; on l'affiche. L'animation
  //     raconte ce qui a été décidé, elle ne décide de rien — sans quoi le
  //     rejeu du serveur et l'écran raconteraient deux histoires.
  // ═══════════════════════════════════════════════════════════════════════════
  Ecran.prototype.nettoyerMinuteursCapture = function () {
    if (!this.minuteursCapture) this.minuteursCapture = [];
    while (this.minuteursCapture.length) {
      var tid = this.minuteursCapture.pop();
      if (tid) W.clearTimeout(tid);
    }
  };

  Ecran.prototype.detruire = function () {
    this.nettoyerMinuteursCapture();
  };

  Ecran.prototype.animerCapture = function (ev) {
    var camp = this.elAdverse;
    if (!camp || !this.elCombat) return;
    var self = this;
    var rythme = this.opt.rythme || 900;
    if (rythme < 200) return;            // l'auto-joueur ne regarde pas

    // ⚠️ `D` n'existe pas ici : l'enveloppe de ce fichier ne reçoit que `W`.
    //    Ma première version écrivait `D.createElement` — l'erreur partait dans
    //    la boucle de lecture du combat et la Ball ne s'affichait jamais, sans
    //    qu'aucun message ne remonte à l'écran. Trouvé en appelant la fonction
    //    à la main, pas en relisant le code.
    var S = W.PokeSon;
    var son = function (n) { if (S) S.jouer(n); };

    var ball = W.document.createElement("i");
    ball.className = "pkdx-ball est-lancee";
    ball.setAttribute("aria-hidden", "true");
    camp.appendChild(ball);
    son("BALL_TOSS");

    this.nettoyerMinuteursCapture();

    // La créature est happée, la Ball tremble le nombre de fois décidé.
    var n = Math.max(1, Math.min(3, ev.secousses || 1));
    this.minuteursCapture.push(W.setTimeout(function () {
      camp.classList.add("est-happe");
      ball.classList.remove("est-lancee");
      ball.setAttribute("data-secousses", String(n));
      son("BALL_POOF");
    }, 480));

    // ── CHAQUE SECOUSSE SE CLAQUE ────────────────────────────────────────────
    // 🔴 C'EST LA SECONDE DE JEU LA PLUS TENDUE DU MODE, et elle était muette.
    //    Le nombre de secousses est déjà décidé — mais tant qu'on l'ignore, on
    //    compte. Un « tac » par secousse transforme une animation qu'on regarde
    //    en un décompte qu'on subit : au deuxième on retient son souffle, au
    //    troisième on sait. C'est exactement le mécanisme du jeu d'origine.
    for (var k = 0; k < n; k++) {
      (function (i) {
        self.minuteursCapture.push(W.setTimeout(function () { son("TINK"); }, 480 + 520 * i + 260));
      })(k);
    }

    // Puis elle se ferme, ou elle s'ouvre et la créature revient.
    this.minuteursCapture.push(W.setTimeout(function () {
      if (ev.pris) {
        ball.removeAttribute("data-secousses");
        ball.classList.add("est-prise");
        // Le jingle de capture. Il dure trois secondes et demie, et c'est la
        // récompense sonore du mode : rien d'autre ne joue par-dessus.
        son("CAUGHT_MON");
      } else {
        camp.classList.remove("est-happe");
        ball.remove();
        son("BALL_POOF");
      }
      self.minuteursCapture.push(W.setTimeout(function () { if (ball.parentNode) ball.remove(); self.rafraichir(); }, 700));
    }, 480 + 520 * n));
  };

  // L'animation d'attaque d'un temps de lecture, s'il en porte une.
  //  🔴 Seul l'événement « utilise » en déclenche une : c'est lui qui NOMME
  //     l'attaque. La rattacher aux dégâts la ferait partir après le coup.
  //  La vitesse suit le rythme du texte, donc l'auto-joueur — qui ne lit pas —
  //  la saute entièrement au lieu d'attendre une seconde par attaque.
  Ecran.prototype.animationDe = function (item) {
    if (!item.premier || !item.ev || item.ev.t !== "utilise") return null;
    var lecteur = W.PokeAnimAttaque;
    if (!lecteur || !this.elEcran) return null;
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 DEUX NUMÉROTATIONS, ET ELLES NE COÏNCIDENT PAS. `POKE_ATTAQUES` est un
    //    TABLEAU à partir de zéro — l'indice 9 est Griffe. Le ROM, lui, numérote
    //    ses attaques à partir de un, et sa table d'animations suit ce compte :
    //    Griffe y est la dixième. Prendre l'indice pour l'identifiant aurait
    //    fait jouer à Griffe l'animation de Poing-Éclair, à Flammèche celle de
    //    Détricanon, et ainsi de suite sur les 165 attaques. Décalage d'un cran,
    //    parfaitement crédible à l'écran, invisible à la lecture du code.
    //
    //    On ne corrige PAS par une addition : `+1` posé ici se serait perdu au
    //    premier déplacement. Chaque attaque PORTE son identifiant du ROM dans
    //    `id` — on le lit, et le pont ne peut plus se casser en silence.
    // ═════════════════════════════════════════════════════════════════════════
    var att = ATT()[item.ev.attaque];
    //  🔴 ET LA MÊME GARDE POUR L'IMAGE. La table d'animations de Rouge/Bleu
    //     porte 203 entrées pour 165 attaques : les 38 dernières sont des
    //     animations d'ÉTAT. Sans cette garde, trente-huit attaques de 1999
    //     joueraient l'une d'elles — crédible à l'écran, faux, et muet à la
    //     relecture. Voir `PokeRegles.idKanto`.
    var idAnim = W.PokeRegles ? W.PokeRegles.idKanto(att) : (att && att.id);
    // ═══════════════════════════════════════════════════════════════════════
    //  LES ATTAQUES PROPRES À 1999 ONT LEUR PROPRE LECTEUR  [20/08/2026]
    //
    //  🔴 QUATRE-VINGT-SIX ATTAQUES SORTAIENT D'ICI PAR `return null` — pas de
    //     numéro de Kanto, donc pas d'animation. Elles s'annonçaient, elles
    //     s'entendaient, elles faisaient leurs dégâts, et l'écran restait
    //     immobile. « Fais les animations, c'est important » : voilà la porte.
    //  🔑 DEUX LECTEURS, ET C'EST STRUCTUREL. Celui de 1996 pose des IMAGES
    //     (le mouvement est dans la donnée) ; celui de 1999 fait tourner des
    //     OBJETS (le mouvement est une routine). Les fondre en un seul aurait
    //     demandé d'interpréter l'un dans les termes de l'autre — c'est-à-dire
    //     d'approximer, sur les deux.
    //  ⚠️ L'ORDRE COMPTE : on demande d'abord l'emprunt à Kanto, parce qu'une
    //     attaque que les deux mondes connaissent doit garder l'animation de
    //     1996 — c'est la même attaque, et cette donnée-là est éprouvée depuis
    //     des mois. Le lecteur de 1999 ne prend que ce qui n'existe qu'en 1999.
    // ═══════════════════════════════════════════════════════════════════════
    if (!idAnim && att && W.PokeAnimGen2 && W.PokeAnimGen2.animee(att.cle)) {
      var vitesseG2 = Math.max(0.55, Math.min(1, (this.opt.rythme || 900) / 900));
      if (vitesseG2 < 0.2) return null;
      var soi = this;
      return {
        //  Le script du ROM dit lui-même sa durée : on ne la devine pas, on
        //  laisse la promesse se résoudre. `duree` sert à réserver le temps du
        //  tour ; une borne haute suffit, la file attend la fin réelle.
        duree: 900 * vitesseG2,
        jouer: function () {
          return W.PokeAnimGen2.jouer(soi.elEcran, att.cle, item.ev.cote, vitesseG2);
        },
      };
    }
    if (!idAnim) return null;
    if (!lecteur.animee(idAnim)) return null;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « J'AI L'IMPRESSION QUE TU AS MIS LES MÊMES ANIMATIONS POUR TOUTES LES
    //    ATTAQUES » — signalé par le propriétaire. Les données disent le
    //    contraire : **133 programmes distincts** pour 165 attaques, 67
    //    sous-animations, et les 8 coups qui partagent un programme sont tous
    //    des frappes physiques — c'est le ROM. Ce n'est donc pas la donnée.
    // 🔑 C'EST LA VITESSE QUI LES ÉCRASE. Le facteur suivait le rythme du texte
    //    sans plancher : au cran le plus rapide il tombe à **0,29**, et mesuré
    //    sur les 165 attaques, **101 durent alors moins de 300 ms** — une
    //    quinzaine d'images. Une animation de tuiles 8×8 en quinze images n'est
    //    plus une animation, c'est un éclair : elles se ressemblent toutes
    //    parce qu'on ne voit plus que le flash.
    //      cran NORMALE      facteur 1,00 · médiane 860 ms · 14/165 sous 300 ms
    //      cran RAPIDE       facteur 0,58 · médiane 497 ms · 47/165
    //      cran TRÈS RAPIDE  facteur 0,29 · médiane 248 ms · 101/165
    // ✅ LE RÉGLAGE GOUVERNE LE TEXTE, PAS LA LISIBILITÉ DE L'IMAGE. On pose un
    //    plancher : l'animation ne descend plus sous 0,55, ce qui la ramène au
    //    niveau du cran RAPIDE. Le journal, les attentes et les messages
    //    gardent, eux, toute la vitesse demandée.
    // ⚠️ Le tour s'allonge d'environ 180 ms au cran le plus rapide. C'est le
    //    prix, et il est assumé : une animation qu'on ne distingue pas ne fait
    //    pas gagner du temps, elle fait disparaître le jeu.
    // ═══════════════════════════════════════════════════════════════════════
    var vitesse = Math.max(0.55, Math.min(1, (this.opt.rythme || 900) / 900));
    if (vitesse < 0.2) return null;          // en mode pressé, on ne dessine pas
    var self = this;
    return {
      duree: lecteur.duree(idAnim, vitesse),
      jouer: function () {
        return lecteur.jouer(self.elEcran, idAnim, item.ev.cote, { vitesse: vitesse, type: att.type });
      },
    };
  };

  // Joue la file d'événements, une ligne à la fois. Le joueur LIT le combat :
  // enchaîner sans pause rendrait le journal illisible.
  Ecran.prototype.jouer = function (evenements, fini) {
    var self = this;
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 LA MISE EN SCÈNE SUIVAIT LE TEXTE, PAS LES ÉVÉNEMENTS — d'où le
    //    décalage vu à l'écran par le propriétaire : « les animations des
    //    attaques ne semblent pas synchro ».
    //
    //    La file était bâtie ligne par ligne, et chaque ligne rejouait
    //    `animer()` et `rafraichirBarres()`. Deux conséquences, opposées et
    //    toutes deux fausses :
    //
    //      · un coup NORMAL ne produit AUCUNE ligne (`phrases` ne parle que du
    //        critique et de l'efficacité) — donc il n'entrait pas dans la file,
    //        et son clignotement comme sa barre de vie se déclenchaient au coup
    //        d'après, sur le texte de l'adversaire. Le cas le plus fréquent du
    //        jeu était le plus faux ;
    //      · un coup critique ET super efficace produit DEUX lignes — donc le
    //        clignotement partait deux fois et la barre sautait deux fois.
    //
    //    Un événement = un temps. Ses lignes s'affichent DANS ce temps, et
    //    seule la première porte la mise en scène. Un événement muet garde son
    //    temps, plus court : un impact n'a pas besoin d'une phrase pour se voir.
    // ═════════════════════════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 DEUXIÈME MOITIÉ DU MÊME DÉFAUT, SIGNALÉE PAR LE PROPRIÉTAIRE : « il y a
    //    toujours un décalage entre le clic sur l'attaque et le moment où le
    //    Pokémon est touché ». Corriger l'attribution de l'animation ne
    //    suffisait pas — il restait son PLACEMENT DANS LE TEMPS.
    //
    //    Un tour produit « utilise », puis « degats ». Chacun prenait son propre
    //    temps, donc le coup partait 900 ms après le clic : on lisait
    //    « Salamèche utilise Griffe ! » en entier AVANT de voir quoi que ce
    //    soit bouger. Le jeu d'origine ne fait pas ça — la phrase s'affiche et
    //    le coup part dessus, dans le même temps.
    //
    //    L'impact se REPLIE donc sur le temps qui le précède : il s'y déclenche
    //    à trois dixièmes, pendant que la phrase est encore à l'écran. Ses
    //    propres phrases (« Coup critique ! », « C'est super efficace ! »)
    //    suivent après, comme dans le jeu : on voit le coup, puis on lit
    //    pourquoi il a fait mal.
    // ═════════════════════════════════════════════════════════════════════════
    var dites = mettreEnMots(evenements, this.etat, this.opt.qui);
    for (var i = 0; i < evenements.length; i++) {
      var ev = evenements[i];
      var l = dites[i];
      var precedent = this.file[this.file.length - 1];
      if (EST_IMPACT[ev.t] && precedent) {
        (precedent.impacts || (precedent.impacts = [])).push(ev);
        // Ses lignes restent des temps à part, mais elles n'animent plus rien :
        // l'animation a déjà eu lieu, sur le temps d'avant.
        for (var j = 0; j < l.length; j++) this.file.push({ texte: l[j], ev: ev, premier: false });
        continue;
      }
      if (!l.length) { this.file.push({ texte: null, ev: ev, premier: true }); continue; }
      for (var k = 0; k < l.length; k++) this.file.push({ texte: l[k], ev: ev, premier: k === 0 });
    }
    if (this.enCours) return;

    // 🔴 MODE PRESSÉ — pour l'auto-joueur, qui ne lit pas. On vide la file d'un
    //    coup : les événements sont TOUS appliqués (l'état est déjà à jour, le
    //    moteur a tourné), seule la mise en scène est sautée. Rien du jeu n'est
    //    court-circuité — c'est la différence entre accélérer et tricher.
    if (W.POKE_PRESSE) {
      var dernier = null;
      while (this.file.length) dernier = this.file.shift();
      if (dernier) this.dire(dernier.texte);
      this.rafraichir();
      this.rafraichirBarres();
      if (this.etat.fini) this.terminer();
      else if (this.etat.attenteJoueur) this.menuEquipe(true);
      else this.menuPrincipal();
      if (fini) fini();
      return;
    }

    this.enCours = true;
    this.elActions.innerHTML = "";
    (function suite() {
      if (!self.file.length) {
        self.enCours = false;
        self.rafraichir();
        if (self.etat.fini) self.terminer();
        else if (self.etat.attenteJoueur) self.menuEquipe(true);
        else self.menuPrincipal();
        if (fini) fini();
        return;
      }
      var item = self.file.shift();
      // Une ligne absente laisse le texte précédent en place : l'écran ne
      // clignote pas dans le vide entre deux phrases.
      if (item.texte != null) self.dire(item.texte);
      // 🔴 La mise en scène appartient à l'ÉVÉNEMENT, donc à sa première ligne.
      if (item.premier) { self.animer(item.ev); self.rafraichirBarres(); }
      var rythme = self.opt.rythme || 900;

      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 L'ANIMATION D'ATTAQUE MÈNE LE TEMPS, ET C'EST ELLE QUI SUPPRIME
      //    L'ATTENTE. Elle part au moment où la phrase s'affiche — donc à
      //    quelques millisecondes du clic — et l'impact tombe à SA FIN, pas à
      //    un retard fixe. C'est l'ordre du jeu d'origine : on lit « X utilise
      //    Y ! », on voit le coup, puis la barre descend.
      //    Le temps de lecture s'étire à la durée de l'animation : une phrase
      //    qui disparaît pendant que les flammes volent encore se lit comme un
      //    bug, et une animation coupée net aussi.
      // ═══════════════════════════════════════════════════════════════════════
      var attente = item.texte == null ? Math.round(rythme * 0.45) : rythme;
      var frappes = function () {
        (item.impacts || []).forEach(function (ev, n) {
          W.PokeTempo.apres(n * 120, function () { self.animer(ev); self.rafraichirBarres(); });
        });
      };
      var anim = self.animationDe(item);
      if (anim) {
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 CENT VINGT MILLISECONDES ENTRE LE COUP ET LA LIGNE SUIVANTE. Le
        //    coup part, l'impact tombe à la fin de l'animation — et un dixième
        //    de seconde plus tard, l'adversaire annonce déjà le sien. Les deux
        //    assauts d'un tour se confondent : on ne voit pas QUI frappe, on
        //    voit deux créatures qui tremblent.
        //    Signalé par le propriétaire deux fois le 08/08 — « on prend des
        //    dégâts quand on attaque », puis « faut qu'on voie l'attaque du
        //    Pokémon adverse ». Les deux disent la même chose : il manque le
        //    temps de LIRE le coup avant le suivant.
        // 🔴 LE REPOS SUIT LE RYTHME, il n'est pas fixe : à rythme réduit —
        //    l'auto-joueur, le mode pressé — il se réduit avec lui, sinon
        //    chaque tour paierait un demi-seconde de silence.
        var repos = Math.round((self.opt.rythme || 900) * 0.45);
        attente = Math.max(attente, anim.duree + repos);
        anim.jouer().then(frappes);
      } else if (item.impacts) {
        // Sans animation — une attaque de statut, un effet non porté — l'impact
        // garde son ancien retard : assez pour ne pas être simultané au texte,
        // assez court pour ne pas se faire attendre.
        W.PokeTempo.apres(Math.min(280, Math.round(rythme * 0.3)), frappes);
      }
      W.PokeTempo.apres(attente, suite);
    })();
  };

  // Les barres suivent l'état réel après chaque ligne : sans ça, l'écran dirait
  // une chose et l'état une autre — la divergence exacte que le projet traque.
  Ecran.prototype.rafraichirBarres = function () {
    var a = this.affiche || {};
    // 🔴 ON AFFICHE `affiche`, PAS `mon.pv`. Le second est déjà l'état de FIN de
    //    tour : le lire ici faisait tomber la barre du joueur avant même la
    //    première phrase de son propre coup. `niveauPv` prend donc lui aussi la
    //    valeur affichée, sinon la couleur passerait au rouge en avance sur la
    //    barre — deux indicateurs du même fait qui ne diraient pas la même chose.
    var maj = function (camp, mon, pv) {
      if (!camp || !mon) return;
      var v = pv == null ? mon.pv : pv;
      var barre = camp.querySelector(".pkdx-pv");
      var chiffre = camp.querySelector(".pkdx-chiffre");
      if (barre) {
        barre.setAttribute("data-niveau", niveauPv({ pv: v, stats: mon.stats }));
        barre.firstChild.style.setProperty("--part", Math.max(0, v / mon.stats.pv));
      }
      if (chiffre) chiffre.textContent = v + " / " + mon.stats.pv;
    };
    maj(this.elJoueur, W.PokeCombat.actif(this.etat.joueur), a.joueur);
    maj(this.elAdverse, W.PokeCombat.actif(this.etat.adverse), a.adverse);
  };

  // ── Les menus ──────────────────────────────────────────────────────────────
  Ecran.prototype.bouton = function (libelle, action, options) {
    var b = W.document.createElement("button");
    b.className = "pkdx-touche" + ((options && options.classe) ? " " + options.classe : "");
    b.type = "button";
    b.textContent = libelle;
    // La raison d'un refus se lit SUR le bouton, et pas seulement dans sa
    // bulle : celle-ci s'ouvre bien au doigt, mais rien sur un bouton gris ne
    // laisse penser qu'il y a quelque chose à lire. Voir `PokeInfobulles.raison`.
    // On assemble en nœuds, jamais en balisage — un nom d'objet traduit n'a pas
    // à repasser par un échappement de plus.
    if (options && options.note) {
      var note = W.document.createElement("span");
      note.className = "pkdx-touche-note";
      note.textContent = options.note;
      b.appendChild(note);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UN `disabled` N'EST PAS FOCALISABLE, ET ÇA REND SA RAISON INATTEIGNABLE
    //     AU CLAVIER. Mesuré le 09/08 avec témoin, dans la page : un bouton
    //     `disabled` refuse le focus (`activeElement` ne devient jamais lui) et
    //     son infobulle ne s'ouvre donc JAMAIS ; le même bouton en
    //     `aria-disabled` prend le focus et l'ouvre. Toutes les raisons de refus
    //     du mode — « Il est déjà au maximum de ses PV », « Il appartient à un
    //     dresseur » — étaient hors de portée pour qui ne joue pas à la souris.
    //  🔴 ON ÉTEINT DONC EN `aria-disabled`, ET ON GARDE LE CLIC POUR LE NIER.
    //     Le bouton reste focalisable et annoncé comme indisponible par les
    //     lecteurs d'écran — ce que `disabled` faisait aussi, mais au prix du
    //     silence.
    //  ⚠️ CE QUE JE N'AI PAS PU MESURER : si Chrome délivre un survol à un
    //     `disabled`. L'outil de pilotage n'envoie aucun `mouseover` réel à
    //     cette page — vérifié, zéro événement capté même sur un bouton ACTIF —
    //     donc l'essai que j'avais fait ne prouvait rien, dans un sens comme
    //     dans l'autre. Le motif retenu est celui qui est MESURÉ : le clavier.
    //  ⚠️ LE CLIC EST BRANCHÉ ET NE FAIT RIEN. Ne rien brancher du tout laisserait
    //     un bouton qui a l'air cliquable sans l'être ; brancher `action` le
    //     rendrait cliquable pour de bon. On absorbe.
    // ═══════════════════════════════════════════════════════════════════════
    if (options && options.desactive) {
      b.setAttribute("aria-disabled", "true");
      b.addEventListener("click", function (e) { e.preventDefault(); });
    // ⚠️ ENROBÉE — voir `tools/poke-evenement-fuite.mjs`.
    } else b.addEventListener("click", function () { action(); });
    this.elActions.appendChild(b);
    return b;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  « QUITTER LE VOYAGE ? » — CE QUE DEMANDE LE GESTE RETOUR
  //
  //  L'écran de combat répond comme il répond à SAC ou à ÉQUIPE : le pupitre
  //  change, la boîte de texte parle, le combat reste entier derrière. Un écran
  //  de confirmation qui REMPLACERAIT la page tuerait ce qu'il protège.
  //  ⚠️ ON NE COUPE JAMAIS UNE ANIMATION. Pendant `enCours`, la boucle de
  //     lecture possède le pupitre et le réécrira à la fin : y poser un menu,
  //     c'est le voir disparaître une seconde plus tard. On rend `false`, et
  //     l'appelant ravale le geste — deux secondes au pire, contre un menu
  //     fantôme.
  //  ⚠️ ET « RESTER » REND LA MAIN AU BON MENU : après un K.O., le jeu attend un
  //     remplaçant (`attenteJoueur`), pas un ordre. Le menu principal y serait
  //     une impasse.
  // ═══════════════════════════════════════════════════════════════════════════
  Ecran.prototype.menuQuitter = function (surQuitter) {
    var self = this;
    if (this.enCours || this.etat.fini) return false;
    this.elActions.innerHTML = "";
    this.dire(T("quitterDit"));
    this.bouton(T("quitterRester"), function () {
      if (self.etat.attenteJoueur) self.menuEquipe(true);
      else self.menuPrincipal();
    }, { classe: "est-definitive" });
    this.bouton(T("quitterPartir"), function () { surQuitter(); });
    return true;
  };

  Ecran.prototype.menuPrincipal = function () {
    var self = this;
    this.elActions.innerHTML = "";
    // 🔴 QUATRE BOUTONS IDENTIQUES NE DISENT PAS QUOI FAIRE. Attaquer est
    //    l'action du tour ; le sac, l'équipe et la fuite en sont les recours.
    //    Tant qu'ils se ressemblaient tous, le regard devait les lire un par un
    //    à chaque tour — des centaines de fois par voyage.
    this.bouton(T("aAttaquer"), function () { self.menuAttaques(); }, { classe: "est-definitive" });
    // 🔴 EN DUEL, LE SAC ET LA FUITE N'EXISTENT PAS — et on ne les grise pas, on
    //    ne les met pas. Un duel n'oppose que deux équipes : ni potion, ni objet
    //    de statistique, ni rien qui vienne du compte. Deux boutons éteints à
    //    chaque tour raconteraient l'inverse, et la règle est déjà écrite à
    //    l'écran de duel avant qu'on entre.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN SERMENT QUI FERME LE SAC DOIT FERMER LE BOUTON, PAS LE DÉCEVOIR.
    //    Le Serment de l'audace et celui de la vertu retirent les soins en
    //    plein combat. Laisser le bouton actif et refuser au clic serait la
    //    faute que ce dossier traque partout — « le jeu sait, et il ne dit
    //    pas ». Le bouton disparaît, et l'écran des serments l'annonce avant
    //    qu'on s'engage.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 `soinInterdit` FERMAIT TOUT LE SAC, POKÉ BALLS COMPRISES — et le
    //     Serment du sacrifice promet en toutes lettres « tes coups ET TES
    //     POKÉ BALLS gagnent un tiers ». Son bonus de capture était donc
    //     INATTEIGNABLE : aucune Ball ne pouvait plus être lancée de tout le
    //     voyage, et rien ne le disait. Même écrasement pour `audace`, `vertu`
    //     et `economieDeGuerre`.
    //  ✅ LE DRAPEAU NE FERME QUE CE QU'IL NOMME : les soins. Le sac reste
    //     ouvert tant qu'il porte une Ball ou un objet de statistique — voir
    //     `menuSac`, qui saute le rayon des soins sous le même drapeau.
    // ═══════════════════════════════════════════════════════════════════════
    var jure = this.opt.serments || {};
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08, .nevix] LE TOUR PRIS S'ÉTEINT ICI, PAS AU CLIC. Cinq
    //     mécaniques retirent son tour au joueur — l'étreinte subie, la prise
    //     qu'on exerce, la charge, la fureur, la patience, la rage. Aucune
    //     n'était visible : les quatre boutons restaient allumés, et le sac
    //     dépensait une Ball qui ne partait jamais. On éteint ce qui ne peut
    //     rien faire, et chaque bouton dit sa raison — la règle du dossier.
    //  ⚠️ ATTAQUER reste allumé : c'est la seule chose qui puisse se jouer, et
    //     le moteur y remplacera le coup par celui qui est forcé.
    //  ⚠️ ÉQUIPE reste allumé quand le repli casse la prise (`changerOk`) :
    //     c'est le contre-jeu tranché le 13/08, et l'éteindre le supprimerait.
    // ═══════════════════════════════════════════════════════════════════════
    var pris = W.PokeCombat.tourForce ? W.PokeCombat.tourForce(this.etat) : null;
    if (!this.opt.duel && !this.opt.usine) {
      var bSac = this.bouton(T("aSac"), function () { self.menuSac(); },
        { desactive: !!pris, note: pris ? raisonDite(pris.raison) : null });
      if (pris) {
        bSac.setAttribute("data-info", "refus");
        bSac.setAttribute("data-info-val", pris.raison);
      }
    }
    var remplacants = 0;
    for (var k = 0; k < this.etat.joueur.equipe.length; k++) {
      if (k !== this.etat.joueur.actif && W.PokeCombat.vivant(this.etat.joueur.equipe[k])) remplacants++;
    }
    // 🔴 UN BOUTON ÉTEINT DIT POURQUOI — Y COMPRIS CEUX QUI N'ONT PAS D'OBJET
    //    DERRIÈRE. La règle était appliquée aux potions seulement, parce que le
    //    moteur nommait leurs refus. Balayé en jouant : ÉQUIPE s'éteint quand
    //    personne d'autre ne tient debout, FUIR s'éteint devant un dresseur, et
    //    les deux le faisaient sans un mot. Devant un bouton gris muet, le
    //    joueur ne peut pas distinguer une règle du jeu d'un défaut de l'écran.
    // ⚠️ Celui-ci reste éteint, et il le dit en clair : contrairement à la
    //    fuite, « personne d'autre ne tient debout » est un ÉTAT passager, pas
    //    une règle à enseigner, et le jeu d'origine n'a pas de réplique pour
    //    lui. Cinq mots sous le libellé, comme dans le sac.
    // ⚠️ SEUL ≠ DERNIER DEBOUT. « Personne d'autre ne tient debout » raconte
    //    des coéquipiers tombés — parti seul, il n'y a personne à raconter.
    var eqBloque = remplacants === 0 || !!(pris && !pris.changerOk);
    // ⚠️ `pris` PEUT ÊTRE NUL ICI, et l'oublier plantait le montage de l'écran
    //    de combat dès qu'un remplaçant tenait debout hors de toute prise —
    //    c'est-à-dire dans le cas ordinaire. Attrapé au banc, au premier
    //    montage : `Cannot read properties of null (reading 'raison')`.
    var raisonEq = remplacants === 0
      ? (this.etat.joueur.equipe.length === 1 ? "sansAutre" : "seulDebout")
      : (pris ? pris.raison : null);
    var bEq = this.bouton(T("aEquipe"), function () { self.menuEquipe(false); },
      { desactive: eqBloque,
        note: eqBloque ? raisonDite(raisonEq) : null });
    if (eqBloque) {
      bEq.setAttribute("data-info", "refus");
      bEq.setAttribute("data-info-val", raisonEq);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 FUIR NE S'ÉTEINT PLUS DEVANT UN DRESSEUR — LE JEU RÉPOND.
    //
    //  Tout le chemin canon existait et ne pouvait pas sortir : `combat.js`
    //  émet `fuiteRefusee`, la table porte la réplique du ROM — « Impossible de
    //  fuir un combat de dresseurs ! » —, et le son `DENIED` lui est associé.
    //  Trois pièces câblées, et un bouton gris devant, donc rien ne se
    //  déclenchait jamais. C'est la classe n°1 du dossier, en entier.
    //
    //  🔴 ET ÇA NE COÛTE RIEN, VÉRIFIÉ DANS LE MOTEUR : la branche rend ses
    //     événements et sort AVANT la riposte et avant la fin de tour. Aucun
    //     tour perdu, aucun tirage consommé — le contrat de rejeu ne bouge pas.
    //
    //  ⚠️ On préfère d'ordinaire éteindre un bouton qui ne peut rien faire.
    //     Pas celui-ci : « on ne fuit pas un dresseur » est une RÈGLE du jeu,
    //     pas un état passager, et le jeu d'origine l'enseigne en la disant,
    //     avec sa voix et son bruit. Un bouton gris n'enseigne rien — et le
    //     commentaire ci-dessus dit lui-même qu'on ne peut pas le distinguer
    //     d'un défaut de l'écran.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 DEVANT UN DRESSEUR, LA SORTIE N'EST PAS LA FUITE MAIS LE FORFAIT.
    //    Relevé en jouant : dernier Pokémon incapable de toucher l'adversaire
    //    (Normal contre un Spectre), et « on ne fuit pas un dresseur » — le
    //    combat ne finissait jamais. « FUITE » n'y menait qu'à un refus répété.
    //    On la remplace donc par « ABANDONNER » : cliquer ouvre l'avertissement
    //    (c'est une défaite, avec ses coûts) puis, confirmé, déclare forfait.
    //  ⚠️ JAMAIS INTERDIT, même sous un serment qui défend la fuite : un serment
    //     resserre le jeu, il n'enferme pas dans un combat sans fin. Seul le
    //     duel n'a pas de forfait — il a sa propre fin.
    // ═══════════════════════════════════════════════════════════════════════
    if (this.etat.adverse.dresseur) {
      if (!this.opt.duel) {
        this.bouton(T("aAbandonner"), function () { self.menuAbandon(); });
      }
    } else if (!this.opt.duel && !jure.fuiteInterdite) {
      // 🔴 [17/08] LA FUITE S'ÉTEINT SOUS UNE PRISE, ET ELLE LE DIT. Elle ne
      //    coûtait pas d'objet, mais elle devenait une attaque en silence :
      //    le joueur croyait fuir et voyait son Pokémon frapper.
      //    ⚠️ Devant un DRESSEUR c'est « ABANDONNER » qui s'affiche, juste
      //       au-dessus, et lui n'est jamais fermé : voir `jouerTour`.
      var bFui = this.bouton(T("aFuir"), function () { self.agir({ type: "fuite" }); },
        { desactive: !!pris, note: pris ? raisonDite(pris.raison) : null });
      if (pris) {
        bFui.setAttribute("data-info", "refus");
        bFui.setAttribute("data-info-val", pris.raison);
      }
    }
  };

  // 🔴 UN FORFAIT SE CONFIRME — C'EST IRRÉVERSIBLE. Un clic accidentel sur
  //    « ABANDONNER » ne doit pas coûter le voyage : on nomme le prix, puis on
  //    laisse revenir. L'avertissement redit la règle canon (« on ne fuit pas
  //    un dresseur ») que ce bouton a remplacée, pour qu'elle ne se perde pas.
  Ecran.prototype.menuAbandon = function () {
    var self = this;
    this.elActions.innerHTML = "";
    this.dire(T("abandonDit"));
    this.bouton(T("abandonOui"), function () { self.agir({ type: "abandon" }); },
      { classe: "est-definitive" });
    this.bouton(T("retour"), function () { self.menuPrincipal(); });
  };

  Ecran.prototype.menuAttaques = function () {
    var self = this;
    var mon = W.PokeCombat.actif(this.etat.joueur);
    this.elActions.innerHTML = "";

    // 🔴 TROUVÉ PAR L'AUTO-JOUEUR DOM : à court de PP sur les quatre attaques,
    //    l'écran ne proposait plus que « RETOUR » et le joueur était BLOQUÉ —
    //    alors que le moteur sait très bien enchaîner sur Lutte. Le moteur
    //    savait, l'écran ne disait rien. C'est la classe de défaut n°1 du
    //    projet, et c'est la troisième fois que cet outil l'attrape.
    // 🔴 [22/08, rapport de Rayhane] LA GARDE COMPTAIT LES PP, PAS LES COUPS
    //    JOUABLES. Trois attaques à zéro plus une ENTRAVÉE font une somme
    //    positive : le joueur voyait quatre boutons gris et « RETOUR »,
    //    sans aucune action possible. « Ce serait sympa que l'on puisse au
    //    moins utiliser Lutte. » Il a raison, et c'est la règle de 1996 :
    //    Lutte vient quand plus RIEN n'est jouable, pas quand les PP sont
    //    à zéro.
    //  ⚠️ MÊME LECTURE QUE LES BOUTONS, juste en dessous : un coup est gris
    //     si `pp <= 0 || estEntrave`. La garde lit la même chose, sinon les
    //     deux vérités divergent au premier cas tordu — et c'est ce cas
    //     tordu qui a bloqué un joueur en production.
    var entraveMenu = this.etat.joueur.volatils.entrave;
    var jouables = 0;
    for (var k = 0; k < mon.attaques.length; k++) {
      if (mon.attaques[k].pp > 0 && !(entraveMenu && entraveMenu.index === k)) jouables++;
    }
    if (jouables <= 0) {
      this.dire(T("plusDePP"));
      this.bouton(T("lutter"), function () { self.agir({ type: "attaque", index: 0 }); },
        { classe: "est-definitive" });
      this.bouton(T("retour"), function () { self.menuPrincipal(); });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA DÉCISION CENTRALE DU JEU SE PRENAIT À L'AVEUGLE. Le menu d'attaques
    //    donnait un nom et des PP. Ni le TYPE — alors que les deux combattants
    //    affichent le leur juste au-dessus — ni la PUISSANCE, ni ce que le coup
    //    vaut CONTRE CE QU'ON A EN FACE. Choisir entre Charge et Rugissement
    //    demandait de connaître les deux tables du jeu par cœur.
    // 🔴 ET LA TEINTE ÉTAIT POSÉE SANS ÊTRE PEINTE : `PokeType.poser` écrit
    //    `--teinte` sur le bouton, mais `.pkdx-touche` ne la consomme que sous
    //    `est-typee`. Une couleur promise et jamais rendue — la même faute que
    //    sur l'écran d'oubli d'attaque, deux heures plus tôt.
    // ═══════════════════════════════════════════════════════════════════════
    var adverse = W.PokeCombat.actif(this.etat.adverse);
    var typesEnFace = ESP()[adverse.n].types;

    // 🔴 UN COUP ENTRAVÉ SE VOIT AVANT DE SE CLIQUER (13/08). L'ennemi pose
    //    Entrave, le moteur refuse le coup — mais le bouton restait allumé :
    //    le joueur le pressait, perdait son tour, et découvrait la contrainte
    //    au moment exact où elle le condamnait. Un refus se dit AVANT.
    var entrave = this.etat.joueur.volatils.entrave;

    for (var i = 0; i < mon.attaques.length; i++) {
      (function (k) {
        var m = mon.attaques[k];
        var a = ATT()[m.cle];
        var estEntrave = !!(entrave && entrave.index === k);
        // ⚠️ UN COUP À ZÉRO PP S'ÉTEIGNAIT SANS UN MOT, sur le menu le plus
        //    utilisé du jeu. « 0/15 » était bien écrit, rien ne le liait au gris.
        var b = self.bouton(a.nom[LANG()],
          function () { self.agir({ type: "attaque", index: k }); },
          { desactive: m.pp <= 0 || estEntrave, classe: "est-typee pkdx-coup",
            note: m.pp <= 0 ? raisonDite("plusDePP") : null });

        // Ce que le coup vaut ici, et rien d'autre : un chiffre d'efficacité
        // afficherait une mécanique, un mot dit une décision.
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 « SANS EFFET » N'ÉTAIT JAMAIS ANNONCÉ SUR UN COUP DE PUISSANCE
        //     ZÉRO, alors que le moteur les REFUSE. Cage Éclair et Regard
        //     Médusant (`puissance: 0`) sur un Sol ou un Roche, Ombre Nocturne
        //     sur un Normal : le bouton ne disait rien, le tour était perdu.
        //     C'est la classe n°1 du dossier, sur les cas les plus fréquents du
        //     début de partie.
        //  ⚠️ ON NE L'ANNONCE QUE LÀ OÙ LE MOTEUR REFUSE VRAIMENT : les coups à
        //     dégâts fixes (`SPECIAL_DAMAGE`, `SUPER_FANG`, `OHKO`) et la
        //     paralysie pure. Un coup de statut ordinaire n'a pas de type
        //     opposable — l'annoncer « sans effet » serait faux dans l'autre sens.
        // ═══════════════════════════════════════════════════════════════════
        var REFUSE_SUR_IMMUNITE = { SPECIAL_DAMAGE_EFFECT: 1, OHKO_EFFECT: 1, SUPER_FANG_EFFECT: 1 };
        // ⚠️ `PARALYZE_EFFECT` est la SEULE clé de statut pur que le moteur
        //    refuse sur immunité de type (voir `combat.js`, « seul cas canon 1G
        //    certain »). On nomme donc exactement celle-là, pas la famille.
        var opposable = a.puissance > 0 || REFUSE_SUR_IMMUNITE[a.effet] ||
          a.effet === "PARALYZE_EFFECT";
        var eff = opposable ? W.PokeCombat.efficacite(a.type, typesEnFace) : 1;
        var mot = !opposable ? "" :
          eff === 0 ? T("effNulle") :
          !a.puissance ? "" :
          eff > 1 ? T("effForte") :
          eff < 1 ? T("effFaible") : "";
        // La raison du refus prend la place du mot d'efficacité : un coup
        // qu'on ne peut pas jouer n'a pas besoin de dire ce qu'il vaudrait.
        if (estEntrave) mot = T("coupEntrave");

        b.innerHTML =
          '<span class="pkdx-coup-tete">' +
            W.PokeType.pastille(a.type) +
            '<b>' + esc(a.nom[LANG()]) + "</b>" +
          "</span>" +
          '<span class="pkdx-coup-pied">' +
            (a.puissance ? '<span class="pkdx-coup-force">' + a.puissance + "</span>"
                         : ditEffetCourt(a)) +
            //  🔴 PHYSIQUE OU SPÉCIAL — demandé par un testeur (12/08), et il
            //     a mis le doigt sur la règle la plus cachée de 1996 : la
            //     catégorie suit le TYPE, pas l'attaque. Le moteur l'applique
            //     depuis toujours (`estSpecial`), l'écran la DIT enfin — même
            //     porte, jamais une seconde table.
            (a.puissance ? '<span class="pkdx-coup-categorie">' +
              T(W.PokeCombat.estSpecial(a.type) ? "coupSpecial" : "coupPhysique") + "</span>" : "") +
            '<span class="pkdx-coup-pp">' + m.pp + "/" + m.ppMax + " " + T("pp") + "</span>" +
          "</span>" +
          // 🔴 UN ÉTAT EMPRUNTAIT LA FORME D'UN VERDICT. « BLOQUÉE PAR ENTRAVE »
          //    remplaçait bien le mot, mais `data-eff` continuait d'être calculé
          //    depuis l'EFFICACITÉ : un coup entravé super efficace sortait en
          //    encre pleine grasse — le style de « super efficace » — et un coup
          //    de statut entravé en encre douce, celui de « peu efficace ». La
          //    loi du mode dit qu'un état se distingue par sa propre forme, pas
          //    par celle d'autre chose.
          (mot ? '<span class="pkdx-coup-eff" data-eff="' +
            (estEntrave ? "bloque" : eff === 0 ? "nulle" : eff > 1 ? "forte" : "faible") +
            '">' + mot + "</span>" : "");
        // 🔴 L'infobulle du mode, pas le `title` du navigateur : celui-ci met
        //    deux secondes à venir, ne s'ouvre pas au clavier et n'existe pas
        //    sur téléphone. Les PP RESTANTS voyagent avec, parce que c'est ce
        //    que le joueur veut savoir — la table ne dit que le maximum.
        W.PokeType.poser(b, a.type);
        b.setAttribute("data-info", "attaque");
        b.setAttribute("data-info-val", m.cle);
        b.setAttribute("data-pp", m.pp + " / " + m.ppMax);
      })(i);
    }
    this.bouton(T("retour"), function () { self.menuPrincipal(); });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SAC — IL NE MONTRAIT QUE DES BALLS
  //
  //  🔴 LE BUTIN DISTRIBUE DES POTIONS DEPUIS LE PREMIER JOUR, et aucune
  //     n'était utilisable : le sac de combat n'affichait que les Balls. Le
  //     joueur ramassait des soins, les regardait s'accumuler, et n'en faisait
  //     jamais rien. Une carte de butin sur trois ne servait à rien.
  //
  //  🔴 ET C'EST LA DÉCISION QUI MANQUAIT AU COMBAT. Sans objet, un tour
  //     n'offre qu'un choix : quelle attaque. Avec, il en offre un vrai —
  //     soigner ou frapper — parce que soigner COÛTE LE TOUR.
  //
  //  L'ordre des rayons suit l'urgence : les soins d'abord quand on est bas,
  //  les Balls d'abord quand la créature en face est rare. On ne devine pas :
  //  les deux rayons sont là, séparés, et le joueur tranche.
  Ecran.prototype.menuSac = function () {
    var self = this;
    var sac = (this.opt.partie && this.opt.partie.sac) || {};
    this.elActions.innerHTML = "";
    var vu = false;
    var mon = W.PokeCombat.actif(this.etat.joueur);

    // ── Les soins ────────────────────────────────────────────────────────────
    // ⚠️ ET C'EST ICI, ET NULLE PART AILLEURS, QUE `soinInterdit` MORD. Il
    //    fermait le sac ENTIER, donc les Poké Balls avec — voir le commentaire
    //    du bouton SAC. Un serment ne retire que ce que sa phrase annonce.
    var jureSac = (this.opt.serments || {});
    var SOINS = jureSac.soinInterdit ? {} : (W.PokeCombat.OBJETS_SOIN || {});
    var vuSoin = false;
    for (var s in SOINS) {
      if (!sac[s]) continue;
      vu = true;
      vuSoin = true;
      (function (c) {
        // ═══════════════════════════════════════════════════════════════════════
        // 🔴 UN RAPPEL NE PEUT PAS SERVIR EN COMBAT, ET « IL EST DEBOUT » EST FAUX.
        //    Relevé EN JOUANT : mon actif tombe, j'envoie mon dernier debout, je
        //    veux relever le tombé — le sac montrait « Rappel ×5 » puis le
        //    refusait, « Il est debout ». La cause est structurelle : le sac de
        //    combat n'applique un objet qu'au Pokémon ACTIF, et l'actif est
        //    TOUJOURS debout (dès qu'il tombe, le jeu force un remplacement). Le
        //    refus parlait donc de l'actif, jamais du tombé que le joueur visait.
        //    On ne le RETIRE pas — le cacher afficherait « sac vide » à qui en a
        //    cinq en poche — on dit la vérité utile : ça se joue à la CARTE, où
        //    l'on désigne qui relever entre deux nœuds. Un refus qui indique où
        //    agir n'est plus un piège, c'est une direction.
        // ═══════════════════════════════════════════════════════════════════════
        if (SOINS[c].ranime !== undefined) {
          var br = self.bouton(nomObjet(c) + " ×" + sac[c], function () {},
            { desactive: true, note: raisonDite("rappelHorsCombat") });
          br.setAttribute("data-info", "objet");
          br.setAttribute("data-info-val", c);
          br.setAttribute("data-info-refus", "rappelHorsCombat");
          return;
        }
        // 🔴 CE QUI NE FERAIT RIEN SE VOIT DÉSACTIVÉ. Une Potion à pleine vie
        //    consommerait le tour et l'objet : c'est un piège. Le moteur la
        //    refuse déjà ; l'écran doit le DIRE avant le clic, pas après.
        var essai = W.PokeCombat.appliquerObjet(copie(mon), c);
        // 🔴 ET CE QU'IL RENDRAIT SE DIT AVANT LE CLIC. Le refus était annoncé
        //    depuis longtemps, l'EFFET jamais : entre une Potion et une Hyper
        //    Potion sur un blessé de 12 PV, les deux rendent 12, et la seconde
        //    est jetée. Le moteur a déjà calculé le nombre sur la copie.
        var b = self.bouton(nomObjet(c) + " ×" + sac[c],
          function () { self.agir({ type: "objet", objet: c }); },
          { desactive: !essai.ok,
            note: !essai.ok ? raisonDite(essai.raison)
                : essai.soigne > 0 ? T("sacRendra", { n: essai.soigne })
                : null });
        b.setAttribute("data-info", "objet");
        b.setAttribute("data-info-val", c);
        // 🔴 UN BOUTON ÉTEINT SANS RAISON EST UN BOUTON CASSÉ. Le moteur nomme
        //    déjà le refus — « pleineVie », « aTerre », « rienALever » — et
        //    cette raison partait à la poubelle depuis le premier jour. On
        //    voyait une Potion grisée en plein combat sans savoir si le jeu la
        //    refusait ou si l'écran avait un défaut. L'infobulle la dit.
        if (!essai.ok && essai.raison) b.setAttribute("data-info-refus", essai.raison);
      })(s);
    }

    // ── L'état de celui qu'on soigne, EN TÊTE du rayon ───────────────────────
    // Il n'apparaît que s'il y a un soin à choisir : devant un rayon de Balls,
    // une barre de vie serait du décor.
    if (vuSoin) this.elActions.insertBefore(etatDuSoigne(mon), this.elActions.firstChild);

    // ── Les objets de statistique ────────────────────────────────────────────
    // 🔴 SEPT OBJETS VENDUS ET INEMPLOYABLES. Attaque +, Défense +, Vitesse +,
    //    Atq. Spé. +, Précision +, Muscle + et Garde-Stats étaient à l'étal —
    //    350 à 950 ₽ pièce — et le sac de combat ne les affichait pas. Le
    //    joueur pouvait dépenser six mille ₽ pour des objets qui ne servaient
    //    nulle part. C'est la faute du sac qui ne montrait que des Balls,
    //    réparée pour les soins il y a des semaines et jamais pour ceux-là.
    var STATS = W.PokeCombat.OBJETS_STAT || {};
    for (var st in STATS) {
      if (!sac[st]) continue;
      vu = true;
      (function (c) {
        // Un palier déjà au plafond ne se paie pas d'un tour : on le dit avant.
        var o = STATS[c];
        // ⚠️ LE DRAPEAU EST CELUI DU MOTEUR, PAS UN NOM LOCAL. Ces objets
        //    posaient `gardeStats`, que rien ne lisait ; ils posent désormais
        //    le volatil canon (`brume`, `puissance`). L'écran lit donc le
        //    volatil que l'objet DÉCLARE, sans en connaître le nom d'avance.
        var plein = o.volatil
          ? !!self.etat.joueur.volatils[o.volatil]
          : (self.etat.joueur.paliers[o.stat] || 0) >= 6;
        var b = self.bouton(nomObjet(c) + " ×" + sac[c],
          function () { self.agir({ type: "stat", objet: c }); },
          { desactive: plein,
            note: plein ? raisonDite(o.garde ? "gardePosee" : "palierPlein") : null });
        b.setAttribute("data-info", "objet");
        b.setAttribute("data-info-val", c);
        // Le plafond de palier se dit aussi : « déjà au maximum » explique un
        // bouton éteint que rien d'autre n'explique.
        if (plein) b.setAttribute("data-info-refus", o.garde ? "gardePosee" : "palierPlein");
      })(st);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LES BALLS — ET CE QU'ELLES VALENT ICI, MAINTENANT
    //
    //  🔴 MESURÉ, ET C'EST LA MÉCANIQUE LA PLUS CHÈREMENT CACHÉE DU MODE :
    //     Artikodin niveau 50 à la Super Ball, c'est 2,6 % éveillé et 16,6 %
    //     ENDORMI. Six fois mieux. Tout le savoir-faire de la première
    //     génération — on affaiblit, on endort, PUIS on lance — est câblé dans
    //     `capture.js` depuis le premier jour, et RIEN à l'écran ne le disait.
    //     Sur 300 voyages du harnais, les trois oiseaux ont été croisés douze
    //     fois et capturés ZÉRO fois : la politique n'y pense pas, et un joueur
    //     qui n'a pas grandi avec le jeu n'y pense pas non plus. Le nœud du
    //     légendaire annonce lui-même « un seul essai, et il ne revient pas » :
    //     l'ignorance coûtait l'espèce, définitivement.
    //
    //  🔴 ON DONNE LE CHIFFRE, PAS UN CONSEIL. « Endors-le d'abord » est un
    //     tutoriel qu'on lit une fois et qu'on oublie ; « 3 % » sur la Ball
    //     qu'on s'apprêtait à lancer est une DÉCISION — risquer maintenant, ou
    //     passer un tour à endormir en espérant qu'il ne fuie pas. Et le chiffre
    //     bouge à chaque coup porté, donc il ENSEIGNE la mécanique en la jouant.
    //
    //  ⚠️ Il vient de `PokeCapture.chance`, qui relit les mêmes constantes que
    //     le tirage et ne consomme AUCUN hasard : une estimation qui piocherait
    //     dans la graine tuerait le rejeu, donc le Défi du jour, le jour où l'on
    //     ouvre son sac. `poke-chance-capture.mjs` compare l'annonce à 20 000
    //     tirages réels sur 240 situations.
    //  ⚠️ RIEN CONTRE UN DRESSEUR : la Ball y est déjà refusée, et afficher
    //     « 0 % » sur un bouton grisé donnerait un chiffre pour une règle.
    // ═══════════════════════════════════════════════════════════════════════
    var cible = W.PokeCombat.actif(this.etat.adverse);
    var serm = (this.opt.partie && W.PokeSerments)
      ? W.PokeSerments.effet(this.opt.partie).capture : 1;
    for (var cle in NOMS_BALL) {
      if (!sac[cle]) continue;
      vu = true;
      (function (c) {
        var chiffre = "";
        if (!self.etat.adverse.dresseur && cible && W.PokeCapture.chance) {
          var p = W.PokeCapture.chance(cible, c, serm);
          chiffre = " · " + T("chancePrise", { n: pourCent(p) });
        }
        var bb = self.bouton(nomBall(c) + " ×" + sac[c] + chiffre,
          function () { self.agir({ type: "ball", ball: c }); },
          { desactive: self.etat.adverse.dresseur,
            note: self.etat.adverse.dresseur ? raisonDite("aUnDresseur") : null,
            classe: c === "MASTER_BALL" ? "est-definitive" : "" });
        bb.setAttribute("data-info", "objet");
        bb.setAttribute("data-info-val", c);
        // 🔴 LE CHIFFRE APPELLE UNE QUESTION, L'INFOBULLE Y RÉPOND. « prise
        //    3 % » sans moyen de le faire monter décourage au lieu d'apprendre.
        //    ⚠️ Pas sur la Master Ball : elle est à 100 %, il n'y a rien à
        //       lever, et lui prêter des leviers ferait douter d'une certitude.
        if (chiffre && c !== "MASTER_BALL") bb.setAttribute("data-info-leviers", "1");
        // 🔴 ET QUAND ELLE EST ÉTEINTE, ELLE DIT POURQUOI. Vu à l'écran en
        //    jouant : devant un dresseur, « Poké Ball ×14 » grisée, sans un mot.
        //    Les potions portent leur refus depuis qu'on a nommé cette classe —
        //    la Ball, non, alors que le moteur a la phrase (« Ce Pokémon
        //    appartient à quelqu'un ! ») et ne la sort qu'APRÈS un lancer qui
        //    n'est plus possible. Un bouton éteint sans raison se lit comme un
        //    défaut de l'écran, et c'est la classe n°1 du dossier.
        if (self.etat.adverse.dresseur) bb.setAttribute("data-info-refus", "aUnDresseur");
      })(cle);
    }
    if (!vu) this.bouton(T("sacVide"), function () {}, { desactive: true });
    this.bouton(T("retour"), function () { self.menuPrincipal(); });
  };

  // 🔴 UNE SEULE PORTE VERS LA PHRASE DU REFUS. Trois endroits du sac éteignent
  //    un bouton ; chacun doit pouvoir DIRE pourquoi sans que la phrase soit
  //    recopiée. Elle vient de la table `refus_*` de `infobulles.js`, la même
  //    que l'infobulle lit — deux tables auraient fini par diverger.
  function raisonDite(cle) {
    return (cle && W.PokeInfobulles && W.PokeInfobulles.raison)
      ? W.PokeInfobulles.raison(cle) : null;
  }

  // Un essai à blanc : on n'applique jamais l'objet sur la vraie créature pour
  // savoir s'il servirait à quelque chose.
  function copie(mon) {
    return { pv: mon.pv, statut: mon.statut, stats: { pv: mon.stats.pv } };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UN OBJET SE NOMME DANS LE MONDE OÙ ON LE TIENT
  //
  //  🔴 CETTE LIGNE LISAIT LA TABLE DE 1996, ET RIEN D'AUTRE. Sous Johto,
  //     aucune des clés d'objet tenu n'y figure : le repli `: cle` rendait donc
  //     l'identifiant du ROM, et le joueur lisait « LEFTOVERS rend 12 PV à
  //     Ronflex » ou « KINGS_ROCK fait reculer Fouinette ». Toute la famille
  //     des objets tenus était concernée, y compris les deux lignes écrites
  //     avant celle-ci.
  //  🔑 LE REPLI SUR LA CLÉ EST CE QUI L'A CACHÉ : il ne plante pas, il ne
  //     laisse pas de trou, il affiche quelque chose — et ce quelque chose
  //     ressemble à du code. Même classe que « DOME_FOSSIL » servi brut, que le
  //     dossier a déjà payée une fois.
  //  🔑 ON DEMANDE DONC AU REGISTRE, qui sait quel monde est posé, et on garde
  //     la table de 1996 en second : un objet de Kanto nommé pendant un voyage
  //     de Johto (le sac traverse) reste nommé.
  // ═══════════════════════════════════════════════════════════════════════════
  function nomObjet(cle) {
    var T2 = W.PokeRegles && W.PokeRegles.objetsTable && W.PokeRegles.objetsTable();
    var o = (T2 && T2[cle]) || (W.PokeRegles ? W.PokeRegles.objet(cle) : (W.POKE_OBJETS && W.POKE_OBJETS[cle]));
    return o && o.nom ? o.nom[LANG()] : cle;
  }

  // 🔴 Le joueur CHOISIT qui entre, y compris quand son Pokémon vient de tomber.
  //    `force` retire le retour : il faut envoyer quelqu'un.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CHANGEMENT — LA DÉCISION LA PLUS IMPORTANTE, ET LA MOINS ÉCLAIRÉE
  //
  //  🔴 EN PREMIÈRE GÉNÉRATION, CHANGER DE POKÉMON EST LE CŒUR DU JEU : pas
  //     de talents, pas d'objets tenus, pas de priorité — il ne reste que le
  //     type et le moment. Or ce menu n'affichait qu'un nom, un niveau et des
  //     points de vie. Le joueur devait connaître les quinze types de cent
  //     cinquante et une espèces par cœur pour décider, exactement le savoir
  //     absent qu'on a déjà refusé au menu des attaques.
  //
  //  🔴 ON DIT CE QU'IL VA ENCAISSER, PAS CE QU'IL VA INFLIGER. Le menu des
  //     coups répond déjà à « qu'est-ce que je fais ? » ; celui-ci répond à
  //     « qui envoyer ? », et la question est défensive : ce qui tue un relais,
  //     c'est le coup qu'il prend en entrant. On lit donc les types EN FACE
  //     contre les siens, et on prend le pire.
  //  ⚠️ MÊME GRAMMAIRE QUE LES ATTAQUES — pastilles de type et un mot, pas un
  //     chiffre. Deux écrans qui posent la même question doivent se lire de la
  //     même façon, sinon on réapprend à chaque fois.
  // ═══════════════════════════════════════════════════════════════════════════
  Ecran.prototype.menuEquipe = function (force) {
    var self = this;
    this.elActions.innerHTML = "";
    var eq = this.etat.joueur.equipe;
    var enFace = W.PokeCombat.actif(this.etat.adverse);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CET ÉCRAN CONTREDISAIT L'ÉCRAN D'ARÈNE, À DEUX CLICS D'ÉCART.
    //     L'arène annonce « Tortank — FRAPPE FORT · Florizarre — FRAGILE » en
    //     lisant les ATTAQUES RÉELLES des deux camps (`PokeMesure.contre`). Ce
    //     menu, lui, ne regardait que le TYPE de l'adversaire et ne disait que
    //     le côté DÉFENSIF : le joueur retrouvait donc, au moment de relayer,
    //     une moitié de la réponse — et parfois l'inverse de ce qu'on venait de
    //     lui promettre. Un Caninos qui ne porte aucune attaque Feu ne rend
    //     personne fragile, et son type disait le contraire.
    //  ✅ Même porte que l'arène. Deux écrans qui posent la même question
    //     doivent se lire de la même façon — c'est écrit dans le commentaire
    //     d'origine de cette fonction, et ce n'était pas tenu.
    //  ⚠️ Le vocabulaire reste celui du RELAIS : ici un rapport supérieur à un
    //     est une MAUVAISE nouvelle. On garde `relaisFragile`/`relaisSolide`,
    //     on emprunte seulement le CALCUL.
    // ═══════════════════════════════════════════════════════════════════════
    var mesure = (W.PokeMesure && enFace)
      // ⚠️ `this.opt.hasard`, PAS `this.hasard` — qui n'existe pas. Mon premier
      //    jet a jeté « Cannot read properties of undefined » au premier clic
      //    sur ÉQUIPE, en plein combat, et l'écran restait figé sur « Un
      //    Rattata sauvage apparaît ! ». La batterie était VERTE : `node
      //    --check` compile une propriété qui n'existe pas, et aucun détecteur
      //    ne joue un combat. C'est la vérification À L'ÉCRAN qui l'a trouvé.
      ? W.PokeMesure.contre(eq, [enFace], this.opt.hasard.derive("mesure")) : [];
    for (var i = 0; i < eq.length; i++) {
      (function (k) {
        var m = eq[k];
        // 🔴 LES DEUX BOUTONS ÉTEINTS DE CET ÉCRAN NE DISAIENT PAS POURQUOI —
        //    alors que la règle « un bouton éteint dit sa raison » est
        //    appliquée trois fois dans le sac et deux fois au menu principal.
        var aTerre = m.pv <= 0, enJeu = k === self.etat.joueur.actif;
        var b = self.bouton("", function () { self.changer(k, force); },
          { desactive: aTerre || enJeu, classe: "pkdx-relais",
            note: aTerre ? raisonDite("relaisATerre")
                : enJeu ? raisonDite("relaisEnJeu") : null });
        var e = ESP()[m.n];
        var mes = m.typesForces || e.types;
        var vu = mesure[k] || {};
        var mot = vu.subit === "fragile" ? T("relaisFragile")
          : vu.subit === "tient" ? T("relaisSolide") : "";
        var pire = vu.subit === "fragile" ? 2 : vu.subit === "tient" ? 0.5 : 1;
        // 🔴 ET LE CÔTÉ OFFENSIF, QUI MANQUAIT. Choisir un relais, c'est
        //    répondre à deux questions : qu'est-ce que j'encaisse, et
        //    qu'est-ce que je rends. L'arène disait les deux ; ici on ne
        //    disait que la première, donc le joueur relayait à l'aveugle sur
        //    la moitié de la décision.
        var motFrappe = vu.frappe === "fort" ? T("relaisFrappe")
          : vu.frappe === "rien" ? T("relaisMord") : "";
        b.innerHTML =
          '<span class="pkdx-coup-tete">' +
            mes.map(function (x) { return W.PokeType.pastille(x); }).join("") +
            "<b>" + esc(nomDe(m)) + "</b>" +
          "</span>" +
          '<span class="pkdx-coup-pied">' +
            '<span class="pkdx-coup-force">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
            '<span class="pkdx-coup-pp">' + m.pv + " / " + m.stats.pv + "</span>" +
          "</span>" +
          // 🔴 SES PROPRES VALEURS, PAS CELLES DES ATTAQUES. Au menu des coups,
          //    « forte » est une bonne nouvelle ; ici, un rapport de type
          //    supérieur à un est une MAUVAISE nouvelle — le relais encaisse
          //    plus. Réemployer `forte`/`faible` aurait donné au mot le style
          //    de son contraire, et personne ne s'en serait aperçu.
          (motFrappe ? '<span class="pkdx-coup-eff" data-relais="' +
            (vu.frappe === "fort" ? "frappe" : "mord") + '">' + motFrappe + "</span>" : "") +
          (mot ? '<span class="pkdx-coup-eff" data-relais="' +
            (pire > 1 ? "fragile" : "solide") + '">' + mot + "</span>" : "");
      })(i);
    }
    var dispo = false;
    for (var d = 0; d < eq.length; d++) if (d !== self.etat.joueur.actif && eq[d].pv > 0) dispo = true;
    if (!dispo) this.dire(T("personne"));
    if (!force) this.bouton(T("retour"), function () { self.menuPrincipal(); });
  };

  Ecran.prototype.changer = function (index, force) {
    if (force) {
      // Après un K.O., entrer ne coûte pas le tour : c'est la règle du jeu.
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 CE BLOC RECOPIAIT L'ENTRÉE EN JEU, ET IL L'AVAIT DÉJÀ PAYÉ UNE
      //     FOIS : sa table de paliers, écrite à la main, nommait `spe` — sous
      //     Johto la Spéciale s'appelle `sat`/`sdf`, donc le remplaçant
      //     repartait avec des paliers où sa statistique n'existait pas. Les
      //     dégâts devenaient NaN, les points de vie aussi, et `NaN > 0` étant
      //     faux, la créature comptait pour morte sans jamais tomber. Vu à
      //     l'écran : « NaN / 19 » et un combat qui ne finit plus.
      //  🔑 ON DEMANDE DONC AU MOTEUR, ENTIÈREMENT. Depuis 1999 un piège posé
      //     au sol mord À L'ENTRÉE : il doit mordre par toutes les portes ou
      //     par aucune, et l'écran n'a pas à savoir qu'un tel piège existe.
      //  ⚠️ L'annonce voyage AVEC : sans elle, la ligne « Go, X ! » serait dite
      //     ici puis effacée aussitôt par la première ligne du piège.
      // ═══════════════════════════════════════════════════════════════════
      var evEntree = [];
      //  🔑 `de` EST LE RANG QUI PART, et il fait tout le travail de l'écran :
      //     c'est lui qui laisse le sprite du tombé à sa place le temps de
      //     l'annonce, puis le remplace. Sans lui, le nouveau venu apparaît
      //     avant d'être nommé.
      var partant = this.etat.joueur.actif;
      W.PokeCombat.entrerEnJeu(this.etat, "joueur", index, evEntree, {
        annonce: { t: "envoie", cote: "joueur", de: partant, index: index,
                   n: this.etat.joueur.equipe[index].n,
                   pv: this.etat.joueur.equipe[index].pv },
      });
      this.etat.joueur.participants[index] = true;
      this.etat.attenteJoueur = false;
      this.rafraichir();
      this.jouer(evEntree);
      return;
    }
    this.agir({ type: "changer", index: index });
  };

  Ecran.prototype.agir = function (action) {
    if (this.enCours || this.etat.fini) return;
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08, rapport de .nevix] LA BALL SORTAIT DU SAC ET N'ÉTAIT JAMAIS
    //     LANCÉE. « Quand notre Pokémon est pris au piège dans Danse Flammes on
    //     ne peut pas lancer de Pokéball. » Le refus est la règle depuis le
    //     13/08 — l'étreinte prend le tour, seul le repli en sort. Mais l'ordre
    //     des deux gestes était inversé : ce bloc RETIRAIT l'objet du sac, puis
    //     `jouerTour` remplaçait l'action par une attaque. La Ball disparaissait
    //     sans partir, sans une ligne, et le joueur lisait « on ne peut pas
    //     lancer de Pokéball » — il avait raison, et il payait en plus.
    //     ⚠️ Sur la MASTER BALL c'était l'espèce : elle est unique, réservée à
    //        l'un des cinq légendaires, et le nœud annonce « un seul essai ».
    //  🔴 LE REFUS PASSE DONC AVANT LA DÉPENSE, et il PARLE. La règle elle-même
    //     ne bouge pas d'un cran : `tourForce` est la lecture du moteur, pas une
    //     seconde copie de la règle.
    //  ⚠️ Le repli reste permis quand il casse la prise (`changerOk`), et
    //     ABANDONNER passe toujours : c'est la seule sortie d'un combat de
    //     dresseur qu'on ne peut ni gagner ni fuir.
    // ═══════════════════════════════════════════════════════════════════════
    var pris = W.PokeCombat.tourForce ? W.PokeCombat.tourForce(this.etat) : null;
    if (pris && action && action.type !== "attaque" && action.type !== "abandon"
        && !(pris.changerOk && action.type === "changer")) {
      this.dire(raisonDite(pris.raison) || T("etreint", { nom: nomDe(W.PokeCombat.actif(this.etat.joueur)) }));
      this.menuPrincipal();
      return;
    }
    // ── CE QUI SE CONSOMME SORT DU SAC ───────────────────────────────────────
    // 🔴 AUCUNE BALL N'ÉTAIT JAMAIS DÉCOMPTÉE : `utiliserBall` existait,
    //    exportée, et n'était appelée nulle part. On en lançait douze, il en
    //    restait douze. Toute l'économie du mode en dépendait — le prix des
    //    Balls, les cartes de butin qui en donnent, et la Master Ball unique
    //    dont le choix entre cinq légendaires était censé être la décision la
    //    plus tendue du voyage.
    // 🔴 ON RETIRE AVANT DE JOUER LE TOUR, et on renonce si le sac est vide :
    //    l'inverse laisserait le moteur agir sur un objet qu'on n'a pas.
    var partie = this.opt.partie;
    // 🔴 UN OBJET DE STATISTIQUE SORT DU SAC COMME LES AUTRES. Sans cette
    //    ligne, Attaque + se rejouerait à l'infini : le palier monterait de six
    //    crans pour le prix d'un seul objet.
    var cle = action.type === "ball" ? action.ball
      : (action.type === "objet" || action.type === "stat") ? action.objet : null;
    if (cle && partie) {
      if (!W.PokePartie.utiliserObjet(partie, cle)) return;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 EN DUEL, L'ADVERSAIRE JOUE LA POLITIQUE PARTAGÉE, pas l'intelligence
    //    des dresseurs. C'est la même fonction que celle qui décide dans
    //    `PokeDuel.jouer` — donc le dresseur qu'on affronte se bat exactement
    //    comme il se battrait sur l'écran de l'autre joueur. Deux politiques
    //    voudraient dire deux jeux, et un vainqueur qui dépend de l'écran.
    // 🔴 ELLE SE CALCULE AVANT `jouerTour`, sur l'état intact : après, l'actif
    //    a pu changer et la décision porterait sur un autre combat.
    var advAction = this.opt.politiqueAdverse
      ? this.opt.politiqueAdverse(this.etat, this.opt.hasard) : null;
    var ev = W.PokeCombat.jouerTour(this.etat, action, this.opt.hasard, advAction);
    if (this.opt.journal) this.opt.journal.push(action);
    this.jouer(ev);
  };

  Ecran.prototype.terminer = function () {
    this.nettoyerMinuteursCapture();
    this.elActions.innerHTML = "";
    var f = this.etat.fini;
    if (f === "victoire") this.dire(T("victoire"));
    // 🔴 « TU N'AS PLUS DE POKÉMON » SERAIT FAUX APRÈS UN ABANDON — on peut
    //    jeter l'éponge avec un debout. La défaite partage le même `fini`
    //    (mêmes coûts : l'argent, l'essai, le nœud rouvert), mais pas la phrase.
    else if (f === "defaite") this.dire(this.etat.abandon ? T("abandonFait") : T("defaite"));
    else if (f === "fuite") this.dire(T("fuiteOk"));
    else if (f === "capture") this.dire(T("pris", { nom: nomDe(W.PokeCombat.actif(this.etat.adverse)) }));
    if (this.opt.surFin) this.opt.surFin(f, this.etat);
  };

  W.PokeUICombat = {
    Ecran: Ecran,
    T: T,
    mettreEnMots: mettreEnMots,
    nomDe: nomDe,
    nomBall: nomBall,
    sprite: sprite,
    NON_DITS: NON_DITS,
  };
})(typeof window !== "undefined" ? window : globalThis);
