import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openFixture } from './fixture'
import { openPlayground } from './playground'
import { BACK_LINKS, EXAMPLES, HEADINGS, NESTED, REFERENCES, SAME, WRAPPERS } from './prose.data'
import { WCAG_TAGS } from './wcag'

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

// The `section` and its `li`s have no role or name that tells them from other content, so the
// footnote checks select them by class and id.
const footnotes = (page: Page) =>
  page
    .locator('.playground__example', {
      has: page.getByRole('heading', { name: 'footnotes', exact: true }),
    })
    .locator('.zl-prose')
const notes = (page: Page) => footnotes(page).locator('section.zl-prose__footnotes')

test('the footnotes example marks up its references, its notes block and its notes', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  const prose = footnotes(page)

  const references = prose.locator('p').getByRole('link', { name: /^Footnote \d$/ })
  expect(
    await references.evaluateAll((links) => links.map((a) => a.getAttribute('aria-label'))),
  ).toEqual(REFERENCES.map(({ name }) => name))
  expect(await references.evaluateAll((links) => links.map((a) => a.id))).toEqual(
    REFERENCES.map(({ id }) => id),
  )
  const shape = await references.evaluateAll((links) =>
    links.map((a) => ({
      a: a.getAttributeNames().sort(),
      sup:
        (a.parentElement as Element).tagName +
        (a.parentElement as Element).getAttributeNames().length,
      target: document.getElementById((a.getAttribute('href') as string).slice(1))?.tagName,
      parent: a.parentElement?.children.length,
    })),
  )
  for (const row of shape) {
    expect(row).toEqual({ a: ['aria-label', 'href', 'id'], sup: 'SUP0', target: 'LI', parent: 1 })
  }

  const block = notes(page)
  expect(await block.evaluate((e) => e.getAttributeNames())).toEqual(['class'])
  expect(
    await prose.evaluate((e) => e.lastElementChild?.matches('section.zl-prose__footnotes')),
  ).toBe(true)
  const heading = block.locator('> :first-child')
  await expect(heading).toHaveText('Footnotes')
  expect(await heading.evaluate((e) => [e.tagName, e.className])).toEqual([
    'H4',
    'zl-visually-hidden',
  ])
  expect(await block.evaluate((e) => Array.from(e.children, (c) => c.tagName))).toEqual([
    'H4',
    'OL',
  ])
  expect(await block.locator('ol > li').evaluateAll((li) => li.map((e) => e.id))).toEqual([
    'prose-footnotes-fn-1',
    'prose-footnotes-fn-2',
  ])
})

test('the footnotes example ends each note with back links and keeps a wide URL', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  const block = notes(page)

  for (const { name, href, note, sup } of BACK_LINKS) {
    const link = block.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', href)
    const facts = await link.evaluate((a, note) => {
      const p = a.parentElement as Element
      return {
        inNote: p.closest('li')?.id === note,
        paragraph: p.tagName,
        last: p.lastElementChild === a || p.lastElementChild?.previousElementSibling === a,
        space: a.previousSibling?.textContent?.endsWith(' '),
        glyph: (a.textContent ?? '').startsWith('\u21A9\uFE0E'),
        sup: a.querySelector('sup')?.textContent ?? null,
        attrs: a.getAttributeNames().sort(),
      }
    }, note)
    expect(facts).toEqual({
      inNote: true,
      paragraph: 'P',
      last: true,
      space: true,
      glyph: true,
      sup: sup ? '2' : null,
      attrs: ['aria-label', 'href'],
    })
  }
  expect(await block.locator('li').nth(1).locator('p').count()).toBe(2)
  expect(
    await block
      .locator('li')
      .nth(1)
      .locator('p')
      .last()
      .getByRole('link')
      .last()
      .getAttribute('aria-label'),
  ).toBe('Back to reference 2')

  await page.setViewportSize({ width: 320, height: 800 })
  const wide = block.getByRole('link', { name: /^https:/ })
  expect(
    await wide.evaluate((a) => {
      const probe = document.createElement('span')
      probe.style.whiteSpace = 'nowrap'
      probe.textContent = a.textContent
      a.parentElement?.append(probe)
      const width = probe.getBoundingClientRect().width
      probe.remove()
      return width
    }),
  ).toBeGreaterThan(320)
})

test('a reference does not make its line taller', async ({ page }) => {
  await openFixture(
    page,
    '<div class="zl-prose"><p id="a">Text<sup><a href="#x">1</a></sup></p><p id="b">Text</p><p>End</p></div>',
  )
  const heights = await page.evaluate(() => [
    document.getElementById('a')?.getBoundingClientRect().height,
    document.getElementById('b')?.getBoundingClientRect().height,
  ])
  expect(heights[0]).toBe(heights[1])
})

for (const theme of THEMES) {
  test(`the notes block is ruled, spaced and small in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    const facts = await notes(page).evaluate((block) => {
      const probe = document.createElement('div')
      probe.style.cssText = 'color:var(--zl-line);font-size:var(--zl-text-sm)'
      block.append(probe)
      const expected = {
        colour: getComputedStyle(probe).color,
        size: getComputedStyle(probe).fontSize,
      }
      probe.remove()
      const style = getComputedStyle(block)
      return {
        expected,
        width: style.borderBlockStartWidth,
        line: style.borderBlockStartStyle,
        colour: style.borderBlockStartColor,
        margin: parseFloat(style.marginBlockStart),
        padding: parseFloat(style.paddingBlockStart),
        size: getComputedStyle(block.querySelector('ol') as Element).fontSize,
      }
    })
    expect(facts.width).toBe('1px')
    expect(facts.line).toBe('solid')
    expect(facts.colour).toBe(facts.expected.colour)
    expect(facts.margin).toBeGreaterThan(0)
    expect(facts.padding).toBeGreaterThan(0)
    expect(facts.size).toBe(facts.expected.size)
  })

  test(`a followed reference targets its note, and the back link returns, in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    const first = footnotes(page).getByRole('link', { name: 'Footnote 1' }).first()
    await first.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    const back = notes(page).getByRole('link', { name: 'Back to reference 1', exact: true })
    await expect(back).toBeFocused()

    const states = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.background = 'var(--zl-surface-sunk)'
      document.body.append(probe)
      const sunk = getComputedStyle(probe).backgroundColor
      probe.remove()
      const one = document.getElementById('prose-footnotes-fn-1') as Element
      const two = document.getElementById('prose-footnotes-fn-2') as Element
      return {
        sunk,
        target: one.matches(':target'),
        one: getComputedStyle(one).backgroundColor,
        two: getComputedStyle(two).backgroundColor,
      }
    })
    expect(states.target).toBe(true)
    expect(states.one).toBe(states.sunk)
    expect(states.two).toBe('rgba(0, 0, 0, 0)')

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    const position = await page.evaluate(() => {
      const refs = Array.from(document.querySelectorAll('.zl-prose a[aria-label^="Footnote"]'))
      return refs.findIndex((a) => a === document.activeElement)
    })
    // Focus is on the first reference or the one after it (note 2), never before.
    expect([0, 1]).toContain(position)
  })

  test(`the footnotes page meets WCAG 2.2 AA with note 1 targeted in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    await page.evaluate(() => {
      location.hash = '#prose-footnotes-fn-1'
    })
    expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
  })
}

test('the hidden heading takes no space and the notes block ends without a margin', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  const block = notes(page)
  const heading = block.locator('.zl-visually-hidden') // the heading has no role-free handle
  const hidden = await heading.evaluate((e) => {
    const s = getComputedStyle(e)
    return [s.position, s.width, s.height, s.clipPath]
  })
  expect(hidden).toEqual(['absolute', '1px', '1px', 'inset(50%)'])

  const measure = () =>
    block.evaluate((b) => ({
      height: b.getBoundingClientRect().height,
      top:
        (b.querySelector('ol') as Element).getBoundingClientRect().top -
        b.getBoundingClientRect().top,
    }))
  const before = await measure()
  await heading.evaluate((e) => e.remove())
  expect(await measure()).toEqual(before)
})

test('the notes block ends without a trailing margin and keeps prose wrapping', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  const result = await notes(page).evaluate((block) => {
    const lastLi = block.querySelector('ol > li:last-child') as Element
    const ends = [block, block.querySelector('ol'), lastLi, lastLi.lastElementChild].map(
      (e) => getComputedStyle(e as Element).marginBlockEnd,
    )
    const wraps = [block, ...block.querySelectorAll('li')].map(
      (e) => getComputedStyle(e).overflowWrap,
    )
    return { ends, wraps }
  })
  expect(result.ends).toEqual(['0px', '0px', '0px', '0px'])
  expect(result.wraps).toEqual(['anywhere', 'anywhere', 'anywhere'])
})
