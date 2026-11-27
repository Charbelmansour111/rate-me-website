type FaqItem = { q: string; a: string; privacyLink?: string };

export const en = {
  meta: {
    title: 'Rate Me: a home for football coaches',
    description:
      'Calendar, drills, squad and matches in one app for football coaches. Starting in Lebanon. Pre-register for early access.',
    ogAlt: 'Rate Me, a home for football coaches. Pre-register for early access.',
  },
  a11y: {
    skip: 'Skip to content',
    language: 'Language',
    mainNav: 'Main',
    footerNav: 'Footer',
    home: 'Rate Me, home',
    toLight: 'Use the light theme',
    toDark: 'Use the dark theme',
    newTab: '(opens in a new tab)',
    menu: 'Menu',
    closeMenu: 'Close the menu',
  },
  nav: {
    features: 'Features',
    inside: 'The app',
    community: 'Community',
    faq: 'FAQ',
    preRegister: 'Pre-register',
    languages: { en: 'EN', ar: 'عربي' },
  },
  hero: {
    title: ['A home for', 'football', 'coaches'],
    lead: 'Your calendar, drills, squad and matches in one app.',
    sub: "We're building a community of coaches in Lebanon first, then the Middle East.",
    join: 'Join the coaches community',
    scroll: 'Scroll',
    drill: {
      plays: ['Rondo', 'Wide overlap', 'Through ball', 'Switch of play', 'Press and win'],
      pause: 'Pause',
      alt: 'Illustration of short football plays on a half pitch: a rondo, a wide overlap, a through ball, a switch of play, and a press that wins the ball. One defender presses the ball while the others cover.',
    },
  },
  why: {
    kicker: 'Why Rate Me',
    title: 'Plan, build, organize',
    items: [
      {
        title: 'Plan the week',
        text: 'Trainings, matches and team days in one calendar, so everyone knows what comes next.',
        more: 'Add a training, a match or a team day with its time and place. Your players see it in their calendar, and after it you mark who came.',
      },
      {
        title: 'Build the drill',
        text: 'Draw it on a smart whiteboard, then play it back so players see the movement.',
        more: 'Place your players and the opponents, give each one a role and record the moves. Play it back at training, so the players see the drill before they run it.',
      },
      {
        title: 'Keep it organized',
        text: 'Your squad, lineups and match details stay together, not spread over chats and paper.',
        more: 'Kit numbers, positions and a card for each player, in one squad. The lineup and the match details sit with the match itself.',
      },
    ],
    more: 'More about this',
  },
  features: {
    kicker: 'Features',
    title: 'What you get',
    note: 'Rate Me has not launched yet. Features tagged “Coming soon” arrive after the first release.',
    soon: 'Coming soon',
    example: 'Example',
    report: 'Monthly report (PDF)',
    // Arabic only: the screenshots are of the app in English
    inEnglish: '',
    controls: {
      label: 'Feature cards',
      carousel: 'carousel',
      slide: 'slide',
      position: '{n} of {total}',
      previous: 'Previous features',
      next: 'Next features',
      show: 'Show {title}',
      more: 'More',
      close: 'Close',
      preRegister: 'Pre-register',
    },
    items: {
      calendar: {
        title: 'Calendar and events',
        photo: 'Yellow training cones in a line on the grass',
        text: 'Trainings, matches, trips and team days, with attendance for each one.',
        benefit: 'See every session in one calendar, and who came.',
        bullets: [
          'Add trainings, matches and special days, each in its own colour.',
          'Mark attendance from 30 minutes before the start, for the whole squad at once.',
          "A player who can't come gives a reason that only the staff see.",
        ],
      },
      whiteboard: {
        title: 'Drill whiteboard',
        photo: 'A tactics board with red and blue magnets, propped up in a dugout',
        text: 'Draw and animate drills. Smart defenders react to the ball, so you see how the drill plays out.',
        benefit: 'Draw a drill once, play it back at training.',
        bullets: [
          'Record the moves, then play them back.',
          'Smart defenders press, cover and keep their shape as the ball moves.',
          'Give each player a role for when you have the ball and one for when they have it.',
        ],
      },
      squad: {
        title: 'Squad and player cards',
        photo:
          'The player card in the app, as a shield: Sam Demo, 86 overall, attacking midfielder, number 10, with six stats from 74 to 90',
        detail:
          "The Squad screen in the app: two goalkeepers, four defenders and a midfielder, each with a card score and the coach's rating",
        text: 'Kit numbers, positions and a card for each player, shared only when the coach decides.',
        benefit: 'Every player in your squad gets a card.',
        bullets: [
          'Players ask for a kit number, and you accept or decline.',
          'You decide which cards players see, one by one or all at once.',
          "A card's overall is weighted by position. Goalkeepers have their own stats.",
        ],
      },
      parentReport: {
        title: 'Monthly player report',
        photo:
          'The top of a monthly report PDF: Sam Demo, number 10, attacking midfielder, under 16, November 2026, with attendance at 91% and three matches played',
        detail:
          "Two pages of the monthly report PDF for Sam Demo, November 2026: attendance, matches, goals and passes, positions, the coach's rating, the player card, the coach's comments and the next seven days",
        text: 'Each month the coach publishes a PDF report for each player: attendance, match stats, the coach’s rating and notes. Players can share it with their parents.',
        benefit: 'Each player gets a PDF of their month to share.',
        bullets: [
          'One A4 page shows attendance, match stats and your rating with its trend.',
          'The head coach publishes it, for one player or for all of them at once.',
          'The player opens it in the app and can share it with their parents.',
        ],
      },
      matchRequests: {
        title: 'Match requests',
        photo:
          'A match request in the app: their proposal for Saturday 5 December at 10:00, away on the main pitch at Demo Park, with Accept, Counter and Decline',
        detail:
          'The Coaches Channel in the app: messages from two coaches, then a friendly request for Saturday 28 to Sunday 29 November at 10:00, any age, home or away, with Cancel request',
        text: 'Find a friendly by sending a request to other clubs, and answer the ones you receive.',
        benefit: 'Find a friendly with another club.',
        bullets: [
          'Send a request to a team, or post an open one for any club.',
          'Suggest another date or place, then accept or decline.',
          "An accepted friendly goes on both teams' calendars.",
        ],
      },
      tournaments: {
        title: 'Tournaments',
        photo: 'The corner of a goal net against a blue sky',
        text: 'Create a tournament, take registrations and follow the fixtures.',
        benefit: 'Run a tournament from sign-up to the final.',
        bullets: [
          'Choose groups, a league, a knockout, or groups then a knockout.',
          'Take registrations and accept or refuse each team.',
          'The table shows who qualifies.',
        ],
      },
      assistant: {
        title: 'Coach assistant',
        text: 'Ask about your week or get a starting point for a drill. You stay in charge of every change.',
        photo: 'Black and white portrait of a young man in a light shirt, smiling slightly',
        benefit: 'Ask about your week in plain words.',
        bullets: [
          'See what is coming up and which trainings still have no drills.',
          'Create, move or cancel an event, only after you confirm.',
          'For anything else, it shows you the screen to use.',
        ],
      },
    },
  },
  showcase: {
    kicker: 'Screens',
    title: 'Inside the app',
    views: { coach: 'Coach view', player: 'Player view' },
    controls: {
      views: 'Choose a view',
      carousel: 'carousel',
      slides: 'Screens, scroll sideways',
      previous: 'Previous screen',
      next: 'Next screen',
      open: 'See what this screen does',
      close: 'Close',
      preRegister: 'Pre-register',
    },
    // Three facts per screen, shown when a phone is opened. Only what the app does today.
    details: {
      coach: {
        calendar: [
          'Trainings, matches and team days, month by month.',
          'Each event has its day, time and place.',
          'Mark who came. Attendance goes into each player’s monthly report.',
        ],
        'whiteboard-roles': [
          'Give each player a role: Smart, Press, Cover, Mark or Intercept.',
          'Play the drill and the defenders move with the ball.',
          'Leave a player on Smart and the app picks the move.',
        ],
        match: [
          'A request shows the other team, its age group and its level.',
          'Their proposal: the day, the time, the place and a note.',
          'Accept, counter with another time or place, or decline.',
        ],
      },
      player: {
        home: [
          'The next training or match, with its day, time and place.',
          'Notes from your coach.',
          'Shortcuts to the calendar, your team and your card.',
        ],
        event: [
          'When and where, and whether it has finished.',
          'Tell your coach how it went with one tap.',
          'Your coach’s notes and your evaluation.',
        ],
      },
    },
    // The player card as the app draws it, with a stock photo: an example, not a real player.
    playerCard: {
      example: 'Example',
      name: 'Your player',
      position: 'Midfielder',
      positionCode: 'MID',
      tier: 'Regular',
      label: 'Example player card: a midfielder, number 8, rated 72 out of 100.',
      stats: {
        pace: 'Speed',
        shooting: 'Finishing',
        passing: 'Vision',
        dribbling: 'Ball control',
        defending: 'Tackling',
        physical: 'Strength',
      },
    },
    captions: {
      coach: {
        home: { title: 'Home', text: 'What comes next for your team.' },
        calendar: {
          title: 'Calendar',
          text: 'Trainings, matches and team days.',
          alt: 'The calendar in the app for November 2026: trainings and matches marked on their days, and under it Saturday 28 November, a match against Demo FC at 11:00',
        },
        whiteboard: { title: 'Whiteboard', text: 'Draw a drill and play it back.' },
        'whiteboard-roles': {
          title: 'Roles',
          text: 'Give each player a role, or leave it automatic.',
          alt: 'Roles on the whiteboard for player 6. When they have the ball: Press (chosen), Cover, Mark, Zone, Intercept or Hold. When we have the ball: Smart, Support, Run, Hold, Passer or Finisher.',
        },
        formation: { title: 'Formation', text: 'Your lineup on the pitch.' },
        squad: { title: 'Squad', text: 'Your players and their cards.' },
        card: { title: 'Player card', text: 'Shared only when you decide.' },
        match: {
          title: 'Match requests',
          text: 'Accept, counter or decline a match.',
          alt: 'A match request received in the app: Demo FC, under 16, competitive, proposes Saturday 5 December at 10:00, away, on the main pitch at Demo Park, with Accept, Counter and Decline',
        },
      },
      player: {
        home: { title: 'Home', text: 'The next training or match.' },
        event: { title: 'Event', text: 'When, where and what to know.' },
        card: {
          title: 'Player card',
          text: 'Shown when your coach publishes it. Ask for a shirt number and your coach approves it.',
        },
      },
    },
  },
  tactics: {
    kicker: 'Whiteboard',
    title: 'Tactics that move',
    illustration: 'Illustration',
    pause: 'Pause',
    description:
      'Illustration: on a half pitch, four attackers pass the ball along curved lines from one side to the other. Each player with a role carries its letter. Of the three defenders, one presses the player on the ball (P), one covers behind him (C) and one marks an attacker (M). Two attackers run (R): one round the outside and one behind the defence.',
    families: {
      attack: 'When we have the ball',
      defence: 'When they have the ball',
    },
    roles: {
      smart: 'Smart',
      support: 'Support',
      run: 'Run',
      hold: 'Hold',
      passer: 'Passer',
      finisher: 'Finisher',
      press: 'Press',
      cover: 'Cover',
      mark: 'Mark',
      zone: 'Zone',
      intercept: 'Intercept',
    },
    // Buttons under the board: each shows what the defenders do with that role
    try: {
      label: 'Try a role for the defenders',
      chips: {
        smart: 'Smart',
        press: 'Press',
        cover: 'Cover',
        mark: 'Mark',
        zone: 'Zone',
        intercept: 'Intercept',
      },
      captions: {
        smart: 'Smart: the app moves each defender with the ball.',
        press: 'Press: the nearest defenders step up to the player on the ball.',
        cover: 'Cover: the defenders drop into a tight block in front of goal.',
        mark: 'Mark: each defender stays with one attacker.',
        zone: 'Zone: each defender guards an area and steps in when the ball comes into it.',
        intercept: 'Intercept: a defender steps into the passing lane and cuts it.',
      },
    },
    steps: [
      {
        title: 'Set the starting positions',
        text: 'Put your players and the opponents where the drill begins.',
      },
      {
        title: 'Give each player a role',
        text: 'One for when we have the ball and one for when they have it, from the roles below. Smart reads the play on its own.',
      },
      {
        title: 'Hit record and watch it play',
        text: 'Pass the ball and see the defenders shift with it.',
      },
    ],
  },
  community: {
    cta: {
      title: 'Help shape the app.',
      text: 'Founding members get early access.',
    },
    kicker: 'Community',
    title: 'Built for coaches in Lebanon',
    text: 'We want coaches and academies to shape the app with us. Pre-register to become a founding member. You get early access and tell us what to fix, add or drop.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Pre-register', text: 'Leave your name and email. It takes about a minute.' },
      { title: 'Get early access', text: 'We email you when there is a version for you to try.' },
      { title: 'Share feedback', text: 'Use it with your team and tell us what you need.' },
    ],
    coaches: 'Photos for illustration',
    match: {
      label: 'A match request in the app',
      example: 'Example',
      team: 'Pinewood Academy',
      meta: 'Beirut · U16 · Competitive',
      status: 'Your answer',
      counters: '2 counters left',
      caption: 'Their proposal',
      when: 'Sat 6 Dec · 10:00',
      where: 'Home · Main pitch',
      accept: 'Accept',
      counter: 'Counter',
      decline: 'Decline',
      safety: 'Contact is between coaches only. No player details are shared.',
      description:
        'Example of a match request in the app: Pinewood Academy, U16, proposes Saturday 6 December at 10:00, at home. You can accept, counter or decline.',
    },
    players:
      'Three players in red walking across a pitch towards a ball, seen from behind, in black and white',
  },
  faq: {
    kicker: 'FAQ',
    title: 'Questions',
    items: [
      {
        q: 'Who is Rate Me for?',
        a: 'Football coaches, assistant coaches and academies. Players join through their coach’s team, to see their calendar and what their coach shares with them.',
      },
      {
        q: 'Is it free for players?',
        a: 'Yes, players do not pay. They join through their coach’s team, so there is nothing for them to sign up for here.',
      },
      {
        q: 'Do parents see their child’s progress?',
        a: 'Yes, through a monthly report. The coach publishes a PDF for each player with attendance, match stats, the coach’s rating and notes, and the player can share it with their parents. Parents do not have their own accounts.',
      },
      {
        q: 'When does it launch?',
        a: 'There is no public date yet. Lebanon comes first. Pre-register and we will email you when early access opens.',
      },
      {
        q: 'Can I give players roles in a drill?',
        a: 'Yes. The coach gives each player a role for when we have the ball, such as support, run or finisher, and one for when they have it, such as press, cover or zone. A player on Smart reads the play on its own.',
      },
      {
        q: 'Which devices does it run on?',
        a: 'We are building it for iPhone and Android phones.',
      },
      {
        q: 'How is my data used?',
        a: 'To tell you about the launch and the coaches community, nothing else. We do not sell it. You can unsubscribe or ask us to delete it at any time.',
        privacyLink: 'Read the privacy policy',
      },
      {
        q: 'How do I join the community?',
        a: 'Pre-register below. After you sign up you get the community link here, or by email once the community opens.',
      },
    ] as FaqItem[],
  },
  form: {
    kicker: 'Early access',
    title: 'Pre-register',
    step: 'Step {n} of 2:',
    step1: 'about you',
    step2: 'your team',
    next: 'Next',
    back: 'Back',
    dialCode: 'Country code',
    citySuggestions: 'City suggestions',
    intro: 'Be one of the first coaches on Rate Me. Fields marked optional can stay empty.',
    optional: 'optional',
    name: 'Name',
    email: 'Email',
    phone: 'WhatsApp number',
    phoneHint: 'Lebanese numbers: 03 123 456. Country not listed? Type the number with its + code.',
    role: 'Your role',
    roles: {
      coach: 'Coach',
      academy_owner: 'Academy owner',
      assistant_coach: 'Assistant coach',
      other: 'Other',
    },
    city: 'City',
    cities: [
      'Beirut',
      'Tripoli',
      'Sidon',
      'Tyre',
      'Jounieh',
      'Byblos',
      'Zahle',
      'Baalbek',
      'Nabatieh',
      'Batroun',
      'Aley',
      'Baabda',
      'Antelias',
      'Halba',
      'Zgharta',
      'Bint Jbeil',
      'Marjayoun',
      'Chtaura',
    ],
    club: 'Club or academy',
    consentBefore:
      'I am 18 or older and I agree to be contacted about the launch and the community, as described in the ',
    consentLink: 'privacy policy',
    consentAfter: '.',
    submit: 'Pre-register',
    submitting: 'Sending…',
    errors: {
      nameInvalid: 'Enter your name (at least 2 letters).',
      emailInvalid: 'Enter a valid email, like coach@club.com.',
      emailJunk: 'Use an email you check regularly. Temporary addresses do not work here.',
      phoneInvalid: 'Check the number. For example: 03 123 456 or +961 3 123 456.',
      roleRequired: 'Choose your role.',
      cityRequired: 'Enter your city.',
      textInvalid: 'Shorten this, and leave out links and the < > signs.',
      consentRequired: 'Tick this box so we can contact you.',
    },
    formErrors: {
      invalid: 'Some fields need another look.',
      rate_limited: 'That was a lot of tries. Wait a few minutes, then send it again.',
      challenge_failed: 'We could not confirm you are human. Complete the check and send it again.',
      unavailable: 'We could not save your details. Nothing was lost, please send it again.',
      network: 'No connection. Check your internet and send it again.',
    },
    success: {
      title: "You're on the list",
      text: 'Thank you. We will email you when early access opens.',
      join: 'Join the community',
      share: 'Share Rate Me',
      shareText: 'Rate Me: a home for football coaches. Pre-register here:',
      copied: 'Link copied',
      copyFailed: 'Copy this link:',
    },
  },
  footer: {
    tagline: 'A home for football coaches.',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    rights: 'All rights reserved.',
    cookieSettings: 'Cookie settings',
  },
  // Who runs Rate Me (values in src/config/site.ts: business)
  contactBlock: {
    title: 'Contact',
    business: 'Business',
    email: 'Email',
    place: 'City and country',
    phone: 'Phone',
  },
  cookies: {
    label: 'Cookie choice',
    text: 'May we count visits to this site? Without cookies, in total only, and only if you accept.',
    accept: 'Accept',
    reject: 'Reject',
  },
  notFound: {
    title: 'Offside',
    text: 'This page does not exist, or it moved.',
    back: 'Back to the home page',
  },
  legal: {
    draft: 'Draft for legal review',
    draftText: 'This text is a draft. It has not been checked by a lawyer yet and may change.',
    updated: 'Last updated',
    contents: 'On this page',
    noEmail: 'a contact email will be published here before launch',
    dataRequest: 'Data request',
    writeRequest: 'Write a data request',
  },
};

export type Dictionary = typeof en;
