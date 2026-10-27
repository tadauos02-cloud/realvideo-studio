import React from 'react';
import {
  Film,
  Settings as SettingsIcon,
  FolderDown,
  History,
  Minus,
  Square,
  X,
  Key,
  Monitor,
} from 'lucide-react';

interface TitleBarProps {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenInstaller: () => void;
  isHistoryOpen: boolean;
  activeVideoCount: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  hasApiKey,
  onOpenSettings,
  onOpenHistory,
  onOpenInstaller,
  isHistoryOpen,
  activeVideoCount,
}) => {
  const isElectron = Boolean(
    typeof window !== 'undefined' && (window as any).electronAPI?.isElectron
  );

  const handleMinimize = () => {
    if (isElectron) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (isElectron) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (isElectron) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <header className="h-11 bg-slate-950/95 border-b border-slate-800/80 px-3 flex items-center justify-between select-none shrink-0 backdrop-blur-md z-40">
      {/* Brand & Windows app identifier */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-100">
            RealVideo Studio
          </span>
        </div>

        <span className="text-slate-600 text-xs hidden sm:inline" aria-hidden="true">
          |
        </span>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <Monitor className="w-3 h-3 text-blue-400" />
          <span>Windows 10/11 Desktop</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>Google Gemini Veo</span>
        </div>
      </div>

      {/* Center status / quick actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHistory}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            isHistoryOpen
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
          }`}
          title="Open Video Gallery"
          aria-label="View Generated Videos Gallery"
        >
          <History className="w-3.5 h-3.5" />
          <span>Gallery ({activeVideoCount})</span>
        </button>

        <button
          onClick={onOpenInstaller}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded border border-slate-800 transition-colors whitespace-nowrap"
          title="Package as Windows .EXE Desktop Installer"
          aria-label="Package as Windows .EXE Desktop Installer"
        >
          <FolderDown className="w-3.5 h-3.5 text-sky-400" />
          <span>Single .EXE Package</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors border whitespace-nowrap ${
            hasApiKey
              ? 'text-slate-300 hover:text-white hover:bg-slate-900 border-slate-800'
              : 'text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Open API Settings"
          aria-label="Open API Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
          {!hasApiKey && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
              <Key className="w-2.5 h-2.5" /> Set Key
            </span>
          )}
        </button>
      </div>

      {/* Windows 10/11 Window Controls */}
      <div className="flex items-center -mr-2">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Maximize"
          aria-label="Maximize Window"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
          title="Close"
          aria-label="Close Window"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
