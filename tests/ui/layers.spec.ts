import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const root = join(import.meta.dirname, '../..')
const ORDER = ['zl.tokens', 'zl.base', 'zl.components']

// Every stylesheet the package ships, read from the directory, with the layer its rules belong
// in. A new file in `css/` is a new row, and a component's layer by default.
const BASE = new Set(['css/base.css', 'css/utility.css'])
const FILES = [
  'tokens.css',
  ...readdirSync(join(root, 'css'))
    .filter((file) => file.endsWith('.css'))
    .sort()
    .map((file) => `css/${file}`),
].map((path) => ({
  path,
  layer: path === 'tokens.css' ? 'zl.tokens' : BASE.has(path) ? 'zl.base' : 'zl.components',
}))

// The files are served as they are written, from an origin of their own, so the CSSOM shows
// what an application loads: no dev-server inlining of `@import`, no rewriting.
const origin = 'http://kit.test'

interface Rule {
  kind: string
  names: string[]
  href: string
}

async function rulesOf(page: Page, path: string): Promise<Rule[]> {
  await page.route(`${origin}/**`, async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1)
    if (file === '') return route.fulfill({ contentType: 'text/html', body: '<!doctype html>' })
    return route.fulfill({ contentType: 'text/css', body: readFileSync(join(root, file), 'utf8') })
  })
  await page.goto(`${origin}/`)
  return page.evaluate(async (href) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href })
    const loaded = new Promise((resolve) => link.addEventListener('load', resolve))
    document.head.append(link)
    await loaded
    return Array.from(link.sheet?.cssRules ?? [], (rule) => ({
      kind: rule.constructor.name,
      names:
        rule instanceof CSSLayerStatementRule
          ? [...rule.nameList]
          : rule instanceof CSSLayerBlockRule
            ? [rule.name]
            : [],
      href: rule instanceof CSSImportRule ? rule.href : '',
    }))
  }, `/${path}`)
}

for (const { path, layer } of FILES) {
  test(`${path}, loaded alone, declares the layer order and keeps every rule in ${layer}`, async ({
    page,
  }) => {
    const [order, ...rules] = await rulesOf(page, path)

    expect(order).toEqual({ kind: 'CSSLayerStatementRule', names: ORDER, href: '' })
    expect(rules.length).toBeGreaterThan(0)
    expect(rules).toEqual(
      rules.map(() => ({ kind: 'CSSLayerBlockRule', names: [layer], href: '' })),
    )
  })
}

test('zl.css declares the layer order, then imports every file in css/ and nothing else', async ({
  page,
}) => {
  const [order, ...rules] = await rulesOf(page, 'zl.css')

  expect(order).toEqual({ kind: 'CSSLayerStatementRule', names: ORDER, href: '' })
  expect(rules.map((rule) => rule.kind)).toEqual(rules.map(() => 'CSSImportRule'))
  const imported = rules.map((rule) => rule.href.replace(/^\.?\//, '')).sort()
  expect(imported).toEqual(
    FILES.filter(({ path }) => path !== 'tokens.css').map(({ path }) => path),
  )
})
