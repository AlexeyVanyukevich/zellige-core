import { expect, type Locator, type Page } from '@playwright/test'
import { CONTRACT } from './contract'

// The dialog contract's examples, each opened in the playground by a button named for it.
export const DIALOGS: string[] =
  CONTRACT.find(({ component }) => component === 'dialog')?.examples ?? []

export async function openDialog(
  page: Page,
  example: string,
  by: 'keyboard' | 'pointer',
): Promise<{ dialog: Locator; opener: Locator }> {
  const opener = page.getByRole('button', {
    name: `Open ${example.replaceAll('-', ' ')}`,
    exact: true,
  })
  if (by === 'keyboard') {
    await opener.focus()
    await page.keyboard.press('Enter')
  } else {
    await opener.click()
  }
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return { dialog, opener }
}
