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
