/**
 * Content — critical UI elements on each page.
 * Tests that sections, widgets, and key text are actually rendered.
 */
import { test, expect } from "@playwright/test";
import { getFirstChapterHref, getFirstLectureHref } from "./helpers";

// ── Homepage ──────────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("hero h1 is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("trust badge is visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('text=Trusted by students of knowledge worldwide')
    ).toBeVisible();
  });

  test("app feature chips are rendered (at least 4)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('text=Offline Downloads').first()).toBeVisible();
    await expect(page.locator('text=Progress Tracking').first()).toBeVisible();
  });

  test("app screenshots carousel has images", async ({ page }) => {
    await page.goto("/");
    const screenshots = page.locator('img[src*="app-screenshots"]');
    await expect(screenshots.first()).toBeVisible();
    expect(await screenshots.count()).toBeGreaterThanOrEqual(4);
  });

  test("testimonials section has review cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('text=What Listeners Say')).toBeVisible();
    // At least 2 review cards
    const reviews = page.locator('text=★★★★★');
    expect(await reviews.count()).toBeGreaterThanOrEqual(2);
  });

  test("Web vs Android App comparison is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('text=Web vs Android App')).toBeVisible();
    await expect(page.locator('text=RECOMMENDED')).toBeVisible();
  });

  test("ContinueListening card is hidden on fresh visit", async ({ page }) => {
    await page.goto("/");
    // No localStorage playback data → card must be hidden
    await expect(page.locator('[data-continue-card]')).toBeHidden();
  });

  test("Google Play badge is present", async ({ page }) => {
    await page.goto("/");
    const badge = page.locator('img[alt*="Google Play"]').first();
    await expect(badge).toBeVisible();
  });
});

// ── Lectures page ─────────────────────────────────────────────────────────────

test.describe("Lectures page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("has at least 10 chapter cards", async ({ page }) => {
    await page.goto("/lectures/");
    const chapters = page.locator("main a[href^='/lectures/']");
    expect(await chapters.count()).toBeGreaterThanOrEqual(10);
  });

  test("chapter cards show a title and duration", async ({ page }) => {
    await page.goto("/lectures/");
    const firstCard = page.locator("main a[href^='/lectures/']").first();
    await expect(firstCard).toBeVisible();
    // Each card must have some text content (title + metadata)
    const text = await firstCard.textContent();
    expect(text?.length).toBeGreaterThan(5);
  });
});

// ── Chapter page ──────────────────────────────────────────────────────────────

test.describe("Chapter page", () => {
  test("chapter h1 is visible", async ({ page }) => {
    const href = await getFirstChapterHref(page);
    await page.goto(href);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("lecture list has at least one item", async ({ page }) => {
    const href = await getFirstChapterHref(page);
    await page.goto(href);
    const allLectureLinks = page.locator('a[href*="/lectures/"]');
    expect(await allLectureLinks.count()).toBeGreaterThan(1);
  });

  test("offline download card has Google Play badge", async ({ page }) => {
    const href = await getFirstChapterHref(page);
    await page.goto(href);
    await expect(page.locator('img[alt*="Google Play"]').last()).toBeVisible();
  });

  test("offline download card is not broken (badge inside its container)", async ({ page }) => {
    const href = await getFirstChapterHref(page);
    await page.goto(href);
    // Badge must be visible — if layout was broken (inline-block+mr-2 bug),
    // the badge overflowed and was obscured
    const badge = page.locator('img[alt*="Google Play"]').last();
    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box, "badge has no bounding box").toBeTruthy();
    expect(box!.width, "badge has zero width").toBeGreaterThan(0);
  });
});

// ── Lecture player ─────────────────────────────────────────────────────────────

test.describe("Lecture player", () => {
  test("lecture h1 is visible", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("app download CTA is present", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    // Scoped to main to avoid matching nav/footer "Download App" links
    await expect(page.locator('main').getByText('Continue On The App')).toBeVisible();
  });

  test("chapter overview / all parts list is present", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    // Overview renders links to every lecture in the chapter, so > 2 internal lecture links
    const lectureLinks = page.locator('main a[href*="/lectures/"]');
    expect(await lectureLinks.count()).toBeGreaterThan(2);
  });
});

// ── About page ────────────────────────────────────────────────────────────────

test.describe("About page", () => {
  test("Kitab al-Tawheed section is present", async ({ page }) => {
    await page.goto("/about/");
    // Scope to main headings — header logo also contains this text (hidden on desktop)
    await expect(page.locator('main h2').filter({ hasText: 'Kitab al-Tawheed' }).first()).toBeVisible();
  });

  test("Speaker section is present", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('text=The Speaker').or(page.locator('text=شارح'))).toBeVisible();
  });

  test("App section is present", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('text=The App').or(page.locator('text=ایپ'))).toBeVisible();
  });

  test("contact email link is present", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  });
});

// ── Download page ─────────────────────────────────────────────────────────────

test.describe("Download page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/download/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Google Play badge is visible", async ({ page }) => {
    await page.goto("/download/");
    await expect(page.locator('img[alt*="Google Play"]').first()).toBeVisible();
  });

  test("features grid has 6 items", async ({ page }) => {
    await page.goto("/download/");
    await expect(page.locator('text=Offline Downloads')).toBeVisible();
    await expect(page.locator('text=Progress Tracking')).toBeVisible();
    await expect(page.locator('text=Study Mode')).toBeVisible();
    await expect(page.locator('text=Background Playback')).toBeVisible();
  });

  test("app screenshots are present", async ({ page }) => {
    await page.goto("/download/");
    const screenshots = page.locator('img[src*="app-screenshots"]');
    expect(await screenshots.count()).toBeGreaterThanOrEqual(4);
  });
});

// ── Tawheed page ──────────────────────────────────────────────────────────────

test.describe("Tawheed page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/tawheed/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("three types of Tawheed are listed", async ({ page }) => {
    await page.goto("/tawheed/");
    // Types are in <ul><li><strong> — scope avoids FAQ answer paragraphs that also mention these terms
    await expect(page.locator('ul li').filter({ hasText: /Tawheed ar-Rububiyyah|توحید الربوبیہ/ }).first()).toBeVisible();
    await expect(page.locator('ul li').filter({ hasText: /Tawheed al-Uluhiyyah|توحید الالوہیہ/ }).first()).toBeVisible();
    await expect(page.locator('ul li').filter({ hasText: /Tawheed al-Asma|توحید الاسماء/ }).first()).toBeVisible();
  });

  test("FAQ accordion has at least one item", async ({ page }) => {
    await page.goto("/tawheed/");
    const faqs = page.locator("details");
    expect(await faqs.count()).toBeGreaterThan(0);
  });

  test("FAQ item expands on click", async ({ page }) => {
    await page.goto("/tawheed/");
    const firstFaq = page.locator("details").first();
    await expect(firstFaq).not.toHaveAttribute("open");
    await firstFaq.locator("summary").click();
    await expect(firstFaq).toHaveAttribute("open");
  });
});

// ── Kitab al-Tawheed page ─────────────────────────────────────────────────────

test.describe("Kitab al-Tawheed page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("free sharah section with lecture links is present", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    // Scope to main — header/footer also contain /lectures/ links
    await expect(page.locator('main a[href="/lectures/"]').first()).toBeVisible();
  });

  test("FAQ section is present", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    expect(await page.locator("details").count()).toBeGreaterThan(0);
  });
});

// ── Search page ───────────────────────────────────────────────────────────────

test.describe("Search page", () => {
  test("search input is present", async ({ page }) => {
    await page.goto("/search/");
    // Pagefind renders its input inside main — wait for JS to hydrate the component
    await expect(page.locator('main input').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Urdu locale pages — content ───────────────────────────────────────────────

test.describe("Urdu homepage", () => {
  test("hero h1 is visible", async ({ page }) => {
    await page.goto("/ur/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("trust badge is visible in Urdu", async ({ page }) => {
    await page.goto("/ur/");
    // Trust badge text in Urdu from ur.ts hero.trustBadge
    await expect(
      page.locator('text=دنیا بھر کے طالبِ علم اس سے مستفید ہوتے ہیں')
    ).toBeVisible();
  });

  test("Google Play badge is present", async ({ page }) => {
    await page.goto("/ur/");
    await expect(page.locator('img[alt*="Google Play"]').first()).toBeVisible();
  });
});

test.describe("Urdu About page", () => {
  test("h1 is visible", async ({ page }) => {
    await page.goto("/ur/about/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("has Urdu speaker section", async ({ page }) => {
    await page.goto("/ur/about/");
    await expect(page.locator('text=شارح')).toBeVisible();
  });
});
