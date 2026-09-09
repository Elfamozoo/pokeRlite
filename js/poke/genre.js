(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  DRESSEUR OU DRESSEUSE — LES ACCORDS
  //
  //  Le jeu n'a JAMAIS eu de genre de joueur. C'est un système neuf, et c'est
  //  aussi la source d'erreurs la plus mécanique du mode : en français, presque
  //  toute phrase qui parle du joueur s'accorde.
  //
  //  🔴 DEUX CORPUS COMPLETS = DEUX FOIS LA DETTE ET UNE DIVERGENCE GARANTIE.
  //     C'est exactement la faute du mode ninja, où le bandeau et l'écran de fin
  //     ont fini par nommer deux pouvoirs différents pour le même personnage.
  //     On fait autrement :
  //
  //   1. Un texte SANS accord vit dans `fr` / `en`, comme aujourd'hui.
  //   2. Un texte AVEC accord déclare `frF` (et `enF` si l'anglais le demande,
  //      ce qui est rare — l'anglais n'accorde pas les participes).
  //   3. Les jetons courts couvrent les cas les plus fréquents sans dédoubler
  //      la phrase : `{e}` pour le e muet, `{il}`, `{le}`, `{un}`, `{joueur}`.
  //
  //  🔴 UNE SEULE FONCTION résout tout, lue partout. Deux résolutions écrites à
  //     deux endroits, c'est la divergence assurée.
  //  🔴 `tools/poke-genre.mjs` fait ÉCHOUER la livraison dès qu'un `fr` porte
  //     une marque d'accord masculin sans `frF` frère.
  // ═══════════════════════════════════════════════════════════════════════════

  // Les jetons, et ce qu'ils rendent selon le genre. Volontairement peu
  // nombreux : un système de jetons trop riche devient illisible à l'écriture,
  // et on préfère alors un `frF` complet.
  var JETONS = {
    fr: {
      // 🔴 `{ne}` EST LE JUMEAU DE `{e}` pour les mots en -on / -ien : « champion
      //    / championne ». Sans lui, un titre porté par une joueuse ne pouvait
      //    s'écrire qu'en dupliquant toute la phrase en `frF` — et une phrase
      //    dupliquée finit par diverger de son jumeau.
      h: { e: "", ne: "", il: "il", Il: "Il", le: "le", un: "un", ce: "ce", joueur: "dresseur", Joueur: "Dresseur" },
      f: { e: "e", ne: "ne", il: "elle", Il: "Elle", le: "la", un: "une", ce: "cette", joueur: "dresseuse", Joueur: "Dresseuse" },
    },
    en: {
      h: { e: "", ne: "", il: "he", Il: "He", le: "the", un: "a", ce: "this", joueur: "trainer", Joueur: "Trainer" },
      f: { e: "", ne: "", il: "she", Il: "She", le: "the", un: "a", ce: "this", joueur: "trainer", Joueur: "Trainer" },
    },
  };

  // Résout une entrée de texte pour un genre donné.
  //   entree : { fr, en, frF?, enF? }
  //   genre  : "h" | "f"
  function resoudre(entree, langue, genre, vars) {
    if (!entree) return "";
    var g = genre === "f" ? "f" : "h";
    var l = langue === "en" ? "en" : "fr";
    // La variante féminine complète l'emporte quand elle existe : certaines
    // phrases ne se rattrapent pas au jeton (« il est venu seul » / « elle est
    // venue seule » se règle au jeton, mais pas « le nouveau champion »).
    var s = (g === "f" && entree[l + "F"]) || entree[l] || entree.fr || "";
    var jetons = JETONS[l][g];
    for (var k in jetons) s = s.split("{" + k + "}").join(jetons[k]);
    s = accorderNombre(s, l, vars);
    s = elider(s, l, vars);
    if (vars) for (var v in vars) s = s.split("{" + v + "}").join(vars[v]);
    s = professeur(s, l, vars);
    return s;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉLISION — « de Ondine », vu à l'écran
  //
  //  🔴 MÊME CLASSE QUE LE PLURIEL EN DUR, ET TROUVÉE DE LA MÊME FAÇON : en
  //     regardant l'écran. La carte de capsule annonce « touche 2 de Ondine sur
  //     2 » — trois Championnes et Champions sur huit commencent par une
  //     voyelle (Ondine, Erika, Auguste), donc la faute sort une fois sur trois
  //     sur une ligne qui décide d'un choix.
  //
  //  🔴 ET AUCUN DÉTECTEUR NE POUVAIT LA VOIR : `poke-genre` traque le genre,
  //     l'accord en nombre traque le « s ». Une préposition non élidée n'est ni
  //     l'un ni l'autre — c'est du français juste au niveau du gabarit et faux
  //     au niveau du texte rendu. La règle vit donc À LA RÉSOLUTION, le seul
  //     endroit qui voie la valeur substituée.
  //
  //  La forme : `{de|champion}` — la préposition, puis le nom de la variable.
  //  ⚠️ Un seul tube, là où l'accord en nombre en demande deux : les deux
  //     gabarits ne peuvent pas se confondre.
  //  ⚠️ L'ANGLAIS N'ÉLIDE PAS. Le jeton n'a donc de sens que dans un `fr`, et
  //     hors du français on rend la préposition telle quelle — un gabarit
  //     anglais qui l'emploierait par erreur reste lisible.
  //  ⚠️ Le « h » n'est PAS traité : « le héros » ne s'élide pas, « l'homme »
  //     si, et aucune règle mécanique ne les sépare. Le mode n'a aucun nom en
  //     h — le jour où il en aura un, il faudra une donnée, pas une devinette.
  // ═══════════════════════════════════════════════════════════════════════════
  //  Les prépositions et pronoms qui s'élident. « du », « des », « au » n'y
  //  sont pas : ils ne s'élident jamais. `tools/poke-elision.mjs` tient la
  //  même liste et fait échouer la livraison sur un gabarit qui la contourne.
  var VOYELLE = /^[aeiouyàâäéèêëîïôöùûü]/i;
  function elider(s, l, vars) {
    if (s.indexOf("|") < 0) return s;
    return s.replace(/\{(de|le|la|ce|que|ne|se|te|me|je)\|(\w+)\}/g, function (tout, prep, cle) {
      if (!vars || vars[cle] === undefined) return tout;   // laissé au vérificateur
      var valeur = String(vars[cle]);
      if (l !== "fr") return prep + " " + valeur;
      return VOYELLE.test(valeur) ? prep.charAt(0) + "'" + valeur : prep + " " + valeur;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ACCORD EN NOMBRE — « 1 attrapés », « 1 rencontres »
  //
  //  🔴 LE PLURIEL ÉTAIT ÉCRIT EN DUR DANS TOUT LE CORPUS. Le premier Pokémon
  //     de tout nouveau joueur affichait « 1 attrapés » sur l'écran de
  //     collection, et un nœud à une seule rencontre annonçait « 1 rencontres »
  //     en plein milieu de la carte. Quatorze tournures relevées, sept
  //     réellement fautives — sur les écrans les plus vus du mode.
  //
  //     Aucun détecteur ne pouvait le voir : `poke-genre` traque le GENRE, et
  //     un « s » de trop n'est ni un jeton manquant ni un accord absent.
  //
  //  La forme : `{n|rencontre|rencontres}`. Le compteur d'abord, puis le
  //  singulier, puis le pluriel. Elle se lit à l'écriture, ce qui compte plus
  //  qu'un système savant qu'on oublie d'employer.
  //
  //  🔴 ET LES DEUX LANGUES N'ACCORDENT PAS PAREIL. En français, zéro prend le
  //     singulier — « 0 rencontre ». En anglais, seul 1 le prend — « 0
  //     encounters ». Écrire une seule règle pour les deux ferait une faute
  //     dans l'une des deux à chaque zéro.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  UN NOMBRE MIS EN FORME EST ENCORE UN NOMBRE  [19/08/2026]
  //
  //  🔴 LU À L'ÉCRAN PAR LE PROPRIÉTAIRE, SUR L'ACCUEIL DU MODE — l'écran que
  //     voit d'abord quelqu'un qui n'a jamais joué :
  //         « 5 967 {n|joueur a|joueurs ont} déjà rejoint le monde »
  //     Le gabarit lui-même, en toutes lettres, dans les deux langues.
  //
  //     La cause tient en une ligne : l'écran passait le compteur DÉJÀ MIS EN
  //     FORME (`n.toLocaleString("fr-FR")`), parce que `{n}` doit s'afficher
  //     « 5 967 » et pas « 5967 ». Et `Number("5 967")` vaut NaN — l'espace
  //     fine insécable des milliers suffit. L'accord renonçait donc, et
  //     rendait le gabarit tel quel.
  //
  //  🔑 LE CORRECTIF NE VA PAS À L'APPELANT. Écrire le nombre brut sur cet
  //     appel-là aurait réparé CE compteur et laissé la trappe ouverte : tout
  //     écran qui met un nombre en forme avant de le donner à une phrase
  //     accordée tomberait dedans, et il tomberait EN SILENCE — un gabarit
  //     affiché ne lève rien. *Détecter la classe, pas le cas* : c'est la
  //     lecture du nombre qui doit accepter la mise en forme.
  //
  //  ⚠️ ET LA VIRGULE NE VEUT PAS DIRE LA MÊME CHOSE DANS LES DEUX LANGUES.
  //     « 1,5 » vaut un et demi en français, mille cinq cents en anglais. On
  //     lit donc les séparateurs SELON LA LANGUE de la phrase qu'on accorde,
  //     jamais selon une règle unique.
  //  ⚠️ Le repli reste le gabarit intact pour ce qui n'est vraiment pas un
  //     nombre : le vérificateur ci-dessous le relèvera, et c'est son travail.
  // ═══════════════════════════════════════════════════════════════════════════
  function nombreLu(v, l) {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return NaN;
    // Les séparateurs de milliers de toutes les mises en forme qu'on emploie :
    // espace fine insécable (fr-FR), insécable, ordinaire — `\s` les couvre.
    var s = v.replace(/[\s\u00a0\u202f\u2009\u2007]/g, "");
    s = l === "fr" ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    return s === "" ? NaN : Number(s);
  }

  function accorderNombre(s, l, vars) {
    if (s.indexOf("|") < 0) return s;
    return s.replace(/\{(\w+)\|([^|{}]*)\|([^|{}]*)\}/g, function (tout, cle, un, plusieurs) {
      if (!vars || vars[cle] === undefined) return tout;   // laissé au vérificateur
      var v = nombreLu(vars[cle], l);
      if (!isFinite(v)) return tout;
      var a = v < 0 ? -v : v;
      var singulier = l === "fr" ? a < 2 : a === 1;
      return singulier ? un : plusieurs;
    });
  }

  // 🔴 UN JETON NON RÉSOLU DOIT SE VOIR. Le mode ninja a livré « wcRound1 » et
  //    « Mode true » à l'écran parce qu'une clé calculée n'était résolue nulle
  //    part. Ici, tout `{quelquechose}` qui survit est signalé en console et
  //    relevé par `poke-genre.mjs` sur le corpus.
  var NON_RESOLUS = {};
  function verifier(texte, origine) {
    // 🔴 Un accord en nombre laissé en place est aussi un jeton non résolu :
    //    « {n|rencontre|rencontres} » à l'écran est pire qu'un pluriel fautif.
    var restes = texte.match(/\{[a-zA-Z0-9_]+(\|[^{}]*)?\}/g);
    if (!restes) return texte;
    for (var i = 0; i < restes.length; i++) {
      NON_RESOLUS[restes[i]] = (NON_RESOLUS[restes[i]] || 0) + 1;
      if (W.console && W.console.warn) W.console.warn("[poke] jeton non résolu " + restes[i] + " dans " + (origine || "?"));
    }
    return texte;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  {prof} — LE PROFESSEUR EST UNE AFFAIRE DE MONDE, PAS D'ÉCRAN
  //
  //  🔴 « Chen te tend le Pokédex » S'AFFICHAIT DANS LE LABORATOIRE D'ORME.
  //     Trois phrases le nomment, plus le titre de l'écran ; les faire passer
  //     un paramètre chacune, c'est quatre endroits à ne pas oublier — et le
  //     cinquième, écrit dans six mois, l'oubliera. Le jeton se résout donc
  //     ICI, avec les accords et les élisions : une phrase qui dit `{prof}` est
  //     juste dans les deux mondes sans que personne ait à y penser.
  //  ⚠️ UN APPELANT PEUT TOUJOURS L'IMPOSER : `vars.prof` a été substitué juste
  //     avant, et il n'en reste alors rien à résoudre. C'est ce qui permettra à
  //     une scène de nommer un autre professeur sans détourner le registre.
  // ═══════════════════════════════════════════════════════════════════════════
  function professeur(s, l, vars) {
    if (s.indexOf("{prof}") < 0) return s;
    var nom = W.PokeRegles && W.PokeRegles.professeur
      ? W.PokeRegles.professeur(l)
      : (l === "en" ? "Oak" : "Chen");
    return s.split("{prof}").join(nom);
  }

  function texte(entree, langue, genre, vars, origine) {
    return verifier(resoudre(entree, langue, genre, vars), origine);
  }

  // 🔴 LA PORTE POUR LES ÉCRANS QUI N'ONT PAS LA PARTIE SOUS LA MAIN. Six
  //    copies de `T()` existaient dans le mode, et QUATRE ne passaient pas
  //    ici : elles substituaient les variables elles-mêmes. Conséquence, un
  //    accord de genre ou de nombre marchait sur deux écrans et pas sur les
  //    quatre autres, sans qu'aucun détecteur ne puisse le dire — le corpus
  //    était juste, c'est la RÉSOLUTION qui différait.
  //    `POKE_GENRE` est posé par l'interface au début d'un voyage ; à défaut,
  //    le masculin, comme avant.
  function pour(table, cle, vars, origine) {
    return texte(table[cle], W.POKE_LANG || "fr", W.POKE_GENRE || "h", vars, (origine || "?") + ":" + cle);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA VIRGULE DÉCIMALE EST UNE AFFAIRE DE LANGUE, PAS DE MISE EN FORME
  //
  //  🔴 « 0.7 m · 6.9 kg » sur la fiche du Pokédex, et « 41.3 / 60 » sur le
  //     relevé du Juge : un point décimal dans un mode entièrement traduit, sur
  //     l'écran qu'on rouvre le plus souvent. Ce n'est pas une coquille de
  //     rendu — le français n'écrit pas les décimales comme ça, au même titre
  //     qu'il ne dit pas « 1 Pokémon sont ». C'est donc ici que ça se règle,
  //     avec les accords et les élisions, et pas dans l'écran qui affiche.
  //  ⚠️ ELLE NE TOUCHE PAS AUX NOMBRES DE CSS. `--part: 0.412` est du code, pas
  //     du texte : une virgule y casserait la règle. La porte est réservée à ce
  //     qu'un joueur LIT.
  // ═══════════════════════════════════════════════════════════════════════════
  function decimal(n, chiffres) {
    var s = Number(n).toFixed(chiffres === undefined ? 1 : chiffres);
    return (W.POKE_LANG || "fr") === "fr" ? s.replace(".", ",") : s;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  « N.14 » OU « Lv.14 » — ET C'EST LA MÊME AFFAIRE QUE LA VIRGULE
  //
  //  🔴 `ui.js` PORTE UNE CLÉ `aNiveau` DEPUIS TOUJOURS, avec ce commentaire :
  //     « "N." partout, jamais deux façons de dire niveau ». Relevé le 11/08 :
  //     **dix endroits écrivaient `"N." + niveau` en dur**, dont la FICHE DE
  //     COMBAT — l'élément le plus regardé du mode — et les trois inscriptions
  //     de la carte de partage, celle qu'on montre aux autres. Un anglophone
  //     lisait « N.14 » pendant que la table savait dire « Lv.14 ».
  //     Encore une loi énoncée dans un commentaire et démentie par le fichier.
  //  ⚠️ ELLE VIT ICI, PAS DANS `ui.js` : la carte de partage dessine sur une
  //     toile et n'a pas accès au dictionnaire d'écran ; la fiche de combat a
  //     le sien. Trois tables, une seule langue — le préfixe appartient donc au
  //     module de langue, comme la virgule décimale et les accords.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NOM D'UN CHAMPION ET D'UN BADGE — deux noms par fiche, un par langue
  //
  //  🔴 « Pierre », « Ondine », « Roche », « Cascade » partaient tels quels dans
  //     l'interface anglaise, sur les huit arènes et les huit badges du mode.
  //     Et `sceaux.js` écrivait déjà « Boulder Seal », « Cascade Seal » de son
  //     côté : **deux vocabulaires pour les mêmes huit badges, dont un faux.**
  //  ✅ Le générateur pose désormais `championEn` et `badgeEn`, LUS dans le ROM
  //     (la clé de dresseur et `data/items/names.asm`) — pas tapés de mémoire.
  //  ⚠️ ON REPLIE SUR LE FRANÇAIS, sans rien signaler : un Champion sans nom
  //     anglais doit s'afficher, pas disparaître. Le contrôle du corpus est le
  //     travail du générateur, qui échoue si la source manque.
  //  ⚠️ ET ELLE ACCEPTE UNE FICHE DE BADGE SAUVEGARDÉE autant qu'une fiche
  //     d'arène : `partie.badges` recopie `badge`/`champion` depuis l'arène, et
  //     ces enregistrements-là n'ont pas de champ anglais dans les parties
  //     déjà commencées. La porte rend alors le français, ce qui est juste.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  « ROUGE » / « BLEU » — LE NOM DE LA VERSION EST AUSSI UN MOT
  //
  //  🔴 Quatre écrans l'écrivaient par un ternaire sur la clé de donnée :
  //     `b.version === "rouge" ? "Rouge" : "Bleu"`. Trois d'entre eux sont sur
  //     la CARTE DE PARTAGE — l'image qu'un joueur montre aux autres — et le
  //     quatrième sur l'écran de fin. Un anglophone y lisait « Rouge ».
  //  ⚠️ La clé de donnée reste `"rouge"` / `"bleu"` : elle est écrite dans les
  //     sauvegardes et rejouée par le serveur. Seul l'AFFICHAGE change.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NOM D'UNE VERSION VIENT DU MONDE   [20/08/2026]
  //
  //  🔴 CETTE FONCTION NE CONNAISSAIT QUE 1996. Deux `if`, « rouge » et
  //     « bleu », et une chaîne VIDE pour tout le reste. Signalé par Poltron,
  //     deux captures côte à côte : la carte de partage d'un voyage de Kanto
  //     annonce « Version Bleu », celle d'un voyage de Johto n'annonce rien.
  //     La version de Johto s'appelle « cristal », et personne ne le lui avait
  //     dit. *Une table de 1996 lue depuis 1999* — la classe de la journée.
  //  🔑 Le repli reste, et il sert : `genre.js` se monte AVANT le registre dans
  //     certains harnais, et une carte de partage qui perdrait son libellé
  //     serait le défaut qu'on vient de réparer.
  // ═══════════════════════════════════════════════════════════════════════════
  function version(cle) {
    if (W.PokeRegles && W.PokeRegles.nomVersion) {
      var nom = W.PokeRegles.nomVersion(cle);
      if (nom) return nom;
    }
    var en = (W.POKE_LANG || "fr") === "en";
    if (cle === "rouge") return en ? "Red" : "Rouge";
    if (cle === "bleu") return en ? "Blue" : "Bleu";
    return "";
  }

  function nomChampion(a) {
    if (!a) return "";
    return ((W.POKE_LANG || "fr") === "en" && a.championEn) || a.champion || "";
  }
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NOM D'UN DRESSEUR SUIT LA LANGUE   [20/08/2026]
  //
  //  🔴 LE CONSEIL 4 PARLAIT FRANÇAIS EN ANGLAIS. L'écran de Ligue affichait
  //     `c0.nom` tel quel : un joueur anglophone lisait « Marion » là où la
  //     cartouche dit « Will », et « Aldo » pour « Bruno ». Les deux noms
  //     étaient dans les données, côte à côte, depuis toujours.
  //  🔑 MÊME PORTE POUR LES CINQ. Les membres du Conseil et le Maître portent
  //     la même paire `{nom, nomEn}` ; leur donner deux lectures aurait fait
  //     deux façons de se tromper.
  // ═══════════════════════════════════════════════════════════════════════════
  function nomDresseur(d) {
    if (!d) return "";
    return ((W.POKE_LANG || "fr") === "en" && d.nomEn) || d.nom || "";
  }
  function nomBadge(a) {
    if (!a) return "";
    return ((W.POKE_LANG || "fr") === "en" && a.badgeEn) || a.badge || "";
  }

  function niveau(n) {
    return ((W.POKE_LANG || "fr") === "fr" ? "N." : "Lv.") + n;
  }

  W.PokeGenre = {
    JETONS: JETONS,
    NON_RESOLUS: NON_RESOLUS,
    resoudre: resoudre,
    texte: texte,
    pour: pour,
    decimal: decimal,
    niveau: niveau,
    nomChampion: nomChampion,
    nomDresseur: nomDresseur,
    nomBadge: nomBadge,
    version: version,
  };
})(typeof window !== "undefined" ? window : globalThis);
