import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

export interface ContractFile {
  component: string
  examples: string[]
}

const dir = join(import.meta.dirname, '../../contract')
const marker = /<!-- example: ([a-z0-9-]+) -->/g

// Read from the directory, so a new contract file is a new row with no test edit.
export const CONTRACT: ContractFile[] = existsSync(dir)
  ? readdirSync(dir)
      .filter((file) => file.endsWith('.html'))
      .sort()
      .map((file) => ({
        component: basename(file, '.html'),
        examples: [...readFileSync(join(dir, file), 'utf8').matchAll(marker)].flatMap(
          (match) => match[1] ?? [],
        ),
      }))
  : []
