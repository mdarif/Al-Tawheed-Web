/**
 * Arabic Kitab at-Tawheed matn (book text) — hub + per-chapter reader.
 * Content is the mobile app's bundled matn (src/data/book_tawheed-ar.json),
 * rendered RTL with verse/hadith/citation markers.
 */
import { test, expect, type Page } from "@playwright/test";

/** From the book hub, return the href of the first chapter (never hardcode slugs). */
async function firstChapterHref(page: Page): Promise<string> {
  await page.goto("/arabic/book/");
  const href = await page
    .locator("main a[href^='/arabic/book/ch-']")
    .first()
    .getAttribute("href");
  if (!href) throw new Error("No chapter links found on /arabic/book/");
  return href;
}

test.describe("Book hub — /arabic/book/", () => {
  test("renders an RTL Arabic page with a heading", async ({ page }) => {
    await page.goto("/arabic/book/");
    await expect(page.locator("h1")).toBeVisible();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");
  });

  test("lists the full chapter index (67 chapters)", async ({ page }) => {
    await page.goto("/arabic/book/");
    const hrefs = await page
      .locator("main a[href^='/arabic/book/ch-']")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    // 67 distinct chapters (ch-00…ch-66); the "read the book" CTA re-points at one.
    const distinct = new Set(hrefs);
    expect(distinct.size).toBe(67);
  });

  test("every chapter link resolves (spot-check first + last)", async ({ page }) => {
    await page.goto("/arabic/book/");
    const links = page.locator("main a[href^='/arabic/book/ch-']");
    const first = await links.first().getAttribute("href");
    const last = await links.last().getAttribute("href");
    for (const href of [first, last]) {
      const res = await page.request.get(href!);
      expect(res.status(), `${href} should resolve`).toBe(200);
    }
  });

  test("is indexed for search and carries Book JSON-LD", async ({ page }) => {
    await page.goto("/arabic/book/");
    await expect(page.locator("[data-pagefind-body]")).toHaveCount(1);
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const hasBook = scripts.some((s) => {
      try {
        return JSON.parse(s)["@type"] === "Book";
      } catch {
        return false;
      }
    });
    expect(hasBook, "No Book JSON-LD on the hub").toBe(true);
  });
});

test.describe("Chapter reader — /arabic/book/ch-*", () => {
  test("renders Arabic matn RTL with a heading", async ({ page }) => {
    await page.goto(await firstChapterHref(page));
    await expect(page.locator("h1")).toBeVisible();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(page.locator("[data-pagefind-body]")).toHaveCount(1);
  });

  test("colours Quranic verses and ahadith", async ({ page }) => {
    // ch-03 (باب الخوف من الشرك) is known to contain both verse and hadith markers.
    await page.goto("/arabic/book/ch-03/");
    await expect(page.locator(".book-matn .ayah").first()).toBeVisible();
    await expect(page.locator(".book-matn .hadith").first()).toBeVisible();
  });

  test("has working prev/next navigation between chapters", async ({ page }) => {
    // ch-01 has a next; ch-02 has both prev and next.
    await page.goto("/arabic/book/ch-02/");
    const nav = page.locator("main a[href^='/arabic/book/ch-']");
    const hasNext = await page.locator("main a[href='/arabic/book/ch-03/']").count();
    const hasPrev = await page.locator("main a[href='/arabic/book/ch-01/']").count();
    expect(hasNext).toBeGreaterThan(0);
    expect(hasPrev).toBeGreaterThan(0);
    // Full chapter list is present too.
    expect(await nav.count()).toBeGreaterThan(10);
  });

  test("font-size control adjusts, persists, and clamps at bounds", async ({ page }) => {
    await page.goto("/arabic/book/ch-03/");
    const matn = page.locator(".book-matn");
    const size = () =>
      matn.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // Default is 20px (matches the app).
    expect(await size()).toBe(20);

    // A+ grows by 2px and persists to localStorage.
    await page.locator("#font-inc").click();
    expect(await size()).toBe(22);
    const stored = await page.evaluate(() =>
      localStorage.getItem("tawheed:bookFontSize")
    );
    expect(stored).toBe("22");

    // A− shrinks back.
    await page.locator("#font-dec").click();
    expect(await size()).toBe(20);

    // Persists across navigation to another chapter.
    await page.locator("#font-inc").click(); // 22
    await page.goto("/arabic/book/ch-04/");
    expect(await size()).toBe(22);

    // Clamps at the max (32) and disables A+ there.
    for (
      let i = 0;
      i < 10 && !(await page.locator("#font-inc").isDisabled());
      i++
    ) {
      await page.locator("#font-inc").click();
    }
    expect(await size()).toBe(32);
    await expect(page.locator("#font-inc")).toBeDisabled();
  });

  test("has unique canonical + Article and BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/arabic/book/ch-03/");
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toMatch(/\/arabic\/book\/ch-03\/$/);
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const types = scripts.map((s) => {
      try {
        return JSON.parse(s)["@type"];
      } catch {
        return null;
      }
    });
    expect(types).toContain("Article");
    expect(types).toContain("BreadcrumbList");
  });
});

test.describe("Book cross-links", () => {
  test("header links to the Arabic book", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("header a[href='/arabic/book/']").first()
    ).toBeVisible();
  });

  test("footer links to the Arabic book", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("footer a[href='/arabic/book/']").first()
    ).toBeVisible();
  });

  test("audio series hub links to the book", async ({ page }) => {
    await page.goto("/arabic/");
    await expect(
      page.locator("main a[href='/arabic/book/']").first()
    ).toBeVisible();
  });

  test("the Kitab at-Tawheed explainer links to the book", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    await expect(
      page.locator("main a[href='/arabic/book/']").first()
    ).toBeVisible();
  });
});
