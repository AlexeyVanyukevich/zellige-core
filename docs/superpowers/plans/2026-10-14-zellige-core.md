# zellige core v0.1 — implementation plan

Spec: `docs/superpowers/specs/2026-10-14-zellige-core-design.md`. Work happens on
`feat/zellige-core`, branched from `main` after the charter setup and the spec are committed.
Each task writes its test first and sees it fail where it can. It is done when `./run check`
passes, and it ends in one commit holding the test and the code.

There is no backlog yet. Task 12 creates `docs/backlog.md`.

## Decisions this plan adds to the spec

- **The browser renders in the Playwright image, and the tests run on the host.**
  `./run test` starts `mcr.microsoft.com/playwright:v<version>-noble` running
  `playwright run-server`. The host runner connects to it with
  `connectOptions: { wsEndpoint, exposeNetwork: '<loopback>' }`, so the containerised browser
  reaches Vite on the host's loopback. Screenshots are then the same on every machine. The host
  needs no Playwright browsers, and Vite's native binaries never enter a Linux container. The
  image tag is read from the installed `@playwright/test`, never written by hand, and that
  package is pinned to an exact version.
- **Screenshots run only through `./run test`.** `screenshots.spec.ts` skips itself when
  `ZELLIGE_BROWSER_WS` is unset, so `npx playwright test --ui` still works for debugging.
- **Chromium only in v0.1.** WebKit goes in the backlog (Task 12), to be closed before the
  booking admin migrates, since that application runs on iPhones.
- **Five theme rows, not four.** The booking admin's palette switches with
  `prefers-color-scheme`, so it is scanned in light and in dark, the same as the kit default:
  `kit-light`, `kit-dark`, `console`, `bookings-light`, `bookings-dark`.
- **A contract file is a list of examples.** Each example is one top-level element, preceded
  by `<!-- example: <name> -->`. The name is kebab-case and is the key the React binding's
  contract test maps to props. Every `id` in `contract/` is unique across all its files,
  because the playground puts every file on one page.
- **Every kit file starts with the layer order statement**, not just `tokens.css`. A component
  file loaded before `tokens.css` would otherwise declare `ui.components` first and lose to
  `ui.base`.
- **The playground loads the kit through its own package name** (`@zellige/core/ui.css`), as
  an application would, so a broken `exports` entry fails the page. If Vite does not resolve
  a package's own name, it uses relative paths, and the package test alone covers `exports`.
- **One test that is not a browser test**, `tests/integration/package.spec.ts`. It runs in
  Playwright's runner with no page and checks that `npm pack --dry-run --json` ships exactly
  `tokens.css`, `ui.css`, `css/*` and `contract/*`. The spec says core has only browser
  tests. This one has nothing to do with a browser, and without it `files` is checked only at
  release.
- **The booking admin's theme loads Golos** from `@fontsource-variable/golos-text`, a dev
  dependency that only the playground imports. That is where the application gets the font.

## Task 1 — the runner and the playground

- Dev dependencies: `@playwright/test` (exact), `@axe-core/playwright`, `vite`.
- `playwright.config.ts` defines one project, `ui`. It covers `tests/ui/`, uses Chromium, and
  has `webServer` start Vite on a fixed port. When `ZELLIGE_BROWSER_WS` is set, the config
  passes `connectOptions`.
- `./run` gets three scenarios:
  - `test` checks for Docker, starts the run-server container with a trap that stops it,
    waits for the port, then runs `npx playwright test "$@"`.
  - `dev` serves the playground.
  - `check` adds `tsc`, `oxlint --deny-warnings` and `test`.
- `playground/themes.ts` holds `THEMES`, which the playground and the tests share. It starts
  with `kit-light` and `kit-dark`, which set `color-scheme` on the root.
- `playground/index.html` and `playground/main.ts` are built to the spec, §7:
  - one `h1` and a `main`;
  - a native `<select>` labelled Theme, mirrored in `?theme=`;
  - every `contract/*.html`, loaded with `import.meta.glob(…, { query: '?raw' })` into one
    `section` per component, each with an `h2`;
  - a caption over each example, taken from its comment.
- `tests/ui/wcag.ts` holds `WCAG_TAGS`. `tests/ui/contract.ts` builds the dataset of
  components and examples by reading `contract/`, so a new file is a new row with no test edit.
- Tests:
  - `page.spec.ts`: there is one `h1` and one `main`, headings skip no level, and no `id`
    repeats.
  - `scan.spec.ts`: axe in every theme.
  - `screenshots.spec.ts`: one screenshot per contract file in every theme. It has no rows
    until Task 3.

  With no contract files, the page, scan and screenshot specs run against an empty kit.

- Commit: `build: run the browser suite in the playwright image`

## Task 2 — tokens, base layer, themes

- Tests first:
  - `layers.spec.ts`: its rows are every file in `css/` plus `tokens.css`. Loaded alone, each
    file's first rule is the order statement, and every other rule is a `CSSLayerBlockRule`
    named `ui.*`. `ui.css` imports every file in `css/`.
  - `focus.spec.ts`: in every theme, Tab through the page. Each element that takes focus shows
    a `2px` outline in the computed `--ui-focus`, offset `2px`.

  See both fail.

- `tokens.css`, `css/base.css`, `css/utility.css` and `ui.css`, to the spec, §5 and §6
  (base layer).
- `playground/themes/console.css` and `playground/themes/bookings.css` map the applications'
  palettes onto `--ui-*`, per the spec's §5. They are copied from the console's `:root` in its
  `web/src/styles.css` and the booking admin's light and dark `:root` in its
  `web/src/styles.css`, and each file's header names the source file and commit. Add the
  `console`, `bookings-light` and `bookings-dark` rows to `THEMES`.
- Commit: `feat: add the role tokens, the base layer and two application themes`

## Tasks 3–10 — one component each

The order is button, field, card, notice, status, badge, dialog, tabs. Every task does the
same five things, using the markup and rules in the spec's §6:

1. `contract/<component>.html` comes first: every variant and state, one example each. This
   is the test. It adds rows to the scan, focus and screenshot specs.
2. Run `./run test` and see the screenshots fail because no baseline exists. On unstyled
   markup the scans usually pass, so this missing baseline is the failure that comes first.
3. `css/<component>.css` goes in `ui.components`, and `ui.css` imports it. The layer spec
   fails until the import is in place.
4. `./run test --update-snapshots` makes the baselines. Look at each one in all five themes
   before committing, because the scans cannot judge the look.
5. Commit: `feat(<component>): add the <component> contract and css`

Notes for particular components:

- **Field** has these examples: input, select and textarea each alone, then a field with a
  hint, with an error, and with both, and disabled.
- **Status** puts Empty, Loading and Trouble in one file and one CSS file. The spinner stops
  under `prefers-reduced-motion`.
- **Dialog** comes before Tabs because it is the only component with a journey:
  - The playground adds an "Open <example>" button for each dialog example. Its script sets
    `autofocus` on the frame and calls `showModal()`.
  - `dialog.spec.ts` has one row per dialog example and uses the keyboard only. Opening moves
    focus to the frame. A mouse wheel over the backdrop leaves `scrollY` unchanged. Escape
    closes the dialog, and focus returns to the opener.
  - `scan.spec.ts` and `screenshots.spec.ts` each get a row per dialog example, scanned and
    shot while open.
- **Tabs** records React Aria 3.53.1's attributes exactly as the spec's §6 gives them, with
  two examples: a text panel with `tabindex="0"` and a panel holding a control without it.

## Task 11 — the package

- Test first: `tests/integration/package.spec.ts`, as described above, in a second Playwright
  project, `package`, that opens no browser. See it fail.
- In `package.json`, `exports` maps `./tokens.css`, `./ui.css`, `./css/*` and
  `./contract/*`, and `files` lists the same paths.
- Commit: `build: export the tokens, css and contract`

## Task 12 — close the slice

- `docs/architecture.md` describes the kit as built: the exports, the layers, the tokens, the
  contract's conventions (including the example comments), the playground, `./run test`, and
  how a release reaches the binding.
- `README.md` covers installing, theming, and the `./run` scenarios, including that Docker is
  needed.
- In `CLAUDE.md`, replace the "Not built yet" paragraph with a pointer to
  `docs/architecture.md`.
- `docs/backlog.md` gets two entries:
  - WebKit is not run.
  - The `@zellige` scope is unverified on the private registry (spec §11).

  It also gets anything else found along the way.

- The spec's status becomes **built**, and this plan moves to `archive/`.
- Commits: `docs: document zellige core`, then `docs: archive the core plan`

The release follows the rebase onto `main` and is not part of this plan. That means
`chore: release 0.1.0` and the `v0.1.0` tag, once a remote exists. The React binding's plan
starts from that tag.

## Still unproven when this plan is written

- That `exposeNetwork: '<loopback>'` lets the containerised browser reach Vite on the host,
  under Docker Desktop on macOS. Task 1 proves it or changes the approach.
- That Vite resolves the package's own name.
- What the spec's §11 lists: a screen reader, 200% zoom and a 320 px viewport are not tried by
  any task here. The slice's review says which of them were tried.
