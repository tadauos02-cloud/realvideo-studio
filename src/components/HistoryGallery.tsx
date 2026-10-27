import React, { useState } from 'react';
import {
  Film,
  Play,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Clock,
  Sparkles,
} from 'lucide-react';
import { VideoRecord, AspectRatio, VeoModel } from '../types';
import { formatTime, formatFileSize } from '../utils/realismEngine';

interface HistoryGalleryProps {
  videos: VideoRecord[];
  activeVideoId?: string;
  onSelectVideo: (video: VideoRecord) => void;
  onDownloadVideo: (video: VideoRecord) => void;
  onDeleteVideo: (id: string) => void;
  onUsePrompt: (prompt: string) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onDownloadVideo,
  onDeleteVideo,
  onUsePrompt,
}) => {
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [ratioFilter, setRatioFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.prompt.toLowerCase().includes(search.toLowerCase()) ||
      (v.title && v.title.toLowerCase().includes(search.toLowerCase()));
    const matchesModel = modelFilter === 'all' || v.model === modelFilter;
    const matchesRatio = ratioFilter === 'all' || v.aspectRatio === ratioFilter;
    return matchesSearch && matchesModel && matchesRatio;
  });

  const handleCopyPrompt = (video: VideoRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.prompt);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Gallery Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-400" />
            <span>Generated Video History Gallery</span>
            <span className="text-xs text-slate-400 font-normal">
              ({videos.length} videos)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            All ultra-realistic videos saved locally on your Windows machine with their full prompt logs
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none w-36 sm:w-48"
            />
          </div>

          {/* Ratio Filter */}
          <select
            value={ratioFilter}
            onChange={(e) => setRatioFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            aria-label="Filter by aspect ratio"
          >
            <option value="all">All Ratios</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Vertical</option>
            <option value="1:1">1:1 Square</option>
          </select>

          {/* Model Filter */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            aria-label="Filter by model"
          >
            <option value="all">All Models</option>
            <option value="veo-3">Veo 3</option>
            <option value="veo-3-fast">Veo 3 Fast</option>
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <Film className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs">No videos matching your current filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredVideos.map((video) => {
            const isActive = activeVideoId === video.id;

            return (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className={`group bg-slate-950 border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-blue-500/80 flex flex-col justify-between ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'border-slate-800 hover:shadow-md'
                }`}
              >
                {/* Thumbnail Poster with Play Overlay */}
                <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-slate-600">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Play badge overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top tags */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-200 font-mono">
                      {video.aspectRatio}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-900/60 backdrop-blur-sm text-[10px] text-blue-300 font-mono uppercase">
                      {video.model}
                    </span>
                  </div>

                  {/* Duration tag */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] text-slate-200 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{video.duration}s</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {video.title || video.prompt}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 italic">
                      "{video.prompt}"
                    </p>
                  </div>

                  {/* Card Meta & Actions */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {video.resolution} · {formatFileSize(video.fileSizeMb)}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Copy prompt */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyPrompt(video, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Copy prompt"
                        aria-label="Copy prompt"
                      >
                        {copiedId === video.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Download 4K */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadVideo(video);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Download 4K video"
                        aria-label="Download 4K video"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVideo(video.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete from history"
                        aria-label="Delete video"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
