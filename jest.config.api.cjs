module.exports = {
  // The test environment for Node.js, suitable for API route testing
  testEnvironment: 'node',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // The transform config which tells Jest how to process files
  transform: {
    // Use ts-jest for all TypeScript files
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },

  transformIgnorePatterns: ['/node_modules/(?!(firebase|@firebase|jose|marked)/)'],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // The paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/__tests__/pages/api'],
};
