import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function testRatelimit() {
  const { rateLimit } = await import('../src/lib/ratelimit.js');
  const ip = '1.2.3.4';
  console.log('--- Starting Rate Limit Test ---');
  
  for (let i = 1; i <= 11; i++) {
    const result = rateLimit(ip);
    console.log(`Hit ${i}: success=${result.success}, remaining=${result.remaining}`);
    
    if (i === 10 && !result.success) {
      console.log('Error: Hit 10 should be success (since default limit is 10)');
    }
    if (i === 11 && result.success) {
      console.log('Error: Hit 11 should be blocked');
    }
  }
  
  console.log('--- Test Completed ---');
}

async function testSharedStoreAcrossModuleInstances() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ratelimit-test-'));
  const dbPath = path.join(tempDir, 'ratelimit.sqlite');
  process.env.RATE_LIMIT_DB_PATH = dbPath;

  const firstModule = await import('../src/lib/ratelimit.js?first');
  const secondModule = await import('../src/lib/ratelimit.js?second');

  for (let i = 0; i < 10; i += 1) {
    const result = firstModule.rateLimit('shared-ip');
    if (!result.success) {
      throw new Error(`Expected first module calls to succeed before the shared limit is reached: ${JSON.stringify(result)}`);
    }
  }

  const blockedResult = secondModule.rateLimit('shared-ip');
  if (blockedResult.success) {
    throw new Error('Expected shared-store rate limiting to block the 11th request across module instances');
  }
}

await testSharedStoreAcrossModuleInstances();
await testRatelimit();
