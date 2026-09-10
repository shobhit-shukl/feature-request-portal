const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

// Initialize Genkit
const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  model: 'googleai/gemini-3.6-flash',
});

module.exports = { ai };
