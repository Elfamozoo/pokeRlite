(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CORPUS — TOUT CE QUE LE JEU DIT
  //
  //  Les cinq règles d'écriture du projet, appliquées sans exception :
  //   1. Phrases courtes. Sujet, verbe, complément. ≤ 14 mots en français.
  //   2. Zéro métaphore, zéro image. On raconte ce qui se passe.
  //   3. Pas d'invention. Canon première génération : noms, lieux, personnages.
  //   4. Cohérence du parcours : le texte tient pour l'endroit où l'on est.
  //   5. Cohérence des choix : genre, starter, badges, règle de voyage.
  //
  //  🔴 LES ACCORDS PASSENT PAR `{e}` OU PAR `frF`. `tools/poke-genre.mjs` fait
  //     échouer la livraison sur tout masculin non accordé — c'est la demande
  //     du propriétaire : « les textes pour les femmes et les hommes sont
  //     forcément différents ».
  //  🔴 LES NOMS NE SONT PAS TAPÉS ICI. Toute créature, tout lieu, toute
  //     attaque se lit dans les tables générées. `poke-noms.mjs` le vérifie.
  //
  //  ⚖️ VOIX SHŌNEN : réservée aux écrans de FIN (`js/poke/fin.js`). Ici, dans
  //     le courant du jeu, la règle 2 tient — on ne fait pas de littérature
  //     dans une réplique de Champion.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Le laboratoire ─────────────────────────────────────────────────────────
  var CHEN = {
    accueil: {
      fr: "Le Professeur {prof} t'attend au laboratoire.",
      en: "Professor {prof} is waiting at the lab.",
    },
    remise: {
      fr: "{prof} te tend le Pokédex. Il veut le voir rempli.",
      en: "{prof} hands you the Pokédex. He wants it filled.",
    },
    choixStarter: {
      fr: "Trois Poké Balls sont posées sur la table. Une seule est pour toi.",
      en: "Three Poké Balls sit on the table. Only one is yours.",
    },
    apresChoix: {
      fr: "{prof} hoche la tête. Ton rival prend celui qui bat le tien.",
      en: "{prof} nods. Your rival takes the one that beats yours.",
    },
    adieu: {
      fr: "Va voir du pays. Reviens quand tu auras rempli le Pokédex.",
      en: "Go see the world. Come back when the Pokédex is full.",
    },
  };

  // ── Le rival ───────────────────────────────────────────────────────────────
  //  Il apparaît aux points canon. Ses répliques ne dépendent pas d'un tirage :
  //  elles suivent le nombre de badges, donc elles disent toujours vrai.
  var RIVAL = {
    premier: {
      fr: "{rival} bloque le passage. Il veut voir ce que tu vaux.",
      en: "{rival} blocks the way. He wants to see what you can do.",
    },
    gagne: {
      fr: "{rival} rappelle son Pokémon sans un mot.",
      en: "{rival} recalls his Pokémon without a word.",
    },
    perdu: {
      fr: "{rival} sourit. Il te dépasse et continue sa route.",
      en: "{rival} smiles. He walks past you and moves on.",
    },
    milieu: {
      fr: "{rival} compte tes badges du regard. Il en a un de plus.",
      en: "{rival} counts your badges at a glance. He has one more.",
    },
    ligue: {
      fr: "{rival} t'attend au bout du couloir. Il est arrivé avant toi.",
      en: "{rival} waits at the end of the hall. He got here first.",
    },
  };

  // ── Les Champions d'Arène ──────────────────────────────────────────────────
  //  Une réplique avant, une après. 🔴 Les NOMS viennent de `POKE_ARENES`, lu
  //  depuis Poképédia — on ne les écrit pas ici.
  //  🔴 Ondine, Erika et Morgane sont des femmes : aucune de ces lignes ne dit
  //     « il ». C'est ce que vérifie `poke-genre.mjs` côté personnages.
  var ARENES = {
    1: {
      avant: { fr: "Mes Pokémon sont durs comme la pierre. Montre-moi les tiens.", en: "My Pokémon are as hard as rock. Show me yours." },
      apres: { fr: "Tu as visé juste. Le Badge Roche est à toi.", en: "You aimed well. The Boulder Badge is yours." },
    },
    2: {
      avant: { fr: "Ma spécialité, ce sont les Pokémon de type Eau.", en: "My specialty is Water-type Pokémon." },
      apres: { fr: "Tu es plus fort{e} que tu n'en as l'air. Prends le Badge Cascade.", en: "You are stronger than you look. Take the Cascade Badge." },
    },
    3: {
      avant: { fr: "Le courant passe. Voyons si tu tiens le choc.", en: "The current is on. Let us see if you hold." },
      apres: { fr: "Belle décharge. Le Badge Foudre te revient.", en: "Good jolt. The Thunder Badge is yours." },
    },
    4: {
      avant: { fr: "Mes plantes sentent la peur. Tu n'en as pas.", en: "My plants sense fear. You have none." },
      apres: { fr: "Tu mérites le Badge Prisme. Prends-en soin.", en: "You deserve the Rainbow Badge. Take care of it." },
    },
    5: {
      avant: { fr: "Le poison est une arme lente. Elle ne rate jamais.", en: "Poison is a slow weapon. It never misses." },
      apres: { fr: "Tu as tenu jusqu'au bout. Voici le Badge Âme.", en: "You held to the end. Here is the Soul Badge." },
    },
    6: {
      avant: { fr: "Je sais déjà comment ce combat se termine.", en: "I already know how this battle ends." },
      apres: { fr: "Je m'étais trompée. Prends le Badge Marais.", en: "I was wrong. Take the Marsh Badge." },
    },
    7: {
      avant: { fr: "Mes Pokémon brûlent tout. Tu vas avoir chaud.", en: "My Pokémon burn everything. It will get hot." },
      apres: { fr: "Tu ne t'es pas brûlé{e}. Le Badge Volcan est à toi.", en: "You did not get burned. The Volcano Badge is yours." },
    },
    8: {
      avant: { fr: "Tu es venu{e} jusqu'ici. Je vais y mettre fin.", en: "You came all this way. I will end it here." },
      apres: { fr: "Je quitte l'Arène. Le Badge Terre est le dernier.", en: "I am leaving the Gym. The Earth Badge is the last one." },
    },
  };

  // ── La Ligue ───────────────────────────────────────────────────────────────
  //  🔴 AUCUN SOIN ENTRE LES CINQ COMBATS. Le texte le dit AVANT, parce qu'une
  //     règle dure qu'on découvre en la subissant se lit comme un bug.
  var LIGUE = {
    entree: {
      fr: "Cinq combats t'attendent. Aucun soin entre eux.",
      en: "Five battles await. No healing between them.",
    },
    conseil1: { fr: "Olga ouvre. La glace ne pardonne pas.", en: "Lorelei opens. Ice does not forgive." },
    conseil2: { fr: "Aldo frappe fort et vite. Tiens la distance.", en: "Bruno hits hard and fast. Keep your distance." },
    conseil3: { fr: "Agatha t'attend dans le noir. Elle connaît ton équipe.", en: "Agatha waits in the dark. She knows your team." },
    conseil4: { fr: "Peter est le dernier avant le Champion.", en: "Lance is the last one before the Champion." },
    champion: {
      fr: "Le Champion se retourne. C'est {rival}.",
      en: "The Champion turns around. It is {rival}.",
    },
  };

  // ── La Team Rocket ─────────────────────────────────────────────────────────
  var ROCKET = {
    selenite: { fr: "Deux hommes en noir fouillent la grotte. Ils cherchent des fossiles.", en: "Two men in black are digging. They are after fossils." },
    celadopole: { fr: "Le repaire est sous le casino. Personne ne surveille l'escalier.", en: "The hideout is under the casino. Nobody watches the stairs." },
    tour: { fr: "Ils occupent la tour. Les tombes ne les gênent pas.", en: "They hold the tower. The graves do not bother them." },
    silph: { fr: "La tour Silph est prise. Onze étages, un ascenseur bloqué.", en: "Silph Co. is taken. Eleven floors, one locked lift." },
    fuite: { fr: "La Team Rocket se disperse. Giovanni disparaît le dernier.", en: "Team Rocket scatters. Giovanni leaves last." },
  };

  // ── Les moments du voyage ──────────────────────────────────────────────────
  var VOYAGE = {
    premierPas: {
      fr: "Te voilà dresseur. Le premier pas est fait.",
      frF: "Te voilà dresseuse. Le premier pas est fait.",
      en: "You are a trainer now. The first step is taken.",
    },
    seul: {
      fr: "Tu pars seul{e}, avec un Pokémon et un Pokédex.",
      en: "You leave alone, with one Pokémon and a Pokédex.",
    },
    // 🔴 TROIS RÉPLIQUES SUPPRIMÉES LE 08/08, PAS DÉCLARÉES DORMANTES.
    //    `pret` doublait « te voilà dresseur » sur le même écran ; `selenite`
    //    répétait mot pour mot ce que `ROCKET.selenite` dit à la même étape ;
    //    `safari` redisait la règle que son écran affiche en gros. Toutes trois
    //    attendaient depuis des jours dans la liste « sans écran » du détecteur.
    //    Une liste d'exceptions où l'on n'enlève jamais rien devient le cimetière
    //    qu'on ne regarde plus — la même règle que pour les portes mortes, et
    //    elle vient de servir une seconde fois cette nuit.
    foret: { fr: "La Forêt de Jade est sombre. On y entend des insectes.", en: "Viridian Forest is dark. You can hear insects." },
    tunnel: { fr: "Le tunnel est noir. Il te faut une source de lumière.", en: "The tunnel is pitch dark. You need a light." },
    ronflex: { fr: "Un Ronflex dort en travers de la route. Il ne bougera pas seul.", en: "A Snorlax sleeps across the road. It will not move on its own." },
    victoire: { fr: "La Route Victoire monte. Personne ne la traverse sans force.", en: "Victory Road climbs. Nobody crosses it without strength." },
    grotte: { fr: "La Grotte Inconnue s'ouvre après la Ligue. Quelque chose y vit.", en: "Cerulean Cave opens after the League. Something lives there." },
  };

  // ── Les moments de collection ──────────────────────────────────────────────
  var POKEDEX = {
    premiereCapture: {
      fr: "Ta première capture. Le Pokédex s'écrit tout seul.",
      en: "Your first catch. The Pokédex writes itself.",
    },
    legendaireEnfui: {
      fr: "Il s'enfuit. Tu ne le reverras pas de ce voyage.",
      en: "It fled. You will not see it again this journey.",
    },
    // 🔴 L'ISSUE LA PLUS FRÉQUENTE N'AVAIT AUCUNE PHRASE. Mesuré au harnais :
    //    sur 633 rencontres de légendaire, **312 finissaient en « victoire »**
    //    — c'est-à-dire que le joueur ABAT ce qu'il était venu prendre. Et
    //    l'écran enchaînait directement sur la carte de butin, sans un mot.
    //    Le nœud promet « un seul essai, et il ne revient pas » ; on consomme
    //    l'essai de la pire façon possible et le jeu se tait.
    //    Pire : le voyage l'enregistrait comme « enfui ». Un légendaire abattu
    //    n'est pas enfui, et le vocabulaire interne ne doit pas mentir non plus.
    // 🔴 ET « IL S'ENFUIT » S'AFFICHAIT QUAND C'EST LE JOUEUR QUI FUYAIT. Le
    //    journal du combat dit « Tu prends la fuite. », puis l'écran de
    //    conclusion répondait « Il s'enfuit. Tu ne le reverras pas ». Deux
    //    écrans qui se contredisent à un clic d'écart, sur l'événement le plus
    //    rare de la partie. La v468 avait nommé trois issues et laissé la fuite
    //    et la défaite partager la même phrase — vraie pour l'une, fausse pour
    //    l'autre. *Un « sinon » finit toujours par recouvrir deux cas.*
    legendaireLache: {
      fr: "Tu t'en vas. Il n'y en avait qu'un.",
      en: "You walk away. There was only one.",
    },
    legendaireAbattu: {
      fr: "Il tombe. On ne capture pas ce qu'on a mis à terre.",
      en: "It falls. You cannot catch what you knocked out.",
    },
    // Le voyage a été interrompu pendant la chasse : l'essai est consommé, et
    // c'est la seule chose qu'on puisse dire honnêtement.
    legendaireManque: {
      fr: "L'essai est passé. Il n'y en avait qu'un.",
      en: "The attempt is spent. There was only one.",
    },
    legendairePris: {
      fr: "Il est à toi. Il n'y en avait qu'un.",
      en: "It is yours. There was only one.",
    },
    fossileChoisi: {
      fr: "Tu prends celui-là. L'autre reste dans la pierre.",
      en: "You take that one. The other stays in the stone.",
    },
    masterBall: {
      fr: "Une seule Master Ball existe. Choisis bien ta cible.",
      en: "Only one Master Ball exists. Choose your target well.",
    },
  };

  W.POKE_SCENARIO = {
    CHEN: CHEN, RIVAL: RIVAL, ARENES: ARENES, LIGUE: LIGUE,
    ROCKET: ROCKET, VOYAGE: VOYAGE, POKEDEX: POKEDEX,
  };
})(typeof window !== "undefined" ? window : globalThis);
