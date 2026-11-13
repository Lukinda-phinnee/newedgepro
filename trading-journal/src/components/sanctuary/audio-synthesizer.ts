// Browser-native Web Audio API synthesizer for ambient sanctuary soundscapes
// Works 100% offline, zero network requests, zero mp3 assets needed.

export type AmbientSoundType = "rain" | "ocean" | "singing-bowl" | "wind" | "silence";

class SanctuaryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = "silence";
  private activeNodes: { stop: () => void }[] = [];
  private cleanups: (() => void)[] = [];
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
    this.cleanups.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    this.cleanups = [];

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

  // ── Calm Rainfall Generator (Warm, Soft, No Harsh Static) ──────────────────
  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const leftChannel = noiseBuffer.getChannelData(0);
    const rightChannel = noiseBuffer.getChannelData(1);

    // Warm pink noise generation for left and right channels (stereo decorrelation)
    for (const channel of [leftChannel, rightChannel]) {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        channel[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    // Layer 1: Warm deep rain body (gentle lowpass at 420 Hz removes harsh static)
    const deepFilter = this.ctx.createBiquadFilter();
    deepFilter.type = "lowpass";
    deepFilter.frequency.setValueAtTime(420, this.ctx.currentTime);

    // Layer 2: Delicate foliage whisper (bandpass at 820 Hz with low gain)
    const foliageFilter = this.ctx.createBiquadFilter();
    foliageFilter.type = "bandpass";
    foliageFilter.frequency.setValueAtTime(820, this.ctx.currentTime);
    foliageFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Subtle slow organic LFO for gentle rain breeze modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(foliageFilter.frequency);

    const foliageGain = this.ctx.createGain();
    foliageGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    const deepGain = this.ctx.createGain();
    deepGain.gain.setValueAtTime(0.38, this.ctx.currentTime);

    // Master rain gain with smooth fade-in
    const rainGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    rainGain.gain.setValueAtTime(0.001, now);
    rainGain.gain.linearRampToValueAtTime(0.38, now + 0.5);

    rainSource.connect(deepFilter);
    deepFilter.connect(deepGain);
    deepGain.connect(rainGain);

    rainSource.connect(foliageFilter);
    foliageFilter.connect(foliageGain);
    foliageGain.connect(rainGain);

    rainGain.connect(this.masterGain);

    rainSource.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          rainSource.stop();
          lfo.stop();
          rainSource.disconnect();
          lfo.disconnect();
          rainGain.disconnect();
        } catch {}
      },
    });
  }

  // ── Calm Ocean Waves Generator (Natural ~9.5s Breathing Cadence) ────────────
  private createOceanWaves() {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    const left = noiseBuffer.getChannelData(0);
    const right = noiseBuffer.getChannelData(1);

    // Generate warm brown noise for deep wave rush (no high-frequency harshness)
    for (const ch of [left, right]) {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        ch[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = ch[i];
        ch[i] *= 2.8;
      }
    }

    const waveSource = this.ctx.createBufferSource();
    waveSource.buffer = noiseBuffer;
    waveSource.loop = true;

    // Filter that opens from deep ocean rumble (140 Hz) to soft foamy crest (440 Hz)
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = "lowpass";
    waveFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    // Dynamic wave gain: swells from ~0.06 to 0.38 on wave crest
    const waveSwellGain = this.ctx.createGain();
    waveSwellGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    // LFO running at ~0.105 Hz (~9.5 second natural wave cycle)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.105, this.ctx.currentTime);

    // Modulate filter cutoff (swings ±150 Hz around 280 Hz)
    const lfoFilterGain = this.ctx.createGain();
    lfoFilterGain.gain.setValueAtTime(150, this.ctx.currentTime);
    lfo.connect(lfoFilterGain);
    lfoFilterGain.connect(waveFilter.frequency);

    // Modulate swell gain (swings ±0.16 around 0.22)
    const lfoGainAmp = this.ctx.createGain();
    lfoGainAmp.gain.setValueAtTime(0.16, this.ctx.currentTime);
    lfo.connect(lfoGainAmp);
    lfoGainAmp.connect(waveSwellGain.gain);

    // Soft surf spray layer (bandpass at 420 Hz, subtle foamy wash)
    const sprayFilter = this.ctx.createBiquadFilter();
    sprayFilter.type = "bandpass";
    sprayFilter.frequency.setValueAtTime(420, this.ctx.currentTime);
    sprayFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const sprayGain = this.ctx.createGain();
    sprayGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    lfoGainAmp.connect(sprayGain.gain);

    const oceanMaster = this.ctx.createGain();
    const now = this.ctx.currentTime;
    oceanMaster.gain.setValueAtTime(0.001, now);
    oceanMaster.gain.linearRampToValueAtTime(0.45, now + 0.8);

    waveSource.connect(waveFilter);
    waveFilter.connect(waveSwellGain);
    waveSwellGain.connect(oceanMaster);

    waveSource.connect(sprayFilter);
    sprayFilter.connect(sprayGain);
    sprayGain.connect(oceanMaster);

    oceanMaster.connect(this.masterGain);

    waveSource.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          waveSource.stop();
          lfo.stop();
          waveSource.disconnect();
          lfo.disconnect();
          oceanMaster.disconnect();
        } catch {}
      },
    });
  }

  // ── Forest Wind Generator (Preserved Exactly) ─────────────────────────────
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
        try {
          whiteNoise.stop();
          lfo.stop();
          whiteNoise.disconnect();
          lfo.disconnect();
        } catch {}
      },
    });
  }

  // ── Tibetan Singing Bowl Generator (Warm Resonance & Acoustic Strike) ─────
  private createSingingBowlSound() {
    if (!this.ctx || !this.masterGain) return;

    const baseFreq = 216; // 216 Hz warm calming fundamental
    const bowlMaster = this.ctx.createGain();
    const now = this.ctx.currentTime;
    bowlMaster.gain.setValueAtTime(0.001, now);
    bowlMaster.gain.linearRampToValueAtTime(0.35, now + 0.6);
    bowlMaster.connect(this.masterGain);

    // Warm lowpass filter to prevent any harsh high-frequency piercing tones
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(550, this.ctx.currentTime);
    lowpass.connect(bowlMaster);

    const droneOscs: OscillatorNode[] = [];
    // Warm harmonics: 216 Hz (fundamental), 324 Hz (peaceful fifth), 432 Hz (soft octave)
    const droneHarmonics = [
      { freq: baseFreq, gain: 0.16 },
      { freq: baseFreq * 1.5, gain: 0.04 }, // 324 Hz
      { freq: baseFreq * 2.0, gain: 0.03 }, // 432 Hz
    ];

    droneHarmonics.forEach((h, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(h.freq, this.ctx.currentTime);

      // Gentle subtle beating / shimmer
      const trem = this.ctx.createOscillator();
      trem.frequency.setValueAtTime(0.12 + i * 0.05, this.ctx.currentTime);
      const tremGain = this.ctx.createGain();
      tremGain.gain.setValueAtTime(h.gain * 0.15, this.ctx.currentTime);
      trem.connect(tremGain);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(h.gain, this.ctx.currentTime);
      tremGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(lowpass);

      osc.start();
      trem.start();
      droneOscs.push(osc);
      droneOscs.push(trem);
    });

    // Periodic Warm Mallet Strike (plays on start and repeats softly every 14s)
    const strikeNodes: { stop: () => void }[] = [];

    const triggerStrike = () => {
      if (!this.ctx || this.currentType !== "singing-bowl") return;
      const strikeTime = this.ctx.currentTime;

      const strikeHarmonics = [
        { freq: baseFreq, peak: 0.22, decay: 11 },
        { freq: baseFreq * 2, peak: 0.08, decay: 8 },
        { freq: baseFreq * 3, peak: 0.025, decay: 5 },
      ];

      strikeHarmonics.forEach((sh) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(sh.freq, strikeTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, strikeTime);
        gainNode.gain.linearRampToValueAtTime(sh.peak, strikeTime + 0.04); // soft acoustic mallet attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, strikeTime + sh.decay);

        osc.connect(gainNode);
        gainNode.connect(lowpass);

        osc.start(strikeTime);
        osc.stop(strikeTime + sh.decay + 0.1);

        strikeNodes.push({
          stop: () => {
            try {
              osc.stop();
              osc.disconnect();
              gainNode.disconnect();
            } catch {}
          },
        });
      });
    };

    // Immediate initial strike on start
    triggerStrike();

    // Repeat soft strike every 14 seconds
    const intervalId = setInterval(() => {
      triggerStrike();
    }, 14000);

    this.cleanups.push(() => {
      clearInterval(intervalId);
      strikeNodes.forEach((s) => s.stop());
    });

    this.activeNodes.push({
      stop: () => {
        try {
          droneOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          bowlMaster.disconnect();
        } catch {}
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
    chimeGain.gain.linearRampToValueAtTime(0.35, now + 0.08);
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
