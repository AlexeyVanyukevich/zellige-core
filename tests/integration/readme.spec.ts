import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { contractRows, parseRows } from './readme.data.js'

const root = join(import.meta.dirname, '../..')

// The names in the component list of the README's opening paragraph.
function parseList(readme: string): string[] {
  const lines = readme.split('\n')
  const heading = lines.findIndex((line) => line.startsWith('# '))
  const rest = lines.slice(heading + 1)
  const start = rest.findIndex((line) => line.trim() !== '')
  const paragraph: string[] = []
  for (const line of start === -1 ? [] : rest.slice(start)) {
    if (line.trim() === '') break
    paragraph.push(line)
  }
  const text = paragraph.join(' ').replace(/\s+/g, ' ')
  const marker = text.indexOf('kit: ')
  if (marker === -1) throw new Error('the opening paragraph has no "kit: "')
  const after = text.slice(marker + 'kit: '.length)
  if (after.trim() === '') throw new Error('nothing follows "kit: " in the opening paragraph')
  const end = after.indexOf('.')
  if (end === -1) throw new Error('the component list has no closing "."')
  const items = after.slice(0, end).split(', ')
  const last = items.pop() ?? ''
  return [...items, ...last.split(' and ')]
}

for (const row of parseRows) {
  test(`parseList reads ${row.title}`, () => {
    if (row.error !== undefined) {
      expect(() => parseList(row.text)).toThrow(row.error)
    } else {
      expect(parseList(row.text)).toEqual(row.names)
    }
  })
}

test('contract/ and the dataset hold the same files', () => {
  const files = readdirSync(join(root, 'contract')).filter((file) => file.endsWith('.html'))
  const rowFiles = contractRows.map((row) => row.file)
  for (const file of files) {
    expect(rowFiles, `${file} has no row in readme.data.ts`).toContain(file)
  }
  for (const row of contractRows) {
    expect(files, `the row for ${row.file} has no file in contract/`).toContain(row.file)
  }
})

test("the README's opening paragraph lists the dataset's names", () => {
  const listed = parseList(readFileSync(join(root, 'README.md'), 'utf8')).sort()
  const expected = contractRows.map((row) => row.name).sort()
  expect(listed).toEqual(expected)
})
