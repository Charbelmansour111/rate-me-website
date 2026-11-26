# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Football coaches first: head coaches, academy owners and assistant coaches, in Lebanon first, then
the Middle East. They plan trainings, drills, squads and matches, usually from a phone, around
evening sessions and weekend matches. Players join free through their coach's team and do not sign
up on this site. Parents of youth players receive a monthly report from the app.

This website is the pre-launch page: it explains the app and collects pre-registrations (a
waitlist) from coaches.

## Product Purpose

Rate Me is one app for the whole coaching job, so a coach stops juggling chats, paper and
spreadsheets. Success for this site: coaches understand what the app does and pre-register.

## Positioning

One app for the whole coaching job: a calendar of trainings and matches, an animated drill
whiteboard whose defenders react to the ball, squad and player cards, and match requests between
coaches, in Arabic and English, built with coaches in Lebanon.

## Capabilities and Constraints

- The app has not launched. Features not yet released are marked "Coming soon"
  (`src/config/features.config.ts`); copy describes only what the app does.
- English at `/`, Arabic at `/ar` (right to left, Western digits).
- The page must stay fast: Lighthouse 95 or more on desktop, no worse on mobile.
- Motion loads after first use and never runs under reduced motion.

## Brand Commitments

- Name: Rate Me. Logo and wordmark in `public/` (`npm run brand` builds them from the palette).
- No club, league or competition marks or names anywhere, and no "FIFA".

## Evidence on Hand

- Real app screenshots in `public/screens/` (see its README).
- Stock photos from Unsplash (`docs/PHOTO-CREDITS.md`): stand-ins only. They are never presented
  as real Rate Me coaches, and no names, quotes or testimonials go with them.
- None of these exist yet and must not be invented: customers, users or coach counts, ratings,
  testimonials, press, prices, launch dates.

## Product Principles

1. Say only what is true today: no numbers, claims or dates the product cannot back.
2. Arabic is a first language, not a translation layer: every change works right to left.
3. The coach's time is short: plain words, one action per section, pre-register always near.
4. Children's data is handled with care: parents' reports go only to that player's own parent or
   guardian.

## Accessibility & Inclusion

WCAG AA contrast for every text pair (checked in `tests/unit/palette.test.ts`), 44px targets,
visible focus, full keyboard use, reduced motion respected.
