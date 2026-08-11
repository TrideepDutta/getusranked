# Technical Requirements — GetUsRanked

## 1. Phase 1 — Current Site
- **Stack:** Static HTML/CSS/JS, single file, no build process, no backend dependency.
- **Hosting:** Any static host (e.g. Netlify, Vercel, GitHub Pages, or standard shared hosting) pointed at the getusranked.com domain.
- **Domain/DNS:** getusranked.com — needs registrar setup, DNS pointed to the hosting provider, HTTPS enabled (most hosts provide free SSL by default).
- **Fonts/Assets:** Loaded via Google Fonts CDN (Space Grotesk, Inter, Orbitron, IBM Plex Mono); no other external dependencies.
- **Forms:** Contact form uses a client-side `mailto:` submission — no backend, no stored data. Fine for launch; not scalable long-term (see Phase 2).

## 2. SEO-Specific Technical Requirements
*Notable since the site itself is the agency's proof of work.*
- Semantic HTML structure with a proper heading hierarchy and landmark elements.
- Meta title/description matched to each section's intent.
- `sitemap.xml` and `robots.txt` in place at launch.
- Structured data (schema.org `ProfessionalService`) once NAP (name/address/phone) details are finalized.
- Core Web Vitals: the page is intentionally lightweight (no heavy JS framework) to keep LCP/CLS scores strong.
- Google Search Console and Analytics connected from day one, since the site's own ranking growth is the credibility case study referenced in the Credibility section.

## 3. Phase 2 — Near-Term
- **Form backend:** Move from `mailto:` to a hosted form service (e.g. Formspree, or a simple serverless function) or a lightweight backend to store and manage leads properly.
- **Automated audit tool:** Requires a backend service to fetch and analyze a submitted URL (page speed API, meta/indexing checks) and generate a shareable report. Needs basic server-side logic and rate-limiting to prevent abuse.
- **Blog/CMS:** Either a git-based static CMS (Markdown + static site generator) or a headless CMS, depending on publishing frequency and who's writing.

## 4. Phase 3 — Platform
- **Authentication:** Client login (email/password or magic link) for the dashboard.
- **Database:** Stores client accounts, ranking history, report data, and billing records.
- **Integrations:** Google Search Console API and Google Analytics API for live ranking/traffic data in client dashboards; email service for notifications; a payment processor for invoicing.
- **Security/Privacy:** Client data (rankings, traffic, contact info) needs access control scoped per client account, encrypted storage for anything sensitive, and a basic privacy policy covering what's collected and how it's used.

## 5. Open Technical Decisions
- Hosting provider choice — static host vs. traditional hosting.
- Form backend choice once `mailto:` is retired.
- Tech stack for the Phase 3 dashboard (framework, database, hosting) — to be decided closer to that build.
