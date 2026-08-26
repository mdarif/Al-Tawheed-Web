import { test, expect } from "@playwright/test";

// Representative public routes, including both locale variants and the
// content-heavy readers where a single fixed-width child can create a page
// overflow. Search and privacy are intentionally covered by their own suites.
const CORE_ROUTES = [
  "/",
  "/ur/",
  "/lectures/",
  "/lectures/urdu/",
  "/lectures/class-01/",
  "/lectures/class-01/part-01/",
  "/arabic/",
  "/arabic/dars-01/",
  "/arabic/book/",
  "/arabic/book/ch-03/",
  "/urdu/book/",
  "/urdu/book/ch-03/",
  "/about/",
  "/ur/about/",
  "/download/",
  "/ur/download/",
  "/kitab-al-tawheed/",
  "/ur/kitab-al-tawheed/",
  "/tawheed/",
  "/ur/tawheed/",
  "/study-notes/",
  "/guides/allahs-right-over-his-servants/",
  "/sheikh-rahmani/",
  "/sheikh-al-fawzan/",
  "/offline/",
] as const;

for (const width of [320, 375, 390, 430]) {
  test.describe(`mobile layout — ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("core routes fit the viewport without horizontal overflow", async ({ page }) => {
      for (const route of CORE_ROUTES) {
        await page.goto(route);
        const metrics = await page.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));

        expect(
          metrics.documentWidth,
          `${route} document scroll width exceeds ${width}px viewport`
        ).toBeLessThanOrEqual(metrics.viewport);
        expect(
          metrics.bodyWidth,
          `${route} body scroll width exceeds ${width}px viewport`
        ).toBeLessThanOrEqual(metrics.viewport);
      }
    });
  });
}

test.describe("mobile header collision", () => {
  test.use({ viewport: { width: 320, height: 844 } });

  test("translated-page brand text does not paint into the header controls", async ({ page }) => {
    for (const route of ["/", "/about/", "/download/", "/kitab-al-tawheed/", "/tawheed/"]) {
      await page.goto(route);
      const metrics = await page.evaluate(() => {
        const label = [...document.querySelectorAll("header span")].find(
          (element) =>
            element.classList.contains("md:hidden") &&
            element.textContent?.includes("Kitab at-Tawheed")
        );
        const controls = document.querySelector("#site-nav-toggle")?.parentElement;
        if (!label || !controls) throw new Error("Mobile header brand or controls not found");

        const range = document.createRange();
        range.selectNodeContents(label);
        const textRect = range.getBoundingClientRect();
        const controlsRect = controls.getBoundingClientRect();
        return { textRight: textRect.right, controlsLeft: controlsRect.left };
      });

      expect(
        metrics.textRight,
        `${route} mobile brand text overlaps the header controls`
      ).toBeLessThanOrEqual(metrics.controlsLeft + 1);
    }
  });
});
