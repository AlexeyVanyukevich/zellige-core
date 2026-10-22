# Radio group — design

Status: **built**, 2026-10-22; approved and designed 2026-10-22.

> **This becomes a decision record once the slice ships.**
>
> It states what was decided before any of it was built, and is not revised after. Read it to
> learn **why** the radio group has the shape it has. For **what** the kit does today, read
> `docs/architecture.md`, which the slice's last task updates.

The [kit's design](2026-10-14-zellige-core-design.md) holds for everything this one does not
mention: its layers, tokens, contract conventions, playground and checks. This document adds one
component to it.

Roles, as in `docs/architecture.md`: **the binding** is `@zellige/react`, in its own repository,
which has a design of its own for this component; **an application** is anything that installs
the kit. And **the asking application** is the one this component is added for: a board on which
an agent asks its owner several questions at once, each answered by choosing one of a few
options, all sent with one button.

---

## 1. Why

The asking application shows up to eight questions on one form. Each has up to five options, and
each option a sentence saying what choosing it would mean. The owner picks one option per
question, or writes an answer instead, and sends the form once.

The kit has no control for one choice among a few described options. A Select hides the options
and their descriptions until opened; a row of Buttons sends at the first press. Every
application that adds the kit forbids itself from writing a widget the kit lacks, so the radio
group is added here, and the binding then adds its behaviour.

### Success criteria

- `contract/radio.html` holds the group in every state, and passes the checks every contract
  file passes: html-validate, `charter scan`, axe in every theme, the focus ring on every Tab
  stop, the layers, the package's files.
- The binding can render it exactly from React Aria's `useRadioGroup` and `useRadio`, with no
  attribute it would have to remove.
- Each radio's accessible name is its label alone; its description is its description.

## 2. Measured before design

On 2026-10-22, `react-aria` 3.53.1 and `react-stately` 3.51.0 — the binding's pinned versions —
rendered in jsdom with React 19, the hooks' props spread onto plain elements, as the binding's
contract test renders. After mount:

1. **The group** is a `div` with `role="radiogroup"`, `aria-orientation="vertical"`, an `id`,
   `aria-labelledby` its label, and `aria-describedby` its description and its error — only
   those rendered. Invalid adds `aria-invalid="true"`; disabled, `aria-disabled="true"`.
2. **Each radio** is a native `input type="radio"` with `value` and `name`. Its
   `aria-describedby` lists its own description, then the group's error, then the group's
   description, again only those rendered.
3. **Its `tabindex`:** `0` on every radio while none is checked; once one is, `0` on it and `-1`
   on the rest. A disabled radio has `disabled` and no `tabindex`.
4. **`name`** is generated unless the group is given one, which it then uses as given.
5. **Where the hooks' own components put things differs from what this kit wants**, in two
   places. React Aria's `useRadio` returns props for a `<label>` around the input; a description
   placed inside it joins the radio's accessible name — "Five Slower but surer" — so this design
   places it outside (§3). And React Aria's own examples hide the input with an inline style and
   draw a radio themselves; this design keeps the native input visible (§3).

Server rendering lists description and error ids that are not rendered; they are removed after
mount. The contract is the markup after mount.

## 3. The markup

```html
<div
  class="zl-radio-group"
  role="radiogroup"
  aria-orientation="vertical"
  id="radio-checked"
  aria-labelledby="radio-checked-label"
  aria-describedby="radio-checked-description"
>
  <span class="zl-radio-group__label" id="radio-checked-label">Retries</span>
  <div class="zl-radio">
    <label class="zl-radio__label">
      <input
        class="zl-radio__input"
        type="radio"
        name="radio-checked"
        value="three"
        tabindex="-1"
        aria-describedby="radio-checked-description"
      />
      Three times
    </label>
  </div>
  <div class="zl-radio">
    <label class="zl-radio__label">
      <input
        class="zl-radio__input"
        type="radio"
        name="radio-checked"
        value="five"
        tabindex="0"
        checked
        aria-describedby="radio-checked-five-description radio-checked-description"
      />
      Five times
    </label>
    <p class="zl-radio__description" id="radio-checked-five-description">Slower, but surer</p>
  </div>
  <p class="zl-radio-group__description" id="radio-checked-description">
    How often a failed request is tried again
  </p>
</div>
```

- **A `div` with `role="radiogroup"`, not a `fieldset` and `legend`.** It is what React Aria
  renders (§2, fact 1), and the binding renders the contract exactly. Its name comes from
  `aria-labelledby`, as a `legend` would give it.
- **The label is a `span`.** A group has no single control for a `<label for>`.
- **Each radio is a `div.zl-radio`** holding the `<label>` around its input and text, and the
  description beside it, outside the label, so the name is the label's text alone (§2, fact 5).
- **The input is native and visible**, coloured with `accent-color`. It needs no drawn circle
  and no hidden input: the platform draws the checked state as a dot — a shape, not only a
  colour — and Windows' forced colours keep drawing it.
- **The order is label, radios, description, error**, as Field's is label, control, hint, error.
- **`aria-orientation="vertical"`** only: radios stack. A horizontal group is not in this slice.
- **`name` is unique on the page**: the playground puts every example on one page, and two
  examples sharing a `name` would be one group to the browser. The contract uses each example's
  `id` as its `name`.

## 4. The CSS

`css/radio.css`, in the `zl.components` layer, imported by `zl.css` after `field.css`.

- **The group** is a grid with `gap: var(--zl-space-2)` and `align-content: start`, so a group
  in a taller grid row keeps its rows together.
- **The label** looks like a field's label: `--zl-ink-soft`, `--zl-text-sm`, weight 600.
- **Each radio's label** is a row at least `--zl-tap` high, the input and the text aligned to the
  first line, `gap: var(--zl-space-2)`, `cursor: pointer`: the whole row is the target.
- **The input** is 1.125em square, `accent-color: var(--zl-accent)`, `margin: 0`. Its focus ring
  is the base layer's `:focus-visible` rule, as every focusable element's is.
- **A radio's description** is `--zl-text-sm` in `--zl-ink-faint`, indented to start under the
  label's text, not under the input.
- **The group's description and error** are a field's hint and error: `--zl-ink-faint`, and
  `--zl-danger` at weight 600.
- **Invalid** — `.zl-radio-group[aria-invalid='true']` — adds a 2px rule in `--zl-danger` along
  the inline start of the radios, as an invalid Input's border turns `--zl-danger`. The error's
  text carries the meaning; the rule is not the only signal.
- **Disabled** — `[aria-disabled='true']` on the group, `:disabled` on an input — draws the
  labels in `--zl-ink-faint` with `cursor: not-allowed`.

No new token.

## 5. The contract file

`contract/radio.html`, ids prefixed `radio-`:

| Example    | Holds                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| `plain`    | A label and three radios, none checked: every radio `tabindex="0"`               |
| `checked`  | §3: a group description, one radio with a description, the second checked        |
| `invalid`  | None checked, `aria-invalid="true"`, an error; each radio described by the error |
| `disabled` | `aria-disabled="true"` on the group, every input `disabled`, no `tabindex`       |

The architecture document's table of contract files gains the row.

## 6. Accessibility

What the radio group adds to the kit's design, §6, "Accessibility".

**Focus order.** The group is one Tab stop in the browser's own handling of native radios: Tab
reaches the checked radio, or the first when none is; the arrow keys move between radios and
check them; Tab leaves the group. With the binding, React Aria's hooks give the same model. The
kit moves no focus.

**Accessible names.**

| Element     | Name                                        |
| ----------- | ------------------------------------------- |
| Radio group | Its label, by `aria-labelledby`             |
| Radio       | The text of its `<label>`, and nothing else |

**States, and how each is announced.**

| State           | Markup                                                                | Announced                                              |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| Checked         | `checked`                                                             | As checked, from the native control                    |
| Described radio | `aria-describedby` its description                                    | After its name, on focus                               |
| Group described | `aria-describedby` on the group and on each radio                     | With the group, and after each radio's own description |
| Invalid         | `aria-invalid="true"` on the group; each radio described by the error | The error's text after each radio's name, on focus     |
| Disabled        | `aria-disabled="true"` on the group, `disabled` on each input         | As unavailable, from the native controls               |

**What an error does.** As a field's (kit design, §6): the error is text, tied by
`aria-describedby`, and the kit moves no focus. An application that refuses a submit sends focus
to the first invalid group's checked or first radio.

## 7. Testing

The datasets read the directories, so the new file is new rows in `scan.spec.ts`,
`focus.spec.ts`, `layers.spec.ts`, `screenshots.spec.ts` and `package.spec.ts` with no edit to
them. In addition:

- **`radio.spec.ts`** (new), a keyboard journey over the playground, which settles §6's first
  claim for native radios: from the element before `plain`, Tab lands on its first radio; Arrow
  Down moves focus to the second and checks it; Tab leaves the group for the next example's
  checked radio; Shift+Tab returns to the checked radio in `plain`.
- **Screenshots**, made with `./run test --update-snapshots` and looked at in every theme before
  they are committed, the sample theme's included.

## 8. Releasing

A new contract file and classes: a minor version, `0.2.0`, by the kit's own rule (kit design,
§9). The binding then raises its peer range to `~0.2.0` and proves the pair with its contract
test.

## 9. Not in scope

A horizontal group; a checkbox or a checkbox group; a switch; radios drawn by the kit instead
of the platform; the Field's own grid fix, which is a backlog entry of its own.

## 10. Unproven

- **Screen readers**: not tried, as for the rest of the kit (`docs/architecture.md`, "What is
  not built yet").
- **`accent-color` in WebKit**: WebKit is not run (backlog).
- **Every radio described by the group's description and error** is React Aria's choice (§2,
  fact 2). A screen reader then repeats the group's description on every radio; whether that is
  helpful or noisy is not tried.
