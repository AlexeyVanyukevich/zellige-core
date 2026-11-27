import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { architectureParseRows, contractRows, countWords, parseRows } from './components.data.js'

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
    expect(rowFiles, `${file} has no row in components.data.ts`).toContain(file)
  }
  for (const row of contractRows) {
    expect(files, `the row for ${row.file} has no file in contract/`).toContain(row.file)
  }
})

test("the README's opening paragraph lists the dataset's names", () => {
  const listed = parseList(readFileSync(join(root, 'README.md'), 'utf8')).sort()
  const expected = contractRows.map((row) => row.readme).sort()
  expect(listed).toEqual(expected)
})

// The count word and the names in the component sentence of docs/architecture.md.
function parseArchitecture(text: string): { count: string; names: string[] } {
  const paragraphs: string[][] = [[]]
  for (const line of text.split('\n')) {
    if (line.trim() === '') paragraphs.push([])
    else paragraphs[paragraphs.length - 1]?.push(line)
  }
  const found: { count: string; names: string[] }[] = []
  for (const lines of paragraphs) {
    const joined = lines.join(' ').replace(/\s+/g, ' ')
    const match = /^Version \S+ holds (\S+) components — (.+?) — /.exec(joined)
    if (match?.[1] !== undefined && match[2] !== undefined) {
      found.push({ count: match[1], names: match[2].split(', ') })
    }
  }
  const [first] = found
  if (first === undefined) throw new Error('no paragraph holds the component sentence')
  if (found.length > 1) throw new Error('more than one paragraph holds the component sentence')
  return first
}

for (const row of architectureParseRows) {
  test(`parseArchitecture reads ${row.title}`, () => {
    if (row.error !== undefined) {
      expect(() => parseArchitecture(row.text)).toThrow(row.error)
    } else {
      expect(parseArchitecture(row.text)).toEqual(row.result)
    }
  })
}

const architecture = () => readFileSync(join(root, 'docs/architecture.md'), 'utf8')

test("the architecture's component sentence lists the dataset's names", () => {
  const listed = parseArchitecture(architecture()).names.sort()
  const expected = contractRows.map((row) => row.architecture).sort()
  expect(listed).toEqual(expected)
})

test("the architecture's count word is the number of files in contract/", () => {
  const number = readdirSync(join(root, 'contract')).filter((file) => file.endsWith('.html')).length
  const row = countWords.find((entry) => entry.count === number)
  if (row === undefined) throw new Error(`contract/ holds ${number} files: countWords needs a row`)
  expect(parseArchitecture(architecture()).count).toBe(row.word)
})
