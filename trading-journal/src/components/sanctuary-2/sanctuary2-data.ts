import { MeditationSessionDef, RoutineItem } from "./sanctuary2-types";

export const MEDITATION_SESSIONS: MeditationSessionDef[] = [
  {
    id: "focused-attention",
    technique: "focused-attention",
    title: "Focused-Attention Meditation",
    category: "Attention Training",
    defaultDurationMinutes: 10,
    shortDescription:
      "Train sustained attention by repeatedly returning awareness to one selected object, natural breathing.",
    scientificPurpose:
      "Develop attention regulation, concentration, awareness of distraction, and cognitive control. Notice when attention wanders and deliberately return it without self-judgment.",
    expectedOutcome:
      "Sharpened intraday focus, reduced susceptibility to market noise, and enhanced capacity to wait for high-probability setups.",
    recommendedTradingContext:
      "Morning session or immediately before opening trading charts.",
    tradingApplications: [
      "Overcoming mid-session attention drift",
      "Disciplined execution of trading plan checklists",
      "Resisting urge to take impulsive low-conviction trades",
      "Strengthening sustained screen focus during active London/NY sessions",
    ],
    stages: [
      {
        id: "fa-1",
        stageNumber: 1,
        title: "Preparation",
        durationSeconds: 60,
        narration:
          "Find a comfortable seated position. Keep your back naturally upright. Relax your shoulders and allow your hands to rest comfortably. Gently close your eyes or lower your gaze. You do not need to solve anything right now. You do not need to analyze the market. For the next few minutes, your only task is to train your attention.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
        ambientSound: "rain",
      },
      {
        id: "fa-2",
        stageNumber: 2,
        title: "Breathing Awareness",
        durationSeconds: 120,
        narration:
          "Bring your attention to your breathing. Notice the air entering your nose. Notice the air leaving your body. Allow your breathing to remain natural. Do not force it or attempt to control every breath. Simply observe.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
        ambientSound: "rain",
      },
      {
        id: "fa-3",
        stageNumber: 3,
        title: "Attention Training",
        durationSeconds: 240,
        narration:
          "Continue observing your breathing. Your mind may wander. You might think about a potential trade, a previous loss, an upcoming opportunity or something completely unrelated. That is normal. The moment you notice that your attention has wandered, acknowledge it. Then gently bring your attention back to your breathing. Every time you return your attention, you complete another repetition of mental training.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
        ambientSound: "rain",
      },
      {
        id: "fa-4",
        stageNumber: 4,
        title: "Sustained Focus",
        durationSeconds: 120,
        narration:
          "Continue focusing on the natural rhythm of your breathing. Remain present. There is no need to chase thoughts or suppress them. Notice distraction. Return to your breathing. Practice patience.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
        ambientSound: "rain",
      },
      {
        id: "fa-5",
        stageNumber: 5,
        title: "Completion",
        durationSeconds: 60,
        narration:
          "Take a moment to recognize that you have completed this exercise. Slowly become aware of your surroundings. Gently open your eyes. Remember: attention is something you can practice returning to, just as you practiced returning to your breathing.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
        ambientSound: "singing-bowl",
      },
    ],
  },
  {
    id: "mindfulness",
    technique: "mindfulness",
    title: "Mindfulness Meditation",
    category: "Emotional Regulation",
    defaultDurationMinutes: 5,
    shortDescription:
      "Develop awareness of thoughts, emotions and physical sensations without automatically reacting to them.",
    scientificPurpose:
      "Train the gap between stimulus and response. De-couple somatic emotional impulses from physical keyboard and mouse execution.",
    expectedOutcome:
      "Ability to feel fear, greed, or FOMO without permitting them to alter risk parameters or order placement.",
    recommendedTradingContext:
      "Pre-Market Preparation (15-30 minutes before London or New York open).",
    tradingApplications: [
      "Fear before pulling the trigger on a valid edge setup",
      "Euphoria / Greed after banking an oversized win",
      "Frustration after suffering a stop-loss hit",
      "Impatience while waiting through low-liquidity consolidations",
      "Fear of missing out (FOMO) when watching unexpected candles spike",
    ],
    stages: [
      {
        id: "mm-1",
        stageNumber: 1,
        title: "Preparation",
        durationSeconds: 60,
        narration:
          "Sit comfortably and bring your attention to the present moment. Notice your breathing. For the next few minutes, you are not required to make any decisions. Simply observe what is happening within you.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
        ambientSound: "ocean",
      },
      {
        id: "mm-2",
        stageNumber: 2,
        title: "Emotional Awareness",
        durationSeconds: 60,
        narration:
          "Notice what you are feeling right now. Are you calm, anxious, excited, impatient or frustrated? There is no correct emotion to experience. Identify what is present without judging yourself.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 5, rest: 2 },
        ambientSound: "ocean",
      },
      {
        id: "mm-3",
        stageNumber: 3,
        title: "Observe Without Reacting",
        durationSeconds: 120,
        narration:
          "Imagine that your thoughts and emotions are passing events. A thought about missing a trade may appear. A memory of a previous loss may appear. Excitement about a potential opportunity may appear. Notice each thought. You do not have to follow it. You do not have to act on it. An emotion is information, not an instruction. Your trading decisions must come from your predefined trading rules, not from the intensity of your emotions.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
        ambientSound: "ocean",
      },
      {
        id: "mm-4",
        stageNumber: 4,
        title: "Completion",
        durationSeconds: 60,
        narration:
          "Take a natural breath. Recognize your current emotional state. You cannot control every emotion that appears, but you can practice choosing how to respond. Return your attention to the present moment. When you are ready, gently open your eyes.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 4, rest: 2 },
        ambientSound: "singing-bowl",
      },
    ],
  },
  {
    id: "body-scan",
    technique: "body-scan",
    title: "Body Scan Meditation",
    category: "Stress Awareness & Recovery",
    defaultDurationMinutes: 5,
    shortDescription:
      "Develop direct sensory awareness of physical tension, jaw clenching, and bodily stress patterns.",
    scientificPurpose:
      "Interoceptive regulation to reset the autonomic nervous system and downregulate cortisol following high-intensity market engagement.",
    expectedOutcome:
      "Rapid release of trade-induced muscular tightness and clear psychological boundary between the trading desk and personal life.",
    recommendedTradingContext:
      "Post-Market Recovery immediately upon closing terminal orders.",
    tradingApplications: [
      "Post-session cognitive and nervous system decompression",
      "Recognizing accumulated physical strain from high volatility",
      "Identifying somatic warning signs of tilt before it spills over",
      "De-escalating emotional charge after an adverse market move",
    ],
    stages: [
      {
        id: "bs-1",
        stageNumber: 1,
        title: "Preparation",
        durationSeconds: 30,
        narration:
          "Find a comfortable position. Allow your body to settle. Notice the points where your body makes contact with the chair or floor.",
        breathingPattern: { inhale: 4, hold: 1, exhale: 5, rest: 1 },
        ambientSound: "wind",
      },
      {
        id: "bs-2",
        stageNumber: 2,
        title: "Upper Body Awareness",
        durationSeconds: 120,
        narration:
          "Bring your attention to your forehead. Notice whether there is tension. Move your awareness to your eyes, jaw and neck. Now notice your shoulders. If you identify tension, allow those muscles to soften if comfortable. Move your attention to your chest and abdomen. Notice your breathing without forcing it.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
        ambientSound: "wind",
      },
      {
        id: "bs-3",
        stageNumber: 3,
        title: "Lower Body Awareness",
        durationSeconds: 60,
        narration:
          "Bring your attention to your hands. Notice any tightness. Move your awareness through your legs and down to your feet. Notice the sensations present. There is no need to force relaxation.",
        breathingPattern: { inhale: 4, hold: 2, exhale: 6, rest: 2 },
        ambientSound: "wind",
      },
      {
        id: "bs-4",
        stageNumber: 4,
        title: "Completion",
        durationSeconds: 90,
        narration:
          "Become aware of your entire body. Notice whether anything feels different. Take a natural breath. Allow yourself to return to your surroundings. When you are ready, open your eyes. Your trading session has ended. You do not need to carry its tension into the rest of your day.",
        breathingPattern: { inhale: 4, hold: 1, exhale: 4, rest: 2 },
        ambientSound: "singing-bowl",
      },
    ],
  },
];

export const DEFAULT_ROUTINE_ITEMS: RoutineItem[] = [
  {
    id: "routine-morning",
    name: "Morning Focus Routine",
    sessionId: "focused-attention",
    technique: "focused-attention",
    durationMinutes: 10,
    preferredTime: "07:30",
    tradingContext: "morning",
    enabled: true,
    reminder: true,
  },
  {
    id: "routine-premarket",
    name: "Pre-Market Preparation",
    sessionId: "mindfulness",
    technique: "mindfulness",
    durationMinutes: 5,
    preferredTime: "08:45",
    tradingContext: "pre-market",
    enabled: true,
    reminder: true,
  },
  {
    id: "routine-postmarket",
    name: "Post-Market Decompression",
    sessionId: "body-scan",
    technique: "body-scan",
    durationMinutes: 5,
    preferredTime: "17:15",
    tradingContext: "post-market",
    enabled: true,
    reminder: false,
  },
];

export interface BreathingPatternDef {
  id: string;
  name: string;
  durationMinutes: number;
  description: string;
  purpose: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  restSec: number;
  cueInhale: string;
  cueHold: string;
  cueExhale: string;
  cueRest: string;
}

export const BREATHING_EXERCISES: BreathingPatternDef[] = [
  {
    id: "natural-breathing",
    name: "Natural Breathing",
    durationMinutes: 2,
    description: "Observe natural respiration rhythm without forcing or modifying rate.",
    purpose: "Establish present-moment sensory awareness and steady autonomic baseline.",
    inhaleSec: 3,
    holdSec: 1,
    exhaleSec: 3,
    restSec: 1,
    cueInhale: "Inhale gently through nose",
    cueHold: "Rest in awareness",
    cueExhale: "Exhale softly and naturally",
    cueRest: "Pause without tension",
  },
  {
    id: "gentle-paced",
    name: "Gentle Paced Breathing",
    durationMinutes: 3,
    description: "Inhale gently for 4 seconds, exhale steadily for 6 seconds.",
    purpose: "Practice controlled, relaxed breathing to counteract sympathetic nervous arousal.",
    inhaleSec: 4,
    holdSec: 0,
    exhaleSec: 6,
    restSec: 0,
    cueInhale: "Inhale smooth and steady (4s)",
    cueHold: "",
    cueExhale: "Exhale long and controlled (6s)",
    cueRest: "",
  },
  {
    id: "extended-exhalation",
    name: "Extended Exhalation",
    durationMinutes: 2,
    description: "Inhale naturally (4s), exhale slightly longer (7s). Avoid forcing.",
    purpose: "Encourage parasympathetic vagal activation and heart rate downregulation.",
    inhaleSec: 4,
    holdSec: 1,
    exhaleSec: 7,
    restSec: 2,
    cueInhale: "Deep calm breath inward (4s)",
    cueHold: "Gentle suspension (1s)",
    cueExhale: "Slow release through parted lips (7s)",
    cueRest: "Complete stillness (2s)",
  },
];

