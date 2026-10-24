const gemini = require('./gemini');
const ollama = require('./ollama');

/** AI_PROVIDER=ollama | gemini. If unset, use Ollama when OLLAMA_API_KEY exists, else Gemini. */
function provider() {
  const p = (process.env.AI_PROVIDER || '').toLowerCase();
  if (p === 'ollama' || p === 'gemini') return p;
  return process.env.OLLAMA_API_KEY ? 'ollama' : 'gemini';
}

function generate(contents) {
  return provider() === 'ollama' ? ollama.generate(contents) : gemini.generate(contents);
}

function hasKey() {
  const k = provider() === 'ollama' ? process.env.OLLAMA_API_KEY : process.env.GEMINI_API_KEY;
  return Boolean(k) && k !== 'your_key_here';
}

module.exports = { generate, provider, hasKey };
