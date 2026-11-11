// Offline Web Audio API Synthesizer + Web Speech API Narration Engine for Sanctuary 2
import { AmbientSoundType } from "./sanctuary2-types";

class Sanctuary2AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = "silence";
  private activeNodes: { stop: () => void }[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {}
    });
    this.activeNodes = [];
    this.currentType = "silence";
  }

  public play(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.currentType === type) return;

    this.stop();
    this.currentType = type;
    if (type === "silence") return;

    switch (type) {
      case "rain":
        this.createRainSound();
        break;
      case "ocean":
        this.createOceanWaves();
        break;
      case "wind":
        this.createForestWind();
        break;
      case "singing-bowl":
        this.createSingingBowlSound();
        break;
    }
  }

  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.153852;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    whiteNoise.start();

    this.activeNodes.push({
      stop: () => {
        try {
          whiteNoise.stop();
          whiteNoise.disconnect();
          filter.disconnect();
        } catch {}
      },
    });
  }

  private createOceanWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.14;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave rhythm

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
          noise.disconnect();
          lfo.disconnect();
          filter.disconnect();
        } catch {}
      },
    });
  }

  private createForestWind() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.11;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();

    this.activeNodes.push({
      stop: () => {
        try {
          noise.stop();
          noise.disconnect();
          filter.disconnect();
        } catch {}
      },
    });
  }

  private createSingingBowlSound() {
    if (!this.ctx || !this.masterGain) return;
    const fundamentalFreq = 261.63; // C4 Tibetan Bowl
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(fundamentalFreq, this.ctx.currentTime);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(fundamentalFreq * 2.76, this.ctx.currentTime); // Harmonic

    gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.activeNodes.push({
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          gainNode.disconnect();
        } catch {}
      },
    });
  }

  public playGentleChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio frequency

    chimeGain.gain.setValueAtTime(0.3, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    osc.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.6);
  }
}

class Sanctuary2NarrationEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceSpeed: number = 0.95; // slightly slower, calm cadence

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.voiceSpeed;
    utterance.pitch = 0.98;

    // Pick best natural English voice if present
    const voices = this.synth.getVoices();
    const calmVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google") || v.name.includes("Samantha"))) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (calmVoice) {
      utterance.voice = calmVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth?.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth?.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public setSpeed(speed: number) {
    this.voiceSpeed = Math.max(0.7, Math.min(1.4, speed));
  }
}

export const sanctuary2Audio =
  typeof window !== "undefined" ? new Sanctuary2AudioEngine() : ({} as Sanctuary2AudioEngine);

export const sanctuary2Narration =
  typeof window !== "undefined" ? new Sanctuary2NarrationEngine() : ({} as Sanctuary2NarrationEngine);

