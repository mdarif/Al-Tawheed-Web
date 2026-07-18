import { loadProgress, RESUME_MAX_FRACTION } from './playback-progress';

/**
 * Reveals the (server-rendered-but-hidden) ChapterCompleteCard once the
 * listener has actually finished the audio for this lecture — either live
 * (the 'ended' event fires) or on a later visit (saved progress for this
 * lecture already crossed the "finished" threshold).
 */
export function initChapterCompleteCard(audio: HTMLAudioElement, rootId: string): void {
  const root = document.getElementById(rootId);
  if (!root) return;

  const lectureId = audio.dataset.lectureId;
  const durationSeconds = Number(audio.dataset.durationSeconds ?? 0);

  const reveal = () => root.classList.remove('hidden');

  const isFinished = (seconds: number) =>
    durationSeconds > 0 && seconds >= durationSeconds * RESUME_MAX_FRACTION;

  const saved = loadProgress();
  if (lectureId && saved?.lectureId === lectureId && isFinished(saved.seconds)) {
    reveal();
    return;
  }

  audio.addEventListener('ended', reveal);
}
