import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'

const [first, second] = THEMES
if (!first || !second) throw new Error('The playground needs two themes to switch between')

test('the playground is a page of its own: one h1, one main, no skipped level, no repeated id', async ({
  page,
}) => {
  await openPlayground(page, first)

  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('main')).toHaveCount(1)

  const levels = await page
    .getByRole('heading')
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))))
  const skips = levels.filter((level, i) => i > 0 && level > (levels[i - 1] ?? 0) + 1)
  expect(skips).toEqual([])

  const ids = await page
    .locator('[id]')
    .evaluateAll((elements) => elements.map((element) => element.id))
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
})

test('the theme switcher, by keyboard, applies the next theme and keeps it in the address', async ({
  page,
}) => {
  await openPlayground(page, first)

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Theme')).toBeFocused()
  await page.keyboard.press('ArrowDown')

  await expect(page).toHaveURL(new RegExp(`[?&]theme=${second.name}$`))
  const scheme = await page.evaluate(() => document.documentElement.style.colorScheme)
  expect(scheme).toBe(second.colorScheme)
})
