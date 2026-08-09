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
  "/privacy-policy/",
  "/tawheed/",
  "/kitab-al-tawheed/",
  "/study-notes/",
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

test("sitemap does not claim stale, shared modification dates", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  const indexXml = await index.text();
  const sitemapPath = indexXml.match(/<loc>https:\/\/kitabattawheed\.com([^<]+)<\/loc>/)?.[1];
  expect(sitemapPath, "sitemap index has no child sitemap").toBeTruthy();

  const sitemap = await request.get(sitemapPath!);
  expect(sitemap.status()).toBeLessThan(400);
  expect(await sitemap.text()).not.toContain("<lastmod>");
});

test("OG image exists", async ({ request }) => {
  const res = await request.get("/og-image.png");
  expect(res.status()).toBe(200);
});

test("per-lecture OG image exists", async ({ page, request }) => {
  const href = await getFirstLectureHref(page);
  await page.goto(href);
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(ogImage, "og:image missing on lecture page").toBeTruthy();
  const ogPath = new URL(ogImage!).pathname;
  expect(ogPath, `unexpected og:image path for ${href}`).toMatch(
    /^\/og\/lectures\/.+\.jpg$/
  );
  const res = await request.get(ogPath);
  expect(res.status()).toBe(200);
});

test("per-dars OG image exists (Arabic series)", async ({ page, request }) => {
  await page.goto("/arabic/");
  const href = await page
    .locator("main a[href^='/arabic/dars-']")
    .first()
    .getAttribute("href");
  expect(href, "No dars links found on /arabic/").toBeTruthy();
  await page.goto(href!);
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(ogImage, "og:image missing on dars page").toBeTruthy();
  const ogPath = new URL(ogImage!).pathname;
  expect(ogPath, `unexpected og:image path for ${href}`).toMatch(
    /^\/og\/arabic\/.+\.jpg$/
  );
  const res = await request.get(ogPath);
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
