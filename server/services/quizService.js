const { extractJson, AppError } = require('./gemini');
const { generate } = require('./ai');

const MAX_CHARS = 8000;
const MAX_TURNS = 12;
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function clampCount(n) {
  const v = Number.parseInt(n, 10);
  if (Number.isNaN(v)) return 5;
  return Math.min(10, Math.max(3, v));
}

function buildInstructions(count, difficulty) {
  return `You are QuizGen, a friendly study assistant inside a chat app. You do two things: chat about studying, and create multiple-choice quizzes.

Decide what the user's latest message needs:
- QUIZ: they gave study material (a passage, notes, or a topic) and want questions, a quiz or a test; or they pasted a long passage with no other instruction; or they ask for another, new or harder quiz on earlier material.
- CHAT: anything else (greetings, questions, explanations, asking what you can do, or a quiz request with no material or topic).

Reply with ONLY one JSON object. No markdown fences, no text outside the JSON.

For CHAT: {"type":"chat","reply":"..."}
For QUIZ: {"type":"quiz","title":"short title","intro":"one short sentence","questions":[{"question":"...","options":["...","...","...","..."],"correctAnswerIndex":0,"explanation":"one sentence on why the answer is right"}]}

Quiz rules:
- Exactly ${count} questions. Difficulty: ${difficulty}.
- Exactly 4 options per question, one correct, plausible wrong options, never "all of the above".
- Questions must be answerable from the material given. For a bare topic, use well-established facts only.
- Write in the same language as the user's material or message.

Chat rules: be concise, use plain text with no markdown, and reply in the user's language.`;
}

/** Turn client messages into Gemini contents (alternating user/model, starting with user). */
function toContents(messages, instructions) {
  const turns = messages
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: String(m.content ?? '').slice(0, MAX_CHARS).trim(),
    }))
    .filter((t) => t.text);

  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    throw new AppError(400, 'Send a message first.');
  }

  const merged = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.text += `\n\n${t.text}`;
    else merged.push({ ...t });
  }

  const last = merged[merged.length - 1];
  last.text = `${instructions}\n\nUser's latest message:\n${last.text}`;
  return merged.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
}

function shuffleQuestion(q) {
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correctAnswerIndex: order.indexOf(q.correctAnswerIndex),
  };
}

function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((q) => {
      const options = Array.isArray(q?.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
      const idx = Number.parseInt(q?.correctAnswerIndex, 10);
      const question = typeof q?.question === 'string' ? q.question.trim() : '';
      if (!question || options.length < 2 || Number.isNaN(idx) || idx < 0 || idx >= options.length) return null;
      return shuffleQuestion({
        question,
        options,
        correctAnswerIndex: idx,
        explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
      });
    })
    .filter(Boolean);
}

/** Main entry: returns {type:'chat', reply} or {type:'quiz', title, intro, questions}. */
async function respond({ messages, count, difficulty }) {
  if (!Array.isArray(messages) || messages.length === 0) throw new AppError(400, 'Send a message first.');
  const n = clampCount(count);
  const level = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';

  const contents = toContents(messages, buildInstructions(n, level));
  const text = await generate(contents);
  const data = extractJson(text);

  // Model ignored the JSON format: show what it said as a normal chat reply.
  if (!data) return { type: 'chat', reply: text };

  if (data.type === 'quiz') {
    const questions = normalizeQuestions(data.questions).slice(0, n);
    if (!questions.length) {
      return { type: 'chat', reply: "I couldn't build a quiz from that. Try pasting a bit more text or naming a clear topic." };
    }
    return {
      type: 'quiz',
      title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Quiz',
      intro: typeof data.intro === 'string' ? data.intro.trim() : '',
      questions,
    };
  }

  const reply = typeof data.reply === 'string' && data.reply.trim() ? data.reply.trim() : text;
  return { type: 'chat', reply };
}

module.exports = { respond };
