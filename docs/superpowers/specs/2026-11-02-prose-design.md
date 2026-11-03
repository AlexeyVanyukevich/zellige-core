# Prose styles

Status: approved 2026-11-02, built in 0.2.x.

> **This is a decision record.** Read it for why prose went the way it did, never for what the
> kit does. `docs/architecture.md` is authoritative for that.

## Goal

An application that renders Markdown wraps it in `.zl-prose` and gets the kit's headings, lists,
tables, code and links, styled with the kit's tokens. This covers the consuming board and the
binding's `Markdown` component. The binding owns the parser; core ships no JavaScript.

## What was decided

- `css/prose.css` keeps every rule in `zl.components` and styles the classless descendants
  `h1`–`h6`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `code`, `pre`, `blockquote`, `hr`,
  `table`, `thead`, `th` and `td`. No heading-size token is added: sizes are multiples of
  `--zl-text`.
- Every selector that reaches a classless descendant wraps `.zl-prose` and any pseudo-class in
  `:where()`, so a kit component nested in prose keeps its own styles.
- Every `table` and `pre` sits alone inside `<div class="zl-prose__scroll" role="group"
tabindex="0" aria-label="Table|Code block">`. The wrapper scrolls (`overflow-x: auto`,
  `contain: inline-size`); neither `pre` nor `table` scrolls on its own.
- The contract holds `document`, `wide-table` and `long-code-line`, using `h4`–`h6` because the
  playground's outline already holds `h1`–`h3`. A test fixture proves `h1`–`h3`.
- `img` is left out; its reflow risk is a GitHub issue.

## Why `group` replaced `region`

The repository's html-validate presets fail `region` twice. `prefer-native-element` maps
`region` to `section`, so `<div role="region">` is an error. `unique-landmark` fails two regions
in one file that share an `aria-label`, and a document with three tables would give a screen
reader's landmark list three entries named "Table". A named `group` is not a landmark and is not
in that mapping. axe's `scrollable-region-focusable` needs only `tabindex="0"`.

The wrapper always has `tabindex="0"`. Dropping it when the content fits would need the binding
to measure overflow, and again on every resize, and its markup would then differ from the
contract. The cost is one extra Tab stop per table or code block that already fits.

## Why the edge rules keep their pseudo-class outside `:where()`

`.zl-prose > :first-child` and `:last-child` follow `.zl-card`'s. Inside prose they must outrank
the descendant rules. Measured in Chromium, `:where(.zl-prose > :first-child)` has zero
specificity and lost to `:where(.zl-prose) h4` and `:where(.zl-prose) p`, leaving a 16px top and
a 12px bottom margin. `:where(.zl-prose) > :first-child` has specificity (0,1,0): it beats every
classless descendant rule (0,0,1) and ties with `.zl-prose__scroll`, which it wins by coming
last in the file.

## Why `overflow-wrap: anywhere`, and tables reset to `normal`

At 320 px, `break-word` does not lower the min-content width, so a long URL widened the
playground's grid column (page `scrollWidth` 558). `anywhere` lowers it. But inherited into
table cells it broke words mid-word and shrank the cells to 42px, so a wide table fitted its
wrapper and no longer scrolled. A table keeps its words whole and scrolls in its wrapper.

## Why nested kit components reset `overflow-wrap` to `normal`

`overflow-wrap` is inherited, so `anywhere` reached a nested component. A `.zl-button` link with
a long word wrapped onto two lines inside prose (36px of text) and stayed on one outside it
(18px). No kit stylesheet sets `overflow-wrap`, so a zero-specificity reset on
`:where(.zl-prose [class^="zl-"], .zl-prose [class*=" zl-"])` only stops the inheritance, and a
component that later sets its own value still wins. The test measures the label's text with a
`Range`, because the button's `min-height` hides a second line.

## Accessibility

- **Focus order.** Document order. A wrapper is one Tab stop, before any link inside it.
- **Accessible names.** A table's wrapper is named `Table` and a code block's `Code block`; a
  screen reader announces "Table, group" and "Code block, group".
- **Heading structure.** The contract uses `h4`–`h6`. The consumer shifts levels so that prose
  continues the page's outline.
- **Focus indicator.** The base layer's `:focus-visible` outline in `--zl-focus`; no prose rule
  sets `outline`.
- **Links** are underlined in every state, so colour is never their only mark (WCAG 1.4.1).
- **States.** None beyond focus.
- **Errors.** None.
- **Reflow.** At 320 px, prose made of the listed elements causes no horizontal page scroll;
  only a wrapper scrolls (WCAG 1.4.10).
