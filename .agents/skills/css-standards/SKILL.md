---
name: css-standards
description: Enforce the current web CSS architecture and warm editorial styling conventions in this repository. Use when creating or changing styles, theming, design tokens, component visuals, layout classes, or page atmosphere in web/src/css.
---

# CSS Standards

Use this skill when work touches the web client styling system, component CSS structure, or responsive behavior in `web/src/css/`.

## Scope

Applies to the web client styles under `web/src/css/` and class names used in `web/view/*.html` and `web/src/js/components/*.js`.

## Visual Direction

- The UI theme is warm and print-like, not dark, neon, or glass-heavy.
- Base colors should stay anchored to the current palette: soft paper background, green primary, plum accent, muted text, and restrained blue links.
- Surfaces should feel calm and tactile: soft white cards and panels, warm borders, modest gradients, and controlled shadows.
- Background atmosphere belongs in `base.css` and should stay subtle: layered gradients, low-contrast texture, and no loud decorative effects.
- Avoid reintroducing purple/cyan tech aesthetics unless the user explicitly asks for a different direction.

## Typography

- Use `--font-body` for normal UI copy and form controls.
- Use `--font-display` for hero headings, section headings, and brand-forward moments.
- Use `--font-mono` sparingly for pills, badges, or compact metadata that benefits from a coded label feel.
- Use Font Awesome for UI icons and keep icon styling tied to the package-provided CSS variables instead of version-pinned font-family names.
- The current stack is `Roboto`, `Raleway`, and `Source Code Pro`, loaded through CSS `@import` in `base.css`.
- Do not add new font families in component files. If typography needs to change globally, update `tokens.css` and `base.css` together.

## Responsive Rules

- CSS must be mobile first: define the base layout for `0` first, then enhance it with `min-width` media queries.
- Do not use `max-width` breakpoints unless the user explicitly asks for them or an existing file needs a narrow compatibility exception.
- Use this repository breakpoint scale:
  - `Base`: `0`
  - `sm`: `640px`
  - `md`: `768px`
  - `lg`: `1024px`
  - `xl`: `1280px`
  - `2xl`: `1536px`
- Keep responsive overrides close to the selectors they modify rather than collecting them in detached responsive-only blocks.
- On phones, prefer flush section shells when they improve readability: wrappers may drop outer padding, major cards/sections/modals may reduce to a small radius, and the spacing should move into inner headings, bodies, facts, and action groups.
- Restore the roomier framed-card treatment at the first upward breakpoint instead of preserving desktop gutters on narrow screens.

## Icons

- Font Awesome is the shared icon system for the web app and is loaded globally through `web/src/css/base.css`.
- Prefer semantic Font Awesome markup in HTML/JS components for visible controls, badges, and status affordances instead of emoji, ad hoc inline SVG fragments, or bespoke icon fonts.
- Keep visible labels alongside icons in buttons, chips, cards, links, and modal actions; icons support the label and should not replace it by default.
- When a pseudo-element icon is necessary, use the package-defined tokens such as `var(--fa-font-solid)` with the appropriate glyph content rather than hardcoded family names tied to a specific Font Awesome version.
- If an icon requires spacing, alignment, or color treatment, handle that in the component stylesheet instead of inline styles or one-off markup attributes.

## Core Rules

1. Keep page entry files such as `web/src/css/index.css` as composition layers: imports first, then only page-level layout and one-off page scaffolding.
2. Shared structural shells should live in reusable classes such as `.surface-host` and `.surface-card`, or equivalent project naming, instead of being restated inside every semantic component selector.
3. Each UI component must own its style file in `web/src/css/components/`; semantic selectors should style internals and states, while structural shell rules stay in the shared surface layer and shared tokens.
4. If a page-specific component is a contextual variant of a reusable component, keep the shared visual primitive in the reusable component file and let the page-specific file contain only contextual overrides, extra affordances, and container-specific states.
5. If two or more page-scoped components share the same visual primitive and there is no clear reusable base component yet, extract a small shared partial or shared structural class instead of duplicating rules or pushing them back into the entry file.
6. Keep project-wide tokens in `web/src/css/tokens.css` under `:root`.
7. Never hardcode palette colors, fonts, radii, shadows, or repeated shell spacing in component files when an existing token or shared structural class already covers the need.
8. Use `var(--token)` for pure shared colors and `rgb(from var(--token) r g b / alpha)` when a shared color needs opacity.
9. For hover, focus, active, muted, and surface variations, prefer `color-mix(...)` or another standards-compliant blend with existing tokens.
10. Prefer multiple classes on one element when structure and meaning are different concerns: semantic classes for purpose and JS hooks, structural classes for reusable shells and spacing contracts.
11. Prefer nested CSS selectors within each component file to keep styles colocated and scoped.
12. Write all new CSS mobile first: define the base layout and component state for phones at `0`, then progressively enhance upward with `min-width` media queries only.
13. Use this repository breakpoint scale for all new responsive CSS: `sm` `640px`, `md` `768px`, `lg` `1024px`, `xl` `1280px`, `2xl` `1536px`.
14. Do not introduce `max-width` media queries unless the user explicitly asks for an exception or an existing file already requires a targeted compatibility fix.
15. Keep component-specific responsive rules in the same component file as the base styles they modify.
16. Keep component styles in their existing partials unless a genuinely reusable visual primitive emerges and deserves its own partial.
17. Prefer CSS class toggles over inline styles. Dynamic asset URLs or one-off image backgrounds are the exception, not the default.
18. Keep interactions visually soft: subtle lift, border shifts, and shadow changes are preferred over aggressive transforms or high-contrast effects.
19. Do not introduce alternate icon systems or version-specific Font Awesome font-family strings in component CSS.
20. When mobile layouts feel cramped, reduce outer shell padding and radius first, then keep the breathing room inside the content blocks.

## Structural Classes

- Separate semantic classes from structural classes whenever repeated shells appear across sections, cards, panels, modals, or dashboard surfaces.
- Semantic classes should answer what the element is in the product.
- Structural classes should answer what reusable shell pattern it uses: `.surface-host`, `.surface-card`, `.surface-subtle`, or equivalent project naming.
- Prefer adding a structural class in markup over inventing a new selector that only repeats border, radius, background, shadow, and base padding behavior.
- Keep the structural layer small and reusable; do not drift into utility-class soup.
- When DOM is rendered from JS, include the structural class in the generated `className` so client-rendered surfaces follow the same contract as template markup.

## Token Usage

Use shared token names from `tokens.css`:

- Typography: `--font-body`, `--font-display`, `--font-mono`
- Background/surfaces: `--color-background`
- Brand/accent: `--color-main`, `--color-main-alt`
- Contrast on colored surfaces: `--color-main-contrast`, `--color-alt-contrast`
- Text and links: `--color-text`, `--color-text-secondary`, `--color-link`
- Feedback: `--color-info`, `--color-success`, `--color-warning`, `--color-error`
- Structure: `--color-border`, `--color-shadow`, `--radius`, `--radius-sm`, `--radius-pill`

## Component Language

- `panel.css` should read as a paper surface: bright cards, soft borders, rounded edges, and careful shadows.
- `button.css` uses an earthy, uppercase call-to-action language. Primary buttons lean green, ghost buttons stay surface-based.
- `form.css` should keep form primitives clear and calm.
- `toast.css` and status elements should stay compact, legible, and token-driven.
- Compact metadata elements such as pills, chips, and session badges should feel crisp and intentional, not flashy.
- If a special form control needs structural styling, prefer a small semantic class in HTML such as `.checkbox-field` rather than inline styles.

## Organization Pattern

- `tokens.css`: color, spacing, radius, and font primitives
- `base.css`: reset, atmospheric background, global typography primitives, and font imports
- `index.css`: imports tokens/base/component files plus home-page filter and empty-state rules
- `components/surface.css`: shared structural classes such as `.surface-host` and `.surface-card` when repeated shell patterns exist
- `components/*.css`: component-specific nested rules, including page-specific partials such as panel layouts, event rows, modal layouts, or small shared primitives when several components depend on the same base treatment

## Interaction with JS Components

When a component has visual state changes, toggle CSS classes in JS instead of writing inline styles.

Example pattern:

- JS toggles `alert--error` / `alert--success`, `tab--active`, `form--disabled`, `session-badge--active`, `card--past`
- CSS in the component file defines those variants with token-based colors and surface treatments

## Theming Guardrails

- Prefer warm neutrals and soft contrast over dramatic dark/light clashes.
- Keep gradients within the project palette and use them mainly for large branded surfaces.
- Use `--font-display` only where hierarchy or brand presence matters; do not turn body copy into display text.
- Preserve roomy spacing in forms and cards. The current UI should feel calmer and more breathable than the previous version.
- Do not import a new design system or generic admin theme.
- Do not add dark-mode-only treatments unless explicitly requested.
- Do not mix `max-width` and `min-width` strategies in the same stylesheet by default.
- Do not force every phone layout to keep a centered floating card shell if a flush mobile section reads better.
- When in doubt, match the tone of `base.css`, `panel.css`, and `button.css` before inventing a new pattern.

## Review Checklist

- Do repeated shells use shared structural classes in markup instead of bespoke selector-only shells?
- Does each changed component map to a dedicated CSS file?
- Does the page entry file stay slim and act as composition instead of owning leaf component blocks?
- Do semantic classes and structural classes have separate responsibilities?
- Does the change preserve the warm editorial theme instead of drifting back to a dark or neon look?
- Are all colors, fonts, radii, and shadows tokenized via `var(--...)` where appropriate?
- Do pure colors use `var(--token)`, alpha variants `rgb(from var(--token) r g b / alpha)`, and non-pure blends `color-mix(...)`?
- Do icon treatments follow the shared Font Awesome setup and avoid ad hoc glyph systems or stale font-family names?
- Are nested selectors used for component internals/states?
- Is the base CSS written for mobile first at `0` before any responsive enhancement?
- Do responsive overrides stay colocated with the component they modify and use only `min-width` queries?
- Do responsive breakpoints stay on the shared scale: `640px`, `768px`, `1024px`, `1280px`, `1536px`?
- On phones, are outer shells using the available width well, with spacing pushed inward instead of trapped in desktop wrapper gutters?
- Are JS visual states represented by CSS classes (not inline styles)?
- Do headings, badges, buttons, and surfaces still match the current typography and component language?
