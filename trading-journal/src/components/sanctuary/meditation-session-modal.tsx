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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sanctuaryAudio,
  type AmbientSoundType,
} from "@/components/sanctuary/audio-synthesizer";

interface MeditationSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  durationMinutes: number;
  initialSound?: AmbientSoundType;
  onComplete?: (minutes: number) => void;
}

type BreathPhase = "Inhale" | "Hold" | "Exhale" | "Rest";

export function MeditationSessionModal({
  isOpen,
  onClose,
  sessionTitle,
  durationMinutes = 10,
  initialSound = "rain",
  onComplete,
}: MeditationSessionModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>(initialSound);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Breath pacing state (Box breathing 4-4-4-4)
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("Inhale");
  const [breathCounter, setBreathCounter] = useState(4);

  // Sync duration when session changes
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(durationMinutes * 60);
      setIsRunning(true);
      setIsFinished(false);
      sanctuaryAudio.play(initialSound);
      sanctuaryAudio.setVolume(volume);
      setCurrentSound(initialSound);
    } else {
      sanctuaryAudio.stop();
      setIsRunning(false);
    }
    return () => {
      sanctuaryAudio.stop();
    };
  }, [isOpen, durationMinutes, initialSound, volume]);

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
          onComplete?.(durationMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isOpen, durationMinutes, onComplete]);

  // Breathing Box Cycle (4s Inhale -> 4s Hold -> 4s Exhale -> 4s Rest)
  useEffect(() => {
    if (!isRunning || !isOpen) return;

    const breathTimer = setInterval(() => {
      setBreathCounter((prev) => {
        if (prev <= 1) {
          setBreathPhase((current) => {
            switch (current) {
              case "Inhale":
                return "Hold";
              case "Hold":
                return "Exhale";
              case "Exhale":
                return "Rest";
              case "Rest":
                return "Inhale";
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathTimer);
  }, [isRunning, isOpen]);

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

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#16201a] text-[#f2efe9] shadow-2xl p-6 md:p-8 flex flex-col items-center overflow-hidden">
        {/* Serene Ambient Glow Gradient */}
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="relative w-full flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Sparkles size={14} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-wide font-serif text-white">
                {sessionTitle}
              </h3>
              <p className="text-[11px] text-white/60">Guided Meditation & Somatic Reset</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Breathwork Visualizer Orb */}
        <div className="relative my-8 flex flex-col items-center justify-center">
          {/* Animated Breathing Circle */}
          <div className="relative flex items-center justify-center size-56">
            {/* Outer Pulsing Aura */}
            <div
              className={cn(
                "absolute rounded-full transition-all duration-[4000ms] ease-in-out bg-emerald-500/15 border border-emerald-400/20",
                breathPhase === "Inhale" && "size-56 scale-100 opacity-90",
                breathPhase === "Hold" && "size-56 scale-100 opacity-75",
                breathPhase === "Exhale" && "size-32 scale-75 opacity-40",
                breathPhase === "Rest" && "size-32 scale-75 opacity-30"
              )}
            />

            {/* Inner Glowing Core */}
            <div
              className={cn(
                "relative z-10 flex flex-col items-center justify-center rounded-full transition-all duration-[4000ms] ease-in-out shadow-lg",
                "bg-gradient-to-br from-[#2a4535] to-[#1c3024] border border-emerald-400/40 text-white",
                breathPhase === "Inhale" && "size-40 scale-100",
                breathPhase === "Hold" && "size-40 scale-100 shadow-emerald-500/20",
                breathPhase === "Exhale" && "size-28 scale-85",
                breathPhase === "Rest" && "size-28 scale-80"
              )}
            >
              <span className="text-sm font-serif font-medium tracking-wide">
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
          <div className="mt-4 text-center">
            <span className="text-3xl font-mono tracking-wider font-light text-white/90">
              {formatTime(secondsRemaining)}
            </span>
            <p className="text-xs text-white/50 mt-1">
              {isFinished ? "Session complete! Deep peace restored." : "Breathe in harmony with the orb"}
            </p>
          </div>
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
              setIsFinished(false);
              setIsRunning(true);
            }}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Restart session"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
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

