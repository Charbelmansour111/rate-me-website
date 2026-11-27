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
  phone-black: '#17171a'
  phone-rim: '#3d3d44'
  paper-ground: '#ebe5da'
  card-from: '#1c1b29'
  card-to: '#3a1606'
  card-accent: '#ff7a1a'
  card-label: '#e6dcd2'
  position-midfielder: '#22c55e'
  stage-locker-surface: '#f3ece1'
  stage-locker-soft: '#eae1d2'
  stage-locker-softer: '#e0d5c3'
  stage-locker-text: '#0b0b0c'
  stage-locker-muted: '#544c42'
  stage-locker-accent: '#c44300'
  stage-locker-accent-text: '#9e3400'
  stage-locker-line: '#d3c7b3'
  stage-locker-edge: '#7a6f61'
  stage-locker-chalk: '#c7baa4'
  stage-locker-danger: '#a3221b'
  stage-field-surface: '#0b2a1c'
  stage-field-soft: '#103424'
  stage-field-softer: '#163f2d'
  stage-field-text: '#ffffff'
  stage-field-muted: '#bdd4c6'
  stage-field-accent-text: '#ffb07a'
  stage-field-line: '#24503c'
  stage-field-edge: '#7ea892'
  stage-field-chalk: '#2c5c46'
  ink: '#0b0b0c'
  ink-soft: '#161513'
  ink-softer: '#1f1d1a'
  ink-hover: '#2a2621'
  paper: '#fffcf7'
  paper-muted: '#5c554c'
  paper-accent-text: '#a33a00'
  black: '#000000'
  white: '#ffffff'
  app-bar: '#ffffff'
  app-bar-line: '#dbdbdb'
  app-tab: '#5a5a66'
  app-tab-on: '#b33f00'
  app-status-dark: '#0d1812'
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
  text-sm:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '0.875rem'
  text-base:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '1rem'
  text-lg:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '1.125rem'
  text-xl:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '1.25rem'
  card-title:
    fontFamily: 'Bebas Neue, Barlow, sans-serif'
    fontSize: 'clamp(1.35rem, 1.1rem + 0.5vw, 1.6rem)'
  card-small:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '0.8125rem'
  kicker:
    fontFamily: 'Barlow, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 600
    letterSpacing: '0.08em'
rounded:
  sm: '4px'
  button: '0.5rem'
  art: '0.85rem'
  inner: '1rem'
  card: '1.25rem'
  phone: '2.6rem'
  phone-screen: '2.2rem'
  phone-focus: '2.8rem'
  app-md: '0.75rem'
  badge: '0.35rem'
  line: '2px'
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
Everything people read sits on panels in front of it, and the panels take the colours of the part of
the walk behind them: warm and light in the locker room, charcoal in the tunnel, deep pitch green
on the field. Thin pitch lines (a centre circle, corner arcs, a box corner, a dashed pass) tie the
pieces to football. The mood is a calm, premium sports product, with orange used for what you act
on. Not brutalist, not loud, no confetti.

## Colors

### Primary

- **Brand orange `#ff5a00`.** Buttons (the same in every stage), the chosen tab, focus rings, the
  kicker line, icons, the running line. Large text (24px and up, or bold 19px and up) uses the
  stage's large orange: `#ff5a00` on charcoal and green, `#c44300` on the light locker room (3:1).
- **Accent text.** Small orange text uses the stage's accent text: `#9e3400` in the locker room,
  `#ff8a3d` in the tunnel, `#ffb07a` on the field; `#ff5a00` itself is under 4.5:1 for small text.

### The stages

`src/config/stages.ts` holds the panels' tokens for each part of the walk (`--st-*` custom
properties, copied into `src/app/palette.css`, kept equal by `tests/unit/stages.test.ts`):

| Stage                   | Surface   | Text      | Muted     | Lines     | Pitch lines | Panel edge  |
| ----------------------- | --------- | --------- | --------- | --------- | ----------- | ----------- |
| Locker room (0 to 0.22) | `#f3ece1` | `#0b0b0c` | `#544c42` | `#d3c7b3` | black       | black       |
| Tunnel (0.22 to 0.59)   | `#0f0e0d` | `#f6f1e8` | `#bdb5a8` | `#34302a` | orange      | orange, 30% |
| Field (0.59 to the end) | `#0b2a1c` | `#ffffff` | `#bdd4c6` | `#24503c` | white       | white, 35%  |

The ranges are shares of the walk (`stageRanges` in `src/config/journey.config.ts`), so they
follow any frame count. Across a boundary the colours blend over 0.4 of the shorter stage, in OKLab;
wherever a blend would put text under AA, the text is pushed lighter or darker until it passes, and
the unit test checks every mix in 100 steps.

### Neutral

- **Light theme outside the home page's panels (legal pages):** warm off-white `#fffcf7`, sand
  `#f5f1ea` and `#ebe5da`, text `#0b0b0c`, muted `#68625a`.
- The greys are taken from the walk (sand, warm grey, charcoal) so the panels sit in it.

### Named Rules

- **The panels follow the walk.** One set of stage colours for every panel at a time; the header and
  the footer use them too. Reduced motion: each part keeps its own stage, switching at the boundary.
- **Black on orange.** Text on the orange button is black (6.3:1); white would be 3.1:1.
- **AA or it does not ship.** A new text and ground pair is added to the palette or stage test first.

## Typography

- **Display:** Bebas Neue (capitals only, tight 0.92 line height) for headings in English; Readex
  Pro bold, normal case, 1.3 line height in Arabic (`display: optional`, so it never swaps
  mid-page).
- **Body:** Barlow 17px, 1.6 line height; Readex Pro in Arabic with 1.8 line height.
- **Kicker:** the small label over a heading, 15px semibold, 0.08em tracking (none in Arabic), with
  a short orange line before it.

### Hierarchy

h1 `clamp(3.25rem … 5.5rem)`, h2 `clamp(2.6rem … 4.25rem)`, h3 `clamp(1.9rem … 2.4rem)`; Arabic
sizes are smaller because Readex Pro is wider and taller. Captions and card text 16px at least,
18px for card titles, 20px for the links in the phone's menu.

## Layout

- Content width 76rem with `clamp(1.25rem, 4vw, 2.5rem)` gutters; panel padding
  `clamp(1.5rem, 4vw, 3.5rem)`.
- Between sections, an open gap of 60 to 70% of the screen shows the walk with nothing on it.
- The running line sits outside the content: in the margin on a computer, in the gutter on a phone.
- Everything mirrors in Arabic (logical properties: `margin-inline`, `inset-inline`).

## Elevation & Depth

Depth comes from the walk behind the panels, not from shadows. No `backdrop-filter`, and no
blurred shadow on anything large over the walk: it would be repainted as it moves. Phones float on
a soft orange glow and stand on a ground shadow, both radial gradients. The one blurred shadow is
the player card's small position badge, inside the tilting card.

## Shapes

Buttons and small controls 0.5rem corners; panels and cards 1.25rem; the header bar 1rem; phones
2.6rem with a 2.2rem screen; tabs, chips and tags fully round.

## Components

### Looks

Three looks, chosen by what a block holds and the same in every stage (`src/app/pitch.css`):

- **Ink** (`#0b0b0c`, orange edge): what you act on. The "Plan, build, organize" cards, the
  feature dialog.
- **Paper** (`#fffcf7`, black edge): what you read and keep. The feature cards.
- **Split** (half black, half orange, on the diagonal): the one key call to action of a section.
  Words on the black half, a black button on the orange half (`btn-dark`), a dashed pass between.
  Laid out by its own width (a container query), so it works in a half column.

### Paint

Behind the tactics section, two thick oblique strokes, orange and white, as if rolled on: wide
strokes at -12 degrees with thin ridges of lighter and darker paint along them (more strokes, no
filter, no blur). They show only in the panel's gaps and margins: the words and the board stand on
the panel's own solid colour in front of them. Rolled on (dash offset) as the section comes in,
paused off screen; still under reduced motion.

### Pitch lines

`src/components/pitch-lines.tsx`, drawn in the stage's pitch-line colour: the halfway line and
half of the centre circle on every panel's top edge, corner arcs in its corners, a penalty-box
corner on cards, a dashed pass with an arrow, and half a pitch at the top of the footer.

### Buttons

Primary: orange, black text, 52px tall. Ghost: a 1.5px outline in the text colour, orange on
hover. Dark: black with white text, only on the orange half of a split. Every button and link is
at least 44px tall.

### Chips

Tags and role chips: fully round, 1.5px outline; "Coming soon" is an orange outline with accent
text.

### Cards / Containers

Panels as above. "What you get" is a carousel of paper cards: one 16:10 photo each (an app screen
where a photo would be stock), the feature's icon, its title, one line of what it gives, Coming
soon where it applies, More. Four a view from 1280px, three from 1024, one and a half on a phone;
the whole section fits one screen at 1440 x 900 and 1280 x 720. On a computer the row stops at the
content's edges (whole cards, a clear start and end). Swipe, drag, arrows, dots and arrow keys,
mirrored in Arabic; at either end its arrow dims (`aria-disabled`, still reachable), the dots fill
up to the last card in view and a counter says "7 of 7". A button over each card opens it in a
dialog (bigger photo, three facts from the app, Pre-register). Three cards show the app's own
screens (`src/config/app-shots.ts`): a 16:10 face cut so it reads at card size, "Example" in the
card's body on the More line (never on the picture), and in the dialog the whole screen in the
phone frame, or, for the monthly report (a PDF), its two pages as white sheets on `paper-ground`,
slightly turned, captioned "Monthly report (PDF)". On `/ar` the captions add "التطبيق معروض
بالإنجليزية": the layout mirrors, the screenshots do not.

The community section shows three portraits at most, captioned "Photos for illustration", and the
app itself in the site's phone frame (WEBSITE 19): a request received in front, the Coaches
Channel with a request sent behind it, offset to the far side and inside its column. "Example" and
what it is go under the phones; on `/ar` also "التطبيق معروض بالإنجليزية".

The FAQ's left column holds a short play in the tactics board's language (`faq-play.tsx`): chalk
lines, a curved orange pass, a white run into the box ending on an orange "?" node (mirrored to
"؟" in Arabic). It is drawn in stroke by stroke with the tactics paint's code
(`src/motion/brush.ts`), simply drawn under reduced motion, and left out on phones.

The walk fades into the footer: no border, a gradient from transparent to the footer's own colour
over the last stretch above it, at every width.

### Inputs / Fields

Outlined with the 3:1 edge colour, 52px tall, labels above, errors in the danger colour with text,
never colour alone.

### Navigation

A slim floating bar (56px, 1rem corners): see-through over the locker room at the top (62% of the
stage surface, so its text passes AA over any pixel), solid once the page moves, in the stage's
colours. The wordmark at 24px, four section links (the one being read on an orange tint with an
orange line), language and theme in one small box, Pre-register. A 2px orange line along its
bottom edge shows how far down the page you are. On a phone: the wordmark, Pre-register and a
menu button that opens the rest in a dialog.

### Footer

On the field's colours, with half a pitch drawn across its top over a faint black-and-white band
of turf (faded at its edges, never under text). The contact block, Privacy, Terms,
Cookie settings and the language switch.

### Inside the app

Three phones a view, sized from the screen's height so each is under 72% of it (`31vh` wide, at
most 340px), so three fit whole at 1440 x 900 and 1280 x 720, the middle one with the strongest
(orange) glow. One phone frame everywhere (`phone-frame.tsx`, WEBSITE 18): a thin ink bezel, side
keys, a drawn status bar (9:41, the island, signal, battery) over the screenshot, a soft reflection,
a ground shadow. The coach view shows the app's clean demo screens (calendar, roles, a received
match request), which carry their own tab bar. On older captures (the player's home) the app's own
bar is drawn over the screenshot's: Ionicons,
white, `#dbdbdb` hairline, the chosen tab in `#b33f00`. A button over each phone opens a dialog
with what its screen does. The player view ends on the app's shield card (rate-me: `shield-card.tsx`), shown whole and
marked as an example: the crest with its inner outline in the tier's gradient, the overall and
position big on the left (they stand off the card when it tilts), the photo on the right, the name
on a band, six attributes in two columns with the app's three-letter codes.

### The walk

A canvas fixed behind the page, at the frames' own size and scaled by CSS. One frame shows at a
time, crossfading only in a short window between neighbours. Without motion: one still picture
behind each group of sections. Over the last 12% of the page a black layer dims it to 45%
brightness (never a filter on the canvas).

### The running line

An orange line down the page's edge (the right edge in Arabic), outside the content, behind the
panels: a node at each section heading fills as you reach it and a ball rides the tip. Hidden from
screen readers.

## Motion

- GSAP with ScrollTrigger and Lenis, loaded after the first scroll, touch, key or mouse move. Never
  under `prefers-reduced-motion`: the page is then complete and still.
- One loop: Lenis runs on GSAP's ticker; the walk, the stage colours, the header's progress line,
  the running line and the dimming are all set from the same scroll.
- Content is visible at rest; only what is still below the screen waits to rise in. Headings rise
  word by word, never letter by letter (Arabic letters join). The footer rises in, part by part, as
  its pitch lines draw themselves.
- Hover motion is for mouse users only: the light on cards, the tilt and glare on phones and the
  player card (React Bits TiltedCard, its badge moving a little more), the tabs drawn to the mouse
  (React Bits Magnet), a 2px lift and a slow photo zoom on feature cards.
- Durations 0.3 to 0.8s (the footer's lines 1.1s), easing `power3.out` or
  `cubic-bezier(0.2, 0.8, 0.2, 1)`: things settle, they never bounce or overshoot. Nothing loops
  off screen. "Scroll" at the top fades once the page moves.

## Do's and Don'ts

### Do

- Put every new section on a panel, with a kicker, a display heading and the panel's pitch lines.
- Give a block its look by what it holds (ink, paper, split), never at random.
- Check each new colour pair in the palette or stage test and each new string in Arabic, right to
  left.
- Show real app screens and real, licensed photographs, credited in `docs/PHOTO-CREDITS.md`.
- Photos with a visible face are black and white; photos with no face (from behind, legs, the
  ball, turf, cones, a goal, equipment) keep their own tone: on the feature cards most are black and
  white, the goal net and the training sheet in colour (`src/config/photos.ts`, `faces` and `tone`, checked by
  `tests/unit/photos.test.ts`); app screens stay as the app shows them, with an "Example" tag
  where they show sample data. Any mark on a stock photo (a club's or a tournament's name, a
  sponsor, a league patch) goes under a soft round blur; makers' logos on boots and balls stay.
- Use stock photos for atmosphere only (the community, the footer's turf), with no faces, logos or
  names, never as our coach, player or club.

### Don't

- No `backdrop-filter`, no blurred shadows on large things over the walk, no gradients that fight
  the photo behind.
- No club, league or competition marks, and no stock person presented as a real coach.
- No numbers, quotes, dates or claims the product cannot back.
- No motion that runs before first use or under reduced motion.
