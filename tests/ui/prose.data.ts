// The cases `prose.spec.ts` reads. A case is a row, so more coverage is a row, not a new test.

/** The `--zl-text` the heading page sets, so each multiple resolves to a known size. */
export const TEXT_PX = 15

export interface HeadingRow {
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** The expected size in px, written as its multiple of `--zl-text` or the token it is. */
  size: string
  px: number
}

// In descending order: each level is smaller than the one before.
export const HEADINGS: HeadingRow[] = [
  { level: 1, size: '1.6 × --zl-text', px: TEXT_PX * 1.6 },
  { level: 2, size: '1.4 × --zl-text', px: TEXT_PX * 1.4 },
  { level: 3, size: '1.25 × --zl-text', px: TEXT_PX * 1.25 },
  { level: 4, size: '1.125 × --zl-text', px: TEXT_PX * 1.125 },
  { level: 5, size: '--zl-text', px: TEXT_PX },
  { level: 6, size: '--zl-text-sm', px: 13 },
]

/** The contract's examples, in order, each one `.zl-prose`. */
export const EXAMPLES: string[] = ['document', 'wide-table', 'long-code-line']

export interface NestedRow {
  name: string
  /** The component's markup, around a label. */
  html: (label: string) => string
  /** One unbroken word, wider than the 160px container. */
  label: string
}

export const NESTED: NestedRow[] = [
  {
    name: 'button link',
    html: (label) => `<a class="zl-button" href="#">${label}</a>`,
    label: 'Supercalifragilisticexpialidocious_and_then_some',
  },
  {
    name: 'badge',
    html: (label) => `<span class="zl-badge">${label}</span>`,
    label: 'Draft',
  },
]

/** What a nested component must compute the same inside prose as outside. */
export const SAME: string[] = ['color', 'textDecorationLine', 'fontSize', 'margin', 'overflowWrap']

export interface WrapperRow {
  example: string
  name: 'Table' | 'Code block'
}

export const WRAPPERS: WrapperRow[] = [
  { example: 'wide-table', name: 'Table' },
  { example: 'long-code-line', name: 'Code block' },
]
