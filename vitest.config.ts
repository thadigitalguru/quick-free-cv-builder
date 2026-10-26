import { defineConfig } from 'vitest/config';

// Unit tests only; the browser suite in e2e/ runs under Playwright (npm run test:e2e).
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
