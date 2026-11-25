import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path('./src'),
      // Only means something inside Next.js.
      'server-only': path('./tests/unit/empty.ts'),
    },
  },
  test: { include: ['tests/unit/**/*.test.ts'], unstubGlobals: true, restoreMocks: true },
});
