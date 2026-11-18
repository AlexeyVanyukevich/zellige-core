import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'

const [theme] = THEMES
if (!theme) throw new Error('The playground has no theme')

// The label of each example's checkbox, which is its accessible name.
const NAMES = {
  plain: 'Remember me',
  checked: 'Send receipts',
  described: 'Send the digest',
  invalid: 'Accept the terms',
  disabled: 'Archive on close',
} as const

type Example = keyof typeof NAMES

const example = (page: Page, name: Example) =>
  page.locator('.playground__example', {
    has: page.getByRole('heading', { name, exact: true }),
  })

const checkbox = (page: Page, name: Example) =>
  example(page, name).getByRole('checkbox', { name: NAMES[name], exact: true })

test('Tab focuses the plain checkbox, and Space ticks it and unticks it', async ({ page }) => {
  await openPlayground(page, theme, 'checkbox')
  await page.getByRole('heading', { name: 'plain', exact: true }).click()

  await page.keyboard.press('Tab')
  await expect(checkbox(page, 'plain')).toBeFocused()
  await expect(checkbox(page, 'plain')).not.toBeChecked()

  await page.keyboard.press('Space')
  await expect(checkbox(page, 'plain')).toBeChecked()

  await page.keyboard.press('Space')
  await expect(checkbox(page, 'plain')).not.toBeChecked()
})

test('Tab moves through the enabled checkboxes in DOM order and never reaches the disabled one', async ({
  page,
}) => {
  await openPlayground(page, theme, 'checkbox')
  await page.getByRole('heading', { name: 'plain', exact: true }).click()

  const reached: string[] = []
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press('Tab')
    const name = await page.evaluate(() => {
      const active = document.activeElement
      return active instanceof HTMLInputElement && active.type === 'checkbox'
        ? (active.labels?.[0]?.textContent?.trim() ?? '')
        : ''
    })
    if (!name) break
    reached.push(name)
  }

  expect(reached).toEqual([NAMES.plain, NAMES.checked, NAMES.described, NAMES.invalid])
})

test('every checkbox is named by its label alone', async ({ page }) => {
  await openPlayground(page, theme, 'checkbox')
  for (const name of Object.keys(NAMES) as Example[]) {
    await expect(checkbox(page, name)).toHaveCount(1)
  }
  await expect(checkbox(page, 'checked')).toBeChecked()
  await expect(checkbox(page, 'disabled')).toBeDisabled()
})

// The description first, then the error: the order the contract records.
const DESCRIPTIONS: { example: Example; description: string }[] = [
  { example: 'described', description: 'Once a week' },
  { example: 'invalid', description: 'Read the terms first Accept the terms to continue' },
]

for (const row of DESCRIPTIONS) {
  test(`the ${row.example} checkbox is described by its description texts, in order`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'checkbox')
    await expect(checkbox(page, row.example)).toHaveAccessibleDescription(row.description)
  })
}

interface Row {
  name: string
  example: Example
  /** What the wrapper's inline-start border, or the label's colour, is read as. */
  kind: 'border' | 'label-colour'
  width?: string
  style?: string
  colour?: '--zl-danger' | '--zl-ink-faint'
}

const ROWS: Row[] = [
  {
    name: 'an invalid checkbox draws a 2px solid danger rule along its inline start',
    example: 'invalid',
    kind: 'border',
    width: '2px',
    style: 'solid',
    colour: '--zl-danger',
  },
  { name: 'a plain checkbox draws no rule', example: 'plain', kind: 'border', width: '0px' },
  {
    name: 'a disabled checkbox draws its label in the faint ink',
    example: 'disabled',
    kind: 'label-colour',
    colour: '--zl-ink-faint',
  },
]

for (const theme of THEMES) {
  for (const row of ROWS) {
    test(`${row.name}, in the ${theme.label} theme`, async ({ page }) => {
      await openPlayground(page, theme, 'checkbox')
      const wrapper = example(page, row.example).locator('.zl-checkbox')
      const target = row.kind === 'border' ? wrapper : wrapper.locator('label')

      const read = await target.evaluate((el, token) => {
        let expected = ''
        if (token) {
          const probe = document.createElement('span')
          probe.style.color = `var(${token})`
          el.parentElement?.append(probe)
          expected = getComputedStyle(probe).color
          probe.remove()
        }
        const style = getComputedStyle(el)
        return {
          expected,
          width: style.borderInlineStartWidth,
          style: style.borderInlineStartStyle,
          colour: style.borderInlineStartColor,
          ink: style.color,
        }
      }, row.colour ?? null)

      if (row.kind === 'label-colour') {
        expect(read.ink).toBe(read.expected)
        return
      }
      expect(read.width).toBe(row.width)
      if (row.style) expect(read.style).toBe(row.style)
      if (row.colour) expect(read.colour).toBe(read.expected)
    })
  }
}
