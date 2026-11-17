export type Kind = 'input' | 'select' | 'textarea'

export interface HoverRow {
  name: string
  kind: Kind
  /** The playground example holding the control, by its caption. */
  example: string
  /** The control's role where it is not the kind's usual one: the plain input is a search box. */
  role?: 'searchbox'
  /** Set on the control before the check, for the examples the contract holds only valid. */
  makeInvalid: boolean
  /** Reached by Tab, so the control matches `:focus-visible` while the pointer hovers it. */
  keyboardFocused: boolean
  /** The token the border colour must resolve to. */
  expected: '--zl-danger' | '--zl-ink-faint' | '--zl-line-strong'
}

export const ROLES: Record<Kind, 'textbox' | 'combobox' | 'searchbox'> = {
  input: 'textbox',
  select: 'combobox',
  textarea: 'textbox',
}

export const ROWS: readonly HoverRow[] = [
  {
    name: 'an invalid input, hovered, keeps the danger border',
    kind: 'input',
    example: 'field with error',
    makeInvalid: false,
    keyboardFocused: false,
    expected: '--zl-danger',
  },
  {
    name: 'an invalid select, hovered, keeps the danger border',
    kind: 'select',
    example: 'field with select',
    makeInvalid: true,
    keyboardFocused: false,
    expected: '--zl-danger',
  },
  {
    name: 'an invalid textarea, hovered, keeps the danger border',
    kind: 'textarea',
    example: 'field with textarea',
    makeInvalid: true,
    keyboardFocused: false,
    expected: '--zl-danger',
  },
  {
    name: 'a valid input, hovered, shows the faint border',
    kind: 'input',
    example: 'input',
    role: 'searchbox',
    makeInvalid: false,
    keyboardFocused: false,
    expected: '--zl-ink-faint',
  },
  {
    name: 'a valid select, hovered, shows the faint border',
    kind: 'select',
    example: 'select',
    makeInvalid: false,
    keyboardFocused: false,
    expected: '--zl-ink-faint',
  },
  {
    name: 'a valid textarea, hovered, shows the faint border',
    kind: 'textarea',
    example: 'textarea',
    makeInvalid: false,
    keyboardFocused: false,
    expected: '--zl-ink-faint',
  },
  {
    name: 'an invalid input, focused by keyboard then hovered, keeps the neutral border',
    kind: 'input',
    example: 'field with error',
    makeInvalid: false,
    keyboardFocused: true,
    expected: '--zl-line-strong',
  },
  {
    name: 'an invalid select, focused by keyboard then hovered, keeps the neutral border',
    kind: 'select',
    example: 'field with select',
    makeInvalid: true,
    keyboardFocused: true,
    expected: '--zl-line-strong',
  },
  {
    name: 'an invalid textarea, focused by keyboard then hovered, keeps the neutral border',
    kind: 'textarea',
    example: 'field with textarea',
    makeInvalid: true,
    keyboardFocused: true,
    expected: '--zl-line-strong',
  },
]
