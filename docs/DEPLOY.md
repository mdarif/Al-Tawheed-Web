# Deploy — kitabattawheed.com (Cloudflare Pages)

Production site: **https://kitabattawheed.com**
Cloudflare Pages project: **`al-tawheed-web`** · Build output: `dist/` (Astro static + Pagefind index)

---

## How deploys work — Cloudflare Pages Git integration

The Pages project **`al-tawheed-web`** is connected directly to the GitHub repo
(`mdarif/Al-Tawheed-Web`) with **Automatic deployments enabled**. Cloudflare
builds and deploys on every push:

- **Push to `main` → Production** (kitabattawheed.com, www, al-tawheed-web.pages.dev)
- Push any **other branch → Preview** (`<branch>.al-tawheed-web.pages.dev`, e.g. `v3.al-tawheed-web.pages.dev`)

Cloudflare runs the build itself: **build command `npm run build`, output `dist`**
(configured in the Pages project → Settings → Build). No secrets, no GitHub
Actions deploy. `.github/workflows/ci.yml` **only builds an artifact as a PR
check — it does not deploy.**

### Shipping to production

```bash
git checkout main
git merge <your-branch>     # e.g. v3 (usually a fast-forward)
git push                    # pre-push hook runs the full Playwright suite, then pushes
```

The push to `main` triggers the Cloudflare production build automatically. The
**pre-push hook** (`.githooks/pre-push`, auto-installed by `npm install`) runs
all Playwright tests first and **aborts the push if any fail** — so untested
code can't reach `main`. Bypass with `git push --no-verify` only in emergencies.

### Manual fallback (rarely needed)

```bash
npx wrangler login          # once
npm run deploy              # = npm run build && wrangler pages deploy dist --project-name=al-tawheed-web
```

Prefer the Git flow; the manual path is a break-glass option.

---

## Cloudflare Web Analytics

Privacy-friendly pageview stats (no Google Analytics, no cookies).

The site's beacon **token is baked into the code** as a public default
(`src/layouts/Layout.astro` — it's a client-side site tag, not a secret), so
analytics is on by default and needs **no Pages env var**. An optional
`PUBLIC_CF_WEB_ANALYTICS_TOKEN` env var (Pages → Settings → Variables, or a
local `.env`) overrides the default if you ever rotate the token.

- Because it's a `PUBLIC_*` build-time var / inlined constant, the beacon only
  changes on a **new build/deploy**.
- The Web Analytics site **`kitabattawheed.com`** is registered in the
  dashboard (JS-snippet mode). Keep it manual-only — do **not** also enable
  Cloudflare's "Automatic" injection for this host, or pageviews double-count.
- View reports: **Cloudflare dashboard → Web Analytics → kitabattawheed.com**
  (visits, page views, referrers, countries) — data appears within minutes of
  real production traffic.

---

## Custom domain checklist

- [ ] `kitabattawheed.com` attached to the `al-tawheed-web` Pages project (SSL active)
- [ ] **`www.kitabattawheed.com` attached to the same Pages project** (not DNS-only — an unattached `www` record causes **522** errors in Search Console), or a Bulk Redirect `www.kitabattawheed.com/*` → `https://kitabattawheed.com/$1` (301)
- [ ] Astro `site` in `astro.config.mjs` is `https://kitabattawheed.com` (canonical URLs)
- [ ] After deploy, confirm unknown URLs return **404** (not the homepage): e.g. `/no-such-page/` → 404

The site ships `404.html` so Cloudflare Pages does **not** serve the homepage
(HTTP 200) for missing paths — critical for SEO.

---

## After a production deploy — checklist

- [ ] Hard-reload the live site and smoke-test: `/`, `/lectures/`, `/lectures/urdu/`, `/arabic/`, play a lecture, search "fawzan".
- [ ] **OG image caches:** social platforms cache the share card by URL. After changing `og-image.png`, force a re-scrape: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), X Card Validator, [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
- [ ] **Analytics:** confirm the beacon (`cloudflareinsights.com/beacon.min.js`) is in the live HTML; watch data populate in Web Analytics.
- [ ] **Search Console:** (re)submit `https://kitabattawheed.com/sitemap-index.xml`. After an IA change, the URLs still resolve (no redirects), but new pages like `/lectures/urdu/` appear in the sitemap.

---

## Google Search Console

1. [Search Console](https://search.google.com/search-console) → **Add property** → URL prefix `https://kitabattawheed.com` (apex, not `www`, unless `www` is fixed).
2. Verify ownership; **Sitemaps** → submit `https://kitabattawheed.com/sitemap-index.xml`.
3. Optional: URL Inspection → Request indexing for `/`, `/lectures/urdu/`, `/arabic/` after a launch.

`https://kitabattawheed.com/robots.txt` already lists the sitemap.

### Common indexing reports

| Status | Meaning | Action |
|--------|---------|--------|
| **Discovered – currently not indexed** | Known but not yet crawled | Normal for new/changed URLs; wait or request indexing. |
| **Page with redirect** | Non-trailing-slash URL 301s to the canonical | Expected with `trailingSlash: 'always'`. No fix. |
| **Alternative page with proper canonical** | Duplicate points canonical elsewhere | Usually a `www` or old ghost URL. Fix `www`. |
| **Server error (5xx)** | Crawler error | Check `www` (522 if not attached to Pages). |

---

## Rebuild when only CDN content changes

Lecture metadata lives on the CDN. Cloudflare rebuilds on **code** pushes to
`main`. When only **Al-Tawheed-Content** changes (new lectures, copy), trigger a
fresh build by either pushing a commit to `main` (an empty commit works) or
using **Retry deployment** in the Pages dashboard.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Push rejected: "Tests FAILED. Push aborted." | The pre-push Playwright gate found a failure — run `npm test`, fix, retry. |
| Preview/prod shows an old build | Cloudflare deploys per push; check the Deployments tab. The og:image is absolute to the **production** domain, so a preview's social card shows prod's image until prod is deployed. |
| `Project not found` on `npm run deploy` | Ensure `--project-name=al-tawheed-web` (the real project) and `wrangler login`. |
| Build fails in Cloudflare | Network must reach the content CDN at build time; retry a transient timeout. |
| Search empty on a page | Only `data-pagefind-body` pages are indexed; the index is unified via `forceLanguage` — rebuild + hard-reload. |
