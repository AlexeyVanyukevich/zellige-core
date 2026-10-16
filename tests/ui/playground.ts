import { expect, type Page } from '@playwright/test'
import type { Theme } from '../../playground/themes'

// The emulated scheme matches the theme's, so `light-dark()` and `prefers-color-scheme` agree.
// With a component, the page shows that component alone.
export async function openPlayground(page: Page, theme: Theme, component?: string): Promise<void> {
  await page.emulateMedia({ colorScheme: theme.colorScheme })
  const query = new URLSearchParams({ theme: theme.name, ...(component ? { component } : {}) })
  await page.goto(`/?${query}`)
  await expect(page.locator('html[data-ready]')).toHaveCount(1)
}
