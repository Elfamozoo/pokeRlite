(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  Vivier de Dresseurs de Route d'Hoenn (Génération 3 - Émeraude).
  //  Chaque dresseur possède un identifiant unique, sa classe, son nom bilingue,
  //  ses citations de combat et une clé d'équipe associée.
  // ═══════════════════════════════════════════════════════════════════════════

  W.POKE_GEN3_DRESSEURS = [
    {
      id: "youngster_calvin",
      classe: "youngster",
      nom: { fr: "Calvin", en: "Calvin" },
      quotes: {
        debut: { fr: "Si tu croises le regard d'un dresseur, c'est l'heure du combat !", en: "If our eyes meet, a battle must begin!" },
        fin: { fr: "Zut ! Mes Pokémon étaient pourtant bien entraînés...", en: "Aww! But I trained my Pokémon so hard..." }
      },
      replique: { fr: "Si tu croises le regard d'un dresseur, c'est l'heure du combat !", en: "If our eyes meet, a battle must begin!" },
      equipeKey: "youngster_1"
    },
    {
      id: "youngster_allen",
      classe: "youngster",
      nom: { fr: "Alain", en: "Allen" },
      quotes: {
        debut: { fr: "Mon Lineon va te distancer en vitesse !", en: "My Linoone will outspeed anything you have!" },
        fin: { fr: "Tu as été plus rapide que l'éclair...", en: "You were as fast as lightning..." }
      },
      replique: { fr: "Mon Lineon va te distancer en vitesse !", en: "My Linoone will outspeed anything you have!" },
      equipeKey: "youngster_2"
    },
    {
      id: "youngster_timmy_route",
      classe: "youngster",
      nom: { fr: "Billy", en: "Billy" },
      quotes: {
        debut: { fr: "J'ai attrapé plein d'oiseaux dans les hautes herbes !", en: "I caught so many bird Pokémon in the tall grass!" },
        fin: { fr: "Ils se sont envolés trop vite...", en: "They flew away too fast..." }
      },
      replique: { fr: "J'ai attrapé plein d'oiseaux dans les hautes herbes !", en: "I caught so many bird Pokémon in the tall grass!" },
      equipeKey: "youngster_3"
    },
    {
      id: "lass_tiffany",
      classe: "lass",
      nom: { fr: "Tiffany", en: "Tiffany" },
      quotes: {
        debut: { fr: "Mes Pokémon sont tellement mignons que tu ne voudras pas les frapper !", en: "My Pokémon are so cute you won't want to hit them!" },
        fin: { fr: "Comment as-tu osé faire du mal à mes trésors ?", en: "How could you be so mean to my cuties?" }
      },
      replique: { fr: "Mes Pokémon sont tellement mignons que tu ne voudras pas les frapper !", en: "My Pokémon are so cute you won't want to hit them!" },
      equipeKey: "lass_1"
    },
    {
      id: "lass_haley",
      classe: "lass",
      nom: { fr: "Hélène", en: "Haley" },
      quotes: {
        debut: { fr: "Fais attention aux spores de mon Balignon !", en: "Watch out for my Shroomish's spores!" },
        fin: { fr: "Même endormi tu as gagné...", en: "You still won even while drowsy..." }
      },
      replique: { fr: "Fais attention aux spores de mon Balignon !", en: "Watch out for my Shroomish's spores!" },
      equipeKey: "lass_2"
    },
    {
      id: "bug_catcher_rick",
      classe: "bug_catcher",
      nom: { fr: "Rick", en: "Rick" },
      quotes: {
        debut: { fr: "La forêt regorge d'insectes fascinants !", en: "The woods are teeming with fascinating bug Pokémon!" },
        fin: { fr: "Mes précieux insectes ont été écrasés !", en: "My precious bugs were squished!" }
      },
      replique: { fr: "La forêt regorge d'insectes fascinants !", en: "The woods are teeming with fascinating bug Pokémon!" },
      equipeKey: "bug_catcher_1"
    },
    {
      id: "bug_catcher_lyle",
      classe: "bug_catcher",
      nom: { fr: "Léo", en: "Lyle" },
      quotes: {
        debut: { fr: "Mon Ninjask frappe plus vite que ton ombre !", en: "My Ninjask strikes faster than your shadow!" },
        fin: { fr: "Une vitesse incroyable n'a pas suffi...", en: "Incredible speed wasn't enough..." }
      },
      replique: { fr: "Mon Ninjask frappe plus vite que ton ombre !", en: "My Ninjask strikes faster than your shadow!" },
      equipeKey: "bug_catcher_2"
    },
    {
      id: "rich_boy_winston",
      classe: "rich_boy",
      nom: { fr: "Stanislas", en: "Winston" },
      quotes: {
        debut: { fr: "Mon père m'a acheté les meilleurs Pokémon du monde.", en: "My father bought me the finest Pokémon in the world." },
        fin: { fr: "Je vais demander à mon père de m'en acheter d'autres !", en: "I shall ask my father to buy me stronger ones!" }
      },
      replique: { fr: "Mon père m'a acheté les meilleurs Pokémon du monde.", en: "My father bought me the finest Pokémon in the world." },
      equipeKey: "rich_boy_1"
    },
    {
      id: "lady_cindy",
      classe: "lady",
      nom: { fr: "Cynthia", en: "Cindy" },
      quotes: {
        debut: { fr: "Une vraie dame ne refuse jamais une invitation au duel.", en: "A true lady never declines a gentlemanly challenge." },
        fin: { fr: "Quelle impolitesse ! Mais quelle technique remarquable...", en: "How terribly rude! Yet such exquisite technique..." }
      },
      replique: { fr: "Une vraie dame ne refuse jamais une invitation au duel.", en: "A true lady never declines a gentlemanly challenge." },
      equipeKey: "lady_1"
    },
    {
      id: "triathlete_dylan",
      classe: "triathlete",
      nom: { fr: "Dylan", en: "Dylan" },
      quotes: {
        debut: { fr: "Course, natation, cyclisme : l'endurance est la clé de la victoire !", en: "Running, swimming, cycling: endurance is key to victory!" },
        fin: { fr: "Je suis à bout de souffle...", en: "I'm completely out of breath..." }
      },
      replique: { fr: "Course, natation, cyclisme : l'endurance est la clé de la victoire !", en: "Running, swimming, cycling: endurance is key to victory!" },
      equipeKey: "triathlete_1"
    },
    {
      id: "aroma_lady_rose",
      classe: "aroma_lady",
      nom: { fr: "Rosalie", en: "Rose" },
      quotes: {
        debut: { fr: "Sens ce doux parfum apaisant... Il guérit l'âme.", en: "Breathe in this soothing aroma... It heals the spirit." },
        fin: { fr: "Mes pétales ont fané sous la tempête.", en: "My petals have withered in the storm." }
      },
      replique: { fr: "Sens ce doux parfum apaisant... Il guérit l'âme.", en: "Breathe in this soothing aroma... It heals the spirit." },
      equipeKey: "aroma_lady_1"
    },
    {
      id: "pokemon_ranger_catherine",
      classe: "pokemon_ranger",
      nom: { fr: "Catherine", en: "Catherine" },
      quotes: {
        debut: { fr: "Nous protégeons la nature et apprenons d'elle !", en: "We protect nature and learn its ancient lessons!" },
        fin: { fr: "Tu as fait corps avec la nature.", en: "You truly fought as one with nature." }
      },
      replique: { fr: "Nous protégeons la nature et apprenons d'elle !", en: "We protect nature and learn its ancient lessons!" },
      equipeKey: "pokemon_ranger_1"
    },
    {
      id: "collector_edwin",
      classe: "collector",
      nom: { fr: "Edgar", en: "Edwin" },
      quotes: {
        debut: { fr: "Admire les spécimens rarissimes de ma collection personnelle !", en: "Admire the exquisite rare specimens of my personal collection!" },
        fin: { fr: "Ne va pas abîmer mes précieux Pokémon de collection !", en: "Don't you dare scratch my precious collector's items!" }
      },
      replique: { fr: "Admire les spécimens rarissimes de ma collection personnelle !", en: "Admire the exquisite rare specimens of my personal collection!" },
      equipeKey: "collector_1"
    },
    {
      id: "ninja_boy_lao",
      classe: "ninja_boy",
      nom: { fr: "Lao", en: "Lao" },
      quotes: {
        debut: { fr: "Dissimulé dans les ombres, je frappe sans crier gare !", en: "Concealed within the shadows, I strike without warning!" },
        fin: { fr: "Pouah ! Démasqué et vaincu !", en: "Poof! Exposed and defeated!" }
      },
      replique: { fr: "Dissimulé dans les ombres, je frappe sans crier gare !", en: "Concealed within the shadows, I strike without warning!" },
      equipeKey: "ninja_boy_1"
    },
    {
      id: "parasol_lady_madeline",
      classe: "parasol_lady",
      nom: { fr: "Madeleine", en: "Madeline" },
      quotes: {
        debut: { fr: "Qu'il pleuve ou qu'il vente, mon ombrelle me protège.", en: "Come rain or shine, my parasol shields me completely." },
        fin: { fr: "Une bourrasque a emporté mon ombrelle !", en: "A sudden gust has blown my parasol away!" }
      },
      replique: { fr: "Qu'il pleuve ou qu'il vente, mon ombrelle me protège.", en: "Come rain or shine, my parasol shields me completely." },
      equipeKey: "parasol_lady_1"
    },
    {
      id: "sailor_brendan",
      classe: "sailor",
      nom: { fr: "Gilles", en: "Brendan" },
      quotes: {
        debut: { fr: "J'ai navigué sur toutes les mers d'Hoenn avec mes Pokémon !", en: "I've sailed all the seven seas of Hoenn alongside my crew!" },
        fin: { fr: "Coulé par le fond ! Bien joué, matelot !", en: "Sent straight to Davy Jones' locker! Well done, sailor!" }
      },
      replique: { fr: "J'ai navigué sur toutes les mers d'Hoenn avec mes Pokémon !", en: "I've sailed all the seven seas of Hoenn alongside my crew!" },
      equipeKey: "sailor_1"
    },
    {
      id: "fisherman_elliot",
      classe: "fisherman",
      nom: { fr: "Elliot", en: "Elliot" },
      quotes: {
        debut: { fr: "Ça mord ! Prépare-toi à un combat arrosé !", en: "A huge bite! Get ready for a soaking-wet battle!" },
        fin: { fr: "Ma ligne a cassé...", en: "My fishing line snapped..." }
      },
      replique: { fr: "Ça mord ! Prépare-toi à un combat arrosé !", en: "A huge bite! Get ready for a soaking-wet battle!" },
      equipeKey: "fisherman_1"
    },
    {
      id: "hiker_clark",
      classe: "hiker",
      nom: { fr: "Brice", en: "Clark" },
      quotes: {
        debut: { fr: "Gravir les pics rocheux renforce le corps et l'esprit !", en: "Scaling rocky crags builds muscle and unyielding spirit!" },
        fin: { fr: "Un éboulement imprévu !", en: "An unexpected rockslide!" }
      },
      replique: { fr: "Gravir les pics rocheux renforce le corps et l'esprit !", en: "Scaling rocky crags builds muscle and unyielding spirit!" },
      equipeKey: "hiker_1"
    },
    {
      id: "swimmer_m_tony",
      classe: "swimmer_m",
      nom: { fr: "Tony", en: "Tony" },
      quotes: {
        debut: { fr: "Les courants marins de Chenal 124 sont parfaits pour nager !", en: "The ocean currents on Route 124 are prime for swimming!" },
        fin: { fr: "Glou glou... J'ai bu la tasse !", en: "Glub glub... I swallowed a mouthful of seawater!" }
      },
      replique: { fr: "Les courants marins de Chenal 124 sont parfaits pour nager !", en: "The ocean currents on Route 124 are prime for swimming!" },
      equipeKey: "swimmer_m_1"
    },
    {
      id: "swimmer_f_katie",
      classe: "swimmer_f",
      nom: { fr: "Katia", en: "Katie" },
      quotes: {
        debut: { fr: "L'eau azurée d'Atalanopolis est mon domaine !", en: "The azure waters around Sootopolis are my sanctuary!" },
        fin: { fr: "Tes attaques ont fait de grosses vagues !", en: "Your attacks made gigantic waves!" }
      },
      replique: { fr: "L'eau azurée d'Atalanopolis est mon domaine !", en: "The azure waters around Sootopolis are my sanctuary!" },
      equipeKey: "swimmer_f_1"
    },
    {
      id: "team_aqua_grunt_1",
      classe: "team_aqua",
      nom: { fr: "Sbire Aqua", en: "Aqua Grunt" },
      quotes: {
        debut: { fr: "L'océan doit engloutir les terres pour redonner vie au monde !", en: "The vast ocean must drown the land to renew the earth!" },
        fin: { fr: "Le chef Arthur ne va pas aimer ça...", en: "Boss Archie is not going to like this..." }
      },
      replique: { fr: "L'océan doit engloutir les terres pour redonner vie au monde !", en: "The vast ocean must drown the land to renew the earth!" },
      equipeKey: "team_aqua_1"
    },
    {
      id: "team_magma_grunt_1",
      classe: "team_magma",
      nom: { fr: "Sbire Magma", en: "Magma Grunt" },
      quotes: {
        debut: { fr: "La terre ferme est le berceau de l'humanité !", en: "The solid earth is the rightful cradle of humanity!" },
        fin: { fr: "Max nous avait pourtant prévenus...", en: "Maxie warned us about tough trainers..." }
      },
      replique: { fr: "La terre ferme est le berceau de l'humanité !", en: "The solid earth is the rightful cradle of humanity!" },
      equipeKey: "team_magma_1"
    },
    {
      id: "expert_timothy",
      classe: "expert",
      nom: { fr: "Timothée", en: "Timothy" },
      quotes: {
        debut: { fr: "Des décennies de méditation m'ont appris à anticiper chaque coup.", en: "Decades of deep meditation taught me to foresee every blow." },
        fin: { fr: "Une force intérieure remarquable ! Respect.", en: "A truly remarkable inner power! My respect." }
      },
      replique: { fr: "Des décennies de méditation m'ont appris à anticiper chaque coup.", en: "Decades of deep meditation taught me to foresee every blow." },
      equipeKey: "expert_1"
    },
    {
      id: "cooltrainer_m_samuel",
      classe: "cooltrainer_m",
      nom: { fr: "Samuel", en: "Samuel" },
      quotes: {
        debut: { fr: "Tu as traversé la Route Victoire ? Montre-moi ta vraie force !", en: "You made it through Victory Road? Prove your worth to me!" },
        fin: { fr: "Tu es digne d'affronter le Conseil 4.", en: "You are truly ready to challenge the Elite Four." }
      },
      replique: { fr: "Tu as traversé la Route Victoire ? Montre-moi ta vraie force !", en: "You made it through Victory Road? Prove your worth to me!" },
      equipeKey: "cooltrainer_m_1"
    },
    {
      id: "cooltrainer_f_brooke",
      classe: "cooltrainer_f",
      nom: { fr: "Bérénice", en: "Brooke" },
      quotes: {
        debut: { fr: "Seuls les meilleurs dresseurs atteignent ces sommets !", en: "Only the very finest trainers ever reach these heights!" },
        fin: { fr: "Ton talent est éclatant. Bonne chance à la Ligue !", en: "Your skill is magnificent. Good luck at the Pokémon League!" }
      },
      replique: { fr: "Seuls les meilleurs dresseurs atteignent ces sommets !", en: "Only the very finest trainers ever reach these heights!" },
      equipeKey: "cooltrainer_f_1"
    }
  ];

})(typeof window !== "undefined" ? window : globalThis);
