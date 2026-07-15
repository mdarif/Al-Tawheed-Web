/**
 * Build-time feature flags.
 *
 * The site is statically built, so these are compile-time constants — flipping
 * one needs a rebuild/deploy, not a runtime toggle. (The `feature-flags.json`
 * on the content CDN is the mobile app's mechanism; the web doesn't read it,
 * and wouldn't gain runtime toggling from it since the CDN is only fetched at
 * build time.)
 */

/**
 * Browser-voice Urdu narration ("سنیں") on the book reader.
 *
 * OFF. The 2026-07-15 pilot on ch-00 worked end-to-end on Android Chrome, but
 * the Google Urdu TTS voice mispronounces enough of the text that it isn't good
 * enough for a religious text. Reach is also poor by nature: macOS, iOS and
 * desktop Chrome ship no Urdu voice at all, so the control simply never appears
 * there.
 *
 * The implementation and its tests are kept intact for a future pass. Set this
 * to `true` to bring it back (tests in tests/narration.spec.ts re-arm
 * automatically). The likely real fix is swapping the engine behind
 * `NarrationEngine` for pre-generated audio rather than a browser voice —
 * see BACKLOG.md.
 */
export const NARRATION_ENABLED = false;
