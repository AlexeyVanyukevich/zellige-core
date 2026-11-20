import { expect, test } from '@playwright/test'
import { openFixture } from './fixture'
import { LAYOUTS } from './layout.data'

const GRID = 'display: grid; grid-template-columns: 20rem 20rem; margin-block-end: 1rem'

for (const row of LAYOUTS) {
  test(`${row.component} stretched to a taller grid row keeps its children at content height, aligned ${row.alignment}`, async ({
    page,
  }) => {
    await openFixture(
      page,
      `<div id="lone" style="${GRID}">${row.markup('lone')}</div>
<div id="stretched" style="${GRID}">${row.markup('stretched')}<div style="block-size: 20rem"></div></div>`,
    )

    const measure = (grid: string) =>
      page.evaluate(
        ([gridId, selector]) => {
          const component = document.querySelector(`#${gridId} > :first-child`)!
          const top = component.getBoundingClientRect().top
          return {
            height: component.getBoundingClientRect().height,
            children: Array.from(component.querySelectorAll(selector!), (child) => {
              const box = child.getBoundingClientRect()
              return { offset: box.top - top, height: box.height }
            }),
          }
        },
        [grid, row.children],
      )

    const lone = await measure('lone')
    const stretched = await measure('stretched')

    expect(stretched.height).toBeGreaterThan(lone.height)
    expect(lone.children.length).toBeGreaterThanOrEqual(2)
    if (row.alignment === 'start') {
      expect(stretched.children).toEqual(lone.children)
      return
    }
    const shift = (stretched.height - lone.height) / 2
    expect(stretched.children).toHaveLength(lone.children.length)
    lone.children.forEach((child, index) => {
      const spread = stretched.children[index]!
      expect(spread.height).toBe(child.height)
      expect(spread.offset).toBeCloseTo(child.offset + shift, 1)
    })
  })
}
