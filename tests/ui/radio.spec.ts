import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'

const [theme] = THEMES
if (!theme) throw new Error('The playground has no theme')

// The browser's own handling of native radios, which the binding's React Aria hooks repeat:
// the group is one Tab stop, the arrow keys move and check (spec §6).
test('a radio group is one Tab stop, and the arrow keys move between its radios and check them', async ({
  page,
}) => {
  await openPlayground(page, theme, 'radio')
  const plain = page.getByRole('radiogroup', { name: 'Retries' }).nth(0)
  const checked = page.getByRole('radiogroup', { name: 'Retries' }).nth(1)

  await page.getByRole('heading', { name: 'plain', exact: true }).click()
  await page.keyboard.press('Tab')
  await expect(plain.getByRole('radio', { name: 'Three times' })).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(plain.getByRole('radio', { name: 'Five times' })).toBeFocused()
  await expect(plain.getByRole('radio', { name: 'Five times' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(checked.getByRole('radio', { name: 'Five times' })).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(plain.getByRole('radio', { name: 'Five times' })).toBeFocused()
})
