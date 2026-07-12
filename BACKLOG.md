# Backlog

Deferred work items, in rough priority order. (From the July 2026 site review.)

## Image optimization (next phase — biggest performance win)

The app screenshots are 1290×2580 PNGs served raw from `public/app-screenshots/`
(200–830 KB each) but displayed at only 200–270 px wide. The homepage lazy-loads
~2.8 MB of them; `/download/` ~3.3 MB.

- [ ] Move screenshots to `src/assets/` and render via `astro:assets` `<Image>`/
      `<Picture>` (resized AVIF/WebP + `srcset`), or pre-compress to ~2× display
      width WebP. Expected saving: ~90% (≈3 MB → ≈300 KB per page).
- [ ] `public/sheikh-fawzan.png` (160 KB) is rendered at 112×112 on the homepage
      — same treatment.
- [ ] Header logo uses `/icons/icon-192.png` (22 KB) at 34×34 on every page —
      serve a 64–72 px asset instead.
- Keep `og-image.png` as PNG (social scrapers), and keep `width`/`height` +
  `loading="lazy"` attributes (already correct today).

## "Kitab at-Tawheed" spelling — external follow-ups

Site copy is standardized on **Kitab at-Tawheed** (URL slugs, the domain, and
`/kitab-al-tawheed/` routes intentionally unchanged; the explainer page carries
an "also written Kitab al-Tawheed" alias for search).

- [x] **Al-Tawheed-Content** — catalog.json, app-config.json (incl. capital-Al
      feedback email), README + Hafizahullah typo. *Edited 2026-07-12; pending
      commit + push (deploys the CDN → web hero fixed at source, app name +
      feedback email update in live installs). Then the web's
      `normalizeTitleSpelling()` becomes a no-op guard.*
- [x] **al-quran-web** `TawheedPromo.astro` — cross-promo title/body. *Edited
      2026-07-12; pending commit + push (deploys alquranreader.com).*
- [x] **Al-Tawheed app** — lib strings (app title, notification channel,
      welcome/player fallbacks), l10n .arb + generated files, tests, docs,
      local catalog.json copy; play-store-listing.md guidance now names at- as
      canon. *Edited 2026-07-12; pending commit; reaches users with the next
      app release. `README.md:31` "English, Urdu, Roman Urdu interface" claim
      still to verify against the shipped app.*
- [x] **alquran-app** docs. *Edited 2026-07-12; pending commit.*
- [ ] Play Store listing name — manual Play Console edit to
      "Sharah Kitab at-Tawheed" (store qualifier suffix as needed).
- [x] almarfa-platform — already uses "Kitab at-Tawheed", no action.

## Smaller items

- [ ] `AudioObject` JSON-LD lacks `uploadDate` (Google-recommended) — needs
      per-lecture dates in the catalog first.
- [ ] Optional: pass `i18n` config to `@astrojs/sitemap` for `xhtml:link`
      hreflang annotations on the 5 translated pairs (on-page hreflang already
      covers this).
- [ ] Search input inside `<pagefind-input>` has no accessible label
      (third-party web component; low priority).
