export interface Experience {
  id: string;
  poste: string;
  entreprise: string;
  periode: string;
  lieu: string;
  resume: string;
  faitsMarquants: string[];
  stack: string[];
}

export interface Formation {
  id: string;
  titre: string;
  ecole: string;
  periode: string;
  lieu: string;
  statut: 'en_cours' | 'obtenu';
  mention?: string;
  endpoint: string;
  details: string[];
  modules: string[];
  stack: string[];
}

export interface ReadmeSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
}

export interface Projet {
  id: string;
  titre: string;
  tag: string;
  resume: string;
  readmeTitle: string;
  readme: ReadmeSection[];
  annee: string;
}

export interface CompetenceItem {
  nom: string;
  detail: string;
}

export interface GroupeCompetence {
  id: string;
  libelle: string;
  niveau: number;
  items: CompetenceItem[];
}

export interface Stat {
  valeur: string;
  libelle: string;
}

export const cv = {
  nomComplet: 'Naël Ait',
  prenom: 'Naël',
  nom: 'Ait',
  poste: 'Analyste développeur .NET / Angular',
  lieu: 'Bruxelles',
  disponibilite: 'Disponible pour rejoindre une équipe produit',
  email: 'nael.ait@gmail.com',
  telephone: '0494 74 96 26',
  telephoneTel: '+32494749626',
  cvPdf: 'cv.pdf',
  cvPdfLabel: 'CV — Naël Ait.pdf',
  liens: [{ libelle: 'LinkedIn', href: 'https://www.linkedin.com/in/nael-ait' }] as {
    libelle: string;
    href: string;
  }[],
  slogan:
    'Full-stack Angular et .NET : des apps qui tiennent la charge, du front soigné, et l’envie d’apprendre encore.',
  aProposTitre: 'Curieux, rigoureux, motivé par les défis techniques.',
  aPropos: [
    'Développeur full-stack spécialisé en Angular et .NET, je dispose d’une solide expérience en développement front-end et back-end. Curieux et rigoureux, je m’inscris dans une démarche d’apprentissage continu afin de perfectionner mes compétences et de rester à jour sur les technologies modernes.',
    'Les défis techniques sont une source de motivation constante, et je souhaite évoluer au sein d’une équipe d’experts pour contribuer à des projets innovants dans un environnement stimulant.',
  ],
  stats: [
    { valeur: '.NET / Angular', libelle: 'Stack principale en production' },
    { valeur: 'Ephec', libelle: 'Bachelier Informatique de Gestion — avec distinction' },
    { valeur: 'Bruxelles', libelle: 'Disponible en présentiel / hybride' },
  ] satisfies Stat[],
  experiences: [
    {
      id: 'exp-1',
      poste: 'Développeur .NET',
      entreprise: 'Leroy & Partners',
      periode: '01/2025 — 12/2025',
      lieu: 'Ixelles',
      resume:
        'Intégration à l’équipe de développement : modernisation web, applications .NET, outils internes et solution mobile terrain.',
      faitsMarquants: [
        'Participation active à la refonte et à la modernisation du site web de l’entreprise (Angular 20+)',
        'Développement et maintenance d’applications .NET (C#), orientées performance et évolutivité',
        'Conception et création de DLL personnalisées pour améliorer et étendre un outil interne existant',
        'Remplacement de la solution FreeFlow (Xerox) par une solution interne sur mesure, réduisant la dépendance à un outil externe',
        'Développement d’une application tablette en Flutter destinée aux tournées des huissiers (collecte et consultation de données terrain)',
      ],
      stack: ['Angular 20+', '.NET', 'C#', 'Flutter', 'DLL'],
    },
    {
      id: 'exp-2',
      poste: 'Développeur Web',
      entreprise: 'Startups.be',
      periode: '2018 — 2019',
      lieu: 'Belgique',
      resume:
        'Refonte du site web et montée en gamme des perfs front / back pour une expérience plus rapide et stable.',
      faitsMarquants: [
        'Participation à la refonte du site avec intégration de technologies modernes telles que Vue.js',
        'Optimisation des performances front-end et back-end pour améliorer rapidité, stabilité et expérience utilisateur',
      ],
      stack: ['Vue.js', 'JavaScript', 'Front-end', 'Back-end'],
    },
    {
      id: 'exp-3',
      poste: 'Bénévole — Support et maintenance informatique',
      entreprise: 'Cité Culture',
      periode: '2017 — 2024',
      lieu: 'Bruxelles',
      resume: 'Support utilisateurs et maintenance du parc informatique sur le long terme.',
      faitsMarquants: [
        'Maintenance et gestion du parc informatique',
        'Support technique aux utilisateurs, diagnostic et résolution d’incidents matériels et logiciels',
        'Assistance à l’utilisation des outils informatiques',
      ],
      stack: ['Support', 'Hardware', 'Software'],
    },
  ] satisfies Experience[],
  formations: [
    {
      id: 'edu-1',
      titre: 'Bachelier en Informatique de Gestion',
      ecole: 'Ephec',
      periode: '2026',
      lieu: 'Woluwé-Saint-Lambert',
      statut: 'obtenu',
      mention: 'avec distinction',
      endpoint: 'ephec',
      details: [
        'Diplôme obtenu avec distinction.',
        'Parcours orienté développement d’applications métier et gestion de projets IT.',
        'Travail de Fin d’Études (TFE) : Vibely — application mobile Flutter + API ASP.NET Core 10 / SQL Server, rencontres par croisements GPS et affinité musicale Spotify (Stripe, SignalR, Riverpod).',
      ],
      modules: [
        'Architecture logicielle & patterns',
        'Développement mobile (Flutter)',
        'API REST & bases de données (SQL Server)',
        'Gestion de projet & méthodes agiles',
        'TFE — Vibely (rencontres contextuelles)',
      ],
      stack: ['Flutter', 'ASP.NET Core', 'SQL Server', 'SignalR', 'Riverpod', 'Stripe', 'Angular'],
    },
    {
      id: 'edu-2',
      titre: 'Formation développeur WEB',
      ecole: 'Becode',
      periode: '2017 — 2018',
      lieu: 'Bruxelles',
      statut: 'obtenu',
      endpoint: 'becode',
      details: [
        'Bootcamp intensif : bases solides du développement web et travail en équipe sur projets concrets.',
        'Première immersion professionnelle dans un environnement agile, pair programming et livraisons itératives.',
      ],
      modules: [
        'HTML5 / CSS3 / responsive',
        'JavaScript & DOM',
        'PHP & bases de données',
        'Git & workflow collaboratif',
        'Projets d’équipe en conditions réelles',
      ],
      stack: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'MySQL', 'Git'],
    },
  ] satisfies Formation[],
  projets: [
    {
      id: 'p1',
      titre: 'TFE — Vibely (rencontres contextuelles)',
      tag: 'Flutter · ASP.NET Core 10 · SQL Server · SignalR · Stripe',
      resume:
        'App mobile de rencontres contextuelles : croisements GPS réels + affinité musicale Spotify.',
      readmeTitle: 'vibely',
      readme: [
        {
          paragraphs: [
            'Application mobile de rencontres basées sur des **croisements réels** et une **affinité musicale** calculée via Spotify.',
            'Objectif : favoriser des connexions naturelles quand deux personnes se croisent réellement, sans swipe infini.',
          ],
        },
        {
          heading: 'Fonctionnalités clés',
          bullets: [
            'Détection de croisement GPS (~120 m, fenêtre 45 min) entre utilisateurs proches',
            'Score d’affinité musicale via profils Spotify connectés',
            'Messagerie temps réel et notifications push (SignalR)',
            'Abonnement Vibely Plus via Stripe (WebView checkout)',
            'Onboarding guidé, profils, filtres et gestion des sessions actives',
          ],
        },
        {
          heading: 'Architecture',
          bullets: [
            'Mobile Flutter (Riverpod) — parcours auth, carte, matches, chat',
            'API ASP.NET Core 10 — endpoints REST + hubs SignalR',
            'SQL Server — modèle relationnel, migrations, index sur géolocalisation',
            'Intégrations OAuth Spotify + webhooks Stripe',
          ],
        },
        {
          heading: 'Quick start (dev)',
          code: `git clone vibely
cd api && dotnet run
cd app && flutter run`,
        },
        {
          heading: 'Contexte',
          paragraphs: [
            'Travail de fin d’études (Ephec) — projet complet de A à Z : cadrage, implémentation, tests et documentation.',
          ],
        },
      ],
      annee: '2025',
    },
    {
      id: 'p2',
      titre: 'Refonte site Leroy & Partners',
      tag: 'Angular 20+ · TypeScript · .NET',
      resume: 'Modernisation du site web corporate au sein de l’équipe de développement.',
      readmeTitle: 'leroy-web',
      readme: [
        {
          paragraphs: [
            'Refonte et modernisation du **site web** de Leroy & Partners dans un contexte de production.',
            'Migration progressive vers une base **Angular 20+** plus maintenable, avec attention portée aux perfs et à l’accessibilité.',
          ],
        },
        {
          heading: 'Scope',
          bullets: [
            'Pages institutionnelles et parcours clés du site public',
            'Composants réutilisables alignés avec la charte existante',
            'Intégration avec les services back-end .NET de l’équipe',
            'Revue de code, corrections et livraisons itératives en équipe',
          ],
        },
        {
          heading: 'Approche',
          bullets: [
            'Découpage en modules Angular lazy-loaded',
            'Formulaires typés, validation et gestion d’état par composant',
            'Optimisation du bundle et du rendu (lazy routes, OnPush où pertinent)',
            'Collaboration étroite avec le métier pour valider les parcours',
          ],
        },
        {
          heading: 'Résultat',
          paragraphs: [
            'Site plus moderne, base de code prête pour les évolutions futures, dette visuelle réduite sur les zones refondues.',
          ],
        },
      ],
      annee: '2025',
    },
    {
      id: 'p3',
      titre: 'App tablette huissiers',
      tag: 'Flutter · .NET · Offline-first',
      resume: 'Application tablette terrain pour les tournées des huissiers de justice.',
      readmeTitle: 'huissiers-app',
      readme: [
        {
          paragraphs: [
            'Application **tablette Flutter** déployée sur le terrain pour les huissiers de justice.',
            'Permet la **collecte** et la **consultation** de données pendant les tournées, en contexte mobile et parfois connectivité limitée.',
          ],
        },
        {
          heading: 'Cas d’usage',
          bullets: [
            'Consultation des dossiers et informations client sur place',
            'Saisie de compte-rendus et statuts de tournée',
            'Synchronisation avec le back-end .NET à la reconnexion',
            'Interface adaptée au format tablette et à l’usage en extérieur',
          ],
        },
        {
          heading: 'Contraintes techniques',
          bullets: [
            'UI lisible en conditions de luminosité variables',
            'Gestion des états loading / erreur / retry',
            'Appels API sécurisés vers les services internes',
            'Packaging et déploiement sur parc tablettes Android',
          ],
        },
        {
          heading: 'Stack',
          code: `Flutter 3.x · Dart
API .NET (C#)
Auth interne · REST JSON`,
        },
      ],
      annee: '2025',
    },
    {
      id: 'p4',
      titre: 'Remplacement FreeFlow Xerox',
      tag: '.NET · C# · DLL · Automatisation',
      resume:
        'Solution interne sur mesure remplaçant FreeFlow et réduisant la dépendance éditeur.',
      readmeTitle: 'freeflow-internal',
      readme: [
        {
          paragraphs: [
            'Remplacement d’une brique **FreeFlow (Xerox)** par une **solution interne** développée en .NET.',
            'Objectif : reprendre le contrôle sur un flux documentaire critique et supprimer une dépendance coûteuse à un outil externe.',
          ],
        },
        {
          heading: 'Problème',
          bullets: [
            'Licences et évolutions FreeFlow hors de notre contrôle',
            'Intégration rigide avec le reste du SI documentaire',
            'Besoin d’extensions métier non couvertes par l’éditeur',
          ],
        },
        {
          heading: 'Solution',
          bullets: [
            'Services .NET dédiés au traitement et à l’orchestration des flux',
            'DLL personnalisées branchées sur l’outil interne existant',
            'Logs, reprise sur erreur et paramétrage par environnement',
            'Documentation technique pour la maintenance par l’équipe',
          ],
        },
        {
          heading: 'Impact',
          paragraphs: [
            'Indépendance vis-à-vis de l’éditeur, coûts maîtrisés et possibilité d’itérer rapidement sur les règles métier.',
          ],
        },
      ],
      annee: '2025',
    },
  ] satisfies Projet[],
  competences: [
    {
      id: 's1',
      libelle: 'Front-end / Web',
      niveau: 88,
      items: [
        {
          nom: 'Angular',
          detail:
            'Framework front Google pour apps web structurées : composants, routing, DI, RxJS. Idéal pour les UIs métier longues à vivre.',
        },
        {
          nom: 'Flutter',
          detail:
            'SDK UI de Google pour apps mobiles (et plus) avec un seul codebase Dart. Rendu natif via son propre moteur, pas du web wrappé.',
        },
        {
          nom: 'HTML5',
          detail:
            'Langage de structure des pages web : sémantique, formulaires, média. La base de toute interface navigateur.',
        },
        {
          nom: 'CSS3',
          detail:
            'Feuilles de style du web : layout (flex/grid), responsive, animations. Donne le look et le rythme à l’UI.',
        },
        {
          nom: 'JavaScript',
          detail:
            'Langage du navigateur (et de Node). Gère l’interactivité, l’async et la logique côté client.',
        },
        {
          nom: 'TypeScript',
          detail:
            'JavaScript avec typage statique. Attrape les erreurs plus tôt et clarifie les contrats entre modules.',
        },
        {
          nom: 'Vue.js',
          detail:
            'Framework front progressif : réactivité simple, composants, écosystème léger. Bon pour monter une UI vite sans lourdeur.',
        },
      ],
    },
    {
      id: 's2',
      libelle: 'Back-end',
      niveau: 86,
      items: [
        {
          nom: '.NET / C#',
          detail:
            'Plateforme Microsoft et langage C# pour APIs, services et outils serveur. Performant, typé, très présent en entreprise.',
        },
        {
          nom: 'SQL Server',
          detail:
            'SGBD relationnel Microsoft : tables, requêtes T-SQL, transactions. Stocke et sert les données métier de façon fiable.',
        },
        {
          nom: 'Bases de données relationnelles',
          detail:
            'Modèle données en tables liées (clés, contraintes, jointures). Garantit cohérence et requêtes structurées.',
        },
      ],
    },
    {
      id: 's3',
      libelle: 'Outils & méthodes',
      niveau: 82,
      items: [
        {
          nom: 'Git',
          detail:
            'Système de versions décentralisé : branches, commits, historique. Standard pour collaborer sans écraser le code des autres.',
        },
        {
          nom: 'Azure DevOps',
          detail:
            'Suite Microsoft : repos Git, boards Agile, pipelines CI/CD. Centralise build, tests et déploiement.',
        },
        {
          nom: 'Agile / Scrum',
          detail:
            'Façon de livrer par itérations courtes (sprints), avec backlog et feedback fréquent plutôt qu’un big-bang final.',
        },
        {
          nom: 'Azure Portal',
          detail:
            'Console web Azure pour créer et gérer les ressources cloud (apps, bases, réseaux) sans passer uniquement par le CLI.',
        },
      ],
    },
  ] satisfies GroupeCompetence[],
  parcoursTitre: 'De Leroy & Partners à Startups.be, du code métier au terrain.',
  competencesTitre: 'Angular, .NET, Flutter — par domaine.',
  projetsTitre: 'Réalisations concrètes : TFE, refonte web, mobile terrain.',
  formationsTitre: 'Bachelier Ephec avec distinction, socle Becode.',
  cloture: 'Envie de parler Angular, .NET ou d’un prochain projet ? Écrivons-nous.',
  contactNote: 'Présentiel ou hybride · Bruxelles',
  heroChips: ['Angular', '.NET', 'Flutter', 'TypeScript'],
  heroTrail: ['Leroy & Partners', 'Startups.be', 'Ephec', 'Cité Culture'],
};
