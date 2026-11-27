export interface ContractRow {
  file: string
  readme: string
  architecture: string
}

// One row per file in contract/, written by hand: the file and its display name in the README
// and in docs/architecture.md.
export const contractRows: ContractRow[] = [
  { file: 'badge.html', readme: 'Badge', architecture: 'Badge' },
  { file: 'button.html', readme: 'Button', architecture: 'Button' },
  { file: 'card.html', readme: 'Card', architecture: 'Card' },
  { file: 'checkbox.html', readme: 'Checkbox', architecture: 'the checkbox' },
  { file: 'dialog.html', readme: 'Dialog', architecture: 'Dialog' },
  { file: 'field.html', readme: 'Field', architecture: 'Field' },
  { file: 'notice.html', readme: 'Notice', architecture: 'Notice' },
  { file: 'prose.html', readme: 'Prose', architecture: 'Prose' },
  { file: 'radio.html', readme: 'Radio group', architecture: 'the radio group' },
  { file: 'status.html', readme: 'Empty / Loading / Trouble', architecture: 'the status states' },
  { file: 'tabs.html', readme: 'Tabs', architecture: 'Tabs' },
]

export interface ParseRow {
  title: string
  text: string
  names?: string[]
  error?: string
}

export const parseRows: ParseRow[] = [
  {
    title: 'a list ending "X and Y."',
    text: '# T\n\nA kit: One, Two and Three. More.\n',
    names: ['One', 'Two', 'Three'],
  },
  {
    title: 'a name broken across two lines',
    text: '# T\n\nA kit: One, Radio\ngroup, Two and Three. More.\n\nOther.\n',
    names: ['One', 'Radio group', 'Two', 'Three'],
  },
  {
    title: 'a name holding " / "',
    text: '# T\n\nA kit: One, Empty / Loading, Two and Three.\n',
    names: ['One', 'Empty / Loading', 'Two', 'Three'],
  },
  {
    title: 'a list of two names',
    text: '# T\n\nA kit: One and Two.\n',
    names: ['One', 'Two'],
  },
  {
    title: 'a paragraph with no "kit: "',
    text: '# T\n\nNo list here. One, Two and Three.\n',
    error: 'kit: ',
  },
  {
    title: 'nothing after "kit: "',
    text: '# T\n\nA kit: \n\nNext.\n',
    error: 'nothing follows',
  },
  {
    title: 'a list with no closing "."',
    text: '# T\n\nA kit: One, Two and Three\n\nNext.\n',
    error: 'closing',
  },
]

export interface CountWord {
  word: string
  count: number
}

// The words one to twenty, written by hand: the count word in docs/architecture.md is read here.
export const countWords: CountWord[] = [
  { word: 'one', count: 1 },
  { word: 'two', count: 2 },
  { word: 'three', count: 3 },
  { word: 'four', count: 4 },
  { word: 'five', count: 5 },
  { word: 'six', count: 6 },
  { word: 'seven', count: 7 },
  { word: 'eight', count: 8 },
  { word: 'nine', count: 9 },
  { word: 'ten', count: 10 },
  { word: 'eleven', count: 11 },
  { word: 'twelve', count: 12 },
  { word: 'thirteen', count: 13 },
  { word: 'fourteen', count: 14 },
  { word: 'fifteen', count: 15 },
  { word: 'sixteen', count: 16 },
  { word: 'seventeen', count: 17 },
  { word: 'eighteen', count: 18 },
  { word: 'nineteen', count: 19 },
  { word: 'twenty', count: 20 },
]

export interface ArchitectureParseRow {
  title: string
  text: string
  result?: { count: string; names: string[] }
  error?: string
}

export const architectureParseRows: ArchitectureParseRow[] = [
  {
    title: 'the real shape, with a name broken across two lines',
    text: '# T\n\nVersion 0.5.0 holds eleven components — Button, the status\nstates, Prose — the tokens and the base layer. It ships no JavaScript.\n\nOther.\n',
    result: { count: 'eleven', names: ['Button', 'the status states', 'Prose'] },
  },
  {
    title: 'a version other than 0.5.0',
    text: 'Version 12.30.1-rc.1 holds three components — One, Two, Three — the tokens.\n',
    result: { count: 'three', names: ['One', 'Two', 'Three'] },
  },
  {
    title: 'no matching paragraph',
    text: '# T\n\nNothing here.\n',
    error: 'no paragraph',
  },
  {
    title: 'two matching paragraphs',
    text: 'Version 1.0.0 holds one components — One — x.\n\nVersion 1.0.0 holds two components — One, Two — y.\n',
    error: 'more than one',
  },
  {
    title: 'a sentence with no closing " — "',
    text: 'Version 1.0.0 holds two components — One, Two.\n',
    error: 'no paragraph',
  },
]
