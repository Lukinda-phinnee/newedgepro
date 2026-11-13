export interface MeditationStage {
  id: string;
  stageNumber: number;
  title: string;
  durationSeconds: number;
  narration: string;
  breathingPattern: {
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
  };
}

export interface TechniqueTheme {
  /** Tailwind accent color name e.g. "emerald" "sky" "amber" "indigo" "teal" "violet" */
  accent: string;
  /** CSS gradient classes for the breathing orb core */
  orbGradient: string;
  /** Tailwind border color class when inhaling */
  orbBorderInhale: string;
  /** Outer pulsing ring classes when inhaling */
  ringInhale: string;
  /** Text color for accent labels */
  accentText: string;
  /** Active sound button background class */
  soundActiveBg: string;
  /** Active sound button text class */
  soundActiveText: string;
  /** Active voice toggle bg class */
  voiceActiveBg: string;
  /** Active voice toggle border class */
  voiceActiveBorder: string;
  /** Active voice toggle text class */
  voiceActiveText: string;
  /** Play button gradient classes */
  playButtonGradient: string;
  /** Finish button bg */
  finishButtonBg: string;
  /** Volume range accent color (hex) */
  accentHex: string;
  /** Dark backdrop gradient (from / via / to) */
  backdropGradient: string;
}

export interface TechniqueProfile {
  id: string;
  title: string;
  subtitle: string;
  category: "attention" | "mindfulness" | "bodyscan" | "breathing";
  defaultDurationMinutes: number;
  defaultSound: "rain" | "water" | "singing-bowl" | "wind" | "silence";
  defaultBreathing: {
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
  };
  stages: MeditationStage[];
  guidanceQuote: string;
  bgImageUrl: string;
  tradingContext: string;
  scientificObjective: string;
  theme: TechniqueTheme;
}

export const ALL_SANCTUARY_TECHNIQUES: Record<string, TechniqueProfile> = {
  "focused-attention": {
    id: "focused-attention",
    title: "Focused-Attention Meditation",
    subtitle: "Attention Training · Morning Focus",
    category: "attention",
    defaultDurationMinutes: 10,
    defaultSound: "rain",
    bgImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Morning or Pre-Chart Analysis",
    scientificObjective: "Train sustained focus by returning awareness to the breath whenever distraction or impulsive trade ideas arise.",
    defaultBreathing: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
    guidanceQuote: "Every time you notice distraction and return to the breath, you complete a repetition of mental discipline.",
    theme: {
      accent: "emerald",
      orbGradient: "from-[#1c3024]/90 via-[#14231a]/95 to-[#0b140f]/95",
      orbBorderInhale: "border-emerald-400/40",
      ringInhale: "border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_60px_rgba(52,211,153,0.18)]",
      accentText: "text-emerald-200",
      soundActiveBg: "bg-emerald-500",
      soundActiveText: "text-stone-900",
      voiceActiveBg: "bg-emerald-500/25",
      voiceActiveBorder: "border-emerald-400/50",
      voiceActiveText: "text-emerald-300",
      playButtonGradient: "from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300",
      finishButtonBg: "bg-emerald-500 hover:bg-emerald-400",
      accentHex: "#34d399",
      backdropGradient: "from-[#080d09]/95 via-[#0c140e]/75 to-[#080d09]/90",
    },
    stages: [
      {
        id: "fa-1",
        stageNumber: 1,
        title: "Preparation & Posture",
        durationSeconds: 60,
        narration:
          "Find a comfortable seated position. Keep your back naturally upright. Relax your shoulders and allow your hands to rest comfortably. You do not need to solve anything right now. You do not need to analyze the market. For the next few minutes, your only task is to train your attention.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
      },
      {
        id: "fa-2",
        stageNumber: 2,
        title: "Breathing Awareness",
        durationSeconds: 120,
        narration:
          "Bring your attention to your breathing. Notice the air entering your nose. Notice the air leaving your body. Allow your breathing to remain natural. Do not force it or attempt to control every breath. Simply observe.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
      },
      {
        id: "fa-3",
        stageNumber: 3,
        title: "Attention Training",
        durationSeconds: 240,
        narration:
          "Continue observing your breathing. Your mind may wander. You might think about a trade, a past loss, or an upcoming candle. That is normal. The moment you notice that your attention has wandered, acknowledge it. Then gently bring your attention back to your breathing.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
      },
      {
        id: "fa-4",
        stageNumber: 4,
        title: "Sustained Focus",
        durationSeconds: 120,
        narration:
          "Continue focusing on the natural rhythm of your breathing. Remain present. There is no need to chase thoughts or suppress them. Notice distraction. Return to your breathing. Practice patience.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
      },
      {
        id: "fa-5",
        stageNumber: 5,
        title: "Completion",
        durationSeconds: 60,
        narration:
          "Take a moment to recognize that you have completed this exercise. Slowly become aware of your surroundings. Gently open your eyes. Attention is something you can practice returning to, just like your trading rules.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
      },
    ],
  },
  "mindfulness": {
    id: "mindfulness",
    title: "Mindfulness Meditation",
    subtitle: "Emotional Regulation · Pre-Market Poise",
    category: "mindfulness",
    defaultDurationMinutes: 5,
    defaultSound: "water",
    bgImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "15 min Before London / NY Open",
    scientificObjective: "Observe fear, FOMO, and impatience as passing bodily sensations rather than instructions to click buy or sell.",
    defaultBreathing: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
    guidanceQuote: "An emotion is information, not an instruction. Your trading decisions must come from your predefined rules.",
    theme: {
      accent: "sky",
      orbGradient: "from-[#0a1f2e]/90 via-[#0d1a26]/95 to-[#070e18]/95",
      orbBorderInhale: "border-sky-400/40",
      ringInhale: "border-sky-400/30 bg-sky-500/10 shadow-[0_0_60px_rgba(56,189,248,0.18)]",
      accentText: "text-sky-200",
      soundActiveBg: "bg-sky-500",
      soundActiveText: "text-stone-900",
      voiceActiveBg: "bg-sky-500/25",
      voiceActiveBorder: "border-sky-400/50",
      voiceActiveText: "text-sky-300",
      playButtonGradient: "from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300",
      finishButtonBg: "bg-sky-500 hover:bg-sky-400",
      accentHex: "#38bdf8",
      backdropGradient: "from-[#07101a]/95 via-[#0c1a26]/75 to-[#07101a]/90",
    },
    stages: [
      {
        id: "mm-1",
        stageNumber: 1,
        title: "Centering & Stillness",
        durationSeconds: 60,
        narration:
          "Sit comfortably and bring your attention to the present moment. Notice your breathing. For the next few minutes, you are not required to make any decisions or pull any triggers. Simply observe what is happening within you.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
      },
      {
        id: "mm-2",
        stageNumber: 2,
        title: "Emotional Awareness",
        durationSeconds: 60,
        narration:
          "Notice what you are feeling right now. Are you calm, anxious, excited, impatient, or frustrated? There is no correct emotion to experience. Identify what is present without judging yourself.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
      },
      {
        id: "mm-3",
        stageNumber: 3,
        title: "Observe Without Reacting",
        durationSeconds: 120,
        narration:
          "Imagine that your thoughts and emotions are passing events. A thought about missing a trade may appear. A memory of a previous loss may appear. Notice each thought. You do not have to follow it. An emotion is information, not an instruction. Your trades come from rules, not impulse.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
      },
      {
        id: "mm-4",
        stageNumber: 4,
        title: "Completion",
        durationSeconds: 60,
        narration:
          "Take a natural breath. Recognize your current emotional state. You cannot control every feeling that arises, but you can choose how to respond. Return to the present moment. Open your eyes when ready.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
      },
    ],
  },
  "body-scan": {
    id: "body-scan",
    title: "Body Scan Meditation",
    subtitle: "Stress Awareness & Recovery · Post-Market",
    category: "bodyscan",
    defaultDurationMinutes: 5,
    defaultSound: "wind",
    bgImageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Post-Market Decompression",
    scientificObjective: "Identify physical tension in jaw, neck, and shoulders, downregulating post-market stress before leaving your desk.",
    defaultBreathing: { inhale: 4, hold: 1, exhale: 5, rest: 1 },
    guidanceQuote: "Your trading session has ended. Release accumulated muscular tension and do not carry it into your evening.",
    theme: {
      accent: "amber",
      orbGradient: "from-[#2e1c0a]/90 via-[#231408]/95 to-[#140b04]/95",
      orbBorderInhale: "border-amber-400/40",
      ringInhale: "border-amber-400/30 bg-amber-500/10 shadow-[0_0_60px_rgba(251,191,36,0.20)]",
      accentText: "text-amber-200",
      soundActiveBg: "bg-amber-500",
      soundActiveText: "text-stone-900",
      voiceActiveBg: "bg-amber-500/25",
      voiceActiveBorder: "border-amber-400/50",
      voiceActiveText: "text-amber-300",
      playButtonGradient: "from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300",
      finishButtonBg: "bg-amber-500 hover:bg-amber-400",
      accentHex: "#fbbf24",
      backdropGradient: "from-[#140a03]/95 via-[#1e1005]/75 to-[#140a03]/90",
    },
    stages: [
      {
        id: "bs-1",
        stageNumber: 1,
        title: "Body Grounding",
        durationSeconds: 30,
        narration:
          "Find a comfortable position. Allow your body to settle. Notice the points where your body makes contact with the chair or floor.",
        breathingPattern: { inhale: 4, hold: 1, exhale: 5, rest: 1 },
      },
      {
        id: "bs-2",
        stageNumber: 2,
        title: "Upper Body Awareness",
        durationSeconds: 120,
        narration:
          "Bring your attention to your forehead. Notice whether there is tension. Move your awareness to your eyes, jaw, and neck. Now notice your shoulders. If you identify tightness, allow those muscles to soften. Move to your chest and abdomen.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
      },
      {
        id: "bs-3",
        stageNumber: 3,
        title: "Lower Body Awareness",
        durationSeconds: 60,
        narration:
          "Bring your attention to your hands. Notice any tightness in fingers or palms. Move your awareness through your legs and down to your feet. Notice sensations without forcing relaxation.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
      },
      {
        id: "bs-4",
        stageNumber: 4,
        title: "Completion",
        durationSeconds: 90,
        narration:
          "Become aware of your entire body. Take a natural breath. Allow yourself to return to your surroundings. Your trading session has ended. You do not need to carry its tension into the rest of your day.",
        breathingPattern: { inhale: 4, hold: 1, exhale: 4, rest: 2 },
      },
    ],
  },
  "natural-breathing": {
    id: "natural-breathing",
    title: "Natural Breathing",
    subtitle: "Somatic Breathwork · Present Moment",
    category: "breathing",
    defaultDurationMinutes: 2,
    defaultSound: "singing-bowl",
    bgImageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Anytime during Trading Hours",
    scientificObjective: "Observe natural respiration rhythm without forcing or modifying rate. Establishes immediate baseline sensory presence.",
    defaultBreathing: { inhale: 3, hold: 1, exhale: 3, rest: 1 },
    guidanceQuote: "Observe natural respiration rhythm without forcing or modifying rate. Establishes immediate presence.",
    theme: {
      accent: "indigo",
      orbGradient: "from-[#1a1830]/90 via-[#131225]/95 to-[#0a0a1a]/95",
      orbBorderInhale: "border-indigo-400/40",
      ringInhale: "border-indigo-400/30 bg-indigo-500/10 shadow-[0_0_60px_rgba(129,140,248,0.18)]",
      accentText: "text-indigo-200",
      soundActiveBg: "bg-indigo-500",
      soundActiveText: "text-stone-900",
      voiceActiveBg: "bg-indigo-500/25",
      voiceActiveBorder: "border-indigo-400/50",
      voiceActiveText: "text-indigo-300",
      playButtonGradient: "from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300",
      finishButtonBg: "bg-indigo-500 hover:bg-indigo-400",
      accentHex: "#818cf8",
      backdropGradient: "from-[#080812]/95 via-[#0d0c1e]/75 to-[#080812]/90",
    },
    stages: [
      {
        id: "nb-1",
        stageNumber: 1,
        title: "Unforced Awareness",
        durationSeconds: 120,
        narration:
          "Allow your breath to flow naturally. Do not force an artificial depth or rhythm. Simply observe the cool sensation on inhale, and warm release on exhale. Rest in this natural cadence.",
        breathingPattern: { inhale: 3, hold: 1, exhale: 3, rest: 1 },
      },
    ],
  },
  "gentle-paced": {
    id: "gentle-paced",
    title: "Gentle Paced Breathing",
    subtitle: "Somatic Breathwork · 4s Inhale · 6s Exhale",
    category: "breathing",
    defaultDurationMinutes: 3,
    defaultSound: "water",
    bgImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Mid-Session Volatility or Choppy Range",
    scientificObjective: "Controlled 4-second inhalation followed by a 6-second slow exhalation down-regulates sympathetic adrenaline.",
    defaultBreathing: { inhale: 4, hold: 0, exhale: 6, rest: 0 },
    guidanceQuote: "Controlled 4-second inhalation followed by a 6-second slow exhalation down-regulates acute adrenaline.",
    theme: {
      accent: "teal",
      orbGradient: "from-[#0a2525]/90 via-[#081e1e]/95 to-[#051212]/95",
      orbBorderInhale: "border-teal-400/40",
      ringInhale: "border-teal-400/30 bg-teal-500/10 shadow-[0_0_60px_rgba(45,212,191,0.18)]",
      accentText: "text-teal-200",
      soundActiveBg: "bg-teal-500",
      soundActiveText: "text-stone-900",
      voiceActiveBg: "bg-teal-500/25",
      voiceActiveBorder: "border-teal-400/50",
      voiceActiveText: "text-teal-300",
      playButtonGradient: "from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300",
      finishButtonBg: "bg-teal-500 hover:bg-teal-400",
      accentHex: "#2dd4bf",
      backdropGradient: "from-[#040f10]/95 via-[#071818]/75 to-[#040f10]/90",
    },
    stages: [
      {
        id: "gp-1",
        stageNumber: 1,
        title: "Parasympathetic Pacing (4-6)",
        durationSeconds: 180,
        narration:
          "Inhale smoothly through your nose for 4 seconds... and gently exhale for 6 full seconds. Keep the transitions soft and unhurried. Feel your heart rate steadily down-regulate.",
        breathingPattern: { inhale: 4, hold: 0, exhale: 6, rest: 0 },
      },
    ],
  },
  "extended-exhale": {
    id: "extended-exhale",
    title: "Extended Exhalation",
    subtitle: "Somatic Breathwork · 4s Inhale · 7s Exhale",
    category: "breathing",
    defaultDurationMinutes: 2,
    defaultSound: "wind",
    bgImageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Post-Loss or Sudden Market Shock",
    scientificObjective: "Lengthening the exhale stimulates the vagus nerve, rapidly lowering elevated pulse and physical agitation.",
    defaultBreathing: { inhale: 4, hold: 1, exhale: 7, rest: 2 },
    guidanceQuote: "Lengthening the exhale stimulates the vagus nerve, rapidly lowering sympathetic nervous system arousal.",
    theme: {
      accent: "violet",
      orbGradient: "from-[#1e1030]/90 via-[#180c28]/95 to-[#0d0618]/95",
      orbBorderInhale: "border-violet-400/40",
      ringInhale: "border-violet-400/30 bg-violet-500/10 shadow-[0_0_60px_rgba(167,139,250,0.18)]",
      accentText: "text-violet-200",
      soundActiveBg: "bg-violet-500",
      soundActiveText: "text-stone-100",
      voiceActiveBg: "bg-violet-500/25",
      voiceActiveBorder: "border-violet-400/50",
      voiceActiveText: "text-violet-300",
      playButtonGradient: "from-violet-400 to-purple-400 hover:from-violet-300 hover:to-purple-300",
      finishButtonBg: "bg-violet-500 hover:bg-violet-400",
      accentHex: "#a78bfa",
      backdropGradient: "from-[#0c0614]/95 via-[#140a20]/75 to-[#0c0614]/90",
    },
    stages: [
      {
        id: "ee-1",
        stageNumber: 1,
        title: "Vagal Activation (4-1-7-2)",
        durationSeconds: 120,
        narration:
          "Inhale calm air for 4 seconds. Hold gently for 1 second. Now release slowly through parted lips for 7 seconds. Rest in stillness for 2 seconds. Feel physical tension dissolve.",
        breathingPattern: { inhale: 4, hold: 1, exhale: 7, rest: 2 },
      },
    ],
  },
};
