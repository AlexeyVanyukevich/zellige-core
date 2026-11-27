export interface ContractRow {
  file: string
  name: string
}

// One row per file in contract/, written by hand: the file and its display name in the README.
export const contractRows: ContractRow[] = [
  { file: 'badge.html', name: 'Badge' },
  { file: 'button.html', name: 'Button' },
  { file: 'card.html', name: 'Card' },
  { file: 'checkbox.html', name: 'Checkbox' },
  { file: 'dialog.html', name: 'Dialog' },
  { file: 'field.html', name: 'Field' },
  { file: 'notice.html', name: 'Notice' },
  { file: 'prose.html', name: 'Prose' },
  { file: 'radio.html', name: 'Radio group' },
  { file: 'status.html', name: 'Empty / Loading / Trouble' },
  { file: 'tabs.html', name: 'Tabs' },
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
