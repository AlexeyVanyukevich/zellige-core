# Architecture

What `@zellige/core` is today. This document is authoritative for that: where it and the design
record disagree, this one is right. The design record,
[`docs/superpowers/specs/2026-10-14-zellige-core-design.md`](superpowers/specs/2026-10-14-zellige-core-design.md),
says **why** the kit has the shape it does; read it for reasons, never for behaviour. Known
defects that were found and not yet fixed are the repository's open GitHub issues, not here.

Roles used below:

- **The binding** — `@zellige/react`, in its own repository. It renders this package's markup
  exactly and owns behaviour.
- **An application** — anything that installs the kit and themes it. Its theme file and the
  scans that hold it to WCAG 2.2 AA live in the application, not here.

Version 0.5.0 holds eleven components — Button, Field, the radio group, the checkbox, Card, Notice, the status
states, Badge, Dialog, Tabs, Prose — the tokens and the base layer. It ships no JavaScript and has no build.

## What ships

| Import                                    | Contents                                                          |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `@zellige/core/tokens.css`                | The layer order and the role tokens, with light and dark defaults |
| `@zellige/core/zl.css`                    | `@import`s the base layer and every component file                |
| `@zellige/core/css/<file>.css`            | One file, for an application that picks components                |
| `@zellige/core/contract/<component>.html` | One component's reference markup, every variant and state         |

`package.json`'s `exports` maps exactly these four patterns, and `files` ships exactly
`tokens.css`, `zl.css`, `css/` and `contract/`. Everything is served as written.

An application loads `tokens.css` and then `zl.css`, or sets the tokens itself instead of the
first. `zl.css` does not import `tokens.css`.

## Layers

Every kit file — `tokens.css`, `zl.css` and each file in `css/` — opens with the same statement:

```css
@layer zl.tokens, zl.base, zl.components;
```

so the order holds whichever file an application loads first. Each file then keeps every rule in
one layer:

| File                              | Layer           |
| --------------------------------- | --------------- |
| `tokens.css`                      | `zl.tokens`     |
| `css/base.css`, `css/utility.css` | `zl.base`       |
| every other file in `css/`        | `zl.components` |

An application's own CSS is unlayered, so it wins over any kit rule whatever its specificity or
order. No kit rule uses `!important`, and none sets `outline: none`.

## Tokens

`tokens.css` is the list: every `--zl-*` role, set on `:root`, except `--zl-focus`. Colours are
`light-dark()` pairs under `color-scheme: light dark`, so the page's scheme picks one.
`--zl-duration` is `150ms`, and `0ms` under `prefers-reduced-motion: reduce`.

`tokens.css` leaves `--zl-focus` unset so the ring reads the `--zl-accent` in force on the focused
element. A `var()` resolves where it is declared, so a `--zl-focus: var(--zl-accent)` on `:root`
would carry the page's accent into a subtree that re-themes only `--zl-accent`. An application's
`--zl-focus` wins wherever it sets it, even inside such a subtree. Any kit rule that reads
`--zl-focus` repeats the fallback `var(--zl-focus, var(--zl-accent))`, as `css/base.css` does.

The light `--zl-ink-faint` is `#646c79`, not the design's `#6b7380`, which is 4.46:1 on
`--zl-bg`. The new value is 4.94:1 there and 4.64:1 on `--zl-surface-sunk`.

An application themes the kit by setting `--zl-*` from its own unlayered CSS. A role it leaves
alone keeps the kit's default for the scheme in force. There are no per-component tokens.

## The contract

`contract/<component>.html` is the markup every binding renders and a hand-written page copies.
The files are the documentation of the markup; this section gives their rules, not their content.

- **A file is a list of examples.** Each example is one top-level element preceded by
  `<!-- example: <name> -->`, with `<name>` in kebab-case. The binding's contract test keys its
  props on these names.
- **Every `id` in `contract/` is unique across all its files,** prefixed by the component's name
  (`field-hint`, `dialog-side-title`), because the playground puts every file on one page.
- **Every part has a `zl-` BEM class,** and every token is `--zl-*` and every layer `zl.*`.
  `zl-` rather than a generic `ui-`, so the kit's names cannot clash silently with an
  application's own. Variants are modifier classes (`.zl-button--danger`).
  States are native and ARIA attributes, never classes, and the CSS selects on them:
  `:disabled`, `[aria-invalid='true']`, `[aria-busy='true']`, `[aria-selected='true']`,
  `:modal`.
- **An invalid field control** shows a `--zl-danger` border, hovered or not, until it is focused.
  Focused, its border is `--zl-line-strong` and its 2px outline is `--zl-danger`, so one ring shows.
  The error text stays its description in both.
- **Text stays in `--zl-ink` in Badge and Notice.** A tone on its own tint is below 4.5:1 in
  the kit's light defaults (warning 4.36:1, danger 4.44:1), so the tint and a border in the tone
  carry it, and the text carries the meaning.
- **The dialog's head and foot are `div`s.** A `header` or `footer` would be read as a page
  landmark; html-validate's `unique-landmark` reports it.
- **Prose's scroll wrapper is a named `group`, not a `region`.** html-validate fails a `region`
  twice: `prefer-native-element` maps it to `section`, and `unique-landmark` fails two that share
  an `aria-label`. Every `table` and `pre` sits alone in
  `<div class="zl-prose__scroll" role="group" tabindex="0" aria-label="Table|Code block">`, and
  the wrapper always has `tabindex="0"`: the binding never drops it, so its markup never differs
  from the contract.
- **Prose footnotes are plain markup.** Notes are numbered from 1 in the order of their first
  reference, `<n>`, under a `scope` (`prose-footnotes` in the contract). A reference is
  `<sup><a href="#<scope>-fn-<n>" id="<scope>-fnref-<n>" aria-label="Footnote <n>"><n></a></sup>`;
  its k-th repeat, k ≥ 2, has the id `<scope>-fnref-<n>-<k>`. The notes are the last child of
  the prose: `<section class="zl-prose__footnotes">` holding a `zl-visually-hidden` heading
  "Footnotes" at the level of the document's top headings, then an `ol` of
  `<li id="<scope>-fn-<n>">`. Each note's last `p` ends with one space and a back link per
  reference, `<a href="#<scope>-fnref-<n>" aria-label="Back to reference <n>">↩︎</a>`; the k-th is
  `…-<n>-<k>`, labelled `Back to reference <n>-<k>`, and holds `<sup><k></sup>` after the glyph.
  A note whose last block is not a `p` gets a `p` of its own for them. The `section` has no
  name, so it is not a landmark: a named one would add a landmark to every document with a note,
  and the hidden heading already names it for a reader moving by headings.
- **Prose task lists are plain markup.** A step is a `li` whose box is
  `<input type="checkbox" disabled />`, with `checked` when done and no other attribute. A
  `<label>` with no attribute holds the input, one space, then the step's inline content. In a
  tight item the label is the `li`'s first child and a nested list follows it outside the label;
  in a loose item the label is the only child of the first `p`. The label wraps the text because
  a bare input fails axe's `label` rule, and it holds no nested list so the name is the step's
  own text. No element carries a class, id, `role` or `aria-*`; the CSS finds a task item with
  `:has()` on its input. In a `ul` the box replaces the bullet; in an `ol` the number stays and
  the box follows it. A done step's text is unchanged: the box alone shows done.
- **Prose strikethrough is a bare `<del>`,** with no attribute, in the `document` example. Prose's
  own rule strikes it, in the text's colour. Nothing announces it beyond the native element,
  because the kit adds no text of its own for it.
- **`.zl-prose` styles classless descendants,** an exception to "every part has a `zl-` BEM
  class": Markdown has no classes. Each selector wraps `.zl-prose` and any pseudo-class in
  `:where()`, so a nested kit component keeps its own styles. Its first-and-last-child rules keep
  `:first-child` outside `:where()`, as `.zl-card`'s do, so they outrank the descendant rules.
  It sets `overflow-wrap: anywhere`, reset to `normal` on tables and, at zero specificity, on
  nested kit components. It caps an `img` at its container's inline size and keeps its aspect
  ratio, except in a table cell of the prose, where the table keeps its own sizing and scrolls in
  its wrapper.
- **Tabs' attributes are React Aria 3.53.1's** (`useTabList`, `useTab`, `useTabPanel`): the
  list has an `id`, the base React Aria builds the tab and panel ids from, which nothing refers
  to; only the selected tab has `aria-controls`; and the panel has `tabindex="0"` only when it
  holds nothing focusable. Tabs has no behaviour here.
- **The radio group's attributes are React Aria 3.53.1's** (`useRadioGroup`, `useRadio`), read
  after mount: `role="radiogroup"` on a `div` named by its label's `id`; every radio
  `tabindex="0"` while none is checked, then `0` on the checked one and `-1` on the rest; each
  radio described by its own description, then the group's error, then the group's description.
  Two placements are the kit's own: a radio's description sits beside its `<label>`, not inside
  it, so the radio's name is the label's text alone; and the input is the platform's, visible,
  coloured by `accent-color` and sized from the label's font. Its keyboard model is the
  platform's, which React Aria repeats: one Tab stop, the arrow keys move and check. Each
  example's `name` is its `id`, so no two examples on the playground form one group.
- **The checkbox's attributes are React Aria 3.53.1's** (`useCheckbox`, `useToggleState`), read
  after mount: a native input with `tabindex="0"` unless disabled; the hooks' `descriptionProps`
  and `errorMessageProps` make the input described by the description, then the error. React
  Aria's `data-react-aria-pressable` is left out, as on the radio group. The description and error
  sit beside the `<label>`, so the name is the label's text alone; the input is the platform's,
  visible, coloured by `accent-color`. An invalid checkbox draws a 2px `--zl-danger` rule along its
  wrapper's inline start; its focus ring stays `--zl-focus`, or the accent when that is unset.
- **The radio group has no gap between its radios**: each row is a tap high, and an invalid
  group's danger rule runs down them unbroken. Its label, description and error keep a small
  margin.
- **A Field, a radio group, a checkbox, a Notice and Tabs keep their rows at content height, at
  the top**, and **Empty and Trouble keep theirs at content height, centred**, when a taller grid
  row stretches them.
- **The kit's own text** is `Close`, `Retry`, `Loading…`, `Footnotes`, `Footnote <n>`,
  `Back to reference <n>` and `↩︎`.

| File            | Examples                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `button.html`   | neutral, primary, quiet, danger, disabled, busy, link                                                   |
| `field.html`    | input, select, textarea alone; a field with a hint, an error, both; with a select, a textarea; disabled |
| `card.html`     | card                                                                                                    |
| `notice.html`   | info, danger, title only                                                                                |
| `status.html`   | empty, loading, trouble, trouble without retry                                                          |
| `badge.html`    | neutral, accent, success, warning, danger                                                               |
| `dialog.html`   | center, side, without foot                                                                              |
| `tabs.html`     | text panel, panel with control                                                                          |
| `radio.html`    | plain, checked, invalid, disabled                                                                       |
| `checkbox.html` | plain, checked, described, invalid, disabled                                                            |
| `prose.html`    | document, wide table, long code line, footnotes, task list                                              |

The dialog's behaviour is the platform's: `showModal()` makes it modal, moves focus into it and
returns focus to the opener on close, and Escape closes it. The kit adds the scroll lock, in CSS:
`html:has(.zl-dialog:modal) { overflow: hidden; }`.

## The playground

A static page in `playground/`, served by Vite (`vite.config.ts`). `./run dev` serves it on
`127.0.0.1:5180`. It is not shipped. The dev server adds an `x-zellige-root` header, the server's
root as an absolute path, to every response; nothing in the page reads it, and the browser suite
uses it to check which tree answered.

- It imports `@zellige/core/tokens.css` and `@zellige/core/zl.css` by the package's own name, as
  an application would, so a broken `exports` entry stops the page.
- `main.ts` loads every `contract/*.html` as raw text and puts each in a `section` named by an
  `h2`, one `h3` caption per example. The example comments do not reach the page.
- `?theme=<name>` picks a theme from `playground/themes.ts`, which the switcher and every themed
  test read: `kit-light`, `kit-dark`, `sample-light`, `sample-dark`. A theme sets
  `color-scheme` on the root and, for the sample, adds `playground/themes/sample.css` after the
  kit.
- `?component=<name>` shows that component alone, which is how screenshots are taken.
- Each dialog example gets an "Open …" button that sets `autofocus` on the frame and calls
  `showModal()` — the one piece of behaviour a hand-written page brings.

`themes/sample.css` belongs to no application. It maps a warm palette with a green accent, a
serif face, 4px corners and a 44px tap height onto `--zl-*`, light and dark, unlayered as an
application's theme is: the proof that a whole look is a token mapping. Every text pairing in it
meets AA, and the scans hold it there.

## Checks

`./run check` runs, in order: Prettier, `tsc`, `oxlint --deny-warnings`, `html-validate` and
`charter scan` over `contract/` and `playground/`, then the browser suite. The two markup tools
are charter's `html` stack: html-validate checks the content model and inline click handlers,
`charter scan` runs axe-core in jsdom under the five WCAG tags. Neither sees colour contrast.

### The browser suite

`./run test` (arguments go on to `playwright test`) starts
`mcr.microsoft.com/playwright:v<version>-noble` running `playwright run-server`, with the version
read from the installed `@playwright/test`, which is pinned exactly. The runner stays on the
host, connects with `connectOptions: { wsEndpoint, exposeNetwork: '<loopback>' }`, and starts
Vite there; the browser in the container reaches it through the runner. The container is stopped
on exit. Docker publishes the container's port 3555 on a free loopback port for each run, so two
checkouts can run the suite at once; `ZELLIGE_BROWSER_PORT`, when set, fixes the host port
instead. The run prints the endpoint it got.

The suite always starts its own Vite in the tree under test, on a free loopback port picked for
each run, or on `ZELLIGE_PLAYGROUND_PORT` when that is set, and never reuses a running server. A
playground left open in another checkout, `./run dev` on 5180 included, therefore cannot be the
page a run loads. `server.spec.ts` guards this through the `x-zellige-root` header.

The container mounts `tests/ui/fonts.conf` read-only at `/etc/fonts/local.conf`, so `system-ui`
and `sans-serif` resolve to Liberation Sans there. The image's own `system-ui` face has no bold,
which made every `font-weight: 600` render at 400 in the kit themes. Liberation Sans has no 600
face, so 600 renders at its Bold, 700. `serif` and `monospace` are left alone.

Two Playwright projects: `ui` (`tests/ui/`, Chromium) and `package` (`tests/integration/`, no
browser).

| Spec                  | What it proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.spec.ts`        | The playground has one `h1`, one `main`, no skipped heading level, no repeated `id`; the theme switcher by keyboard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `server.spec.ts`      | Every response from the playground's origin carries `x-zellige-root`, and it is this tree's `playground/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `scan.spec.ts`        | axe under `WCAG_TAGS` in every theme, and with each dialog example open                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `focus.spec.ts`       | Every element Tab reaches shows a 2px solid outline at a 2px offset, in `--zl-danger` on an invalid field control and in `var(--zl-focus, var(--zl-accent))` elsewhere; a re-themed accent carries the ring and an explicit `--zl-focus` wins over it, in every theme; a focused field control's border is `--zl-line-strong`, in every theme; the walk reaches the end of the page, and any other end fails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `walk.spec.ts`        | The Tab walk helper tells two alike controls apart by identity and reaches each in order; it reports the endings `left`, `cap`, `repeated` (a control that sends Tab back) and `not-focus-visible` (an iframe). Chromium never produces `wrapped`, so no fixture does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `hover.spec.ts`       | Hovering an invalid input, select or textarea keeps its `--zl-danger` border, and a valid one shows `--zl-ink-faint`; once focused by keyboard, an invalid one shows `--zl-line-strong` even hovered, in every theme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `layers.spec.ts`      | Each kit file, loaded alone and unprocessed, opens with the order and keeps every rule in its layer; `zl.css` imports every file in `css/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dialog.spec.ts`      | Per dialog example, by keyboard: focus lands on the frame, Tab follows the written order and stays in the dialog, the page does not scroll, Escape closes and focus returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `radio.spec.ts`       | A radio group is one Tab stop; Arrow Down moves to the next radio and checks it; Shift+Tab returns to the checked one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `checkbox.spec.ts`    | A checkbox is one Tab stop and Space toggles it; Tab skips the disabled one; names and descriptions by role; the invalid rule and the disabled label's colour, in every theme                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `prose.spec.ts`       | Heading sizes on a page of its own; zero edge margins in each example; nested components compute as outside prose; at 320 px no page scroll and the wrappers scroll, in every theme; footnote markup, ids, names and back links; the notes hold an unbreakable run wider than 320 px (a `min-content` probe, in every theme); the `document` example's link holds one too (the same probe, in every theme), and a control that removing `.zl-prose`'s `overflow-wrap` makes the page scroll sideways at 320 px, in every theme, with a computed-value check that the `document` example's `.zl-prose` and first `p` compute `anywhere`; a control that removing the notes block's `overflow-wrap` makes the page scroll sideways at 320 px, in every theme; reference line height; notes block rule, spacing and size; `:target` highlight and the Tab journey to and from a note, and no background on a targeted list item or heading outside the notes; hidden heading takes no space; no trailing margin; wrapping; axe with a note targeted; task-list markup, step names and states, box and text placement, size, accent and centring in every theme, wrapped lines, plain-item text start, unchanged text style, link Tab order; an image is capped in a paragraph and in prose inside a layout table cell, left alone in a table cell, with no page scroll at 320 px; the `document` example's one bare `del` is struck in the text's colour in every theme, has no attribute or generated content and is not focusable; a `zl.base` reset loses to the strike and an unlayered one wins |
| `layout.spec.ts`      | A Field, radio group, checkbox, Notice and Tabs stretched to a taller grid row keep each child at its content offset and height; Empty and Trouble keep each child's height and centre                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `weight.spec.ts`      | In every theme, one element per component file that sets `font-weight: 600` has computed weight 600 and its text is wider than the same text at an inline 400                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `screenshots.spec.ts` | Each component alone in every theme, and each dialog example open                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `package.spec.ts`     | `npm pack` ships exactly the four patterns, and each file resolves through `exports`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `release.spec.ts`     | Every file in `charter.json`'s `release.files` holds the version `package.json` holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `readme.spec.ts`      | The README's opening paragraph lists exactly the display names in `tests/integration/readme.data.ts`, and the dataset has exactly one row per file in `contract/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

The datasets are read from the directories (`tests/ui/contract.ts`, the file lists in
`layers.spec.ts` and `package.spec.ts`), so a new component file is new rows with no test edit.
The rows of `release.spec.ts` come from `release.files` in `charter.json`.
The dialog's tab order is written by hand, and a test fails if an example lacks one.
`tests/integration/readme.data.ts` is written by hand, and a test fails when a contract file has no
row or a row has no contract file.

`tests/ui/known.ts` lists accessibility failures left out of the scan, one selector in one theme
each, every one with the number of its GitHub issue.

Screenshots run only through `./run test`: without `ZELLIGE_BROWSER_WS` the spec skips itself.
Baselines live in `tests/ui/__screenshots__/` with no platform in their names, and
`./run test --update-snapshots` remakes the ones that differ. Each must be looked at before it is
committed; the scans cannot judge the look.

## Releasing

Version 0.x until the two applications that already have their own components have both
migrated onto the kit. A release is the `chore: release X.Y.Z` commit on `main` and its `vX.Y.Z`
tag. A change to the contract starts here and is released first; the binding then raises its peer
range and dev dependency and proves the pair with its contract test. Adding a class, token or contract file needs no binding release.

## What is not built yet

- WebKit is not run, so nothing here proves the kit on iPhones, where one of those applications
  is used.
- Nothing is published to the private registry; installs are over git at a tag.
- No screen reader or 200% zoom has been tried. The 320 px viewport is checked for prose only.
