require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoute = require('./routes/chat');
const quizRoute = require('./routes/quiz');
const ai = require('./services/ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, provider: ai.provider(), hasKey: ai.hasKey() });
});

app.use('/api/chat', chatRoute);
app.use('/api/quiz', quizRoute);

// Malformed JSON bodies etc.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`QuizGen server running on http://localhost:${PORT}`);
  console.log(`AI provider: ${ai.provider()}`);
  if (!ai.hasKey()) {
    console.warn('Warning: no API key found for the AI provider. Add it to server/.env and restart.');
  }
});
