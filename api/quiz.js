const { respond } = require('../server/services/quizService');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  try {
    const { text, count, difficulty } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Send some text or a topic in "text".' });
    }
    const result = await respond({
      messages: [{ role: 'user', content: `Make a quiz from this:\n${text}` }],
      count,
      difficulty,
    });
    if (result.type !== 'quiz') return res.status(422).json({ error: result.reply });
    res.status(200).json({ quiz: result.questions, title: result.title });
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to generate quiz.' });
  }
};
