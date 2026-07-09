/**
 * PWA / offline support — service worker registration, offline fallback page,
 * and shell-page caching.
 */
import { test, expect } from "@playwright/test";

test("/sw.js is served with a JS content-type", async ({ request }) => {
  const res = await request.get("/sw.js");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"] ?? "").toMatch(/javascript/);
});

test("/offline/ renders visible content", async ({ page }) => {
  const res = await page.goto("/offline/");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator("h1")).toBeVisible();
});

test("site.webmanifest is valid JSON with the expected icons", async ({ request }) => {
  const res = await request.get("/site.webmanifest");
  expect(res.status()).toBe(200);
  const manifest = await res.json();
  expect(manifest.icons?.length).toBeGreaterThanOrEqual(4);
  expect(manifest.display).toBe("standalone");
});

/** Waits past the brief "activating" window so the worker is fully controlling. */
async function waitForActivation(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const worker = reg.active;
    if (!worker) return undefined;
    if (worker.state === "activated") return worker.state;
    return new Promise((resolve) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve(worker.state);
      });
    });
  });
}

test.describe("Service worker", () => {
  test("registers and reaches the activated state", async ({ page }) => {
    await page.goto("/");
    const state = await waitForActivation(page);
    expect(state).toBe("activated");
  });

  test("a precached hub page stays reachable offline", async ({ page, context }) => {
    // Visit once online so the shell precaches.
    await page.goto("/lectures/");
    await waitForActivation(page);

    await context.setOffline(true);
    const res = await page.goto("/lectures/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
    await context.setOffline(false);
  });

  // Note: a true end-to-end "go offline, navigate to an unvisited page, land
  // on /offline/" test is unreliable here — neither `context.setOffline` nor
  // `context.route` intercepts the `fetch()` a service worker issues from
  // its own worker scope (only page/frame-initiated requests), so the
  // in-SW navigationHandler's fetch always "succeeds" against the local
  // preview server in tests. Instead, verify the precondition its
  // catch-fallback logic depends on: /offline/ is actually in the shell
  // cache after install, with the expected fallback content.
  test("the offline fallback page is precached on install", async ({ page }) => {
    await page.goto("/");
    await waitForActivation(page);
    const cachedText = await page.evaluate(async () => {
      const match = await caches.match("/offline/");
      return match ? await match.text() : null;
    });
    expect(cachedText).toContain("You're offline");
  });
});
