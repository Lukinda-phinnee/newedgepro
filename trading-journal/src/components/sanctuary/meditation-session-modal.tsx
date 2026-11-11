"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
  Brain,
  Shield,
  ArrowLeft,
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

  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>(initialSound);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Stage progression
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = profile.stages[currentStageIdx] || profile.stages[0];

  // Voice narration toggle using Web Speech API
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Dynamic Breath pacing based on active stage or default breathing pattern
  const activePattern = currentStage?.breathingPattern || profile.defaultBreathing;
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("Inhale");
  const [breathCounter, setBreathCounter] = useState(activePattern.inhale);

  // Voice narration speech trigger
  const speakNarration = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!isVoiceEnabled || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.98;

    const voices = window.speechSynthesis.getVoices();
    const calmVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Online") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (calmVoice) utterance.voice = calmVoice;
    window.speechSynthesis.speak(utterance);
  };

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(durationMinutes * 60);
      setIsRunning(true);
      setIsFinished(false);
      setCurrentStageIdx(0);
      sanctuaryAudio.play(initialSound);
      sanctuaryAudio.setVolume(volume);
      setCurrentSound(initialSound);

      // Speak stage 1 narration
      const firstNarration = profile.stages[0]?.narration || profile.guidanceQuote;
      speakNarration(firstNarration);
    } else {
      sanctuaryAudio.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsRunning(false);
    }
    return () => {
      sanctuaryAudio.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
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

  // Breathing Rhythm Cycle adapted to THIS specific technique
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const breathTimer = setInterval(() => {
      setBreathCounter((prev) => {
        if (prev <= 1) {
          setBreathPhase((current) => {
            switch (current) {
              case "Inhale":
                return activePattern.hold > 0 ? "Hold" : "Exhale";
              case "Hold":
                return "Exhale";
              case "Exhale":
                return activePattern.rest > 0 ? "Rest" : "Inhale";
              case "Rest":
                return "Inhale";
            }
          });

          switch (breathPhase) {
            case "Inhale":
              return activePattern.hold > 0 ? activePattern.hold : activePattern.exhale;
            case "Hold":
              return activePattern.exhale;
            case "Exhale":
              return activePattern.rest > 0 ? activePattern.rest : activePattern.inhale;
            case "Rest":
              return activePattern.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathTimer);
  }, [isRunning, isOpen, breathPhase, activePattern]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black text-[#f2efe9] select-none animate-in fade-in duration-300">
      
      {/* ─── FULL-SCREEN NATURE PHOTOGRAPHY BACKDROP ─── */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[12000ms] ease-out scale-105 pointer-events-none"
        style={{ backgroundImage: `url("${profile.bgImageUrl}")` }}
      />
      {/* Deep Atmospheric Vignette & Gradients for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080d09]/95 via-[#0c140e]/75 to-[#080d09]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80 pointer-events-none" />

      {/* ─── TOP BAR (HEADER & QUICK AUDIO CONTROLS) ─── */}
      <header className="relative z-10 w-full flex items-center justify-between p-4 sm:p-8 shrink-0 border-b border-white/10 backdrop-blur-md bg-black/20">
        
        {/* Left: Exit button & Technique title */}
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                {profile.tradingContext}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-medium text-white tracking-wide">
              {profile.title}
            </h2>
          </div>
        </div>

        {/* Right: Voice toggle, volume, mute, close */}
        <div className="flex items-center gap-3">
          {/* Voice Narration Toggle */}
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer border backdrop-blur-md",
              isVoiceEnabled
                ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-sm"
                : "bg-white/10 border-white/10 text-white/60 hover:text-white"
            )}
            title={isVoiceEnabled ? "Voice narration active" : "Voice narration muted"}
          >
            {isVoiceEnabled ? <Mic size={13} className="text-emerald-300" /> : <MicOff size={13} />}
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
              className="w-16 h-1 accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ─── CENTER ARENA: BREATHING ORB & SYNCHRONIZED STAGE NARRATION ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full gap-5 sm:gap-7">
        
        {/* Dynamic Breathing Orb */}
        <div className="relative flex items-center justify-center size-64 sm:size-76 my-2">
          
          {/* Subtle Outer Pulsing Wave Rings */}
          <div
            className={cn(
              "absolute rounded-full transition-all duration-[4000ms] ease-in-out border",
              breathPhase === "Inhale" && "size-64 sm:size-76 scale-100 opacity-90 border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_60px_rgba(52,211,153,0.18)]",
              breathPhase === "Hold" && "size-64 sm:size-76 scale-100 opacity-80 border-amber-400/30 bg-amber-500/10 shadow-[0_0_50px_rgba(251,191,36,0.18)]",
              breathPhase === "Exhale" && "size-36 sm:size-44 scale-80 opacity-40 border-teal-400/20 bg-teal-500/5",
              breathPhase === "Rest" && "size-36 sm:size-44 scale-75 opacity-30 border-white/10 bg-white/5"
            )}
          />

          {/* Glowing Center Core */}
          <div
            className={cn(
              "relative z-10 flex flex-col items-center justify-center rounded-full transition-all duration-[4000ms] ease-in-out shadow-2xl backdrop-blur-xl border border-white/20",
              "bg-gradient-to-br from-[#1c3024]/90 via-[#14231a]/95 to-[#0b140f]/95 text-white",
              breathPhase === "Inhale" && "size-44 sm:size-52 scale-100 border-emerald-400/40",
              breathPhase === "Hold" && "size-44 sm:size-52 scale-100 border-amber-400/40 shadow-emerald-500/20",
              breathPhase === "Exhale" && "size-32 sm:size-38 scale-85 border-teal-400/30",
              breathPhase === "Rest" && "size-32 sm:size-38 scale-80 border-white/15"
            )}
          >
            <span className="text-xs sm:text-sm font-serif font-medium tracking-widest uppercase text-emerald-200">
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
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-mono font-light tracking-widest text-white drop-shadow-md">
            {formatTime(secondsRemaining)}
          </div>
          <p className="text-xs font-mono text-emerald-300/80 mt-1 uppercase tracking-wider">
            {profile.subtitle}
          </p>
        </div>

        {/* Synchronized Stage Script Card */}
        <div className="w-full max-w-2xl p-5 sm:p-6 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl shadow-2xl text-center space-y-3">
          
          {/* Stage Pills & Stepper */}
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
                        ? "bg-emerald-400 scale-125"
                        : idx < currentStageIdx
                        ? "bg-white/50"
                        : "bg-white/20"
                    )}
                  />
                ))}
                <span className="ml-2 text-emerald-300 font-medium">
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

          {/* Actual Script Narration Text */}
          <blockquote className="text-sm sm:text-base text-stone-100 font-light leading-relaxed font-sans italic">
            "{currentStage?.narration || profile.guidanceQuote}"
          </blockquote>

          {/* Scientific Purpose Indicator */}
          <div className="pt-2 text-[11px] font-mono text-white/50 flex items-center justify-center gap-1.5">
            <Brain size={12} className="text-emerald-400" />
            <span>{profile.scientificObjective}</span>
          </div>
        </div>

      </main>

      {/* ─── BOTTOM CONTROL BAR: AMBIENT SOUNDS & MEDIA CONTROLS ─── */}
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
                    ? "bg-emerald-500 text-stone-900 font-bold shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon size={13} />
                <span>{snd.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Main Media Controls (Restart, Play/Pause, Skip) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSecondsRemaining(durationMinutes * 60);
              setCurrentStageIdx(0);
              setIsFinished(false);
              setIsRunning(true);
              speakNarration(profile.stages[0]?.narration || profile.guidanceQuote);
            }}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Restart session"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isRunning) {
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
            className="flex items-center justify-center size-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-stone-950 font-bold shadow-xl shadow-emerald-950/60 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-0.5" />}
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

        {/* Right: Done button or completion status */}
        <div className="flex items-center gap-2">
          {isFinished ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer"
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
