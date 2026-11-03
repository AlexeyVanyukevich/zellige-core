import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openPlayground } from './playground'
import { EXAMPLES, HEADINGS, NESTED, SAME, WRAPPERS } from './prose.data'

const root = join(import.meta.dirname, '../..')
const origin = 'http://kit.test'

// A page of its own that loads the kit as an application would, served unprocessed, so the
// fixtures need no playground and the contract holds none of them.
async function openFixture(page: Page, body: string): Promise<void> {
  await page.route(`${origin}/**`, async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1)
    if (file === '') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html><head><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/zl.css"></head><body>${body}</body></html>`,
      })
    }
    return route.fulfill({ contentType: 'text/css', body: readFileSync(join(root, file), 'utf8') })
  })
  await page.goto(`${origin}/`)
}

test('headings h1 to h6 are sized from --zl-text, in descending order, at weight 600', async ({
  page,
}) => {
  const headings = HEADINGS.map(({ level }) => `<h${level}>Heading ${level}</h${level}>`).join('')
  await openFixture(page, `<div class="zl-prose">${headings}</div>`)

  const computed = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.zl-prose > *'), (heading) => {
      const style = getComputedStyle(heading)
      return { size: parseFloat(style.fontSize), weight: style.fontWeight }
    }),
  )

  expect(computed.map(({ size }) => size)).toEqual(HEADINGS.map(({ px }) => px))
  expect(computed.map(({ weight }) => weight)).toEqual(HEADINGS.map(() => '600'))
  computed.forEach(({ size }, index) => {
    if (index > 0) expect(size).toBeLessThan(computed[index - 1]?.size ?? 0)
  })
})

const [theme] = THEMES
if (!theme) throw new Error('The playground has no theme')

for (const example of EXAMPLES) {
  test(`the ${example} example has no margin above its first child or below its last`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    const prose = page
      .locator('.playground__example', {
        has: page.getByRole('heading', { name: example.replaceAll('-', ' '), exact: true }),
      })
      .locator('.zl-prose')

    const margins = await prose.evaluate((element) => ({
      top: getComputedStyle(element.firstElementChild as Element).marginBlockStart,
      bottom: getComputedStyle(element.lastElementChild as Element).marginBlockEnd,
    }))
    expect(margins).toEqual({ top: '0px', bottom: '0px' })
  })
}

for (const { name, html, label } of NESTED) {
  test(`a ${name} computes the same inside prose as outside it`, async ({ page }) => {
    const around = (component: string): string => `<p>Before</p>${component}<p>After</p>`
    await openFixture(
      page,
      `<div id="inside" class="zl-prose" style="inline-size:160px">${around(html(label))}</div>` +
        `<div id="outside" style="inline-size:160px">${around(html(label))}</div>`,
    )

    const measure = (id: string): Promise<Record<string, string | number>> =>
      page.evaluate(
        ({ id, same }) => {
          const component = document.querySelector(`#${id} > :nth-child(2)`) as Element
          const style = getComputedStyle(component) as unknown as Record<string, string>
          const range = document.createRange()
          range.selectNodeContents(component)
          return {
            ...Object.fromEntries(same.map((property) => [property, style[property] ?? ''])),
            labelHeight: range.getBoundingClientRect().height,
          }
        },
        { id, same: SAME },
      )

    const inside = await measure('inside')
    const outside = await measure('outside')
    expect(inside).toEqual(outside)
    expect(inside['overflowWrap']).toBe('normal')
  })
}

for (const theme of THEMES) {
  test(`at 320px the prose page does not scroll sideways, and its wrappers do, in the ${theme.label} theme`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await openPlayground(page, theme, 'prose')

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(widths.scroll).toBeLessThanOrEqual(widths.client)

    for (const { example, name } of WRAPPERS) {
      const wrapper = page
        .locator('.playground__example', {
          has: page.getByRole('heading', { name: example.replaceAll('-', ' '), exact: true }),
        })
        .getByRole('group', { name, exact: true })
      const overflow = await wrapper.evaluate((element) => ({
        scroll: element.scrollWidth,
        client: element.clientWidth,
      }))
      expect(overflow.scroll).toBeGreaterThan(overflow.client)
    }
  })
}
