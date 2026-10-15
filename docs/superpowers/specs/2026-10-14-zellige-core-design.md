# zellige core — design

Status: **approved**, 2026-10-14. Not built. Replaces the design of
2026-10-12, which was approved under the working name `ui-kit` as one package and never built;
§12 lists what changed.

> **This becomes a decision record once the slice ships.**
>
> It states what was decided before any of it was built, and is not revised after. Read it to
> learn **why** the kit is shaped as it is. For **what** the kit does today, read
> `docs/architecture.md`, which the slice's last task writes.

This is one of two designs. It covers the kit as a whole — why it exists, how it is split, how
the halves are released together, the order applications move onto it — and the half that
needs no framework. The React binding has its own, in its own repository:
`docs/superpowers/specs/2026-10-14-zellige-react-design.md`.

---

## 1. Why

Three applications need the same components — buttons, form fields, cards, status states,
dialogs, tabs. This document calls them:

- **the console** — a dark operations tool on the system font;
- **the booking admin** — a mobile-first PWA with a light-and-dark "a booked night is a lit
  window" palette on Golos;
- **the task board** — a new web workspace, not yet built.

The console and the booking admin each already wrote these components, under different names
for the same things. The task board would write them a third time.

zellige is one implementation of those components that every application uses — named for the
tilework in which one set of cut shapes makes every pattern:

- **One structure.** A component's markup, behaviour and accessibility are written once.
- **Each application's own look.** The console stays dark on the system font; the booking
  admin keeps its palette on Golos. Neither forks a component to get there.
- **React first, any framework later.** The tokens, the CSS and the reference markup depend on
  nothing. React is one binding over them, kept apart so that a second binding is a new sibling
  rather than a change to this package.

### Success criteria

1. Every component's reference HTML renders in four themes — the kit default (light and dark),
   the console's and the booking admin's — and the two application themes are only token
   mappings and class overrides, never markup changes.
2. Every reference state passes an axe scan against WCAG 2.2 AA in all four themes.
3. The React binding's output matches the reference HTML, enforced by a test in the binding
   against the published `contract/` (the React design, §6).
4. The task board's web workspace is built on the kit; the console and then the booking admin
   migrate onto it with their browser journeys green and their old component CSS deleted.

## 2. Two packages, two repositories

| Package          | Repository      | Holds                                                 | Needs                              |
| ---------------- | --------------- | ----------------------------------------------------- | ---------------------------------- |
| `@zellige/core`  | `zellige-core`  | Tokens, the base layer and component CSS, `contract/` | nothing                            |
| `@zellige/react` | `zellige-react` | The React components, `UiProvider`, `buttonClass`     | `@zellige/core`, React, React Aria |

- **The seam is the contract.** Core owns every class, token, state selector and the
  reference HTML that uses them. A binding owns behaviour and an API, and renders core's
  markup exactly. Nothing in core knows a binding exists.
- **Core ships no JavaScript.** Its behaviour is the platform's: a hand-written page gets a
  modal dialog from `showModal()` and nothing more. A widget whose behaviour needs a library —
  Tabs — is markup only here, and works only through a binding.
- **Two repositories, not two workspaces in one.** Every project on this machine can install
  a package over git at a tag, the fallback when the private registry is out of reach. npm
  installs a git dependency from the repository's root and cannot reach a workspace in a
  subdirectory, so a single repository would have to give that path up.
- **Each package depends on what it uses and nothing else.** A plain HTML project, or a
  future binding, installs core without React; the React binding takes React and React Aria
  as ordinary requirements rather than optional peers.

Both are scoped under `@zellige`, so a consumer routes them to the private registry with one
`@zellige:registry=` line instead of redirecting its whole install. Installed over git the name
is unchanged: `"@zellige/core": "github:AlexeyVanyukevich/zellige-core#v0.1.0"`.

### Releasing together

- Each package has its own version and its own `chore: release X.Y.Z` commit and `vX.Y.Z`
  tag, by charter's release flow. Both stay `0.x` until the console and the booking admin have
  both migrated.
- `@zellige/react` declares `@zellige/core` as a **peer dependency** with the range it was
  tested against, and installs the same version as a dev dependency for its contract test.
  An application lists both packages itself, since it imports core's CSS directly.
- **A change to the contract starts in core.** Core releases; the binding then raises its range
  and dev dependency in the commit that updates its components, and its contract test proves
  the pair. A core release that only adds — a token, a modifier class — needs no binding
  release.
- While a change spans two repositories, the downstream one depends on `file:../zellige-core`
  (or `file:../zellige-react`) and goes back to a tagged version before its change is committed.

## 3. Non-goals

- No JavaScript in core, not even for the playground's consumers; the playground's own script
  is not shipped.
- No CSS-in-JS, no Tailwind, no Storybook.
- No page shell, navigation, login screen, menu, toast or combobox in v1. They are added when
  an application needs one, not before.
- Never published to the public npm registry.

## 4. The package

Set up with charter 3.3 as one root workspace taking `frontend typescript playwright html`:
the `frontend` rules for the CSS and the markup, TypeScript and Playwright for the browser
tests, `html` to check the hand-written HTML. It has no React and no Vitest, so neither stack
is loaded.

| Export                                    | Contents                                                          |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `@zellige/core/tokens.css`                | The layer order and the role tokens, with light and dark defaults |
| `@zellige/core/ui.css`                    | The base layer and every component's CSS                          |
| `@zellige/core/css/<component>.css`       | One component's CSS, for an application that picks components     |
| `@zellige/core/contract/<component>.html` | One component's reference HTML, every variant and state           |

Everything is shipped as written; there is no build.

### Layout

```
zellige-core/
  package.json  charter.json  run  CLAUDE.md  README.md
  tokens.css                  layer order + role tokens
  ui.css                      @imports base.css and every component file
  css/
    base.css  button.css  field.css  card.css  notice.css  status.css
    badge.css  dialog.css  tabs.css  utility.css
  contract/                   reference HTML per component — the documented markup
    button.html  field.html  card.html  notice.html  status.html
    badge.html  dialog.html  tabs.html
  playground/                 a static page: every contract file, a theme switcher
    themes/console.css  themes/bookings.css
  tests/ui/
```

charter's `frontend` accessibility rule loads on `**/*.css` and `**/*.html`, so it reaches
every stylesheet and every contract file here.

## 5. Tokens and theming

### Layers

`tokens.css` opens with the layer order:

```css
@layer ui.tokens, ui.base, ui.components;
```

Every kit file wraps its rules in one of these layers, including a component file imported on
its own. An application's own styles are unlayered, so they win over any kit rule regardless of
file order or selector specificity. No `!important` is needed to override the kit.

### Role tokens

Components read only these. All are prefixed `--ui-`. Colours are declared with `light-dark()`
under `color-scheme: light dark`, one declaration per token. Every ink and tone pairing meets
WCAG 2.2 AA contrast on the surfaces it is used on; the axe scans in §8 hold the defaults and
both application themes to it.

| Token            | Light default      | Dark default | Role                       |
| ---------------- | ------------------ | ------------ | -------------------------- |
| `bg`             | `#f6f7f8`          | `#121418`    | Page background            |
| `surface`        | `#ffffff`          | `#1a1d22`    | Cards, dialogs             |
| `surface-sunk`   | `#eef0f2`          | `#15171b`    | Inputs, wells              |
| `surface-raised` | `#ffffff`          | `#22262c`    | Hovered or lifted surfaces |
| `ink`            | `#15181d`          | `#e7e9ec`    | Body text                  |
| `ink-soft`       | `#4a515c`          | `#a9b0ba`    | Secondary text, labels     |
| `ink-faint`      | `#646c79`          | `#858d98`    | Hints, placeholders        |
| `line`           | `#dde1e6`          | `#2d3239`    | Borders, dividers          |
| `line-strong`    | `#b8bfc8`          | `#444b54`    | Control borders            |
| `accent`         | `#2f5fd0`          | `#7ea6ff`    | Primary action, selection  |
| `accent-strong`  | `#234aa6`          | `#a5c1ff`    | Hover and pressed accent   |
| `accent-soft`    | `#e3eafb`          | `#1f2b45`    | Accent tint behind text    |
| `on-accent`      | `#ffffff`          | `#0d1525`    | Text on `accent`           |
| `focus`          | `var(--ui-accent)` | same         | Focus ring                 |
| `success`        | `#1f7a4d`          | `#6fcf97`    | Success tone               |
| `success-soft`   | `#dcf1e6`          | `#17321f`    | Success tint               |
| `warning`        | `#9a6200`          | `#e5b45a`    | Warning tone               |
| `warning-soft`   | `#fbeccc`          | `#3a2c10`    | Warning tint               |
| `danger`         | `#b93b33`          | `#f07a70`    | Danger tone, errors        |
| `danger-soft`    | `#f8dfdc`          | `#3d1d1b`    | Danger tint                |

| Token                          | Default                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `font`                         | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`  |
| `font-mono`                    | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace` |
| `text` / `text-sm` / `leading` | `15px` / `13px` / `1.5`                                     |
| `radius` / `radius-sm`         | `10px` / `6px`                                              |
| `tap`                          | `40px` — the least height of a control                      |
| `space-1` … `space-5`          | `4px`, `8px`, `12px`, `16px`, `24px`                        |
| `shadow-low`                   | `0 1px 2px rgb(0 0 0 / 0.08)`                               |
| `shadow-lift`                  | `0 6px 20px rgb(0 0 0 / 0.14)`                              |
| `duration`                     | `150ms`; `0ms` under `prefers-reduced-motion: reduce`       |

### How an application themes the kit

A theme is the application's own CSS mapping its tokens onto roles:

```css
/* the booking admin */
:root {
  --ui-bg: var(--paper);
  --ui-ink: var(--ink);
  --ui-accent: var(--water);
  --ui-accent-strong: var(--water-deep);
  --ui-accent-soft: var(--water-soft);
  --ui-danger: var(--alert);
  --ui-danger-soft: var(--alert-soft);
  --ui-font: var(--font);
  --ui-tap: 44px;
}
```

- The booking admin's own tokens already switch under `prefers-color-scheme`, so the mapping
  follows them into dark mode. The console sets `color-scheme: dark` and its one palette.
- **Domain colours stay in the application.** The booking admin's occupied-night colour never
  becomes a kit token; the console maps its open-incident colour to `--ui-danger` and its
  resolved colour to `--ui-success`.
- Any element can re-theme its subtree, for example `.danger-zone { --ui-accent: … }`.
- **No per-component tokens in v1.** A finer change goes through the part's class. A component
  token such as `--ui-button-radius` is added only when an application needs one.

The playground's `themes/console.css` and `themes/bookings.css` are copies of these two
mappings with the applications' palettes inlined, so the scans cover them without either
application installed.

## 6. The contract

### Conventions

- **The markup is the API.** Each component's reference HTML lives in `contract/` and shows
  every variant and state. Every binding renders exactly that markup, and so does a
  hand-written page.
- **Every part has a class**: `ui-` plus BEM, for example `.ui-dialog__head`. These classes are
  the override hooks.
- **Variants are modifier classes**: `.ui-button--danger`, `.ui-dialog--side`.
- **States are native and ARIA attributes, never classes**: `:disabled`, `[aria-invalid]`,
  `[aria-busy]`, `[aria-selected]`, `[open]`. The CSS selects on them, so styling and the
  accessibility tree cannot disagree.
- **Behaviour is borrowed, never hand-written** (charter's `frontend` rule). A composite
  widget's keyboard model, focus handling and ARIA wiring come from the platform — `<dialog>`
  with `showModal()`, a native `<select>` — or from the primitive library a binding's stack
  names. Where the attributes a library sets are part of the markup, the contract records
  them as that library produces them, and says so.
- **The kit's own text is three strings**, `Close`, `Retry` and `Loading…`, which every binding
  lets an application replace. Everything else is the application's.

### Base layer (`css/base.css`, `css/utility.css`)

- `box-sizing: border-box` on every element and pseudo-element.
- `body` takes `--ui-bg`, `--ui-ink`, `--ui-font`, `--ui-text` and `--ui-leading`.
- `:focus-visible` draws a `2px` outline in `--ui-focus` at a `2px` offset. No kit rule sets
  `outline: none`.
- `.ui-visually-hidden` hides content visually and keeps it for assistive technology.

### Button

```html
<button type="button" class="ui-button ui-button--primary">Save</button>
```

- Variants: none (neutral), `--primary`, `--quiet`, `--danger`.
- Busy: `aria-busy="true"`. It stays focusable; the CSS shows it busy.
- A link or other element takes the same classes to look like a button.

### Field, Input, Select, Textarea

```html
<div class="ui-field">
  <label class="ui-field__label" for="f1">Name</label>
  <input class="ui-input" id="f1" aria-describedby="f1-hint f1-error" aria-invalid="true" />
  <p class="ui-field__hint" id="f1-hint">As on the passport</p>
  <p class="ui-field__error" id="f1-error">Enter a name</p>
</div>
```

- The controls are `.ui-input`, `.ui-select` (a native `<select>`) and `.ui-textarea`. Each
  works without a field.
- An error is tied to its control by `aria-invalid` and `aria-describedby`, never shown by
  colour alone.

### Card

```html
<div class="ui-card">…</div>
```

### Notice

```html
<div class="ui-notice ui-notice--danger" role="alert">
  <p class="ui-notice__title">Payment failed</p>
  <div class="ui-notice__body">…</div>
</div>
```

- Tones: `info` (default, `role="status"`) and `danger` (`--danger`, `role="alert"`).
- **A live region announces what is written into it, not reliably what it was mounted with.**
  A Notice rendered with its page is read in place. To announce an outcome that arrives without
  navigation, the page renders the Notice's slot first and writes the message into it. v1 has
  no toast to do this for it (§3).

### Status states — Empty, Loading, Trouble

```html
<div class="ui-empty">
  <p class="ui-empty__title">No open issues</p>
  <div class="ui-empty__body">…</div>
</div>

<div class="ui-loading" role="status">
  <span class="ui-loading__spinner" aria-hidden="true"></span>
  <span class="ui-loading__text">Loading…</span>
</div>

<div class="ui-trouble" role="alert">
  <p class="ui-trouble__title">Couldn't load the issues</p>
  <p class="ui-trouble__detail">…</p>
  <button type="button" class="ui-button">Retry</button>
</div>
```

The retry button is optional; Trouble without it is a dead end the page explains.

### Badge

```html
<span class="ui-badge ui-badge--success">Resolved</span>
```

- Tones: none (neutral), `--accent`, `--success`, `--warning`, `--danger`.
- The text carries the meaning; the tone repeats it. Colour is never the only signal.

### Dialog

Behaviour from the platform: `<dialog>` and `showModal()`.

```html
<dialog class="ui-dialog" aria-labelledby="d1-title">
  <div class="ui-dialog__frame" tabindex="-1">
    <header class="ui-dialog__head">
      <h2 class="ui-dialog__title" id="d1-title">New booking</h2>
      <button type="button" class="ui-dialog__close" aria-label="Close">✕</button>
    </header>
    <div class="ui-dialog__body">…</div>
    <footer class="ui-dialog__foot">…</footer>
  </div>
</dialog>
```

- **Placement**: centred by default, on a phone as well as a desktop. `--side` is full height
  at the right edge, `min(32rem, 100vw)` wide.
- **Size**: the frame is capped at the viewport's height. The body scrolls between a fixed head
  and a fixed foot, so a long form never pushes its own controls out of view (from the booking
  admin's sheet).
- **The frame** fills the `<dialog>`, which has no padding, so a click whose target is the
  `<dialog>` itself landed on the backdrop. A binding's backdrop handling relies on this.
- **Initial focus** belongs on the frame, which is why it takes `tabindex="-1"`. A hand-written
  page adds `autofocus` to it; a binding focuses it after `showModal()`.
- **Scroll lock**: pure CSS, `html:has(.ui-dialog:modal) { overflow: hidden; }`.
- The foot is optional.

### Tabs

Markup only: the behaviour comes from a binding's primitive library. The attributes below are
what React Aria's `useTabList`, `useTab` and `useTabPanel` produce, read from `react-aria`
3.53.1, so the React binding's props land on this markup unchanged.

```html
<div class="ui-tabs">
  <div class="ui-tabs__list" role="tablist" aria-label="Card" aria-orientation="horizontal">
    <button
      type="button"
      class="ui-tabs__tab"
      role="tab"
      id="t1-tab-spec"
      aria-controls="t1-panel-spec"
      aria-selected="true"
      tabindex="0"
    >
      Spec
    </button>
    <button
      type="button"
      class="ui-tabs__tab"
      role="tab"
      id="t1-tab-plan"
      aria-selected="false"
      tabindex="-1"
    >
      Plan
    </button>
  </div>
  <div
    class="ui-tabs__panel"
    role="tabpanel"
    id="t1-panel-spec"
    aria-labelledby="t1-tab-spec"
    tabindex="0"
  >
    …
  </div>
</div>
```

- `aria-orientation` is on the list; v1 tabs are horizontal only.
- **Only the selected tab carries `aria-controls`**, since only its panel exists.
- **The panel takes `tabindex="0"` only when it holds nothing focusable.** Otherwise Tab from
  the selected tab goes straight to the panel's first control. The reference shows the
  text-only case.
- Roving tabindex: only the selected tab is in the tab order.

### Accessibility

What each component promises a keyboard and a screen reader. The page around the components —
its headings, the order of its regions, its forms — is the application's, and each
application's slices state it.

**Focus order.** Every control is a native element, focused in source order. No kit markup
takes a positive `tabindex`. Two components move focus:

- **Dialog.** Opening it moves focus to the frame. The screen reader announces the dialog by
  its title, and Tab then reaches the close button, the body's controls and the foot's
  controls, in that order. The dialog is modal, so the page behind it is inert, and Tab
  reaches nothing there. Closing returns focus to the opener, which the platform does for
  `showModal()`.
- **Tabs.** The list is one tab stop, the selected tab. The binding's arrow keys move between
  tabs, and Tab goes on to the panel, or to the panel's first control.

**Accessible names.**

| Element                             | Name                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| Button                              | Its text; an icon-only button takes `aria-label` from the caller |
| Input, Select, Textarea             | The field's `<label for>`, or `aria-label` when used alone       |
| Dialog                              | Its title, by `aria-labelledby`                                  |
| Dialog's close button               | `aria-label="Close"`, one of the kit's three strings             |
| Tab list                            | `aria-label`, from the caller                                    |
| Tab, tab panel                      | The tab's text; the panel by `aria-labelledby` its tab           |
| Loading                             | Its text, `Loading…`                                             |
| Notice, Empty, Trouble, Card, Badge | None: their text is read where it stands                         |

**Heading structure.** The dialog's title is the kit's only heading: an `h2`, since the
dialog's top-layer content is read as a document of its own. The titles of Notice, Empty and
Trouble are paragraphs, not headings. The kit cannot know which level they would sit at, and
a status message is not a section of the page. A card's headings are its content's.

**States, and how each is announced.**

| State        | Markup                                    | Announced                                                    |
| ------------ | ----------------------------------------- | ------------------------------------------------------------ |
| Disabled     | `disabled`                                | As unavailable, from the native control                      |
| Busy button  | `aria-busy="true"`                        | Not reliably; the outcome is announced by a Notice           |
| Hint         | `aria-describedby`                        | After the control's name, on focus                           |
| Invalid      | `aria-invalid="true"`, `aria-describedby` | As invalid, then the error's text, on focus                  |
| Selected tab | `aria-selected="true"`                    | As selected                                                  |
| Open dialog  | `<dialog>` opened by `showModal()`        | As a dialog, with its title, when focus enters it            |
| Loading      | `role="status"`                           | Politely, if it is written into a region already on the page |
| Trouble      | `role="alert"`                            | At once, with the same condition                             |
| Notice       | `role="status"` or `role="alert"`         | By tone, with the same condition (Notice, above)             |
| Badge tone   | A modifier class                          | Not at all: the badge's text carries the meaning             |

**What an error does.** A field's error is text inside the field. It is tied to the control by
`aria-invalid` and `aria-describedby` and drawn in `--ui-danger`, but the text is the error, so
it is never colour alone. The kit does not move focus or announce an error when it appears.
What a failed submit does is the application's to state: focus to the first invalid control,
or a danger Notice that sums up the errors. A failed load is Trouble, announced as an alert,
with a Retry button the application wires or leaves out.

## 7. The playground

A static page, served by Vite in development and in the browser tests, and not shipped. A short
script loads every `contract/*.html` into the page, so what is scanned is the contract byte for
byte; a theme switcher applies the four themes. Its script also opens each dialog variant with
`showModal()`, the one piece of behaviour a plain page brings.

It is a valid page in its own right — one `h1`, headings that skip no level, a `main` landmark
— so its scans test the components and not the page around them.

## 8. Testing

charter's rules apply: tests before implementation, cases in typed datasets, journeys by role
with an axe scan of every state. `./run check` runs types, formatting, lint
(`oxlint --deny-warnings`), the markup checks and the suite.

**Markup**, statically, over every HTML file in `contract/` and `playground/`: `html-validate`
with charter's `html` config checks the content model, and `charter scan` runs axe-core in
jsdom under the same five WCAG tags to check ARIA. The config's `charter/clickable-control`
reports an inline click handler on an element that is not a control. Neither tool can see
colour contrast, which needs layout; the browser scans below cover it.

All of core's tests are browser tests (`tests/ui/`, Playwright against the playground). Core
has no pure functions, so it has no unit suite. Elements are found by role and accessible name,
never by class.

- **Accessibility**: `@axe-core/playwright` with one shared `WCAG_TAGS` constant — `wcag2a`,
  `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` — over every contract state in all four themes,
  with each dialog variant scanned open. Any violation fails; a known one is excluded for one
  selector with a backlog entry.
- **Screenshots**: each contract file in each theme. Baselines are made in the Playwright
  Docker image matching the installed Playwright version, so they do not depend on the machine.
- **Layers**, against a dataset of every file in `css/`: loaded alone, each file's rules all
  sit inside a `ui.*` layer, read through the CSSOM; and `ui.css` imports every file.
- **The platform's dialog**, keyboard only: opening moves focus to the frame, the page does not
  scroll behind it, Escape closes it, and focus returns to the opener.
- **Focus indicator**: every focusable element in the contract shows the outline under
  `:focus-visible` in every theme.

What the bindings do with the markup — Tabs' keyboard model, a dialog's backdrop and close
handling — is tested in the binding.

## 9. Migration and order

Each application's migration gets its own short plan.

1. **`@zellige/core` `v0.1.0`**, then **`@zellige/react` `v0.1.0`** against it. Both can be
   built alongside the task board's first slice, Tasks 1–21, which are server and runner work.
   Each slice's last task writes its repository's `docs/architecture.md` and `README.md` and
   archives its plan.
2. **The task board** builds its web workspace on the kit. Before Task 22, that slice's Tasks
   22–25 are amended:
   - The card drawer becomes `<Dialog placement="side">`.
   - The card's tabs become `<Tabs>`.
   - Forms use `<Field>`.
   - The board's and the card's CSS keep only board-specific layout.
3. **The console** migrates: Button, Field, Card, Notice, status states, Badge. It has no
   dialog, so it is the quick check of the whole flow.
4. **The booking admin** migrates last. Its sheet moves from a `div` modal to the native
   `<dialog>`, on a mobile-first PWA, after Dialog has been used in the task board and the
   booking admin's theme has passed the playground's scans.

Each migration:

- Its first commit adds both packages, a theme file mapping the application's tokens onto
  `--ui-*`, and a line in the application's `CLAUDE.md` naming zellige as its component kit,
  which charter's `frontend` rule reads. Nothing changes on screen.
- After that it replaces one component per commit and deletes the application's CSS for it.
  The application's browser journeys stay green at every commit.
- A difference between the application and the kit is settled in the theme file or by a class
  override, never by forking a component.

The console and the booking admin are on dev-kit 1.x and 2.x today, so neither loads the
`frontend` rule that reads that `CLAUDE.md` line. Moving them to charter 3.1 is their own
change, not part of their migration onto the kit.

### Versioning

At `1.0.0`, renaming or removing a class, token, state attribute or contract file is a major
version of core. Adding one is a minor version.

## 10. Not in scope

- **A binding other than React.** The split makes room for one; none is planned.
- **Tabs, or any library-driven widget, on a page with no binding.** Core documents the markup;
  the behaviour is a binding's.
- **Accessibility at design handoff** for the applications' own screens. The kit specifies its
  components' focus, labels and states here; each application's slices do the same for theirs.
- **Testing with assistive-technology users.** No suite does it; §11 keeps the gap visible.

## 11. Unproven

- That the Tabs contract is what React Aria renders in every state. It was read from the
  3.53.1 source, not rendered; the React binding's contract test is where it is first proved.
- That a Notice written into after mount is announced by VoiceOver, NVDA and TalkBack alike.
- That the `@zellige` scope is free on the private registry. On GitHub Packages a scope must be
  the owning account's, which would make the names `@alexeyvanyukevich/zellige-core` and
  `-react`.
- Not tried at design time: a screen reader, 200% zoom, a 320 px wide viewport. The slice's
  review states which of these it then tried.

## 12. What changed from the 2026-10-12 design

| Before                                                             | Now                                                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| One package, `ui-kit`, with an optional React section              | `@zellige/core` here, `@zellige/react` in its own repository                                               |
| `react`, `react-dom` as optional peers of the one package          | Core has no React at all; the binding requires React and React Aria                                        |
| One playground for components and themes                           | Core's static playground scans and screenshots the contract in four themes; the binding's covers behaviour |
| dev-kit 2.x sections `common`, `ui`, `testing`                     | charter 3.3: `frontend typescript playwright html` here; the binding's modules are in its design           |
| Tabs' keyboard model hand-written in `src/core/next-tab.ts`        | React Aria's hooks, in the binding; core holds only the markup                                             |
| Every tab carries `aria-controls`; the panel always `tabindex="0"` | Only the selected tab does; the panel only when it holds nothing focusable; `aria-orientation` added       |
| Axe scan in four themes                                            | Against WCAG 2.2 AA with one `WCAG_TAGS` constant, plus keyboard journeys and a focus-indicator test       |
| —                                                                  | Notice's announcement limit, Badge's text-first meaning, the layer test, the playground as a valid page    |
| —                                                                  | Static markup checks: `html-validate` and `charter scan` over `contract/` and `playground/`                |
| —                                                                  | An accessibility section: focus order, names, headings, states and errors                                  |
| Applications and theme files named                                 | Referred to by role; `themes/console.css`, `themes/bookings.css`                                           |

Class and token names keep the `ui-` prefix: they name the layer, not the project, and a
rename would buy nothing.
