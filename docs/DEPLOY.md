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

## Custom domain checklist

- [ ] `kitabattawheed.com` attached to Pages project (SSL active)
- [ ] `www.kitabattawheed.com` → redirect to apex (optional, recommended)
- [ ] Astro `site` in `astro.config.mjs` is `https://kitabattawheed.com` (canonical URLs)

---

## Google Search Console (after first deploy)

1. Go to [Google Search Console](https://search.google.com/search-console).
2. **Add property** → URL prefix: `https://kitabattawheed.com`
3. Verify ownership (HTML file, DNS TXT, or Cloudflare integration).
4. **Sitemaps** → Submit:
   ```
   https://kitabattawheed.com/sitemap-index.xml
   ```
5. Optional: request indexing for `/` and `/lectures/` after major launches.

Also confirm `https://kitabattawheed.com/robots.txt` lists the sitemap (it does).

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
