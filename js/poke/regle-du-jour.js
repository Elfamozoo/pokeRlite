// ═══════════════════════════════════════════════════════════════════════════
//  LA RÈGLE DU JOUR — CE QUI FAIT REVENIR DEMAIN PLUTÔT QU'APRÈS-DEMAIN
//
//  🔴 LE DÉFI DU JOUR NE CHANGEAIT QUE DE CARTE. Même graine pour tous, même
//     règles, même monde : d'un jour à l'autre, ce qui change est un tirage.
//     Une série se tient sur un nombre, pas sur un souvenir — et personne ne
//     raconte « la carte d'hier ». Les roguelites qui tiennent leurs joueurs
//     font l'inverse : chaque jour a SA contrainte, la même pour tout le monde,
//     et c'est ELLE qu'on commente.
//
//  🔴 ELLE SE DÉRIVE DE LA DATE, PAS DU HASARD DE LA PARTIE. Tirer la règle
//     avec le `PokeHasard` du voyage consommerait un tirage et décalerait tout
//     le rejeu — la faute que ce dossier a déjà payée deux fois. `pokeGraineDe`
//     est une fonction pure de la date : deux joueurs, deux machines, deux
//     rejeux du serveur trouvent la même règle sans rien consommer.
//
//  🔴 AUCUNE MÉCANIQUE NEUVE. Chaque règle s'exprime dans les clés d'effet que
//     le combat, le butin, la capture et l'expérience LISENT DÉJÀ — celles des
//     serments et des sceaux. Une règle du jour ne peut donc pas avoir de
//     branche morte : le jour où une clé cesse d'être lue, tous les serments
//     tombent avec elle, et ça se voit.
//
//  ⚠️ ELLES NE SONT PAS TOUTES DURES. Une contrainte quotidienne qui ne fait
//     que punir se contourne en ne jouant pas. Trois donnent, trois prennent,
//     une échange — c'est le mélange qui donne envie de voir celle de demain.
// ═══════════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  var REGLES = [
    {
      id: "chasse",
      nom: { fr: "Journée de chasse", en: "Hunting day" },
      dit: { fr: "Les Poké Balls tiennent mieux. L'expérience rentre moins vite.",
             en: "Poké Balls hold better. Experience comes in slower." },
      effet: { capture: 2, expGain: 0.8 },
    },
    {
      id: "mainLegere",
      nom: { fr: "Main légère", en: "Light hand" },
      dit: { fr: "Trois Pokémon au plus. Ils grandissent moitié plus vite.",
             en: "Three Pokémon at most. They grow half again as fast." },
      effet: { equipeMax: 3, expGain: 1.5 },
    },
    {
      id: "pochesPleines",
      nom: { fr: "Les poches pleines", en: "Full pockets" },
      dit: { fr: "L'argent double. Une carte de butin de plus à chaque fois.",
             en: "Money doubles. One more loot card each time." },
      effet: { argent: 2, butinChoix: 1 },
    },
    {
      id: "sangFroid",
      nom: { fr: "Sang-froid", en: "Cold blood" },
      dit: { fr: "Tes coups critiques sont plus fréquents. Tu encaisses plus.",
             en: "Your critical hits come more often. You take more." },
      effet: { critBonus: 0.25, degatsSubis: 1.15 },
    },
    {
      id: "marcheForcee",
      nom: { fr: "Marche forcée", en: "Forced march" },
      dit: { fr: "Les Champions gagnent deux niveaux. Le butin s'élargit.",
             en: "Gym Leaders gain two levels. The loot widens." },
      effet: { bossNiveau: 2, butinChoix: 1 },
    },
    {
      id: "economieDeGuerre",
      nom: { fr: "Économie de guerre", en: "War economy" },
      dit: { fr: "Aucun soin en combat. L'argent rentre moitié plus.",
             en: "No healing in battle. Money comes in half again." },
      effet: { soinInterdit: true, argent: 1.5 },
    },
    {
      id: "jourDesBraves",
      nom: { fr: "Le jour des braves", en: "The brave day" },
      dit: { fr: "Tout frappe plus fort, des deux côtés.",
             en: "Everything hits harder, on both sides." },
      effet: { degatsInfliges: 1.25, degatsSubis: 1.25 },
    },
  ];

  var PAR_ID = {};
  for (var i = 0; i < REGLES.length; i++) PAR_ID[REGLES[i].id] = REGLES[i];

  //  🔴 PURE FONCTION DE LA DATE. Aucun `PokeHasard`, donc aucun tirage
  //     consommé : le rejeu du serveur retrouve la même règle sans compter.
  //  ⚠️ L'étiquette est distincte de celle de la carte (`POKE-JOUR-`) : deux
  //     dérivations sur la même chaîne feraient de la règle et du monde deux
  //     faces du même tirage, et un joueur qui apprend l'un devinerait l'autre.
  function pour(date) {
    if (!date) return null;
    var h = W.pokeGraineDe("POKE-REGLE-" + date);
    return REGLES[h % REGLES.length];
  }

  function de(id) { return PAR_ID[id] || null; }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CELLE DE DEMAIN — LA SEULE PHRASE QUI PARLE DU JOUR SUIVANT
  //
  //  🔴 UNE SÉRIE DEMANDE DE REVENIR, ELLE NE DONNE PAS ENVIE. « 4 jours
  //     d'affilée » est un constat ; « demain : Main légère » est un rendez-vous.
  //     C'est la différence entre un compteur et une raison, et elle ne coûte
  //     qu'une dérivation de plus — la règle est une fonction PURE de la date,
  //     donc celle de demain est connue aujourd'hui, exactement comme la carte
  //     du jour est connue de tous.
  //  🔴 AUCUN OBJET `Date` ICI, ET C'EST LE DÉTECTEUR QUI ME L'A APPRIS. Ce
  //     fichier est dans le NOYAU — celui que le serveur rejoue — et
  //     `poke-rng.mjs` y interdit toute source de hasard hors graine, `Date`
  //     comprise. Mon premier jet passait par `new Date(Date.UTC(...))` : le
  //     calcul est pourtant pur, mais la règle est bonne et elle vaut mieux
  //     qu'une exception. On compte donc les jours à la main.
  //  ⚠️ Et le calendrier civil, pas une addition de 86 400 000 : deux fois par
  //     an un jour local dure 23 ou 25 heures, et l'addition naïve saute un
  //     jour ou le répète — la faute déjà écrite dans `progression.js`.
  function bissextile(a) { return (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0; }
  var JOURS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function lendemain(date) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
    if (!m) return null;
    var a = +m[1], mo = +m[2], j = +m[3];
    var dansLeMois = mo === 2 && bissextile(a) ? 29 : JOURS[mo - 1];
    j++;
    if (j > dansLeMois) { j = 1; mo++; }
    if (mo > 12) { mo = 1; a++; }
    return a + "-" + String(mo).padStart(2, "0") + "-" + String(j).padStart(2, "0");
  }

  function demain(date) {
    var j = lendemain(date);
    return j ? pour(j) : null;
  }

  //  L'effet d'une règle posée sur une partie, ou `null`. C'est ce que
  //  `PokeSerments.effet` va chercher pour le fondre dans le composé.
  function effetDe(partie) {
    var r = partie && partie.regleDuJour ? PAR_ID[partie.regleDuJour] : null;
    return r ? r.effet : null;
  }

  W.PokeRegleDuJour = {
    LISTE: REGLES,
    pour: pour,
    demain: demain,
    de: de,
    effetDe: effetDe,
  };
})(typeof window !== "undefined" ? window : globalThis);
