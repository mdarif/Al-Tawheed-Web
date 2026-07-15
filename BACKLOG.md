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

## Arabic book (matn) — keep in sync with the app

The Arabic Kitab at-Tawheed text at `/arabic/book/` (+ per-chapter `ch-00…ch-66`)
is a committed copy of the mobile app's bundled matn
(`src/data/book_tawheed-ar.json`, sourced from `Al-Tawheed`'s
`assets/content/book_tawheed-ar.json`). It is matn-only (no `فِيهِ مَسَائِلُ`
lists) and Arabic-only, matching the app.

- [ ] When the app edits the matn, run `npm run sync:book` (expects the app repo
      as a sibling `../Al-Tawheed`, or pass `APP_REPO=`), eyeball a chapter, then
      re-run tests. Same discipline as syncing "What's New" with app releases.
- [ ] Optional SEO: per-chapter OG social cards (currently all book pages reuse
      the site-wide `og-image.png`) — extend `scripts/make-og-lectures.mjs`.
- [x] Bilingual Urdu reader at `/urdu/book/` (Arabic āyah + Urdu translation &
      masāʾil), synced from the app's `book_tawheed-ur.json`. *Shipped the
      complete 67-chapter edition ~2026-07-14.*
- [x] **Urdu book missing chapter — fixed at source.** The app's Urdu edition had
      only 66 of 67 chapters (al-Qasas:56, the death of Abu Talib, was absent
      with numbering closed up). Added to the app repo at ch-18 and re-synced;
      the Urdu edition is now 67/67, aligned 1:1 with the Arabic matn.
      *~2026-07-14.*
- [x] Urdu reader allowed into the index now the matn is complete — `noindex`
      dropped from `src/pages/urdu/book/index.astro` + `[chapterSlug].astro`.
      Added SEO parity with the Arabic reader: `Book` JSON-LD on the hub,
      `Article` + `BreadcrumbList` JSON-LD per chapter, and `data-pagefind-body`
      so it's in on-site search too. *~2026-07-14.*

## Urdu book narration — built, flagged OFF

Browser-voice ("Web Speech") narration of the Urdu reader: a **سنیں** button that
reads the chapter aloud and highlights each block. Built and tested, but shipped
**disabled** behind `NARRATION_ENABLED` in `src/lib/flags.ts`.

- **Why it's off:** the 2026-07-15 pilot on `ch-00` ran correctly end-to-end on
  Android Chrome, but the Google Urdu TTS voice **mispronounces too much of the
  text** to be acceptable for a religious book. Reach is poor by nature too:
  macOS, iOS and desktop Chrome ship **no Urdu voice at all** (verified — this
  Mac has 180 system voices, zero Urdu), so the control simply never appears.
- **What's there:** `src/scripts/narration/` (engine abstraction, Web Speech
  engine, DOM extraction, voice ranking, controller), the
  `src/components/UrduNarration.astro` control, and `tests/narration.spec.ts`.
  The 11 behavioural tests **re-arm automatically** when the flag flips; while
  it's off, one test asserts the feature is genuinely absent from the build.
- **Guarantees already encoded:** Arabic Qur'anic āyāt are never spoken (a test
  asserts no `﴿` reaches the voice); the `«…»` hadith spans **are** spoken —
  they're Urdu in this edition, not Arabic; and a device with no Urdu voice gets
  a note pointing at `/lectures/urdu/` rather than an English-voiced mess.

- [ ] **The likely real fix is not a better browser voice — it's dropping the
      browser out of it.** Implement the `NarrationEngine` interface
      (`src/scripts/narration/types.ts`) over pre-generated audio: run the book
      text through a good Urdu TTS (or a human narrator) once, host the MP3s on
      the existing R2 bucket alongside the lectures, and play them with
      `<audio>`. That fixes pronunciation, works on every device, and restores
      MediaSession/lock-screen controls. Sizing: ~187k chars ≈ **3.7 hours**,
      ~50–100 MB, one-off TTS cost ≈ $3–5. The controller and all UI survive
      untouched — only the engine changes.
- [ ] When re-enabling, note `NARRATION_PILOT_IDS` in
      `src/pages/urdu/book/[chapterSlug].astro` scopes it to `ch-00`; widen once
      quality is judged good.
- [ ] Minor: while the flag is off, Astro still emits an ~8 KB
      `UrduNarration.astro_astro_type_script…js` chunk into `dist/_astro/`.
      **No page references it**, so no visitor downloads it — it's dead build
      output only, not a payload cost.

## Smaller items

- [ ] `AudioObject` JSON-LD lacks `uploadDate` (Google-recommended) — needs
      per-lecture dates in the catalog first.
- [ ] App-side proofing nit: the Urdu book's masāʾil headings vary — `ch-17` and
      `ch-20` read `ان باب` where the rest read `اس باب`, and one variant has a
      trailing space. Cosmetic; fix at the app source, then `npm run sync:book`.
- [ ] Optional: pass `i18n` config to `@astrojs/sitemap` for `xhtml:link`
      hreflang annotations on the 5 translated pairs (on-page hreflang already
      covers this).
- [ ] Search input inside `<pagefind-input>` has no accessible label
      (third-party web component; low priority).
