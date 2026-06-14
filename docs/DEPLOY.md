# Deploy — kitabattawheed.com (Cloudflare Pages)

Production site: **https://kitabattawheed.com**  
Build output: `dist/` (Astro static + Pagefind index)

---

## One-time Cloudflare setup

### 1. Create the Pages project

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets** (or connect Git later — we deploy via GitHub Actions).
2. Project name: **`kitabattawheed`** (must match `wrangler.toml` and the workflow).
3. After first deploy, add custom domain: **kitabattawheed.com** (+ `www` redirect to apex if desired).

### 2. API token for GitHub Actions

1. **My Profile** → **API Tokens** → **Create Token** → **Edit Cloudflare Workers** template (includes Pages deploy).
2. Or custom token with permissions:
   - Account → **Cloudflare Pages** → **Edit**
   - Zone → **Read** (if using zone-scoped token; optional for Pages-only)
3. Copy the token.

### 3. Account ID

Dashboard → any zone or Workers & Pages → right sidebar **Account ID** (32-char hex).

### 4. GitHub repository secrets

Repo **Al-Tawheed-Web** → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from step 3 |

Optional **variable** (not secret):

| Variable | Value |
|----------|--------|
| `CLOUDFLARE_PAGES_PROJECT` | Override project name if not `kitabattawheed` |

---

## Automatic deploy (CI)

On every push to **`main`**:

1. `npm ci` → `npm run build` (fetches public catalog from CDN)
2. Upload `dist/` artifact
3. Deploy to Cloudflare Pages with Wrangler

Pull requests: **build only** (no production deploy).

Manual deploy from your machine:

```bash
npm run build
npm run deploy
# Requires: npx wrangler login  (once)
```

---

## Cloudflare Web Analytics

Privacy-friendly pageview stats (no Google Analytics, no cookies). Matches [ADR-004](https://github.com/mdarif/Al-Tawheed/blob/main/docs/website-architecture.md).

### 1. Get the beacon token

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Analytics & Logs** → **Web Analytics**.
2. Add **kitabattawheed.com** (or select the site if already listed).
3. Copy the **token** from the install snippet (`data-cf-beacon` → `"token": "…"`).

### 2. Set on Cloudflare Pages (production build)

**Workers & Pages** → **kitabattawheed** (web project) → **Settings** → **Environment variables**:

| Name | Value | Environment |
|------|--------|-------------|
| `PUBLIC_CF_WEB_ANALYTICS_TOKEN` | Token from step 1 | Production |

Redeploy after saving (or push a commit). Astro inlines `PUBLIC_*` vars at **build** time.

### 3. Local dev (optional)

```bash
cp .env.example .env
# paste token into PUBLIC_CF_WEB_ANALYTICS_TOKEN=
```

Without the variable, the beacon is omitted in dev and preview builds.

View reports: **Web Analytics** in the Cloudflare dashboard (visits, pages, referrers, countries).

---

## Custom domain checklist

- [ ] `kitabattawheed.com` attached to Pages project (SSL active)
- [ ] **`www.kitabattawheed.com` attached to the same Pages project** (not DNS-only — an unattached `www` record causes **522** errors in Search Console)
- [ ] Or: **Bulk Redirect** in Cloudflare → `www.kitabattawheed.com/*` → `https://kitabattawheed.com/$1` (301)
- [ ] Astro `site` in `astro.config.mjs` is `https://kitabattawheed.com` (canonical URLs)
- [ ] After deploy, confirm unknown URLs return **404** (not the homepage): e.g. `/no-such-page/` → 404

---

## Google Search Console (after first deploy)

### Submit sitemap

1. Go to [Google Search Console](https://search.google.com/search-console).
2. **Add property** → URL prefix: `https://kitabattawheed.com` (use apex, not `www`, unless `www` is fixed)
3. Verify ownership (HTML file, DNS TXT, or Cloudflare integration).
4. **Sitemaps** → Submit:
   ```
   https://kitabattawheed.com/sitemap-index.xml
   ```
5. Optional: request indexing for `/` and `/lectures/` after major launches.

Also confirm `https://kitabattawheed.com/robots.txt` lists the sitemap (it does).

### Common indexing reports (what they mean)

| Status | Meaning | Action |
|--------|---------|--------|
| **Discovered – currently not indexed** | Google knows the URL (sitemap/links) but has not crawled/indexed yet | Normal for a **new** site. Fix `www`/404 issues below, then wait or use URL Inspection → Request indexing for `/` and `/lectures/`. |
| **Page with redirect** | Non-canonical URL (e.g. without trailing `/`) redirects to the real URL | Expected with `trailingSlash: 'always'`. No fix needed. |
| **Alternative page with proper canonical** | Duplicate URL correctly points canonical elsewhere | Often a `www` or mistyped `/ur/...` ghost URL. Fix soft-404 + `www`. |
| **Server error (5xx)** | Crawler got an error | Check **www** (522 if not on Pages) and redeploy if transient. |

**Important:** The site ships `404.html` so Cloudflare Pages does **not** fall back to the homepage for missing paths (without it, every bad URL returned 200 + home — bad for SEO).

---

## Rebuild when only content changes

Lecture metadata lives on the CDN (`catalog.json`). The site rebuilds on **code** pushes to `main`.

When you only update **Al-Tawheed-Content** (new lectures, copy changes):

- Push a commit to `main` (empty commit is fine), or
- Re-run the **CI** workflow manually (**Actions** → **CI** → **Run workflow**), or
- Run `npm run build && npm run deploy` locally

Future improvement: webhook from Content repo to trigger `workflow_dispatch`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Deploy job skipped | Secrets missing or not on `main` branch |
| `Project not found` | Create Pages project `kitabattawheed` or set `CLOUDFLARE_PAGES_PROJECT` |
| Build fails in CI | Network must reach `al-tawheed-content.pages.dev` at build time |
| Search not working on preview URL | Pagefind index is in `dist/pagefind/` — full deploy includes it |
