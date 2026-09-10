const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/googleai');

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', // Using Gemini 1.5 Flash as the default model
});

module.exports = { ai };
