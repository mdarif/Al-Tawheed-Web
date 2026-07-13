/**
 * Teacher bio pages — Shaikh Abdullah Nasir Rahmani (Urdu) and Shaikh Salih
 * al-Fawzan (Arabic) — plus their navigation wiring (footer + series hubs).
 */
import { test, expect, type Page } from "@playwright/test";

async function personSchema(page: Page) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  return scripts
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .find((d) => d && d["@type"] === "Person");
}

test.describe("Shaikh al-Fawzan bio — /sheikh-al-fawzan/", () => {
  test("renders with a heading and is search-indexed", async ({ page }) => {
    await page.goto("/sheikh-al-fawzan/");
    await expect(page.locator("h1")).toHaveText(/al-Fawzan/);
    await expect(page.locator("[data-pagefind-body]")).toHaveCount(1);
    await expect(page.locator("main")).toContainText("Grand Mufti of Saudi Arabia");
  });

  test("has Person structured data", async ({ page }) => {
    await page.goto("/sheikh-al-fawzan/");
    const person = await personSchema(page);
    expect(person, "No Person JSON-LD on al-Fawzan bio").toBeTruthy();
    expect(person.name).toContain("al-Fawzan");
  });

  test("links to both series and the book", async ({ page }) => {
    await page.goto("/sheikh-al-fawzan/");
    for (const href of ["/arabic/", "/arabic/book/", "/lectures/urdu/"]) {
      await expect(
        page.locator(`main a[href='${href}']`).first(),
        `al-Fawzan bio missing link to ${href}`
      ).toBeVisible();
    }
  });
});

test.describe("Shaikh Rahmani bio — /sheikh-rahmani/", () => {
  test("renders and has Person structured data", async ({ page }) => {
    await page.goto("/sheikh-rahmani/");
    await expect(page.locator("h1")).toBeVisible();
    const person = await personSchema(page);
    expect(person, "No Person JSON-LD on Rahmani bio").toBeTruthy();
    expect(person.name).toContain("Rahmani");
  });

  test("links to both series and the book", async ({ page }) => {
    await page.goto("/sheikh-rahmani/");
    for (const href of ["/lectures/urdu/", "/arabic/book/", "/arabic/"]) {
      await expect(
        page.locator(`main a[href='${href}']`).first(),
        `Rahmani bio missing link to ${href}`
      ).toBeVisible();
    }
  });
});

test.describe("Teacher bio navigation wiring", () => {
  test("footer links to both teacher bios", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer a[href='/sheikh-rahmani/']")).toHaveCount(1);
    await expect(page.locator("footer a[href='/sheikh-al-fawzan/']")).toHaveCount(1);
  });

  test("lectures hub links to both bios", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page.locator("main a[href='/sheikh-rahmani/']").first()).toBeVisible();
    await expect(page.locator("main a[href='/sheikh-al-fawzan/']").first()).toBeVisible();
  });

  test("Urdu hub links to the Rahmani bio", async ({ page }) => {
    await page.goto("/lectures/urdu/");
    await expect(page.locator("main a[href='/sheikh-rahmani/']").first()).toBeVisible();
  });

  test("Arabic hub links to the al-Fawzan bio", async ({ page }) => {
    await page.goto("/arabic/");
    await expect(page.locator("main a[href='/sheikh-al-fawzan/']").first()).toBeVisible();
  });
});
