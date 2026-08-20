import { rateLimit } from './ratelimit.js';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const XAI_MODEL = 'grok-2-latest';

function buildGroqPayload(prompt, options = {}) {
  return {
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxOutputTokens ?? 4096,
  };
}

function buildGroqChatPayload(lastMessage, chatHistory = [], systemInstruction, generationConfig = {}) {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  if (Array.isArray(chatHistory)) {
    chatHistory.forEach((message) => {
      messages.push({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.parts?.[0]?.text || message.content || '',
      });
    });
  }
  messages.push({ role: 'user', content: lastMessage });

  return {
    model: generationConfig.model,
    messages,
    temperature: generationConfig.temperature ?? 0.7,
    max_tokens: generationConfig.maxOutputTokens ?? 4096,
  };
}

function resolveProviderConfig() {
  const candidates = [
    { key: process.env.GEMINI_API_KEY, source: 'GEMINI_API_KEY' },
    { key: process.env.GROK_API_KEY, source: 'GROK_API_KEY' },
    { key: process.env.GROQ_API_KEY, source: 'GROQ_API_KEY' },
    { key: process.env.XAI_API_KEY, source: 'XAI_API_KEY' },
  ];

  const found = candidates.find(
    (item) =>
      typeof item.key === 'string' &&
      item.key.trim() &&
      !['your_grok_api_key', 'your_gemini_api_key', 'your_xai_api_key', 'your_groq_api_key'].includes(item.key.trim())
  );

  if (!found) return null;

  const key = found.key.trim();

  if (found.source === 'GEMINI_API_KEY' || key.startsWith('AQ.') || key.startsWith('AIza')) {
    return {
      apiKey: key,
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      defaultModel: GEMINI_MODEL,
    };
  }

  if (key.startsWith('gsk_') || found.source === 'GROQ_API_KEY') {
    return {
      apiKey: key,
      url: 'https://api.groq.com/openai/v1/chat/completions',
      defaultModel: GROQ_MODEL,
    };
  }

  return {
    apiKey: key,
    url: 'https://api.x.ai/v1/chat/completions',
    defaultModel: XAI_MODEL,
  };
}

async function callGroq(payload, rateLimitKey) {
  const rl = rateLimit(rateLimitKey || 'ai-provider', '/api/ai');
  if (!rl.success) {
    throw new Error('Rate limit exceeded (10 requests/sec). Please slow down your requests.');
  }

  const config = resolveProviderConfig();
  if (!config) {
    throw new Error('GEMINI_API_KEY (or GROK_API_KEY) is not configured in .env.local.');
  }

  const finalPayload = {
    ...payload,
    model: payload.model || config.defaultModel,
  };

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(finalPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithFallback(prompt, options = {}) {
  const payload = buildGroqPayload(prompt, options);
  return callGroq(payload, options.rateLimitKey);
}

export async function generateChatWithFallback(lastMessage, chatHistory, systemInstruction, generationConfig = {}) {
  const payload = buildGroqChatPayload(lastMessage, chatHistory, systemInstruction, generationConfig);
  return callGroq(payload, generationConfig.rateLimitKey);
}
