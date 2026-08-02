import assert from 'node:assert/strict';

async function runGrokRequestTest(envName, keyValue) {
  const { generateWithFallback } = await import('../src/lib/grok.js');
  const originalFetch = global.fetch;

  try {
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;
    process.env[envName] = keyValue;

    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.x.ai/v1/chat/completions');
      assert.equal(options.headers.Authorization, `Bearer ${keyValue}`);
      return {
        ok: true,
        async json() {
          return {
            choices: [{ message: { content: 'hello from grok' } }],
          };
        },
      };
    };

    const result = await generateWithFallback('hello there');
    assert.equal(result, 'hello from grok');
  } finally {
    global.fetch = originalFetch;
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;
  }
}

await runGrokRequestTest('GROK_API_KEY', 'test-grok-key');
await runGrokRequestTest('GEMINI_API_KEY', 'legacy-gemini-key');
console.log('Grok wrapper tests passed');
