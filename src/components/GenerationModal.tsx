import React from 'react';
import {
  Sparkles,
  Cpu,
  XCircle,
  Timer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GenerationProgress, GenerationStage } from '../types';
import { formatTime } from '../utils/realismEngine';

interface GenerationModalProps {
  progress: GenerationProgress;
  onCancel: () => void;
  prompt: string;
}

const STAGES: { stage: GenerationStage; label: string; icon: any; desc: string }[] = [
  {
    stage: 'submitting',
    label: 'Waiting for the video provider',
    icon: Cpu,
    desc: 'The app waits for the provider response. A precise generation percentage is not available.',
  },
];

export const GenerationModal: React.FC<GenerationModalProps> = ({
  progress,
  onCancel,
  prompt,
}) => {
  if (progress.stage === 'idle') {
    return null;
  }

  const isError = progress.stage === 'error';
  const isCompleted = progress.stage === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generation-progress-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="generation-progress-title" className="text-sm font-semibold text-slate-100">
                {isError ? 'Generation Alert' : 'Video generation request'}
              </h3>
              <p className="text-xs text-slate-400">
                {isError ? 'Error encountered during request' : 'Live provider status'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isError && (
              <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                {Math.round(progress.percent)}%
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt recap */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
            <span className="text-slate-500 font-medium block mb-1">Scene prompt:</span>
            <p className="font-sans line-clamp-2 italic text-slate-200">
              "{prompt}"
            </p>
          </div>

          {/* Progress bar */}
          {!isError && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{progress.message}</span>
                <span className="font-mono text-slate-300">
                  {progress.currentFrame && progress.totalFrames
                    ? `Frame ${progress.currentFrame}/${progress.totalFrames}`
                    : `${Math.round(progress.percent)}%`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                {progress.stage === 'submitting' ? (
                  <div className="h-full w-1/3 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 rounded-full animate-pulse" />
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(2, progress.percent))}%` }}
                  />
                )}
              </div>

              {/* Telemetry info strip */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-slate-400" />
                  <span>Elapsed: {formatTime(progress.elapsedSec)}</span>
                </span>
                <span>
                  Est. Remaining: ~{formatTime(Math.max(0, progress.remainingSec))}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Video provider response</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {progress.error || 'Failed to generate video. Please check your API key in Settings.'}
              </p>
            </div>
          )}

          {/* Stages Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Request status
            </h4>
            <div className="space-y-2">
              {STAGES.map((s, idx) => {
                const Icon = s.icon;
                const stageOrder = ['enhancing', 'submitting', 'diffusing', 'temporal_smoothing', 'upscaling'];
                const currentIndex = stageOrder.indexOf(progress.stage);
                const stepIndex = stageOrder.indexOf(s.stage);
                const isPassed = !isError && currentIndex > stepIndex;
                const isCurrent = !isError && currentIndex === stepIndex;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 transition-colors ${
                      isPassed
                        ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                        : isCurrent
                        ? 'bg-blue-950/30 border-blue-500/50 text-blue-200 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/40 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        isPassed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isCurrent
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : 'bg-slate-800/40 text-slate-600'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200">{s.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{s.desc}</div>
                    </div>
                    {isCurrent && (
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          {isCompleted ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/30 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Watch Video in Studio Preview</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isError ? 'Close' : 'Cancel Generation'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
