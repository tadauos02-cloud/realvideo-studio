import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs/promises';
import os from 'os';
import universalProviderRouter from './src/server/universalProviderRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

// Provider-agnostic API router: ordered failover across independently configured video APIs.
app.use('/api/universal', universalProviderRouter);

const videoDir = path.join(os.tmpdir(), 'realvideo-studio-generated');
const generationModel = 'gemini-omni-1.1-flash';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.use('/api/videos', express.static(videoDir, {
  setHeaders(res) {
    res.setHeader('Cache-Control', 'private, max-age=3600');
  },
}));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'RealVideo Studio',
    version: '1.1.0',
    provider: 'Gemini Interactions API',
    serverKeyConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.UNIVERSAL_API_KEYS || process.env.API_KEY),
  });
});

function getKeys(body: any): string[] {
  const values: unknown[] = [];
  for (const value of [body?.universalApiKeys, body?.apiKeys, body?.apiKey,
    process.env.GEMINI_API_KEY, process.env.UNIVERSAL_API_KEYS, process.env.API_KEY]) {
    if (Array.isArray(value)) values.push(...value);
    else if (typeof value === 'string') values.push(...value.split(/[\\r\\n,]+/));
  }
  return [...new Set(values.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean))];
}

function findVideoUri(value: any, depth = 0): string | undefined {
  if (!value || depth > 12) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoUri(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  const type = String(value.type || value.mimeType || value.mime_type || '').toLowerCase();
  const uri = value.uri || value.url || value.videoUri || value.video_uri;
  if (typeof uri === 'string' && /^https:\\/\\//i.test(uri) &&
      (type.includes('video') || /video|\.mp4([?#]|$)/i.test(uri))) return uri;
  for (const [key, child] of Object.entries(value)) {
    if (['prompt', 'text', 'message', 'model'].includes(key)) continue;
    const found = findVideoUri(child, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function findInlineVideo(value: any, depth = 0): { data: string; mimeType: string } | undefined {
  if (!value || depth > 12) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findInlineVideo(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  const mime = String(value.mimeType || value.mime_type || '').toLowerCase();
  const data = value.data || value.bytes;
  if (typeof data === 'string' && mime.startsWith('video/')) return { data, mimeType: mime };
  for (const [key, child] of Object.entries(value)) {
    if (['prompt', 'text', 'message', 'model'].includes(key)) continue;
    const found = findInlineVideo(child, depth + 1);
    if (found) return found;
  }
  return undefined;
}

app.post('/api/gemini/test-key', async (req: Request, res: Response) => {
  const keys = getKeys(req.body);
  if (!keys.length) return res.status(400).json({ valid: false, error: 'Add a Gemini API key in Settings first.' });

  const results = [];
  for (const key of keys) {
    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        { model: generationModel, input: 'Reply with the single word OK.', store: false },
        { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      results.push({
        nodeNumber: results.length + 1,
        maskedKey: key.length > 10 ? key.slice(0, 6) + '...' + key.slice(-4) : '••••',
        status: response.status >= 200 && response.status < 300 ? 'Connected' : 'Failed',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/interactions',
        headers: { 'x-goog-api-key': '[REDACTED]', 'Content-Type': 'application/json' },
        payloadFormat: 'Gemini Interactions API',
        provider: 'Google Gemini API',
      });
    } catch (error: any) {
      results.push({
        nodeNumber: results.length + 1,
        maskedKey: key.length > 10 ? key.slice(0, 6) + '...' + key.slice(-4) : '••••',
        status: 'Failed',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/interactions',
        headers: { 'x-goog-api-key': '[REDACTED]', 'Content-Type': 'application/json' },
        payloadFormat: 'Gemini Interactions API',
        error: error?.response?.data?.error?.message || 'Key check failed. Confirm the key and API access.',
        provider: 'Google Gemini API',
      });
    }
  }
  const valid = results.some(result => result.status === 'Connected');
  return res.status(valid ? 200 : 401).json({ valid, message: valid ? 'At least one Gemini key connected successfully.' : 'No Gemini keys passed the connection test.', nodes: results });
});

app.post('/api/gemini/generate-video', async (req: Request, res: Response) => {
  const keys = getKeys(req.body);
  const {
    prompt, enhancedPrompt, negativePrompt, aspectRatio = '16:9',
    duration = 5, resolution = '720p',
  } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt is required.' });
  }
  if (!keys.length) {
    return res.status(400).json({ success: false, error: 'No Gemini API key configured. Add a valid Gemini API key in Settings.' });
  }
  const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';
  const supportedDuration = Math.max(3, Math.min(10, Number(duration) || 5));
  const requestedResolution = ['360p', '720p', '1080p', '4k'].includes(String(resolution).toLowerCase())
    ? String(resolution).toLowerCase() : '720p';
  const finalPrompt = [enhancedPrompt || prompt, negativePrompt ? 'Avoid: ' + negativePrompt : ''].filter(Boolean).join('\\n\\n');
  let lastError = 'No provider returned a video.';
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    try {
      const createResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        {
          model: generationModel,
          input: finalPrompt,
          background: true,
          store: false,
          video_config: {
            task: 'text_to_video',
            response_format: {
              type: 'video',
              delivery: 'uri',
              aspect_ratio: ratio,
              duration: `${supportedDuration}s`,
              resolution: requestedResolution,
            },
          },
        },
        {
          headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
          timeout: 120000,
        }
      );

      let operation = createResponse.data;
      const operationId = operation?.id || operation?.name;
      const deadline = Date.now() + 6 * 60 * 1000;
      while (operation?.status && ['in_progress', 'running', 'queued', 'pending'].includes(String(operation.status).toLowerCase())) {
        if (!operationId || Date.now() >= deadline) throw new Error('Video generation timed out before the provider returned a completed video.');
        await sleep(5000);
        const pollResponse = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/interactions/${encodeURIComponent(operationId)}`,
          { headers: { 'x-goog-api-key': key }, timeout: 30000 }
        );
        operation = pollResponse.data;
      }

      if (operation?.status && ['failed', 'cancelled', 'incomplete'].includes(String(operation.status).toLowerCase())) {
        throw new Error(operation?.error?.message || operation?.message || `Provider ended with status: ${operation.status}`);
      }

      const videoUri = findVideoUri(operation);
      const inlineVideo = findInlineVideo(operation);
      let bytes: Buffer;
      let mimeType = 'video/mp4';
      if (videoUri) {
        const download = await axios.get(videoUri, {
          headers: { 'x-goog-api-key': key },
          responseType: 'arraybuffer',
          timeout: 120000,
        });
        bytes = Buffer.from(download.data);
        mimeType = download.headers['content-type'] || mimeType;
      } else if (inlineVideo) {
        bytes = Buffer.from(inlineVideo.data, 'base64');
        mimeType = inlineVideo.mimeType;
      } else {
        throw new Error('The API request completed but did not return a video file. No placeholder video was created.');
      }

      if (!bytes.length || bytes.length < 1000) {
        throw new Error('The provider response was too small to be a valid video file.');
      }
      await fs.mkdir(videoDir, { recursive: true });
      const fileName = `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`;
      await fs.writeFile(path.join(videoDir, fileName), bytes);
      const stat = await fs.stat(path.join(videoDir, fileName));
      return res.json({
        success: true,
        videoUrl: `/api/videos/${fileName}`,
        prompt,
        enhancedPrompt: finalPrompt,
        negativePrompt,
        model: generationModel,
        aspectRatio: ratio,
        duration: supportedDuration,
        resolution: requestedResolution,
        fps: 24,
        fileSizeMb: Number((stat.size / (1024 * 1024)).toFixed(2)),
        mimeType,
        provider: 'Google Gemini Omni Flash',
      });
    } catch (error: any) {
      lastError = error?.response?.data?.error?.message || error?.message || String(error);
      console.warn(`[RealVideo Studio] Gemini key node ${index + 1} failed: ${lastError}`);
    }
  }
  return res.status(502).json({
    success: false,
    error: `Video generation failed for all configured Gemini keys. ${lastError}`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[RealVideo Studio] Universal Server active on http://0.0.0.0:${port}`);
  });
}

startServer();