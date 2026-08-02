const GROK_MODEL = 'grok-2-1212';

function buildGrokPayload(prompt, options = {}) {
  return {
    model: GROK_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxOutputTokens ?? 1000,
  };
}

function buildGrokChatPayload(lastMessage, chatHistory, systemInstruction, generationConfig = {}) {
  return {
    model: GROK_MODEL,
    messages: [
      { role: 'system', content: systemInstruction },
      ...chatHistory.map((message) => ({ role: message.role === 'user' ? 'user' : 'assistant', content: message.parts?.[0]?.text || '' })),
      { role: 'user', content: lastMessage },
    ],
    temperature: generationConfig.temperature ?? 0.7,
    max_tokens: generationConfig.maxOutputTokens ?? 500,
  };
}

async function callGrok(payload) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === 'your_grok_api_key') {
    throw new Error('GROK_API_KEY is not configured in .env.local.');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateWithFallback(prompt, options = {}) {
  const payload = buildGrokPayload(prompt, options);
  return callGrok(payload);
}

export async function generateChatWithFallback(lastMessage, chatHistory, systemInstruction, generationConfig = {}) {
  const payload = buildGrokChatPayload(lastMessage, chatHistory, systemInstruction, generationConfig);
  return callGrok(payload);
}
