(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCLAT — CE QUI SÉPARE DEUX CRÉATURES DE LA MÊME ESPÈCE
  //
  //  🔴 TOUS LES RATTATA SE VALAIENT. On en croisait quarante par voyage, on
  //     les relâchait tous, et aucun n'a jamais mérité qu'on s'arrête. Un jeu
  //     de collection où deux exemplaires sont interchangeables n'a pas de
  //     collection : il a une liste.
  //
  //     Or la différence EXISTE DÉJÀ dans le moteur. `tirerDV` tire les quatre
  //     valeurs déterminantes de la première génération, et en déduit celle des
  //     points de vie par la parité — exactement comme le ROM. Deux Rattata
  //     n'ont jamais eu les mêmes statistiques. Le jeu le savait, et il ne le
  //     disait pas : la classe de défaut la plus fréquente du projet.
  //
  //  ── LE CHROMATIQUE, ET POURQUOI IL EST ICI CHEZ LUI ────────────────────────
  //  🔴 ON N'INVENTE RIEN. Dans la première génération, un chromatique ne se
  //     VOIT pas — mais il EST là : la deuxième génération ne fait que lire les
  //     valeurs déterminantes déjà tirées. Un Pokémon de Rouge échangé vers Or
  //     devient chromatique si et seulement si ses DV remplissent la condition.
  //     On lit donc la même condition, à la lettre, depuis `pret/pokecrystal` :
  //
  //         Attaque & %0010 ≠ 0 · Défense = 10 · Vitesse = 10 · Spécial = 10
  //
  //     Soit une chance sur 8192. Elle se compte sur le COMPTE, pas sur la
  //     partie — c'est ce qui la rend atteignable sans la rendre banale.
  //  ⚠️ CE PARAGRAPHE DÉCRIT L'ORIGINE, PLUS LA RÈGLE EN VIGUEUR. Il disait
  //     « on ne la desserre pas » ; elle l'a été le 24/08, sur mesure, et le
  //     bloc suivant dit pourquoi et de combien. Un commentaire qui décrit un
  //     interrupteur n'est pas l'interrupteur : celui-ci a failli rester faux.
  //
  //  🔴 ET LE GRADE NE CHANGE AUCUN CALCUL. Les DV pesaient déjà sur les
  //     statistiques ; on ne fait que les NOMMER. Ajouter un effet ici
  //     déséquilibrerait un moteur d'origine qu'on a passé des jours à porter
  //     juste — et rendrait tout classement incomparable avec l'existant.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 [24/08] LA RARETE DE 1999 EST UNE RARETE MORTE ICI -- MESURE A L'APPUI
  // ---------------------------------------------------------------------------
  //  « Personne n'en a jamais trouve », et c'etait exactement ce que le chiffre
  //  predisait. La condition de la cartouche vaut UNE CHANCE SUR 8192, calibree
  //  pour quarante heures de jeu. Un voyage dure quarante minutes et offre 142 a
  //  162 rencontres : 1,7 a 2,0 % par voyage, soit 35 a 40 voyages pour une
  //  chance sur deux. Chris en a fait une vingtaine -- il avait 15,7 % de
  //  chances d'en croiser un. Ce n'etait pas rare, c'etait absent.
  //
  //  🔑 ON DESSERRE LES SEUILS, ON N'AJOUTE PAS DE TIRAGE. L'eclat n'est pas un
  //     de plus a cote des valeurs determinantes : il EST dedans, et c'est ce
  //     qui fait qu'un Pokémon échangé reste chromatique et que le serveur peut
  //     le reverifier sans rejouer le tirage. Deux seuils passent de « egal a
  //     10 » a « 10 ou 11 » : exactement quatre fois plus, aucun tirage neuf,
  //     `duel.js` et le rejeu continuent de le recalculer depuis les memes DV.
  //
  //     Defense ∈ {10,11} · Vitesse ∈ {10,11} · Special = 10 · Attaque & 2 ≠ 0
  //     (2/16) × (2/16) × (1/16) × (8/16) = 32/65536 = 1 sur 2048.
  //
  //  📌 CE QUE CA DONNE, MESURE : 3,4 % par voyage, 29 % sur dix voyages, une
  //     chance sur deux sur vingt. L'eclat reste une histoire qu'on raconte ;
  //     il cesse d'etre une promesse que personne ne voit tenue.
  //  ⚠️ ET LE PALMARES COMPTE LES CHROMATIQUES. Un veteran d'avant ce soir sera
  //     derriere un nouveau a nombre de voyages egal. C'est le prix, il est
  //     assume, et il est dit aux joueurs dans le patchnote.
  // ═══════════════════════════════════════════════════════════════════════════
  var MASQUE_ATK = 2, DEF_DV = [10, 11], VIT_DV = [10, 11], SPE_DV = 10;

  function chromatique(dv) {
    if (!dv) return false;
    return (dv.atk & MASQUE_ATK) !== 0 &&
      DEF_DV.indexOf(dv.def) >= 0 && VIT_DV.indexOf(dv.vit) >= 0 && dv.spe === SPE_DV;
  }

  // 🔴 LES PV NE COMPTENT PAS : ils se DÉDUISENT des quatre autres. Les faire
  //    entrer dans la somme compterait deux fois la même information et
  //    donnerait un grade qui ne veut rien dire.
  function somme(dv) {
    if (!dv) return 0;
    return dv.atk + dv.def + dv.vit + dv.spe;
  }

  // Cinq paliers sur soixante. Les seuils sont posés sur la loi réelle de la
  // somme de quatre tirages uniformes — `tools/poke-eclat.mjs` les mesure et
  // refuse tout palier qui mentirait sur sa rareté.
  var GRADES = [
    { cle: "parfait", min: 60, nom: { fr: "PARFAIT", en: "PERFECT" } },
    { cle: "exceptionnel", min: 52, nom: { fr: "EXCEPTIONNEL", en: "OUTSTANDING" } },
    { cle: "solide", min: 43, nom: { fr: "SOLIDE", en: "STRONG" } },
    { cle: "correct", min: 30, nom: { fr: "CORRECT", en: "DECENT" } },
    { cle: "ordinaire", min: 0, nom: { fr: "ORDINAIRE", en: "PLAIN" } },
  ];

  function grade(dv) {
    var s = somme(dv);
    for (var i = 0; i < GRADES.length; i++) if (s >= GRADES[i].min) return GRADES[i];
    return GRADES[GRADES.length - 1];
  }

  // Ce qu'on montre d'une créature, d'un seul appel : les écrans ne
  // recalculent rien, sinon deux d'entre eux finiront par ne plus dire pareil.
  function lire(mon) {
    if (!mon || !mon.dv) return null;
    return {
      chromatique: chromatique(mon.dv),
      grade: grade(mon.dv),
      somme: somme(mon.dv),
      sur: 60,
    };
  }

  W.PokeEclat = {
    chromatique: chromatique,
    grade: grade,
    somme: somme,
    lire: lire,
    GRADES: GRADES,
  };
})(typeof window !== "undefined" ? window : globalThis);
