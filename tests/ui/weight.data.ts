// How to find, in the playground showing one component alone, an element whose computed
// `font-weight` is 600. By role and accessible name, or by its text where it has no role.
export type Locate =
  { by: 'role'; role: 'button' | 'tab' | 'heading'; name: string } | { by: 'text'; text: string }

export interface WeightRow {
  /** The file in `css/` and the playground's `?component=`. */
  component: string
  locate: Locate
  /** A dialog example to open first, when the element is inside a closed dialog. */
  open?: string
}

export const WEIGHTS: readonly WeightRow[] = [
  { component: 'button', locate: { by: 'role', role: 'button', name: 'Cancel' } },
  { component: 'field', locate: { by: 'text', text: 'Name' } },
  { component: 'badge', locate: { by: 'text', text: 'Draft' } },
  { component: 'notice', locate: { by: 'text', text: 'Booking saved' } },
  {
    component: 'dialog',
    locate: { by: 'role', role: 'heading', name: 'New booking' },
    open: 'center',
  },
  { component: 'tabs', locate: { by: 'role', role: 'tab', name: 'Spec' } },
  { component: 'status', locate: { by: 'text', text: "Couldn't load the issues" } },
  { component: 'radio', locate: { by: 'text', text: 'Retries' } },
  { component: 'checkbox', locate: { by: 'text', text: 'Accept the terms to continue' } },
  { component: 'prose', locate: { by: 'role', role: 'heading', name: 'Booking a cabin' } },
]
