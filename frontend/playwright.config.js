// playwright.config.js — TEST-111 Cross-browser rendering configuration
// REQ-036: Application must render correctly in Chrome, Firefox, Safari, Edge

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    // Base URL — React dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },

  // Auto-start React dev server before running tests
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: true,
    env: {
      BROWSER: 'none', // prevent opening browser window
      CI: 'true',
    },
  },

  projects: [
    {
      name: 'Chrome (Chromium)',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Safari (WebKit)',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Edge (Chromium)',
      use: { ...devices['Desktop Edge'] },
    },
  ],
});
