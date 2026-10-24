const express = require('express');
const { respond } = require('../services/quizService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages, count, difficulty } = req.body || {};
    const result = await respond({ messages, count, difficulty });
    res.json(result);
  } catch (err) {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to get a reply.' });
  }
});

module.exports = router;
