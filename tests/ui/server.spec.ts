import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'

const [theme] = THEMES
if (!theme) throw new Error('The playground needs a theme to open')

const treePlayground = realpathSync(fileURLToPath(new URL('../../playground', import.meta.url)))

test('every response from the playground names this tree as the Vite root', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error('The suite sets a baseURL')
  const origin = new URL(baseURL).origin

  const roots: { url: string; root: string | undefined }[] = []
  page.on('response', (response) => {
    if (!response.url().startsWith(`${origin}/`)) return
    roots.push({ url: response.url(), root: response.headers()['x-zellige-root'] })
  })

  await openPlayground(page, theme)

  expect(roots.length).toBeGreaterThan(1)
  const seen = roots.map(({ root }) =>
    root === undefined ? 'missing x-zellige-root' : realpathSync(root),
  )
  expect([...new Set(seen)]).toEqual([treePlayground])
})
