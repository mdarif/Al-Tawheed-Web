export interface PlaybackProgress {
  lectureId: string;
  path: string;
  title: string;
  seconds: number;
  durationSeconds: number;
  updatedAt: number;
}

const STORAGE_KEY = 'tawheed:lastPlayback';
const SAVE_INTERVAL_MS = 5000;
const RESUME_MIN_SECONDS = 5;
const RESUME_MAX_FRACTION = 0.95;

export function loadProgress(): PlaybackProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PlaybackProgress;
    if (!data?.lectureId || !data.path || typeof data.seconds !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProgress(data: PlaybackProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function resumeTargetSeconds(
  saved: PlaybackProgress,
  lectureId: string,
  durationSeconds: number,
): number | null {
  if (saved.lectureId !== lectureId) return null;
  if (!durationSeconds || saved.seconds < RESUME_MIN_SECONDS) return null;
  if (saved.seconds >= durationSeconds * RESUME_MAX_FRACTION) return null;
  return saved.seconds;
}

/** `?t=125` on lecture URLs — used by Continue Listening (Chrome-friendly). */
function resumeSecondsFromUrl(): number | null {
  const raw = new URLSearchParams(window.location.search).get('t');
  if (!raw) return null;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < RESUME_MIN_SECONDS) return null;
  return Math.floor(seconds);
}

function clampSeek(seconds: number, durationSeconds: number): number | null {
  if (!durationSeconds || seconds < RESUME_MIN_SECONDS) return null;
  if (seconds >= durationSeconds * RESUME_MAX_FRACTION) return null;
  return seconds;
}

export function initLecturePlayer(audio: HTMLAudioElement): void {
  const lectureId = audio.dataset.lectureId;
  const path = audio.dataset.lecturePath;
  const title = audio.dataset.lectureTitle;
  const catalogDuration = Number(audio.dataset.durationSeconds ?? 0);
  if (!lectureId || !path || !title) return;

  let lastSaveAt = 0;
  let canPersist = false;
  let resumeApplied = false;

  const persist = (seconds: number) => {
    if (!canPersist && seconds < RESUME_MIN_SECONDS) return;
    saveProgress({
      lectureId,
      path,
      title,
      seconds,
      durationSeconds: catalogDuration || Math.floor(audio.duration) || 0,
      updatedAt: Date.now(),
    });
  };

  const tryResume = () => {
    if (resumeApplied) return;
    const dur = audio.duration || catalogDuration;
    const fromUrl = resumeSecondsFromUrl();
    const saved = loadProgress();
    const fromStorage =
      saved && saved.lectureId === lectureId
        ? resumeTargetSeconds(saved, lectureId, dur)
        : null;
    const seekTo = clampSeek(fromUrl ?? fromStorage ?? 0, dur);
    if (seekTo == null) {
      canPersist = true;
      return;
    }
    audio.currentTime = seekTo;
    resumeApplied = true;
    canPersist = true;
  };

  for (const event of ['loadedmetadata', 'durationchange', 'canplay'] as const) {
    audio.addEventListener(event, tryResume);
  }

  // Metadata may load before this script runs (Continue Listening navigation).
  if (audio.readyState >= 1) tryResume();

  audio.addEventListener('play', () => {
    canPersist = true;
    if (!resumeApplied) tryResume();
  });

  audio.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastSaveAt < SAVE_INTERVAL_MS) return;
    lastSaveAt = now;
    persist(audio.currentTime);
  });

  for (const event of ['pause', 'ended'] as const) {
    audio.addEventListener(event, () => persist(audio.currentTime));
  }
}

export function initContinueListening(rootId: string): void {
  const root = document.getElementById(rootId);
  if (!root) return;

  const card = root.querySelector<HTMLElement>('[data-continue-card]');
  if (!card) return;

  const saved = loadProgress();
  if (!saved || saved.seconds < RESUME_MIN_SECONDS) return; // section stays hidden

  const dur = saved.durationSeconds || 1;
  const fraction = Math.min(1, saved.seconds / dur);
  const remaining = Math.max(0, dur - saved.seconds);

  const link = card.querySelector<HTMLAnchorElement>('[data-continue-link]');
  const titleEl = card.querySelector('[data-continue-title]');
  const metaEl = card.querySelector('[data-continue-meta]');
  const barEl = card.querySelector<HTMLDivElement>('[data-continue-bar]');
  const pctEl = card.querySelector('[data-continue-pct]');

  if (link) {
    const seconds = Math.floor(saved.seconds);
    const url = new URL(saved.path, window.location.origin);
    url.searchParams.set('t', String(seconds));
    link.href = url.pathname + url.search;
  }
  if (titleEl) titleEl.textContent = saved.title;
  if (metaEl) {
    metaEl.textContent = `${formatClock(saved.seconds)} listened · ${formatClock(remaining)} left`;
  }
  if (barEl) barEl.style.width = `${Math.round(fraction * 100)}%`;
  if (pctEl) pctEl.textContent = `${Math.round(fraction * 100)}% complete`;

  root.classList.remove('hidden');
}
