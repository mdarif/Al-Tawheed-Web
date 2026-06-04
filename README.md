# Kitab at-Tawheed Web

Static site for [kitabattawheed.com](https://kitabattawheed.com) — SEO-friendly lecture pages and app download funnel for the **Sharah Kitab al-Tawheed** Android app.

## Stack

- [Astro](https://astro.build) 6 (static site generation)
- Tailwind CSS 4
- Content from `https://al-tawheed-content.pages.dev/tawheed/` (`catalog.json`, `app-config.json`) — same CDN as the Flutter app

## Develop

```bash
npm install
npm run dev
```

Requires network access for `npm run build` (fetches catalog at build time).

## Build

```bash
npm run build
npm run preview
```

Output: `dist/` (deployed to Cloudflare Pages). Search index (`pagefind/`) is generated automatically via `astro-pagefind`.

## Deploy

**Production:** push to `main` → GitHub Actions builds and deploys to Cloudflare Pages.

One-time setup: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub secrets. Full steps, custom domain, and Search Console sitemap: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

```bash
npm run deploy   # local build + wrangler deploy (after wrangler login)
```

For local search in dev, run `npm run build` once (creates `dist/pagefind/`), then `npm run dev`. Or use `npm run dev:full` to build and start together. Open `/search/` — not `/pagefind/pagefind.js` directly.

## Guides & SEO pages

- `/search/` — Pagefind lecture search
- `/kitab-al-tawheed/`, `/tawheed/`, `/sheikh-rahmani/` — topic guides with FAQ schema
- `/llms.txt` — site summary for AI crawlers

## Related repos

- [Al-Tawheed](https://github.com/) — Flutter Android app
- Al-Tawheed-Content — CDN JSON and cover assets
