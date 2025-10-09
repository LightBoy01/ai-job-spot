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
};