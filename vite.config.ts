import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The port `./run dev` serves on. Loopback only: the browser in the Playwright image reaches
// the server through the runner's connection, never over the network. The browser suite picks
// a port of its own (see `playwright.config.ts`).
export const PLAYGROUND = { host: '127.0.0.1', port: 5180 }

export default defineConfig({
  root: fileURLToPath(new URL('playground', import.meta.url)),
  server: { ...PLAYGROUND, strictPort: true },
  plugins: [
    {
      // Names the tree a response came from, so the browser suite can tell its own server
      // from one left running in another checkout.
      name: 'zellige-root-header',
      configureServer(server) {
        server.middlewares.use((_request, response, next) => {
          response.setHeader('x-zellige-root', server.config.root)
          next()
        })
      },
    },
  ],
})
