/**
 * Urdu voice discovery.
 *
 * Two hard facts about the Web Speech API shape this module:
 *
 *  1. `getVoices()` is empty on first call in most browsers — the list arrives
 *     later via `voiceschanged`. Some browsers never fire it, so we race the
 *     event against a timeout instead of awaiting it forever.
 *  2. `SpeechSynthesisVoice` has no gender field. A *male* voice can only be
 *     preferred by name, never guaranteed — hence RANKED_NAMES below.
 *
 * If no Urdu voice exists (common on desktop Chrome, macOS and iOS), we return
 * null and the reader hides the control. We never narrate Urdu with a
 * wrong-language voice — that sounds like gibberish and is worse than nothing.
 */

const VOICES_TIMEOUT_MS = 2000;

/**
 * Known male Urdu voice names, best first. Microsoft's "Online (Natural)"
 * voices (exposed by Edge) are the best available; Asad is ur-PK male, Salman
 * is ur-IN male. Matched case-insensitively as substrings, since the full names
 * are decorated ("Microsoft Asad Online (Natural) - Urdu (Pakistan)").
 */
const RANKED_NAMES = ['asad', 'salman'] as const;

/** Is this an Urdu voice? Covers ur, ur-PK, ur-IN, and ur_PK-style tags. */
function isUrdu(voice: SpeechSynthesisVoice): boolean {
  return /^ur\b|^ur[-_]/i.test(voice.lang);
}

/** Resolve the voice list, tolerating browsers that never fire voiceschanged. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      speechSynthesis.removeEventListener('voiceschanged', finish);
      clearTimeout(timer);
      resolve(speechSynthesis.getVoices());
    };

    const timer = setTimeout(finish, VOICES_TIMEOUT_MS);
    speechSynthesis.addEventListener('voiceschanged', finish);
  });
}

/**
 * Pick the best Urdu voice, preferring known male names, then remote voices
 * (Edge's natural voices are remote and markedly better than local ones).
 * Returns null when the device has no Urdu voice at all.
 */
export function pickUrduVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const urdu = voices.filter(isUrdu);
  if (urdu.length === 0) return null;

  const score = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    const nameRank = RANKED_NAMES.findIndex((n) => name.includes(n));
    // Known male name → 0,1; unknown → 2. Remote beats local within a rank.
    return (nameRank === -1 ? RANKED_NAMES.length : nameRank) * 2 + (voice.localService ? 1 : 0);
  };

  return urdu.reduce((best, v) => (score(v) < score(best) ? v : best), urdu[0]);
}

/** The Urdu voice to narrate with, or null if this device can't. */
export async function resolveUrduVoice(): Promise<SpeechSynthesisVoice | null> {
  if (typeof speechSynthesis === 'undefined') return null;
  return pickUrduVoice(await loadVoices());
}
