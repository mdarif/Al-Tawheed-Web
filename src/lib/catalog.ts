export interface I18nField {
  en: string;
  ur?: string;
  roman?: string;
  hi?: string;
  ar?: string;
}

export interface Book {
  id: string;
  title: I18nField;
  speaker: I18nField;
  totalDurationSeconds: number;
  lectureCount: number;
  coverImageUrl: string;
  language: string;
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

const CONTENT_BASE = 'https://al-tawheed-content.pages.dev/tawheed';

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

/** Resolve an i18n field to its English string */
export function en(field: string | I18nField | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en ?? '';
}

/** Slug from chapter id: "class-01" → "class-01" (already a slug) */
export function chapterSlug(chapterId: string): string {
  return chapterId;
}

/** Slug from lecture id: "lec-001" → "part-01" using the lecture number */
export function lectureSlug(lecture: Lecture): string {
  return `part-${String(lecture.number).padStart(2, '0')}`;
}
