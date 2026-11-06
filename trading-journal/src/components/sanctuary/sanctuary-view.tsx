"use client";

import { useState, useMemo } from "react";
import {
  Home,
  Flower2,
  Moon,
  Music,
  BookOpen,
  BarChart3,
  User,
  Search,
  Play,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Wind,
  Quote,
  Flame,
  Clock,
  Compass,
  Sliders,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MeditationSessionModal } from "@/components/sanctuary/meditation-session-modal";
import { SerenityAiDrawer } from "@/components/sanctuary/serenity-ai-drawer";
import { type AmbientSoundType } from "@/components/sanctuary/audio-synthesizer";

type SanctuaryTab = "home" | "meditate" | "sleep" | "music" | "journal" | "progress" | "serenity";

interface FocusCardItem {
  id: string;
  title: string;
  duration: string;
  minutes: number;
  bgGradient: string;
  imgUrl: string;
  category: "anxiety" | "sleep" | "mindful" | "selflove";
  sound: AmbientSoundType;
}

interface RecommendedItem {
  id: string;
  title: string;
  duration: string;
  minutes: number;
  imgUrl: string;
  sound: AmbientSoundType;
}

const TODAY_FOCUS_CARDS: FocusCardItem[] = [
  {
    id: "reduce-anxiety",
    title: "Reduce Anxiety",
    duration: "10 min",
    minutes: 10,
    bgGradient: "from-[#293d30]/70 via-[#1e2e24]/80 to-[#121c16]",
    imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    category: "anxiety",
    sound: "rain",
  },
  {
    id: "better-sleep",
    title: "Better Sleep",
    duration: "15 min",
    minutes: 15,
    bgGradient: "from-[#1b2b3a]/75 via-[#131d27]/85 to-[#0b1016]",
    imgUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    category: "sleep",
    sound: "ocean",
  },
  {
    id: "mindful-living",
    title: "Mindful Living",
    duration: "10 min",
    minutes: 10,
    bgGradient: "from-[#394a3d]/70 via-[#27342a]/80 to-[#161f18]",
    imgUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    category: "mindful",
    sound: "wind",
  },
  {
    id: "self-love",
    title: "Self Love",
    duration: "12 min",
    minutes: 12,
    bgGradient: "from-[#4a3430]/70 via-[#33221f]/80 to-[#1c1210]",
    imgUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80",
    category: "selflove",
    sound: "singing-bowl",
  },
];

const RECOMMENDED_CARDS: RecommendedItem[] = [
  {
    id: "morning-meditation",
    title: "Morning Meditation",
    duration: "10 min",
    minutes: 10,
    imgUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80",
    sound: "singing-bowl",
  },
  {
    id: "healing-music",
    title: "Healing Music",
    duration: "30 min",
    minutes: 30,
    imgUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    sound: "singing-bowl",
  },
  {
    id: "deep-sleep-sounds",
    title: "Deep Sleep Sounds",
    duration: "45 min",
    minutes: 45,
    imgUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    sound: "ocean",
  },
];

export function SanctuaryView() {
  const [activeTab, setActiveTab] = useState<SanctuaryTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSerenityOpen, setIsSerenityOpen] = useState(false);

  // Active Meditation Session Modal
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeSessionTitle, setActiveSessionTitle] = useState("Morning Meditation");
  const [activeDurationMin, setActiveDurationMin] = useState(10);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("rain");

  // Daily Progress State
  const [meditationMinutes, setMeditationMinutes] = useState(8);
  const targetMinutes = 10;
  const [mindfulnessTasks, setMindfulnessTasks] = useState(3);
  const targetTasks = 5;
  const sleepHours = 7;
  const targetSleep = 8;

  const progressPercent = useMemo(() => {
    const medRatio = Math.min(1, meditationMinutes / targetMinutes);
    const taskRatio = Math.min(1, mindfulnessTasks / targetTasks);
    const sleepRatio = Math.min(1, sleepHours / targetSleep);
    return Math.round(((medRatio + taskRatio + sleepRatio) / 3) * 100);
  }, [meditationMinutes, mindfulnessTasks]);

  // Dynamic Greeting based on current hour
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const handleStartSession = (title: string, durationMin: number, sound: AmbientSoundType = "rain") => {
    setActiveSessionTitle(title);
    setActiveDurationMin(durationMin);
    setActiveSound(sound);
    setIsSessionModalOpen(true);
  };

  const handleSessionComplete = (minutes: number) => {
    setMeditationMinutes((prev) => prev + minutes);
    setMindfulnessTasks((prev) => Math.min(targetTasks, prev + 1));
  };

  return (
    <div className="relative w-full max-w-none h-full min-h-0 flex flex-col xl:flex-row gap-5 overflow-y-auto no-scrollbar pb-10 text-stone-800 dark:text-stone-100 font-sans select-none">
      {/* ─── LEFT NAVIGATION RAIL / SIDEBAR ─── */}
      <nav
        aria-label="Sanctuary Navigation"
        className="shrink-0 xl:w-24 w-full flex xl:flex-col flex-row items-center justify-between xl:justify-start gap-1 p-2 rounded-3xl bg-[#ece7de]/80 dark:bg-[#18231c]/80 backdrop-blur-xl border border-stone-300/40 dark:border-stone-800/60 shadow-sm"
      >
        <div className="flex xl:flex-col flex-row items-center gap-1.5 w-full">
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "meditate", label: "Meditate", icon: Flower2 },
            { id: "sleep", label: "Sleep", icon: Moon },
            { id: "music", label: "Music", icon: Music },
            { id: "journal", label: "Journal", icon: BookOpen },
            { id: "serenity", label: "Serenity AI", icon: Sparkles, highlight: true },
            { id: "progress", label: "Progress", icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "serenity") {
                    setIsSerenityOpen(true);
                  } else {
                    setActiveTab(item.id as SanctuaryTab);
                  }
                }}
                className={cn(
                  "flex xl:flex-col flex-row items-center justify-center gap-1 py-2 px-3 xl:py-2.5 xl:w-full rounded-2xl text-[11px] font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-[#2d4936] text-white shadow-md shadow-[#2d4936]/25"
                    : item.highlight
                    ? "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-300/30 dark:hover:bg-stone-800/40"
                )}
              >
                <Icon size={17} className={cn(item.highlight && !isActive && "text-emerald-500 animate-pulse")} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="xl:mt-auto hidden xl:flex flex-col items-center gap-1.5 pt-3 border-t border-stone-300/50 dark:border-stone-800/60 w-full">
          <button
            type="button"
            onClick={() => setIsSerenityOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2 w-full rounded-2xl text-[10px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
          >
            <User size={16} />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* ─── MAIN SANCTUARY CANVAS ─── */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Top Search & Profile Bar */}
        <header className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calm, soundscapes, breathwork..."
              className="w-full h-10 pl-9 pr-4 rounded-full bg-[#ece7de]/80 dark:bg-[#18231c]/80 border border-stone-300/40 dark:border-stone-800/60 text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:border-emerald-600/50 transition-colors backdrop-blur-md shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSerenityOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-600/25 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Serenity AI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSerenityOpen(true)}
              className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 text-white text-xs font-semibold shadow-xs hover:scale-105 transition-transform cursor-pointer"
            >
              <User size={15} />
            </button>
          </div>
        </header>

        {/* ─── HERO CARD ("A Calmer You Today") ─── */}
        <section className="relative w-full rounded-3xl overflow-hidden bg-[#243d2d] text-white shadow-xl min-h-[290px] flex flex-col justify-between p-6 sm:p-8">
          {/* Nature Landscape Photography Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80")',
            }}
          />
          {/* Organic Vignette Gradient & Curved Cutout Layer */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#17271d]/95 via-[#1d3125]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14231a] via-transparent to-black/20" />

          {/* Organic Top Flourish */}
          <div className="relative z-10 flex items-start justify-between">
            <span className="text-xs uppercase tracking-widest font-mono text-emerald-300/90 font-medium">
              {timeGreeting}
            </span>

            {/* Script Leaf Quote */}
            <div className="hidden sm:flex items-center gap-2 text-emerald-100/80 font-serif italic text-xs tracking-wide">
              <span>Breathe · Exhale · Be Present</span>
              <Flower2 size={13} className="text-emerald-300 opacity-80" />
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-10 max-w-lg mt-6">
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-white drop-shadow-sm leading-tight">
              A Calmer You Today
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-200/90 font-light leading-relaxed max-w-md">
              Small moments. Big changes. Breathe, be present, and feel better.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStartSession("A Calmer You Today", 10, "rain")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e3425] hover:bg-[#16271c] text-white text-xs font-semibold shadow-lg shadow-black/30 border border-emerald-400/30 transition-all transform hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-[#1e3425]">
                  <Play size={10} className="fill-current ml-0.5" />
                </span>
                <span>Start Meditation</span>
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

        {/* ─── SECTION 1: TODAY'S FOCUS ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Today's Focus
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("meditate")}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {TODAY_FOCUS_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => handleStartSession(card.title, card.minutes, card.sound)}
                className="group relative h-48 rounded-2xl overflow-hidden border border-stone-300/40 dark:border-stone-800/60 shadow-xs cursor-pointer flex flex-col justify-end p-4 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-108"
                  style={{ backgroundImage: `url("${card.imgUrl}")` }}
                />
                {/* Dark Vignette Overlay */}
                <div className={cn("absolute inset-0 bg-gradient-to-t", card.bgGradient)} />

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-sm font-serif font-medium text-white leading-tight">
                    {card.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-white/75 font-mono">
                    <span>{card.duration}</span>
                    <span className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={10} className="fill-current ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 2: DAILY PROGRESS & MINDFUL QUOTE (SIDE BY SIDE) ─── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Card: Daily Progress */}
          <div className="p-5 rounded-3xl bg-[#ece7de]/80 dark:bg-[#18231c]/80 border border-stone-300/40 dark:border-stone-800/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Daily Progress
              </h3>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {progressPercent}% Complete
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* Radial Progress Ring */}
              <div className="relative size-24 shrink-0 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-stone-300/60 dark:text-stone-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Arc */}
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

              {/* Progress Breakdown Breakdown */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <span className="size-2 rounded-full bg-[#2d4936] dark:bg-emerald-400" />
                    Meditation
                  </span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">
                    {meditationMinutes} / {targetMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Mindfulness
                  </span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">
                    {mindfulnessTasks} / {targetTasks} tasks
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <span className="size-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                    Sleep
                  </span>
                  <span className="font-mono text-stone-800 dark:text-stone-200">
                    {sleepHours} / {targetSleep} hours
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Mindful Quote */}
          <div className="relative p-6 rounded-3xl bg-[#dbe3db]/90 dark:bg-[#1a2b20]/90 border border-stone-300/40 dark:border-stone-800/60 shadow-xs overflow-hidden flex flex-col justify-between">
            {/* Background Botanical Silhouette */}
            <div className="absolute -right-6 -bottom-6 size-40 opacity-15 dark:opacity-20 pointer-events-none text-[#2d4936] dark:text-emerald-300">
              <Flower2 size={160} />
            </div>

            <div className="relative z-10 flex items-start gap-2 text-emerald-800 dark:text-emerald-400">
              <Quote size={20} className="shrink-0 rotate-180" />
            </div>

            <div className="relative z-10 my-3">
              <blockquote className="text-lg font-serif italic text-stone-900 dark:text-stone-100 leading-snug">
                "A calmer mind creates a brighter life."
              </blockquote>
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 font-sans">
                Notice the urge to react. Breathe into the space between impulse and execution.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-stone-300/40 dark:border-stone-800/40 text-[11px] text-stone-500 dark:text-stone-400">
              <span>Serenity Wisdom</span>
              <button
                type="button"
                onClick={() => handleStartSession("Mindful Reset", 5, "singing-bowl")}
                className="text-emerald-800 dark:text-emerald-300 font-medium hover:underline cursor-pointer"
              >
                Take a 5-min pause →
              </button>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: RECOMMENDED FOR YOU ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Recommended for You
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("music")}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {RECOMMENDED_CARDS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleStartSession(item.title, item.minutes, item.sound)}
                className="group relative h-40 rounded-2xl overflow-hidden border border-stone-300/40 dark:border-stone-800/60 shadow-xs cursor-pointer flex flex-col justify-end p-4 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Backdrop Photo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-108"
                  style={{ backgroundImage: `url("${item.imgUrl}")` }}
                />
                {/* Gradient Shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <h3 className="text-sm font-serif font-medium text-white leading-tight">
                      {item.title}
                    </h3>
                    <span className="text-[11px] font-mono text-white/70 mt-0.5 block">
                      {item.duration}
                    </span>
                  </div>

                  <span className="flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white group-hover:bg-white group-hover:text-stone-900 transition-all shadow-sm">
                    <Play size={12} className="fill-current ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── LIVE MEDITATION PLAYER MODAL (BREATHWORK + AUDIO SYNTHESIZER) ─── */}
      <MeditationSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
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

