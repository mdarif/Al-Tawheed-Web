/**
 * Narration engine contract.
 *
 * The reader UI talks only to this interface, never to `speechSynthesis`
 * directly. Today the only implementation is `WebSpeechEngine` (browser TTS,
 * no audio files). If browser-voice quality proves insufficient, a
 * pre-generated-audio engine (MP3s on the R2 bucket, as the lectures already
 * are) can implement the same interface without touching the controller or the
 * page markup.
 */

/** One narratable unit: the element to highlight, and the text to speak. */
export interface NarrationChunk {
  /** The element highlighted while this chunk is spoken. */
  el: HTMLElement;
  /** Urdu prose only — Arabic āyāt/aḥādīth already stripped out. */
  text: string;
}

export interface NarrationEngine {
  /**
   * Whether this engine can actually narrate Urdu here. Async because voice
   * lists load lazily. False → the reader hides the control entirely rather
   * than narrating Urdu with a wrong-language voice.
   */
  isAvailable(): Promise<boolean>;
  /** Speak one chunk; resolves when it finishes, rejects/resolves on cancel. */
  speak(chunk: NarrationChunk, rate: number): Promise<void>;
  pause(): void;
  resume(): void;
  /** Stop everything and drop the queue. */
  cancel(): void;
}
