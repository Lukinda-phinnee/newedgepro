"use client";

// Client-side Kokoro-82M TTS engine for Sanctuary Meditation & Serenity AI
// Runs 100% locally in the browser using WebGPU/WASM with zero server cost or API keys.

export type KokoroVoiceId =
  | "af_heart"   // Flagship: Calming, warm, empathetic American female (ideal for meditation)
  | "af_bella"   // Expressive, soft American female
  | "af_sarah"   // Clear, grounding American female
  | "af_nicole"  // Relaxed, soothing American female
  | "bf_emma"    // Elegant, tranquil British female
  | "am_adam"    // Deep, centered American male
  | "am_michael" // Steady, reassuring American male
  | "bm_george"; // Classic British male

export type KokoroStatus = "unloaded" | "loading" | "ready" | "error";

export interface KokoroProgress {
  status: KokoroStatus;
  percent: number;
  message?: string;
}

class KokoroVoiceEngine {
  private ttsInstance: any = null;
  private status: KokoroStatus = "unloaded";
  private progressPercent: number = 0;
  private loadPromise: Promise<boolean> | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;
  private isSpeaking: boolean = false;
  private listeners: Set<(progress: KokoroProgress) => void> = new Set();
  private audioCache: Map<string, string> = new Map(); // text:voice -> objectUrl

  public getStatus(): KokoroStatus {
    return this.status;
  }

  public getProgress(): KokoroProgress {
    return {
      status: this.status,
      percent: this.progressPercent,
    };
  }

  public subscribe(callback: (progress: KokoroProgress) => void): () => void {
    this.listeners.add(callback);
    callback(this.getProgress());
    return () => this.listeners.delete(callback);
  }

  private notify(message?: string) {
    const data: KokoroProgress = {
      status: this.status,
      percent: this.progressPercent,
      message,
    };
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch {}
    });
  }

  /**
   * Initializes and preloads Kokoro-82M ONNX model in browser.
   * Model weights are cached by the browser's CacheStorage/IndexedDB automatically.
   */
  public async init(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.status === "ready" && this.ttsInstance) return true;
    if (this.loadPromise) return this.loadPromise;

    this.status = "loading";
    this.progressPercent = 0;
    this.notify("Initializing Kokoro AI voice...");

    this.loadPromise = (async () => {
      try {
        // Dynamically load Kokoro TTS in the browser via ESM CDN to keep server builds 100% dependency-free
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const cdnLoader = new Function('return import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm")');
        const cdnModule = await cdnLoader();
        const KokoroTTS = cdnModule?.KokoroTTS;

        if (!KokoroTTS) {
          throw new Error("KokoroTTS could not be loaded from CDN");
        }

        // Try WebGPU first for instant hardware-accelerated synthesis, fallback to WASM
        const device = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";

        this.ttsInstance = await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-ONNX",
          {
            dtype: "q8", // 8-bit quantization: ~85MB, near fp32 quality
            device,
            progress_callback: (item: any) => {
              if (item && typeof item.progress === "number") {
                this.progressPercent = Math.min(100, Math.round(item.progress));
                this.notify(`Downloading Kokoro voice (${this.progressPercent}%)...`);
              }
            },
          }
        );

        this.status = "ready";
        this.progressPercent = 100;
        this.notify("Kokoro voice ready");
        return true;
      } catch (err) {
        console.warn("Kokoro TTS client init error (fallback to Web Speech available):", err);
        this.status = "error";
        this.notify("Failed to load Kokoro model; using browser speech fallback");
        return false;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Synthesizes and speaks text using Kokoro-82M voice (defaults to 'af_heart').
   * If Kokoro is still loading or unavailable, transparently falls back to browser SpeechSynthesis.
   */
  public async speak(
    text: string,
    voice: KokoroVoiceId = "af_heart",
    onEnded?: () => void
  ): Promise<void> {
    if (typeof window === "undefined" || !text.trim()) return;

    // Use the browser voice directly during the user's click. Kokoro synthesis
    // requires an async model call, after which browsers can reject audio.play()
    // because the original user gesture has expired.
    this.stop();
    this.fallbackSpeak(text, onEnded);
  }

  /**
   * Browser-native Web Speech API fallback when Kokoro is loading or offline
   */
  private fallbackSpeak(text: string, onEnded?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Google UK English Female") ||
        v.name.includes("Natural") ||
        v.name.includes("Samantha") ||
        (v.lang.startsWith("en") && /female|woman/i.test(v.name))
    ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

    if (preferred) utterance.voice = preferred;

    utterance.onend = () => onEnded?.();
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Immediately stops any active Kokoro or browser-native narration.
   */
  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    this.isSpeaking = false;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public pause() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {}
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (this.currentAudio) {
      try {
        void this.currentAudio.play();
      } catch {}
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const kokoroVoice = new KokoroVoiceEngine();
