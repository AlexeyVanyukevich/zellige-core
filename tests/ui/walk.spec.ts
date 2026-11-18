import { expect, test } from '@playwright/test'
import { type Ending, walk } from './walk'

interface Expected {
  role: 'button' | 'link'
  name: string
  /** Which of the elements sharing that role and name; the first by default. */
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
  /** Text the label of the element the ending names contains, when it names one. */
  element?: string
}

const FIXTURES: Fixture[] = [
  {
    label: 'alike',
    html: '<button>Same</button><button>Same</button><a href="#end">Other</a>',
    limit: 10,
    reached: [
      { role: 'button', name: 'Same' },
      { role: 'button', name: 'Same', nth: 1 },
      { role: 'link', name: 'Other' },
    ],
    endings: ['left', 'wrapped'],
  },
  {
    label: 'cap',
    html: '<button>One</button><button>Two</button><button>Three</button>',
    limit: 2,
    reached: [
      { role: 'button', name: 'One' },
      { role: 'button', name: 'Two' },
    ],
    endings: ['cap'],
  },
  {
    label: 'trap',
    html: `<button>One</button><button>Two</button>
      <button onkeydown="if (event.key === 'Tab') { event.preventDefault(); document.querySelectorAll('button')[1].focus() }">Three</button>`,
    limit: 10,
    reached: [
      { role: 'button', name: 'One' },
      { role: 'button', name: 'Two' },
      { role: 'button', name: 'Three' },
    ],
    endings: ['repeated'],
    element: 'Two',
  },
  {
    // While focus is inside the iframe, the page's focused element is the iframe itself, and in
    // Chromium it does not match :focus-visible.
    label: 'iframe',
    html: '<button>One</button><iframe title="Frame" srcdoc="<button>Inner</button>"></iframe><button>After</button>',
    limit: 10,
    reached: [{ role: 'button', name: 'One' }],
    endings: ['not-focus-visible'],
    element: 'iframe',
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
        .getByRole(expected.role, { name: expected.name, exact: true })
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
