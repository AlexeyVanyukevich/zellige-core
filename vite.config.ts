import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Fixed, so the browser suite can wait on it. Loopback only: the browser in the Playwright
// image reaches it through the runner's connection, never over the network.
export const PLAYGROUND = { host: '127.0.0.1', port: 5180 }

export default defineConfig({
  root: fileURLToPath(new URL('playground', import.meta.url)),
  server: { ...PLAYGROUND, strictPort: true },
})
