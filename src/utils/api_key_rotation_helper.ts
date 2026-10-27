import { AppSettings } from '../types';

/**
 * Executes an API request with automatic key rotation/failover
 * if a key encounters a quota limit (429), rate limit, or authentication error.
 */
export async function executeWithApiKeyRotation<T>(
  settings: AppSettings,
  apiCall: (apiKey: string) => Promise<T>
): Promise<T> {
  const keys = settings.apiKeys && settings.apiKeys.length > 0 
    ? settings.apiKeys 
    : (settings.apiKey ? [settings.apiKey] : []);

  if (keys.length === 0) {
    throw new Error('No API keys configured. Please add at least one API key in settings.');
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    try {
      // Attempt the API call with the current key
      return await apiCall(currentKey);
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || '';
      
      // Check if error is related to quota (429), rate limit, or unauthorized (401/403)
      const isQuotaOrAuthError = 
        errorMessage.includes('429') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('rate limit') || 
        errorMessage.includes('401') || 
        errorMessage.includes('403') ||
        errorMessage.includes('API key');

      // If there are more keys available and it's a quota/auth error, rotate to the next key
      if (isQuotaOrAuthError && i < keys.length - 1) {
        console.warn(`API key index ${i} failed or hit quota. Rotating to next key automatically...`, err);
        continue;
      } else {
        // If it's a different type of error or no keys left, throw the error
        throw err;
      }
    }
  }

  throw lastError || new Error('All configured API keys failed.');
}