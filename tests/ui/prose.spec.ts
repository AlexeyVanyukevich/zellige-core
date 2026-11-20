import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { THEMES } from '../../playground/themes'
import { openFixture } from './fixture'
import { openPlayground } from './playground'
import {
  BACK_LINKS,
  EXAMPLES,
  HEADINGS,
  IMAGES,
  LONG_STEP,
  NESTED,
  REFERENCES,
  SAME,
  STEPS,
  TASK_LISTS,
  WRAPPERS,
} from './prose.data'
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
    // the note has no role or name to find it by, so the target is read by id
    expect(await page.evaluate(() => document.querySelector(':target')?.id)).toBe(
      'prose-footnotes-fn-1',
    )
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

// A `li`, `p` and `label` have no role or name of their own, so the task-list checks select
// them by structure; the boxes themselves are found by role and name.
const taskList = (page: Page) =>
  page
    .locator('.playground__example', {
      has: page.getByRole('heading', { name: 'task list', exact: true }),
    })
    .locator('.zl-prose')

test('the task-list example marks up its lists, labels and boxes', async ({ page }) => {
  await openPlayground(page, theme, 'prose')
  const facts = await taskList(page).evaluate((prose) => {
    const kids = Array.from(prose.children)
    const labels = Array.from(prose.querySelectorAll('label'))
    const [tight, loose] = kids as [Element, Element]
    return {
      tags: kids.map((k) => k.tagName),
      tightFirst: Array.from(tight.children, (li) => li.firstElementChild?.tagName),
      nested: tight.children[1]?.querySelector('ul')?.previousElementSibling?.tagName,
      nestedOutside: tight.children[1]?.querySelector('label ul') === null,
      looseFirst: Array.from(loose.children, (li) => {
        const p = li.firstElementChild as Element
        return [p.tagName, p.children.length, p.firstElementChild?.tagName]
      }),
      secondP: loose.children[0]?.querySelectorAll(':scope > p').length,
      labelShape: labels.map((l) => {
        const input = l.firstElementChild as Element
        return {
          input: input.tagName,
          space:
            l.childNodes[1]?.textContent?.startsWith(' ') &&
            !l.childNodes[1].textContent.startsWith('  '),
          attrs: input.getAttributeNames().sort(),
        }
      }),
      plainAttrs: Array.from(prose.querySelectorAll('ul, ol, li, p, label')).flatMap((e) =>
        e.getAttributeNames(),
      ),
    }
  })
  expect(facts.tags).toEqual(TASK_LISTS)
  expect(facts.tightFirst).toEqual(['LABEL', 'LABEL', 'LABEL'])
  expect(facts.nested).toBe('LABEL')
  expect(facts.nestedOutside).toBe(true)
  expect(facts.looseFirst).toEqual([
    ['P', 1, 'LABEL'],
    ['P', 1, 'LABEL'],
  ])
  expect(facts.secondP).toBe(2)
  expect(facts.labelShape).toHaveLength(STEPS.length)
  for (const [i, shape] of facts.labelShape.entries()) {
    expect(shape.input).toBe('INPUT')
    expect(shape.space).toBe(true)
    expect(shape.attrs).toEqual(
      STEPS[i]?.done ? ['checked', 'disabled', 'type'] : ['disabled', 'type'],
    )
  }
  expect(facts.plainAttrs).toEqual([])
})

test('each step is a disabled checkbox named by its own text, checked when done', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  for (const { name, done } of STEPS) {
    const box = taskList(page).getByRole('checkbox', { name, exact: true })
    await expect(box).toHaveCount(1)
    await expect(box).toBeDisabled()
    if (done) await expect(box).toBeChecked()
    else await expect(box).not.toBeChecked()
  }
})

for (const theme of THEMES) {
  test(`task items place their box and text as the plan says in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    const m = await taskList(page).evaluate((prose) => {
      const eps = 0.01
      const rows = Array.from(prose.children).map((list) => {
        const ls = list.getBoundingClientRect()
        return Array.from(list.children).map((li) => {
          const cs = getComputedStyle(li)
          const content = li.getBoundingClientRect().left + parseFloat(cs.paddingLeft)
          const box = (li.querySelector('input') as Element).getBoundingClientRect()
          const label = li.querySelector('label') as Element
          const range = document.createRange()
          range.selectNodeContents(label)
          range.setStart(label, 1)
          const rects = Array.from(range.getClientRects())
          const first = rects[0] as DOMRect
          const nested = Array.from(
            li.querySelectorAll(':scope > ul > li'),
            (n) => getComputedStyle(n).listStyleType,
          )
          return {
            tag: list.tagName,
            type: cs.listStyleType,
            nested,
            ulLeft: ls.left,
            content,
            boxLeft: box.left,
            boxRight: box.right,
            textLeft: first.left,
            gap: first.left - box.right,
            eps,
          }
        })
      })
      return rows.flat()
    })
    expect(m).toHaveLength(STEPS.length)
    for (const r of m) {
      if (r.tag === 'UL') {
        expect(r.type).toBe('none')
        expect(r.boxLeft).toBeGreaterThanOrEqual(r.ulLeft - r.eps)
        expect(r.boxRight).toBeLessThanOrEqual(r.content + r.eps)
        expect(Math.abs(r.textLeft - r.content)).toBeLessThanOrEqual(1)
      } else {
        expect(r.type).toBe('decimal')
        expect(r.boxLeft).toBeGreaterThanOrEqual(r.content - r.eps)
        expect(r.textLeft).toBeGreaterThan(r.boxRight)
      }
      for (const n of r.nested) expect(n).not.toBe('none')
    }
  })

  test(`a step's box is sized, coloured and centred on its first line in the ${theme.label} theme`, async ({
    page,
  }) => {
    await openPlayground(page, theme, 'prose')
    const m = await taskList(page).evaluate((prose) => {
      const probe = document.createElement('div')
      probe.style.color = 'var(--zl-accent)'
      prose.append(probe)
      const accent = getComputedStyle(probe).color
      probe.remove()
      return Array.from(prose.querySelectorAll('li:has(> label > input, > p > label > input)')).map(
        (li) => {
          const input = li.querySelector('input') as HTMLElement
          const label = li.querySelector('label') as HTMLElement
          const box = input.getBoundingClientRect()
          const range = document.createRange()
          range.selectNodeContents(label)
          range.setStart(label, 1)
          const line = range.getClientRects()[0] as DOMRect
          return {
            list: (li.parentElement as Element).tagName,
            size: parseFloat(getComputedStyle(input).fontSize),
            w: box.width,
            h: box.height,
            accent: getComputedStyle(input).accentColor,
            expected: accent,
            centre: box.top + box.height / 2 - (line.top + line.height / 2),
            gap: line.left - box.right,
          }
        },
      )
    })
    expect(m).toHaveLength(STEPS.length)
    for (const r of m) {
      expect(Math.abs(r.w - 1.125 * r.size)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(r.h - 1.125 * r.size)).toBeLessThanOrEqual(0.5)
      expect(r.accent).toBe(r.expected)
      expect(Math.abs(r.centre)).toBeLessThanOrEqual(2)
      expect(r.gap).toBeGreaterThan(0)
    }
    const gap = (tag: string) => m.find((r) => r.list === tag)?.gap ?? NaN
    expect(Math.abs(gap('OL') - gap('UL'))).toBeLessThanOrEqual(0.5)
  })
}

test('a plain item beside a task item keeps its bullet and its text start', async ({ page }) => {
  await openFixture(
    page,
    '<div class="zl-prose"><ul><li><label><input type="checkbox" disabled /> Task</label></li><li>Plain</li></ul></div>',
  )
  const m = await page.evaluate(() => {
    const [task, plain] = Array.from(document.querySelectorAll('li')) as unknown as [
      Element,
      Element,
    ]
    const start = (e: Element, node: Node) => {
      const r = document.createRange()
      r.selectNodeContents(node)
      return (r.getClientRects()[0] as DOMRect).left - e.getBoundingClientRect().left
    }
    const label = task.querySelector('label') as Element
    const text = label.lastChild as Node
    const r = document.createRange()
    r.setStart(text, 1)
    r.setEnd(text, text.textContent?.length ?? 1)
    return {
      type: getComputedStyle(plain).listStyleType,
      attrs: plain.getAttributeNames(),
      plain: start(plain, plain.firstChild as Node),
      task: (r.getClientRects()[0] as DOMRect).left - task.getBoundingClientRect().left,
    }
  })
  expect(m.type).toBe('disc')
  expect(m.attrs).toEqual([])
  expect(Math.abs(m.plain - m.task)).toBeLessThanOrEqual(1)
})

test('a wrapped step continues at its text offset, not under the box', async ({ page }) => {
  const item = `<li><label><input type="checkbox" disabled /> ${LONG_STEP}</label></li>`
  await openFixture(
    page,
    `<div class="zl-prose" style="inline-size:200px"><ul>${item}</ul><ol>${item}</ol></div>`,
  )
  const lines = await page.evaluate(() =>
    Array.from(document.querySelectorAll('label'), (label) => {
      const r = document.createRange()
      r.selectNodeContents(label)
      r.setStart(label, 1)
      // the leftmost rect of each line, `code` border box included
      const line = parseFloat(getComputedStyle(label).lineHeight)
      const byTop = new Map<number, number>()
      for (const c of Array.from(r.getClientRects())) {
        const row = Math.floor((c.top + c.height / 2) / line)
        byTop.set(row, Math.min(byTop.get(row) ?? Infinity, c.left))
      }
      return Array.from(byTop.values())
    }),
  )
  for (const left of lines) {
    expect(left.length).toBeGreaterThan(1)
    for (const l of left) expect(Math.abs(l - (left[0] as number))).toBeLessThanOrEqual(1)
  }
})

test("a done step's text is styled as a plain item's", async ({ page }) => {
  await openPlayground(page, theme, 'prose')
  const styles = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.zl-prose li label'))
    const done = labels.find((l) => l.querySelector('input:checked'))
    const open = labels.find((l) => l.querySelector('input:not(:checked)'))
    const plain = document.querySelector('.zl-prose > ul > li')
    return [done, open, plain, done?.closest('li'), open?.closest('li')].map((e) => {
      if (!e) throw new Error('an element of the comparison is missing')
      const s = getComputedStyle(e)
      return [s.color, s.textDecorationLine, s.fontWeight, s.opacity]
    })
  })
  for (const s of styles) expect(s).toEqual(styles[2])
})

test('a link in a step stays a Tab stop and the box is not one', async ({ page }) => {
  await openFixture(
    page,
    '<div class="zl-prose"><ul><li><label><input type="checkbox" disabled /> Read <a href="#x">the terms</a></label></li></ul><a id="after" href="#y">After</a></div>',
  )
  await expect(page.getByRole('checkbox', { name: 'Read the terms', exact: true })).toBeDisabled()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'the terms' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#after')).toBeFocused()
  // the fixture page has no lang or title, which is not what this test is about
  await page.evaluate(() => {
    document.documentElement.setAttribute('lang', 'en')
    document.title = 'Fixture'
  })
  expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
})

test('Tab from the last footnote back link does not enter the task-list example', async ({
  page,
}) => {
  await openPlayground(page, theme, 'prose')
  await page.getByRole('link', { name: 'Back to reference 2', exact: true }).focus()
  await page.keyboard.press('Tab')
  expect(
    await page.evaluate(
      () =>
        document.activeElement?.closest('.zl-prose') !== null &&
        document.activeElement?.closest('.playground__example')?.querySelector('h2,h3,h4')
          ?.textContent === 'task list',
    ),
  ).toBe(false)
})

// The size test above reads the input's own font size, which `font: inherit` sets; this one
// reads the label's, so a box left at the platform's smaller input font fails here.
test("a step's box is 1.125 times its label's font size", async ({ page }) => {
  await openPlayground(page, theme, 'prose')
  const sizes = await taskList(page).evaluate((prose) =>
    Array.from(prose.querySelectorAll('label'), (label) => ({
      box: (label.querySelector('input') as Element).getBoundingClientRect().width,
      text: parseFloat(getComputedStyle(label).fontSize),
    })),
  )
  expect(sizes).toHaveLength(STEPS.length)
  for (const { box, text } of sizes) expect(Math.abs(box - 1.125 * text)).toBeLessThanOrEqual(0.5)
})

test('a plain item holding a nested task list keeps its bullet', async ({ page }) => {
  await openFixture(
    page,
    '<div class="zl-prose"><ul><li id="parent">Phase<ul><li><label><input type="checkbox" disabled /> Step</label></li></ul></li></ul></div>',
  )
  expect(
    await page.evaluate(
      () => getComputedStyle(document.getElementById('parent') as Element).listStyleType,
    ),
  ).toBe('disc')
})

for (const row of IMAGES) {
  test(`${row.name} in prose (${row.where}) renders at the size its place allows`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${row.width}" height="${row.height}"></svg>`
    const img = `<img id="pic" alt="" width="${row.width}" height="${row.height}" src="data:image/svg+xml,${encodeURIComponent(svg)}">`
    const table = `<div class="zl-prose__scroll" role="group" tabindex="0" aria-label="Table"><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>${img}</td></tr></tbody></table></div>`
    const body = {
      paragraph: `<div class="zl-prose" id="prose"><p>${img}</p></div>`,
      'table cell': `<div class="zl-prose" id="prose">${table}</div>`,
      'layout table cell': `<table><tbody><tr><td><div class="zl-prose" id="prose"><p>${img}</p></div></td></tr></tbody></table>`,
    }[row.where]
    await openFixture(page, body)
    await page.evaluate(() => (document.getElementById('pic') as HTMLImageElement).decode())

    const m = await page.evaluate(() => {
      const pic = document.getElementById('pic') as HTMLElement
      const prose = document.getElementById('prose') as HTMLElement
      const style = getComputedStyle(prose)
      const box = pic.getBoundingClientRect()
      const group = document.querySelector('[aria-label="Table"]')
      const root = document.documentElement
      return {
        w: box.width,
        h: box.height,
        content: prose.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        client: root.clientWidth,
        pageScroll: root.scrollWidth,
        groupScroll: group?.scrollWidth ?? 0,
        groupClient: group?.clientWidth ?? 0,
      }
    })

    const width = row.renders === 'container' ? m.content : row.width
    expect(m.w).toBeCloseTo(width, 0)
    expect(m.h).toBeCloseTo((width * row.height) / row.width, 0)
    expect(m.pageScroll).toBeLessThanOrEqual(m.client)
    if (row.where === 'table cell') expect(m.groupScroll).toBeGreaterThan(m.groupClient)
    if (row.where === 'layout table cell') expect(m.w).toBeLessThanOrEqual(m.client)
    if (row.name === 'a wide image') {
      await page.evaluate(() => {
        document.documentElement.setAttribute('lang', 'en')
        document.title = 'Fixture'
      })
      expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
    }
  })
}
