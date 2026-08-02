/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    console.error('GROK_API_KEY not found in .env.local');
    return;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    console.log(data.choices?.[0]?.message?.content || 'No response');
  } catch (err) {
    console.error('Error with Grok:', err.message);
  }
}

listModels();
