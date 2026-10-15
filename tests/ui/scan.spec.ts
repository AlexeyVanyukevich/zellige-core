import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { KNOWN } from './known'
import { openPlayground } from './playground'
import { WCAG_TAGS } from './wcag'

for (const theme of THEMES) {
  test(`every contract example meets WCAG 2.2 AA in the ${theme.label} theme`, async ({ page }) => {
    await openPlayground(page, theme)

    const scan = new AxeBuilder({ page }).withTags(WCAG_TAGS)
    for (const { selector } of KNOWN.filter((known) => known.theme === theme.name)) {
      scan.exclude(selector)
    }
    const { violations } = await scan.analyze()

    expect(violations).toEqual([])
  })
}
