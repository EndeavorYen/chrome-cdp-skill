import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 34,
        branches: 83,
        functions: 44,
        lines: 34,
      },
    },
  },
});
