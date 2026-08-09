/**
 * Content — critical UI elements on each page.
 * Tests that sections, widgets, and key text are actually rendered.
 */
import { test, expect } from "@playwright/test";
import {
  getFirstChapterHref,
  getFirstLectureHref,
  getLastLectureHref,
  getLastLectureOfLastChapterHref,
} from "./helpers";

// ── Homepage ──────────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("hero h1 is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("hero h1 uses the standardized 'Kitab at-Tawheed' spelling", async ({ page }) => {
    // The title comes from the content CDN, which still says "al-Tawheed" —
    // normalizeTitleSpelling() in src/lib/catalog.ts fixes it at display time.
    await page.goto("/");
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText("Kitab at-Tawheed");
    await expect(h1).not.toContainText("Kitab al-Tawheed");
  });

  test("hero stats KPI row shows counts + Offline", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("group", { name: /available offline/i });
    await expect(stats).toBeVisible();
    await expect(stats.getByText("Offline", { exact: true })).toBeVisible();
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
    await expect(page.getByText("Full Arabic & Urdu Books", { exact: true })).toBeVisible();
  });

  test("app features do not promise unavailable cross-device sync", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Cross-Device Progress")).toHaveCount(0);
    await expect(page.getByText("No Ads").first()).toBeVisible();
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

  test("web/app comparison is present (web framed as full)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('text=Listen free on the web')).toBeVisible();
    await expect(page.getByText('EVEN MORE', { exact: true })).toBeVisible();
    // The web column must no longer frame itself as limited.
    await expect(page.locator('text=No background play')).toHaveCount(0);
    await expect(page.locator('text=Requires internet')).toHaveCount(0);
  });

  test("Read the Book section links to both readers", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2", { hasText: "Read the Book" })).toBeVisible();
    await expect(page.locator("main a[href='/arabic/book/']").first()).toBeVisible();
    await expect(page.locator("main a[href='/urdu/book/']").first()).toBeVisible();
    await expect(page.getByText("Major Update · Read Online", { exact: true })).toBeVisible();
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

  test("Al Quran cross-promo links to alquranreader.com", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('main a[href="https://alquranreader.com"]').first()
    ).toBeVisible();
  });
});

// ── Lectures page ─────────────────────────────────────────────────────────────

test.describe("Lectures hub", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("offers both series (Urdu + Arabic)", async ({ page }) => {
    await page.goto("/lectures/");
    await expect(page.locator("main a[href='/lectures/urdu/']").first()).toBeVisible();
    await expect(page.locator("main a[href='/arabic/']").first()).toBeVisible();
  });
});

test.describe("Urdu series page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/lectures/urdu/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("has at least 10 chapter cards", async ({ page }) => {
    await page.goto("/lectures/urdu/");
    const chapters = page.locator("main a[href^='/lectures/class-']");
    expect(await chapters.count()).toBeGreaterThanOrEqual(10);
  });

  test("chapter cards show a title and duration", async ({ page }) => {
    await page.goto("/lectures/urdu/");
    const firstCard = page.locator("main a[href^='/lectures/class-']").first();
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

  test("app promo (softened) is present", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    // Softened, positive app mention — no longer "Continue On The App".
    await expect(page.locator('main').getByText('Also in the free app')).toBeVisible();
  });

  test("player wires autoplay-next on a non-last lesson", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    const nextHref = await page
      .locator("audio[data-lecture-id]")
      .getAttribute("data-next-href");
    expect(nextHref, "first lecture should have a next lesson to autoplay").toBeTruthy();
  });

  test("chapter overview / all parts list is present", async ({ page }) => {
    const href = await getFirstLectureHref(page);
    await page.goto(href);
    // Overview renders links to every lecture in the chapter, so > 2 internal lecture links
    const lectureLinks = page.locator('main a[href*="/lectures/"]');
    expect(await lectureLinks.count()).toBeGreaterThan(2);
  });
});

// ── Chapter complete card ─────────────────────────────────────────────────────
// Regression coverage: the card must only appear once the listener has
// actually finished the audio — not merely because they navigated to the
// last-part URL (see ChapterCompleteCard.astro + chapter-complete.ts).

test.describe("Chapter complete card", () => {
  test("is NOT visible on load on the last-part page with no saved progress", async ({ page }) => {
    const href = await getLastLectureHref(page);
    await page.goto(href);
    await expect(page.locator("[data-chapter-complete-card]")).toBeHidden();
  });

  test("reveals once the audio fires 'ended'", async ({ page }) => {
    // Use the very last lecture of the whole series: it has no nextHref, so
    // autoplay-next.ts doesn't also fire on 'ended' and navigate away —
    // isolates the reveal from that unrelated behavior.
    const href = await getLastLectureOfLastChapterHref(page);
    await page.goto(href);

    const card = page.locator("[data-chapter-complete-card]");
    await expect(card).toBeHidden();

    await page.locator("audio[data-lecture-id]").evaluate((el) => {
      el.dispatchEvent(new Event("ended"));
    });

    await expect(card).toBeVisible();
  });

  test("reveals on a later visit when saved progress already shows this lecture finished", async ({ page }) => {
    const href = await getLastLectureHref(page);
    await page.goto(href);

    const audio = page.locator("audio[data-lecture-id]");
    const lectureId = await audio.getAttribute("data-lecture-id");
    const lecturePath = await audio.getAttribute("data-lecture-path");
    const durationSeconds = Number(await audio.getAttribute("data-duration-seconds"));
    expect(lectureId).toBeTruthy();

    // Simulate a previous session where this exact lecture was finished —
    // mirrors what playback-progress.ts would have persisted on 'ended'.
    await page.evaluate(
      ({ lectureId, lecturePath, durationSeconds }) => {
        localStorage.setItem(
          "tawheed:lastPlayback",
          JSON.stringify({
            lectureId,
            path: lecturePath,
            title: "test",
            seconds: durationSeconds,
            durationSeconds,
            updatedAt: Date.now(),
          })
        );
      },
      { lectureId, lecturePath, durationSeconds }
    );

    await page.reload();
    await expect(page.locator("[data-chapter-complete-card]")).toBeVisible();
  });

  test("stays hidden on a later visit when saved progress is for a different lecture", async ({ page }) => {
    const href = await getLastLectureHref(page);
    await page.goto(href);

    await page.evaluate(() => {
      localStorage.setItem(
        "tawheed:lastPlayback",
        JSON.stringify({
          lectureId: "some-other-lecture",
          path: "/lectures/class-01/part-01/",
          title: "test",
          seconds: 999,
          durationSeconds: 1000,
          updatedAt: Date.now(),
        })
      );
    });

    await page.reload();
    await expect(page.locator("[data-chapter-complete-card]")).toBeHidden();
  });
});

// ── About page ────────────────────────────────────────────────────────────────

test.describe("About page", () => {
  test("Kitab at-Tawheed section is present", async ({ page }) => {
    await page.goto("/about/");
    // Scope to main headings — header logo also contains this text (hidden on desktop)
    await expect(page.locator('main h2').filter({ hasText: 'Kitab at-Tawheed' }).first()).toBeVisible();
  });

  test("both series sections are present", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('main h2').filter({ hasText: 'Urdu Series' }).first()).toBeVisible();
    await expect(page.locator('main h2').filter({ hasText: 'Arabic Series' }).first()).toBeVisible();
  });

  test("App section is present", async ({ page }) => {
    await page.goto("/about/");
    // Scope to main headings — "Get the app" CTA text elsewhere on the page
    // is a case-insensitive substring match for "The App" too.
    await expect(
      page.locator('main h2').filter({ hasText: /The App|ایپ/ }).first()
    ).toBeVisible();
  });

  test("contact email link is present", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  });

  test("Also by Al Marfa section links to Al Quran", async ({ page }) => {
    await page.goto("/about/");
    await expect(
      page.locator('main h2').filter({ hasText: 'Also by Al Marfa' })
    ).toBeVisible();
    await expect(
      page.locator('main a[href="https://alquranreader.com"]')
    ).toBeVisible();
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
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "Why Use The App?" }),
    });
    await expect(
      section.getByText("Two Complete Series", { exact: true })
    ).toBeVisible();
    await expect(
      section.getByText("Offline Downloads", { exact: true })
    ).toBeVisible();
    await expect(section.getByText("Study Mode", { exact: true })).toBeVisible();
    await expect(
      section.getByText("Arabic & Urdu Books", { exact: true })
    ).toBeVisible();
    await expect(
      section.getByText("Progress Tracking", { exact: true })
    ).toBeVisible();
    await expect(
      section.getByText("Background Playback", { exact: true })
    ).toBeVisible();
    await expect(section.locator(":scope > .grid > div")).toHaveCount(6);
  });

  test("what's new shows a single latest card (Arabic series)", async ({ page }) => {
    await page.goto("/download/");
    const section = page.locator("section[aria-labelledby='whats-new-heading']");
    await expect(section.getByRole("heading", { name: "What's New" })).toBeVisible();
    await expect(section.getByText("Latest")).toBeVisible();
    await expect(section.getByText("v2.3.0")).toBeVisible();
    await expect(section.getByText("New Arabic series")).toBeVisible();
    // Only the single latest card is shown — older versions are not listed.
    await expect(section.getByText("v2.2.0")).toHaveCount(0);
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

// ── Kitab at-Tawheed page ─────────────────────────────────────────────────────

test.describe("Kitab at-Tawheed page", () => {
  test("page heading is visible", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("free sharah section with lecture links is present", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    // Scope to main — header/footer also contain /lectures/ links
    await expect(page.locator('main a[href="/lectures/urdu/"]').first()).toBeVisible();
  });

  test("distinguishes the original text from its explanations and cites a source", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    await expect(page.getByRole("heading", { name: "The book and its explanation are different" })).toBeVisible();
    await expect(page.locator('main a[href="/arabic/book/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/study-notes/class-01-part-01/"]')).toBeVisible();
    await expect(page.locator('main a[href="https://islamhouse.com/en/books/1898/"]')).toHaveAttribute("rel", "noopener");
  });

  test("FAQ section is present", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    expect(await page.locator("details").count()).toBeGreaterThan(0);
  });
});

test.describe("Class 01, Part 01 study note", () => {
  test("is indexable content with links to the lesson, source text, and next part", async ({ page }) => {
    await page.goto("/study-notes/class-01-part-01/");
    await expect(page.locator("h1")).toContainText("How to Start Studying Kitab at-Tawheed");
    await expect(page.locator('main a[href="/lectures/class-01/part-01/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/arabic/book/ch-00/"]')).toBeVisible();
    await expect(page.locator('main a[href="/lectures/class-01/part-02/"]')).toBeVisible();
  });

  test("is linked prominently from its lecture page", async ({ page }) => {
    await page.goto("/lectures/class-01/part-01/");
    await expect(page.locator('main a[href="/study-notes/class-01-part-01/"]')).toBeVisible();
  });
});

test.describe("Opening chapter guide", () => {
  test("is source-based and connects the Arabic, Urdu, and audio study paths", async ({ page }) => {
    await page.goto("/guides/allahs-right-over-his-servants/");
    await expect(page.locator("h1")).toContainText("What Is Allah’s Right Upon His Servants?");
    await expect(page.locator('main a[href="/arabic/book/ch-00/"]')).toBeVisible();
    await expect(page.locator('main a[href="/urdu/book/ch-00/"]')).toBeVisible();
    await expect(page.locator('main a[href="/study-notes/class-01-part-01/"]')).toBeVisible();
  });

  test("is linked from the canonical Kitab guide", async ({ page }) => {
    await page.goto("/kitab-al-tawheed/");
    await expect(page.locator('main a[href="/guides/allahs-right-over-his-servants/"]')).toBeVisible();
  });
});

test.describe("Study Guides hub", () => {
  test("lists the available source-based guides", async ({ page }) => {
    await page.goto("/study-notes/");
    await expect(page.locator("h1")).toContainText("Study Guides for Kitab at-Tawheed");
    await expect(page.locator('main a[href="/study-notes/class-01-part-01/"]')).toBeVisible();
    await expect(page.locator('main a[href="/guides/allahs-right-over-his-servants/"]')).toBeVisible();
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

  test("Al Quran cross-promo links to alquranreader.com", async ({ page }) => {
    await page.goto("/ur/");
    await expect(
      page.locator('main a[href="https://alquranreader.com"]').first()
    ).toBeVisible();
  });
});

test.describe("Urdu About page", () => {
  test("h1 is visible", async ({ page }) => {
    await page.goto("/ur/about/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("has Urdu series section", async ({ page }) => {
    await page.goto("/ur/about/");
    await expect(page.locator('text=اردو سلسلہ').first()).toBeVisible();
  });
});
