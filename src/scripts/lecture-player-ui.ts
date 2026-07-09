const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Playback-speed selector, with the chosen rate persisted across lessons
 * (localStorage `tawheed:playbackRate`).
 */
export function initLecturePlayerUi(audio: HTMLAudioElement): void {
  const root = audio.closest('[data-lecture-player]');
  if (!root) return;

  const speedSelect = root.querySelector<HTMLSelectElement>('[data-playback-speed]');

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
}
