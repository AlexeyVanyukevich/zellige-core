import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const root = join(import.meta.dirname, '../..')

const read = (path: string): string => readFileSync(join(root, path), 'utf8')

const { release } = JSON.parse(read('charter.json')) as { release?: { files?: string[] } }
const { version } = JSON.parse(read('package.json')) as { version: string }

// A missing list reads as empty, so it fails the test below instead of the file's loading.
const files = release?.files ?? []

test('charter.json lists the files a release bumps', () => {
  expect(files.length).toBeGreaterThan(0)
})

for (const path of files) {
  test(`${path} holds the version package.json holds`, () => {
    expect(read(path), `${path} does not hold ${version}`).toContain(version)
  })
}
