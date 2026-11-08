// Tous les textes de l'interface, au même endroit (migration vers next-intl facile plus tard).

export const fr = {
  nav: {
    label: "Navigation principale",
    footerLabel: "Liens du bas de page",
    home: "Accueil",
    rooms: "Mes salons",
    rules: "Comment jouer",
    create: "Créer un salon",
    menu: "Menu",
    backToRooms: "← Mes salons",
    footerNote: "Un jeu pour s'amuser entre amis.",
  },
  rooms: {
    title: "Mes salons",
    empty: "Tu n'as aucun salon pour l'instant.",
    emptyHint: "Crée un salon, ou rejoins celui d'un ami avec son lien ou son code.",
    players: "joueurs",
    expires: "Expire le",
    browserNote:
      "Tes salons sont liés à ce navigateur : si tu effaces ses données ou changes d'appareil, tu n'y auras plus accès.",
  },
  notFound: { title: "Page introuvable", hint: "Cette page n'existe pas ou a été déplacée." },
  rules: {
    title: "Comment jouer",
    sections: [
      {
        title: "Le principe",
        body: [
          "Chacun écrit un secret, sans nom. Ensuite, tout le monde devine qui a écrit quoi. Les bonnes réponses rapportent des points.",
        ],
      },
      {
        title: "Une manche, étape par étape",
        body: [
          "1. Écriture : chacun écrit un secret (280 caractères maximum) et peut le modifier tant que la phase est ouverte.",
          "2. Devinettes : les secrets apparaissent sans nom. Pour chacun, tu choisis l'auteur. Un seul choix par secret, sans retour en arrière.",
          "3. Révélation : les auteurs sont dévoilés et les points comptés.",
          "L'hôte peut clore une phase plus tôt. Avec peu de joueurs, l'anonymat est évidemment plus facile à percer.",
        ],
      },
      {
        title: "Les points",
        body: [
          "+10 points pour chaque bonne devinette.",
          "+5 points pour l'auteur d'un secret « fantôme » : au moins 3 joueurs ont deviné, et moins d'un sur cinq a trouvé le bon auteur.",
        ],
      },
      {
        title: "Anonymat et respect",
        body: [
          "Personne ne voit qui a écrit quoi avant la révélation. L'hôte voit les textes, jamais les auteurs, pour pouvoir modérer.",
          "Pas d'attaques, pas d'insultes, pas d'informations sur des personnes extérieures au salon.",
          "Un secret signalé par 3 joueurs est masqué automatiquement. L'hôte peut aussi le masquer ou retirer un joueur.",
        ],
      },
      {
        title: "Tes données",
        body: [
          "Pas de compte : ton profil est lié à ce navigateur.",
          "Un salon est supprimé automatiquement 30 jours après sa dernière manche.",
        ],
      },
    ],
  },
  home: {
    pitch:
      "Chacun écrit un secret, en anonyme. Ensuite, tout le monde devine qui a écrit quoi. Qui connaît vraiment ses potes ?",
    create: "Créer un salon",
    haveCode: "J'ai un code",
    codePlaceholder: "CODE",
    join: "Rejoindre",
    codeInvalid: "Le code contient 6 caractères.",
    steps: [
      "Crée un salon et partage le lien sur WhatsApp.",
      "Chacun écrit un secret, sans nom.",
      "On devine qui a écrit quoi, puis c'est la révélation !",
    ],
  },
  create: {
    title: "Nouveau salon",
    roomName: "Nom du salon",
    roomNamePh: "Les gars de Douala",
    nickname: "Ton pseudo",
    nicknamePh: "Ex. Cedric",
    emoji: "Ton emoji",
    submit: "Créer le salon",
    verifying: "Vérification anti-robot, un instant…",
  },
  join: {
    loading: "Chargement…",
    captcha: "Vérification anti-robot, un instant…",
    invited: "Tu es invité(e) dans le salon",
    players: "joueurs",
    submit: "Rejoindre le salon",
    notFound: "Salon introuvable ou expiré.",
    notFoundHint: "Vérifie le code ou demande un nouveau lien.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
    invalidCode: "Ce lien ne contient pas un code valide.",
  },
  room: {
    code: "Code",
    players: "Joueurs",
    host: "Hôte",
    you: "toi",
    invite: "Inviter sur WhatsApp",
    copy: "Copier le lien",
    copied: "Lien copié !",
    inviteText: (name: string, url: string) =>
      `Viens jouer à C'est Qui ? dans mon salon « ${name} » : ${url}`,
    waiting: "En attente que l'hôte lance la manche…",
    needPlayers: "Il faut au moins 2 joueurs pour lancer une manche.",
    smallGroup:
      "À moins de 2 joueurs, l'anonymat est facile à percer. Amusez-vous quand même !",
    spectator:
      "Tu es spectateur pour cette manche : tu joueras à la prochaine.",
  },
  start: {
    title: "Lancer une manche",
    next: "Lancer la prochaine manche",
    theme: "Thème",
    themePh: "Ex. Confessions de promo",
    suggestions: [
      "Confessions de promo",
      "Le plus susceptible de…",
      "Un truc jamais avoué",
      "Mon pire moment de honte",
    ],
    speed: "Rythme (écriture + devinettes)",
    presets: {
      quick: "Rapide : 10 min + 10 min",
      hour: "1 h + 1 h",
      day: "24 h + 24 h",
    },
    submit: "Lancer la manche",
  },
  writing: {
    title: "Écris ton secret",
    subtitle: "Anonyme : personne ne saura que c'est toi avant la révélation.",
    placeholder: "J'ai déjà…",
    save: "Enregistrer mon secret",
    update: "Modifier mon secret",
    saved: "Secret enregistré ✓",
    progress: (n: number, t: number) => `${n}/${t} ont écrit`,
    endsIn: "Fin de l'écriture dans",
    hostClose: "Clore l'écriture maintenant",
    confirmClose: "Clore la phase maintenant pour tout le monde ?",
  },
  guessing: {
    title: "Qui a écrit ça ?",
    subtitle:
      "Choisis l'auteur de chaque secret. Un seul choix par secret, pas de retour en arrière.",
    yours: "C'est ton secret 🤫",
    picked: "Choix enregistré",
    progress: (n: number, t: number) => `${n}/${t} devinés`,
    endsIn: "Fin des devinettes dans",
    closedTitle: "Devinettes terminées",
    revealIn: "Révélation dans",
    report: "Signaler",
    reported: "Signalé ✓",
    hide: "Masquer",
    reportReason: "Contenu inapproprié",
    hostClose: "Passer à la révélation maintenant",
    noSecrets: "Aucun secret à deviner pour le moment.",
  },
  results: {
    title: "La révélation !",
    wrote: "Écrit par",
    guessedRight: "Ont deviné juste",
    nobody: "Personne !",
    ghost: "Fantôme 👻",
    roundScores: "Points de la manche",
    leaderboard: "Classement général",
    pts: "pts",
    cancelled: "Manche annulée : il fallait au moins 2 secrets.",
    waitNext: "En attente de la prochaine manche…",
  },
  errors: {
    unexpected: "Quelque chose s'est mal passé. Réessaie dans un instant.",
    auth_failed: "La connexion a échoué. Recharge la page et réessaie.",
    captcha_missing:
      "La vérification anti-robot n'est pas terminée. Patiente un instant.",
    not_authenticated: "Tu n'es pas connecté(e). Recharge la page.",
    invalid_room_name: "Le nom du salon doit faire entre 2 et 40 caractères.",
    invalid_nickname: "Le pseudo doit faire entre 2 et 20 caractères.",
    invalid_emoji: "Choisis un emoji.",
    too_many_rooms: "Tu as déjà 5 salons actifs.",
    code_generation_failed: "Impossible de créer le code. Réessaie.",
    room_not_found: "Salon introuvable ou expiré.",
    removed_from_room: "Tu as été retiré(e) de ce salon.",
    room_full: "Ce salon est complet.",
    nickname_taken: "Ce pseudo est déjà pris dans ce salon.",
    not_host: "Seul l'hôte peut faire ça.",
    invalid_theme: "Le thème doit faire entre 2 et 80 caractères.",
    round_in_progress: "Une manche est déjà en cours.",
    invalid_schedule:
      "Horaires invalides : vérifie que l'heure de ton appareil est correcte.",
    not_enough_players: "Il faut au moins 2 joueurs.",
    round_not_found: "Manche introuvable.",
    not_a_member: "Tu ne fais pas partie de ce salon.",
    spectator_cannot_play: "Les spectateurs jouent à la prochaine manche.",
    writing_closed: "L'écriture est terminée.",
    invalid_secret: "Le secret doit faire entre 3 et 280 caractères.",
    secret_not_found: "Secret introuvable.",
    guessing_closed: "Les devinettes sont terminées.",
    secret_hidden: "Ce secret a été masqué.",
    own_secret: "Tu ne peux pas deviner ton propre secret.",
    invalid_guess_target: "Ce joueur n'est pas un choix valide.",
    already_guessed: "Tu as déjà fait ton choix pour ce secret.",
    secret_not_visible: "Ce secret n'est pas encore visible.",
    invalid_reason: "Raison invalide.",
    cannot_remove_host: "On ne peut pas retirer l'hôte.",
  },
} as const;

export type ErrorCode = keyof typeof fr.errors;

export function errorText(code: string): string {
  return fr.errors[code as ErrorCode] ?? fr.errors.unexpected;
}
