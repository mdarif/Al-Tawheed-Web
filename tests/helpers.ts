import type { Page } from "@playwright/test";

/** Navigate to /lectures/ and return the href of the first chapter card. */
export async function getFirstChapterHref(page: Page): Promise<string> {
  await page.goto("/lectures/");
  const href = await page
    .locator("main a[href^='/lectures/']")
    .first()
    .getAttribute("href");
  if (!href) throw new Error("No chapter links found on /lectures/");
  return href;
}

/**
 * Navigate into the first chapter and return the href of its first lecture.
 * Lecture URLs have 3 path segments: /lectures/[chapterId]/[lectureSlug]/
 */
export async function getFirstLectureHref(page: Page): Promise<string> {
  const chapterHref = await getFirstChapterHref(page);
  await page.goto(chapterHref);
  const hrefs = await page.locator('a[href*="/lectures/"]').evaluateAll((els) =>
    els
      .map((el) => el.getAttribute("href"))
      .filter((h): h is string => {
        if (!h) return false;
        const segs = h.split("/").filter(Boolean);
        return segs.length === 3 && segs[0] === "lectures";
      })
  );
  if (!hrefs.length) throw new Error("No lecture links found on chapter page");
  return hrefs[0];
}
