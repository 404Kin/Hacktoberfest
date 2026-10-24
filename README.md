# QuizGen AI-Grasp

A simple black-themed chatbot that turns your notes or any topic into a multiple-choice quiz.

Paste some text or type a topic, get a quiz right in the chat, answer the questions, and see your score.

🚀 **Live Demo:** [Try QuizGen AI](https://hacktoberfest-blue.vercel.app/)

## Features

- Chat-style interface with a clean black theme
- Makes quizzes from pasted notes or just a topic name
- Choose 3, 5, 8 or 10 questions, and easy, medium or hard
- Instant feedback with a short explanation for every answer
- Score at the end, with retake and new questions buttons
- Replies in the language you write in
- Your chat is saved in the browser

## What you need

- [Node.js](https://nodejs.org) 18 or newer
- One AI option (pick one):
  - **Ollama Cloud key**: free at [ollama.com/settings/keys](https://ollama.com/settings/keys)
  - **Ollama installed on your laptop**: free, no key, runs a model like `gemma4:e2b`
  - **Gemini key**: free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Run it on your computer

You need two terminals.

**Terminal 1, the server**

```bash
cd server
npm install
npm run dev
```

**Terminal 2, the website**

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** and say hi.

## Settings (`server/.env`)

Open `server/.env` and use ONE of these setups. No spaces around `=` and no quotes.

**A. Ollama Cloud**

```
AI_PROVIDER=ollama
OLLAMA_API_KEY=your_key_here
OLLAMA_MODEL=gemma4:31b
PORT=5000
```

**B. Ollama on your laptop**

Make sure the Ollama app is running and your model shows up in `ollama list`.

```
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b
PORT=5000
```

**C. Gemini**

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

After changing `.env`, stop the server (`Ctrl+C`) and start it again.

Check that it worked by opening **http://localhost:5000/api/health**. You should see `"hasKey":true`
(with a laptop Ollama it can show `false`, that is fine, just try a quiz).

## Put it online with Vercel

Vercel cannot see your laptop, so the online version must use an **Ollama Cloud key** (or Gemini).

1. Push this whole folder to a new GitHub repository. The `.env` file stays private on purpose.
2. Go to [vercel.com](https://vercel.com), choose **Add New**, then **Project**, and import the repository.
3. Set **Framework Preset** to **Other**. Leave everything else as it is.
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `AI_PROVIDER` | `ollama` |
   | `OLLAMA_API_KEY` | your key |
   | `OLLAMA_MODEL` | `gemma4:31b` |

   Do not add `OLLAMA_HOST`.
5. Click **Deploy**.
6. Open `https://your-app.vercel.app/api/health`. If it shows `"hasKey":true`, you are done.

Changed a variable later? Go to **Deployments** and click **Redeploy**.

## Something went wrong?

| Message | What to do |
|---|---|
| `API_KEY is missing` | Add your key to `server/.env` (or Vercel variables) and restart or redeploy |
| `Model ... was not found` | The model name is wrong. Check `ollama list` or the Ollama cloud model list |
| `Could not reach Ollama` | Open the Ollama app on your laptop, or remove `OLLAMA_HOST` to use the cloud |
| `Ollama rejected the API key` | The key is wrong or was deleted. Make a new one |
| `Cannot reach the server` | Start the server first (`cd server`, `npm run dev`) |
| `Rate limit reached` | You asked too many times. Wait a minute |
| Weird text instead of a quiz | Small models slip sometimes. Send the message again |

The red lines in the browser console about `contentscript.js` or `ObjectMultiplex` come from browser
extensions, not from this app. Ignore them.

## Keep your key safe

- Never paste your API key in chats, screenshots, or GitHub.
- If a key leaks, delete it on the Ollama or Google site and make a new one.
- A deployed app is public. Anyone with the link can use up your free limit, so share it carefully.

## How it is built

```
QuizGen_Ai/
  client/   React + Vite website (the chat screen)
  server/   Express server for local use, plus the AI code in server/services
  api/      The same API as Vercel functions, used when deployed
  vercel.json
```

| Endpoint | What it does |
|---|---|
| `POST /api/chat` | Chat history in, a reply or a quiz out |
| `POST /api/quiz` | Send `{ "text": "...", "count": 5 }`, get questions back |
| `GET /api/health` | Shows the AI provider and whether a key is found |
