import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { SettingsModal } from './components/SettingsModal';
import { RealismEnginePanel } from './components/RealismEnginePanel';
import { PromptSection } from './components/PromptSection';
import { GenerationModal } from './components/GenerationModal';
import { VideoPlayer } from './components/VideoPlayer';
import { HistoryGallery } from './components/HistoryGallery';
import { DesktopInstallerModal } from './components/DesktopInstallerModal';

import {
  AppSettings,
  AspectRatio,
  DurationOption,
  GenerationProgress,
  RealismConfig,
  VeoModel,
  VideoRecord,
  VideoQueueItem,
} from './types';
import {
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_REALISM_CONFIG,
  DEFAULT_SETTINGS,
  enhancePrompt,
  estimateGenerationSeconds,
} from './utils/realismEngine';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  addVideoToHistory,
  removeVideoFromHistory,
} from './utils/storage';
import { SAMPLE_VIDEOS } from './utils/sampleVideos';
import { ShieldAlert, Key, Sparkles, Film, ArrowDown, Layers } from 'lucide-react';

export default function App() {
  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<VideoRecord[]>(() => loadHistory());

  // Batch Queue state
  const [videoQueue, setVideoQueue] = useState<VideoQueueItem[]>([]);

  // Active playing video
  const [activeVideo, setActiveVideo] = useState<VideoRecord | null>(() => {
    const list = loadHistory();
    return list.length > 0 ? list[0] : null;
  });

  // Prompt and generation controls (Pure English default)
  const [prompt, setPrompt] = useState('An elderly watchmaker inspecting a delicate antique pocket watch in warm morning window light');
  const [model, setModel] = useState<VeoModel>(settings.defaultModel || 'veo-3');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(settings.defaultAspectRatio || '16:9');
  const [duration, setDuration] = useState<DurationOption>(settings.defaultDuration || 5);
  const [realism, setRealism] = useState<RealismConfig>(DEFAULT_REALISM_CONFIG);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInstallerOpen, setIsInstallerOpen] = useState(false);

  // Generation progress state
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
    elapsedSec: 0,
    remainingSec: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save settings when updated and instantly sync state
  const handleSaveSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Check if any key is configured in universal pool
  const hasAnyKey = Boolean(
    (settings.universalApiKeys && settings.universalApiKeys.length > 0) ||
    settings.apiKey ||
    (settings.apiKeys && settings.apiKeys.length > 0) ||
    Boolean(settings.videoProvidersJson?.trim())
  );

  // Real-time enhanced prompt computation
  const enhancedPromptPreview = enhancePrompt(prompt, realism);

  // Download video handler
  const handleDownloadVideo = async (video: VideoRecord) => {
    const defaultFileName = `${(video.title || 'RealVideo')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32)}_4K_${video.aspectRatio.replace(':', 'x')}.mp4`;

    if (typeof window !== 'undefined' && (window as any).electronAPI?.saveVideo) {
      try {
        const response = await fetch(video.videoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await (window as any).electronAPI.saveVideo({
            defaultFileName,
            base64Data: base64data,
          });
        };
        return;
      } catch (err) {
        console.warn('Electron direct file save fallback to web download:', err);
      }
    }

    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = defaultFileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete video handler
  const handleDeleteVideo = (id: string) => {
    const updated = removeVideoFromHistory(id);
    setHistory(updated);
    if (activeVideo?.id === id) {
      setActiveVideo(updated.length > 0 ? updated[0] : null);
    }
  };

  // Add current prompt to Queue
  const handleAddToQueue = () => {
    if (!prompt.trim()) return;

    const newItem: VideoQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      prompt,
      model,
      aspectRatio,
      duration,
      status: 'pending',
      createdAt: Date.now(),
    };

    setVideoQueue((prev) => [...prev, newItem]);
  };

  // Background Queue Processor (Sequential execution with Universal Fallback Pool)
  useEffect(() => {
    let isMounted = true;

    const processQueue = async () => {
      const queueSnapshot = videoQueue;
      const nextItemIndex = queueSnapshot.findIndex((item) => item.status === 'pending');
      
      if (nextItemIndex === -1) return;
      if (progress.stage !== 'idle' && progress.stage !== 'completed') return;

      const itemToProcess = queueSnapshot[nextItemIndex];

      setVideoQueue((prev) =>
        prev.map((it) => (it.id === itemToProcess.id ? { ...it, status: 'generating' } : it))
      );

      setProgress({
        stage: 'submitting',
        percent: 5,
        message: 'Request sent to the video provider. Waiting for the actual video result…',
        elapsedSec: 0,
        remainingSec: 0,
      });

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const startedAt = Date.now();

      try {
        if (!isMounted) return;
        let response = await fetch('/api/universal/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.signal,
          body: JSON.stringify({
            apiKey: settings.universalApiKeys?.[0] || settings.apiKey || '',
            apiKeys: settings.universalApiKeys || settings.apiKeys || [],
            universalApiKeys: settings.universalApiKeys || [],
            providersJson: settings.videoProvidersJson || '',
            prompt: itemToProcess.prompt,
            enhancedPrompt: enhancePrompt(itemToProcess.prompt, realism),
            negativePrompt,
            model: itemToProcess.model,
            aspectRatio: itemToProcess.aspectRatio,
            duration: itemToProcess.duration,
            resolution: realism.resolution,
            fps: realism.fps,
          }),
        });

        let apiResult = await response.json().catch(() => ({}));

        // If no custom provider JSON is configured, preserve compatibility with the built-in Gemini key pool.
        // The universal route is attempted first so server-only AI_VIDEO_PROVIDERS_JSON can take precedence.
        if (!response.ok && !settings.videoProvidersJson?.trim() &&
          ((settings.universalApiKeys && settings.universalApiKeys.length > 0) || settings.apiKey || (settings.apiKeys && settings.apiKeys.length > 0))) {
          const legacyResponse = await fetch('/api/gemini/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abortController.signal,
            body: JSON.stringify({
              apiKey: settings.universalApiKeys?.[0] || settings.apiKey || '',
              apiKeys: settings.universalApiKeys || settings.apiKeys || [],
              universalApiKeys: settings.universalApiKeys || [],
              prompt: itemToProcess.prompt,
              enhancedPrompt: enhancePrompt(itemToProcess.prompt, realism),
              negativePrompt,
              model: itemToProcess.model,
              aspectRatio: itemToProcess.aspectRatio,
              duration: itemToProcess.duration,
              resolution: realism.resolution,
              fps: realism.fps,
            }),
          });
          response = legacyResponse;
          apiResult = await legacyResponse.json().catch(() => ({}));
        }

        if (!response.ok || apiResult?.success !== true || typeof apiResult?.videoUrl !== 'string') {
          throw new Error(apiResult?.error || `Video provider request failed (HTTP ${response.status}).`);
        }

        const videoUrl = apiResult.videoUrl.startsWith('http')
          ? apiResult.videoUrl
          : new URL(apiResult.videoUrl, window.location.origin).toString();

        const newRecord: VideoRecord = {
          id: `veo-${Date.now()}`,
          title: itemToProcess.prompt.slice(0, 42),
          prompt: itemToProcess.prompt,
          enhancedPrompt: apiResult.enhancedPrompt || enhancePrompt(itemToProcess.prompt, realism),
          negativePrompt,
          videoUrl,
          thumbnailUrl: undefined,
          aspectRatio: apiResult.aspectRatio || itemToProcess.aspectRatio,
          duration: Number(apiResult.duration) || itemToProcess.duration,
          resolution: apiResult.resolution || 'Provider default',
          fps: Number(apiResult.fps) || 24,
          model: itemToProcess.model,
          createdAt: Date.now(),
          fileSizeMb: Number(apiResult.fileSizeMb) || 0,
          isSample: false,
        };

        setProgress({
          stage: 'completed',
          percent: 100,
          message: 'Provider returned a video file successfully.',
          elapsedSec: Math.round((Date.now() - startedAt) / 1000),
          remainingSec: 0,
        });

        const updated = addVideoToHistory(newRecord);
        setHistory(updated);
        setActiveVideo(newRecord);

        setVideoQueue((prev) =>
          prev.map((it) => (it.id === itemToProcess.id ? { ...it, status: 'completed' } : it))
        );

      } catch (err: any) {
        if (err.name === 'AbortError') {
          setVideoQueue((prev) =>
            prev.map((it) => (it.id === itemToProcess.id ? { ...it, status: 'failed', error: 'Cancelled' } : it))
          );
        } else {
          setVideoQueue((prev) =>
            prev.map((it) => (it.id === itemToProcess.id ? { ...it, status: 'failed', error: err.message } : it))
          );
          alert(`Generation Error: ${err.message}`);
        }
        setProgress({
          stage: 'idle',
          percent: 0,
          message: '',
          elapsedSec: 0,
          remainingSec: 0,
        });
      }
    };

    const timer = setInterval(processQueue, 1000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [videoQueue, progress.stage, settings.universalApiKeys, realism, negativePrompt]);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProgress({
      stage: 'idle',
      percent: 0,
      message: '',
      elapsedSec: 0,
      remainingSec: 0,
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-purple-600/30">
      <TitleBar
        hasApiKey={hasAnyKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onOpenInstaller={() => setIsInstallerOpen(true)}
        isHistoryOpen={isHistoryOpen}
        activeVideoCount={history.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!hasAnyKey && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Key className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-slate-100">
                  Ready to link your Universal AI API keys:
                </span>
                <span className="text-slate-400 ml-1">
                  Add your API keys in Settings to generate videos with automatic fallback rotation.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors shrink-0 shadow-sm shadow-purple-600/20"
            >
              Configure API Keys
            </button>
          </div>
        )}

        <PromptSection
          prompt={prompt}
          onChangePrompt={setPrompt}
          model={model}
          onChangeModel={setModel}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          duration={duration}
          onChangeDuration={setDuration}
          onGenerate={handleAddToQueue}
          isGenerating={false}
          hasApiKey={hasAnyKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {videoQueue.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Batch Generation Queue ({videoQueue.filter(q => q.status === 'completed').length}/{videoQueue.length} Done)
                </h4>
              </div>
              <button
                onClick={() => setVideoQueue([])}
                className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear Queue
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {videoQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-1.5 ${
                    item.status === 'generating'
                      ? 'bg-purple-950/40 border-purple-500 animate-pulse'
                      : item.status === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-300'
                      : item.status === 'failed'
                      ? 'bg-red-950/20 border-red-800/60 text-slate-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-purple-400">#{idx + 1} · {item.duration}s · {item.aspectRatio}</span>
                    <span className={`uppercase font-semibold ${
                      item.status === 'generating' ? 'text-purple-300' :
                      item.status === 'completed' ? 'text-emerald-400' :
                      item.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-slate-200 font-sans">{item.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <RealismEnginePanel
          config={realism}
          onChangeConfig={setRealism}
          negativePrompt={negativePrompt}
          onChangeNegativePrompt={setNegativePrompt}
          enhancedPromptPreview={enhancedPromptPreview}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Studio 4K Preview Player</span>
            </h3>
            {activeVideo && (
              <span className="text-xs text-slate-500 font-mono">
                {activeVideo.aspectRatio} · {activeVideo.duration}s · 30fps
              </span>
            )}
          </div>
          <VideoPlayer
            video={activeVideo}
            saveFolderPath={settings.saveFolderPath}
            onDownload={handleDownloadVideo}
            onSelectAnother={() => setIsHistoryOpen(true)}
          />
        </div>

        <HistoryGallery
          videos={history}
          activeVideoId={activeVideo?.id}
          onSelectVideo={(v) => {
            setActiveVideo(v);
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
          onDownloadVideo={handleDownloadVideo}
          onDeleteVideo={handleDeleteVideo}
          onUsePrompt={(p) => setPrompt(p)}
        />
      </main>

      <GenerationModal
        progress={progress}
        onCancel={handleCancelGeneration}
        prompt={prompt}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <DesktopInstallerModal
        isOpen={isInstallerOpen}
        onClose={() => setIsInstallerOpen(false)}
      />
    </div>
  );
}