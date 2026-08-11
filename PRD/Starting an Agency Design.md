# Design System — GetUsRanked

*Documents the actual design implemented in `index.html`, so it can be extended consistently for future pages (blog, dashboard) without drifting.*

## 1. Concept
The core visual idea is tied directly to the brand name: a "rank shift" — moving from a poor search position to #1. That idea shows up once, prominently, in the hero (the 47 → 1 card) rather than being repeated everywhere. Everything else is deliberately plain and industry-neutral: no niche imagery, no decorative flourishes that don't carry meaning.

**Personality:** confident, plainspoken, transparent. The design should never feel like it's overselling — flat colors, hard edges, no gradients or drop shadows, nothing glossy.

## 2. Color Palette

| Token (CSS var) | Hex | Role |
|---|---|---|
| `--canvas` | `#EEF1EF` | Page background |
| `--canvas-deep` | `#E2E7E2` | Alternating section background (e.g. "Who We Help") |
| `--card` | `#F7F9F6` | Card/panel surfaces sitting on canvas |
| `--ink` | `#13161C` | Primary text, borders on light surfaces |
| `--ink-soft` | `#565C5A` | Secondary/muted text, descriptions |
| `--blue` | `#2451D6` | Primary action color — CTAs, links, featured package border |
| `--blue-deep` | `#1B3AA0` | Hover state for blue, and the Contact section background |
| `--gold` | `#C9A227` | Secondary accent — top package tier, chart bars, numeral highlights |
| `--gold-soft` | `#DFC067` | Gold on dark backgrounds (credibility/contact sections) |
| `--up` | `#2F8F5C` | Positive/growth indicators only — rank-up caption, one swatch chip |
| `--line` / `--line-strong` | `rgba(19,22,28,0.14)` / `0.30` | Hairline borders and dividers |

**Usage rules:**
- Blue = the one color allowed to mean "click this." Don't introduce a second action color.
- Gold = achievement/premium, never used for body text.
- Green = growth only. Never decorative.
- Dark sections (Credibility, Contact) invert to `--ink` or `--blue-deep` backgrounds with `--canvas`/white text — don't mix light-section and dark-section text colors.

## 3. Typography

| Role | Typeface | Weight | Where |
|---|---|---|---|
| Headings (H1–H3) | Space Grotesk | 700 | All section headlines |
| Body copy | Inter | 400–600 | Paragraphs, descriptions, form text |
| Signature numerals | Orbitron | 700–800 | Hero rank card digits, process step numbers (01–04) only |
| Labels / eyebrows / data | IBM Plex Mono | 400–500 | Eyebrow tags, mono captions, form labels, package attribute labels |

**Rule:** Orbitron is reserved for numerals that represent rank/position/sequence. Don't use it for regular headings — its whole job is to make those specific numbers feel like a scoreboard readout.

Type scale (desktop): H1 `clamp(2.2rem, 5vw, 3.6rem)` · H2 `clamp(1.7rem, 3.2vw, 2.4rem)` · body `1rem` at `1.6` line-height · eyebrows/mono `0.66–0.82rem`.

## 4. Layout & Spacing
- Content max-width: `1180px`, centered, `1.5rem` side padding on mobile.
- Section vertical padding: `5rem` top/bottom on desktop.
- Card/grid gaps: `1.5rem` standard; service grid uses `1px` hairline gaps (grid lines between cards instead of gutters).
- Breakpoints: `1080px` (services grid to 2-col), `940px` (packages to 1-col), `860px` (nav collapses, most grids to 1-col), `720px` (process rows restack).

## 5. Components

- **Buttons** (`.btn`, `.btn-primary`, `.btn-ghost`) — mono font, uppercase, letter-spaced. Primary is filled blue; ghost is outlined, inverts to filled ink on hover. No rounded-pill shapes — border-radius stays at `2–3px` everywhere, on purpose.
- **Cards** (`.swatch-card`, `.service-card`, `.package-card`) — flat surface, `1px` solid border, no shadows. The only "lift" in the whole design is the `-2deg` rotation on the hero rank card.
- **Badges/tags** (`.badge`, `.package-tag`, mono labels) — small, uppercase, mono font, solid-color fill or outline. Never gradient.
- **Nav** — sticky, blurred-glass background on scroll, collapses to a toggle menu under 860px.
- **Forms** — underline-style bordered inputs, no fill, focus state switches border to `--gold-soft` (on dark Contact background) — keep that focus color change, it's the one place gold indicates "you're active here" rather than "premium."
- **Rank card** (hero only) — the signature component. Don't duplicate this pattern elsewhere; it should stay a one-time visual moment.
- **Process rows** — numbered list, Orbitron numeral + mono step label + Space Grotesk sub-heading + Inter description, in that fixed order.

## 6. Motifs (don't dilute these)
1. **The rank shift** (47 → 1) — appears once, in the hero.
2. **Numbered mono labels** (01–06 on services, 01–04 on process) — signals structure and precision.
3. **Bronze/Silver/Gold packages** — ties pricing tiers back to the ranking/competition concept without needing an explanation.
4. **Green up-indicator** — reserved for anything showing measurable growth (the credibility chart, the rank card caption).

## 7. Voice & Tone
Plain and direct. No inflated claims, no "500+ clients," no fake urgency. Active voice. Honest about being a new agency — the design should never try to visually compensate for that with fake polish; the credibility section says it outright instead.

## 8. Accessibility
Full detail lives in `03-ui-ux-requirements.md`. In short: visible focus rings on every interactive element, `prefers-reduced-motion` respected, labeled form fields, and contrast checked between `--ink`/`--canvas` and white text on the dark sections.

## 9. Extending This Design
- **Blog (Phase 2):** reuse Space Grotesk for post titles, Inter for body, mono eyebrows for category tags. Don't introduce a new accent color for the blog — gold and blue already cover "featured" and "action."
- **Client dashboard (Phase 3):** this design already leans toward data display (mono labels, numeral emphasis) — the rank card pattern is a strong candidate for a "current ranking" widget in the dashboard, reused rather than redesigned.
- Any new component should be checked against Section 6 before adding new visual language — the goal is a small, consistent set of moves, not a growing pile of one-off styles.

## 10. Implementation Reference
All tokens currently live as CSS custom properties in the `<style>` block of `index.html` (no separate stylesheet yet). Variable names match the token column in Section 2 exactly, so this doc can be diffed against the code directly.
