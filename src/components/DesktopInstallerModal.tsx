import React, { useState } from 'react';
import {
  X,
  FolderDown,
  Monitor,
  Terminal,
  Check,
  Copy,
  Package,
  Layers,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

interface DesktopInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopInstallerModal: React.FC<DesktopInstallerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const buildCommand = 'npm run electron:build';

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(buildCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="installer-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <h3 id="installer-title" className="text-sm font-semibold text-slate-100">
                Windows Desktop App (.EXE Installer)
              </h3>
              <p className="text-xs text-slate-400">
                Electron + JavaScript packaging for Windows 10 and Windows 11
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Packaging Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 border border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
              <Package className="w-4 h-4" />
              <span>Single Executable Installer Setup</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              RealVideo Studio is architected with a native Electron runtime configured via{' '}
              <code className="text-sky-300 font-mono">electron-builder.json</code>. Building the
              package generates a standalone Windows executable:{' '}
              <span className="font-semibold text-white font-mono">RealVideo Studio Setup 1.0.0.exe</span>.
            </p>
          </div>

          {/* Quick Build Command */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>One-Click Installer Build Command</span>
            </label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs text-slate-200">
              <span className="text-emerald-400 font-semibold">{buildCommand}</span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Compiles React assets, packages the Electron main process, and creates the NSIS installer in the{' '}
              <code className="text-slate-400 font-mono">/release</code> directory.
            </p>
          </div>

          {/* Windows 10/11 Native Features */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Native Windows Desktop Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                <Monitor className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-200">Windows 11 Mica Frame</div>
                  <div className="text-[11px] text-slate-400">
                    Acrylic/Mica translucent window styling and native window controls.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-200">Direct Folder Export</div>
                  <div className="text-[11px] text-slate-400">
                    Native Windows save dialog saves 4K MP4s directly into your Videos folder.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-200">Local Machine Security</div>
                  <div className="text-[11px] text-slate-400">
                    Gemini API key is encrypted locally on your computer with zero cloud telemetry.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-200">Direct Veo Endpoint</div>
                  <div className="text-[11px] text-slate-400">
                    Communicates straight with Google Gemini Veo TPU clusters.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
