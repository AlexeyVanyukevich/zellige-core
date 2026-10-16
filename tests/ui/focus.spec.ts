import { expect, test } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'

interface Indicator {
  name: string
  style: string
  width: string
  offset: string
  color: string
  focus: string
}

for (const theme of THEMES) {
  test(`every element Tab reaches shows the focus outline in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme)

    const seen: Indicator[] = []
    for (let step = 0; step < 500; step++) {
      await page.keyboard.press('Tab')
      const indicator = await page.evaluate((): Indicator | null => {
        const element = document.activeElement
        if (!element || element === document.body || !element.matches(':focus-visible')) {
          return null
        }
        // `--zl-focus` resolved to a colour the way the outline resolves it: through a probe
        // in the same place, since the token itself is only text until something uses it.
        const probe = document.createElement('span')
        probe.style.color = 'var(--zl-focus)'
        element.parentElement?.append(probe)
        const focus = getComputedStyle(probe).color
        probe.remove()
        const style = getComputedStyle(element)
        return {
          name: element.outerHTML.slice(0, 80),
          style: style.outlineStyle,
          width: style.outlineWidth,
          offset: style.outlineOffset,
          color: style.outlineColor,
          focus,
        }
      })
      if (!indicator || seen.some(({ name }) => name === indicator.name)) break
      seen.push(indicator)
    }

    expect(seen.length).toBeGreaterThan(0)
    expect(seen).toEqual(
      seen.map(({ name, focus }) => ({
        name,
        style: 'solid',
        width: '2px',
        offset: '2px',
        color: focus,
        focus,
      })),
    )
  })
}
