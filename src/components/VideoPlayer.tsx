import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  Film,
  Copy,
  Check,
  FolderDown,
  Info,
} from 'lucide-react';
import { VideoRecord } from '../types';

interface VideoPlayerProps {
  video: VideoRecord | null;
  saveFolderPath: string;
  onDownload: (video: VideoRecord) => void;
  onSelectAnother: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  saveFolderPath,
  onDownload,
  onSelectAnother,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [video?.id]);

  if (!video) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px] text-slate-500">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Video Loaded in Preview Player</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Type a scene description above and click "Generate Video" or pick a video from the Gallery below to start watching.
        </p>
      </div>
    );
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || video.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleToggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 0.5];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(video.enhancedPrompt || video.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine container aspect ratio class
  const getAspectRatioClasses = () => {
    switch (video.aspectRatio) {
      case '9:16':
        return 'max-w-xs aspect-[9/16] mx-auto';
      case '1:1':
        return 'max-w-md aspect-square mx-auto';
      case '16:9':
      default:
        return 'w-full aspect-[16/9]';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Media Bar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
            <Film className="w-3 h-3" />
          </div>
          <span className="font-semibold text-xs text-slate-200 truncate">
            {video.title || video.prompt.slice(0, 48)}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/60 shrink-0">
            {video.resolution} · {video.fps}fps
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 uppercase">
            {video.model}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDownload(video)}
            className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/30 whitespace-nowrap"
            title={`Download 4K MP4 to ${saveFolderPath}`}
            aria-label="Download 4K MP4"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 4K</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative bg-black flex items-center justify-center p-2 min-h-[320px] max-h-[520px] overflow-hidden group">
        <div className={`relative ${getAspectRatioClasses()} transition-all duration-300 shadow-2xl`}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            loop={isLooping}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            className="w-full h-full object-cover rounded-lg cursor-pointer"
          />

          {/* Big Center Play Overlay Button when paused */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform backdrop-blur-sm"
              aria-label="Play video"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </button>
          )}

          {/* Aspect ratio watermark tag */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-mono pointer-events-none">
            {video.aspectRatio} · 4K UHD
          </div>
        </div>
      </div>

      {/* Scrubber & Custom Player Controls */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 space-y-2">
        {/* Timeline Scrub Bar */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || video.duration || 5}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            aria-label="Seek video playback position"
          />
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="font-mono text-[11px] text-slate-400">
              {currentTime.toFixed(1)}s / {(duration || video.duration).toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Speed toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Change playback speed"
            >
              {speed}x
            </button>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded transition-colors ${
                isLooping
                  ? 'text-blue-400 bg-blue-950/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={isLooping ? 'Looping enabled' : 'Looping disabled'}
              aria-label="Toggle loop"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Prompt details disclosure */}
            <button
              type="button"
              onClick={() => setShowPromptDetails(!showPromptDetails)}
              className="ml-2 px-2.5 py-1 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 border border-blue-900/60 transition-colors flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              <span>Prompt Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Inspector Drawer */}
      {showPromptDetails && (
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Veo Prompt Synthesis Log</span>
            </span>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Enhanced Prompt'}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400">Original Prompt:</span>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-sans">
              {video.prompt}
            </div>
          </div>

          {video.enhancedPrompt && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-blue-400">
                Realism Engine Full Enhanced Prompt:
              </span>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed">
                {video.enhancedPrompt}
              </div>
            </div>
          )}

          {video.negativePrompt && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-rose-400">
                Negative Suppression Prompt:
              </span>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px]">
                {video.negativePrompt}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
