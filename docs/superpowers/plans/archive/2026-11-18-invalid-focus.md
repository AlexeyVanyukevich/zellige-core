# Invalid focus — plan

Design: `docs/superpowers/specs/2026-11-18-invalid-focus-design.md`.

## Tasks

1. **Docs.** Write the design and this plan.
2. **Tests first.** `tests/ui/focus.spec.ts` expects each element's own outline colour and,
   for field controls, the border colour, with reduced motion emulated and `aria-invalid` set on
   the select and textarea examples. `tests/ui/hover.spec.ts` and `hover.data.ts` check the
   hover rows. Run them against `main`'s `css/field.css` and see them fail.
3. **Fix.** In `css/field.css`, inside `zl.components`, keep the danger border on invalid hover
   and add the focused rules. Commit with the tests.
4. **Check.** `./run check` passes; no screenshot changes.
5. **Architecture.** Update `docs/architecture.md`: the `focus.spec.ts` row, a `hover.spec.ts`
   row, and a line under the contract rules. Move this plan to `docs/superpowers/plans/archive/`.
