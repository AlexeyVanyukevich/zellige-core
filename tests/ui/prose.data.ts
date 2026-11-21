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
export const EXAMPLES: string[] = [
  'document',
  'wide-table',
  'long-code-line',
  'footnotes',
  'task-list',
]

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

export interface ReferenceRow {
  name: string
  id: string
}

/** The footnote references of the `footnotes` example, in document order. */
export const REFERENCES: ReferenceRow[] = [
  { name: 'Footnote 1', id: 'prose-footnotes-fnref-1' },
  { name: 'Footnote 2', id: 'prose-footnotes-fnref-2' },
  { name: 'Footnote 1', id: 'prose-footnotes-fnref-1-2' },
]

export interface BackLinkRow {
  name: string
  href: string
  /** The note's `li` id the link sits in. */
  note: string
  sup: boolean
}

export const BACK_LINKS: BackLinkRow[] = [
  {
    name: 'Back to reference 1',
    href: '#prose-footnotes-fnref-1',
    note: 'prose-footnotes-fn-1',
    sup: false,
  },
  {
    name: 'Back to reference 1-2',
    href: '#prose-footnotes-fnref-1-2',
    note: 'prose-footnotes-fn-1',
    sup: true,
  },
  {
    name: 'Back to reference 2',
    href: '#prose-footnotes-fnref-2',
    note: 'prose-footnotes-fn-2',
    sup: false,
  },
]

export interface StepRow {
  name: string
  done: boolean
}

/** The seven steps of the `task-list` example, in document order. */
export const STEPS: StepRow[] = [
  { name: 'Pack warm clothes', done: true },
  { name: 'Bring food for the stay', done: false },
  { name: 'Set the arrival date', done: false },
  { name: 'Book the cabin', done: true },
  { name: 'Pay the deposit', done: false },
  { name: 'Choose the dates', done: true },
  { name: 'Confirm the guests', done: false },
]

/** The first-level children of the example's `.zl-prose`, in order. */
export const TASK_LISTS: string[] = ['UL', 'UL', 'OL']

/** Text long enough to wrap in a 200px container, with inline code. */
export const LONG_STEP =
  'Check the <code>arrival</code> date, then bring dry firewood and warm clothes for every guest'

export interface ImageRow {
  name: string
  where: 'paragraph' | 'table cell' | 'layout table cell'
  width: number
  height: number
  /** `container`: the image is as wide as the prose content; `own`: it keeps its attributes. */
  renders: 'container' | 'own'
}

/** Where an image sits in prose, and the size it renders at in a 320px viewport. */
export const IMAGES: ImageRow[] = [
  { name: 'a wide image', where: 'paragraph', width: 800, height: 400, renders: 'container' },
  { name: 'a narrow image', where: 'paragraph', width: 100, height: 50, renders: 'own' },
  { name: 'a table-cell image', where: 'table cell', width: 800, height: 400, renders: 'own' },
  {
    name: 'a layout-table image',
    where: 'layout table cell',
    width: 800,
    height: 400,
    renders: 'container',
  },
]

export interface DelResetRow {
  name: string
  /** CSS passed to `openFixture` as `style`; empty for none. */
  style: string
  /** The `del`'s computed `text-decoration-line`. */
  expected: string
}

/** Prose's line-through against a reset in `zl.base` (loses) and an unlayered one (wins). */
export const DEL_RESETS: DelResetRow[] = [
  { name: 'no extra style', style: '', expected: 'line-through' },
  {
    name: 'a zl.base reset',
    style: '@layer zl.base { del { text-decoration-line: none } }',
    expected: 'line-through',
  },
  {
    name: 'an unlayered reset',
    style: 'del { text-decoration-line: none }',
    expected: 'none',
  },
]
