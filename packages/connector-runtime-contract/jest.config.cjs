module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['../../node_modules/ts-jest', { tsconfig: 'tsconfig.test.json' }]
  }
};
