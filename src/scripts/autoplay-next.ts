/**
 * Autoplay-next: when a lesson's audio ends, navigate to the next lesson and
 * keep playing. Navigation carries a `#autoplay` hash; on the fresh page we
 * attempt `play()`. The hash (not a query param) is used deliberately so it
 * cannot collide with the `?t=SECONDS` resume param read by playback-progress.ts.
 *
 * playback-progress.ts has its own `ended` listener (persists position); the two
 * fire independently. A finished lesson is saved at ~duration, which its own
 * resume logic rejects (>95%), so re-opening it correctly starts at 0.
 */
const AUTOPLAY_HASH = '#autoplay';

export function initAutoplayNext(audio: HTMLAudioElement): void {
  const nextHref = audio.dataset.nextHref;

  if (nextHref) {
    audio.addEventListener('ended', () => {
      window.location.assign(nextHref + AUTOPLAY_HASH);
    });
  }

  if (window.location.hash !== AUTOPLAY_HASH) return;

  // Strip the hash so a manual refresh doesn't re-trigger autoplay.
  history.replaceState(null, '', window.location.pathname + window.location.search);

  const continueBtn = audio
    .closest('[data-lecture-player]')
    ?.querySelector<HTMLButtonElement>('[data-autoplay-continue]');

  const promise = audio.play();
  if (!promise || typeof promise.then !== 'function') return;

  promise
    .then(() => continueBtn?.classList.add('hidden'))
    .catch(() => {
      // Blocked by autoplay policy (no user gesture on this fresh page). Media
      // Engagement usually lets active listeners through; this is the fallback.
      if (!continueBtn) return;
      continueBtn.classList.remove('hidden');
      continueBtn.addEventListener(
        'click',
        () => {
          audio.play().then(() => continueBtn.classList.add('hidden')).catch(() => {});
        },
        { once: true },
      );
    });
}
