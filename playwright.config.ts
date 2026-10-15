import { defineConfig, devices } from '@playwright/test'
import { PLAYGROUND } from './vite.config'

const playground = `http://${PLAYGROUND.host}:${PLAYGROUND.port}`

// Set by `./run test`: the browsers then run in the Playwright image, and `<loopback>` sends
// their requests for the playground back through this runner to the host.
const browsers = process.env.ZELLIGE_BROWSER_WS

export default defineConfig({
  testDir: './tests/ui',
  testMatch: '**/*.spec.ts',
  forbidOnly: true,
  // No platform in the name: every baseline is rendered in the Playwright image, whatever the
  // host the runner is on.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: playground,
    trace: 'retain-on-failure',
    ...(browsers ? { connectOptions: { wsEndpoint: browsers, exposeNetwork: '<loopback>' } } : {}),
  },
  projects: [{ name: 'ui', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite', url: playground, reuseExistingServer: true },
})
