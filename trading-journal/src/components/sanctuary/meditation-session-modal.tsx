"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
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
  Brain,
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

  // Voice narration toggle using SpeechSynthesis
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

      // Speak stage 1 narration if available
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

  // Breathing Box / Rhythm Cycle adapted to THIS specific technique
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#16201a] text-[#f2efe9] shadow-2xl p-6 md:p-8 flex flex-col items-center overflow-hidden">
        {/* Serene Ambient Glow Gradient */}
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top Bar: Title & Technique Subtitle */}
        <div className="relative w-full flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Brain size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-wide font-serif text-white">
                {profile.title}
              </h3>
              <p className="text-[11px] text-emerald-300/80 font-mono">
                {profile.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Narration Toggle */}
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer border",
                isVoiceEnabled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-white/5 border-white/10 text-white/50"
              )}
              title={isVoiceEnabled ? "Voice narration active" : "Voice narration off"}
            >
              {isVoiceEnabled ? <Mic size={12} /> : <MicOff size={12} />}
              <span className="text-[10px] hidden sm:inline">
                {isVoiceEnabled ? "Voice On" : "Voice Off"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Breathwork Visualizer Orb */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          {/* Animated Breathing Circle with technique rhythm */}
          <div className="relative flex items-center justify-center size-52">
            {/* Outer Pulsing Aura */}
            <div
              className={cn(
                "absolute rounded-full transition-all duration-[4000ms] ease-in-out bg-emerald-500/15 border border-emerald-400/20",
                breathPhase === "Inhale" && "size-52 scale-100 opacity-90",
                breathPhase === "Hold" && "size-52 scale-100 opacity-75",
                breathPhase === "Exhale" && "size-32 scale-75 opacity-40",
                breathPhase === "Rest" && "size-32 scale-75 opacity-30"
              )}
            />

            {/* Inner Glowing Core */}
            <div
              className={cn(
                "relative z-10 flex flex-col items-center justify-center rounded-full transition-all duration-[4000ms] ease-in-out shadow-lg",
                "bg-gradient-to-br from-[#2a4535] to-[#1c3024] border border-emerald-400/40 text-white",
                breathPhase === "Inhale" && "size-36 scale-100",
                breathPhase === "Hold" && "size-36 scale-100 shadow-emerald-500/20",
                breathPhase === "Exhale" && "size-28 scale-85",
                breathPhase === "Rest" && "size-28 scale-80"
              )}
            >
              <span className="text-xs font-serif font-medium tracking-wide">
                {isFinished ? "Completed" : breathPhase}
              </span>
              {!isFinished && (
                <span className="text-2xl font-mono font-light text-emerald-300 mt-0.5">
                  {breathCounter}
                </span>
              )}
            </div>
          </div>

          {/* Time Remaining */}
          <div className="mt-3 text-center">
            <span className="text-2xl font-mono tracking-wider font-light text-white/90">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Dynamic Guided Script / Stage Instruction Card */}
        <div className="relative w-full p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 text-center">
          {profile.stages.length > 1 && (
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300/90 mb-1.5 pb-1 border-b border-white/10">
              <span>
                Stage {currentStage.stageNumber} of {profile.stages.length}: {currentStage.title}
              </span>
              {currentStageIdx < profile.stages.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="hover:underline flex items-center gap-0.5 text-white/80 hover:text-white cursor-pointer"
                >
                  <span>Next Stage</span>
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-stone-200 font-light leading-relaxed italic">
            "{currentStage?.narration || profile.guidanceQuote}"
          </p>
        </div>

        {/* Soundscapes Selector */}
        <div className="relative w-full p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex items-center justify-between text-xs mb-2 px-1 text-white/70">
            <span className="flex items-center gap-1.5 font-medium">
              <Waves size={13} className="text-emerald-400" /> Ambient Soundscape
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "rain", label: "Rain", icon: CloudRain },
              { id: "ocean", label: "Ocean", icon: Waves },
              { id: "singing-bowl", label: "Bowl", icon: Bell },
              { id: "wind", label: "Wind", icon: Wind },
            ].map((sound) => {
              const Icon = sound.icon;
              const isActive = currentSound === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleSoundChange(sound.id as AmbientSoundType)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-xs"
                      : "bg-white/5 hover:bg-white/10 text-white/70 border border-transparent"
                  )}
                >
                  <Icon size={12} />
                  <span>{sound.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative w-full flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSecondsRemaining(durationMinutes * 60);
              setCurrentStageIdx(0);
              setIsFinished(false);
              setIsRunning(true);
              speakNarration(profile.stages[0]?.narration || profile.guidanceQuote);
            }}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Restart session"
          >
            <RotateCcw size={16} />
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
            className="flex items-center justify-center size-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>

          {isFinished && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
