module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    '^.+\.m?js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(firebase|@firebase)/)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};