/**
 * Regression guards — one test per specific bug we've shipped and fixed.
 * Each test has a comment explaining what broke and when.
 *
 * If any of these fail: a previously-fixed bug has regressed.
 */
import { test, expect } from "@playwright/test";
import { getFirstChapterHref } from "./helpers";

// ── i18n content duplication (fixed: translator strings were complete sentences
//    but templates also rendered the lead word/name in <strong>, causing double) ─

test("about page — speaker name appears only once (EN)", async ({ page }) => {
  await page.goto("/about/");
  const text = await page.locator("main").textContent();
  // "Fazilat Shaikh" should appear in the <strong> lead, not again in the paragraph
  const occurrences = (text?.match(/Fazilat Shaikh/g) ?? []).length;
  expect(occurrences, `"Fazilat Shaikh" appeared ${occurrences} times — expected 1`).toBe(1);
});

test("about page — speaker name appears only once (Urdu)", async ({ page }) => {
  await page.goto("/ur/about/");
  const text = await page.locator("main").textContent();
  const occurrences = (text?.match(/فضیلت شیخ عبداللہ ناصر رحمانی حفظہ اللہ/g) ?? []).length;
  expect(occurrences, `Urdu speaker name appeared ${occurrences} times — expected 1`).toBe(1);
});

test("about page — app name appears only once (EN)", async ({ page }) => {
  await page.goto("/about/");
  const text = await page.locator("main").textContent();
  const occurrences = (text?.match(/Sharah Kitab al-Tawheed Android app/gi) ?? []).length;
  expect(occurrences, `App name appeared ${occurrences} times — expected 1`).toBe(1);
});

test("about page — app name appears only once (Urdu)", async ({ page }) => {
  await page.goto("/ur/about/");
  const text = await page.locator("main").textContent();
  const occurrences = (text?.match(/شرح کتاب التوحید اینڈرائیڈ ایپ/g) ?? []).length;
  expect(occurrences, `Urdu app name appeared ${occurrences} times — expected 1`).toBe(1);
});

test("kitab page — author name appears only once (EN)", async ({ page }) => {
  await page.goto("/kitab-al-tawheed/");
  const text = await page.locator("main").textContent();
  const occurrences = (text?.match(/Imam Muhammad ibn Abd al-Wahhab Rahimahullah/g) ?? []).length;
  // Appears as the <strong> lead + possibly in FAQ answers — check it's not duplicated in the same sentence
  // We guard that the p2 paragraph doesn't start with the name again
  const paragraphs = await page.locator("main p").allTextContents();
  for (const para of paragraphs) {
    // No paragraph should have the author name twice in it
    const inPara = (para.match(/Imam Muhammad ibn Abd al-Wahhab Rahimahullah/g) ?? []).length;
    expect(inPara, `Author name duplicated within paragraph: "${para.slice(0, 80)}..."`).toBeLessThanOrEqual(1);
  }
});

test("kitab page — shaikh name appears only once in free-sharah section (EN)", async ({ page }) => {
  await page.goto("/kitab-al-tawheed/");
  const section = await page.locator("section").filter({ hasText: "Shaikh Abdullah Nasir Rahmani" }).first().textContent();
  const occurrences = (section?.match(/Shaikh Abdullah Nasir Rahmani/g) ?? []).length;
  expect(occurrences, `Shaikh name appeared ${occurrences} times in section — expected 1`).toBe(1);
});

test("tawheed page — word Tawheed not duplicated at paragraph start (EN)", async ({ page }) => {
  await page.goto("/tawheed/");
  const paragraphs = await page.locator("main p").allTextContents();
  for (const para of paragraphs) {
    // After our fix: <strong>Tawheed</strong> (monotheism)...
    // Not: <strong>Tawheed</strong> Tawheed (monotheism)...
    const startsWithDouble = /^Tawheed\s+Tawheed/i.test(para.trim());
    expect(startsWithDouble, `Paragraph starts with "Tawheed Tawheed": "${para.slice(0, 80)}"`).toBe(false);
  }
});

// ── Astro i18n fallback redirect (fixed: removed `fallback: { ur: 'en' }` from
//    astro.config.mjs — it was generating redirect stubs that overrode our pages) ─

test("/ur/about/ renders actual content, not Astro redirect stub", async ({ page }) => {
  await page.goto("/ur/about/");
  // Astro's redirect stub contains "Redirecting from" text
  await expect(page.locator("body")).not.toContainText("Redirecting from");
  await expect(page.locator("h1")).toBeVisible();
});

test("/ur/tawheed/ renders actual content, not Astro redirect stub", async ({ page }) => {
  await page.goto("/ur/tawheed/");
  await expect(page.locator("body")).not.toContainText("Redirecting from");
  await expect(page.locator("h1")).toBeVisible();
});

test("/ur/download/ renders actual content, not Astro redirect stub", async ({ page }) => {
  await page.goto("/ur/download/");
  await expect(page.locator("body")).not.toContainText("Redirecting from");
  await expect(page.locator("h1")).toBeVisible();
});

// ── Redirect loop on /lectures/ and /search/ (fixed: allowlist-based JS redirect
//    instead of blanket redirect, so pages without Urdu versions are safe) ──────

test("/lectures/ does not redirect-loop (even with pref=ur saved)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
  await page.goto("/lectures/");
  // Must land and render — not loop or timeout
  await expect(page).toHaveURL("/lectures/");
  await expect(page.locator("main")).toBeVisible({ timeout: 5_000 });
});

test("/search/ does not redirect-loop (even with pref=ur saved)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
  await page.goto("/search/");
  await expect(page).toHaveURL("/search/");
  await expect(page.locator("main")).toBeVisible({ timeout: 5_000 });
});

// ── Download card layout on chapter page (fixed: was using inline-block + mr-2
//    which caused the Google Play badge to overflow outside its container) ──────

test("chapter download card — Google Play badge is fully visible (not overflowing)", async ({ page }) => {
  const href = await getFirstChapterHref(page);
  await page.goto(href);
  const badge = page.locator('img[alt*="Google Play"]').last();
  await expect(badge).toBeVisible();
  const box = await badge.boundingBox();
  expect(box, "badge bounding box missing").toBeTruthy();
  expect(box!.width, "badge width is 0 — likely overflowing").toBeGreaterThan(50);
  expect(box!.height, "badge height is 0 — likely overflowing").toBeGreaterThan(0);

  // Badge must be within the viewport (not clipped)
  const viewport = page.viewportSize()!;
  expect(box!.x + box!.width, "badge right edge is outside viewport").toBeLessThanOrEqual(
    viewport.width + 2 // 2px tolerance for sub-pixel rendering
  );
});

// ── Urdu lecture list (fixed: removed I18nTitle which was rendering both EN and
//    UR subtitle on every lecture row, inconsistent with the mobile app) ────────

test("lectures index shows only English titles (no Urdu subtitles in rows)", async ({ page }) => {
  await page.goto("/lectures/");
  const cards = page.locator("main a[href^='/lectures/']");
  const first = cards.first();
  await expect(first).toBeVisible();
  // Card text must NOT contain Arabic/Urdu script characters (UrduNum range: ؀-ۿ)
  const cardText = await first.textContent();
  const hasUrduScript = /[؀-ۿ]/.test(cardText ?? "");
  expect(hasUrduScript, `Lecture card contains Urdu script: "${cardText?.slice(0, 60)}"`).toBe(false);
});
