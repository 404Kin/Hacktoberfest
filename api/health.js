const ai = require('../server/services/ai');

module.exports = (req, res) => {
  res.status(200).json({ ok: true, provider: ai.provider(), hasKey: ai.hasKey() });
};
