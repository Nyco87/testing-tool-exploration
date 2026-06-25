import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 10_000,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['allure-playwright'],
  ],
  projects: [
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /auth\.setup\.ts/,
      timeout: 60_000,
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://api.deezer.com',
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        baseURL: 'https://www.deezer.com',
        storageState: 'auth/session.json',
        navigationTimeout: 30_000,
      },
    },
  ],
});
