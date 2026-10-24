const axios = require('axios');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Send `contents` to Gemini and return the model's text. */
async function generate(contents) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_key_here') {
    throw new AppError(500, 'GEMINI_API_KEY is missing. Add it to server/.env and restart the server.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  let res;
  try {
    res = await axios.post(
      `${API_BASE}/${model}:generateContent`,
      { contents, generationConfig: { temperature: 0.7 } },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, timeout: 60000 }
    );
  } catch (err) {
    throw toAppError(err, model);
  }

  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();
  if (!text) throw new AppError(502, 'The AI returned an empty reply. Please try again.');
  return text;
}

function toAppError(err, model) {
  if (err.code === 'ECONNABORTED') return new AppError(504, 'The AI took too long to answer. Please try again.');
  const status = err.response?.status;
  const detail = err.response?.data?.error?.message;
  if (status === 429) return new AppError(429, 'Rate limit reached. Wait a moment and try again.');
  if (status === 404) return new AppError(502, `Model "${model}" was not found. Check GEMINI_MODEL in server/.env.`);
  if (status === 400 || status === 401 || status === 403) {
    return new AppError(502, `Gemini rejected the request${detail ? `: ${detail.replace(/\.$/, '')}` : ''}. Check GEMINI_API_KEY and GEMINI_MODEL in server/.env.`);
  }
  if (!err.response) return new AppError(502, 'Could not reach the Gemini API. Check your internet connection.');
  return new AppError(502, 'The AI service returned an error. Please try again.');
}

/** Pull the first JSON object out of a model reply (handles ``` fences and stray prose). */
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

module.exports = { generate, extractJson, AppError };
