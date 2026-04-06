const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env.local');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There isn't a direct listModels in the standard genAI interface easily accessible like this in some versions,
    // but we can try a simple request to check access or just try a different model name.
    console.log('Testing with gemini-1.5-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('Hi');
    console.log('Success with gemini-1.5-flash-latest');
  } catch (err) {
    console.error('Error with gemini-1.5-flash-latest:', err.message);
    
    try {
        console.log('Testing with gemini-pro...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hi');
        console.log('Success with gemini-pro');
    } catch (err2) {
        console.error('Error with gemini-pro:', err2.message);
    }
  }
}

listModels();
