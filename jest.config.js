const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Common SWC transform options to enable automatic React runtime in tests
const swcReactTransform = ['@swc/jest', {
  jsc: {
    transform: {
      react: {
        runtime: 'automatic',
        development: true,
        importSource: 'react',
      },
    },
  },
}]

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  reporters: [
    'default',
    '<rootDir>/tools/jest-warning-reporter.js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': swcReactTransform,
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      reporters: [
        'default',
        '<rootDir>/tools/jest-warning-reporter.js',
      ],
      testMatch: ['<rootDir>/src/components/**/*.test.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': swcReactTransform,
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      reporters: [
        'default',
        '<rootDir>/tools/jest-warning-reporter.js',
      ],
      testMatch: [
        '<rootDir>/src/app/api/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/lib/**/*.test.{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': swcReactTransform,
      },
    },
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)