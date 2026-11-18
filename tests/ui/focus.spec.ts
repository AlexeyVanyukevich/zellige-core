import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'
import { walk } from './walk'

interface Indicator {
  name: string
  style: string
  width: string
  offset: string
  color: string
  expectedColor: string
  /** Only a field control has a border to check. */
  border: string | null
  expectedBorder: string | null
}

// Examples of the playground whose valid field control is made invalid before the walk, so an
// invalid input, select and textarea are all reached. The contract holds no such example.
const MADE_INVALID = [
  { example: 'field with select', role: 'combobox' },
  { example: 'field with textarea', role: 'textbox' },
] as const

for (const theme of THEMES) {
  test(`every element Tab reaches shows the focus outline in the ${theme.label} theme`, async ({
    page,
  }) => {
    // `--zl-duration` is 0ms under reduced motion, so a border is never read mid-transition.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openPlayground(page, theme)
    for (const { example, role } of MADE_INVALID) {
      await page
        .locator('.playground__example', {
          has: page.getByRole('heading', { name: example, exact: true }),
        })
        .getByRole(role)
        .evaluate((control) => control.setAttribute('aria-invalid', 'true'))
    }

    // Reading happens in the page while the element is focused, so `name` is only a label.
    const { reached, ending, element } = await walk(page, {
      limit: 500,
      read: (element): Omit<Indicator, 'name'> => {
        // A token resolved to a colour the way the outline resolves it: through a probe in the
        // same place, since the token itself is only text until something uses it.
        const resolve = (token: string): string => {
          const probe = document.createElement('span')
          probe.style.color = `var(${token})`
          element.parentElement?.append(probe)
          const colour = getComputedStyle(probe).color
          probe.remove()
          return colour
        }
        const field = element.matches('.zl-input, .zl-select, .zl-textarea')
        const invalid = field && element.getAttribute('aria-invalid') === 'true'
        const style = getComputedStyle(element)
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
          expectedColor: resolve(invalid ? '--zl-danger' : '--zl-focus'),
          border: field ? style.borderTopColor : null,
          expectedBorder: field ? resolve('--zl-line-strong') : null,
        }
      },
    })
    // The walk must end at the end of the page; any other end hides the elements after it.
    expect(
      ['left', 'wrapped'],
      `the walk ended ${ending}${element ? ` at ${element}` : ''} after ${reached.length} elements`,
    ).toContain(ending)
    const seen: Indicator[] = reached.map(({ label, value }) => ({ name: label, ...value }))

    expect(seen.length).toBeGreaterThan(0)
    expect(seen).toEqual(
      seen.map(({ name, expectedColor, expectedBorder }) => ({
        name,
        style: 'solid',
        width: '2px',
        offset: '2px',
        color: expectedColor,
        expectedColor,
        border: expectedBorder,
        expectedBorder,
      })),
    )
    // The walk reaches an invalid input, select and textarea, and valid ones too.
    expect(seen.filter(({ border }) => border !== null).length).toBeGreaterThanOrEqual(5)
  })
}
