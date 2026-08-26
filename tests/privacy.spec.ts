import { expect, test } from "@playwright/test";


test("privacy policy fully discloses Al Quran's anonymous Android analytics", async ({ request }) => {
  const response = await request.get("/privacy/");
  const html = (await response.text()).replace(/\s+/g, " ");

  expect(response.status()).toBe(200);
  expect(html).toContain("Anonymous Search analytics (Al Quran for Android only)");
  expect(html).toContain("normally no more than once per day");
  expect(html).toContain("random batch code");
  expect(html).toContain("expires after eight days");
  expect(html).toContain("Settings → Help improve Search");
  expect(html).toContain("Sharah Kitab at-Tawheed and the iOS build of Al Quran do not currently send app analytics");
  expect(html).not.toContain("Server-side analytics is aggregate-only");
  expect(html).not.toContain("accounts, or accounts");
});

test("legacy shared policy points Al Quran readers to its dedicated canonical policy", async ({
  page,
}) => {
  await page.goto("/privacy/");

  const dedicatedPolicy = page.getByRole("link", {
    name: "Al Quran's dedicated privacy policy",
  });
  await expect(dedicatedPolicy).toHaveAttribute(
    "href",
    "https://alquranreader.com/privacy/",
  );
});
