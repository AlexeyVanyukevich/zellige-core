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
  {
    component: 'tabs',
    alignment: 'start',
    children: ':scope > *',
    markup: (id) => `<div class="zl-tabs">
  <div class="zl-tabs__list" id="${id}-tabs" role="tablist" aria-label="Card" aria-orientation="horizontal">
    <button type="button" class="zl-tabs__tab" role="tab" id="${id}-tab-spec" aria-controls="${id}-panel-spec" aria-selected="true" tabindex="0">Spec</button>
    <button type="button" class="zl-tabs__tab" role="tab" id="${id}-tab-plan" aria-selected="false" tabindex="-1">Plan</button>
  </div>
  <div class="zl-tabs__panel" role="tabpanel" id="${id}-panel-spec" aria-labelledby="${id}-tab-spec" tabindex="0">
    <p>The design, written and approved before any code.</p>
  </div>
</div>`,
  },
  {
    component: 'empty',
    alignment: 'center',
    children: ':scope > *',
    markup: () => `<div class="zl-empty">
  <p class="zl-empty__title">No open issues</p>
  <div class="zl-empty__body"><p>New issues appear here as they arrive.</p></div>
</div>`,
  },
  {
    component: 'trouble',
    alignment: 'center',
    children: ':scope > *',
    markup: () => `<div class="zl-trouble" role="alert">
  <p class="zl-trouble__title">Couldn't load the issues</p>
  <p class="zl-trouble__detail">The server did not answer. Check the connection and try again.</p>
  <button type="button" class="zl-button">Retry</button>
</div>`,
  },
]
