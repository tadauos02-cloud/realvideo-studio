import { Router, Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

type JsonObject = Record<string, any>;
type ProviderConfig = {
  id: string;
  name?: string;
  enabled?: boolean;
  createUrl: string;
  apiKey: string;
  authHeader?: string;
  authPrefix?: string;
  extraHeaders?: Record<string, string>;
  requestTemplate: JsonObject;
  videoUrlPath?: string;
  operationUrlPath?: string;
  statusPath?: string;
  successStatuses?: string[];
  failureStatuses?: string[];
  pollIntervalMs?: number;
  timeoutMs?: number;
};

const router = Router();
const videoDir = path.join(os.tmpdir(), 'realvideo-studio-generated');
const DEFAULT_SUCCESS = ['succeeded', 'success', 'completed', 'complete', 'done'];
const DEFAULT_FAILURE = ['failed', 'error', 'cancelled', 'canceled', 'rejected'];
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

function getPath(value: any, dottedPath?: string): any {
  if (!dottedPath) return undefined;
  return dottedPath.split('.').reduce((current, key) => current == null ? undefined : current[key], value);
}

function renderTemplate(value: any, context: Record<string, any>): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
      const result = getPath(context, key);
      return result == null ? '' : String(result);
    });
  }
  if (Array.isArray(value)) return value.map(item => renderTemplate(item, context));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renderTemplate(child, context)]));
  }
  return value;
}

function isSafeProviderUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' &&
      host !== 'localhost' &&
      !host.endsWith('.localhost') &&
      !host.endsWith('.local') &&
      !/^127\./.test(host) &&
      host !== '::1' &&
      !/^10\./.test(host) &&
      !/^192\.168\./.test(host) &&
      !/^169\.254\./.test(host) &&
      !/^172\.(1[6-9]|2\d|3[01])\./.test(host);
  } catch {
    return false;
  }
}

function findVideoUrl(value: any, depth = 0): string | undefined {
  if (!value || depth > 10) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && /^https:\/\//i.test(child) &&
      (/(video|output|download|result|uri|url)/i.test(key) || /\.mp4([?#]|$)/i.test(child))) return child;
  }
  for (const child of Object.values(value)) {
    const found = findVideoUrl(child, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function normalizeProviders(input: unknown): ProviderConfig[] {
  if (!Array.isArray(input)) return [];
  return input.filter((provider: any) =>
    provider && provider.enabled !== false &&
    typeof provider.id === 'string' && provider.id.trim() &&
    typeof provider.createUrl === 'string' && typeof provider.apiKey === 'string' &&
    provider.apiKey.trim() && provider.requestTemplate && typeof provider.requestTemplate === 'object'
  ) as ProviderConfig[];
}

function makeHeaders(provider: ProviderConfig): Record<string, string> {
  const header = provider.authHeader || 'Authorization';
  const prefix = provider.authPrefix === undefined
    ? (header.toLowerCase() === 'authorization' ? 'Bearer ' : '')
    : provider.authPrefix;
  return {
    'Content-Type': 'application/json',
    ...(provider.extraHeaders || {}),
    [header]: prefix + provider.apiKey,
  };
}

function errorMessage(error: any): string {
  const body = error?.response?.data;
  const remote = body?.error?.message || body?.error || body?.message;
  if (typeof remote === 'string') return remote.slice(0, 500);
  return String(error?.message || 'Provider request failed').slice(0, 500);
}

async function generateWithProvider(provider: ProviderConfig, input: JsonObject) {
  if (!isSafeProviderUrl(provider.createUrl)) {
    throw new Error('Provider createUrl must be a public HTTPS URL (local/private hosts are blocked).');
  }
  const context = {
    prompt: input.enhancedPrompt || input.prompt,
    originalPrompt: input.prompt,
    negativePrompt: input.negativePrompt || '',
    model: input.model || '',
    duration: Number(input.duration) || 5,
    aspectRatio: input.aspectRatio || '16:9',
    resolution: input.resolution || '720p',
    fps: Number(input.fps) || 24,
  };
  const timeout = Math.max(10000, Math.min(180000, Number(provider.timeoutMs) || 60000));
  let response = await axios.post(provider.createUrl, renderTemplate(provider.requestTemplate, context), {
    headers: makeHeaders(provider), timeout, validateStatus: status => status >= 200 && status < 300,
  });
  let data = response.data;
  const deadline = Date.now() + Math.max(timeout, 10 * 60 * 1000);
  const pollInterval = Math.max(1000, Math.min(30000, Number(provider.pollIntervalMs) || 5000));
  const success = (provider.successStatuses || DEFAULT_SUCCESS).map(x => x.toLowerCase());
  const failure = (provider.failureStatuses || DEFAULT_FAILURE).map(x => x.toLowerCase());

  while (provider.operationUrlPath) {
    const statusValue = String(getPath(data, provider.statusPath) || '').toLowerCase();
    const operationUrl = getPath(data, provider.operationUrlPath);
    const videoUrl = getPath(data, provider.videoUrlPath) || findVideoUrl(data);
    if (videoUrl && typeof videoUrl === 'string') break;
    if (statusValue && failure.includes(statusValue)) {
      throw new Error('Provider job ended with status: ' + statusValue);
    }
    if (statusValue && success.includes(statusValue) && !videoUrl) {
      throw new Error('Provider reported success but no video URL was found; configure videoUrlPath.');
    }
    if (!operationUrl || typeof operationUrl !== 'string') {
      throw new Error('No video URL or operation URL found. Configure operationUrlPath/videoUrlPath for this API response.');
    }
    if (!isSafeProviderUrl(operationUrl)) throw new Error('Provider operation URL must be a public HTTPS URL.');
    if (Date.now() >= deadline) throw new Error('Provider generation timed out.');
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    response = await axios.get(operationUrl, { headers: makeHeaders(provider), timeout, validateStatus: status => status >= 200 && status < 300 });
    data = response.data;
  }

  const finalUrl = getPath(data, provider.videoUrlPath) || findVideoUrl(data);
  if (typeof finalUrl !== 'string' || !isSafeProviderUrl(finalUrl)) {
    throw new Error('No public HTTPS video URL found. Configure videoUrlPath to match the provider response.');
  }
  const download = await axios.get(finalUrl, {
    responseType: 'arraybuffer', timeout: 180000,
    // Do not forward API credentials to a signed output URL.
  });
  const bytes = Buffer.from(download.data);
  if (bytes.length < 1000) throw new Error('Provider output is too small to be a valid video.');
  await fs.mkdir(videoDir, { recursive: true });
  const fileName = 'video-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.mp4';
  await fs.writeFile(path.join(videoDir, fileName), bytes);
  return {
    videoUrl: '/api/videos/' + fileName,
    provider: provider.name || provider.id,
    fileSizeMb: Number((bytes.length / (1024 * 1024)).toFixed(2)),
    mimeType: download.headers['content-type'] || 'video/mp4',
  };
}

router.get('/providers/capabilities', (_req: Request, res: Response) => {
  res.json({
    adapters: ['custom-json-rest'],
    note: 'Provider APIs use different schemas. Configure requestTemplate and response paths for each provider; not every API supports video generation.',
    templateVariables: ['prompt', 'originalPrompt', 'negativePrompt', 'model', 'duration', 'aspectRatio', 'resolution', 'fps'],
  });
});

router.post('/generate-video', async (req: Request, res: Response) => {
  const { prompt, providers: rawProviders, providersJson } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt is required.' });
  }
  let envProviders: unknown = [];
  try {
    envProviders = process.env.AI_VIDEO_PROVIDERS_JSON ? JSON.parse(process.env.AI_VIDEO_PROVIDERS_JSON) : [];
  } catch {
    return res.status(500).json({ success: false, error: 'AI_VIDEO_PROVIDERS_JSON is not valid JSON.' });
  }
  let configuredProviders: unknown = rawProviders;
  if (typeof providersJson === 'string' && providersJson.trim()) {
    try { configuredProviders = JSON.parse(providersJson); }
    catch { return res.status(400).json({ success: false, error: 'Provider configuration must be valid JSON.' }); }
  }
  const providers = normalizeProviders(Array.isArray(configuredProviders) && configuredProviders.length ? configuredProviders : envProviders);
  if (!providers.length) {
    return res.status(400).json({ success: false, error: 'No enabled video providers configured. Add provider configurations in Settings or AI_VIDEO_PROVIDERS_JSON.' });
  }
  const errors: Array<{ provider: string; error: string; status?: number }> = [];
  for (const provider of providers) {
    try {
      const result = await generateWithProvider(provider, req.body);
      return res.json({
        success: true,
        ...result,
        prompt,
        enhancedPrompt: req.body.enhancedPrompt || prompt,
        negativePrompt: req.body.negativePrompt || '',
        aspectRatio: req.body.aspectRatio || '16:9',
        duration: Number(req.body.duration) || 5,
        resolution: req.body.resolution || '720p',
        fps: Number(req.body.fps) || 24,
      });
    } catch (error: any) {
      const status = Number(error?.response?.status) || undefined;
      const message = errorMessage(error);
      errors.push({ provider: provider.name || provider.id, error: message, status });
      console.warn('[RealVideo Studio] Provider "' + (provider.name || provider.id) + '" failed: ' + message);
      // Try the next configured provider on auth/rate-limit/server/network failures and adapter errors.
      // A 400/422 usually means the same prompt/config will fail elsewhere too, so continue only to allow distinct APIs.
      if (status && !RETRYABLE.has(status) && status !== 400 && status !== 401 && status !== 403 && status !== 404 && status !== 422) break;
    }
  }
  return res.status(502).json({
    success: false,
    error: 'All configured video providers failed. Check provider order, credentials, request template and API access.',
    providers: errors,
  });
});

export default router;
