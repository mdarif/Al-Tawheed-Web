import type { Page } from "@playwright/test";

/** Navigate to the Urdu series page and return the href of the first chapter card. */
export async function getFirstChapterHref(page: Page): Promise<string> {
  await page.goto("/lectures/urdu/");
  const href = await page
    .locator("main a[href^='/lectures/class-']")
    .first()
    .getAttribute("href");
  if (!href) throw new Error("No chapter links found on /lectures/urdu/");
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

async function lastLectureHrefInChapter(page: Page, chapterHref: string): Promise<string> {
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
  return hrefs[hrefs.length - 1];
}

/**
 * Navigate into the first chapter and return the href of its LAST lecture —
 * the page where ChapterCompleteCard is eligible to render (`!next`). Note:
 * since a next chapter exists, autoplay-next also fires on 'ended' here and
 * navigates away — use `getLastLectureOfLastChapterHref` to test the reveal
 * in isolation from that navigation.
 */
export async function getLastLectureHref(page: Page): Promise<string> {
  const chapterHref = await getFirstChapterHref(page);
  return lastLectureHrefInChapter(page, chapterHref);
}

/**
 * Navigate into the LAST chapter of the series and return the href of its
 * last lecture — the one lecture page with no `nextHref` at all (course
 * complete), so autoplay-next never fires and doesn't race the
 * ChapterCompleteCard reveal.
 */
export async function getLastLectureOfLastChapterHref(page: Page): Promise<string> {
  await page.goto("/lectures/urdu/");
  const chapterHrefs = await page
    .locator("main a[href^='/lectures/class-']")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")).filter((h): h is string => !!h));
  if (!chapterHrefs.length) throw new Error("No chapter links found on /lectures/urdu/");
  return lastLectureHrefInChapter(page, chapterHrefs[chapterHrefs.length - 1]);
}
