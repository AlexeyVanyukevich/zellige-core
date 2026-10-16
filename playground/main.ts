/// <reference types="vite/client" />
import '@zellige/core/tokens.css'
import '@zellige/core/ui.css'
// The booking admin's font, which its theme names. Loaded for every theme; only that one uses it.
import '@fontsource-variable/golos-text'
import { THEMES, type Theme } from './themes'

// Raw text, so what the page holds is each contract file byte for byte.
const contract = import.meta.glob<string>('../contract/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const sheets = import.meta.glob<string>('./themes/*.css', {
  query: '?inline',
  import: 'default',
  eager: true,
})

const marker = /^ example: ([a-z0-9-]+) $/

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props)
}

// The one piece of behaviour a hand-written page brings to a dialog: initial focus on the frame,
// by `autofocus`, then `showModal()`. Escape and the return of focus are the platform's.
function opener(dialog: HTMLDialogElement, example: string): HTMLButtonElement {
  const button = element('button', {
    type: 'button',
    className: 'zl-button',
    textContent: `Open ${example}`,
  })
  button.addEventListener('click', () => {
    dialog.querySelector('.zl-dialog__frame')?.setAttribute('autofocus', '')
    dialog.showModal()
  })
  return button
}

function component(path: string, source: string): HTMLElement {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.html'.length)
  const heading = element('h2', {
    id: `playground-${name}`,
    textContent: name[0]?.toUpperCase() + name.slice(1),
  })
  const section = element('section', { className: 'playground__component' })
  section.setAttribute('aria-labelledby', heading.id)
  section.append(heading)

  // Each `<!-- example: <name> -->` opens an example; what follows it, up to the next, is its
  // markup. The comment itself stays out of the page. `childNodes` is live and each node moves
  // out of it, so the loop walks a copy.
  const template = element('template', { innerHTML: source })
  let example: HTMLElement | undefined
  let caption = ''
  for (const node of Array.from(template.content.childNodes)) {
    const title = node.nodeType === Node.COMMENT_NODE ? marker.exec(node.textContent ?? '') : null
    if (title?.[1]) {
      caption = title[1].replaceAll('-', ' ')
      example = element('div', { className: 'playground__example' })
      example.append(element('h3', { textContent: caption }))
      section.append(example)
    } else if (example) {
      if (node instanceof HTMLDialogElement) example.append(opener(node, caption))
      example.append(node)
    }
  }
  return section
}

function apply(theme: Theme): void {
  document.documentElement.style.colorScheme = theme.colorScheme
  const style = document.querySelector('style#playground-theme') ?? element('style')
  style.id = 'playground-theme'
  style.textContent = theme.stylesheet ? (sheets[`./themes/${theme.stylesheet}.css`] ?? '') : ''
  document.head.append(style)
}

const select = document.querySelector<HTMLSelectElement>('#theme')
const main = document.querySelector<HTMLElement>('#contract')
if (!select || !main) throw new Error('The playground page is missing its theme select or main')

const wanted = new URLSearchParams(location.search).get('theme')
const initial = THEMES.find((theme) => theme.name === wanted) ?? THEMES[0]
for (const theme of THEMES) select.append(new Option(theme.label, theme.name))
if (initial) {
  select.value = initial.name
  apply(initial)
}
select.addEventListener('change', () => {
  const theme = THEMES.find((candidate) => candidate.name === select.value)
  if (!theme) return
  apply(theme)
  const url = new URL(location.href)
  url.searchParams.set('theme', theme.name)
  history.replaceState(null, '', url)
})

// `?component=<name>` shows one component alone, so its screenshot does not move when another
// component is added above it.
const only = new URLSearchParams(location.search).get('component')
for (const [path, source] of Object.entries(contract).sort(([a], [b]) => a.localeCompare(b))) {
  if (!only || path.endsWith(`/${only}.html`)) main.append(component(path, source))
}
document.documentElement.dataset.ready = 'true'
