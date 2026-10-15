import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { CONTRACT } from './contract'
import { openPlayground } from './playground'

// Baselines are rendered by the browsers in the Playwright image, which `./run test` connects
// to. A browser on the host renders fonts differently and would fail every comparison.
test.skip(!process.env.ZELLIGE_BROWSER_WS, 'Screenshots run in the Playwright image: ./run test')

for (const theme of THEMES) {
  for (const { component } of CONTRACT) {
    test(`${component} in the ${theme.label} theme`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await openPlayground(page, theme, component)

      const section = page.getByRole('region', { name: new RegExp(`^${component}$`, 'i') })
      await expect(section).toHaveScreenshot(`${component}-${theme.name}.png`)
    })
  }
}
