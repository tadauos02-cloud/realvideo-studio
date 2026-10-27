import { AppSettings, VideoRecord } from '../types';
import { DEFAULT_SETTINGS } from './realismEngine';
import { SAMPLE_VIDEOS } from './sampleVideos';

const SETTINGS_KEY = 'realvideo_studio_settings_v1';
const HISTORY_KEY = 'realvideo_studio_history_v1';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function loadHistory(): VideoRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      // Initialize with realistic samples
      saveHistory(SAMPLE_VIDEOS);
      return SAMPLE_VIDEOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_VIDEOS;
  } catch (err) {
    console.error('Failed to load history from localStorage:', err);
    return SAMPLE_VIDEOS;
  }
}

export function saveHistory(records: VideoRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

export function addVideoToHistory(video: VideoRecord): VideoRecord[] {
  const current = loadHistory();
  const updated = [video, ...current.filter((v) => v.id !== video.id)];
  saveHistory(updated);
  return updated;
}

export function removeVideoFromHistory(id: string): VideoRecord[] {
  const current = loadHistory();
  const updated = current.filter((v) => v.id !== id);
  saveHistory(updated);
  return updated;
}
