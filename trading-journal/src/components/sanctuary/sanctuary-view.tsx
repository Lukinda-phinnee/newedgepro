"use client";

import { useState, useMemo } from "react";
import {
  Flower2,
  Play,
  Sparkles,
  ArrowRight,
  Quote,
  Brain,
  Wind,
  Target,
  Shield,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MeditationSessionModal } from "@/components/sanctuary/meditation-session-modal";
import { SerenityAiDrawer } from "@/components/sanctuary/serenity-ai-drawer";
import { type AmbientSoundType } from "@/components/sanctuary/audio-synthesizer";

interface TradingTechniqueItem {
  id: string;
  title: string;
  subtitle: string;
  category: "attention" | "mindfulness" | "bodyscan";
  duration: string;
  minutes: number;
  purpose: string;
  tradingContext: string;
  bgGradient: string;
  imgUrl: string;
  sound: AmbientSoundType;
}

interface BreathingExerciseItem {
  id: string;
  title: string;
  pacing: string;
  duration: string;
  minutes: number;
  purpose: string;
  imgUrl: string;
  sound: AmbientSoundType;
}

// Exactly the 3 Core Trader Meditation Techniques from specification
const CORE_TECHNIQUES: TradingTechniqueItem[] = [
  {
    id: "focused-attention",
    title: "Focused-Attention",
    subtitle: "Attention Training",
    category: "attention",
    duration: "10 min",
    minutes: 10,
    purpose: "Train sustained focus by returning awareness to the breath whenever distraction arises.",
    tradingContext: "Morning or Pre-Chart Analysis",
    bgGradient: "from-[#1a2f23]/90 via-[#132219]/85 to-[#0b140f]/95",
    imgUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    sound: "rain",
  },
  {
    id: "mindfulness",
    title: "Mindfulness Meditation",
    subtitle: "Emotional Regulation",
    category: "mindfulness",
    duration: "5 min",
    minutes: 5,
    purpose: "Observe fear, FOMO, and impatience as passing information rather than instructions to trade.",
    tradingContext: "15 min Before London / NY Open",
    bgGradient: "from-[#1b2b3a]/90 via-[#131d27]/85 to-[#0b1016]/95",
    imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    sound: "ocean",
  },
  {
    id: "body-scan",
    title: "Body Scan Meditation",
    subtitle: "Stress Awareness & Recovery",
    category: "bodyscan",
    duration: "5 min",
    minutes: 5,
    purpose: "Identify physical tension in jaw, neck, and shoulders, downregulating post-market stress.",
    tradingContext: "Post-Market Decompression",
    bgGradient: "from-[#3a2824]/90 via-[#271b18]/85 to-[#160f0d]/95",
    imgUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80",
    sound: "wind",
  },
];

// The 3 Somatic Breathing Exercises
const BREATHING_EXERCISES: BreathingExerciseItem[] = [
  {
    id: "natural-breathing",
    title: "Natural Breathing",
    pacing: "Natural rhythm",
    duration: "2 min",
    minutes: 2,
    purpose: "Notice the breath without changing rate. Cultivates immediate present-moment awareness.",
    imgUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80",
    sound: "singing-bowl",
  },
  {
    id: "gentle-paced",
    title: "Gentle Paced Breathing",
    pacing: "4s Inhale · 6s Exhale",
    duration: "3 min",
    minutes: 3,
    purpose: "Smooth parasympathetic pacing to quickly counteract sudden adrenaline spikes.",
    imgUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    sound: "ocean",
  },
  {
    id: "extended-exhale",
    title: "Extended Exhalation",
    pacing: "4s Inhale · 7s Exhale",
    duration: "2 min",
    minutes: 2,
    purpose: "Stimulates vagus nerve activation, lowering heart rate after high volatility trades.",
    imgUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    sound: "wind",
  },
];

export function SanctuaryView() {
  const [isSerenityOpen, setIsSerenityOpen] = useState(false);

  // Active Meditation Session Modal
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeTechniqueId, setActiveTechniqueId] = useState("focused-attention");
  const [activeSessionTitle, setActiveSessionTitle] = useState("Focused-Attention Meditation");
  const [activeDurationMin, setActiveDurationMin] = useState(10);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("rain");

  // Daily Progress State
  const [completedMinutes, setCompletedMinutes] = useState(10);
  const dailyTargetMinutes = 20;

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round((completedMinutes / dailyTargetMinutes) * 100));
  }, [completedMinutes]);

  // Dynamic Greeting based on current hour
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const handleStartSession = (
    idOrTitle: string,
    titleOrDuration?: string | number,
    durationOrSound?: number | AmbientSoundType,
    sound?: AmbientSoundType
  ) => {
    let techId = "focused-attention";
    let title = "Focused-Attention Meditation";
    let duration = 10;
    let snd: AmbientSoundType = "rain";

    if (typeof titleOrDuration === "string") {
      // 4-arg signature: (techId, title, duration, sound)
      techId = idOrTitle;
      title = titleOrDuration;
      duration = typeof durationOrSound === "number" ? durationOrSound : 10;
      snd = sound ?? "rain";
    } else {
      // 2 or 3 arg signature: (title, duration, sound)
      title = idOrTitle;
      duration = typeof titleOrDuration === "number" ? titleOrDuration : 10;
      snd = (typeof durationOrSound === "string" ? durationOrSound : "rain") as AmbientSoundType;

      if (title.toLowerCase().includes("mindful")) techId = "mindfulness";
      else if (title.toLowerCase().includes("body")) techId = "body-scan";
      else if (title.toLowerCase().includes("natural")) techId = "natural-breathing";
      else if (title.toLowerCase().includes("gentle") || title.toLowerCase().includes("paced")) techId = "gentle-paced";
      else if (title.toLowerCase().includes("exhale")) techId = "extended-exhale";
      else techId = "focused-attention";
    }

    setActiveTechniqueId(techId);
    setActiveSessionTitle(title);
    setActiveDurationMin(duration);
    setActiveSound(snd);
    setIsSessionModalOpen(true);
  };

  const handleSessionComplete = (minutes: number) => {
    setCompletedMinutes((prev) => prev + minutes);
  };

  return (
    <div className="relative w-full max-w-none h-full min-h-0 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-24 text-stone-800 dark:text-stone-100 font-sans select-none">

      {/* ─── HERO CARD: DISCIPLINED MINDSET ─── */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-[#1e3425] text-white shadow-xl min-h-[270px] flex flex-col justify-between p-6 sm:p-8">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#112017]/95 via-[#182d20]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a12] via-transparent to-black/20" />

        {/* Top Flourish */}
        <div className="relative z-10 flex items-start justify-between">
          <span className="text-xs uppercase tracking-widest font-mono text-emerald-300 font-medium">
            {timeGreeting} · Trader Equilibrium
          </span>

          <div className="hidden sm:flex items-center gap-2 text-emerald-100/80 font-serif italic text-xs tracking-wide">
            <span>Notice Impulse · Breathe · Follow Plan</span>
            <Flower2 size={13} className="text-emerald-300 opacity-80" />
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 max-w-xl mt-5">
          <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-white drop-shadow-sm leading-tight">
            Train Your Mind. Execute With Discipline.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-200/90 font-light leading-relaxed max-w-md">
            Three guided mental conditioning techniques designed to help Forex traders build emotional regulation, sustained attention, and calm execution.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleStartSession("focused-attention", "Focused-Attention Meditation", 10, "rain")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e3425] hover:bg-[#16271c] text-white text-xs font-semibold shadow-lg shadow-black/30 border border-emerald-400/30 transition-all transform hover:scale-102 active:scale-98 cursor-pointer"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-[#1e3425]">
                <Play size={10} className="fill-current ml-0.5" />
              </span>
              <span>Start 10m Morning Focus</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSerenityOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
            >
              <Sparkles size={12} className="text-emerald-300" />
              <span>Talk to Serenity</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: THE 3 CORE MEDITATION TECHNIQUES ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Core Meditation Techniques</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                3 Techniques
              </span>
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Purpose-built for attention training, pre-market emotional regulation, and post-trade tension release.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CORE_TECHNIQUES.map((tech) => (
            <div
              key={tech.id}
              onClick={() => handleStartSession(tech.id, tech.title, tech.minutes, tech.sound)}
              className="group relative min-h-[220px] rounded-3xl overflow-hidden border border-stone-300/40 dark:border-stone-800/60 shadow-xs cursor-pointer flex flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Background Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-108"
                style={{ backgroundImage: `url("${tech.imgUrl}")` }}
              />
              {/* Dark Vignette Overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-t", tech.bgGradient)} />

              {/* Top Tag & Duration */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/90 font-medium bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  {tech.subtitle}
                </span>
                <span className="text-xs font-mono text-white/90 font-semibold bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {tech.duration}
                </span>
              </div>

              {/* Bottom Content & Play Action */}
              <div className="relative z-10 pt-4">
                <h3 className="text-base font-serif font-medium text-white leading-tight">
                  {tech.title}
                </h3>
                <p className="mt-1 text-xs text-white/80 leading-relaxed font-sans line-clamp-2">
                  {tech.purpose}
                </p>

                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] font-mono text-white/70">
                  <span>{tech.tradingContext}</span>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#1e3425] shadow-md group-hover:scale-110 transition-transform">
                    <Play size={10} className="fill-current ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 2: SOMATIC BREATHWORK EXERCISES ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Wind size={15} className="text-teal-600 dark:text-teal-400" />
              <span>Somatic Breathing Exercises</span>
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Quick 2-to-3 minute physiological resets to settle acute market adrenaline.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {BREATHING_EXERCISES.map((ex) => (
            <div
              key={ex.id}
              onClick={() => handleStartSession(ex.id, ex.title, ex.minutes, ex.sound)}
              className="group relative h-40 rounded-2xl overflow-hidden border border-stone-300/40 dark:border-stone-800/60 shadow-xs cursor-pointer flex flex-col justify-between p-4 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Photo Backdrop */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-108"
                style={{ backgroundImage: `url("${ex.imgUrl}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Pacing Badge */}
              <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-white/80">
                <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                  {ex.pacing}
                </span>
                <span>{ex.duration}</span>
              </div>

              {/* Title & Start */}
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <h3 className="text-sm font-serif font-medium text-white leading-tight">
                    {ex.title}
                  </h3>
                  <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                    {ex.purpose}
                  </p>
                </div>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white group-hover:bg-white group-hover:text-stone-900 transition-all shrink-0 ml-2">
                  <Play size={10} className="fill-current ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 3: DAILY PROGRESS & TRADER WISDOM (SIDE BY SIDE) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Daily Training Progress */}
        <div className="p-5 rounded-3xl bg-[#ece7de]/80 dark:bg-[#18231c]/80 border border-stone-300/40 dark:border-stone-800/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Daily Mental Conditioning
            </h3>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {progressPercent}% Target
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Radial Progress Ring */}
            <div className="relative size-24 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-stone-300/60 dark:text-stone-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#2d4936] dark:text-emerald-400 transition-all duration-700"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <span className="size-2 rounded-full bg-[#2d4936] dark:bg-emerald-400" />
                  Today Completed
                </span>
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {completedMinutes} min
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Daily Target
                </span>
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {dailyTargetMinutes} min
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <span className="size-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                  Remaining
                </span>
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {Math.max(0, dailyTargetMinutes - completedMinutes)} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Trader Mindset Wisdom Quote */}
        <div className="relative p-6 rounded-3xl bg-[#dbe3db]/90 dark:bg-[#1a2b20]/90 border border-stone-300/40 dark:border-stone-800/60 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 size-40 opacity-15 dark:opacity-20 pointer-events-none text-[#2d4936] dark:text-emerald-300">
            <Flower2 size={160} />
          </div>

          <div className="relative z-10 flex items-start gap-2 text-emerald-800 dark:text-emerald-400">
            <Quote size={20} className="shrink-0 rotate-180" />
          </div>

          <div className="relative z-10 my-3">
            <blockquote className="text-base sm:text-lg font-serif italic text-stone-900 dark:text-stone-100 leading-snug">
              "An emotion is information, not an instruction. Trade your plan, not your impulse."
            </blockquote>
            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 font-sans">
              Notice the urge to react. Breathe into the space between impulse and execution.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-stone-300/40 dark:border-stone-800/40 text-[11px] text-stone-500 dark:text-stone-400">
            <span>Trading Psychology</span>
            <button
              type="button"
              onClick={() => handleStartSession("mindfulness", "Mindfulness Meditation", 5, "ocean")}
              className="text-emerald-800 dark:text-emerald-300 font-medium hover:underline cursor-pointer"
            >
              Take a 5-min pre-trade pause →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FLOATING SERENITY AI TRIGGER ─── */}
      <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8 group">
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-emerald-500/40 via-teal-400/30 to-emerald-500/40 blur-md opacity-70 group-hover:opacity-100 transition-all duration-500 animate-pulse pointer-events-none" />

        <button
          type="button"
          onClick={() => setIsSerenityOpen((prev) => !prev)}
          aria-label="Open Serenity AI"
          className="relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#172b1f] via-[#1f3b2a] to-[#14261b] text-white shadow-2xl shadow-black/50 border border-emerald-400/40 hover:border-emerald-300 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-400" />
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles size={15} className="animate-pulse" />
          </span>
          <div className="text-left pr-1">
            <div className="text-xs font-serif font-medium leading-none text-white tracking-wide">
              Serenity AI
            </div>
            <div className="text-[10px] text-emerald-300/80 font-sans tracking-tight mt-1">
              Mental Equilibrium
            </div>
          </div>
        </button>
      </div>

      {/* ─── LIVE MEDITATION PLAYER MODAL (BREATHWORK + AUDIO SYNTHESIZER) ─── */}
      <MeditationSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        techniqueId={activeTechniqueId}
        sessionTitle={activeSessionTitle}
        durationMinutes={activeDurationMin}
        initialSound={activeSound}
        onComplete={handleSessionComplete}
      />

      {/* ─── SERENITY AI MINDFULNESS CHAT DRAWER ─── */}
      <SerenityAiDrawer
        isOpen={isSerenityOpen}
        onClose={() => setIsSerenityOpen(false)}
        onStartMeditation={handleStartSession}
      />
    </div>
  );
}
