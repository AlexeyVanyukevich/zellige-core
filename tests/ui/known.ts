// Accessibility failures that are known and not yet fixed. Each is left out of the scan for one
// selector in one theme, never for the suite, and each has its GitHub issue. Fixing one deletes
// its row in the commit that closes the issue.
export interface KnownFailure {
  theme: string
  selector: string
  issue: number
}

export const KNOWN: readonly KnownFailure[] = []
