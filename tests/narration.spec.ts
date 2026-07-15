import { test, expect, type Page } from "@playwright/test";
import { NARRATION_ENABLED } from "../src/lib/flags";

// Browser-voice narration on the Urdu reader. Headless Chromium ships no Urdu
// voice, so the real engine can never run here — every test either exercises the
// no-voice path (the most important behaviour) or installs a fake
// speechSynthesis. Assertions are structural, per this suite's house style.
//
// The feature is currently OFF (src/lib/flags.ts). While it's off, the only
// live test is that it's genuinely absent; the behavioural tests below re-arm
// on their own the moment NARRATION_ENABLED flips back to true.

const CHAPTER = "/urdu/book/ch-00/"; // the narration pilot chapter

/** Behavioural specs only make sense when the feature is built in. */
const whenEnabled = NARRATION_ENABLED ? test.describe : test.describe.skip;

interface FakeVoice {
  name: string;
  lang: string;
  localService?: boolean;
}

/** Install a fake speechSynthesis exposing window.__speech for assertions. */
async function installFakeSpeech(page: Page, voices: FakeVoice[]): Promise<void> {
  await page.addInitScript((voiceDefs: FakeVoice[]) => {
    const spoken: string[] = [];
    const state = { spoken, cancels: 0, voiceURI: null as string | null };
    (window as unknown as { __speech: typeof state }).__speech = state;

    const voices = voiceDefs.map((v) => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService ?? false,
      default: false,
      voiceURI: v.name,
    }));

    class FakeUtterance {
      text: string;
      voice: unknown = null;
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    const synth = {
      getVoices: () => voices,
      speak(u: FakeUtterance) {
        spoken.push(u.text);
        const v = u.voice as { voiceURI?: string } | null;
        if (v?.voiceURI) state.voiceURI = v.voiceURI;
        // Resolve async so the controller's await actually yields.
        setTimeout(() => u.onend?.(), 5);
      },
      cancel() {
        state.cancels++;
      },
      pause() {},
      resume() {},
      addEventListener() {},
      removeEventListener() {},
    };

    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
      configurable: true,
    });
  }, voices);
}

const readSpoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __speech: { spoken: string[] } }).__speech.spoken);

test.describe("Narration — feature flag", () => {
  test("stays out of the build entirely while the flag is off", async ({ page }) => {
    test.skip(NARRATION_ENABLED, "flag is on — the behavioural specs cover it");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(CHAPTER);
    // Not merely hidden — absent. No control, no fallback note, no stray text.
    await expect(page.locator("[data-narration]")).toHaveCount(0);
    await expect(page.locator("[data-narration-fallback]")).toHaveCount(0);
    // The reader itself is untouched by the flag.
    await expect(page.locator(".book-matn")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

whenEnabled("Narration — degradation (no Urdu voice)", () => {
  test("real headless Chromium: control stays hidden, page still fine", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(CHAPTER);
    // No Urdu voice here → the control must never appear. Never narrate Urdu
    // with a wrong-language voice.
    await expect(page.locator("[data-narration]")).toBeHidden();
    await expect(page.locator(".book-matn")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("English-only voices still refuse to narrate, and signpost the lectures", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Google US English", lang: "en-US" }]);
    await page.goto(CHAPTER);
    await expect(page.locator("[data-narration]")).toBeHidden();
    const fallback = page.locator("[data-narration-fallback]");
    await expect(fallback).toBeVisible();
    await expect(fallback.locator("a[href='/lectures/urdu/']")).toBeVisible();
  });
});

whenEnabled("Narration — with an Urdu voice", () => {
  test("control appears and reads the chapter aloud", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);

    const control = page.locator("[data-narration]");
    await expect(control).toBeVisible();
    await expect(page.locator("[data-narration-fallback]")).toBeHidden();

    await page.locator("[data-narration-play]").click();
    await expect.poll(async () => (await readSpoken(page)).length).toBeGreaterThan(3);
  });

  test("prefers the male voice over a female one", async ({ page }) => {
    await installFakeSpeech(page, [
      { name: "Microsoft Uzma Online (Natural)", lang: "ur-PK" },
      { name: "Microsoft Asad Online (Natural)", lang: "ur-PK" },
    ]);
    await page.goto(CHAPTER);
    await page.locator("[data-narration-play]").click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __speech: { voiceURI: string | null } }).__speech.voiceURI,
        ),
      )
      .toContain("Asad");
  });

  test("never speaks the Arabic āyāt, but does speak the Urdu hadith", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);
    await page.locator("[data-narration-play]").click();

    // Read the whole chapter before judging — the hadith blocks sit well past
    // the opening āyāt. The status region announces completion.
    await expect(page.locator("[data-narration-status]")).toHaveText("باب مکمل ہوا", {
      timeout: 30_000,
    });

    const said = (await readSpoken(page)).join(" ");
    // Āyāt render as ﴿…﴾ — stripped, so scripture is never mispronounced.
    expect(said).not.toContain("﴿");
    expect(said).not.toContain("﴾");
    // The «…» spans are Urdu in this edition (not Arabic) — they ARE the
    // sentence, so they must be read.
    expect(said).toContain("«");
  });

  test("button label and icon reflect the real state, not always 'listen'", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);
    const play = page.locator("[data-narration-play]");
    const label = page.locator("[data-narration-label]");
    await expect(label).toHaveText("سنیں");

    await play.click();
    await expect(label).toHaveText("روکیں"); // now it pauses — say so
    await expect(play).toHaveAttribute("data-state", "playing");
    await expect(play).toHaveAttribute("aria-pressed", "true");

    await play.click();
    await expect(label).toHaveText("سنیں");
    await expect(play).toHaveAttribute("data-state", "paused");
  });

  test("highlights exactly one block while reading, none after stop", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);
    await page.locator("[data-narration-play]").click();
    await expect.poll(() => page.locator(".narrating").count()).toBe(1);

    await page.locator("[data-narration-stop]").click();
    await expect.poll(() => page.locator(".narrating").count()).toBe(0);
  });

  test("chunks stay short enough to dodge Chrome's utterance cutoff", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);
    await page.locator("[data-narration-play]").click();
    await expect.poll(async () => (await readSpoken(page)).length).toBeGreaterThan(5);
    for (const t of await readSpoken(page)) expect(t.length).toBeLessThanOrEqual(200);
  });

  test("speed choice persists under its own key, not the lecture player's", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);
    await page.goto(CHAPTER);
    await page.locator("[data-narration-speed]").selectOption("1.25");
    expect(await page.evaluate(() => localStorage.getItem("tawheed:narrationRate"))).toBe("1.25");
    // Must not clobber the lecture player's global slot.
    expect(await page.evaluate(() => localStorage.getItem("tawheed:lastPlayback"))).toBeNull();
  });
});

whenEnabled("Narration — pilot scope", () => {
  test("ships on the pilot chapter only, not the rest of the book", async ({ page }) => {
    await installFakeSpeech(page, [{ name: "Microsoft Asad Online (Natural)", lang: "ur-PK" }]);

    await page.goto(CHAPTER);
    await expect(page.locator("[data-narration]")).toBeVisible();

    // Widen NARRATION_PILOT_IDS in [chapterSlug].astro to roll out; this guards
    // the pilot staying scoped until then.
    await page.goto("/urdu/book/ch-01/");
    await expect(page.locator("[data-narration]")).toHaveCount(0);
  });

  test("control is kept out of the search index", async ({ page }) => {
    await page.goto(CHAPTER);
    // The <article> is a pagefind body; the control must not pollute it.
    await expect(
      page.locator("[data-pagefind-ignore] [data-narration]"),
    ).toHaveCount(1);
  });
});
