export type AmbientSoundType = "rain" | "ocean" | "singing-bowl" | "wind" | "silence";

export type MeditationTechnique =
  | "focused-attention"
  | "mindfulness"
  | "body-scan";

export interface MeditationStage {
  id: string;
  stageNumber: number;
  title: string;
  durationSeconds: number;
  narration: string;
  breathingPattern?: {
    inhale: number;
    hold?: number;
    exhale: number;
    rest?: number;
  };
  ambientSound?: AmbientSoundType;
}

export interface MeditationSessionDef {
  id: string;
  technique: MeditationTechnique;
  title: string;
  category: string;
  defaultDurationMinutes: number;
  shortDescription: string;
  scientificPurpose: string;
  expectedOutcome: string;
  recommendedTradingContext: string;
  tradingApplications: string[];
  stages: MeditationStage[];
}

export type EmotionalFeeling =
  | "Calm"
  | "Focused"
  | "Anxious"
  | "Frustrated"
  | "Excited"
  | "Tired"
  | "Impatient";

export type PostSessionFeeling =
  | "Calm"
  | "Focused"
  | "Relaxed"
  | "Still anxious"
  | "Still frustrated"
  | "Neutral"
  | "Tired";

export interface MentalReadinessCheckin {
  id: string;
  timestamp: string;
  feelings: EmotionalFeeling[];
  intensity: number; // 1 to 10
}

export interface CompletedSessionRecord {
  id: string;
  sessionId: string;
  sessionTitle: string;
  technique: MeditationTechnique;
  durationMinutes: number;
  timestamp: string;
  completedAt: string;
  beforeFeelings?: EmotionalFeeling[];
  beforeIntensity?: number;
  afterFeeling: PostSessionFeeling;
  afterIntensity: number; // 1 to 10
  reflectionNotes?: string;
}

export interface RoutineItem {
  id: string;
  name: string;
  sessionId: string;
  technique: MeditationTechnique;
  durationMinutes: number;
  preferredTime: string; // e.g. "07:30"
  tradingContext: "morning" | "pre-market" | "post-market" | "custom";
  enabled: boolean;
  reminder: boolean;
}

export interface Sanctuary2Settings {
  dailyTargetMinutes: number;
  defaultAmbientSound: AmbientSoundType;
  defaultVolume: number;
  voiceNarrationEnabled: boolean;
  voiceSpeed: number; // 0.8, 1.0, 1.2
  vibrateHaptics: boolean;
}

