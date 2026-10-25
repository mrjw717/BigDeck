import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Main-process modules only (renderer tests would need jsdom)
    include: ['src/main/**/*.test.ts'],
    environment: 'node',
    // Global mock cleanup — eliminates order-dependent mock leakage
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
  },
});
