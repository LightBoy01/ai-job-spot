module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',

  },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  // Explicitly tell Jest where to find test files
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts?(x)',
  ],
  transformIgnorePatterns: [],
  testPathIgnorePatterns: [
    // Keep original ignores if they are still relevant
    '<rootDir>/src/components/Footer.test.tsx',
    '<rootDir>/__tests__/pages/api/',
  ],
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/pages/api/**', // API routes are typically integration tested, not unit tested for coverage
    '!src/lib/firebaseAdmin.ts', // Firebase Admin SDK setup
    '!src/lib/firebase.ts', // Firebase Client SDK setup
    '!src/lib/rateLimit.ts', // Simple utility, covered by integration
    '!src/lib/middleware.ts', // Middleware, covered by integration
    '!src/lib/validationSchemas.ts', // Schemas, covered by API tests
    '!src/lib/types.ts', // Type definitions
    '!src/lib/apiUtils.ts', // Utility functions
    '!src/lib/ai/client.ts', // AI client setup
    '!src/lib/ai/prompts.ts', // AI prompts
    '!src/lib/ai/utils.ts', // AI utilities
    '!src/lib/constants.ts', // Constants
    '!src/lib/hooks/**', // React hooks
    '!src/components/**', // React components
    '!src/pages/**', // Next.js pages
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

};