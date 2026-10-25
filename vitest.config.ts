import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Main-process modules only by default; src/shared modules are pure and
    // environment-free, so they run in the same node environment.
    include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts'],
    environment: 'node',
    // Global mock cleanup — eliminates order-dependent mock leakage
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
  },
});
