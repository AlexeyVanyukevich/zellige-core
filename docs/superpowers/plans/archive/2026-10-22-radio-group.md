# Radio group — implementation plan

Spec: `docs/superpowers/specs/2026-10-22-radio-group-design.md`, approved 2026-10-22. Work happens
on `feat/radio-group`, which holds the spec. Each task writes its test first and sees it fail
where it can. It is done when `./run check` passes, and it ends in one commit holding the test
and the code. Merge by rebase onto `main`, then `git merge --ff-only`.

`docs/backlog.md` was read before planning. No entry touches the radio group's files. "The
Playwright image's system font has no semibold" applies to its label as to every label: its
screenshots in the kit's own themes show weight 400, and only the sample theme's show the 600.

## Decisions this plan adds to the spec

- **The keyboard journey starts from a known place.** It opens the playground with
  `?component=radio` and clicks the `plain` example's `h3` caption, which is not focusable: the
  browser starts its next Tab from there.
- **The keyboard journey runs in one theme**, the first of `THEMES`, as the dialog's does: the
  keyboard model does not change with a theme.

## Task 1: The radio group's contract and CSS

**Files:** `tests/ui/radio.spec.ts` (new), `contract/radio.html` (new), `css/radio.css` (new),
`zl.css`, `tests/ui/__screenshots__/` (new baselines).

- [ ] **Test**, `radio.spec.ts`: in the playground, from the `plain` caption, Tab lands on the
      radio named "Three times"; Arrow Down focuses "Five times" and checks it; Tab lands on
      the `checked` example's checked radio, "Five times"; Shift+Tab returns to "Five times" in
      `plain`. Radios are found by role and name within their group, found by its name.
- [ ] Run `./run test radio`; it fails: no radio group on the page.
- [ ] **Implement:** `contract/radio.html` with §5's four examples and §3's markup;
      `css/radio.css` as §4; `zl.css` imports it after `field.css`.
- [ ] Run `./run test radio`; it passes. If the first Tab stops on every radio of `plain`
      instead, stop: the spec's §6 claim fails for native radios with `tabindex="0"`, and the
      owner decides before anything else is built.
- [ ] Run `./run test --update-snapshots`; look at every new baseline in every theme, the
      sample theme's included.
- [ ] Run `./run check`; commit `feat(radio): add the radio group contract and css`.

## Task 2: The documents

**Files:** `docs/architecture.md`, this plan.

- [ ] `docs/architecture.md`: "Version 0.1 holds eight components" becomes 0.2 and nine, the
      radio group among them; the contract table gains `radio.html`'s row; the contract's rules
      gain one line — "Radios' attributes are React Aria 3.53.1's (`useRadioGroup`, `useRadio`),
      the description outside the label so the name is the label alone, the input native"; the
      browser suite's table gains `radio.spec.ts`.
- [ ] The spec's status line: **built**, with the date.
- [ ] Move this plan to `docs/superpowers/plans/archive/`. Commit `docs: document the radio group`.

## Task 3: Release 0.2.0

- [ ] `package.json` version `0.2.0`; `npm install` to update the lockfile's own version.
- [ ] Commit `chore: release 0.2.0`; rebase the branch onto `main`, `git merge --ff-only`, tag
      `v0.2.0` on that commit.
- [ ] Push `main` and the tag **after the owner says so**: the asking application installs the
      kit over git at the tag.
