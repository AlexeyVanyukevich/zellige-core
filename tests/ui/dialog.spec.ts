import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { DIALOGS, openDialog } from './dialogs'
import { openPlayground } from './playground'

type Stop = ['button' | 'textbox' | 'combobox', string]

// What Tab reaches inside each dialog example, in order, once focus is on the frame: the close
// button, then the body's controls, then the foot's (spec §6, Accessibility).
const TAB_ORDER: Record<string, Stop[]> = {
  center: [
    ['button', 'Close'],
    ['textbox', 'Guest'],
    ['button', 'Cancel'],
    ['button', 'Save'],
  ],
  side: [
    ['button', 'Close'],
    ['textbox', 'Title'],
    ['combobox', 'Status'],
    ['textbox', 'Notes'],
    ['button', 'Cancel'],
    ['button', 'Save'],
  ],
  'without-foot': [['button', 'Close']],
}

const [theme] = THEMES
if (!theme) throw new Error('The playground has no theme')

test('every dialog example has its tab order written down', () => {
  expect(Object.keys(TAB_ORDER).sort()).toEqual([...DIALOGS].sort())
})

for (const example of DIALOGS) {
  test(`the ${example} dialog, by keyboard: opens onto its frame, keeps Tab inside, holds the page still, closes back to its opener`, async ({
    page,
  }) => {
    await openPlayground(page, theme)
    const { dialog, opener } = await openDialog(page, example, 'keyboard')

    const onFrame = await dialog.evaluate(
      (element) =>
        document.activeElement?.parentElement === element &&
        document.activeElement.getAttribute('tabindex') === '-1',
    )
    expect(onFrame).toBe(true)

    for (const [role, name] of TAB_ORDER[example] ?? []) {
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole(role, { name, exact: true })).toBeFocused()
    }
    // Past the last control, focus may wrap or leave for the browser, never reach the page.
    await page.keyboard.press('Tab')
    const contained = await dialog.evaluate(
      (element) =>
        element.contains(document.activeElement) || document.activeElement === document.body,
    )
    expect(contained).toBe(true)

    // The top-left corner is backdrop under both placements. A wheel there would scroll the
    // page behind an unlocked dialog; nothing to wait on but time, since the point is that
    // nothing moves.
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.move(4, 4)
    await page.mouse.wheel(0, -800)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })
}
