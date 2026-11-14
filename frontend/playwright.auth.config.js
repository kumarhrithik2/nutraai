import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'auth-protection.spec.js',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    env: { VITE_ENABLE_PREVIEW_MODE: 'false' },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
