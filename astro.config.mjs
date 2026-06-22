// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import { pagefindDev } from './vite-pagefind-dev.mjs';
import { getCatalog, getArabicCatalog } from './src/lib/catalog.ts';

const [catalog, arabicCatalog] = await Promise.all([getCatalog(), getArabicCatalog()]);
const catalogLastmod = catalog.book.catalogUpdatedAt ?? new Date().toISOString();
const arabicLastmod = arabicCatalog.book.catalogUpdatedAt ?? catalogLastmod;

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
    pagefind(),
    sitemap({
      serialize(item) {
        if (item.url.includes('/arabic/')) {
          item.lastmod = arabicLastmod;
          const segments = item.url.split('/').filter(Boolean);
          if (segments[segments.length - 1] === 'arabic') {
            item.changefreq = 'monthly';
            item.priority = 0.9;
          } else {
            item.changefreq = 'monthly';
            item.priority = 0.8;
          }
          return item;
        }
        item.lastmod = catalogLastmod;
        if (item.url === 'https://kitabattawheed.com/') {
          item.changefreq = 'weekly';
          item.priority = 1;
        } else if (item.url.includes('/lectures/') && item.url.split('/').filter(Boolean).length >= 4) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else if (item.url.includes('/lectures/')) {
          item.changefreq = 'monthly';
          item.priority = 0.85;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss(), pagefindDev()],
  },
});
