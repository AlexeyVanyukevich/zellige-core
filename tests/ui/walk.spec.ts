import { expect, test } from '@playwright/test'
import { type Ending, walk } from './walk'

interface Expected {
  name: string
  /** Which of the buttons sharing that name; the first by default. */
  nth?: number
}

interface Fixture {
  label: string
  html: string
  limit: number
  /** The elements the walk reaches, in order. */
  reached: Expected[]
  /** The endings the walk may have. */
  endings: Ending[]
  /** The name of the element the ending names, when it names one. */
  element?: string
}

const FIXTURES: Fixture[] = [
  {
    label: 'alike',
    html: '<button>Same</button><button>Same</button><a href="#end">Other</a>',
    limit: 10,
    reached: [{ name: 'Same' }, { name: 'Same', nth: 1 }, { name: 'Other' }],
    endings: ['left', 'wrapped'],
  },
  {
    label: 'cap',
    html: '<button>One</button><button>Two</button><button>Three</button>',
    limit: 2,
    reached: [{ name: 'One' }, { name: 'Two' }],
    endings: ['cap'],
  },
  {
    label: 'trap',
    html: `<button>One</button><button>Two</button>
      <button onkeydown="if (event.key === 'Tab') { event.preventDefault(); document.querySelectorAll('button')[1].focus() }">Three</button>`,
    limit: 10,
    reached: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }],
    endings: ['repeated'],
    element: 'Two',
  },
]

for (const fixture of FIXTURES) {
  test(`the walk of the ${fixture.label} fixture reaches its elements and ends as expected`, async ({
    page,
  }) => {
    await page.setContent(fixture.html)
    const result = await walk(page, { limit: fixture.limit, read: () => null })

    expect(result.reached).toHaveLength(fixture.reached.length)
    for (const [index, expected] of fixture.reached.entries()) {
      const handle = await page
        .getByRole(expected.name === 'Other' ? 'link' : 'button', {
          name: expected.name,
          exact: true,
        })
        .nth(expected.nth ?? 0)
        .elementHandle()
      const reached = result.reached[index]
      // The same element, by identity; the label plays no part.
      const same = await reached?.handle.evaluate((element, other) => element === other, handle)
      expect(same, `element ${index} of the walk`).toBe(true)
    }
    expect(fixture.endings).toContain(result.ending)
    if (fixture.element !== undefined) expect(result.element).toContain(fixture.element)
  })
}
