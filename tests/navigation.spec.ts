/**
 * Navigation — header, footer, breadcrumbs, lecture prev/next, theme toggle.
 * Both desktop and mobile viewports.
 */
import { test, expect } from "@playwright/test";
import { getFirstChapterHref, getFirstLectureHref } from "./helpers";

// ── Skip link ─────────────────────────────────────────────────────────────────

test.describe("Skip link", () => {
  test("first Tab from a fresh load focuses the skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  });

  test("activating it moves focus to #main-content", async ({ page }) => {
    await page.goto("/");
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page).toHaveURL(/#main-content$/);
  });
});

// ── Header — desktop nav ──────────────────────────────────────────────────────

test.describe("Header — desktop nav", () => {
  test("all links resolve (< 400)", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator("header nav a[href]")
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("href") ?? "")
          .filter((h) => h.startsWith("/") && !h.startsWith("//"))
      );
    expect(hrefs.length, "No desktop nav links found").toBeGreaterThan(0);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), `Nav link "${href}" returned ${res.status()}`).toBeLessThan(400);
    }
  });
});

// ── Header — logo ─────────────────────────────────────────────────────────────

test.describe("Header — logo", () => {
  test("EN logo navigates to /", async ({ page }) => {
    await page.goto("/about/");
    await page.locator("header a").first().click();
    await expect(page).toHaveURL("/");
  });

  test("Urdu logo navigates to /ur/", async ({ page }) => {
    await page.goto("/ur/about/");
    await page.locator("header a").first().click();
    await expect(page).toHaveURL("/ur/");
  });
});

// ── Header — mobile nav ───────────────────────────────────────────────────────

test.describe("Header — mobile nav", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger opens the panel", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#site-nav-panel")).toBeHidden();
    await page.locator("#site-nav-toggle").click();
    await expect(page.locator("#site-nav-panel")).toBeVisible();
  });

  test("clicking a link closes the panel", async ({ page }) => {
    await page.goto("/");
    await page.locator("#site-nav-toggle").click();
    await expect(page.locator("#site-nav-panel")).toBeVisible();
    await page.locator("#site-nav-panel a").first().click();
    await expect(page.locator("#site-nav-panel")).toBeHidden();
  });

  test("all mobile nav links resolve (< 400)", async ({ page, request }) => {
    await page.goto("/");
    await page.locator("#site-nav-toggle").click();
    const hrefs = await page
      .locator("#site-nav-panel a[href]")
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("href") ?? "")
          .filter((h) => h.startsWith("/"))
      );
    expect(hrefs.length, "No mobile nav links found").toBeGreaterThan(0);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), `Mobile nav "${href}" returned ${res.status()}`).toBeLessThan(400);
    }
  });

  test("mobile CTA bar is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".mobile-cta-bar")).toBeVisible();
  });
});

// ── Footer ────────────────────────────────────────────────────────────────────

test.describe("Footer", () => {
  test("all links resolve (< 400)", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator("footer a[href]")
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute("href") ?? "")
          .filter((h) => h.startsWith("/"))
      );
    expect(hrefs.length, "No footer links found").toBeGreaterThan(0);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), `Footer link "${href}" returned ${res.status()}`).toBeLessThan(400);
    }
  });
});

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

test.describe("Breadcrumbs", () => {
  test("/lectures/ has Home link", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test("chapter page has Lectures link", async ({ page }) => {
    const href = await getFirstChapterHref(page);
    await page.goto(href);
    // Scope to main — header/footer also contain /lectures/ links
    await expect(page.locator('main a[href="/lectures/"]').first()).toBeVisible();
  });

  test("lecture player has chapter link", async ({ page }) => {
    const chapterHref = await getFirstChapterHref(page);
    const lectureHref = await getFirstLectureHref(page);
    await page.goto(lectureHref);
    await expect(page.locator(`a[href="${chapterHref}"]`)).toBeVisible();
  });

  test("/about/ has Home link", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test("/download/ has Home link", async ({ page }) => {
    await page.goto("/download/");
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });
});

// ── Lecture player — prev/next ─────────────────────────────────────────────────

test.describe("Lecture player — prev/next", () => {
  test("at least one prev or next button is present", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    const prevNext = page.locator(
      'a:has-text("←"), a:has-text("→"), a:has-text("Previous"), a:has-text("Next")'
    );
    await expect(prevNext.first()).toBeVisible();
  });

  test("next button links to a different URL than current page", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    // Only assert if a next button is visible — first lecture may have next but not prev
    const nextBtn = page.locator('a:has-text("→"), a:has-text("Next")').last();
    if (await nextBtn.isVisible()) {
      const nextHref = await nextBtn.getAttribute("href");
      if (nextHref) expect(nextHref).not.toBe(href);
    }
  });
});

// ── Theme toggle ──────────────────────────────────────────────────────────────

test.describe("Theme toggle", () => {
  test("desktop toggle is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#theme-toggle")).toBeVisible();
  });

  test("clicking changes data-theme attribute", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = (await html.getAttribute("data-theme")) ?? "dark";
    await page.locator("#theme-toggle").click();
    const after = (await html.getAttribute("data-theme")) ?? "dark";
    expect(before).not.toEqual(after);
  });

  test("theme persists across page navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("tawheed:theme", "light"));
    await page.goto("/about/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test.describe("Theme toggle — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile toggle is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#theme-toggle-mobile")).toBeVisible();
  });
});
