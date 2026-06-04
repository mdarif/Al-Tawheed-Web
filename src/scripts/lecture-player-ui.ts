const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const PROD_NUDGE_SECONDS = 5 * 60;
const DEV_NUDGE_SECONDS = 30;
const NUDGE_DISMISSED_PREFIX = 'tawheed:nudgeDismissed:';
/** @deprecated Replaced by per-lecture keys; cleared on init. */
const LEGACY_NUDGE_DISMISSED_KEY = 'tawheed:nudgeDismissed';
/** Gaps larger than this are seeks — do not count toward listen time. */
const SEEK_JUMP_SECONDS = 15;

function nudgeThresholdSeconds(): number {
  return import.meta.env.DEV ? DEV_NUDGE_SECONDS : PROD_NUDGE_SECONDS;
}

function dismissStorageKey(lectureId: string): string {
  return `${NUDGE_DISMISSED_PREFIX}${lectureId}`;
}

function isNudgeDismissedPersisted(lectureId: string): boolean {
  return sessionStorage.getItem(dismissStorageKey(lectureId)) === '1';
}

export function initLecturePlayerUi(
  audio: HTMLAudioElement,
  playStoreUrl: string,
  lectureId: string,
): void {
  sessionStorage.removeItem(LEGACY_NUDGE_DISMISSED_KEY);

  const root = audio.closest('[data-lecture-player]');
  if (!root) return;

  const speedSelect = root.querySelector<HTMLSelectElement>('[data-playback-speed]');
  const nudge = root.querySelector<HTMLElement>('[data-listen-nudge]');
  const nudgeDismiss = root.querySelector<HTMLButtonElement>('[data-nudge-dismiss]');
  const nudgeLink = root.querySelector<HTMLAnchorElement>('[data-nudge-app]');

  if (nudgeLink) nudgeLink.href = playStoreUrl;

  const savedRate = Number(localStorage.getItem('tawheed:playbackRate'));
  if (SPEEDS.includes(savedRate as (typeof SPEEDS)[number])) {
    audio.playbackRate = savedRate;
  }
  if (speedSelect) {
    speedSelect.value = String(audio.playbackRate);
    speedSelect.addEventListener('change', () => {
      const rate = Number(speedSelect.value);
      audio.playbackRate = rate;
      localStorage.setItem('tawheed:playbackRate', String(rate));
    });
  }

  if (!nudge) return;

  /** In-memory for this page load; dev does not write sessionStorage on dismiss. */
  let dismissedThisVisit = import.meta.env.DEV
    ? false
    : isNudgeDismissedPersisted(lectureId);

  const isDismissed = () =>
    dismissedThisVisit || (!import.meta.env.DEV && isNudgeDismissedPersisted(lectureId));

  if (isDismissed()) {
    nudge.classList.add('hidden');
    if (!import.meta.env.DEV) return;
  }

  const threshold = nudgeThresholdSeconds();
  let listenedSeconds = 0;
  let lastMediaTime = -1;

  const showNudge = () => {
    if (isDismissed()) return;
    if (!nudge.classList.contains('hidden')) return;
    nudge.classList.remove('hidden');
  };

  const addListenTime = (delta: number) => {
    if (isDismissed()) return;
    if (delta <= 0 || delta >= SEEK_JUMP_SECONDS) return;
    listenedSeconds += delta;
    if (listenedSeconds >= threshold) showNudge();
  };

  nudgeDismiss?.addEventListener('click', () => {
    dismissedThisVisit = true;
    nudge.classList.add('hidden');
    if (!import.meta.env.DEV) {
      sessionStorage.setItem(dismissStorageKey(lectureId), '1');
    }
  });

  const anchorMediaTime = () => {
    lastMediaTime = audio.currentTime;
  };

  audio.addEventListener('play', anchorMediaTime);
  audio.addEventListener('seeking', anchorMediaTime);
  audio.addEventListener('seeked', anchorMediaTime);

  audio.addEventListener('timeupdate', () => {
    if (audio.paused || isDismissed()) return;
    const now = audio.currentTime;
    if (lastMediaTime >= 0) {
      addListenTime(now - lastMediaTime);
    }
    lastMediaTime = now;
  });

  audio.addEventListener('pause', () => {
    lastMediaTime = -1;
  });
}
