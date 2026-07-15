import type { NarrationChunk, NarrationEngine } from './types';
import { resolveUrduVoice } from './voices';

/**
 * Browser TTS engine (Web Speech API). No audio files, no backend.
 *
 * Two quirks are handled here:
 *  • Chrome truncates long utterances (~15s, worst for remote voices), so each
 *    chunk is split into short utterances at Urdu sentence boundaries.
 *  • `onend` also fires on `cancel()`, which would otherwise advance the queue.
 *    A generation counter invalidates callbacks from a cancelled run.
 */

/** Chrome starts dropping audio well before this; split below it. */
const MAX_UTTERANCE_CHARS = 200;

/** Urdu full stop (۔), question mark (؟), plus Latin/Arabic fallbacks. */
const SENTENCE_END = /(?<=[۔؟!?])\s+/;

/**
 * Split text into utterance-sized pieces at sentence boundaries. A single
 * sentence longer than the cap is split on whitespace as a last resort, since
 * an over-long utterance is worse (silent truncation) than an awkward break.
 */
export function splitForUtterance(text: string, max = MAX_UTTERANCE_CHARS): string[] {
  const out: string[] = [];
  let buf = '';

  const flush = (): void => {
    const t = buf.trim();
    if (t) out.push(t);
    buf = '';
  };

  for (const sentence of text.split(SENTENCE_END)) {
    if (sentence.length > max) {
      flush();
      let long = sentence;
      while (long.length > max) {
        // Break at the last space before the cap; hard-cut if there is none.
        const cut = long.lastIndexOf(' ', max);
        const at = cut > 0 ? cut : max;
        out.push(long.slice(0, at).trim());
        long = long.slice(at).trim();
      }
      buf = long;
      continue;
    }
    if (buf && (buf + ' ' + sentence).length > max) flush();
    buf = buf ? `${buf} ${sentence}` : sentence;
  }
  flush();
  return out;
}

export class WebSpeechEngine implements NarrationEngine {
  private voice: SpeechSynthesisVoice | null = null;
  /** Bumped by cancel(); stale callbacks compare against it and bail. */
  private generation = 0;

  async isAvailable(): Promise<boolean> {
    if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }
    this.voice = await resolveUrduVoice();
    return this.voice !== null;
  }

  /** The chosen voice's display name — for debugging/telemetry, not UI copy. */
  get voiceName(): string | null {
    return this.voice?.name ?? null;
  }

  speak(chunk: NarrationChunk, rate: number): Promise<void> {
    const generation = this.generation;
    const parts = splitForUtterance(chunk.text);
    if (parts.length === 0) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      let i = 0;

      const next = (): void => {
        // Cancelled (or superseded) while we were speaking — stop silently.
        if (generation !== this.generation) {
          reject(new Error('cancelled'));
          return;
        }
        if (i >= parts.length) {
          resolve();
          return;
        }

        const u = new SpeechSynthesisUtterance(parts[i++]);
        if (this.voice) {
          u.voice = this.voice;
          u.lang = this.voice.lang;
        }
        u.rate = rate;
        u.onend = next;
        // Don't strand the queue on a single bad utterance; move on.
        u.onerror = next;
        speechSynthesis.speak(u);
      };

      next();
    });
  }

  pause(): void {
    speechSynthesis.pause();
  }

  resume(): void {
    speechSynthesis.resume();
  }

  cancel(): void {
    this.generation++;
    speechSynthesis.cancel();
  }
}
