import assert from 'node:assert/strict';

async function runProviderRequestTest(envName, keyValue, expectedUrl) {
  const { generateWithFallback } = await import(`../src/lib/grok.js?${envName}`);
  const originalFetch = global.fetch;

  try {
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.XAI_API_KEY;
    process.env[envName] = keyValue;

    global.fetch = async (url, options) => {
      assert.equal(url, expectedUrl);
      assert.equal(options.headers.Authorization, `Bearer ${keyValue}`);
      return {
        ok: true,
        async json() {
          return {
            choices: [{ message: { content: 'hello response' } }],
          };
        },
      };
    };

    const result = await generateWithFallback('hello there');
    assert.equal(result, 'hello response');
  } finally {
    global.fetch = originalFetch;
    delete process.env.GROK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.XAI_API_KEY;
  }
}

await runProviderRequestTest('GEMINI_API_KEY', 'GEMINI_TEST_KEY_1234567890', 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');

console.log('AI wrapper tests passed');
