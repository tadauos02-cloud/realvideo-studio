import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enhancePrompt,
  validateGeminiApiKey,
  estimateGenerationSeconds,
  formatTime,
  buildVeoRequestPayload,
  DEFAULT_REALISM_CONFIG,
  DEFAULT_NEGATIVE_PROMPT,
} from './realismEngine';

test('enhancePrompt injects all specified photorealism keywords when enabled', () => {
  const raw = 'A street portrait of an elderly watchmaker working in a dusty shop';
  const enhanced = enhancePrompt(raw, DEFAULT_REALISM_CONFIG);

  assert.ok(enhanced.includes(raw), 'Should preserve original prompt');
  assert.ok(enhanced.includes('skin texture with microscopic pores'), 'Should include skin texture');
  assert.ok(enhanced.includes('natural fine wrinkles'), 'Should include wrinkles');
  assert.ok(enhanced.includes('natural eye blinks'), 'Should include eye blinks');
  assert.ok(enhanced.includes('breathing'), 'Should include breathing');
  assert.ok(enhanced.includes('handheld camera'), 'Should include handheld camera');
  assert.ok(enhanced.includes('soft natural sunlight'), 'Should include soft natural sunlight');
  assert.ok(enhanced.includes('dust particles'), 'Should include dust particles');
  assert.ok(enhanced.includes('motion blur'), 'Should include natural motion blur');
  assert.ok(enhanced.includes('4K'), 'Should include 4K resolution');
  assert.ok(enhanced.includes('30fps'), 'Should include 30fps frame rate');
  assert.ok(enhanced.includes('non-CGI'), 'Should emphasize non-CGI phone-camera look');
});

test('enhancePrompt returns untouched string when realism is disabled', () => {
  const raw = 'A cat sleeping on a sunny porch';
  const enhanced = enhancePrompt(raw, { ...DEFAULT_REALISM_CONFIG, enabled: false });
  assert.equal(enhanced, raw);
});

test('enhancePrompt handles empty string safely', () => {
  const enhanced = enhancePrompt('   ', DEFAULT_REALISM_CONFIG);
  assert.equal(enhanced, '');
});

test('validateGeminiApiKey correctly validates valid and invalid keys', () => {
  const validKey = 'AIzaSy' + 'A'.repeat(33);
  assert.equal(validateGeminiApiKey(validKey).valid, true);

  const emptyKey = validateGeminiApiKey('');
  assert.equal(emptyKey.valid, false);

  const invalidPrefix = validateGeminiApiKey('sk-123456789012345678901234567890');
  assert.equal(invalidPrefix.valid, false);
});

test('estimateGenerationSeconds gives realistic values for Veo 3 vs Veo 3 Fast', () => {
  const fast5 = estimateGenerationSeconds('veo-3-fast', 5);
  const veo5 = estimateGenerationSeconds('veo-3', 5);
  assert.ok(fast5 < veo5, 'Fast model should take less time than standard Veo 3');

  const fast600 = estimateGenerationSeconds('veo-3-fast', 600);
  assert.ok(fast600 > fast5, 'Longer duration should take more time');
});

test('formatTime formats seconds into mm:ss', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(600), '10:00');
});

test('buildVeoRequestPayload constructs accurate Gemini payload', () => {
  const payload = buildVeoRequestPayload({
    prompt: 'A bustling night market with warm lanterns',
    enhancedPrompt: 'A bustling night market with warm lanterns. Photorealistic...',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    model: 'veo-3',
    aspectRatio: '16:9',
    duration: 5,
    realism: DEFAULT_REALISM_CONFIG,
  });

  assert.equal(payload.model, 'gemini-omni-1.1-flash');
  assert.equal(payload.response_format.aspect_ratio, '16:9');
  assert.equal(payload.response_format.duration, '5s');
  assert.equal(payload.response_format.resolution, '4k');
  assert.equal(payload.response_format.fps, 30);
  assert.ok(payload.negative_prompt.includes('plastic smooth skin'));
});
