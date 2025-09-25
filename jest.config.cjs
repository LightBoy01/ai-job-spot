module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\.(ts|tsx|js|jsx)$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    '^.+\.m?js$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(firebase|@firebase|marked)/)'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
