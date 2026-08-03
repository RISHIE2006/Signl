const GROQ_MODEL = 'llama-3.3-70b-versatile';
const XAI_MODEL = 'grok-2-latest';

function buildGroqPayload(prompt, options = {}) {
  return {
    model: options.model || GROQ_MODEL,
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
    model: generationConfig.model || GROQ_MODEL,
    messages,
    temperature: generationConfig.temperature ?? 0.7,
    max_tokens: generationConfig.maxOutputTokens ?? 4096,
  };
}

function resolveProviderConfig() {
  const candidates = [
    { key: process.env.GROK_API_KEY, source: 'GROK_API_KEY' },
    { key: process.env.GROQ_API_KEY, source: 'GROQ_API_KEY' },
    { key: process.env.GEMINI_API_KEY, source: 'GEMINI_API_KEY' },
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

async function callGroq(payload) {
  const config = resolveProviderConfig();
  if (!config) {
    throw new Error('GROK_API_KEY (or GROQ_API_KEY) is not configured in .env.local.');
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
  return callGroq(payload);
}

export async function generateChatWithFallback(lastMessage, chatHistory, systemInstruction, generationConfig = {}) {
  const payload = buildGroqChatPayload(lastMessage, chatHistory, systemInstruction, generationConfig);
  return callGroq(payload);
}
