// ═══════════════════════════════════════════════════════════════════════════
//  COMMENT MON ÉQUIPE SE MESURE À CELLE D'EN FACE
//
//  🔴 L'ÉCRAN D'ARÈNE MONTRAIT L'ÉQUIPE ADVERSE ET JAMAIS LA MIENNE. Il donne
//     le nom du Champion, son type, ses quatre Pokémon avec leurs niveaux, les
//     potions qu'il porte et les essais qui restent — puis il demande de
//     décider. Pour décider, il fallait tenir de tête la table des dix-sept
//     types, six équipes contre quatre, et les quatre attaques de chacun.
//     C'est la classe de défaut n°1 du mode, sur l'écran où la moitié des
//     voyages s'arrêtent : le jeu SAIT tout ça, et il ne le dit pas.
//
//  🔴 CE N'EST PAS UN SOLVEUR. On ne dit pas quoi faire, on ne classe pas, on
//     ne recommande personne : on rend deux faits que le joueur pourrait
//     calculer lui-même — ce que mes attaques font à leur équipe, ce que leurs
//     attaques font à la mienne. La décision reste entière.
//
//  🔴 ET C'EST EXACT, PAS UNE APPROXIMATION PAR TYPE. Les équipes de Champion
//     ne portent que `{n, niveau}` dans les données ; `PokeMoteur.creer` en
//     dérive les VRAIES attaques depuis la table d'apprentissage du ROM. On
//     lit donc les attaques qu'ils auront, pas celles qu'on leur suppose.
//     Un « fragile » fondé sur le type du Champion mentirait sur Rhinoféros,
//     qui est Sol/Roche et attaque au Normal.
//
//  🔴 IL VIT DANS LES ÉCRANS : il ne décide de rien, aucun rejeu n'en dépend.
//     Il est écrit à part pour qu'un outil puisse l'APPELER — la même raison
//     que `dits-objets.js`.
// ═══════════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  var C = function () { return W.PokeCombat; };
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };

  // Le meilleur multiplicateur qu'un jeu d'attaques atteint contre une équipe.
  // 🔴 Seules les attaques QUI FONT DES DÉGÂTS comptent : Rugissement n'a pas
  //    d'efficacité, et le moteur le sait — `efficacite` répondrait quand même
  //    un nombre, ce qui ferait passer un Pokémon pour dangereux parce qu'il
  //    sait crier.
  //  🔴 IL REND AUSSI L'ATTAQUE QUI DONNE LE VERDICT — 14/08. Le propriétaire a
  //     signalé DEUX FOIS un « super efficace » qu'il croyait faux sur son
  //     Salamèche devant Pierre. Recalculé : avec Griffe/Rugissement/Flammèche
  //     le verdict est bien « peu efficace ». Le verdict n'était donc pas
  //     démontrable — ni par lui, ni par moi, faute de savoir QUELLE attaque le
  //     déclenche. Un jugement qu'on ne peut pas vérifier se lit comme un bug
  //     même quand il est juste.
  //  🔑 On ne discute pas d'un chiffre, on le montre. La mesure nomme
  //     désormais son coup ; l'écran l'affiche à côté du mot. Si le verdict a
  //     tort, la preuve est écrite dessus.
  function meilleurContre(attaques, equipe) {
    var meilleur = 0, vu = false, cle = null;
    for (var i = 0; i < attaques.length; i++) {
      var a = ATT()[attaques[i].cle || attaques[i]];
      if (!a || !a.puissance) continue;
      // 🔴 UN COUP À ZÉRO PP NE FRAPPE PAS, et le verdict l'annonçait quand
      //    même : un Pokémon dont l'unique coup super efficace était épuisé
      //    s'affichait « SUPER EFFICACE » au menu ÉQUIPE. C'est la moitié
      //    FAUSSE de la seule question à laquelle cet écran existe pour
      //    répondre.
      //    ⚠️ Seulement quand les PP sont connus : la mesure sert aussi à
      //       juger l'équipe d'un Champion, décrite par sa table de niveau,
      //       où `pp` n'existe pas — et un `undefined <= 0` sauterait tout.
      if (attaques[i].pp !== undefined && attaques[i].pp <= 0) continue;
      vu = true;
      for (var j = 0; j < equipe.length; j++) {
        var types = ESP()[equipe[j].n].types;
        var eff = C().efficacite(a.type, types);
        if (eff > meilleur) { meilleur = eff; cle = a.cle; }
      }
    }
    return vu ? { eff: meilleur, cle: cle } : null;
  }

  // Les attaques qu'un Pokémon d'équipe adverse AURA vraiment, à son niveau.
  // 🔴 `creer` demande un hasard pour ses valeurs déterminantes ; les attaques,
  //    elles, viennent de la table d'apprentissage et ne dépendent pas du
  //    tirage. On passe donc un hasard quelconque et on ne lit QUE la liste.
  function attaquesDe(entree, h) {
    var mon = W.PokeMoteur.creer(entree.n, entree.niveau, h);
    return mon.attaques;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VERDICT
  //
  //  Pour chacun des miens, deux faits et rien de plus :
  //    frappe : "fort" (×2 ou mieux sur au moins un des leurs)
  //             "rien" (aucune de mes attaques ne mord sur AUCUN d'eux)
  //             null   (ordinaire — et l'ordinaire ne se dit pas)
  //    subit  : "fragile" (l'un des leurs me frappe ×2 ou mieux)
  //             "tient"   (aucune de leurs attaques ne me fait mal)
  //             null
  // ═══════════════════════════════════════════════════════════════════════════
  function contre(mienne, adverse, h) {
    if (!mienne || !mienne.length || !adverse || !adverse.length) return [];
    // Les attaques d'en face, calculées une seule fois pour toute l'équipe.
    var leurs = [];
    for (var k = 0; k < adverse.length; k++) leurs.push(attaquesDe(adverse[k], h));

    var out = [];
    for (var i = 0; i < mienne.length; i++) {
      var mon = mienne[i];
      var jeFrappe = meilleurContre(mon.attaques || [], adverse);
      // Ce qu'ils me font : le pire des quatre jeux d'attaques d'en face.
      var pire = 0, vu = false, cleSubie = null;
      for (var j = 0; j < leurs.length; j++) {
        var e = meilleurContre(leurs[j], [{ n: mon.n }]);
        if (e === null) continue;
        vu = true;
        if (e.eff > pire) { pire = e.eff; cleSubie = e.cle; }
      }
      var f = jeFrappe === null ? null : (jeFrappe.eff >= 2 ? "fort" : (jeFrappe.eff < 1 ? "rien" : null));
      var s = !vu ? null : (pire >= 2 ? "fragile" : (pire < 1 ? "tient" : null));
      out.push({
        index: i,
        n: mon.n,
        frappe: f,
        subit: s,
        //  La PREUVE, à côté du verdict : le coup qui le déclenche. `null` quand
        //  le verdict est « ordinaire » — il n'y a alors rien à prouver.
        parQuoi: f === "fort" ? (jeFrappe && jeFrappe.cle) : null,
        parQuoiSubi: s === "fragile" ? cleSubie : null,
      });
    }
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUI TUE VRAIMENT LES VOYAGES : LES ÉTATS, ET ILS ÉTAIENT INVISIBLES
  //
  //  🔴 `contre` NE COMPTE QUE LES ATTAQUES QUI FONT DES DÉGÂTS — c'est juste
  //     pour l'efficacité, et c'est faux pour le DANGER. Mesuré sur 1 618
  //     affrontements : devant Erika et Koga, le joueur a l'avantage de niveau
  //     (+3,6) et ne gagne que 13 % du temps. La cause est écrite noir sur
  //     blanc dans `butin.js` : Rafflesia porte Poudre Dodo et Poudre Toxik,
  //     Koga aligne quatre Poison. Une créature endormie ne joue pas.
  //     L'écran d'arène montrait donc tout — sauf la seule chose qui décide.
  //
  //  🔴 SEULEMENT LES EFFETS PRIMAIRES. `THUNDERBOLT` paralyse « parfois »
  //     (`PARALYZE_SIDE_EFFECT1`) : l'annoncer mettrait un avertissement sur
  //     les trois quarts des équipes, et un avertissement permanent ne prévient
  //     de rien. On ne nomme que ce qui est LANCÉ POUR ÇA.
  var ETATS = {
    SLEEP_EFFECT: "sommeil",
    POISON_EFFECT: "poison",
    TOXIC_EFFECT: "poison",
    PARALYZE_EFFECT: "paralysie",
    CONFUSION_EFFECT: "confusion",
  };

  //  Rend la liste des états qu'une équipe adverse sait infliger À DESSEIN.
  function menaces(equipeAdverse, h) {
    var vus = {}, out = [];
    for (var i = 0; i < (equipeAdverse || []).length; i++) {
      var p = equipeAdverse[i];
      // Même dérivation que `contre` : les VRAIES attaques, pas celles qu'on
      // suppose depuis le type.
      var mon = p.attaques ? p : W.PokeMoteur.creer(p.n, p.niveau, h);
      for (var j = 0; j < mon.attaques.length; j++) {
        var a = ATT()[mon.attaques[j].cle];
        if (!a || !ETATS[a.effet]) continue;
        if (vus[ETATS[a.effet]]) continue;
        vus[ETATS[a.effet]] = true;
        out.push(ETATS[a.effet]);
      }
    }
    return out;
  }

  //  Combien de remèdes d'état le sac porte, toutes sortes confondues. La table
  //  des soins est la loi (`PokeCombat.OBJETS_SOIN`) : un objet qui lève un
  //  état y porte `etat`.
  function remedes(sac) {
    var n = 0, table = C() ? C().OBJETS_SOIN : null;
    if (!table) return 0;
    for (var cle in table) {
      if (!table[cle].etat) continue;
      n += (sac && sac[cle]) || 0;
    }
    return n;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMBIEN DES MIENS TIENNENT CE NIVEAU — LE CHIFFRE QUI EXPLIQUAIT TOUT
  //
  //  🔴 MESURÉ SUR 1 618 AFFRONTEMENTS, ET C'EST LA VRAIE FORME DU MODE : à
  //     CHAQUE arène, exactement UN Pokémon sur six est au niveau du Champion.
  //     Devant Koga, la tête d'équipe est à 44 et la MÉDIANE à 9,7 ; devant
  //     Giovanni, tête 72,9 et médiane 12,0. Un voyage n'est pas une équipe de
  //     six, c'est un porteur solo qui traîne cinq passagers.
  //     C'est ce qui explique ce que l'écart de niveau n'expliquait pas :
  //     l'arène 3 se gagne à 75 % avec +3,5, l'arène 4 se perd à 87 % avec
  //     +3,6. Aux arènes 7 et 8 le porteur a vingt niveaux d'avance et balaye
  //     seul (100 %) ; aux arènes 4, 5 et 6 il n'en a que trois, le Champion
  //     aligne une équipe entière au niveau, et il n'y a rien derrière.
  //     ⚠️ CE PARAGRAPHE A DIT « LA COUVERTURE N'Y EST POUR PRESQUE RIEN :
  //        44 % contre 32 % » — et ces chiffres ne décrivent plus le mode.
  //        Remesuré le 11/08 au sceau 0 : **84 % de victoires avec au moins
  //        une réponse de type contre 65 % sans**, sur 2 918 combats ; au
  //        plancher, 52 % contre 39 % sur 1 842. Dix-neuf points au plafond.
  //        Le niveau reste le premier facteur ; la couverture est le second,
  //        et elle n'est pas négligeable.
  //        🔑 *Une conclusion vraie le jour où on l'écrit devient un
  //        garde-fou faux le jour où le jeu bouge* — celle-ci a servi des
  //        semaines à écarter la couverture des chantiers.
  //
  //  🔴 CE N'EST PAS UN RÉGLAGE D'ÉQUILIBRE, C'EST UN FAIT QU'ON CACHAIT. Le
  //     bandeau montre six Pokémon ; cinq d'entre eux ne peuvent rien faire ici,
  //     et rien ne le disait. Le joueur entre donc à six contre trois en croyant
  //     avoir l'avantage du nombre. On dit le nombre vrai, et lui décide.
  //
  //  ⚠️ TROIS NIVEAUX DE MARGE, ET UNE SEULE PORTE. « Au niveau » ne veut pas
  //     dire « à égalité stricte » : un écart de deux ou trois se rattrape par
  //     le type et les objets. Le seuil vit ICI et nulle part ailleurs — deux
  //     endroits qui décident de « tenir le niveau » finiraient par ne plus dire
  //     la même chose, et c'est le chiffre sur lequel on décide d'y aller.
  // ═══════════════════════════════════════════════════════════════════════════
  var MARGE = 3;

  function aLaHauteur(mienne, adverse) {
    if (!mienne || !mienne.length || !adverse || !adverse.length) return null;
    var haut = 0;
    for (var i = 0; i < adverse.length; i++) haut = Math.max(haut, adverse[i].niveau || 0);
    var n = 0;
    for (var j = 0; j < mienne.length; j++) {
      // ⚠️ Un Pokémon à terre ne tient rien : le compter promettrait un renfort
      //    qui ne peut pas entrer.
      if (mienne[j].pv <= 0) continue;
      if ((mienne[j].niveau || 0) >= haut - MARGE) n++;
    }
    return { n: n, sur: mienne.length, seuil: haut - MARGE, haut: haut };
  }

  W.PokeMesure = { contre: contre, menaces: menaces, remedes: remedes, aLaHauteur: aLaHauteur };
})(typeof window !== "undefined" ? window : globalThis);
