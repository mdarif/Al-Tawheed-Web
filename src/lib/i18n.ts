import { en } from "../i18n/en";
import { ur } from "../i18n/ur";

export type Locale = "en" | "ur";

const translations = { en, ur } as const;

/** Return the translation map for the given locale, falling back to English. */
export function t(locale: string | undefined): typeof en {
  return translations[(locale ?? "en") as Locale] ?? en;
}

/** Interpolate `{key}` placeholders in a translated string. */
export function tx(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export const RTL_LOCALES: Locale[] = ["ur"];

/** All non-default locales. Add 'hi', 'ar', etc. here when ready. */
export const NON_DEFAULT_LOCALES: Locale[] = ["ur"];

/**
 * English paths (trailing-slash form) that actually have an Urdu translation
 * under /ur/. Keep in sync with the [locale]/ pages and the locale-redirect
 * script in Layout.astro. Only these should emit hreflang="ur" / a language
 * toggle — everything else has no /ur/ counterpart (would be a 404).
 */
export const TRANSLATED_PATHS = [
  "/",
  "/about/",
  "/download/",
  "/kitab-al-tawheed/",
  "/tawheed/",
];

/** Does the given path (en or /ur-prefixed) have an Urdu counterpart? */
export function hasTranslation(pathname: string): boolean {
  const enPath = pathname.replace(/^\/ur(?=\/|$)/, "") || "/";
  const normalized = enPath.endsWith("/") ? enPath : `${enPath}/`;
  return TRANSLATED_PATHS.includes(normalized);
}

/** Use in getStaticPaths() for every [locale] page. */
export function getLocalePaths() {
  return NON_DEFAULT_LOCALES.map((locale) => ({ params: { locale } }));
}

export function isRtl(locale: string | undefined): boolean {
  return RTL_LOCALES.includes((locale ?? "en") as Locale);
}

/** Build the alternate-locale URL for the current path. */
export function altLocaleUrl(
  locale: string | undefined,
  pathname: string
): string {
  if (locale === "ur") {
    return pathname.replace(/^\/ur/, "") || "/";
  }
  return `/ur${pathname === "/" ? "/" : pathname}`;
}
