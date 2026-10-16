import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { THEMES, type Theme } from '../../playground/themes'
import { DIALOGS, openDialog } from './dialogs'
import { KNOWN } from './known'
import { openPlayground } from './playground'
import { WCAG_TAGS } from './wcag'

async function violations(page: Page, theme: Theme) {
  const scan = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  for (const { selector } of KNOWN.filter((known) => known.theme === theme.name)) {
    scan.exclude(selector)
  }
  return (await scan.analyze()).violations
}

for (const theme of THEMES) {
  test(`every contract example meets WCAG 2.2 AA in the ${theme.label} theme`, async ({ page }) => {
    await openPlayground(page, theme)

    expect(await violations(page, theme)).toEqual([])
  })

  for (const example of DIALOGS) {
    test(`the ${example} dialog, open, meets WCAG 2.2 AA in the ${theme.label} theme`, async ({
      page,
    }) => {
      await openPlayground(page, theme)
      await openDialog(page, example, 'pointer')

      expect(await violations(page, theme)).toEqual([])
    })
  }
}
