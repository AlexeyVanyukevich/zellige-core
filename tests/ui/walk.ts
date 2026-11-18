import type { ElementHandle, JSHandle, Page } from '@playwright/test'

/** How a walk stopped. */
export type Ending = 'left' | 'wrapped' | 'repeated' | 'not-focus-visible' | 'cap'

export interface Reached<T> {
  /** The element itself; identity is what tells one reached element from another. */
  handle: JSHandle<Element>
  /** For failure output only; it never decides whether an element was reached before. */
  label: string
  /** What `read` returned while the element was focused. */
  value: T
}

export interface Walk<T> {
  reached: Reached<T>[]
  ending: Ending
  /** The label of the element a `repeated` or `not-focus-visible` ending names. */
  element: string | null
}

interface Options<T> {
  /** The most Tab presses the walk makes. */
  limit: number
  /** Runs in the page on each reached element, while it is focused. */
  read: (element: Element) => T
}

// Runs in the page, so it names nothing outside itself.
function describe(element: Element): string {
  const textLength = 40
  const parts = [element.localName]
  if (element.id) parts.push(`#${element.id}`)
  const role = element.getAttribute('role')
  if (role) parts.push(`[role=${role}]`)
  const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ')
  if (text) parts.push(`"${text.slice(0, textLength)}"`)
  return parts.join(' ')
}

/** Presses Tab until focus leaves the page, comes back round, or `limit` presses are made. */
export async function walk<T>(page: Page, { limit, read }: Options<T>): Promise<Walk<T>> {
  const reached: Reached<T>[] = []
  for (let step = 0; step < limit; step++) {
    await page.keyboard.press('Tab')
    const active = await page.evaluateHandle(() => document.activeElement)
    const handle: ElementHandle<Element> | null = active.asElement()
    if (!handle) return { reached, ending: 'left', element: null }

    const state = await handle.evaluate(
      (element, before) => {
        return {
          body: element === document.body,
          focusVisible: element.matches(':focus-visible'),
          index: before.findIndex((other) => other === element),
        }
      },
      reached.map(({ handle: seen }) => seen),
    )
    if (state.body) return { reached, ending: 'left', element: null }

    const label = await handle.evaluate(describe)
    if (!state.focusVisible) return { reached, ending: 'not-focus-visible', element: label }
    if (state.index === 0) return { reached, ending: 'wrapped', element: null }
    if (state.index > 0) return { reached, ending: 'repeated', element: label }
    reached.push({ handle, label, value: await handle.evaluate(read) })
  }
  return { reached, ending: 'cap', element: null }
}
