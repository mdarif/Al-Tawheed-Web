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
    pagefind(),
    sitemap({
      serialize(item) {
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
