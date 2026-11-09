// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import { pagefindDev } from './vite-pagefind-dev.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://kitabattawheed.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    // Merge all pages into a single index. Without this, Pagefind splits the
    // index per <html lang> (en/ur/ar), so the English /search/ page can't see
    // the Arabic series (lang="ar") or /ur/ pages. forceLanguage unifies them
    // so one search box covers both series and all languages.
    pagefind({ indexConfig: { forceLanguage: "en" } }),
    sitemap({
      // Utility pages must not be in the sitemap. /offline/ is the PWA
      // fallback and /search/ is an internal, client-side search results page;
      // both are deliberately noindex. Publishing a noindex URL in a sitemap
      // sends Google contradictory signals and creates avoidable coverage noise.
      // Do not publish a shared catalog timestamp as every page's <lastmod>.
      // Most pages are authored in this repository, and their meaningful
      // modification date is independent of the catalogue. Incorrect dates
      // tell crawlers that July/August page changes happened in May/June;
      // omitting <lastmod> is preferable until we can produce truthful,
      // per-URL values.
      filter: (page) => !page.includes('/offline/') && !page.includes('/search/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss(), pagefindDev()],
  },
});
