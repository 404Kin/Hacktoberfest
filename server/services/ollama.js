const axios = require('axios');
const { AppError } = require('./gemini');

/** Same input/output as gemini.generate: Gemini-style `contents` in, reply text out. */
async function generate(contents) {
  const key = process.env.OLLAMA_API_KEY;
  const host = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
  const model = process.env.OLLAMA_MODEL || 'gpt-oss:120b';

  // A key is required for ollama.com; a local Ollama server does not need one.
  if ((!key || key === 'your_key_here') && host.includes('ollama.com')) {
    throw new AppError(500, 'OLLAMA_API_KEY is missing. Add it to server/.env and restart the server.');
  }

  const messages = contents.map((c) => ({
    role: c.role === 'model' ? 'assistant' : 'user',
    content: c.parts.map((p) => p.text).join(''),
  }));

  let res;
  try {
    res = await axios.post(
      `${host}/api/chat`,
      { model, messages, stream: false, options: { temperature: 0.7 } },
      {
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        timeout: 120000,
      }
    );
  } catch (err) {
    throw toAppError(err, model, host);
  }

  const text = String(res.data?.message?.content ?? '').trim();
  if (!text) throw new AppError(502, 'The AI returned an empty reply. Please try again.');
  return text;
}

function toAppError(err, model, host) {
  if (err.code === 'ECONNABORTED') return new AppError(504, 'The AI took too long to answer. Please try again.');
  const status = err.response?.status;
  const detail = err.response?.data?.error;
  if (status === 401 || status === 403) {
    return new AppError(502, 'Ollama rejected the API key. Check OLLAMA_API_KEY in server/.env.');
  }
  if (status === 404) return new AppError(502, `Model "${model}" was not found. Check OLLAMA_MODEL in server/.env.`);
  if (status === 429) return new AppError(429, 'Rate limit reached. Wait a moment and try again.');
  if (!err.response) return new AppError(502, `Could not reach Ollama at ${host}. Check your internet connection or OLLAMA_HOST.`);
  return new AppError(502, `Ollama returned an error${typeof detail === 'string' ? `: ${detail}` : '.'}`);
}

module.exports = { generate };
