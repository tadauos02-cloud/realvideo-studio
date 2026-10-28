# Universal AI Video Provider Router

RealVideo Studio now has an ordered, provider-agnostic video generation route:

- `POST /api/universal/generate-video`
- `GET /api/universal/providers/capabilities`

## What it does

1. Reads provider configurations in priority order from Settings, or from the server-only `AI_VIDEO_PROVIDERS_JSON` environment variable when no UI providers are configured.
2. Sends each provider its own request body template and authentication header.
3. Supports synchronous responses containing a video URL and asynchronous APIs that return an operation/status URL.
4. Polls the operation URL until a video is available or the configured timeout is reached.
5. Downloads the resulting video locally and returns a RealVideo Studio `videoUrl`.
6. Moves to the next provider when the current provider fails, including expired/invalid credentials, rate limits, server errors, and incompatible response formats.

This is a configurable **REST adapter**, not a magic universal protocol. Video APIs have different request formats, auth methods, job lifecycle, and output shapes. Any public HTTPS REST API can be configured when its schema fits this adapter. OAuth-only services, multipart/image workflows, special signing, or unusual job APIs need a dedicated adapter. The provider must actually offer video generation; a text/chat API cannot be made into a video generator by adding its key.

## Settings JSON format

Add an ordered JSON array under **Settings → Universal Video API Providers**. Each provider is tried in order.

```json
[
  {
    "id": "primary-video",
    "name": "Primary Video API",
    "enabled": true,
    "createUrl": "https://api.example.com/v1/videos",
    "apiKey": "REPLACE_WITH_REAL_KEY",
    "authHeader": "Authorization",
    "authPrefix": "Bearer ",
    "extraHeaders": {},
    "requestTemplate": {
      "model": "your-video-model",
      "prompt": "{{prompt}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{aspectRatio}}",
      "resolution": "{{resolution}}"
    },
    "videoUrlPath": "data.video.url",
    "operationUrlPath": "data.status_url",
    "statusPath": "data.status",
    "successStatuses": ["completed", "succeeded"],
    "failureStatuses": ["failed", "error"],
    "pollIntervalMs": 5000,
    "timeoutMs": 60000
  },
  {
    "id": "backup-video",
    "name": "Backup Video API",
    "enabled": true,
    "createUrl": "https://backup.example.com/api/generate",
    "apiKey": "REPLACE_WITH_BACKUP_KEY",
    "authHeader": "x-api-key",
    "authPrefix": "",
    "requestTemplate": {
      "text": "{{prompt}}",
      "seconds": "{{duration}}"
    },
    "videoUrlPath": "result.url"
  }
]
```

The URLs and field paths above are examples only. Replace them with the exact API endpoint and JSON schema documented by each provider.

### Template variables

- `{{prompt}}`: enhanced prompt if available
- `{{originalPrompt}}`: raw user prompt
- `{{negativePrompt}}`
- `{{model}}`
- `{{duration}}` (number)
- `{{aspectRatio}}`
- `{{resolution}}`
- `{{fps}}`

Use `videoUrlPath` as a dot-separated path to the final video URL. For asynchronous APIs, set `operationUrlPath` to the full HTTPS status/poll URL and `statusPath` to the job status. Set `successStatuses` and `failureStatuses` to the provider's actual status values. If the final response has a conventional `video`, `output`, `download`, `result`, or `uri` URL, automatic URL discovery may work, but an explicit path is more reliable.

The request template is a JSON object, not a string. A value consisting only of `"{{duration}}"` is substituted as a number; other placeholders inside strings are substituted as text.

## Server-only configuration

For deployments where API keys should not be in browser localStorage, set `AI_VIDEO_PROVIDERS_JSON` in the server environment. The same JSON schema is accepted. Keep this variable out of Git and logs. UI-configured providers currently live in the app's existing localStorage settings, so use the UI only on a private trusted machine. Do not share screenshots or settings exports containing keys.

## Failover behaviour and limitations

- Providers are attempted in the order configured.
- A failed provider does not stop the queue from trying the next configured provider.
- Provider schemas are not interchangeable; incorrect `requestTemplate` or response paths cause that provider to fail and the next one to be tried.
- A successful generation request can consume provider credits even if later download/stitching fails. Configure idempotency keys or provider-specific job IDs in a dedicated adapter if the service supports them.
- API rate limits, account entitlements, billing, and video-generation support remain controlled by each provider.
- URLs must be public HTTPS; localhost/private-network targets are blocked as a basic SSRF safeguard.
- The router returns one generated clip. Long-form scene planning, durable queue persistence, and FFmpeg stitching are separate features and are not implemented by this provider router itself.
