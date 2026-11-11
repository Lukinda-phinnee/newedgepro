"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Mic,
  MicOff,
  CloudRain,
  Waves,
  Wind,
  Bell,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { BreathingRing } from "./breathing-ring";
import {
  sanctuary2Audio,
  sanctuary2Narration,
} from "../sanctuary2-audio";
import { AmbientSoundType } from "../sanctuary2-types";

export function GuidedPlayerModal() {
  const {
    isPlayerOpen,
    activeSession,
    activeDurationMinutes,
    closePlayer,
    openCompletionModal,
    settings,
  } = useSanctuary2();

  // If not open or no session, return null
  if (!isPlayerOpen || !activeSession) return null;

  return <GuidedPlayerContent key={activeSession.id} />;
}

function GuidedPlayerContent() {
  const {
    activeSession,
    activeDurationMinutes,
    closePlayer,
    openCompletionModal,
    settings,
  } = useSanctuary2();

  if (!activeSession) return null;

  // Total session seconds
  const totalSeconds = useMemo(
    () => activeDurationMinutes * 60,
    [activeDurationMinutes]
  );

  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageSecondsRemaining, setStageSecondsRemaining] = useState(
    activeSession.stages[0]?.durationSeconds ?? 60
  );

  // Audio & narration states
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>(
    activeSession.stages[0]?.ambientSound ?? settings.defaultAmbientSound
  );
  const [volume, setVolume] = useState(settings.defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceNarrationEnabled);
  const [voiceSpeed, setVoiceSpeed] = useState(settings.voiceSpeed);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Breathing Box pacing
  const currentStage = activeSession.stages[currentStageIndex] || activeSession.stages[0];
  const breathingDef = currentStage?.breathingPattern || {
    inhale: 4,
    hold: 2,
    exhale: 5,
    rest: 2,
  };

  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathCounter, setBreathCounter] = useState(breathingDef.inhale);

  // Calculate overall progress %
  const progressPercent = Math.min(
    100,
    Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100)
  );

  // Start audio & narration when player opens or stage changes
  useEffect(() => {
    sanctuary2Audio.play(currentSound);
    sanctuary2Audio.setVolume(volume);

    return () => {
      sanctuary2Audio.stop();
      sanctuary2Narration.stop();
    };
  }, []);

  // Voice narration triggers on stage change
  useEffect(() => {
    if (!isRunning) {
      sanctuary2Narration.pause();
      return;
    }
    sanctuary2Narration.resume();

    if (voiceEnabled && currentStage?.narration) {
      sanctuary2Narration.setSpeed(voiceSpeed);
      sanctuary2Narration.speak(currentStage.narration);
    } else {
      sanctuary2Narration.stop();
    }
  }, [currentStageIndex, voiceEnabled, voiceSpeed, isRunning, currentStage?.narration]);

  // Main countdown timer (both overall session and stage countdown)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Decrement overall session
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishSession();
          return 0;
        }
        return prev - 1;
      });

      // 2. Decrement stage timer
      setStageSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance to next stage if available
          setCurrentStageIndex((curr) => {
            if (curr < activeSession.stages.length - 1) {
              const nextIndex = curr + 1;
              const nextStage = activeSession.stages[nextIndex];
              // Update ambient sound if stage specifies one
              if (nextStage?.ambientSound && nextStage.ambientSound !== currentSound) {
                setCurrentSound(nextStage.ambientSound);
                sanctuary2Audio.play(nextStage.ambientSound);
              }
              return nextIndex;
            }
            return curr;
          });
          const nextStageObj = activeSession.stages[currentStageIndex + 1];
          return nextStageObj ? nextStageObj.durationSeconds : 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeSession, currentStageIndex, currentSound]);

  // Breath pacing loop
  useEffect(() => {
    if (!isRunning) return;

    const breathInterval = setInterval(() => {
      setBreathCounter((prev) => {
        if (prev <= 1) {
          setBreathPhase((current) => {
            switch (current) {
              case "Inhale":
                if ((breathingDef.hold ?? 0) > 0) {
                  return "Hold";
                }
                return "Exhale";
              case "Hold":
                return "Exhale";
              case "Exhale":
                if ((breathingDef.rest ?? 0) > 0) {
                  return "Rest";
                }
                return "Inhale";
              case "Rest":
                return "Inhale";
            }
          });

          // Set next counter value
          switch (breathPhase) {
            case "Inhale":
              return (breathingDef.hold ?? 0) > 0 ? (breathingDef.hold ?? 2) : breathingDef.exhale;
            case "Hold":
              return breathingDef.exhale;
            case "Exhale":
              return (breathingDef.rest ?? 0) > 0 ? (breathingDef.rest ?? 2) : breathingDef.inhale;
            case "Rest":
              return breathingDef.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathInterval);
  }, [isRunning, breathPhase, breathingDef]);

  const togglePlayPause = () => {
    if (isRunning) {
      setIsRunning(false);
      sanctuary2Narration.pause();
    } else {
      setIsRunning(true);
      sanctuary2Narration.resume();
    }
  };

  const handleRestart = () => {
    setSecondsRemaining(totalSeconds);
    setCurrentStageIndex(0);
    setStageSecondsRemaining(activeSession.stages[0]?.durationSeconds ?? 60);
    setIsRunning(true);
    sanctuary2Narration.stop();
    if (voiceEnabled && activeSession.stages[0]?.narration) {
      sanctuary2Narration.speak(activeSession.stages[0].narration);
    }
  };

  const handleSkipNextStage = () => {
    if (currentStageIndex < activeSession.stages.length - 1) {
      const nextIdx = currentStageIndex + 1;
      setCurrentStageIndex(nextIdx);
      setStageSecondsRemaining(activeSession.stages[nextIdx].durationSeconds);
      if (activeSession.stages[nextIdx]?.ambientSound) {
        setCurrentSound(activeSession.stages[nextIdx].ambientSound!);
        sanctuary2Audio.play(activeSession.stages[nextIdx].ambientSound!);
      }
    } else {
      handleFinishSession();
    }
  };

  const handleSoundChange = (sound: AmbientSoundType) => {
    setCurrentSound(sound);
    sanctuary2Audio.play(sound);
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    sanctuary2Audio.setVolume(newVal);
  };

  const handleToggleMute = () => {
    const muted = sanctuary2Audio.toggleMute();
    setIsMuted(muted);
  };

  const handleFinishSession = () => {
    sanctuary2Audio.playGentleChime();
    sanctuary2Narration.stop();
    openCompletionModal({
      sessionId: activeSession.id,
      sessionTitle: activeSession.title,
      technique: activeSession.technique,
      durationMinutes: activeDurationMinutes,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/95 backdrop-blur-2xl text-[#F5F5F5] select-none p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-gradient-to-tr from-[#FF3548]/10 via-transparent to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl h-full max-h-[850px] bg-[#111318]/90 border border-[#232733] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
        
        {/* Top Bar: Title, Category, Exit */}
        <div className="relative z-10 flex items-start justify-between border-b border-[#232733]/70 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#FF3548] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
                {activeSession.category}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {activeSession.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Countdown Display */}
            <div className="font-mono text-xl sm:text-2xl font-semibold text-[#FF3548] bg-[#171A21] px-3.5 py-1.5 rounded-xl border border-[#232733]">
              {formatTime(secondsRemaining)}
            </div>

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded-xl bg-[#171A21] hover:bg-[#232733] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close session"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Center: Breathing Ring & Synchronized Narration */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-4 sm:py-6 gap-6">
          {/* Animated Visual Breathing Ring */}
          <BreathingRing
            phase={breathPhase}
            counter={breathCounter}
            progressPercent={progressPercent}
            techniqueName={activeSession.title}
          />

          {/* Current Stage Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#FF3548] bg-[#FF3548]/10 px-2.5 py-1 rounded-md border border-[#FF3548]/20">
              Stage {currentStage.stageNumber} of {activeSession.stages.length}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {currentStage.title} ({formatTime(stageSecondsRemaining)} remaining)
            </span>
          </div>

          {/* Synchronized Stage Narration Card */}
          <div className="w-full max-w-2xl bg-[#171A21]/90 border border-[#232733] rounded-2xl p-4 sm:p-5 text-center shadow-lg transition-all">
            <p className="text-sm sm:text-base text-zinc-200 font-light leading-relaxed tracking-normal font-sans">
              "{currentStage.narration}"
            </p>
          </div>
        </div>

        {/* Bottom Control Bar: Media Controls, Audio selector, Volume */}
        <div className="relative z-10 border-t border-[#232733]/70 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left: Ambient Sound & Voice Narration controls */}
          <div className="flex items-center gap-3">
            {/* Ambient Sound Selector */}
            <div className="flex items-center bg-[#171A21] border border-[#232733] rounded-xl p-1 gap-1">
              {[
                { id: "rain", label: "Rain", icon: CloudRain },
                { id: "ocean", label: "Ocean", icon: Waves },
                { id: "wind", label: "Wind", icon: Wind },
                { id: "singing-bowl", label: "Bowl", icon: Bell },
                { id: "silence", label: "Mute", icon: VolumeX },
              ].map((snd) => {
                const Icon = snd.icon;
                const isSelected = currentSound === snd.id;
                return (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => handleSoundChange(snd.id as AmbientSoundType)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#FF3548] text-white shadow-xs"
                        : "text-zinc-400 hover:text-white hover:bg-[#232733]"
                    )}
                    title={snd.label}
                  >
                    <Icon size={13} />
                    <span className="hidden md:inline">{snd.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Voice Narration Toggle */}
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer",
                voiceEnabled
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-[#171A21] border-[#232733] text-zinc-400 hover:text-white"
              )}
              title={voiceEnabled ? "Voice Narration Enabled" : "Text Guided Only"}
            >
              {voiceEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              <span className="hidden sm:inline">
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </span>
            </button>
          </div>

          {/* Center: Main Play / Pause, Restart, Skip */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="p-3 rounded-full bg-[#171A21] hover:bg-[#232733] text-zinc-300 hover:text-white border border-[#232733] transition-colors cursor-pointer"
              title="Restart session"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="size-13 rounded-full bg-[#FF3548] hover:bg-[#E0283A] text-white flex items-center justify-center shadow-lg shadow-[#FF3548]/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title={isRunning ? "Pause" : "Play"}
            >
              {isRunning ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipNextStage}
              className="p-3 rounded-full bg-[#171A21] hover:bg-[#232733] text-zinc-300 hover:text-white border border-[#232733] transition-colors cursor-pointer"
              title="Skip to next stage"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Right: Master Volume Slider & End Session */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#171A21] border border-[#232733] px-3 py-1.5 rounded-xl">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-[#FF3548] cursor-pointer h-1.5 bg-[#232733] rounded-lg"
              />
            </div>

            <button
              type="button"
              onClick={handleFinishSession}
              className="px-3.5 py-2 rounded-xl bg-[#171A21] hover:bg-[#FF3548]/20 hover:border-[#FF3548]/50 text-zinc-300 hover:text-[#FF3548] border border-[#232733] text-xs font-semibold transition-all cursor-pointer"
            >
              Finish Early
            </button>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-[#090A0D]/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#171A21] border border-[#232733] rounded-2xl p-6 shadow-2xl text-center space-y-4">
              <div className="size-12 rounded-full bg-[#FF3548]/15 border border-[#FF3548]/30 text-[#FF3548] flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-white">End Session?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to exit your mental conditioning session? Your progress will be recorded.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#232733] hover:bg-[#2c3240] text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Continue Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleFinishSession();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-semibold cursor-pointer shadow-lg shadow-[#FF3548]/25"
                >
                  End & Reflect
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

