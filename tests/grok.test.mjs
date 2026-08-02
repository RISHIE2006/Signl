import assert from 'node:assert/strict';

async function testGrokWrapperUsesGrokApi() {
  const { generateWithFallback } = await import('../src/lib/grok.js');
  const originalFetch = global.fetch;

  try {
    process.env.GROK_API_KEY = 'test-grok-key';
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.x.ai/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer test-grok-key');
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
  }
}

await testGrokWrapperUsesGrokApi();
console.log('Grok wrapper test passed');
