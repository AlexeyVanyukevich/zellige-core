// The cases `layout.spec.ts` reads. A case is a row, so more coverage is a row, not a new test.

export interface LayoutRow {
  component: string
  /** The component's markup; `id` keeps ids unique across the page's two copies. */
  markup: (id: string) => string
  /** Selector for the component's child elements, each measured against the component's top. */
  children: string
  /** Where the component's rows sit in a taller grid row: at the top, or centred in the space. */
  alignment: 'start' | 'center'
}

export const LAYOUTS: LayoutRow[] = [
  {
    component: 'field',
    alignment: 'start',
    children: ':scope > *',
    markup: (id) => `<div class="zl-field">
  <label class="zl-field__label" for="${id}-input">Email</label>
  <input class="zl-input" id="${id}-input" type="email" aria-describedby="${id}-hint" />
  <p class="zl-field__hint" id="${id}-hint">We never share it</p>
</div>`,
  },
  {
    component: 'radio group',
    alignment: 'start',
    children: ':scope > *',
    markup: (
      id,
    ) => `<div class="zl-radio-group" role="radiogroup" aria-orientation="vertical" aria-labelledby="${id}-label">
  <span class="zl-radio-group__label" id="${id}-label">Retries</span>
  <div class="zl-radio">
    <label class="zl-radio__label">
      <input class="zl-radio__input" type="radio" name="${id}-retries" value="three" tabindex="0" />
      Three times
    </label>
  </div>
  <div class="zl-radio">
    <label class="zl-radio__label">
      <input class="zl-radio__input" type="radio" name="${id}-retries" value="five" tabindex="0" />
      Five times
    </label>
  </div>
</div>`,
  },
  {
    component: 'checkbox',
    alignment: 'start',
    children: ':scope > *',
    markup: (id) => `<div class="zl-checkbox">
  <label class="zl-checkbox__label">
    <input class="zl-checkbox__input" type="checkbox" aria-describedby="${id}-description" tabindex="0" />
    Send the digest
  </label>
  <p class="zl-checkbox__description" id="${id}-description">Once a week</p>
</div>`,
  },
  {
    component: 'notice',
    alignment: 'start',
    children: ':scope > *',
    markup: () => `<div class="zl-notice" role="status">
  <p class="zl-notice__title">Booking saved</p>
  <div class="zl-notice__body"><p>It is on the calendar for 12 to 14 October.</p></div>
</div>`,
  },
]
