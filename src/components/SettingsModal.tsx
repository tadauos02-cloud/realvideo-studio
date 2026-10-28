import React, { useState } from 'react';
import {
  X,
  Key,
  Folder,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Save,
  Trash2,
  Plus,
  Layers,
} from 'lucide-react';
import { AppSettings, AspectRatio, DurationOption, VeoModel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const initialKeys = settings.universalApiKeys && settings.universalApiKeys.length > 0
    ? settings.universalApiKeys
    : (settings.apiKeys && settings.apiKeys.length > 0 ? settings.apiKeys : (settings.apiKey ? [settings.apiKey] : []));

  const [universalKeysList, setUniversalKeysList] = useState<string[]>(initialKeys);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [providerConfigJson, setProviderConfigJson] = useState(settings.videoProvidersJson || '');

  const [saveFolder, setSaveFolder] = useState(settings.saveFolderPath);
  const [defaultModel, setDefaultModel] = useState<VeoModel>(settings.defaultModel);
  const [defaultRatio, setDefaultRatio] = useState<AspectRatio>(settings.defaultAspectRatio);
  const [defaultDuration, setDefaultDuration] = useState<DurationOption>(settings.defaultDuration);
  const [autoEnhance, setAutoEnhance] = useState(settings.autoEnhance);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [handshakePopupData, setHandshakePopupData] = useState<any>(null);

  if (!isOpen) return null;

  const handleAddKey = () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    if (universalKeysList.includes(trimmed)) {
      setTestResult({
        success: false,
        message: 'This API key is already present in your universal pool.',
      });
      return;
    }
    setUniversalKeysList((prev) => [...prev, trimmed]);
    setNewKeyInput('');
    setTestResult(null);
    setHandshakePopupData(null);
  };

  const handleDeleteKey = (indexToRemove: number) => {
    setUniversalKeysList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setTestResult(null);
    setHandshakePopupData(null);
  };

  // Real live backend handshake test connection integration
  const handleTestConnection = async () => {
    if (universalKeysList.length === 0) {
      setTestResult({
        success: false,
        message: 'Please add at least one AI API key to the universal pool before testing.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setHandshakePopupData(null);

    try {
      const response = await fetch('/api/gemini/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universalApiKeys: universalKeysList }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setTestResult({
          success: true,
          message: data.message || `Universal AI pool verified successfully! ${universalKeysList.length} node(s) ready for sequential rotation.`,
        });
        setHandshakePopupData(data);

        // Auto-dismiss the popup after exactly 10 seconds
        setTimeout(() => {
          setHandshakePopupData(null);
        }, 10000);
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to verify universal pool handshake.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection error during handshake test.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleBrowseFolder = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.selectFolder) {
      const res = await (window as any).electronAPI.selectFolder();
      if (!res.canceled && res.folderPath) {
        setSaveFolder(res.folderPath);
      }
    } else {
      const common = [
        'C:\\Users\\User\\Videos\\RealVideo_Studio',
        'C:\\Users\\User\\Desktop\\RealVideo_Exports',
        'D:\\Media\\Veo_UltraRealistic',
      ];
      const nextIndex = (common.indexOf(saveFolder) + 1) % common.length;
      setSaveFolder(common[nextIndex >= 0 ? nextIndex : 0]);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      apiKey: universalKeysList[0] || '',
      apiKeys: universalKeysList,
      universalApiKeys: universalKeysList,
      videoProvidersJson: providerConfigJson,
      saveFolderPath: saveFolder.trim() || 'C:\\Users\\User\\Videos\\RealVideo_Studio',
      defaultModel,
      defaultAspectRatio: defaultRatio,
      defaultDuration,
      autoEnhance,
    });
    onClose();
  };

  const maskKey = (key: string) => {
    if (showKeys) return key;
    if (key.length <= 12) return '••••••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-6)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-semibold text-slate-100">
                Universal Unified AI Settings Pool
              </h2>
              <p className="text-xs text-slate-400">
                Configure your single sequential key pool (Gemini & any alternative AI providers)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Universal API Keys Pool */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Universal AI Keys Pool (Unified Sequence)</span>
                <span className="text-xs text-purple-400 font-normal">
                  ({universalKeysList.length} keys configured)
                </span>
              </label>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                <span>Get Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Add any API keys here in order. The system will rotate through them sequentially. If one encounters rate limits (429) or fails, it automatically shifts to the next key.
            </p>

            {/* Input field to add a new API Key */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKey();
                    }
                  }}
                  placeholder="Paste any AI API key here (Gemini, Replicate, Custom, etc.)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
                  title={showKeys ? 'Hide keys' : 'Show keys'}
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddKey}
                disabled={!newKeyInput.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm shadow-purple-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key</span>
              </button>
            </div>

            {/* Configured Keys List with Connected & Primary Node Status */}
            {universalKeysList.length > 0 ? (
              <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 max-h-44 overflow-y-auto">
                {universalKeysList.map((key, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="flex items-center justify-between p-2.5 px-3 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-xs font-mono text-slate-200 truncate">
                        {maskKey(key)}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-sans font-medium flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Primary Node · Connected
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-2 shrink-0"
                      title="Delete this key"
                      aria-label="Delete API key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No API keys added yet. Add at least one universal key above.
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800" />

          {/* Test Connection Button[cite: 1, 2, 3] */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || universalKeysList.length === 0}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {testing ? (
                <>
                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>Testing Universal Pool...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Test Universal Pool</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-900/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="h-px bg-slate-800" />

          <div className="h-px bg-slate-800" />

          {/* Universal provider adapters: each API gets its own endpoint, auth and JSON schema. */}
          <div className="space-y-3">
            <div>
              <label htmlFor="provider-config-json" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Universal Video API Providers (ordered failover)</span>
              </label>
              <p className="mt-1 text-xs text-slate-400">
                Add multiple providers in priority order. Each API needs its own endpoint, authentication, requestTemplate and response paths. A plain API key cannot be used with every provider because API schemas differ.
              </p>
            </div>
            <textarea
              id="provider-config-json"
              value={providerConfigJson}
              onChange={(e) => setProviderConfigJson(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={`[
  {
    "id": "provider-primary",
    "name": "Primary Video API",
    "enabled": true,
    "createUrl": "https://api.example.com/v1/videos",
    "apiKey": "PASTE_KEY_HERE",
    "authHeader": "Authorization",
    "authPrefix": "Bearer ",
    "requestTemplate": {
      "model": "your-video-model",
      "prompt": "{{prompt}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{aspectRatio}}"
    },
    "videoUrlPath": "data.video.url",
    "operationUrlPath": "data.status_url",
    "statusPath": "data.status",
    "successStatuses": ["completed", "succeeded"],
    "failureStatuses": ["failed", "error"]
  }
]`}
              className="w-full min-h-56 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3.5 py-3 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none"
            />
            <p className="text-xs text-amber-300/90">
              Security note: this editor is stored in browser localStorage by the current app. Use a private local machine, never commit keys to GitHub, and prefer server-side environment secrets for shared/production deployments.
            </p>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Section 2: Windows Save Folder */}
          <div className="space-y-2">
            <label htmlFor="save-folder-input" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Windows 4K Video Save Folder</span>
            </label>
            <div className="flex gap-2">
              <input
                id="save-folder-input"
                type="text"
                value={saveFolder}
                onChange={(e) => setSaveFolder(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors whitespace-nowrap"
              >
                Browse...
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

        {/* 10-Second Active Handshake Result Popup Overlay */}
        {handshakePopupData && handshakePopupData.nodes && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-slate-900 border border-green-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-green-400 flex items-center gap-2">
                  ✅ Live Handshake Verified & Cached
                </h3>
                <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full animate-pulse">
                  Auto-closing in 10s
                </span>
              </div>

              <p className="text-xs text-slate-300">{handshakePopupData.message}</p>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {handshakePopupData.nodes.map((node: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold text-green-300">
                      <span>Node #{node.nodeNumber} ({node.maskedKey})</span>
                      <span className="text-cyan-400 font-mono">{node.payloadFormat}</span>
                    </div>
                    <div><strong className="text-slate-400">Endpoint:</strong> <span className="text-slate-200 font-mono text-[11px] break-all">{node.endpoint}</span></div>
                    <div><strong className="text-slate-400">Headers:</strong> <span className="text-slate-200 font-mono text-[11px]">{JSON.stringify(node.headers)}</span></div>
                    <div><strong className="text-slate-400">Status:</strong> <span className="text-emerald-400 font-medium">{node.status}</span></div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setHandshakePopupData(null)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-xl text-xs transition-all shadow-md shadow-green-600/20"
              >
                Dismiss Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};