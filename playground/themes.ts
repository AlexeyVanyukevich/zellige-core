export interface Theme {
  /** In the address, as `?theme=<name>`, and in screenshot names. */
  name: string
  label: string
  colorScheme: 'light' | 'dark'
  /** A file in `playground/themes/`, loaded after the kit. The kit's own defaults have none. */
  stylesheet?: string
}

// The playground's switcher and every themed test read this list, so a theme added here is
// scanned, focus-checked and screenshotted with no test edit.
export const THEMES: readonly Theme[] = [
  { name: 'kit-light', label: 'Kit, light', colorScheme: 'light' },
  { name: 'kit-dark', label: 'Kit, dark', colorScheme: 'dark' },
]
