@node_modules/charter/core/rules.md

# @zellige/core

The framework-free half of the zellige component kit: design tokens, the components' CSS, and
each component's reference HTML in `contract/`, which every binding renders exactly. It ships no
JavaScript. The React binding, `@zellige/react`, is its own repository and reads `contract/`
from this package to prove it matches.

Not built yet: the design is `docs/superpowers/specs/2026-10-14-zellige-core-design.md`, and
`docs/architecture.md` takes over when the first slice ships.

`./run check` is the verification command. Start sessions at the repository root.
