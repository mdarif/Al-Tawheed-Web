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

- [ ] **Al-Tawheed-Content** (live CDN, feeds web + mobile):
      `tawheed/catalog.json:6,8` book.title en/roman; `tawheed/app-config.json:12,15`
      feedback-email "Kitab Al-Tawheed" (capital Al) + `:18` appName; `README.md:26`
      + "Hafizaullah" typo at `:27`. Fixing this makes the web's
      `normalizeTitleSpelling()` a no-op.
- [ ] **al-quran-web** `src/components/TawheedPromo.astro:9-10` — cross-promo title/body
      say "Kitab al-Tawheed" (user-facing on alquranreader.com).
- [ ] **Al-Tawheed app**: `lib/app.dart:249`, `lib/main.dart:26` (notification channel),
      `lib/l10n/*` appTitle strings; tests/docs are a 3-way al-/At-/Al- mix;
      `docs/play-store-listing.md:66` codifies the OLD al- rule — invert it.
      `README.md:31` also has the stale "English, Urdu, Roman Urdu interface" claim.
- [ ] **alquran-app** docs (3 references, internal only).
- [ ] Play Store listing name ("Kitab al-Tawheed") — manual Play Console edit.
- [x] almarfa-platform — already uses "Kitab at-Tawheed", no action.

## Smaller items

- [ ] `AudioObject` JSON-LD lacks `uploadDate` (Google-recommended) — needs
      per-lecture dates in the catalog first.
- [ ] Optional: pass `i18n` config to `@astrojs/sitemap` for `xhtml:link`
      hreflang annotations on the 5 translated pairs (on-page hreflang already
      covers this).
- [ ] Search input inside `<pagefind-input>` has no accessible label
      (third-party web component; low priority).
