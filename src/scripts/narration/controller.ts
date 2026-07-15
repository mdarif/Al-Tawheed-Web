import { extractChunks, narrationRoots } from './extract';
import type { NarrationChunk, NarrationEngine } from './types';
import { WebSpeechEngine } from './webspeech';

/**
 * Narration controller: owns playback state, drives the highlight, and wires
 * the engine to the reader's controls.
 *
 * The control ships hidden and is only revealed once an Urdu voice is
 * confirmed — on a device without one (common on desktop Chrome, macOS, iOS)
 * the page looks exactly as it did before, and a note points at the real
 * human-recorded audio lectures instead.
 */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

const RATE_KEY = 'tawheed:narrationRate';
const ACTIVE_CLASS = 'narrating';

type State = 'idle' | 'playing' | 'paused';

interface Controls {
  root: HTMLElement;
  playBtn: HTMLButtonElement;
  stopBtn: HTMLButtonElement;
  /** Visible button text — swaps between "listen" and "pause". */
  playLabel: HTMLElement | null;
  speed: HTMLSelectElement | null;
  status: HTMLElement | null;
  fallback: HTMLElement | null;
}

function readRate(): Speed {
  const saved = Number(localStorage.getItem(RATE_KEY));
  return SPEEDS.includes(saved as Speed) ? (saved as Speed) : 1;
}

export class NarrationController {
  private chunks: NarrationChunk[] = [];
  private index = 0;
  private state: State = 'idle';
  private rate: Speed = 1;
  private active: HTMLElement | null = null;

  constructor(
    private readonly engine: NarrationEngine,
    private readonly ui: Controls,
    private readonly labels: { play: string; pause: string; playing: string; paused: string; done: string },
  ) {}

  async init(article: ParentNode): Promise<void> {
    this.chunks = extractChunks(narrationRoots(article));
    if (this.chunks.length === 0) return;

    // The quality gate: no Urdu voice → leave the control hidden for good.
    if (!(await this.engine.isAvailable())) {
      this.ui.fallback?.removeAttribute('hidden');
      return;
    }

    this.rate = readRate();
    if (this.ui.speed) {
      this.ui.speed.value = String(this.rate);
      this.ui.speed.addEventListener('change', () => {
        const next = Number(this.ui.speed?.value);
        if (!SPEEDS.includes(next as Speed)) return;
        this.rate = next as Speed;
        localStorage.setItem(RATE_KEY, String(next));
        // Rate only applies to new utterances; restart the current chunk.
        if (this.state === 'playing') {
          this.engine.cancel();
          void this.run();
        }
      });
    }

    this.ui.playBtn.addEventListener('click', () => this.toggle());
    this.ui.stopBtn.addEventListener('click', () => this.stop());
    // Utterances outlive the document without this.
    window.addEventListener('pagehide', () => this.engine.cancel());

    this.ui.root.removeAttribute('hidden');
  }

  private toggle(): void {
    if (this.state === 'playing') {
      this.engine.pause();
      this.setState('paused');
      return;
    }
    if (this.state === 'paused') {
      this.engine.resume();
      this.setState('playing');
      return;
    }
    this.setState('playing');
    void this.run();
  }

  private stop(): void {
    this.engine.cancel();
    this.index = 0;
    this.highlight(null);
    this.setState('idle');
  }

  /** Speak from `index` to the end, unless paused/stopped along the way. */
  private async run(): Promise<void> {
    while (this.index < this.chunks.length && this.state === 'playing') {
      const chunk = this.chunks[this.index];
      this.highlight(chunk.el);
      try {
        await this.engine.speak(chunk, this.rate);
      } catch {
        return; // cancelled — stop()/rate-change owns the state from here
      }
      if (this.state !== 'playing') return;
      this.index++;
    }
    if (this.state === 'playing') {
      // Reached the end of the chapter.
      this.index = 0;
      this.highlight(null);
      this.setState('idle');
      this.announce(this.labels.done);
    }
  }

  private highlight(el: HTMLElement | null): void {
    this.active?.classList.remove(ACTIVE_CLASS);
    this.active = el;
    if (!el) return;
    el.classList.add(ACTIVE_CLASS);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }

  private setState(state: State): void {
    this.state = state;
    const playing = state === 'playing';
    this.ui.playBtn.setAttribute('aria-pressed', String(playing));
    const label = playing ? this.labels.pause : this.labels.play;
    this.ui.playBtn.setAttribute('aria-label', label);
    this.ui.playBtn.setAttribute('title', label);
    // Swap the visible text too — a button reading "Listen" while it is in fact
    // pausing is a lie to sighted users.
    if (this.ui.playLabel) this.ui.playLabel.textContent = label;
    this.ui.playBtn.dataset.state = state;
    this.ui.stopBtn.disabled = state === 'idle';
    if (state !== 'idle') this.announce(playing ? this.labels.playing : this.labels.paused);
  }

  private announce(msg: string): void {
    if (this.ui.status) this.ui.status.textContent = msg;
  }
}

/** Wire up narration for the current chapter page. No-op if markup is absent. */
export function initNarration(article: ParentNode = document): void {
  const root = document.querySelector<HTMLElement>('[data-narration]');
  const playBtn = document.querySelector<HTMLButtonElement>('[data-narration-play]');
  const stopBtn = document.querySelector<HTMLButtonElement>('[data-narration-stop]');
  if (!root || !playBtn || !stopBtn) return;

  const controller = new NarrationController(
    new WebSpeechEngine(),
    {
      root,
      playBtn,
      stopBtn,
      playLabel: playBtn.querySelector<HTMLElement>('[data-narration-label]'),
      speed: document.querySelector<HTMLSelectElement>('[data-narration-speed]'),
      status: document.querySelector<HTMLElement>('[data-narration-status]'),
      fallback: document.querySelector<HTMLElement>('[data-narration-fallback]'),
    },
    {
      play: root.dataset.labelPlay ?? 'Play',
      pause: root.dataset.labelPause ?? 'Pause',
      playing: root.dataset.labelPlaying ?? '',
      paused: root.dataset.labelPaused ?? '',
      done: root.dataset.labelDone ?? '',
    },
  );

  void controller.init(article);
}
