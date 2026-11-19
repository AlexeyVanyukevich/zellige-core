// The cases `layout.spec.ts` reads. A case is a row, so more coverage is a row, not a new test.

export interface LayoutRow {
  component: string
  /** The component's markup; `id` keeps ids unique across the page's two copies. */
  markup: (id: string) => string
  /** Selector for the component's child elements, each measured against the component's top. */
  children: string
}

export const LAYOUTS: LayoutRow[] = [
  {
    component: 'field',
    children: ':scope > *',
    markup: (id) => `<div class="zl-field">
  <label class="zl-field__label" for="${id}-input">Email</label>
  <input class="zl-input" id="${id}-input" type="email" aria-describedby="${id}-hint" />
  <p class="zl-field__hint" id="${id}-hint">We never share it</p>
</div>`,
  },
  {
    component: 'radio group',
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
    children: ':scope > *',
    markup: (id) => `<div class="zl-checkbox">
  <label class="zl-checkbox__label">
    <input class="zl-checkbox__input" type="checkbox" aria-describedby="${id}-description" tabindex="0" />
    Send the digest
  </label>
  <p class="zl-checkbox__description" id="${id}-description">Once a week</p>
</div>`,
  },
]
