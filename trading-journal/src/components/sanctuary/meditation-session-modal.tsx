"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Wind,
  Bell,
  CheckCircle2,
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
  Brain,
  ArrowLeft,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sanctuaryAudio,
  type AmbientSoundType,
} from "@/components/sanctuary/audio-synthesizer";
import {
  ALL_SANCTUARY_TECHNIQUES,
  TechniqueProfile,
} from "./techniques-data";

interface MeditationSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  techniqueId?: string;
  sessionTitle: string;
  durationMinutes: number;
  initialSound?: AmbientSoundType;
  onComplete?: (minutes: number) => void;
}

type BreathPhase = "Inhale" | "Hold" | "Exhale" | "Rest";

// ─── Voice helpers ────────────────────────────────────────────────────────────
/**
 * Returns the best available SpeechSynthesisVoice for calm meditation narration.
 * Priority: high-quality named voices → any English female voice → any English → first available
 */
function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Preference list — first match wins
  const preferredNames = [
    "Google UK English Female",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Microsoft Zira - English (United States)",
    "Karen",          // macOS Australian
    "Samantha",       // macOS US
    "Moira",          // macOS Irish
    "Tessa",          // macOS South African
    "Victoria",       // macOS
    "Google US English",
  ];

  for (const name of preferredNames) {
    const v = voices.find((voice) => voice.name === name);
    if (v) return v;
  }

  // Fallback: any English female-sounding voice (name heuristic)
  const femaleHint = voices.find(
    (v) => v.lang.startsWith("en") && /female|woman|girl/i.test(v.name)
  );
  if (femaleHint) return femaleHint;

  // Fallback: any English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith("en"));
  if (anyEnglish) return anyEnglish;

  return voices[0] ?? null;
}

export function MeditationSessionModal({
  isOpen,
  onClose,
  techniqueId = "focused-attention",
  sessionTitle,
  durationMinutes = 10,
  initialSound = "rain",
  onComplete,
}: MeditationSessionModalProps) {
  // Retrieve technique profile
  const profile: TechniqueProfile =
    ALL_SANCTUARY_TECHNIQUES[techniqueId] ||
    ALL_SANCTUARY_TECHNIQUES["focused-attention"];

  const theme = profile.theme;

  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false); // true = session started by user
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>(initialSound);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Stage progression
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = profile.stages[currentStageIdx] || profile.stages[0];

  // Voice narration toggle using Web Speech API
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Cache the chosen voice once voices are loaded
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Dynamic Breath pacing based on active stage or default breathing pattern
  const activePattern = currentStage?.breathingPattern || profile.defaultBreathing;
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("Inhale");
  const [breathCounter, setBreathCounter] = useState(activePattern.inhale);
  // Ref tracks the LIVE phase without causing the interval to restart on every phase change
  const breathPhaseRef = useRef<BreathPhase>("Inhale");

  // ─── Voice narration ────────────────────────────────────────────────────────
  const speakNarration = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      if (!isVoiceEnabled || !text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;   // slower, more considered pace
      utterance.pitch = 0.95;  // slightly lower, calming
      utterance.volume = 1.0;

      // Use cached voice or pick one now
      if (!voiceRef.current) {
        voiceRef.current = pickBestVoice();
      }
      if (voiceRef.current) utterance.voice = voiceRef.current;

      window.speechSynthesis.speak(utterance);
    },
    [isVoiceEnabled]
  );

  // Pre-load voices when the browser fires voiceschanged
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      voiceRef.current = pickBestVoice();
    };
    window.speechSynthesis.addEventListener("voiceschanged", load);
    load(); // try immediately in case already loaded
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(durationMinutes * 60);
      setIsRunning(false);  // wait for user to press Begin
      setIsReady(false);
      setIsFinished(false);
      setCurrentStageIdx(0);
      setBreathPhase("Inhale");
      breathPhaseRef.current = "Inhale";
      setBreathCounter(profile.stages[0]?.breathingPattern?.inhale ?? profile.defaultBreathing.inhale);
      // Start ambient audio immediately (sets the mood while user reads the card)
      sanctuaryAudio.play(initialSound);
      sanctuaryAudio.setVolume(volume);
      setCurrentSound(initialSound);
    } else {
      sanctuaryAudio.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsRunning(false);
      setIsReady(false);
    }
    return () => {
      sanctuaryAudio.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, durationMinutes, initialSound, techniqueId]);

  // Main Session Timer
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsFinished(true);
          sanctuaryAudio.playGentleChime();
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          onComplete?.(durationMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isOpen, durationMinutes, onComplete]);

  // Breathing Rhythm Cycle
  // Uses a ref for the phase so the interval never sees a stale closure — the ref
  // is always the live value, while the state drives the visual render.
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    // Snap ref to match current state whenever the effect (re-)starts
    breathPhaseRef.current = breathPhase;

    const breathTimer = setInterval(() => {
      setBreathCounter((prev) => {
        if (prev > 1) return prev - 1;

        // Phase transition — read phase from ref (always current, no stale closure)
        const current = breathPhaseRef.current;
        let nextPhase: BreathPhase;
        let nextDuration: number;

        switch (current) {
          case "Inhale":
            if (activePattern.hold > 0) {
              nextPhase = "Hold";
              nextDuration = activePattern.hold;
            } else {
              nextPhase = "Exhale";
              nextDuration = activePattern.exhale;
            }
            break;
          case "Hold":
            nextPhase = "Exhale";
            nextDuration = activePattern.exhale;
            break;
          case "Exhale":
            if (activePattern.rest > 0) {
              nextPhase = "Rest";
              nextDuration = activePattern.rest;
            } else {
              nextPhase = "Inhale";
              nextDuration = activePattern.inhale;
            }
            break;
          case "Rest":
          default:
            nextPhase = "Inhale";
            nextDuration = activePattern.inhale;
        }

        breathPhaseRef.current = nextPhase;
        setBreathPhase(nextPhase);
        return nextDuration;
      });
    }, 1000);

    return () => clearInterval(breathTimer);
    // ⚠️ breathPhase intentionally NOT in deps — the ref handles live tracking
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isOpen, activePattern]);

  // Called when user presses the Begin Session button — syncs all timers at once
  const handleBeginSession = () => {
    setIsReady(true);
    setIsRunning(true);
    setBreathPhase("Inhale");
    breathPhaseRef.current = "Inhale";
    setBreathCounter(profile.stages[0]?.breathingPattern?.inhale ?? profile.defaultBreathing.inhale);
    // Speak first narration (slight delay lets the browser settle)
    setTimeout(() => {
      speakNarration(profile.stages[0]?.narration || profile.guidanceQuote);
    }, 300);
  };

  const handleNextStage = () => {
    if (currentStageIdx < profile.stages.length - 1) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      speakNarration(profile.stages[nextIdx].narration);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIdx > 0) {
      const prevIdx = currentStageIdx - 1;
      setCurrentStageIdx(prevIdx);
      speakNarration(profile.stages[prevIdx].narration);
    }
  };

  const handleSoundChange = (sound: AmbientSoundType) => {
    setCurrentSound(sound);
    sanctuaryAudio.play(sound);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    sanctuaryAudio.setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    const muted = sanctuaryAudio.toggleMute();
    setIsMuted(muted);
  };

  const toggleVoice = () => {
    if (isVoiceEnabled) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsVoiceEnabled(false);
    } else {
      setIsVoiceEnabled(true);
      speakNarration(currentStage?.narration || profile.guidanceQuote);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── TS-driven orb animation ─────────────────────────────────────────────
  // We track the wall-clock timestamp when the current phase started so the
  // animation progress (0→1) is derived from real elapsed time, not CSS.
  const phaseStartTimeRef = useRef<number>(Date.now());
  const activePatternRef = useRef(activePattern);
  activePatternRef.current = activePattern; // always up-to-date, no stale closure

  // orbProgress: 0.0 = fully contracted (Exhale/Rest), 1.0 = fully expanded (Inhale/Hold)
  const [orbProgress, setOrbProgress] = useState(0);

  // High-frequency animation loop — 50 ms ≈ 20 fps, smooth enough for eyes
  useEffect(() => {
    if (!isRunning || !isReady) return;

    // Reset timestamp at the start of each running cycle
    phaseStartTimeRef.current = Date.now();

    const animLoop = setInterval(() => {
      const elapsed = (Date.now() - phaseStartTimeRef.current) / 1000;
      const p = activePatternRef.current;
      const phase = breathPhaseRef.current;

      let progress: number;
      switch (phase) {
        case "Inhale":
          progress = Math.min(elapsed / p.inhale, 1);
          break;
        case "Hold":
          progress = 1; // stay fully expanded
          break;
        case "Exhale":
          progress = Math.max(1 - elapsed / p.exhale, 0);
          break;
        case "Rest":
        default:
          progress = 0; // stay fully contracted
      }
      setOrbProgress(progress);
    }, 50);

    return () => clearInterval(animLoop);
  }, [isRunning, isReady]); // only restart when running/ready changes

  // Reset phaseStartTime every time the phase changes
  useEffect(() => {
    phaseStartTimeRef.current = Date.now();
  }, [breathPhase]);

  // Orb geometry — linearly interpolated between contracted and expanded sizes
  const RING_MIN = 144; // px  (≈ size-36)
  const RING_MAX = 256; // px  (≈ size-64)
  const CORE_MIN = 128; // px  (≈ size-32)
  const CORE_MAX = 208; // px  (≈ size-52)

  // easeInOut for a more organic breathing feel
  const eased = orbProgress < 0.5
    ? 2 * orbProgress * orbProgress
    : 1 - Math.pow(-2 * orbProgress + 2, 2) / 2;

  const ringSize = RING_MIN + (RING_MAX - RING_MIN) * eased;
  const coreSize = CORE_MIN + (CORE_MAX - CORE_MIN) * eased;
  const ringOpacity = 0.3 + 0.65 * eased;

  // Phase-specific accent colors for the orb (Inhale = technique color, Hold = amber, Exhale/Rest = neutral)
  const phaseColor = {
    Inhale: { ring: theme.ringInhale, border: theme.orbBorderInhale, text: theme.accentText },
    Hold:   { ring: "border-amber-400/30 bg-amber-500/10", border: "border-amber-400/40", text: "text-amber-200" },
    Exhale: { ring: "border-white/10 bg-white/5", border: "border-white/20", text: "text-white/70" },
    Rest:   { ring: "border-white/8 bg-white/3", border: "border-white/15", text: "text-white/50" },
  };
  const pc = phaseColor[breathPhase];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black text-[#f2efe9] select-none animate-in fade-in duration-300"
    )}>

      {/* ─── FULL-SCREEN NATURE PHOTOGRAPHY BACKDROP ─── */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-out scale-105 pointer-events-none"
        style={{ backgroundImage: `url("${profile.bgImageUrl}")` }}
      />
      {/* Per-technique atmospheric vignette */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t pointer-events-none",
        theme.backdropGradient
      )} />
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80 pointer-events-none" />

      {/* ─── TOP BAR ─── */}
      <header className="relative z-10 w-full flex items-center justify-between p-4 sm:p-8 shrink-0 border-b border-white/10 backdrop-blur-md bg-black/20">

        {/* Left: Exit & title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            title="Leave meditation session"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Leave Session</span>
          </button>

          <div className="border-l border-white/15 pl-3 sm:pl-4">
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-mono uppercase tracking-widest font-semibold", theme.voiceActiveText)}>
                {profile.tradingContext}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-medium text-white tracking-wide">
              {profile.title}
            </h2>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-3">
          {/* Voice Narration Toggle */}
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer border backdrop-blur-md",
              isVoiceEnabled
                ? cn(theme.voiceActiveBg, theme.voiceActiveBorder, theme.voiceActiveText, "shadow-sm")
                : "bg-white/10 border-white/10 text-white/60 hover:text-white"
            )}
            title={isVoiceEnabled ? "Voice narration active" : "Voice narration muted"}
          >
            {isVoiceEnabled
              ? <Mic size={13} className={theme.voiceActiveText} />
              : <MicOff size={13} />}
            <span className="hidden sm:inline text-[11px]">
              {isVoiceEnabled ? "Voice On" : "Voice Off"}
            </span>
          </button>

          {/* Master Volume */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={handleToggleMute}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 cursor-pointer"
              style={{ accentColor: theme.accentHex }}
            />
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ─── CENTER ARENA: BREATHING ORB & NARRATION ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full gap-5 sm:gap-7">

        {/* ── READY SCREEN: shown before user starts ── */}
        {!isReady && !isFinished && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6 text-center animate-in fade-in duration-500">
            {/* Technique badge */}
            <span className={cn("text-[11px] font-mono uppercase tracking-widest font-semibold", theme.voiceActiveText)}>
              {profile.tradingContext}
            </span>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-white">
                {profile.title}
              </h1>
              <p className="text-sm text-white/60 font-light max-w-md">
                {profile.subtitle}
              </p>
            </div>

            {/* Duration pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/70 text-sm font-mono backdrop-blur-md">
              <span>{formatTime(secondsRemaining)}</span>
              <span className="text-white/30">·</span>
              <span>{durationMinutes} min session</span>
            </div>

            {/* Guidance quote */}
            <blockquote className="max-w-sm text-sm text-stone-200/80 font-light italic leading-relaxed">
              &ldquo;{profile.guidanceQuote}&rdquo;
            </blockquote>

            {/* BEGIN button */}
            <button
              type="button"
              onClick={handleBeginSession}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-base shadow-2xl",
                "bg-gradient-to-r text-stone-950 transition-transform hover:scale-105 active:scale-95 cursor-pointer",
                theme.playButtonGradient
              )}
            >
              <Play size={20} className="fill-current" />
              Begin Session
            </button>

            {/* Breathing pattern hint */}
            <p className="text-[11px] font-mono text-white/35 uppercase tracking-widest">
              {activePattern.hold > 0
                ? `Inhale ${activePattern.inhale}s · Hold ${activePattern.hold}s · Exhale ${activePattern.exhale}s${activePattern.rest > 0 ? ` · Rest ${activePattern.rest}s` : ""}`
                : `Inhale ${activePattern.inhale}s · Exhale ${activePattern.exhale}s`}
            </p>
          </div>
        )}

        {/* Dynamic Breathing Orb — size driven by TS orbProgress, not CSS transition */}
        <div className={cn(
          "relative flex items-center justify-center my-2 transition-opacity duration-500",
          !isReady && "opacity-0 pointer-events-none"
        )}
          style={{ width: RING_MAX, height: RING_MAX }}
        >
          {/* Outer pulsing ring */}
          <div
            className={cn("absolute rounded-full border", pc.ring)}
            style={{
              width: ringSize,
              height: ringSize,
              opacity: ringOpacity,
            }}
          />

          {/* Glowing center core */}
          <div
            className={cn(
              "relative z-10 flex flex-col items-center justify-center rounded-full shadow-2xl backdrop-blur-xl border",
              `bg-gradient-to-br ${theme.orbGradient} text-white`,
              pc.border
            )}
            style={{
              width: coreSize,
              height: coreSize,
            }}
          >
            <span className={cn("text-xs sm:text-sm font-serif font-medium tracking-widest uppercase", pc.text)}>
              {isFinished ? "Completed" : breathPhase}
            </span>
            {!isFinished && (
              <span className="text-3xl sm:text-4xl font-mono font-light text-white mt-1">
                {breathCounter}s
              </span>
            )}
          </div>
        </div>

        {/* Countdown Clock */}
        <div className={cn("text-center transition-opacity duration-500", !isReady && "opacity-0 pointer-events-none")}>
          <div className="text-3xl sm:text-4xl font-mono font-light tracking-widest text-white drop-shadow-md">
            {formatTime(secondsRemaining)}
          </div>
          <p className={cn("text-xs font-mono mt-1 uppercase tracking-wider", theme.voiceActiveText + "/80")}>
            {profile.subtitle}
          </p>
        </div>

        {/* Stage Script Card */}
        <div className={cn(
          "w-full max-w-2xl p-5 sm:p-6 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl shadow-2xl text-center space-y-3 transition-opacity duration-500",
          !isReady && "opacity-0 pointer-events-none"
        )}>

          {/* Stage stepper (only for multi-stage techniques) */}
          {profile.stages.length > 1 && (
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
              <button
                type="button"
                disabled={currentStageIdx === 0}
                onClick={handlePrevStage}
                className="flex items-center gap-1 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev Stage</span>
              </button>

              <div className="flex items-center gap-1.5">
                {profile.stages.map((stg, idx) => (
                  <span
                    key={stg.id}
                    className={cn(
                      "size-2 rounded-full transition-all",
                      idx === currentStageIdx
                        ? cn("scale-125", `bg-${theme.accent}-400`)
                        : idx < currentStageIdx
                        ? "bg-white/50"
                        : "bg-white/20"
                    )}
                  />
                ))}
                <span className={cn("ml-2 font-medium", theme.voiceActiveText)}>
                  Stage {currentStage.stageNumber}: {currentStage.title}
                </span>
              </div>

              <button
                type="button"
                disabled={currentStageIdx === profile.stages.length - 1}
                onClick={handleNextStage}
                className="flex items-center gap-1 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Next Stage</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Narration text */}
          <blockquote className="text-sm sm:text-base text-stone-100 font-light leading-relaxed font-sans italic">
            &ldquo;{currentStage?.narration || profile.guidanceQuote}&rdquo;
          </blockquote>

          {/* Scientific purpose */}
          <div className="pt-2 text-[11px] font-mono text-white/50 flex items-center justify-center gap-1.5">
            <Brain size={12} className={theme.voiceActiveText} />
            <span>{profile.scientificObjective}</span>
          </div>
        </div>

      </main>

      {/* ─── BOTTOM CONTROL BAR ─── */}
      <footer className="relative z-10 w-full p-4 sm:p-6 shrink-0 border-t border-white/10 backdrop-blur-md bg-black/25 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">

        {/* Left: Soundscape selector */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
          {[
            { id: "rain", label: "Rain", icon: CloudRain },
            { id: "ocean", label: "Ocean", icon: Waves },
            { id: "singing-bowl", label: "Bowl", icon: Bell },
            { id: "wind", label: "Wind", icon: Wind },
          ].map((snd) => {
            const Icon = snd.icon;
            const isChosen = currentSound === snd.id;
            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => handleSoundChange(snd.id as AmbientSoundType)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  isChosen
                    ? cn(theme.soundActiveBg, theme.soundActiveText, "font-bold shadow-md")
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon size={13} />
                <span>{snd.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSecondsRemaining(durationMinutes * 60);
              setCurrentStageIdx(0);
              setIsFinished(false);
              setIsReady(false);
              setIsRunning(false);
              setBreathPhase("Inhale");
              breathPhaseRef.current = "Inhale";
              setBreathCounter(activePattern.inhale);
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Restart session"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isReady) {
                handleBeginSession();
              } else if (isRunning) {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.pause();
                }
                setIsRunning(false);
              } else {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.resume();
                }
                setIsRunning(true);
              }
            }}
            className={cn(
              "flex items-center justify-center size-16 rounded-full bg-gradient-to-r text-stone-950 font-bold shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer",
              theme.playButtonGradient
            )}
            title={!isReady ? "Begin session" : isRunning ? "Pause" : "Resume"}
          >
            {isRunning && isReady
              ? <Pause size={24} className="fill-current" />
              : <Play size={24} className="fill-current ml-0.5" />}
          </button>

          {profile.stages.length > 1 && (
            <button
              type="button"
              onClick={handleNextStage}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="Skip to next stage"
            >
              <SkipForward size={18} />
            </button>
          )}
        </div>

        {/* Right: Done / Finish Early */}
        <div className="flex items-center gap-2">
          {isFinished ? (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer",
                theme.finishButtonBg,
                theme.soundActiveText
              )}
            >
              <CheckCircle2 size={16} />
              <span>Session Done</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              Finish Early
            </button>
          )}
        </div>

      </footer>
    </div>
  );
}
