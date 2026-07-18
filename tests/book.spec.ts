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

  test("font-size control adjusts, resets on reload, and clamps at bounds", async ({ page }) => {
    await page.goto("/arabic/book/ch-03/");
    const matn = page.locator(".book-matn");
    const size = () =>
      matn.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // Default matn size is 22px.
    expect(await size()).toBe(22);

    // A+ / A− adjust by 2px within the view.
    await page.locator("#font-inc").click();
    expect(await size()).toBe(24);
    await page.locator("#font-dec").click();
    expect(await size()).toBe(22);

    // NOT persisted: bump, navigate away, and it resets to the default; and
    // nothing is written to localStorage.
    await page.locator("#font-inc").click(); // 24 for this view only
    await page.goto("/arabic/book/ch-04/");
    expect(await size()).toBe(22);
    const stored = await page.evaluate(() =>
      localStorage.getItem("tawheed:bookFontSize")
    );
    expect(stored).toBeNull();

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

  test("has a share button and a report-a-mistake mailto link", async ({ page }) => {
    await page.goto("/arabic/book/ch-03/");
    await expect(page.locator("#share-btn")).toBeVisible();

    const reportLink = page.locator('main a[href^="mailto:"]');
    await expect(reportLink).toHaveCount(1);
    const href = await reportLink.getAttribute("href");
    expect(href).toContain("subject=");
    const decoded = decodeURIComponent(href!);
    expect(decoded).toContain("تصويب في الكتاب");
    expect(decoded).toContain("Chapter:");
    expect(decoded).toContain("/arabic/book/ch-03/");
  });
});

test.describe("Urdu book — /urdu/book/", () => {
  // The complete bilingual Urdu edition (67 chapters, aligned 1:1 with the
  // Arabic matn). These guard the behaviours, not the content.
  test("hub and chapter render RTL and are indexable", async ({ page }) => {
    for (const path of ["/urdu/book/", "/urdu/book/ch-00/"]) {
      await page.goto(path);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("dir", "rtl");
      await expect(html).toHaveAttribute("lang", "ur");
      // Now the matn is complete, the reader is allowed into the index
      // (no robots noindex, matching the Arabic book).
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    }
  });

  test("chapter has the shared font-size control", async ({ page }) => {
    await page.goto("/urdu/book/ch-00/");
    await page.locator("#font-inc").click(); // default 22 → 24
    const size = await page
      .locator(".book-matn")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBe(24);
  });

  test("bilingual: Arabic āyāt and coupled Urdu translations both render", async ({ page }) => {
    await page.goto("/urdu/book/ch-00/");
    // Green Arabic āyah spans, plus the tagged Urdu translation paragraphs.
    expect(await page.locator(".book-matn .ayah").count()).toBeGreaterThan(0);
    expect(await page.locator(".book-matn p.tr").count()).toBeGreaterThan(0);
  });

  test("chapter has unique canonical + Article and BreadcrumbList JSON-LD", async ({ page }) => {
    // ch-17 = the al-Qasas:56 chapter added to complete the edition.
    await page.goto("/urdu/book/ch-17/");
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toMatch(/\/urdu\/book\/ch-17\/$/);
    const types = (
      await page.locator('script[type="application/ld+json"]').allTextContents()
    ).map((s) => {
      try {
        return JSON.parse(s)["@type"];
      } catch {
        return null;
      }
    });
    expect(types).toContain("Article");
    expect(types).toContain("BreadcrumbList");
  });

  test("hub exposes Book JSON-LD covering every chapter", async ({ page }) => {
    await page.goto("/urdu/book/");
    const book = (
      await page.locator('script[type="application/ld+json"]').allTextContents()
    )
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .find((j) => j?.["@type"] === "Book");
    expect(book).toBeTruthy();
    expect(book.hasPart.length).toBe(67);
  });

  test("chapter has a share button and a report-a-mistake mailto link", async ({ page }) => {
    await page.goto("/urdu/book/ch-03/");
    await expect(page.locator("#share-btn")).toBeVisible();

    const reportLink = page.locator('main a[href^="mailto:"]');
    await expect(reportLink).toHaveCount(1);
    const href = await reportLink.getAttribute("href");
    expect(href).toContain("subject=");
    const decoded = decodeURIComponent(href!);
    expect(decoded).toContain("کتاب میں تصحیح");
    expect(decoded).toContain("Chapter:");
    expect(decoded).toContain("/urdu/book/ch-03/");
  });
});

test.describe("Book cross-links", () => {
  test("book is not a top-level header link (kept in footer + hubs)", async ({ page }) => {
    await page.goto("/");
    // Deliberately removed from the header to declutter; discoverable elsewhere.
    await expect(page.locator("header a[href='/arabic/book/']")).toHaveCount(0);
    await expect(page.locator("footer a[href='/arabic/book/']")).toHaveCount(1);
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
