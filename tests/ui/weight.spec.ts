import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openDialog } from './dialogs'
import { openPlayground } from './playground'
import { WEIGHTS } from './weight.data'

// The width of the element's text, by a Range over its contents, so the box around the text
// does not count. It takes no screenshot and has no timing in it.
const WIDTH = (element: Element): number => {
  const range = document.createRange()
  range.selectNodeContents(element)
  return range.getBoundingClientRect().width
}

for (const theme of THEMES) {
  for (const { component, locate, open } of WEIGHTS) {
    test(`${component} text at weight 600 is wider than at 400 in the ${theme.label} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await openPlayground(page, theme, component)
      if (open) await openDialog(page, open, 'pointer')

      const target =
        locate.by === 'role'
          ? page.getByRole(locate.role, { name: locate.name, exact: true }).first()
          : page.getByText(locate.text, { exact: true }).first()
      await expect(target).toBeVisible()
      await expect(target).toHaveCSS('font-weight', '600')

      const semibold = await target.evaluate(WIDTH)
      await target.evaluate((element) => {
        if (element instanceof HTMLElement) element.style.fontWeight = '400'
      })
      const regular = await target.evaluate(WIDTH)

      expect(semibold).toBeGreaterThan(regular)
    })
  }
}
