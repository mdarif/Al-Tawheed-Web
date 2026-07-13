// Sync the Kitab at-Tawheed matn from the mobile app repo.
//
// The book text is authored/edited in the Flutter app (Al-Tawheed) and shipped
// there as a bundled asset. The website consumes an identical copy so the two
// never drift. This copies the app's JSON into src/data/; commit the result.
//
//   node scripts/sync-book.mjs            # expects sibling ../Al-Tawheed
//   APP_REPO=/path/to/Al-Tawheed node scripts/sync-book.mjs
//
// Two books are synced:
//   • book_tawheed-ar.json  — the Arabic matn (67 chapters)
//   • book_tawheed-ur.json  — the bilingual Urdu edition (Arabic āyah + Urdu),
//     currently a proofed 2-chapter sample; the rest is pending.
//
// Same spirit as syncing "What's New" with mobile releases — run it whenever the
// app updates the matn, then eyeball a chapter against the app and re-run tests.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const appRepo = process.env.APP_REPO ?? resolve(webRoot, '..', 'Al-Tawheed');

const BOOKS = ['book_tawheed-ar.json', 'book_tawheed-ur.json'];

for (const file of BOOKS) {
  const src = join(appRepo, 'assets', 'content', file);
  const dest = join(webRoot, 'src', 'data', file);

  let raw;
  try {
    raw = readFileSync(src, 'utf8');
  } catch {
    console.error(`ERROR: could not read the app's book at:\n  ${src}\n` +
      `Set APP_REPO to the Al-Tawheed checkout if it isn't a sibling of this repo.`);
    process.exit(1);
  }

  // Validate shape before overwriting so a bad source can't silently break the build.
  const data = JSON.parse(raw);
  const count = data?.chapters?.length ?? 0;
  if (!data?.book?.title || count < 1) {
    console.error(`ERROR: ${file} is missing book.title or chapters[]; aborting.`);
    process.exit(1);
  }

  writeFileSync(dest, raw.endsWith('\n') ? raw : raw + '\n');
  console.log(`Synced ${count} chapters → src/data/${file}`);
}
