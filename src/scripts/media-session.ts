/**
 * Lock-screen / OS media controls via the MediaSession API. Metadata + action
 * handlers are bound to the native <audio> element (the browser links the
 * session to whichever media is playing). next/previous navigate to the
 * adjacent lesson carrying `#autoplay` so playback continues on the new page.
 */
const AUTOPLAY_HASH = '#autoplay';

export function initMediaSession(audio: HTMLAudioElement): void {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;

  const title = audio.dataset.lectureTitle ?? '';
  const artist = audio.dataset.speaker ?? '';
  const album = audio.dataset.seriesTitle ?? '';
  const coverRaw = audio.dataset.coverUrl;
  const nextHref = audio.dataset.nextHref;
  const prevHref = audio.dataset.prevHref;

  const setMetadata = () => {
    const artwork = coverRaw
      ? [
          {
            src: new URL(coverRaw, location.origin).href,
            sizes: '512x512',
            type: coverRaw.endsWith('.png') ? 'image/png' : 'image/jpeg',
          },
        ]
      : [];
    ms.metadata = new MediaMetadata({ title, artist, album, artwork });
  };

  setMetadata();
  audio.addEventListener('loadedmetadata', setMetadata);
  audio.addEventListener('play', () => {
    ms.playbackState = 'playing';
  });
  audio.addEventListener('pause', () => {
    ms.playbackState = 'paused';
  });

  const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      ms.setActionHandler(action, handler);
    } catch {
      /* action unsupported in this browser */
    }
  };

  set('play', () => audio.play());
  set('pause', () => audio.pause());
  set('seekbackward', (d) => {
    audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset ?? 10));
  });
  set('seekforward', (d) => {
    const end = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 30;
    audio.currentTime = Math.min(end, audio.currentTime + (d.seekOffset ?? 10));
  });
  set('seekto', (d) => {
    if (typeof d.seekTime === 'number') audio.currentTime = d.seekTime;
  });
  set('nexttrack', nextHref ? () => window.location.assign(nextHref + AUTOPLAY_HASH) : null);
  set('previoustrack', prevHref ? () => window.location.assign(prevHref + AUTOPLAY_HASH) : null);
}
