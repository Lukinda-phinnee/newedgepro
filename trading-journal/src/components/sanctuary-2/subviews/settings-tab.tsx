"use client";

import React, { useState } from "react";
import {
  Sliders,
  Volume2,
  Mic,
  Target,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Waves,
  Wind,
  Bell,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { AmbientSoundType } from "../sanctuary2-types";

export function SettingsTab() {
  const {
    settings,
    dailyTargetMinutes,
    updateSettings,
    resetAllData,
  } = useSanctuary2();

  const [confirmReset, setConfirmReset] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const triggerSaveToast = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSoundChange = (sound: AmbientSoundType) => {
    updateSettings({ defaultAmbientSound: sound });
    triggerSaveToast();
  };

  const handleVolumeChange = (vol: number) => {
    updateSettings({ defaultVolume: vol });
  };

  const handleVoiceToggle = () => {
    updateSettings({ voiceNarrationEnabled: !settings.voiceNarrationEnabled });
    triggerSaveToast();
  };

  const handleVoiceSpeedChange = (speed: number) => {
    updateSettings({ voiceSpeed: speed });
    triggerSaveToast();
  };

  const handleTargetChange = (mins: number) => {
    updateSettings({ dailyTargetMinutes: mins });
    triggerSaveToast();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
            <Sliders size={13} />
            <span>Preferences</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Conditioning Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-xl">
            Configure default acoustic background environments, AI voice speech parameters, and daily training quotas.
          </p>
        </div>

        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono animate-in fade-in">
            <CheckCircle2 size={13} />
            Saved Preference
          </span>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Card 1: Default Soundscape Environment */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Default Ambient Soundscape
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select which offline soundscape activates automatically when a guided session starts.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[
              { id: "rain", label: "Rain Noise", icon: CloudRain },
              { id: "ocean", label: "Ocean Waves", icon: Waves },
              { id: "wind", label: "Forest Wind", icon: Wind },
              { id: "singing-bowl", label: "Tibetan Bowl", icon: Bell },
              { id: "silence", label: "Silence", icon: VolumeX },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = settings.defaultAmbientSound === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSoundChange(item.id as AmbientSoundType)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#FF3548] border-[#FF3548] text-white shadow-md shadow-[#FF3548]/25"
                      : "bg-[#111318] border-[#232733] text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  <Icon size={18} className="mb-1.5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Master Volume */}
          <div className="pt-4 border-t border-[#232733] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <Volume2 size={16} className="text-zinc-500" />
              <span>Default Ambient Volume</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.defaultVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-48 h-2 rounded-lg accent-[#FF3548] bg-[#111318] cursor-pointer"
              />
              <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                {Math.round(settings.defaultVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Voice Narration Synthesis */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Guided Audio Speech Narration
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically reads timed meditation instructions via native speech synthesis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={cn(
                "px-3.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer",
                settings.voiceNarrationEnabled
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-[#111318] border-[#232733] text-zinc-500"
              )}
            >
              {settings.voiceNarrationEnabled ? "Narration Active" : "Text Guided Only"}
            </button>
          </div>

          {/* Voice cadence speed */}
          <div className="pt-3 border-t border-[#232733] flex items-center justify-between">
            <div className="text-xs text-zinc-300">
              <span>Narration Speech Cadence</span>
              <span className="block text-[11px] text-zinc-500">
                Pacing of guided instructions
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { speed: 0.8, label: "0.8x (Slow)" },
                { speed: 0.95, label: "1.0x (Calm)" },
                { speed: 1.15, label: "1.2x (Brisk)" },
              ].map((item) => (
                <button
                  key={item.speed}
                  type="button"
                  onClick={() => handleVoiceSpeedChange(item.speed)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer border",
                    settings.voiceSpeed === item.speed
                      ? "bg-[#FF3548] border-[#FF3548] text-white"
                      : "bg-[#111318] border-[#232733] text-zinc-400 hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Daily Target Minutes */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Daily Training Target
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target cumulative meditation minutes required to maintain your daily streak.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleTargetChange(mins)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer",
                  (settings.dailyTargetMinutes || dailyTargetMinutes) === mins
                    ? "bg-[#FF3548] border-[#FF3548] text-white shadow-xs"
                    : "bg-[#111318] border-[#232733] text-zinc-400 hover:text-white"
                )}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: Data Management & Reset */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Reset Local Conditioning Data
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Clear your recorded check-ins, routine customisations, and history from local storage.
            </p>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-[#232733] hover:border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-xl bg-[#111318] text-zinc-400 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-bold cursor-pointer shadow-md shadow-[#FF3548]/30"
              >
                Confirm Reset
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

