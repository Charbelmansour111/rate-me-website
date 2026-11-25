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
      replay: 'Replay the drill',
      alt: 'A drill drawn on a half pitch: four attackers pass the ball from the left to the right side while three defenders shift across with it, and the last attacker shoots.',
      caption: 'Defenders shift with the ball',
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
    screens: {
      title: 'Inside the app',
      soon: 'Screenshot on the way',
      calendar: 'The calendar',
      whiteboard: 'The drill whiteboard',
      squad: 'The squad',
    },
  },
  tactics: {
    kicker: 'Whiteboard',
    title: 'Tactics that move',
    illustration: 'Illustration',
    pause: 'Pause',
    description:
      'Illustration: on a half pitch, four attackers pass the ball along curved lines from one side to the other. Of three defenders, one presses the player on the ball, one covers the passing lane and one closes the space behind them.',
    roles: ['Press', 'Cover', 'Second cover'],
    steps: [
      {
        title: 'Set the starting positions',
        text: 'Put your players and the opponents where the drill begins.',
      },
      {
        title: 'Give defenders roles',
        text: 'One presses, one covers, one stays behind as second cover.',
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
  },
  faq: {
    kicker: 'FAQ',
    title: 'Questions',
    items: [
      {
        q: 'Who is Rate Me for?',
        a: 'Football coaches, assistant coaches and academies. Players use it too, to see their calendar and what their coach shares with them.',
      },
      { q: 'Is it free for players?', a: 'Yes. Players are always free.' },
      {
        q: 'When does it launch?',
        a: 'There is no public date yet. Lebanon comes first. Pre-register and we will email you when early access opens.',
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
    intro: 'Be one of the first coaches on Rate Me. Fields marked optional can stay empty.',
    optional: 'optional',
    name: 'Name',
    email: 'Email',
    phone: 'WhatsApp number',
    phoneHint:
      'Lebanese numbers work without +961. For other countries, start with + and the code.',
    role: 'Your role',
    rolePlaceholder: 'Choose your role',
    roles: {
      coach: 'Coach',
      academy_owner: 'Academy owner',
      assistant_coach: 'Assistant coach',
      player: 'Player',
      parent: 'Parent',
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
      consentRequired: 'Tick the box so we can contact you.',
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
