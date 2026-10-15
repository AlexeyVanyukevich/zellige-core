import { expect, type Page } from '@playwright/test'
import type { Theme } from '../../playground/themes'

// The emulated scheme matches the theme's, so `light-dark()` and `prefers-color-scheme` agree.
export async function openPlayground(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme.colorScheme })
  await page.goto(`/?theme=${theme.name}`)
  await expect(page.locator('html[data-ready]')).toHaveCount(1)
}
