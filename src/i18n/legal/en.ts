import type { LegalTexts } from './types';

export const legalEn: LegalTexts = {
  privacy: {
    title: 'Privacy policy',
    description: 'What Rate Me collects on this website and in the app, why, and how to delete it.',
    intro:
      'This policy covers the Rate Me website (getrateme.space) and the Rate Me mobile app. It says what we collect, why, where it is kept and how you can have it deleted.',
    sections: [
      {
        id: 'who',
        title: 'Who we are',
        text: [
          'Rate Me is an app for football coaches, starting in Lebanon. “We” means the Rate Me team, responsible for the data described here. [Legal entity name and address to be added.] Contact: {email}.',
        ],
      },
      {
        id: 'website-data',
        title: 'Website: what we collect',
        text: ['When you pre-register we collect what you type in the form:'],
        points: [
          'Your name and email address.',
          'Your role and city.',
          'Your WhatsApp number and your club or academy, only if you give them.',
          'The language you used, the time you gave consent, and that you signed up on this website.',
        ],
      },
      {
        id: 'website-why',
        title: 'Website: why we use it',
        text: [
          'To notify you about the launch and early access, and to invite you to the coaches community. We rely on the consent you give in the form. We do not use it for anything else, and we do not sell it.',
          'Every email we send has an unsubscribe link.',
        ],
      },
      {
        id: 'website-where',
        title: 'Website: where it is stored',
        text: [
          'Sign-ups are stored by our email-list provider (Brevo or MailerLite), which also sends our emails. This website has no database of its own. It is hosted by Vercel, which processes technical data such as IP addresses to deliver and protect the site. These companies may process data outside your country.',
          'To stop abuse of the form we keep a scrambled (hashed) form of your IP address in memory for a short time. The raw address is not stored by us. If the Cloudflare Turnstile check is turned on, Cloudflare processes technical data to tell people from bots.',
        ],
      },
      {
        id: 'website-retention',
        title: 'Website: how long we keep it',
        text: [
          'Until {retentionMonths} months after the app launches, or until you unsubscribe or ask us to delete it, whichever comes first. We review the list at least once a year and delete details we no longer need. After you unsubscribe, the provider may keep your email address on a block list so that we do not email you again.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies and analytics',
        text: [
          'The website sets no cookies. It keeps only what it needs in your browser: the theme, if you choose one; the pictures of the walk on the home page and a note that they are there, so the page loads fast and they are not downloaded again; and your cookie choice. None of it leaves your device or identifies you, and clearing your browser’s site data removes it.',
          'If we turn on visitor statistics, we use a privacy-friendly tool without cookies that counts visits in total and does not follow you across sites. They are the only optional part, and they stay off until you choose Accept in the banner. Essential only and Accept are the same size. Your choice is kept in your browser, and Cookie settings at the bottom of every page changes it.',
        ],
      },
      {
        id: 'app-data',
        title: 'App: what we collect',
        points: [
          'Account: name, email, password (stored protected, nobody can read it), photo if you add one and, for players, date of birth.',
          'Team: role, club, kit number, positions, attendance, calendar, drills, lineups and match results.',
          'Player development: ratings, player cards and feedback written by coaches.',
          'Availability and medical notes, when a club records them. They are visible only to medical staff and the head coach.',
          'Messages, photos and PDF files that coaches share in the Coaches Channel, and reports about them.',
          'Questions and drill descriptions coaches send to the assistant, and emails you send to support.',
        ],
      },
      {
        id: 'app-why',
        title: 'App: why we use it and who sees it',
        text: [
          'We use app data to run the app: to show a team its calendar, let coaches plan and follow their players, and keep the community safe. The app shows no ads and does not track you across other apps or websites.',
          'Access follows team and role. A player’s date of birth is not shown to teammates. A player sees their card only when a coach publishes it, and teammates do not see each other’s cards. Staff see data for their own team only, except what coaches choose to share with other clubs.',
        ],
      },
      {
        id: 'app-providers',
        title: 'App: service providers',
        text: [
          'App data is kept by our hosting and database provider. Assistant features send the coach’s question, and the least team data needed to answer it (such as event titles, attendance counts, a player’s name and position), to an AI provider. Photos, ratings, medical notes, fees and birth dates are not sent. Answers can be wrong, so coaches review them before use.',
        ],
      },
      {
        id: 'app-retention',
        title: 'App: how long we keep it',
        points: [
          'Account data: until the account is deleted.',
          'Deleted channel messages: removed for good after 30 days.',
          'Closed reports, with the reported message: 90 days.',
          'Assistant questions: 90 days, or earlier if you clear them.',
        ],
      },
      {
        id: 'minors',
        title: 'Children and parental consent',
        text: [
          'This website and its form are for adults (18 or older). Please do not send us a child’s details here. If you think someone did, write to {email} and we will delete them.',
          'In the app, players under 18 may use Rate Me only with the consent of a parent or legal guardian and through their club. Coaches and staff must be 18 or older. Clubs must get that consent before adding a minor. Minors have no access to the Coaches Channel. A parent or guardian can ask to see, correct or delete their child’s data, or withdraw consent, at {email}.',
          'If their club uses monthly reports, the coach publishes a PDF for each player at the end of each month with that player’s attendance, the coaches’ ratings and the coach’s notes. The player sees it in the app and can share it with their parent or guardian. Parents and guardians do not have accounts, and Rate Me does not send the report to them.',
        ],
      },
      {
        id: 'your-data',
        title: 'Your data',
        text: [
          'You can ask to see the data we hold about you, to correct it or to delete it. Write to {email} with the subject “Data request”, from the address you signed up with if you can. We answer within 30 days.',
        ],
      },
      {
        id: 'rights',
        title: 'Unsubscribe, delete and your other rights',
        points: [
          'Emails: use the unsubscribe link in any email, or write to {email}.',
          'Website data: write to {email} from the address you signed up with and ask for deletion. We answer within 30 days.',
          'App account: Profile, then Delete account, or write to {email} if you cannot open the app.',
          'You can also ask for a copy of your data, a correction, or to withdraw your consent. Depending on where you live you may complain to your data protection authority.',
        ],
      },
      {
        id: 'security',
        title: 'Security and sharing',
        text: [
          'Data travels encrypted and access is limited to the people who need it. No system is perfect; if something serious happens to your data we will tell you as the law requires. We share data only with the service providers above, or when the law requires it. We never sell it.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes and contact',
        text: [
          'If we change this policy we update this page and the date above, and we tell you about important changes. Questions: {email}.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    description: 'The rules for using the Rate Me website and app, including community rules.',
    intro:
      'These terms cover the Rate Me website (getrateme.space) and the Rate Me mobile app. By using them you agree to these terms. If you do not agree, please do not use them.',
    sections: [
      {
        id: 'website',
        title: 'The website',
        text: [
          'The website describes an app that has not launched yet. Features, dates and availability may change. Pre-registering is free, does not create an account and does not guarantee a place in early access. Please give correct details, and only your own.',
        ],
      },
      {
        id: 'accounts',
        title: 'App accounts',
        text: [
          'Keep your login to yourself and your details correct. You are responsible for what happens in your account. Coaches and staff must be 18 or older and allowed to act for their club.',
          'Players can always use the app for free. If we offer paid plans to coaches or clubs, the price and terms are shown before anyone pays.',
        ],
      },
      {
        id: 'minors',
        title: 'Minors and parental consent',
        text: [
          'Players under 18 may use the app only with the consent of a parent or legal guardian, who accepts these terms for them. Clubs and coaches must have that consent before adding a minor, and must handle players’ data with care and only for football.',
        ],
      },
      {
        id: 'community',
        title: 'Community rules',
        text: ['These rules apply wherever people can post, message or share in Rate Me:'],
        points: [
          'Respect everyone: coaches, players, referees and parents.',
          'No harassment or hate: no insults, threats or attacks on anyone.',
          'No sexual or violent content. Keep text, photos and files about football.',
          'No personal information: no phone numbers, addresses or anything about players.',
          'No spam: no ads, chain messages or repeated posts.',
          'No impersonation and nothing illegal.',
        ],
      },
      {
        id: 'zero-tolerance',
        title: 'No tolerance for objectionable content',
        text: [
          'We have no tolerance for objectionable content or abusive users. Anyone can report a message or club and block a user in the app. We aim to review reports within 24 hours. We may remove content, warn, mute or ban users and remove clubs without notice. If a child may be at risk or content is illegal, we may contact the authorities.',
        ],
      },
      {
        id: 'content',
        title: 'Your content',
        text: [
          'What you create stays yours. You allow us to store and show it as needed to run the app, for the people you share it with. Share only what you have the right to share. You can delete your content or your account.',
        ],
      },
      {
        id: 'coaching',
        title: 'Coaching, health and the assistant',
        text: [
          'Drills, ratings and assistant answers are aids, not professional, medical or safety advice. Coaches are responsible for their sessions and their players’ safety. Assistant answers are generated by AI and may be wrong: review them before use.',
        ],
      },
      {
        id: 'fair-use',
        title: 'Fair use',
        text: [
          'Do not break or overload the service, access other people’s data, copy the app, or use bots or scrapers on it. The Rate Me name, logo, design and code belong to us or our licensors.',
        ],
      },
      {
        id: 'liability',
        title: 'Availability and liability',
        text: [
          'We provide the website and app as they are and cannot promise they are always available or free of mistakes. As far as the law allows, we are not liable for indirect losses or for what users, clubs or coaches do. Nothing here limits rights the law says cannot be limited.',
        ],
      },
      {
        id: 'ending',
        title: 'Ending and changes',
        text: [
          'You can stop at any time and delete your account in the app. We may suspend accounts that break these terms. We may update these terms; we will change the date above and tell you about important changes.',
        ],
      },
      {
        id: 'stores',
        title: 'App stores',
        text: [
          'If you get the app from the Apple App Store or Google Play, their rules apply too. Apple and Google are not responsible for the app or its support. Apple and its subsidiaries may enforce these terms as third-party beneficiaries for the iOS app.',
        ],
      },
      {
        id: 'law',
        title: 'Law and contact',
        text: [
          '[Governing law and courts to be confirmed; proposed: the laws of Lebanon.] For support, reports or questions: {email}.',
        ],
      },
    ],
  },
};
