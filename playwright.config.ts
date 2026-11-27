import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;
const baseURL = `http://localhost:${PORT}`;

/**
 * Every test but the gate's own (tests/e2e/gate.spec.ts) opens the page as a return visit: the
 * walk's set noted as held before (src/motion/walk.ts), so no first-visit gate holds the scroll. The
 * cache itself is empty, so the frames still come in the usual way.
 */
const returning = {
  cookies: [],
  origins: [
    {
      origin: baseURL,
      localStorage: [1, 2].map((stride) => ({
        name: `walk-held /journey/seq/f 1 ${stride}`,
        value: '1',
      })),
    },
  ],
};

/** Runs against the production build: `npm run build` first. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'on-first-retry', storageState: returning },
  projects: [
    { name: 'desktop', use: devices['Desktop Chrome'] },
    { name: 'mobile', use: devices['Pixel 7'] },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    env: { WAITLIST_PROVIDER: 'mock' },
    reuseExistingServer: false,
  },
});
