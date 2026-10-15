# Backlog

What is known to be wrong and not yet fixed, newest first. The rule for this file is charter's
`core/rules/backlog.md`: one entry per finding, deleted by the commit that fixes it.

## The booking admin's faint ink fails AA as text

- Where: `playground/themes/bookings.css`, `--ui-ink-faint`; excluded from the scan by
  `tests/ui/known.ts`
- Found: 2026-10-16, while adding Field
- Problem: the booking admin's `--ink-faint`, `#78847f`, is 3.33:1 on its `--paper`, `#eceeec`,
  in the light scheme; AA asks 4.5:1 for text of this size. A field's hint is drawn in it. Delete
  the row in `tests/ui/known.ts` and run `./run test scan`: the Bookings, light scan fails on
  `.ui-field__hint`. The application draws its own hints and notes in the same colour today, so
  it fails there too.
- Impact: hint text is hard to read for low-vision users of the booking admin. Its theme file
  must map a darker faint ink before its migration, which is the application's decision, not the
  kit's; until then a new failure on another `--ui-ink-faint` text in that theme is hidden only
  if it is on this selector
