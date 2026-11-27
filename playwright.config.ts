import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {

  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],
  // Unit tests are run by vitest
  testIgnore: ['**/redux/**', '**/__tests__/**'],
  retries: 1,
  timeout: 60 * 1000,

  use: {
    baseURL: 'http://localhost:5173/',
    headless: true,
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run start',
    port: 5173,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],


};

export default config;
