/**
 * Locale / i18n — language selector, URL behaviour, HTML attributes,
 * localStorage persistence, redirect guards, hreflang.
 */
import { test, expect } from "@playwright/test";

const MAIN_PAGES = ["/", "/about/", "/download/", "/tawheed/", "/kitab-al-tawheed/"];

// ── Language selector presence ────────────────────────────────────────────────

test.describe("Language selector — present on all main pages", () => {
  for (const path of MAIN_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('[data-lang="en"]').first()).toBeVisible();
      await expect(page.locator('[data-lang="ur"]').first()).toBeVisible();
    });
  }
});

// ── Language selector — aria-current ─────────────────────────────────────────

test.describe("Language selector — active state", () => {
  test("EN link is marked current on English pages", async ({ page }) => {
    await page.goto("/");
    const enLink = page.locator('[data-lang="en"]').first();
    await expect(enLink).toHaveAttribute("aria-current", "true");
  });

  test("UR link is marked current on Urdu pages", async ({ page }) => {
    await page.goto("/ur/");
    const urLink = page.locator('[data-lang="ur"]').first();
    await expect(urLink).toHaveAttribute("aria-current", "true");
  });
});

// ── Language selector — click navigation ─────────────────────────────────────

test.describe("Language selector — switching", () => {
  test("clicking Urdu from / navigates to /ur/", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-lang="ur"]').first().click();
    await expect(page).toHaveURL("/ur/");
  });

  test("clicking EN from /ur/ navigates to /", async ({ page }) => {
    await page.goto("/ur/");
    await page.locator('[data-lang="en"]').first().click();
    await expect(page).toHaveURL("/");
  });

  test("clicking Urdu from /about/ navigates to /ur/about/", async ({ page }) => {
    await page.goto("/about/");
    await page.locator('[data-lang="ur"]').first().click();
    await expect(page).toHaveURL("/ur/about/");
  });

  test("clicking EN from /ur/about/ navigates to /about/", async ({ page }) => {
    await page.goto("/ur/about/");
    await page.locator('[data-lang="en"]').first().click();
    await expect(page).toHaveURL("/about/");
  });
});

// ── Urdu pages — HTML attributes ─────────────────────────────────────────────

const UR_PAGES = ["/ur/", "/ur/about/", "/ur/download/", "/ur/tawheed/", "/ur/kitab-al-tawheed/"];

test.describe("Urdu pages — lang=ur on <html>", () => {
  for (const path of UR_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "ur");
    });
  }
});

test.describe("Urdu pages — Noto Naskh font loaded", () => {
  for (const path of UR_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      const fontLink = page.locator('link[href*="Noto+Naskh"]');
      await expect(fontLink).toHaveCount(1);
    });
  }
});

// ── hreflang tags ─────────────────────────────────────────────────────────────

test.describe("hreflang alternate links", () => {
  for (const path of [...MAIN_PAGES, "/lectures/"]) {
    test(`${path} has en, ur, x-default`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="ur"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    });
  }
});

// ── Redirect guards ───────────────────────────────────────────────────────────

test.describe("No redirect loops", () => {
  test("/lectures/ stays on /lectures/", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page).toHaveURL("/lectures/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("/search/ stays on /search/", async ({ page }) => {
    await page.goto("/search/");
    await expect(page).toHaveURL("/search/");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Urdu pages — no fallback redirect to EN", () => {
  for (const path of UR_PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      // Astro's i18n fallback previously redirected /ur/* → /*
      await expect(page).toHaveURL(path);
    });
  }
});

// ── localStorage persistence ──────────────────────────────────────────────────

test.describe("Locale preference — localStorage", () => {
  test("clicking Urdu saves 'ur' to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-lang="ur"]').first().click();
    const pref = await page.evaluate(() => localStorage.getItem("tawheed:locale"));
    expect(pref).toBe("ur");
  });

  test("clicking EN saves 'en' to localStorage", async ({ page }) => {
    await page.goto("/ur/");
    await page.locator('[data-lang="en"]').first().click();
    const pref = await page.evaluate(() => localStorage.getItem("tawheed:locale"));
    expect(pref).toBe("en");
  });
});

// ── Locale redirect (JS-based, fires on inline script) ───────────────────────

test.describe("Locale redirect — pref=ur", () => {
  test("/ redirects to /ur/ when pref=ur", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
    await page.goto("/");
    await page.waitForURL("/ur/", { timeout: 5_000 });
    await expect(page).toHaveURL("/ur/");
  });

  test("/about/ redirects to /ur/about/ when pref=ur", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
    await page.goto("/about/");
    await page.waitForURL("/ur/about/", { timeout: 5_000 });
    await expect(page).toHaveURL("/ur/about/");
  });

  test("/lectures/ does NOT redirect when pref=ur (no Urdu version)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
    await page.goto("/lectures/");
    // lectures has no Urdu version — must stay on /lectures/
    await expect(page).toHaveURL("/lectures/");
  });

  test("/search/ does NOT redirect when pref=ur (no Urdu version)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("tawheed:locale", "ur"));
    await page.goto("/search/");
    await expect(page).toHaveURL("/search/");
  });
});
