/**
 * Page availability — every route must return < 400.
 * Urdu locale pages must also stay on their own URL (no redirect to EN equivalent).
 */
import { test, expect } from "@playwright/test";
import { getFirstChapterHref, getFirstLectureHref } from "./helpers";

const EN_PAGES = [
  "/",
  "/lectures/",
  "/about/",
  "/download/",
  "/tawheed/",
  "/kitab-al-tawheed/",
  "/search/",
];

const UR_PAGES = [
  "/ur/",
  "/ur/about/",
  "/ur/download/",
  "/ur/tawheed/",
  "/ur/kitab-al-tawheed/",
];

// ── EN pages ─────────────────────────────────────────────────────────────────

test.describe("EN pages — HTTP status", () => {
  for (const path of EN_PAGES) {
    test(path, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status(), `${path} returned ${res.status()}`).toBeLessThan(400);
    });
  }
});

// ── Urdu locale pages ─────────────────────────────────────────────────────────

test.describe("Urdu locale pages — HTTP status and no redirect", () => {
  for (const path of UR_PAGES) {
    test(path, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path} returned error`).toBeLessThan(400);
      // Must stay on the Urdu URL — Astro's i18n fallback must NOT redirect to EN
      await expect(page, `${path} was redirected away`).toHaveURL(path);
    });
  }
});

// ── Static assets ─────────────────────────────────────────────────────────────

test("RSS feed is accessible", async ({ request }) => {
  const res = await request.get("/feed.xml");
  expect(res.status()).toBeLessThan(400);
});

test("sitemap is accessible", async ({ request }) => {
  // @astrojs/sitemap generates sitemap-index.xml
  const res = await request.get("/sitemap-index.xml");
  expect(res.status()).toBeLessThan(400);
});

test("OG image exists", async ({ request }) => {
  const res = await request.get("/og-image.png");
  expect(res.status()).toBe(200);
});

test("Google Play badge image exists", async ({ request }) => {
  const res = await request.get("/google-play-badge.png");
  expect(res.status()).toBe(200);
});

// ── Dynamic routes (discovered at runtime, never hardcoded) ───────────────────

test("chapter page loads from lectures index", async ({ page }) => {
  const href = await getFirstChapterHref(page);
  const res = await page.goto(href);
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(href);
  await expect(page.locator("h1")).toBeVisible();
});

test("lecture player page loads from chapter page", async ({ page }) => {
  const href = await getFirstLectureHref(page);
  const res = await page.goto(href);
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(href);
  await expect(page.locator("h1")).toBeVisible();
});

// ── Error handling ────────────────────────────────────────────────────────────

test("non-existent page renders without crashing", async ({ page }) => {
  // Must not hang, throw, or redirect-loop
  await page.goto("/this-page-does-not-exist-xyz/");
  await expect(page.locator("body")).toBeVisible();
});
