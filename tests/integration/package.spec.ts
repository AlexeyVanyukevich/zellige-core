import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'

const root = join(import.meta.dirname, '../..')

// What the package exists to ship, read from the directories, so a new component is a new row.
const SHIPPED = [
  'tokens.css',
  'ui.css',
  ...readdirSync(join(root, 'css')).map((file) => `css/${file}`),
  ...readdirSync(join(root, 'contract')).map((file) => `contract/${file}`),
].sort()

// npm puts these in every package, whatever `files` says.
const ALWAYS = new Set(['package.json', 'README.md'])

test('the package ships the tokens, the stylesheets and the contract, and nothing else', () => {
  const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8',
    }),
  ) as { files: { path: string }[] }[]

  const files = (pack?.files ?? [])
    .map(({ path }) => path)
    .filter((path) => !ALWAYS.has(path))
    .sort()
  expect(files).toEqual(SHIPPED)
})

for (const path of SHIPPED) {
  test(`@zellige/core/${path} resolves to ${path}`, () => {
    expect(import.meta.resolve(`@zellige/core/${path}`)).toBe(pathToFileURL(join(root, path)).href)
  })
}
