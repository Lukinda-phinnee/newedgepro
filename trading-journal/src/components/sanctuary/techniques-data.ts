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

export interface TechniqueProfile {
  id: string;
  title: string;
  subtitle: string;
  category: "attention" | "mindfulness" | "bodyscan" | "breathing";
  defaultDurationMinutes: number;
  defaultSound: "rain" | "ocean" | "singing-bowl" | "wind" | "silence";
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
    defaultSound: "ocean",
    bgImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "15 min Before London / NY Open",
    scientificObjective: "Observe fear, FOMO, and impatience as passing bodily sensations rather than instructions to click buy or sell.",
    defaultBreathing: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
    guidanceQuote: "An emotion is information, not an instruction. Your trading decisions must come from your predefined rules.",
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
    defaultSound: "ocean",
    bgImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2400&q=85",
    tradingContext: "Mid-Session Volatility or Choppy Range",
    scientificObjective: "Controlled 4-second inhalation followed by a 6-second slow exhalation down-regulates sympathetic adrenaline.",
    defaultBreathing: { inhale: 4, hold: 0, exhale: 6, rest: 0 },
    guidanceQuote: "Controlled 4-second inhalation followed by a 6-second slow exhalation down-regulates acute adrenaline.",
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
