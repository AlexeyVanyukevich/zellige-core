# Invalid focus — design

Status: **built**, 2026-11-18; approved and designed 2026-11-18.

> **This becomes a decision record once the slice ships.**
>
> It states what was decided before any of it was built, and is not revised after. Read it to
> learn **why** a focused invalid field control looks as it does. For **what** the kit does
> today, read `docs/architecture.md`, which the slice's last task updates.

The [kit's design](2026-10-14-zellige-core-design.md) holds for everything this one does not
mention. This document changes how three controls look in two states.

---

## 1. Why

`css/base.css` draws every `:focus-visible` element with a 2px solid `--zl-focus` outline at a
2px offset. `css/field.css` gives an invalid control a `--zl-danger` border. A focused invalid
control therefore showed a red border with an accent ring 2px outside it: two outlines, one of
them saying nothing about the error.

A second defect sits in the same rule. The hover rule for the field controls has specificity
(0,3,0) and the invalid rule (0,2,0), so hovering an invalid control turned its red border grey.
The owner chose to fix it in the same slice.

## 2. Decisions

**The ring takes the danger colour and the border returns to neutral.** While an invalid control
matches `:focus-visible`, its outline is the same 2px solid at a 2px offset, in `--zl-danger`,
and its border is `--zl-line-strong`, as a valid control's. One ring shows, in the colour that
carries the error, around a neutral border. An invalid control that is not focused keeps the red
border, hovered or not. Focused and hovered, it keeps the neutral border.

**Only the three field controls change.** The input, select and textarea are the controls with
a border that signals invalidity. An invalid radio group's radios keep the accent ring, and so do
buttons and every other element.

**No new token.** The ring uses `--zl-danger`. It is 5.24:1 on `--zl-bg` and 5.62:1 on
`--zl-surface` in the kit's light defaults, 6.78:1 and 6.21:1 in the dark. In the sample theme
it is 5.63:1 and 6.23:1 in light, 7.25:1 and 6.64:1 in dark. All are above the 3:1 a focus
indicator needs (WCAG 2.2 AA, 2.4.7 and 1.4.11). A per-state focus token would add a name for
no value the existing tokens do not hold.

**The contract is unchanged.** The states are already attributes, and the markup does not change
with how they look. The contract holds no invalid select or textarea; the tests set
`aria-invalid` on the valid examples instead.

**The hover fix.** The invalid hover rule is `:hover:not(:disabled)` on the invalid selector,
specificity (0,4,0), so it beats the valid hover rule and keeps the danger border. The focused
rules come after it, with and without `:hover`, so the neutral border wins while focused.

**Tests settle the transition.** The field controls transition `border-color` over
`--zl-duration`, so a border read at once is read mid-transition. The tests emulate reduced
motion, which sets the duration to 0ms.

## 3. Accessibility

Focus order, accessible names and heading structure are unchanged: no markup changes. The
control keeps `aria-invalid='true'` and `aria-describedby`, so a screen reader announces it as
invalid and reads the error text as its description. The visual signal is the red border while
unfocused and the red ring while focused; **colour is never the only signal**, because the error
text stays beside the control in both. The ring keeps at least 3:1 against both backgrounds in
every theme, as above.
