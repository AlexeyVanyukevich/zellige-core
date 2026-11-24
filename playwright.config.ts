import { createServer } from 'node:net'
import { defineConfig, devices } from '@playwright/test'
import { PLAYGROUND } from './vite.config'

// A free loopback port for each run. The runner's main process picks it and writes it to the
// environment, so every worker, which loads this file again, reads the same one.
async function freePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, PLAYGROUND.host, resolve)
  })
  const address = server.address()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  if (address === null || typeof address === 'string') throw new Error('No port was assigned')
  return address.port
}

// An empty value counts as unset: Vite would be started with `--port` and no number.
const given = process.env.ZELLIGE_PLAYGROUND_PORT
const port = given !== undefined && given !== '' ? given : String(await freePort())
process.env.ZELLIGE_PLAYGROUND_PORT = port

const playground = `http://${PLAYGROUND.host}:${port}`

// Set by `./run test`: the browsers then run in the Playwright image, and `<loopback>` sends
// their requests for the playground back through this runner to the host.
const browsers = process.env.ZELLIGE_BROWSER_WS

export default defineConfig({
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
  projects: [
    { name: 'ui', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    // The package as npm would ship it; no page, so no browser is opened.
    { name: 'package', testDir: './tests/integration' },
  ],
  // Always the tree's own Vite: reusing a server would test whatever checkout it serves.
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: playground,
    reuseExistingServer: false,
  },
})
