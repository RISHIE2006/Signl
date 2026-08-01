import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Ordered list of Gemini models to try, from newest/most-capable to stable fallbacks.
 * If the primary model is unavailable (quota, 404, deprecation), the next one is tried automatically.
 * Note: `gemini-2.0-flash` was retired and removed from this chain.
 */
export const MODEL_FALLBACK_CHAIN = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

/**
 * Generates content using the Gemini API with automatic model fallback.
 * Tries each model in MODEL_FALLBACK_CHAIN until one succeeds.
 *
 * @param {string} prompt - The prompt to send to the model.
 * @param {object} [options] - Optional generation config (temperature, etc.)
 * @returns {Promise<string>} - The text response from the model.
 * @throws Will throw if ALL models in the chain fail.
 */
export async function generateWithFallback(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('GEMINI_API_KEY is not configured in .env.local.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName, ...options });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (modelName !== MODEL_FALLBACK_CHAIN[0]) {
        console.warn(`[Gemini] Used fallback model: ${modelName}`);
      }
      return text;
    } catch (err) {
      const isRetryable =
        err.message?.includes('404') ||
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('Too Many Requests') ||
        err.message?.includes('not found') ||
        err.message?.includes('not supported') ||
        err.status === 404 ||
        err.status === 429 ||
        err.statusCode === 429;

      console.warn(`[Gemini] Model ${modelName} failed: ${err.message}`);
      lastError = err;

      if (!isRetryable) {
        // Non-retryable error (bad prompt, auth issue, etc.) — fail fast
        throw err;
      }
      // Otherwise, try the next model in the chain
    }
  }

  throw new Error(
    `All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Creates a Gemini chat session with automatic model fallback.
 * Tries each model in MODEL_FALLBACK_CHAIN and sends the first message to verify it works.
 *
 * @param {string} lastMessage - The most recent user message to send.
 * @param {Array}  chatHistory - Prior turns in Gemini history format.
 * @param {string} systemInstruction - System prompt for the model.
 * @param {object} [generationConfig] - Optional generation config.
 * @returns {Promise<string>} - The text response.
 */
export async function generateChatWithFallback(lastMessage, chatHistory, systemInstruction, generationConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('GEMINI_API_KEY is not configured in .env.local.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`[Gemini Chat] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const chat = model.startChat({ history: chatHistory, generationConfig });
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      if (modelName !== MODEL_FALLBACK_CHAIN[0]) {
        console.warn(`[Gemini Chat] Used fallback model: ${modelName}`);
      }
      return text;
    } catch (err) {
      const isRetryable =
        err.message?.includes('404') ||
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('Too Many Requests') ||
        err.message?.includes('not found') ||
        err.message?.includes('not supported') ||
        err.status === 404 ||
        err.status === 429 ||
        err.statusCode === 429;

      console.warn(`[Gemini Chat] Model ${modelName} failed: ${err.message}`);
      lastError = err;

      if (!isRetryable) {
        throw err;
      }
    }
  }

  throw new Error(
    `All Gemini chat models failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}
