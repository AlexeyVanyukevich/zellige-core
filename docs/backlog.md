# Backlog

What is known to be wrong and not yet fixed, newest first. The rule for this file is charter's
`core/rules/backlog.md`: one entry per finding, deleted by the commit that fixes it.

## WebKit is not run

- Where: `playwright.config.ts`, the `ui` project
- Found: 2026-10-16, deferred on purpose by the v0.1 plan
- Problem: every browser test runs in Chromium only. The booking admin is a PWA used on
  iPhones, where every browser is WebKit, and nothing here has rendered `light-dark()`,
  `:has(:modal)` or the dialog's focus handling there.
- Impact: the booking admin's migration, the last one, would be the first WebKit run of the
  kit. Add a WebKit project before it starts.

## The `@zellige` scope is unverified on the private registry

- Where: `package.json`, `name`
- Found: 2026-10-14, in the design (§11)
- Problem: on GitHub Packages a scope must be the owning account's, so `@zellige/core` may have
  to become `@alexeyvanyukevich/zellige-core` there. Nothing has been published.
- Impact: installs work over git at a tag; a registry publish may need a rename, and every
  consumer's import with it

## `--zl-focus` does not follow a re-themed accent

- Where: `tokens.css`, `--zl-focus: var(--zl-accent)` on `:root`
- Found: 2026-10-16, while adding the tokens
- Problem: a custom property's `var()` resolves where it is declared, so `--zl-focus` takes
  `:root`'s accent. Set `.danger-zone { --zl-accent: red }` around a button and focus it: the
  button turns red, its focus ring stays the page's accent. The design names this re-theming as
  supported.
- Impact: a re-themed region shows a focus ring in a colour from outside it; still visible, so
  not an AA failure, but not what an application asks for

## Screenshot baselines are made on arm64 only

- Where: `tests/ui/__screenshots__/`; `./run`, `browser_suite`
- Found: 2026-10-16, while adding the first baselines
- Problem: `docker run` pulls the Playwright image for the host's architecture. Every baseline
  was rendered by the arm64 image on an Apple Silicon Mac; an x86-64 machine, a CI runner
  included, renders with the amd64 image, whose font rasterising may differ. Not tried.
- Impact: `./run check` may fail on every screenshot on another architecture. Pinning
  `--platform linux/arm64` would make an x86-64 machine emulate it, slowly

## The Playwright image's system font has no semibold

- Where: the kit-default and console themes' screenshots; `--zl-font`
- Found: 2026-10-16, while reviewing the button baselines
- Problem: `system-ui` in the Playwright image resolves to a face without weight 600, so labels,
  titles and badges in those two themes render at the regular weight. The bookings theme, on
  Golos, shows the weight.
- Impact: a lost `font-weight` in a component goes unnoticed by the screenshots of three of the
  five themes

## The booking admin's faint ink fails AA as text

- Where: `playground/themes/bookings.css`, `--zl-ink-faint`; excluded from the scan by
  `tests/ui/known.ts`
- Found: 2026-10-16, while adding Field
- Problem: the booking admin's `--ink-faint`, `#78847f`, is 3.33:1 on its `--paper`, `#eceeec`,
  in the light scheme; AA asks 4.5:1 for text of this size. A field's hint is drawn in it. Delete
  the row in `tests/ui/known.ts` and run `./run test scan`: the Bookings, light scan fails on
  `.zl-field__hint`. The application draws its own hints and notes in the same colour today, so
  it fails there too.
- Impact: hint text is hard to read for low-vision users of the booking admin. Its theme file
  must map a darker faint ink before its migration, which is the application's decision, not the
  kit's; until then a new failure on another `--zl-ink-faint` text in that theme is hidden only
  if it is on this selector
