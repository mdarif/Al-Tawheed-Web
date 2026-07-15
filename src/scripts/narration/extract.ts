import type { NarrationChunk } from './types';

/**
 * Build the narration list from the rendered chapter.
 *
 * Extraction is done on the DOM rather than the source JSON because
 * `bookInlineHtml()` already tags exactly the seams we need:
 *   .ayah    — Arabic Qur'anic verse   → never spoken
 *   .hadith  — in THIS edition the «…» spans are the Urdu rendering of the
 *              narration, not Arabic (verified: all 13 carry Urdu-only letters,
 *              and the page CSS keeps them in Nastaliq for that reason). They
 *              are the sentence — stripping them guts the meaning → spoken.
 *   .citation— e.g. [الذَّارِيَات: 56] → spoken (an Urdu reader says these
 *              natively, and they carry the reference)
 *
 * Dropping the Arabic reads naturally, because the book already places each
 * āyah's Urdu translation in the next block:
 *   "ارشادِ باری تعالیٰ ہے:"  →  "اور میں نے جن و انس کو…"
 * What it leaves behind is punctuation debris (a stranded "." where the āyah
 * was), which `tidy()` cleans up.
 */

/** Arabic scripture — the only thing stripped, so TTS never mispronounces it. */
const SKIP_SELECTOR = '.ayah';

/** Anything left worth speaking, or is it just punctuation/whitespace? */
const SPEAKABLE = /[\p{L}\p{N}]/u;

/**
 * Repair the seam left by a removed āyah.
 *
 * "ارشادِ باری تعالیٰ ہے:  ." → "ارشادِ باری تعالیٰ ہے:"
 * (85 of the book's 466 blocks end in this dangling colon.)
 */
export function tidy(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    // Stranded terminator where the Arabic used to be: ": ." → ":"
    .replace(/([:：])\s*[۔.](?=\s|$)/g, '$1')
    // Collapse punctuation left adjacent by the removal.
    .replace(/\s+([۔،.,:؛])/g, '$1')
    .replace(/([۔،.,:؛])\1+/g, '$1')
    .trim()
    // A block that now ends on a bare colon reads better without it.
    .replace(/[:：]$/, '');
}

/** The Urdu prose of one element, with Arabic scripture removed. */
export function chunkText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  // Swap for a space, don't remove: removing would weld the text on either
  // side of an inline āyah into one word.
  clone.querySelectorAll(SKIP_SELECTOR).forEach((n) => n.replaceWith(' '));
  return tidy(clone.textContent ?? '');
}

/**
 * Ordered narration chunks for a chapter.
 *
 * `roots` is an explicit ordered list because a chapter's narratable text spans
 * more than one container: the <h1> title, the matn paragraphs, then the
 * masāʾil — which live outside `.book-matn`.
 */
export function extractChunks(roots: Iterable<Element>): NarrationChunk[] {
  const chunks: NarrationChunk[] = [];
  for (const el of roots) {
    if (!(el instanceof HTMLElement)) continue;
    const text = chunkText(el);
    // Skip āyah-only blocks, which are empty once the Arabic is removed.
    if (!SPEAKABLE.test(text)) continue;
    chunks.push({ el, text });
  }
  return chunks;
}

/**
 * The elements to narrate, in reading order: title → matn → masāʾil.
 * No per-paragraph ids exist in the markup, so DOM order *is* the index.
 */
export function narrationRoots(article: ParentNode): Element[] {
  const sel = [
    'h1',
    '.book-matn > p',
    '.masail-section .masail-title',
    '.masail-body > p',
  ].join(', ');
  return Array.from(article.querySelectorAll(sel));
}
