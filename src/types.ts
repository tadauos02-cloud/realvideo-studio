export type VeoModel = 'veo-3' | 'veo-3-fast';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type DurationOption = number; // Changed to allow custom duration in seconds

export interface RealismConfig {
  enabled: boolean;
  skinPoresWrinkles: boolean;
  eyeBlinksBreathing: boolean;
  handheldCamera: boolean;
  sunlightAndShadows: boolean;
  dustParticles: boolean;
  naturalMotionBlur: boolean;
  rawPhoneCameraLook: boolean;
  resolution: '4K' | '1080p';
  fps: 30 | 60;
}

export interface VideoRecord {
  id: string;
  title: string;
  prompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  aspectRatio: AspectRatio;
  duration: number; // in seconds
  resolution: string;
  fps: number;
  model: VeoModel;
  createdAt: number;
  fileSizeMb: number;
  isSample?: boolean;
}

export interface VideoQueueItem {
  id: string;
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  duration: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
}

export type GenerationStage =
  | 'idle'
  | 'enhancing'
  | 'submitting'
  | 'diffusing'
  | 'temporal_smoothing'
  | 'upscaling'
  | 'completed'
  | 'error';

export interface GenerationProgress {
  stage: GenerationStage;
  percent: number;
  message: string;
  elapsedSec: number;
  remainingSec: number;
  currentFrame?: number;
  totalFrames?: number;
  error?: string | null;
}

export interface AppSettings {
  apiKey: string; // For backward compatibility
  apiKeys: string[]; // List of API keys for fallback/rotation
  universalApiKeys: string[]; // Universal Unified API Keys Pool (Gemini + Any Alternative AI keys combined)
  replicateApiKey?: string;  // Alternative AI (Replicate) Support (Legacy compatibility)
  lumaApiKey?: string;        // Alternative AI (Luma) Support (Legacy compatibility)
  storageMode: 'local_secure';
  saveFolderPath: string;
  autoEnhance: boolean;
  enableSoundEffects: boolean;
  defaultModel: VeoModel;
  defaultAspectRatio: AspectRatio;
  defaultDuration: DurationOption;
}