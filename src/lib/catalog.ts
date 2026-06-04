export interface I18nField {
  en: string;
  ur?: string;
  roman?: string;
  hi?: string;
  ar?: string;
}

/** Matches Flutter [AppLanguage] content resolution keys. */
export type ContentLocale = 'en' | 'ur' | 'roman';

export interface Book {
  id: string;
  title: I18nField;
  titleArabic?: string;
  author?: string;
  speaker: I18nField;
  speakerShortName?: string;
  totalDurationSeconds: number;
  lectureCount: number;
  coverImageUrl: string;
  language: string;
  catalogUpdatedAt?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: I18nField;
  lectureCount: number;
}

export interface Lecture {
  id: string;
  number: number;
  chapterId: string;
  title: I18nField;
  audioUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  description?: string | null;
}

export interface DailyBenefit {
  id: string;
  text: string | I18nField;
  source: string | I18nField;
  textArabic?: string;
}

export interface Catalog {
  version: number;
  book: Book;
  chapters: Chapter[];
  lectures: Lecture[];
  dailyBenefits: DailyBenefit[];
}

export interface AppConfig {
  version: number;
  links: { playStore?: string; appStore?: string; website?: string; youtube?: string };
  contact: { email: string; subject: string };
  share: { message: string };
  about: { appName: string; lecturer: string; lectureCount: number; totalDuration: string };
}

export const SITE_URL = 'https://kitabattawheed.com';

const CONTENT_BASE = 'https://al-tawheed-content.pages.dev/tawheed';

/** CDN book cover (same art as Flutter `assets/tawheed.png`). */
export const CDN_COVER_URL = `${CONTENT_BASE}/images/cover.jpg`;

/** Fallback if catalog/CDN is unavailable at build time. */
export const BOOK_COVER_SRC = '/book-cover.png';

export function bookCoverSrc(book?: Book): string {
  return book?.coverImageUrl ?? CDN_COVER_URL;
}

export function bookCoverOgUrl(book?: Book): string {
  const src = bookCoverSrc(book);
  if (src.startsWith('http')) return src;
  return new URL(src, SITE_URL).toString();
}

export async function getCatalog(): Promise<Catalog> {
  const res = await fetch(`${CONTENT_BASE}/catalog.json`);
  if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
  return res.json();
}

export async function getAppConfig(): Promise<AppConfig> {
  const res = await fetch(`${CONTENT_BASE}/app-config.json`);
  if (!res.ok) throw new Error(`Failed to fetch app-config: ${res.status}`);
  return res.json();
}

/** Format seconds → "35m 57s" or "1h 23m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  return `${s}s`;
}

function asI18n(field: string | I18nField | undefined): I18nField | null {
  if (!field) return null;
  if (typeof field === 'string') return { en: field };
  return field;
}

/**
 * Resolve multilingual content (same fallback chain as Flutter LanguageProvider).
 * roman → ur → en; ur → en; en is terminal.
 */
export function resolve(
  field: string | I18nField | undefined,
  locale: ContentLocale = 'en',
): string {
  const map = asI18n(field);
  if (!map) return '';

  const primary = map[locale];
  if (primary?.trim()) return primary;

  if (locale === 'roman' && map.ur?.trim()) return map.ur;
  return map.en ?? '';
}

/** English string for SEO meta, JSON-LD, and primary headings. */
export function en(field: string | I18nField | undefined): string {
  return resolve(field, 'en');
}

/** Urdu subtitle when present (for bilingual UI under English titles). */
export function urduSubtitle(field: string | I18nField | undefined): string | undefined {
  const map = asI18n(field);
  const ur = map?.ur?.trim();
  return ur || undefined;
}

/** Slug from chapter id: "class-01" → "class-01" (already a slug) */
export function chapterSlug(chapterId: string): string {
  return chapterId;
}

/** Slug from lecture id: "lec-001" → "part-01" using the lecture number */
export function lectureSlug(lecture: Lecture): string {
  return `part-${String(lecture.number).padStart(2, '0')}`;
}

export function playStoreUrl(appConfig: AppConfig): string {
  return (
    appConfig.links.playStore ??
    'https://play.google.com/store/apps/details?id=com.almarfa.tawheed'
  );
}

export function nextChapter(catalog: Catalog, chapter: Chapter): Chapter | undefined {
  return catalog.chapters.find((c) => c.number === chapter.number + 1);
}

export function firstLectureInChapter(catalog: Catalog, chapterId: string): Lecture | undefined {
  return catalog.lectures
    .filter((l) => l.chapterId === chapterId)
    .sort((a, b) => a.number - b.number)[0];
}
