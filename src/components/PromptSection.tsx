import React from 'react';
import {
  Play,
  Sparkles,
  Zap,
  Clock,
  Ratio,
  Lightbulb,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { AspectRatio, DurationOption, VeoModel } from '../types';

interface PromptSectionProps {
  prompt: string;
  onChangePrompt: (p: string) => void;
  model: VeoModel;
  onChangeModel: (m: VeoModel) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (r: AspectRatio) => void;
  duration: DurationOption;
  onChangeDuration: (d: DurationOption) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

const INSPIRATION_PROMPTS = [
  'An elderly watchmaker inspecting a delicate antique pocket watch in warm morning window light',
  'A barista carefully pouring micro-foam latte art in a sunlit busy artisan cafe',
  'Sunbeams breaking through a misty forest path with floating dust motes',
  'Artisan hands shaping a spinning wet clay pot on a pottery wheel with water droplets',
  'Raindrops sliding down a taxi window overlooking neon city reflections at dusk',
];

export const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  onChangePrompt,
  model,
  onChangeModel,
  aspectRatio,
  onChangeAspectRatio,
  duration,
  onChangeDuration,
  onGenerate,
  isGenerating,
  hasApiKey,
  onOpenSettings,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && prompt.trim()) {
        onGenerate();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Large Prompt Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg focus-within:border-blue-500/80 transition-all">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="main-prompt-box" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Describe Your Scene in Simple Words</span>
          </label>

          <div className="flex items-center gap-2">
            {prompt && (
              <button
                type="button"
                onClick={() => onChangePrompt('')}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5"
                title="Clear prompt"
                aria-label="Clear prompt"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <span className="text-[11px] text-slate-500 font-mono">
              {prompt.length} chars · Ctrl+Enter to Generate
            </span>
          </div>
        </div>

        <textarea
          id="main-prompt-box"
          rows={3}
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. A portrait of an Italian baker dusting flour over freshly baked sourdough in a morning bakery..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed selection:bg-blue-600/30 font-sans"
          aria-label="Prompt text"
        />

        {/* Quick Inspiration Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 text-[11px]">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Ideas:</span>
          </span>
          {INSPIRATION_PROMPTS.map((insp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChangePrompt(insp)}
              className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] whitespace-nowrap shrink-0"
            >
              {insp.slice(0, 36)}...
            </button>
          ))}
        </div>
      </div>

      {/* Selectors Bar: Model, Aspect Ratio, Duration, and Generate Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* Model Selector */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Veo Model</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeModel('veo-3')}
              className={`p-2 rounded-lg border text-left transition-all ${
                model === 'veo-3'
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Veo 3</span>
                <span className="text-[10px] text-blue-400 font-mono">Flagship</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ultra Photoreal</div>
            </button>

            <button
              type="button"
              onClick={() => onChangeModel('veo-3-fast')}
              className={`p-2 rounded-lg border text-left transition-all ${
                model === 'veo-3-fast'
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Veo 3 Fast</span>
                <span className="text-[10px] text-amber-400 font-mono">Speed</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Rapid Iteration</div>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Aspect Ratio</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeAspectRatio(r)}
                className={`py-2 px-1 rounded-lg border text-center transition-all ${
                  aspectRatio === r
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono">{r}</div>
                <div className="text-[10px] text-slate-400">
                  {r === '16:9' ? 'Cinema' : r === '9:16' ? 'Phone' : 'Square'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration Input Selector */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Duration (Sec)</span>
          </div>
          <div className="flex items-center h-full">
            <input
              type="number"
              min={1}
              max={3600}
              value={duration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onChangeDuration(isNaN(val) ? 5 : Math.max(1, val));
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg py-2 px-3 text-center text-sm font-mono text-slate-100 focus:outline-none shadow-sm"
              placeholder="Seconds"
            />
          </div>
        </div>

        {/* One-Click Generate Button */}
        <div className="md:col-span-3 flex flex-col justify-end">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-full min-h-[58px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all flex flex-col items-center justify-center gap-0.5 group"
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
              <span>Generate Video</span>
            </div>
            <span className="text-[11px] font-normal text-blue-200 font-mono">
              4K UHD · 30fps · Photoreal
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};