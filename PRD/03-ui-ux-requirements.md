# UI/UX Requirements — GetUsRanked

## 1. Design Direction
Fully generic, industry-neutral visual identity — no niche-specific imagery, metaphor, or wording anywhere on the public site. Distinctive enough to avoid feeling templated, while staying credible to a first-time visitor who has no prior context on the agency.

The current design is built around the agency's own name and core promise — moving a search ranking position — rather than any particular client industry.

## 2. Design Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| Canvas | `#EEF1EF` | Page background |
| Canvas Deep | `#E2E7E2` | Section/card background variation |
| Ink | `#13161C` | Primary text |
| Ink Soft | `#565C5A` | Secondary/muted text |
| Blue | `#2451D6` | Primary action/accent — CTAs, links, featured package |
| Gold | `#C9A227` | Secondary accent — highlights, top package tier |
| Rank-Up Green | `#2F8F5C` | Positive indicators — growth, rank improvement |

### Typography
| Role | Typeface | Notes |
|---|---|---|
| Display / Headings | Space Grotesk | Bold weights for H1–H3 |
| Body | Inter | 400–600 weight for paragraph copy |
| Signature numerals | Orbitron | Used sparingly — only for the hero's ranking-position visual and process step numbers |
| Labels / data / eyebrows | IBM Plex Mono | Small caps, letter-spaced, for eyebrows and short data labels |

### Layout
- Max content width: 1180px, centered, 1.5rem side padding on mobile.
- Section vertical rhythm: ~5rem padding top/bottom on desktop, reduced on smaller screens.
- Grid-based cards for Services, Who We Help, and Packages — collapse to a single column below 860px.

## 3. Responsiveness
Fully responsive from 320px mobile width through desktop. Mobile nav collapses into a toggled menu. All grids collapse gracefully to single- or two-column layouts on smaller screens.

## 4. Accessibility
- Visible focus states on all interactive elements (`:focus-visible`).
- Respects `prefers-reduced-motion` — disables non-essential transitions/animations for users who request it.
- Sufficient color contrast between text and background across all sections.
- Form fields have associated `<label>` elements; buttons and icon-only controls have descriptive text or `aria-label`.

## 5. Content & Tone Guidelines
- Plain, direct language — no inflated claims ("500+ clients served," fabricated stats).
- Active voice, specific over clever.
- Honest framing around being a new agency; credibility comes from transparency and visible process, not fabricated social proof.
- No niche-specific vocabulary anywhere in public copy — this is a hard requirement for Phase 1.

## 6. Page / Section Map
1. Header / Nav
2. Hero
3. Who We Help
4. Services
5. Credibility ("Why Trust a New Agency")
6. Process
7. Packages
8. Contact
9. Footer
