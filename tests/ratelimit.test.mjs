import { rateLimit } from '../lib/ratelimit.js';

function testRatelimit() {
  const ip = '1.2.3.4';
  console.log('--- Starting Rate Limit Test ---');
  
  for (let i = 1; i <= 10; i++) {
    const result = rateLimit(ip);
    console.log(`Hit ${i}: success=${result.success}, remaining=${result.remaining}`);
    
    if (i === 6 && !result.success) {
      console.log('Error: Hit 6 should be success (since limit is 6)');
    }
    if (i === 7 && result.success) {
      console.log('Error: Hit 7 should be blocked');
    }
  }
  
  console.log('--- Test Completed ---');
}

testRatelimit();
