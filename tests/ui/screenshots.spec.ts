import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { CONTRACT } from './contract'
import { DIALOGS, openDialog } from './dialogs'
import { openPlayground } from './playground'

// Baselines are rendered by the browsers in the Playwright image, which `./run test` connects
// to. A browser on the host renders fonts differently and would fail every comparison.
test.skip(!process.env.ZELLIGE_BROWSER_WS, 'Screenshots run in the Playwright image: ./run test')

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const theme of THEMES) {
  for (const { component } of CONTRACT) {
    test(`${component} in the ${theme.label} theme`, async ({ page }) => {
      await openPlayground(page, theme, component)

      const section = page.getByRole('region', { name: new RegExp(`^${component}$`, 'i') })
      await expect(section).toHaveScreenshot(`${component}-${theme.name}.png`)
    })
  }

  for (const example of DIALOGS) {
    test(`the ${example} dialog, open, in the ${theme.label} theme`, async ({ page }) => {
      await openPlayground(page, theme, 'dialog')
      await openDialog(page, example, 'pointer')

      await expect(page).toHaveScreenshot(`dialog-${example}-open-${theme.name}.png`)
    })
  }
}
