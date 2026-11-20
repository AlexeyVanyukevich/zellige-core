# @zellige/core

Design tokens, CSS and reference markup for the zellige component kit: Button, Field, Radio
group, Checkbox, Card, Notice, Empty / Loading / Trouble, Badge, Dialog, Tabs and Prose. No
JavaScript and no framework. The React binding, `@zellige/react`, renders the same markup and lives
in its own repository.

How the kit is built, and why it is shaped as it is: [`docs/architecture.md`](docs/architecture.md).

## Installing

Over git, at a release tag:

```json
"devDependencies": { "@zellige/core": "github:AlexeyVanyukevich/zellige-core#v0.4.0" }
```

## Using it

Load the tokens, then the components:

```css
@import '@zellige/core/tokens.css';
@import '@zellige/core/zl.css';
```

or one component at a time, `@zellige/core/css/button.css`, after `css/base.css`.

Write the markup in `contract/<component>.html`, which shows every variant and state. States are
attributes, not classes: `disabled`, `aria-invalid="true"`, `aria-busy="true"`,
`aria-selected="true"`. A dialog opens with `showModal()`; Tabs needs a binding for its
behaviour. Render Markdown inside a `.zl-prose` container and leave its elements without classes,
but put each `table` and each `pre` alone in `<div class="zl-prose__scroll" role="group"
tabindex="0" aria-label="Table">` (or `"Code block"`), which the CSS does not add, as
`contract/prose.html` shows; its `footnotes` example shows the footnote markup and its `task-list` example the task-list markup.

### Theming

Map your own colours onto the kit's roles in unlayered CSS. It wins over every kit rule:

```css
:root {
  --zl-bg: var(--paper);
  --zl-ink: var(--ink);
  --zl-accent: var(--water);
  --zl-font: var(--font);
  --zl-tap: 44px;
}
```

`tokens.css` lists every role and its light and dark default, except `--zl-focus`, which it leaves
unset. Any element can re-theme its subtree the same way. Re-theming `--zl-accent` on a subtree
re-themes its focus ring too, unless `--zl-focus` is set.

## Working on it

Needs Node 24 or newer and Docker, which runs the browsers.

```bash
./run          # installs and lists the scenarios
./run dev      # the playground: every contract file, in every theme, at http://127.0.0.1:5180
./run test     # the browser suite, in the Playwright image; arguments go to playwright test
./run check    # formatting, types, lint, markup, then the browser suite
```

`./run test --update-snapshots` remakes the screenshots that changed. Look at each before
committing it.
