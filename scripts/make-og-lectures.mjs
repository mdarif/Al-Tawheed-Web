// Generates a per-lecture Open Graph social card (1200x630 JPEG) for every
// Urdu lecture and Arabic dars, using Playwright's bundled Chromium so
// Arabic/Urdu text gets correct HarfBuzz shaping (fonts loaded from Google
// Fonts, same source Layout.astro uses at runtime).
//
// Manual, committed-output script — run `npm run og` whenever the catalog
// changes (rare: it's fetched from a CDN that updates infrequently). Not
// wired into `npm run build` on purpose: the Cloudflare Pages build
// environment doesn't have Playwright's browsers installed, and running 141
// headless-Chromium screenshots on every build/test run would be slow.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getCatalog,
  getArabicCatalog,
  en,
  ar,
  lectureSlug,
  arabicLectureSlug,
  chapterSlug,
} from '../src/lib/catalog.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const OUT_ROOT = path.resolve(import.meta.dirname, '../public/og');

function template({ eyebrow, title, subtitle, dir = 'ltr', fontFamily }) {
  return `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Inter:wght@400;600;700;800&display=swap" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 88px 96px;
    background: radial-gradient(circle at 15% 15%, #1E1A0F 0%, #0F0F10 55%), #0F0F10;
    font-family: 'Inter', sans-serif;
    color: #F0EDE4;
  }
  .eyebrow {
    color: #C9A84C;
    font-weight: 700;
    font-size: 28px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 28px;
  }
  .title {
    font-family: ${fontFamily};
    font-weight: 700;
    font-size: ${dir === 'rtl' ? '68px' : '58px'};
    line-height: 1.25;
    max-width: 950px;
    color: #F0EDE4;
  }
  .subtitle {
    margin-top: 28px;
    font-size: 26px;
    color: #A09880;
  }
  .brand {
    position: absolute;
    bottom: 56px;
    ${dir === 'rtl' ? 'right' : 'left'}: 96px;
    font-size: 22px;
    font-weight: 600;
    color: #6B6458;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
  <p class="eyebrow">${eyebrow}</p>
  <h1 class="title">${title}</h1>
  <p class="subtitle">${subtitle}</p>
  <p class="brand">kitabattawheed.com</p>
</body>
</html>`;
}

async function renderCard(page, html, outFile) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await mkdir(path.dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 90 });
}

async function main() {
  const [catalog, arabicCatalog] = await Promise.all([getCatalog(), getArabicCatalog()]);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  let count = 0;

  for (const lecture of catalog.lectures) {
    const chapter = catalog.chapters.find((c) => c.id === lecture.chapterId);
    const html = template({
      eyebrow: `Part ${String(lecture.number).padStart(2, '0')} — Sharah Kitab al-Tawheed`,
      title: en(lecture.title),
      subtitle: chapter ? en(chapter.title) : 'Shaikh Abdullah Nasir Rahmani',
      dir: 'ltr',
      fontFamily: "'Inter', sans-serif",
    });
    const outFile = path.join(
      OUT_ROOT,
      'lectures',
      `${chapterSlug(chapter.id)}-${lectureSlug(lecture)}.jpg`,
    );
    await renderCard(page, html, outFile);
    count++;
  }

  for (const lecture of arabicCatalog.lectures) {
    const title = ar(lecture.title) || en(lecture.title);
    const html = template({
      eyebrow: `درس ${String(lecture.number).padStart(2, '0')} — كتاب التوحيد`,
      title,
      subtitle: 'الشيخ صالح الفوزان',
      dir: 'rtl',
      fontFamily: "'Noto Naskh Arabic', serif",
    });
    const outFile = path.join(OUT_ROOT, 'arabic', `${arabicLectureSlug(lecture)}.jpg`);
    await renderCard(page, html, outFile);
    count++;
  }

  await browser.close();
  console.log(`Generated ${count} OG images in ${OUT_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
