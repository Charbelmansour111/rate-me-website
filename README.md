# Rate Me website

The pre-launch site of Rate Me, a home for football coaches: https://getrateme.space

Next.js (App Router), TypeScript and Tailwind. English at `/`, Arabic (RTL) at `/ar`.

## Run it

```bash
npm install && npm run dev
```

Open http://localhost:3000. No settings are needed: the form uses a mock list in development.

## Where things are

| What                       | Where                              |
| -------------------------- | ---------------------------------- |
| Copy (English, Arabic)     | `src/i18n/en.ts`, `src/i18n/ar.ts` |
| Privacy and terms (drafts) | `src/i18n/legal/`                  |
| “Coming soon” tags         | `src/config/features.config.ts`    |
| Logo, screenshots          | `public/brand/`, `public/screens/` |
| Signup API and providers   | `src/lib/waitlist/`                |
| Settings, deployment       | `.env.example`, `docs/DEPLOY.md`   |

## Checks

```bash
npm run lint && npm run format:check && npm run typecheck && npm test
npm run build && npm run test:e2e   # first time: npx playwright install chromium
npm run brand                       # rebuild favicons and share images after a logo change
```
