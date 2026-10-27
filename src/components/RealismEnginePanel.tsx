import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  RotateCcw,
  Sliders,
  Check,
  Eye,
  Camera,
  Sun,
  Wind,
  Layers,
  Smartphone,
  Info,
} from 'lucide-react';
import { RealismConfig } from '../types';
import { DEFAULT_NEGATIVE_PROMPT } from '../utils/realismEngine';

interface RealismEnginePanelProps {
  config: RealismConfig;
  onChangeConfig: (newConfig: RealismConfig) => void;
  negativePrompt: string;
  onChangeNegativePrompt: (newNeg: string) => void;
  enhancedPromptPreview: string;
}

export const RealismEnginePanel: React.FC<RealismEnginePanelProps> = ({
  config,
  onChangeConfig,
  negativePrompt,
  onChangeNegativePrompt,
  enhancedPromptPreview,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const toggleFeature = (key: keyof Omit<RealismConfig, 'resolution' | 'fps'>) => {
    onChangeConfig({
      ...config,
      [key]: !config[key],
    });
  };

  const handleResetNegative = () => {
    onChangeNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
  };

  const activeFeatureCount = [
    config.skinPoresWrinkles,
    config.eyeBlinksBreathing,
    config.handheldCamera,
    config.sunlightAndShadows,
    config.dustParticles,
    config.naturalMotionBlur,
    config.rawPhoneCameraLook,
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm transition-all">
      {/* Panel Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100 tracking-tight">
                Realism Engine
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {config.enabled ? `${activeFeatureCount}/7 Active` : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automatically eliminates CGI look with authentic skin pores, handheld shake, natural sunlight & 30fps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Master Enable/Disable */}
          <button
            type="button"
            onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              config.enabled
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className={`w-3.5 h-3.5 ${config.enabled ? 'opacity-100' : 'opacity-30'}`} />
            <span>{config.enabled ? 'Engine Active' : 'Enable Realism'}</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Collapse parameters' : 'Expand fine-tuning parameters'}
            aria-label={isExpanded ? 'Collapse realism parameters' : 'Expand realism parameters'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Summary Strip (Always Visible) */}
      <div className="px-4 py-2 bg-slate-950/40 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/40">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Camera className="w-3 h-3 text-blue-400" />
            <span>Handheld Natural Camera</span>
          </span>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Soft Natural Sunlight</span>
          </span>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>Blinks & Breathing</span>
          </span>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Micro Pores & Wrinkles</span>
          </span>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Smartphone className="w-3 h-3 text-sky-400" />
            <span>Non-CGI Phone Look</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPromptPreview(!showPromptPreview)}
          className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 shrink-0"
        >
          <Info className="w-3 h-3" />
          <span>{showPromptPreview ? 'Hide Enhanced Prompt' : 'View Enhanced Veo Prompt'}</span>
        </button>
      </div>

      {/* Real-time Enhanced Prompt Preview Drawer */}
      {showPromptPreview && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Enhanced Prompt (Sent directly to Veo API)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">4K · 30fps · Photoreal</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap selection:bg-blue-600/30">
            {enhancedPromptPreview || '(Type a prompt above to view enhanced output)'}
          </div>
        </div>
      )}

      {/* Expanded Fine-Tuning Controls */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-900/60">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Realism Feature Matrix</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                All features tuned for authentic physical camera captures
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Feature 1 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.skinPoresWrinkles
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.skinPoresWrinkles}
                  onChange={() => toggleFeature('skinPoresWrinkles')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Real Skin Pores & Wrinkles</div>
                  <div className="text-slate-400 mt-0.5">
                    Microscopic dermal textures, fine expression wrinkles, natural subsurface scattering.
                  </div>
                </div>
              </label>

              {/* Feature 2 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.eyeBlinksBreathing
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.eyeBlinksBreathing}
                  onChange={() => toggleFeature('eyeBlinksBreathing')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Eye Blinks & Natural Breathing</div>
                  <div className="text-slate-400 mt-0.5">
                    Micro-saccades, organic involuntary blinks, and subtle rhythmic chest rise and fall.
                  </div>
                </div>
              </label>

              {/* Feature 3 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.handheldCamera
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.handheldCamera}
                  onChange={() => toggleFeature('handheldCamera')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Handheld Camera Shake</div>
                  <div className="text-slate-400 mt-0.5">
                    Subtle, natural operator sway and micro-movements, replacing stiff robotic pans.
                  </div>
                </div>
              </label>

              {/* Feature 4 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.sunlightAndShadows
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.sunlightAndShadows}
                  onChange={() => toggleFeature('sunlightAndShadows')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Soft Sunlight & Realistic Shadows</div>
                  <div className="text-slate-400 mt-0.5">
                    Physically accurate raytracing, soft ambient occlusion, diffused sunlight bounces.
                  </div>
                </div>
              </label>

              {/* Feature 5 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.dustParticles
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.dustParticles}
                  onChange={() => toggleFeature('dustParticles')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Dust Particles in Light</div>
                  <div className="text-slate-400 mt-0.5">
                    Subtle airborne dust motes floating through sunbeams for atmospheric depth.
                  </div>
                </div>
              </label>

              {/* Feature 6 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  config.naturalMotionBlur
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.naturalMotionBlur}
                  onChange={() => toggleFeature('naturalMotionBlur')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Natural Shutter Motion Blur</div>
                  <div className="text-slate-400 mt-0.5">
                    Realistic 180° shutter angle motion blur on fast movements, eliminating jitter.
                  </div>
                </div>
              </label>

              {/* Feature 7 */}
              <label
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 md:col-span-2 ${
                  config.rawPhoneCameraLook
                    ? 'bg-blue-950/20 border-blue-500/40 text-slate-100'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.rawPhoneCameraLook}
                  onChange={() => toggleFeature('rawPhoneCameraLook')}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Real Phone-Camera Sensor Signature (Not CGI)</div>
                  <div className="text-slate-400 mt-0.5">
                    Authentic optical sensor chromatic science, subtle lens falloff, raw video footage feel.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Negative Prompt Field */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label htmlFor="negative-prompt-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Negative Prompt (Anti-CGI Suppression)</span>
              </label>
              <button
                type="button"
                onClick={handleResetNegative}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>
            <textarea
              id="negative-prompt-input"
              rows={2}
              value={negativePrompt}
              onChange={(e) => onChangeNegativePrompt(e.target.value)}
              placeholder="Features to suppress during diffusion..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 rounded-lg p-2.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Default negative constraints: plastic smooth skin, cartoon look, robotic stiff movement, oversaturated colors, 3D CGI render.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
