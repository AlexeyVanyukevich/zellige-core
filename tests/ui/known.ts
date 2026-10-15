// Accessibility failures that are known and not yet fixed. Each is left out of the scan for one
// selector in one theme, never for the suite, and each has its entry in `docs/backlog.md`.
// Fixing one deletes its row and its entry together.
export interface KnownFailure {
  theme: string
  selector: string
  backlog: string
}

export const KNOWN: readonly KnownFailure[] = [
  {
    theme: 'bookings-light',
    selector: '.ui-field__hint',
    backlog: "The booking admin's faint ink fails AA as text",
  },
]
