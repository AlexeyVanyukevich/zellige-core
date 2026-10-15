# Architecture

What `@zellige/core` is today. This document is authoritative for that: where it and the design
record disagree, this one is right. The design record,
[`docs/superpowers/specs/2026-10-14-zellige-core-design.md`](superpowers/specs/2026-10-14-zellige-core-design.md),
says **why** the kit has the shape it does; read it for reasons, never for behaviour. Known
defects that were found and not yet fixed are listed in [`docs/backlog.md`](backlog.md), not here.

Roles used below:

- **The binding** — `@zellige/react`, in its own repository. It renders this package's markup
  exactly and owns behaviour.
- **An application** — anything that installs the kit and themes it.
- **The console** and **the booking admin** — the two applications whose palettes the playground
  carries as themes.

Version 0.1 holds eight components — Button, Field, Card, Notice, the status states, Badge,
Dialog, Tabs — the tokens and the base layer. It ships no JavaScript and has no build.

## What ships

| Import                                    | Contents                                                          |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `@zellige/core/tokens.css`                | The layer order and the role tokens, with light and dark defaults |
| `@zellige/core/ui.css`                    | `@import`s the base layer and every component file                |
| `@zellige/core/css/<file>.css`            | One file, for an application that picks components                |
| `@zellige/core/contract/<component>.html` | One component's reference markup, every variant and state         |

`package.json`'s `exports` maps exactly these four patterns, and `files` ships exactly
`tokens.css`, `ui.css`, `css/` and `contract/`. Everything is served as written.

An application loads `tokens.css` and then `ui.css`, or sets the tokens itself instead of the
first. `ui.css` does not import `tokens.css`.

## Layers

Every kit file — `tokens.css`, `ui.css` and each file in `css/` — opens with the same statement:

```css
@layer ui.tokens, ui.base, ui.components;
```

so the order holds whichever file an application loads first. Each file then keeps every rule in
one layer:

| File                              | Layer           |
| --------------------------------- | --------------- |
| `tokens.css`                      | `ui.tokens`     |
| `css/base.css`, `css/utility.css` | `ui.base`       |
| every other file in `css/`        | `ui.components` |

An application's own CSS is unlayered, so it wins over any kit rule whatever its specificity or
order. No kit rule uses `!important`, and none sets `outline: none`.

## Tokens

`tokens.css` is the list: every `--ui-*` role, set on `:root`. Colours are `light-dark()` pairs
under `color-scheme: light dark`, so the page's scheme picks one. `--ui-duration` is `150ms`, and
`0ms` under `prefers-reduced-motion: reduce`.

The light `--ui-ink-faint` is `#646c79`, not the design's `#6b7380`, which is 4.46:1 on
`--ui-bg`. The new value is 4.94:1 there and 4.64:1 on `--ui-surface-sunk`.

An application themes the kit by setting `--ui-*` from its own unlayered CSS. A role it leaves
alone keeps the kit's default for the scheme in force. There are no per-component tokens.

## The contract

`contract/<component>.html` is the markup every binding renders and a hand-written page copies.
The files are the documentation of the markup; this section gives their rules, not their content.

- **A file is a list of examples.** Each example is one top-level element preceded by
  `<!-- example: <name> -->`, with `<name>` in kebab-case. The binding's contract test keys its
  props on these names.
- **Every `id` in `contract/` is unique across all its files,** prefixed by the component's name
  (`field-hint`, `dialog-side-title`), because the playground puts every file on one page.
- **Every part has a `ui-` BEM class.** Variants are modifier classes (`.ui-button--danger`).
  States are native and ARIA attributes, never classes, and the CSS selects on them:
  `:disabled`, `[aria-invalid='true']`, `[aria-busy='true']`, `[aria-selected='true']`,
  `:modal`.
- **Text stays in `--ui-ink` in Badge and Notice.** A tone on its own tint is below 4.5:1 in
  the light themes (warning 4.36:1, danger 4.11–4.44:1), so the tint and a border in the tone
  carry it, and the text carries the meaning.
- **The dialog's head and foot are `div`s.** A `header` or `footer` would be read as a page
  landmark; html-validate's `unique-landmark` reports it.
- **Tabs' attributes are React Aria 3.53.1's** (`useTabList`, `useTab`, `useTabPanel`): only
  the selected tab has `aria-controls`, and the panel has `tabindex="0"` only when it holds
  nothing focusable. Tabs has no behaviour here.
- **The kit's own text** is `Close`, `Retry` and `Loading…`.

| File          | Examples                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `button.html` | neutral, primary, quiet, danger, disabled, busy, link                                                   |
| `field.html`  | input, select, textarea alone; a field with a hint, an error, both; with a select, a textarea; disabled |
| `card.html`   | card                                                                                                    |
| `notice.html` | info, danger, title only                                                                                |
| `status.html` | empty, loading, trouble, trouble without retry                                                          |
| `badge.html`  | neutral, accent, success, warning, danger                                                               |
| `dialog.html` | center, side, without foot                                                                              |
| `tabs.html`   | text panel, panel with control                                                                          |

The dialog's behaviour is the platform's: `showModal()` makes it modal, moves focus into it and
returns focus to the opener on close, and Escape closes it. The kit adds the scroll lock, in CSS:
`html:has(.ui-dialog:modal) { overflow: hidden; }`.

## The playground

A static page in `playground/`, served by Vite (`vite.config.ts`) on `127.0.0.1:5180`. It is not
shipped.

- It imports `@zellige/core/tokens.css` and `@zellige/core/ui.css` by the package's own name, as
  an application would, so a broken `exports` entry stops the page.
- `main.ts` loads every `contract/*.html` as raw text and puts each in a `section` named by an
  `h2`, one `h3` caption per example. The example comments do not reach the page.
- `?theme=<name>` picks a theme from `playground/themes.ts`, which the switcher and every themed
  test read: `kit-light`, `kit-dark`, `console`, `bookings-light`, `bookings-dark`. A theme sets
  `color-scheme` on the root and, for the two applications, adds its file from
  `playground/themes/` after the kit.
- `?component=<name>` shows that component alone, which is how screenshots are taken.
- Each dialog example gets an "Open …" button that sets `autofocus` on the frame and calls
  `showModal()` — the one piece of behaviour a hand-written page brings.

`themes/console.css` and `themes/bookings.css` copy the two applications' palettes onto `--ui-*`.
Each names, in its header, the file and commit it was copied from. The booking admin's light and
dark pairs are written as `light-dark()`; the application itself switches them by media query.
Its font comes from `@fontsource-variable/golos-text`, a dev dependency only the playground
imports.

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
on exit. `ZELLIGE_BROWSER_PORT` moves the port from 3555.

Two Playwright projects: `ui` (`tests/ui/`, Chromium) and `package` (`tests/integration/`, no
browser).

| Spec                  | What it proves                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.spec.ts`        | The playground has one `h1`, one `main`, no skipped heading level, no repeated `id`; the theme switcher by keyboard                                                         |
| `scan.spec.ts`        | axe under `WCAG_TAGS` in every theme, and with each dialog example open                                                                                                     |
| `focus.spec.ts`       | Every element Tab reaches shows a 2px solid outline in `--ui-focus` at a 2px offset, in every theme                                                                         |
| `layers.spec.ts`      | Each kit file, loaded alone and unprocessed, opens with the order and keeps every rule in its layer; `ui.css` imports every file in `css/`                                  |
| `dialog.spec.ts`      | Per dialog example, by keyboard: focus lands on the frame, Tab follows the written order and stays in the dialog, the page does not scroll, Escape closes and focus returns |
| `screenshots.spec.ts` | Each component alone in every theme, and each dialog example open                                                                                                           |
| `package.spec.ts`     | `npm pack` ships exactly the four patterns, and each file resolves through `exports`                                                                                        |

The datasets are read from the directories (`tests/ui/contract.ts`, the file lists in
`layers.spec.ts` and `package.spec.ts`), so a new component file is new rows with no test edit.
Only the dialog's tab order is written by hand, and a test fails if an example lacks one.

`tests/ui/known.ts` lists accessibility failures left out of the scan, one selector in one theme
each, every one with its backlog entry.

Screenshots run only through `./run test`: without `ZELLIGE_BROWSER_WS` the spec skips itself.
Baselines live in `tests/ui/__screenshots__/` with no platform in their names, and
`./run test --update-snapshots` remakes the ones that differ. Each must be looked at before it is
committed; the scans cannot judge the look.

## Releasing

Version 0.x until the console and the booking admin have both migrated. A release is the
`chore: release X.Y.Z` commit on `main` and its `vX.Y.Z` tag. A change to the contract starts
here and is released first; the binding then raises its peer range and dev dependency and proves
the pair with its contract test. Adding a class, token or contract file needs no binding release.

## What is not built yet

- WebKit is not run, so nothing here proves the kit on the booking admin's iPhones.
- Nothing is published to the private registry; installs are over git at a tag.
- No screen reader, 200% zoom or 320 px viewport has been tried.
