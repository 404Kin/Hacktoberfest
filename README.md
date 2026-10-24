# QuizGen AI

A black-themed chatbot that turns your notes or a topic into multiple-choice quizzes.
Paste text (or just name a topic), get a quiz in the chat, answer it, see your score,
and ask for new questions.

## Setup

You need Node.js 18 or newer and an API key from either Ollama (https://ollama.com/settings/keys) or Gemini (https://aistudio.google.com/apikey).

**1. Server**

```bash
cd server
npm install
```

Open `server/.env` and set your key (use `AI_PROVIDER=gemini` with `GEMINI_API_KEY` for Gemini):

```
AI_PROVIDER=ollama
OLLAMA_API_KEY=your_key_here
OLLAMA_MODEL=gpt-oss:120b
PORT=5000
```

```bash
npm run dev
```

**2. Client** (second terminal)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The client forwards `/api` calls to the server on port 5000.

## How it works

- `POST /api/chat` takes the chat history plus quiz size and difficulty. The AI decides whether
  to answer normally or build a quiz, and the server validates and shuffles the answers.
- `POST /api/quiz` is a plain endpoint: send `{ "text": "...", "count": 5 }`, get questions back.
- `GET /api/health` shows whether the server can see your API key.
- The chat and your quiz answers are saved in the browser, so a refresh keeps them.
  "New chat" clears them.

## Troubleshooting

- **"API_KEY is missing"**: set the key for your provider in `server/.env`, then restart the server.
- **"Model ... was not found"**: change `OLLAMA_MODEL` (or `GEMINI_MODEL`) in `server/.env` to a model your key can use.
- **"Cannot reach the server"**: start the server first, and check it is running on port 5000.
- If you change the server port, update the proxy target in `client/vite.config.js`.

## Run locally with your own Ollama (Gemma on your laptop)

Install Ollama, run `ollama pull gemma3:4b` (or any Gemma from `ollama list`), then in `server/.env`:

```
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
PORT=5000
```

## Deploy to Vercel

Vercel cannot reach `localhost`, so a deployed app must use Ollama Cloud (or Gemini).

1. Push the whole `QuizGen_Ai` folder to a GitHub repo (`.env` is git-ignored, keep it that way).
2. On vercel.com choose **Add New > Project**, import the repo, keep the root directory as-is and set Framework Preset to **Other**.
3. Under **Environment Variables** add:
   ```
   AI_PROVIDER=ollama
   OLLAMA_API_KEY=your_ollama_key
   OLLAMA_MODEL=gemma4:31b
   ```
   Do not set `OLLAMA_HOST`.
4. Deploy. Open `https://your-app.vercel.app/api/health`, it should show `"hasKey":true`.

On Vercel the `api/` folder replaces the Express server (same code, `server/services`). After changing environment variables, redeploy.
