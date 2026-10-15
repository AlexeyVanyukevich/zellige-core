import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'
import { WCAG_TAGS } from './wcag'

for (const theme of THEMES) {
  test(`every contract example meets WCAG 2.2 AA in the ${theme.label} theme`, async ({ page }) => {
    await openPlayground(page, theme)

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

    expect(violations).toEqual([])
  })
}
