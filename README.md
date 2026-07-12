# Kitab at-Tawheed Web

Static site for [kitabattawheed.com](https://kitabattawheed.com) — SEO-friendly lecture pages and app download funnel for the **Kitab at-Tawheed** Android app. The app (and this site) offer **two audio series**:

- **Urdu** — *Sharah Kitab at-Tawheed* by Shaikh Abdullah Nasir Rahmani (50 lectures / 15 classes)
- **Arabic** — *Kitab at-Tawheed* by Shaikh Salih al-Fawzan (91 duroos)

## Stack

- [Astro](https://astro.build) 6 (static site generation)
- Tailwind CSS 4
- Content fetched at build time from the CDN — Urdu `…/tawheed/` and Arabic `…/tawheed-ar/` (`catalog.json`, `app-config.json`), the same CDN as the Flutter app

## Develop

```bash
npm install   # also installs the pre-push test hook (see below)
npm run dev
```

`npm run build`/`dev` require **network access** (they fetch the catalog from the CDN at build time; a transient fetch timeout just needs a retry).

## Build

```bash
npm run build
npm run preview
```

Output: `dist/` (Astro static + Pagefind search index, generated automatically via `astro-pagefind`).

For local search in dev, run `npm run build` once (creates `dist/pagefind/`), then `npm run dev` — or `npm run dev:full` to do both. Open `/search/`.

## Test gate (pre-push hook)

`npm install` wires up `.githooks/pre-push` (via the `prepare` script). It runs the **full Playwright suite before every push** and aborts the push if anything fails — so a "can't push" almost always means a red test. Bypass in a pinch with `git push --no-verify`. Run tests directly with `npm test`.

## Deploy

Production is **Cloudflare Pages with native Git integration** — there is no GitHub-Actions deploy (`ci.yml` only builds an artifact as a check).

- **Push to `main` → Production** deploy (kitabattawheed.com).
- Push any **other branch → Preview** deploy (`<branch>.al-tawheed-web.pages.dev`).

So shipping is just: merge your branch into `main` and push (the pre-push hook gates it on tests). Details, custom domain, analytics, and Search Console: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

Manual fallback (rarely needed): `npm run deploy` (`npm run build && wrangler pages deploy dist --project-name=al-tawheed-web`, after `wrangler login`).

## Key routes

- `/lectures/` — two-series hub → `/lectures/urdu/` (Urdu classes) and `/arabic/` (Arabic duroos)
- `/lectures/<class>/<part>/`, `/arabic/<dars>/` — individual lecture players
- `/search/` — Pagefind search (unified across both series via `forceLanguage`)
- `/download/`, `/about/`, `/kitab-al-tawheed/`, `/tawheed/`, `/sheikh-rahmani/` — funnel + topic guides (FAQ schema)
- `/ur/…` — Urdu-localized versions of the marketing pages
- `/llms.txt` — site summary for AI crawlers

## Related repos

- [Al-Tawheed](https://github.com/mdarif/Al-Tawheed) — Flutter Android app (release notes for the "What's New" section live in its `docs/play-store-listing.md`)
- Al-Tawheed-Content — CDN JSON and cover assets
