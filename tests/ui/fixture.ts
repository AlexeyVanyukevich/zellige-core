import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

const root = join(import.meta.dirname, '../..')
const origin = 'http://kit.test'

// A page of its own that loads the kit as an application would, served unprocessed, so the
// fixtures need no playground and the contract holds none of them.
export async function openFixture(page: Page, body: string): Promise<void> {
  await page.route(`${origin}/**`, async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1)
    if (file === '') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html><head><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/zl.css"></head><body>${body}</body></html>`,
      })
    }
    return route.fulfill({ contentType: 'text/css', body: readFileSync(join(root, file), 'utf8') })
  })
  await page.goto(`${origin}/`)
}
