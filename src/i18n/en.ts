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
  },
  nav: {
    features: 'Features',
    community: 'Community',
    faq: 'FAQ',
    preRegister: 'Pre-register',
    languages: { en: 'EN', ar: 'عربي' },
  },
  hero: {
    title: ['A home for', 'football', 'coaches'],
    lead: 'Your calendar, drills, squad and matches in one app.',
    sub: "We're building a community of coaches in Lebanon first, then the Middle East and beyond.",
    join: 'Join the coaches community',
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
      },
      {
        title: 'Build the drill',
        text: 'Draw it on a smart whiteboard, then play it back so players see the movement.',
      },
      {
        title: 'Keep it organized',
        text: 'Your squad, lineups and match details stay together, not spread over chats and paper.',
      },
    ],
  },
  features: {
    kicker: 'Features',
    title: 'What you get',
    note: 'Rate Me has not launched yet. Features tagged “Coming soon” arrive after the first release.',
    soon: 'Coming soon',
    items: {
      calendar: {
        title: 'Calendar and events',
        text: 'Trainings, matches, trips and team days, with attendance for each one.',
      },
      whiteboard: {
        title: 'Drill whiteboard',
        text: 'Draw and animate drills. Smart defenders react to the ball, so you see how it could unfold.',
      },
      squad: {
        title: 'Squad and player cards',
        text: 'Kit numbers, positions and a card for each player, shared only when the coach decides.',
      },
      parentReport: {
        title: 'Monthly report for parents',
        text: 'At the end of each month, parents of youth players receive a PDF of their child’s progress: attendance, the coach’s ratings and the coach’s notes.',
      },
      matchRequests: {
        title: 'Match requests',
        text: 'Find a friendly by sending a request to other clubs, and answer the ones you receive.',
      },
      tournaments: {
        title: 'Tournaments',
        text: 'Create a tournament, take registrations and follow the fixtures.',
      },
      assistant: {
        title: 'Coach assistant',
        text: 'Ask about your week or get a starting point for a drill. You stay in charge of every change.',
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
          'Mark who came. Attendance goes into the parents’ monthly report.',
        ],
        'whiteboard-roles': [
          'Give each player a role: Smart, Press, Cover, Mark or Intercept.',
          'Play the drill and the defenders move with the ball.',
          'Leave a player on Smart and the app picks the move.',
        ],
        channel: [
          'One channel for the coaches of every club on Rate Me.',
          'Each message shows the coach’s club and team.',
          'Match requests between coaches are coming soon.',
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
      positionLetter: 'M',
      tier: 'Regular',
      outOf: '/100',
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
        calendar: { title: 'Calendar', text: 'Trainings, matches and team days.' },
        whiteboard: { title: 'Whiteboard', text: 'Draw a drill and play it back.' },
        'whiteboard-roles': {
          title: 'Roles',
          text: 'Give each player a role, or leave it automatic.',
          alt: 'Roles on the whiteboard: a defender is set to Press, next to Smart, Cover, Mark and Intercept. Defenders carry the badges P, C, M and I, attackers O and R.',
        },
        formation: { title: 'Formation', text: 'Your lineup on the pitch.' },
        squad: { title: 'Squad', text: 'Your players and their cards.' },
        card: { title: 'Player card', text: 'Shared only when you decide.' },
        channel: { title: 'Coaches Channel', text: 'Meet the coaches of other clubs.' },
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
      'Illustration: on a half pitch, four attackers pass the ball along curved lines from one side to the other. Each player with a role carries its first letter. Of the three defenders, one presses the player on the ball (P), one covers behind (C) and one marks an attacker (M). One attacker overlaps on the outside (O) and one runs behind the defence (R).',
    rolesLabel: 'Some of the roles',
    roles: {
      press: 'Press',
      cover: 'Cover',
      mark: 'Mark a player',
      overlap: 'Overlap',
      run_behind: 'Run behind',
      intercept: 'Intercept lanes',
    },
    steps: [
      {
        title: 'Set the starting positions',
        text: 'Put your players and the opponents where the drill begins.',
      },
      {
        title: 'Give each player a role',
        text: 'One for when we have the ball and one for when they have it: hold, press, cover, mark, overlap, run behind... Or leave it automatic.',
      },
      {
        title: 'Hit record and watch it play',
        text: 'Pass the ball and see the defenders shift with it.',
      },
    ],
  },
  community: {
    kicker: 'Community',
    title: 'Built with coaches in Lebanon',
    text: 'We want coaches and academies to shape the app with us. Pre-register to become a founding member: you get early access, and you tell us what to fix, add or drop.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Pre-register', text: 'Leave your name and email. It takes about a minute.' },
      { title: 'Get early access', text: 'We email you when there is a version for you to try.' },
      { title: 'Share feedback', text: 'Use it with your team and tell us what you need.' },
    ],
    coaches: 'Made for coaches like you',
    match: {
      label: 'Match request',
      example: 'An example of what is coming',
      from: 'Cedars FC',
      to: 'Pinewood Academy',
      versus: 'vs',
      team: 'U16',
      when: 'Saturday, 10:00',
      format: '7v7 friendly',
      where: 'Home or away',
      status: 'Request sent',
    },
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
        a: 'Yes. Players are always free. They join through their coach’s team, so there is nothing for them to sign up for here.',
      },
      {
        q: 'Do parents see their child’s progress?',
        a: 'Yes, in a monthly report. At the end of each month, parents of youth players receive a PDF with their child’s attendance, the coach’s ratings and the coach’s notes.',
      },
      {
        q: 'When does it launch?',
        a: 'There is no public date yet. Lebanon comes first. Pre-register and we will email you when early access opens.',
      },
      {
        q: 'Can I give players roles in a drill?',
        a: 'Yes. The coach gives each player a role for when we have the ball and one for when they have it (hold, press, cover, mark, overlap, run behind...), or leaves it automatic.',
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
  },
};

export type Dictionary = typeof en;
