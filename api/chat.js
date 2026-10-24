const { respond } = require('../server/services/quizService');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  try {
    const { messages, count, difficulty } = req.body || {};
    const result = await respond({ messages, count, difficulty });
    res.status(200).json(result);
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to get a reply.' });
  }
};
