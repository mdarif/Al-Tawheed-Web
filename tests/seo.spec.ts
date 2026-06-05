/**
 * SEO — title, meta description, Open Graph, Twitter Card, canonical URL,
 * hreflang, JSON-LD structured data.
 */
import { test, expect } from "@playwright/test";

const SEO_PAGES = [
  "/",
  "/about/",
  "/lectures/",
  "/download/",
  "/tawheed/",
  "/kitab-al-tawheed/",
  "/ur/",
  "/ur/about/",
];

// ── Per-page SEO bundle ───────────────────────────────────────────────────────

for (const path of SEO_PAGES) {
  test.describe(`SEO — ${path}`, () => {
    test("has non-empty <title>", async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title, "title is empty").toBeTruthy();
      expect(title.length, "title is too short").toBeGreaterThan(5);
    });

    test("has meta description", async ({ page }) => {
      await page.goto(path);
      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(desc, "meta description missing").toBeTruthy();
      expect(desc!.length, "meta description too short").toBeGreaterThan(20);
    });

    test("has og:title and og:description", async ({ page }) => {
      await page.goto(path);
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute("content");
      const ogDesc = await page
        .locator('meta[property="og:description"]')
        .getAttribute("content");
      expect(ogTitle, "og:title missing").toBeTruthy();
      expect(ogDesc, "og:description missing").toBeTruthy();
    });

    test("og:image is an absolute URL", async ({ page }) => {
      await page.goto(path);
      const ogImage = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      expect(ogImage, "og:image missing").toBeTruthy();
      expect(ogImage, "og:image must be absolute URL").toMatch(/^https?:\/\//);
    });

    test("has twitter:card", async ({ page }) => {
      await page.goto(path);
      const card = await page
        .locator('meta[name="twitter:card"]')
        .getAttribute("content");
      expect(card, "twitter:card missing").toBeTruthy();
    });

    test("has canonical link", async ({ page }) => {
      await page.goto(path);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical, "canonical link missing").toBeTruthy();
      expect(canonical, "canonical must be absolute").toMatch(/^https?:\/\//);
    });

    test("has hreflang en, ur, x-default", async ({ page }) => {
      await page.goto(path);
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]')
      ).toHaveCount(1);
      await expect(
        page.locator('link[rel="alternate"][hreflang="ur"]')
      ).toHaveCount(1);
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]')
      ).toHaveCount(1);
    });
  });
}

// ── JSON-LD structured data ───────────────────────────────────────────────────

test.describe("JSON-LD", () => {
  test("homepage has AudioSeries structured data", async ({ page }) => {
    await page.goto("/");
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(raw, "JSON-LD script missing").toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data["@type"]).toBe("AudioSeries");
    expect(data["name"]).toBeTruthy();
    expect(data["numberOfEpisodes"]).toBeGreaterThan(0);
  });

  test("lecture player has AudioObject structured data", async ({ page }) => {
    // Navigate dynamically — never hardcode lecture slugs
    await page.goto("/lectures/");
    await page.locator("main a[href^='/lectures/']").first().click();
    const hrefs = await page.locator('a[href*="/lectures/"]').evaluateAll((els) =>
      els
        .map((el) => el.getAttribute("href"))
        .filter((h): h is string => {
          if (!h) return false;
          const segs = h.split("/").filter(Boolean);
          return segs.length === 3 && segs[0] === "lectures";
        })
    );
    if (!hrefs.length) return; // guard
    await page.goto(hrefs[0]);

    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const hasAudioObject = scripts.some((s) => {
      try {
        return JSON.parse(s)["@type"] === "AudioObject";
      } catch {
        return false;
      }
    });
    expect(hasAudioObject, "No AudioObject JSON-LD found on lecture page").toBe(true);
  });
});
