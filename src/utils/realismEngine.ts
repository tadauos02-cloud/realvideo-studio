import { RealismConfig, AppSettings, AspectRatio, DurationOption, VeoModel } from '../types';
import { executeWithApiKeyRotation } from './api_key_rotation_helper';

export const DEFAULT_NEGATIVE_PROMPT =
  'plastic smooth skin, cartoon look, robotic stiff movement, oversaturated colors, 3D CGI render, anime, doll face, unnatural glossy skin, video game graphics, airbrushed textures, exaggerated anime eyes, mannequin, artificial studio ring light';

export const DEFAULT_REALISM_CONFIG: RealismConfig = {
  enabled: true,
  skinPoresWrinkles: true,
  eyeBlinksBreathing: true,
  handheldCamera: true,
  sunlightAndShadows: true,
  dustParticles: true,
  naturalMotionBlur: true,
  rawPhoneCameraLook: true,
  resolution: '4K',
  fps: 30,
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiKeys: [], // Added support for multiple API keys fallback rotation
  universalApiKeys: [],
  videoProvidersJson: '',
  storageMode: 'local_secure',
  saveFolderPath: 'C:\\Users\\User\\Videos\\RealVideo_Studio',
  autoEnhance: true,
  enableSoundEffects: true,
  defaultModel: 'veo-3',
  defaultAspectRatio: '16:9',
  defaultDuration: 5,
};

/**
 * Enhances a raw user prompt with fine-tuned photorealism prompts
 * matching the user specifications:
 * - real skin texture with pores and wrinkles
 * - natural eye blinks and breathing
 * - handheld camera with slight natural shake
 * - soft natural sunlight, realistic shadows
 * - dust particles in light
 * - natural motion blur
 * - 4K, 30fps
 * - real phone-camera look, not CGI
 */
export function enhancePrompt(rawPrompt: string, config: RealismConfig = DEFAULT_REALISM_CONFIG): string {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return '';
  if (!config.enabled) return trimmed;

  const enhancements: string[] = [];

  // Subject & micro-textures
  if (config.skinPoresWrinkles) {
    enhancements.push('authentic human skin texture with microscopic pores, natural fine wrinkles, subtle skin imperfections');
  }

  // Micro-movements & physiological cues
  if (config.eyeBlinksBreathing) {
    enhancements.push('organic human behavior with natural eye blinks, micro-saccades, and gentle rhythmic chest breathing');
  }

  // Camera dynamics
  if (config.handheldCamera) {
    enhancements.push('subtle handheld camera movement with natural micro-shake and organic operator breathing');
  }

  // Lighting & atmosphere
  if (config.sunlightAndShadows) {
    enhancements.push('soft natural sunlight, diffused ambient bounce lighting, physically accurate soft contact shadows');
  }

  if (config.dustParticles) {
    enhancements.push('subtle airborne dust particles catching the light');
  }

  // Optical physics & shutter speed
  if (config.naturalMotionBlur) {
    enhancements.push('natural 180-degree shutter motion blur, realistic focal falloff');
  }

  // Lens signature & medium
  if (config.rawPhoneCameraLook) {
    enhancements.push('authentic smartphone camera sensor capture, natural film-like organic color science, raw footage feel, non-CGI photorealistic capture');
  }

  // Technical specifications
  enhancements.push(`${config.resolution} ultra high definition, ${config.fps}fps continuous smooth realistic frame rate`);

  return `${trimmed}. Photorealistic live-action documentary style: ${enhancements.join(', ')}.`;
}

/**
 * Validates API key format (flexible for Gemini, Google Cloud, or custom keys)
 */
export function validateGeminiApiKey(key: string): { valid: boolean; message: string } {
  const clean = key.trim();
  if (!clean) {
    return { valid: false, message: 'API key cannot be empty' };
  }
  if (clean.length < 10) {
    return {
      valid: false,
      message: 'API key is too short. Please check your key.',
    };
  }
  return { valid: true, message: 'Valid key format' };
}

/**
 * Estimates generation duration in seconds for progress bar computation
 */
export function estimateGenerationSeconds(model: VeoModel, duration: DurationOption): number {
  if (model === 'veo-3-fast') {
    return duration === 5 ? 12 : 35;
  }
  // Flagship Veo 3 takes slightly longer for ultra-high fidelity diffusion
  return duration === 5 ? 24 : 65;
}

/**
 * Formats seconds into mm:ss
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats megabytes into human readable size
 */
export function formatFileSize(sizeMb: number): string {
  if (sizeMb < 1) {
    return `${Math.round(sizeMb * 1024)} KB`;
  }
  return `${sizeMb.toFixed(1)} MB`;
}

/**
 * Builds the official Google Gemini Veo payload specification
 */
export function buildVeoRequestPayload(params: {
  prompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  duration: DurationOption;
  realism: RealismConfig;
}) {
  const finalPrompt = params.realism.enabled ? params.enhancedPrompt : params.prompt;
  const targetDurationStr = `${params.duration}s`;

  return {
    model: params.model === 'veo-3-fast' ? 'gemini-omni-1.1-flash' : 'gemini-omni-1.1-flash',
    prompt: finalPrompt,
    negative_prompt: params.negativePrompt,
    response_format: {
      type: 'video',
      aspect_ratio: params.aspectRatio,
      duration: targetDurationStr,
      resolution: params.realism.resolution.toLowerCase(),
      fps: params.realism.fps,
    },
  };
}

/**
 * Executes a Veo generation request with automatic API key rotation and failover support.
 */
export async function executeVeoRequestWithRotation(
  settings: AppSettings,
  payload: any
): Promise<any> {
  return executeWithApiKeyRotation(settings, async (apiKey) => {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errMessage);
    }

    return await response.json();
  });
}