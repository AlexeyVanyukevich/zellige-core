# Checkbox — design

Status: **built**, 2026-11-18; approved and designed 2026-11-18.

> **This becomes a decision record once the slice ships.**
>
> It states what was decided before any of it was built, and is not revised after. Read it to
> learn **why** the checkbox has the shape it has. For **what** the kit does today, read
> `docs/architecture.md`, which the slice's last task updates.

The [kit's design](2026-10-14-zellige-core-design.md) and the [radio group's](2026-10-22-radio-group-design.md)
hold for everything this one does not mention. This document adds one component to the kit: a
two-state native checkbox, for the binding's `Checkbox` to render.

## 1. Why

The binding needs a checkbox, and it renders the kit's reference markup exactly. The kit has none:
no `contract/checkbox.html` and no `css/checkbox.css`. A hand-written page has none either.

### Success criteria

- `contract/checkbox.html` holds the checkbox in every state and passes the checks every contract
  file passes.
- The binding can render it exactly from React Aria's `useCheckbox` and `useToggleState`, with no
  attribute it would have to remove.
- Each checkbox's accessible name is its label's text alone; its description is its description.

## 2. Measured before design

On 2026-11-18, React 19 with `react-dom`, `react-aria` 3.53.1, `react-stately` 3.51.0 and jsdom
rendered `useCheckbox` with `useToggleState` in a scratch directory that is not committed. The
hooks' props were spread onto a plain `input` inside a `label`, as the binding's contract test
renders. The description and error were rendered twice: once with the hooks' `descriptionProps`
and `errorMessageProps` spread on them, and once with given ids passed to the hook as
`aria-describedby`. The second run was React 19.3.1 and jsdom 30.1.3. After mount:

| Example     | Input attributes, in the order the hooks wrote them                                          |
| ----------- | -------------------------------------------------------------------------------------------- |
| `plain`     | `data-react-aria-pressable="true"` `tabindex="0"` `type="checkbox"`                          |
| `checked`   | the same, plus `checked`                                                                     |
| `described` | `aria-describedby="<description id>"`, then the same three                                   |
| `invalid`   | `aria-describedby="<description id> <error id>"`, `aria-invalid="true"`, then the same three |
| `disabled`  | `disabled`, `data-react-aria-pressable="true"`, `type="checkbox"`: no `tabindex`             |

1. **The hooks hand out props for the description and the error.** `useCheckbox` returns
   `descriptionProps` and `errorMessageProps`, each an `id` and a `ref`. The id takes effect only
   once the element it is spread on mounts; the input's `aria-describedby` then names the
   description, then the error, then any `aria-describedby` passed in. Spread on both, they gave
   `aria-describedby="react-aria…-_r_0_ react-aria…-_r_1_"`. Not spread, with given ids passed
   in, the input named exactly those ids. Either way the order is the description, then the error,
   and the contract records it.
2. **The description's and the error's ids are generated** when the binding spreads the props.
   The contract uses given `checkbox-` ids in their place, as the radio group's does; the input
   itself has no id.
3. **The input is native and visible**: no `role`, no inline style, no hidden input.
4. **`tabindex="0"` is on every enabled input.** On a natively focusable input it changes nothing:
   the checkbox is one Tab stop either way. A disabled input has none. The contract records it,
   as the radio group's does.
5. **`data-react-aria-pressable="true"`** is on every input, and on the `<label>` the hooks'
   `labelProps` are spread on. It marks React Aria's own press handling, the kit styles nothing by
   it, and it means nothing on a page without React Aria. The contract leaves it out, as the radio
   group's does for the same attribute from `useRadio`; the binding's contract test ignores every
   `data-` attribute.
6. **Server rendering** lists description and error ids that may not be rendered; the contract is
   the markup after mount.

React Aria's own `useCheckbox` examples put the description inside the `<label>`. Here it sits
outside (§3), so the name is the label's text alone.

## 3. The markup

```html
<div class="zl-checkbox">
  <label class="zl-checkbox__label">
    <input
      class="zl-checkbox__input"
      type="checkbox"
      aria-describedby="checkbox-invalid-description checkbox-invalid-error"
      aria-invalid="true"
      tabindex="0"
    />
    Send me the digest
  </label>
  <p class="zl-checkbox__description" id="checkbox-invalid-description">Once a week</p>
  <p class="zl-checkbox__error" id="checkbox-invalid-error">Confirm to continue</p>
</div>
```

- **One `div.zl-checkbox`** per checkbox, holding the `<label>` around the input and its text,
  then the description and the error, outside the label.
- **The input is native and visible**, coloured with `accent-color`: the platform draws the tick,
  a shape and not only a colour, and forced colours keep it.
- **States are attributes**: `checked`, `disabled`, `aria-invalid="true"`. Never a class.
- **Ids** start with `checkbox-` and are unique across `contract/`. The contract uses given ids
  where a binding would generate them.

## 4. The CSS

`css/checkbox.css`, in `zl.components`, imported by `zl.css` directly after `radio.css`.

- **The label** is a row at least `--zl-tap` high, the input and the text aligned to the first
  line, `gap: var(--zl-space-2)`, `--zl-ink`, `cursor: pointer`.
- **The input** is 1.125em square, `margin: 0`, `accent-color: var(--zl-accent)`.
- **The description** is `--zl-text-sm` in `--zl-ink-faint`; **the error** is `--zl-text-sm` in
  `--zl-danger` at weight 600. Both start under the label's text, not under the input.
- **Invalid**: a `.zl-checkbox` whose input has `aria-invalid='true'`, selected with `:has()`,
  draws a 2px solid `--zl-danger` rule along its inline start, with `--zl-space-3` of padding
  after it, as the radio group's invalid rule does. The error's text carries the meaning; the
  rule is not the only signal.
- **Disabled**: a `.zl-checkbox` whose input is `:disabled` draws its label in `--zl-ink-faint`
  with `cursor: not-allowed`.
- **Focus** is the base layer's `:focus-visible` ring, in `--zl-focus`, invalid or not. Only
  `.zl-input`, `.zl-select` and `.zl-textarea` ring in `--zl-danger`, by the invalid-focus
  decision: those controls change their border to show invalid, and a ring in the same colour
  would hide it. A checkbox's border does not change; its rule is on the wrapper, and the ring
  stays the one every other element has.

No new token, no `!important`, no `outline: none`.

## 5. The contract file

`contract/checkbox.html`, ids prefixed `checkbox-`:

| Example     | Holds                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `plain`     | A label alone, unticked                                                             |
| `checked`   | A label, the input `checked`                                                        |
| `described` | A label and a description                                                           |
| `invalid`   | A label, a description and an error; `aria-describedby` names the description first |
| `disabled`  | A label, the input `disabled`                                                       |

## 6. Accessibility

**Focus order.** Each enabled checkbox is one Tab stop, in DOM order. Space toggles it. A disabled
checkbox is skipped. The kit moves no focus.

**Accessible names.**

| Element  | Name                                        |
| -------- | ------------------------------------------- |
| Checkbox | The text of its `<label>`, and nothing else |

**States, and how each is announced.**

| State     | Markup                                                       | Announced                                             |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Checked   | `checked`                                                    | As checked, from the native control                   |
| Described | `aria-describedby` its description                           | After its name, on focus                              |
| Invalid   | `aria-invalid="true"`; `aria-describedby` description, error | As invalid, then the description and the error's text |
| Disabled  | `disabled`                                                   | As unavailable, from the native control               |

**What an error does.** As a field's: the error is text, tied by `aria-describedby`, so colour is
never the only signal, and the kit moves no focus. An application that refuses a submit sends focus
to the first invalid checkbox.

## 7. Testing

The datasets read the directories, so the new file is new rows in `scan.spec.ts`,
`screenshots.spec.ts`, `layers.spec.ts` and `package.spec.ts`, and `focus.spec.ts` walks the new
section, with no edit to them. In addition `checkbox.spec.ts` (new): a keyboard journey in the
first theme, names and descriptions by role, and a typed dataset of the inline-start border of
the `invalid` and `plain` wrappers and the disabled label's colour, in every theme. Screenshots
are made with `./run test --update-snapshots -g checkbox`.

## 8. Releasing

A new contract file and classes: a minor version, `0.4.0`. The release also carries the invalid
field focus change already on `main`. The owner tags and pushes.

## 9. Not in scope

An indeterminate state, a checkbox group, a switch, a box drawn by the kit; the binding's
`Checkbox`; a `--zl-danger` ring on the checkbox.

## 10. Unproven

- **Screen readers, WebKit, 200% zoom and a 320 px viewport**: not tried, as for the rest of the
  kit (`docs/architecture.md`).
- **`:has()` for the invalid rule** is run in Chromium only.
