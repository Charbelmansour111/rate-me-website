---
name: Rate Me
description: The pre-launch site of a football coaching app, set over a walk from the locker room to the pitch.
colors:
  brand-orange: '#ff5a00'
  brand-black: '#0b0b0c'
  button-hover: '#e64f00'
  accent-text-light: '#b83c00'
  accent-text-dark: '#ff8a3d'
  page-light: '#fffcf7'
  soft-light: '#f5f1ea'
  softer-light: '#ebe5da'
  muted-light: '#68625a'
  line-light: '#e6e0d4'
  edge-light: '#857e72'
  page-dark: '#0f0e0d'
  panel: '#0f0e0d'
  panel-soft: '#1a1815'
  panel-softer: '#23201c'
  panel-text: '#f6f1e8'
  panel-muted: '#bdb5a8'
  panel-line: '#34302a'
  panel-edge: '#857d70'
  danger-light: '#b3261e'
  danger-dark: '#ffb4ab'
typography:
  display:
    fontFamily: 'Bebas Neue, Barlow, sans-serif'
    fontSize: 'clamp(2.6rem, 2rem + 2.4vw, 4.25rem)'
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: '0.005em'
  display-ar:
    fontFamily: 'Readex Pro, sans-serif'
    fontSize: 'clamp(1.9rem, 1.5rem + 1.6vw, 2.8rem)'
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: '0em'
  body:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.6
  body-ar:
    fontFamily: 'Readex Pro, system-ui, sans-serif'
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.8
  kicker:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 600
    letterSpacing: '0.08em'
rounded:
  sm: '4px'
  button: '0.5rem'
  card: '1.25rem'
  phone: '2rem'
  pill: '999px'
spacing:
  section: 'clamp(1.5rem, 4vw, 3.5rem)'
  panel: 'clamp(1.5rem, 4vw, 3.5rem)'
  gutter: 'clamp(1.25rem, 4vw, 2.5rem)'
  wrap: '76rem'
  target: '44px'
components:
  button-primary:
    backgroundColor: '{colors.brand-orange}'
    textColor: '{colors.brand-black}'
    rounded: '{rounded.button}'
    padding: '0.6rem 1.6rem'
    height: '3.25rem'
  button-primary-hover:
    backgroundColor: '{colors.button-hover}'
    textColor: '{colors.brand-black}'
  button-ghost:
    textColor: '{colors.panel-text}'
    rounded: '{rounded.button}'
    padding: '0.6rem 1.6rem'
    height: '3.25rem'
  panel:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.panel-text}'
    rounded: '{rounded.card}'
    padding: '{spacing.panel}'
  tab-pill:
    backgroundColor: '{colors.brand-orange}'
    textColor: '{colors.brand-black}'
    rounded: '{rounded.pill}'
    height: '3rem'
---

# Design System: Rate Me

The source of truth is the code: colours in `src/app/palette.css` (with every AA pair checked by
`tests/unit/palette.test.ts`), type and components in `src/app/globals.css`, the walk and the
panels in `src/app/journey.css`, motion in `src/app/motion.css` and `src/motion/`. This file
describes them; when the two differ, the code wins and this file is updated.

## Overview

The home page is a walk: a rendered image sequence (`public/journey/seq`, our own Blender renders)
from the locker room through the tunnel to the pitch, scrubbed by the scroll behind the page.
Everything people read sits on charcoal panels in front of it. The mood is a calm, premium sports
product: dark, warm and quiet, with orange used sparingly for what matters. Not brutalist, not
loud.

## Colors

### Primary

- **Brand orange `#ff5a00`.** Buttons, the chosen tab, focus rings, the kicker line, icons, large
  text (24px and up, or bold 19px and up). Orange never fills a section.
- **Accent text.** Small orange text uses `#b83c00` on light grounds and `#ff8a3d` on charcoal;
  `#ff5a00` itself is under 4.5:1 for small text.

### Neutral

- **Panels, both themes:** charcoal `#0f0e0d`, raised `#1a1815` and `#23201c`, warm white text
  `#f6f1e8`, muted `#bdb5a8`, lines `#34302a`, outlines `#857d70`.
- **Light theme outside the panels (header, legal pages):** warm off-white `#fffcf7`, sand
  `#f5f1ea` and `#ebe5da`, text `#0b0b0c`, muted `#68625a`.
- The greys are taken from the walk (sand, warm grey, charcoal) so the panels sit in it.

### Named Rules

- **One panel colour.** Every section over the walk is the same charcoal panel, in both themes. No
  cream block on the dark photo.
- **Black on orange.** Text on the orange button is black (6.3:1); white would be 3.1:1.
- **AA or it does not ship.** A new text and ground pair is added to the palette test first.

## Typography

- **Display:** Bebas Neue (capitals only, tight 0.92 line height) for headings in English; Readex
  Pro bold, normal case, 1.3 line height in Arabic.
- **Body:** Barlow 17px, 1.6 line height; Readex Pro in Arabic with 1.8 line height.
- **Kicker:** the small label over a heading, 15px semibold, 0.08em tracking (none in Arabic), with
  a short orange line before it.

### Hierarchy

h1 `clamp(3.25rem … 5.5rem)`, h2 `clamp(2.6rem … 4.25rem)`, h3 `clamp(1.9rem … 2.4rem)`; Arabic
sizes are smaller because Readex Pro is wider and taller. Captions and card text 16px at least,
18px for card titles.

## Layout

- Content width 76rem with `clamp(1.25rem, 4vw, 2.5rem)` gutters; panel padding
  `clamp(1.5rem, 4vw, 3.5rem)`.
- Between sections, an open gap of 60 to 70% of the screen shows the walk with nothing on it.
- Phones of the app: about 300px wide, three side by side on a computer; one big phone at a time,
  snapping, on a phone.
- Everything mirrors in Arabic (logical properties: `margin-inline`, `inset-inline`).

## Elevation & Depth

Depth comes from the walk behind the panels, not from shadows. No blurred shadows and no
`backdrop-filter` over the walk: they would be repainted as it moves. A phone floats on a soft
orange glow, drawn as a radial gradient behind it.

## Shapes

Buttons 0.5rem corners; panels and cards 1.25rem; phones 2rem; tabs, chips and tags fully round.
Panels carry a 1px orange line at 30% opacity.

## Components

### Buttons

Primary: orange, black text, 52px tall. Ghost: a 1.5px outline in the text colour, orange on
hover. Every button and link is at least 44px tall.

### Chips

Tags and role chips: fully round, 1.5px outline; "Coming soon" is an orange outline on the orange
tint with accent text.

### Cards / Containers

Panels as above. Cards inside them: 1.25rem corners, 1px line; under a mouse, a light follows the
cursor and the card leans a little (React Bits SpotlightCard).

### Inputs / Fields

Outlined with the 3:1 edge colour, 52px tall, labels above, errors in the danger colour with text,
never colour alone.

### Navigation

A sticky header (theme coloured) with the wordmark, three section links, the theme toggle, the
language switch and the Pre-register button.

### The walk

A canvas fixed behind the page, at the frames' own size and scaled by CSS. One frame shows at a
time, crossfading only in a short window between neighbours. Without motion: one still picture
behind each group of sections.

## Motion

- GSAP with ScrollTrigger and Lenis, loaded after the first scroll, touch, key or mouse move. Never
  under `prefers-reduced-motion`: the page is then complete and still.
- One loop: Lenis runs on GSAP's ticker and the walk is drawn from the same tick.
- Content is visible at rest; only what is still below the screen waits to rise in. Headings rise
  word by word, never letter by letter (Arabic letters join).
- Hover motion is for mouse users only: the light on cards, the tilt and glare on phones (React
  Bits TiltedCard), the tabs drawn to the mouse (React Bits Magnet).
- Durations 0.3 to 0.8s, easing `power3.out`; nothing loops off screen.

## Do's and Don'ts

### Do

- Put every new section on the charcoal panel, with a kicker and a display heading.
- Check each new colour pair in the palette test and each new string in Arabic, right to left.
- Show real app screens and real, licensed photographs, credited in `docs/PHOTO-CREDITS.md`.

### Don't

- No cream or white blocks over the walk, no blurred shadows, no `backdrop-filter`.
- No club, league or competition marks, and no stock person presented as a real coach.
- No numbers, quotes, dates or claims the product cannot back.
- No motion that runs before first use or under reduced motion.
