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

## Icons

- Font Awesome is the shared icon system for the web app and is loaded globally through `web/src/css/base.css`.
- Prefer semantic Font Awesome markup in HTML/JS components for visible controls, badges, and status affordances instead of emoji, ad hoc inline SVG fragments, or bespoke icon fonts.
- Keep visible labels alongside icons in buttons, chips, cards, links, and modal actions; icons support the label and should not replace it by default.
- When a pseudo-element icon is necessary, use the package-defined tokens such as `var(--fa-font-solid)` with the appropriate glyph content rather than hardcoded family names tied to a specific Font Awesome version.
- If an icon requires spacing, alignment, or color treatment, handle that in the component stylesheet instead of inline styles or one-off markup attributes.

## Core Rules

1. Keep page entry files such as `web/src/css/index.css` as composition layers: imports first, then only page-level layout and one-off page scaffolding.
2. Each UI component must own its style file in `web/src/css/components/`; when a page entry starts carrying multiple component roots, extract them instead of extending the entry file.
3. If a page-specific component is a contextual variant of a reusable component, keep the shared visual primitive in the reusable component file and let the page-specific file contain only contextual overrides, extra affordances, and container-specific states.
4. If two or more page-scoped components share the same visual primitive and there is no clear reusable base component yet, extract a small shared partial for that page scope instead of duplicating rules or pushing them back into the entry file.
5. Keep project-wide tokens in `web/src/css/tokens.css` under `:root`.
6. Never hardcode palette colors, fonts, radii, or shadows in component files when an existing token already covers the need.
7. Use `var(--token)` for pure shared colors and `rgb(from var(--token) r g b / alpha)` when a shared color needs opacity.
8. For hover, focus, active, muted, and surface variations, prefer `color-mix(...)` or another standards-compliant blend with existing tokens.
9. Prefer nested CSS selectors within each component file to keep styles colocated and scoped.
10. Write all new CSS mobile first: define the base layout and component state for phones at `0`, then progressively enhance upward with `min-width` media queries only.
11. Use this repository breakpoint scale for all new responsive CSS: `sm` `640px`, `md` `768px`, `lg` `1024px`, `xl` `1280px`, `2xl` `1536px`.
12. Do not introduce `max-width` media queries unless the user explicitly asks for an exception or an existing file already requires a targeted compatibility fix.
13. Keep component-specific responsive rules in the same component file as the base styles they modify.
14. Keep component styles in their existing partials unless a genuinely reusable visual primitive emerges and deserves its own partial.
15. Prefer CSS class toggles over inline styles. Dynamic asset URLs or one-off image backgrounds are the exception, not the default.
16. Keep interactions visually soft: subtle lift, border shifts, and shadow changes are preferred over aggressive transforms or high-contrast effects.
17. Do not introduce alternate icon systems or version-specific Font Awesome font-family strings in component CSS.

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
- When in doubt, match the tone of `base.css`, `panel.css`, and `button.css` before inventing a new pattern.

## Review Checklist

- Does each changed component map to a dedicated CSS file?
- Does the page entry file stay slim and act as composition instead of owning leaf component blocks?
- Does the change preserve the warm editorial theme instead of drifting back to a dark or neon look?
- Are all colors, fonts, radii, and shadows tokenized via `var(--...)` where appropriate?
- Do pure colors use `var(--token)`, alpha variants `rgb(from var(--token) r g b / alpha)`, and non-pure blends `color-mix(...)`?
- Do icon treatments follow the shared Font Awesome setup and avoid ad hoc glyph systems or stale font-family names?
- Are nested selectors used for component internals/states?
- Is the base CSS written for mobile first at `0` before any responsive enhancement?
- Do responsive overrides stay colocated with the component they modify and use only `min-width` queries?
- Do responsive breakpoints stay on the shared scale: `640px`, `768px`, `1024px`, `1280px`, `1536px`?
- Are JS visual states represented by CSS classes (not inline styles)?
- Do headings, badges, buttons, and surfaces still match the current typography and component language?
