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
//     complete at all 67 chapters, aligned 1:1 with the Arabic matn.
//
// Same spirit as syncing "What's New" with mobile releases — run it whenever the
// app updates the matn, then eyeball a chapter against the app and re-run tests.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const appRepo = process.env.APP_REPO ?? resolve(webRoot, '..', 'Al-Tawheed');

// The app ships each chapter's content as one `text` blob (matn + masāʾil). The
// Urdu edition includes the masāʾil ("…اہم مسائل:"), which sit OUTSIDE the core
// matn — so we split them into a structured `masail` field at sync time. The
// reader then just renders `text` and `masail` from the JSON (no render-time
// parsing). Deterministic; matn-only chapters (the Arabic book) are untouched.
function structureMasail(chapter) {
  const lines = chapter.text.split('\n');
  const i = lines.findIndex((l) => /مسائل\s*[:：]\s*$/.test(l.trim()));
  if (i === -1) return chapter;
  return {
    ...chapter,
    text: lines.slice(0, i).join('\n').replace(/\n+$/, ''),
    masail: {
      // Trim again after dropping the colon: some source headings read
      // "…اہم مسائل :" (space before the colon), which would otherwise leave a
      // trailing space on the heading.
      heading: lines[i].trim().replace(/[:：]\s*$/, '').trim(),
      items: lines.slice(i + 1).map((l) => l.trim()).filter(Boolean),
    },
  };
}

// Normalize chapter ids/numbers to a stable 0-based scheme (ch-00, ch-01, …),
// in reading order, regardless of what base the app uses internally. The web's
// chapter URLs (/…/book/ch-NN/) are public and indexed, so they must NOT move
// when the app renumbers its source (e.g. it switched 0-based → 1-based when a
// chapter was inserted). Reading order comes from the source `number`.
function normalizeIds(chapters) {
  return chapters
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((c, i) => ({ ...c, number: i, id: `ch-${String(i).padStart(2, '0')}` }));
}

// Each book: [source file, whether to structure the masāʾil out of the matn].
const BOOKS = [
  { file: 'book_tawheed-ar.json', structure: false },
  { file: 'book_tawheed-ur.json', structure: true },
];

for (const { file, structure } of BOOKS) {
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

  data.chapters = normalizeIds(data.chapters);
  if (structure) data.chapters = data.chapters.map(structureMasail);
  writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
  console.log(`Synced ${count} chapters → src/data/${file}`);
}
