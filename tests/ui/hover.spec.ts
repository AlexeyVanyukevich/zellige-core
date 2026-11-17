import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { ROLES, ROWS } from './hover.data'
import { openPlayground } from './playground'

for (const theme of THEMES) {
  for (const row of ROWS) {
    test(`${row.name}, in the ${theme.label} theme`, async ({ page }) => {
      // `--zl-duration` is 0ms under reduced motion, so the border is read once settled.
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await openPlayground(page, theme)

      const control = page
        .locator('.playground__example', {
          has: page.getByRole('heading', { name: row.example, exact: true }),
        })
        .getByRole(row.role ?? ROLES[row.kind])
      if (row.makeInvalid) await control.evaluate((el) => el.setAttribute('aria-invalid', 'true'))

      if (row.keyboardFocused) {
        for (let step = 0; step < 500; step++) {
          await page.keyboard.press('Tab')
          if (await control.evaluate((el) => el === document.activeElement)) break
        }
        await expect(control).toBeFocused()
        expect(await control.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
      }

      await control.hover()

      const { border, expected } = await control.evaluate((el, token) => {
        const probe = document.createElement('span')
        probe.style.color = `var(${token})`
        el.parentElement?.append(probe)
        const expected = getComputedStyle(probe).color
        probe.remove()
        return { border: getComputedStyle(el).borderTopColor, expected }
      }, row.expected)
      expect(border).toBe(expected)
    })
  }
}
