// Browser-native Web Audio API synthesizer for ambient sanctuary soundscapes
// Works 100% offline, zero network requests, zero mp3 assets needed.

export type AmbientSoundType = "rain" | "ocean" | "singing-bowl" | "wind" | "silence";

class SanctuaryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = "silence";
  private activeNodes: { stop: () => void }[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.6;

  private initContext() {
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

  // ── Rain Generator ────────────────────────────────────────────────────────
  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Pink noise approximation for rain
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft raindrops hitting foliage
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();

    this.activeNodes.push({
      stop: () => {
        whiteNoise.stop();
        whiteNoise.disconnect();
      },
    });
  }

  // ── Ocean Waves Generator ────────────────────────────────────────────────
  private createOceanWaves() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    // Brown noise (softer, deep wave rush)
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // LFO to modulate wave surge & retreat every 8 seconds
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8.3 sec per wave

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    brownNoise.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        brownNoise.stop();
        lfo.stop();
        brownNoise.disconnect();
        lfo.disconnect();
      },
    });
  }

  // ── Forest Wind Generator ────────────────────────────────────────────────
  private createForestWind() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Slow wind sway LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        whiteNoise.stop();
        lfo.stop();
        whiteNoise.disconnect();
        lfo.disconnect();
      },
    });
  }

  // ── Tibetan Singing Bowl Harmonics Generator ──────────────────────────────
  private createSingingBowlSound() {
    if (!this.ctx || !this.masterGain) return;

    // 432 Hz healing fundamental with resonant overtones
    const baseFreq = 432;
    const overtones = [1, 2.76, 5.4, 8.1];
    const gains = [0.25, 0.12, 0.05, 0.02];

    const bowlGain = this.ctx.createGain();
    bowlGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    bowlGain.connect(this.masterGain);

    const oscs: OscillatorNode[] = [];

    overtones.forEach((ratio, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq * ratio, this.ctx.currentTime);

      // Tremolo / gentle beating
      const tremolo = this.ctx.createOscillator();
      tremolo.frequency.setValueAtTime(1.5 + idx * 0.5, this.ctx.currentTime);

      const tremGain = this.ctx.createGain();
      tremGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      tremolo.connect(tremGain);
      tremGain.connect(osc.frequency);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(gains[idx] || 0.05, this.ctx.currentTime);

      osc.connect(subGain);
      subGain.connect(bowlGain);

      osc.start();
      tremolo.start();
      oscs.push(osc);
      oscs.push(tremolo);
    });

    this.activeNodes.push({
      stop: () => {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {}
        });
      },
    });
  }

  public playGentleChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const chimeGain = this.ctx.createGain();
    chimeGain.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, this.ctx.currentTime); // 528 Hz transformation frequency

    const now = this.ctx.currentTime;
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.4, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(chimeGain);
    osc.start(now);
    osc.stop(now + 3);
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }
}

export const sanctuaryAudio = typeof window !== "undefined" ? new SanctuaryAudioEngine() : ({} as SanctuaryAudioEngine);

