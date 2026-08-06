import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env.local');
    return;
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Request failed with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log(data.choices?.[0]?.message?.content || 'No response');
  } catch (err) {
    console.error('Error with Gemini API:', err.message);
  }
}

testGemini();
