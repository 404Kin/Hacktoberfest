import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { sendChat } from './api'
import ChatMessage from './components/ChatMessage'

const STORAGE_KEY = 'quizgen.chat.v1'
const MAX_INPUT = 8000
const COUNTS = [3, 5, 8, 10]
const LEVELS = ['easy', 'medium', 'hard']

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  kind: 'text',
  content:
    'Hi, I make quizzes from anything you are studying. Paste your notes or a paragraph, or just name a topic, and I will turn it into multiple-choice questions.',
}

const SUGGESTIONS = [
  'Quiz me on photosynthesis',
  'Make a quiz about the French Revolution',
  'What can you do?',
]

let counter = 0
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.messages) || data.messages.length === 0) return null
    return data
  } catch {
    return null
  }
}

/** What the server sees: plain text for every message, including a summary of past quizzes. */
function toApiMessages(messages) {
  return messages
    .filter((m) => m.id !== 'welcome' && m.kind !== 'error')
    .map((m) => {
      if (m.kind === 'quiz') {
        const list = m.quiz.questions.map((q, i) => `${i + 1}) ${q.question}`).join(' ')
        return { role: 'assistant', content: `[Quiz "${m.quiz.title}"] ${list}` }
      }
      return { role: m.role, content: m.content }
    })
}

export default function App() {
  const [saved] = useState(loadSaved)
  const [messages, setMessages] = useState(saved?.messages ?? [WELCOME])
  const [count, setCount] = useState(saved?.count ?? 5)
  const [difficulty, setDifficulty] = useState(saved?.difficulty ?? 'medium')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, count, difficulty }))
    } catch {
      /* storage full or blocked: the chat still works, it just won't persist */
    }
  }, [messages, count, difficulty])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' })
  }, [messages, loading])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const requestReply = useCallback(
    async (history) => {
      setLoading(true)
      try {
        const data = await sendChat({ messages: toApiMessages(history), count, difficulty })
        const reply =
          data.type === 'quiz'
            ? {
                id: newId(),
                role: 'assistant',
                kind: 'quiz',
                quiz: { title: data.title, intro: data.intro, questions: data.questions },
                answers: data.questions.map(() => null),
              }
            : { id: newId(), role: 'assistant', kind: 'text', content: data.reply }
        setMessages((prev) => [...prev, reply])
      } catch (err) {
        setMessages((prev) => [...prev, { id: newId(), role: 'assistant', kind: 'error', content: err.message }])
      } finally {
        setLoading(false)
      }
    },
    [count, difficulty],
  )

  const send = useCallback(
    (text) => {
      const content = text.trim()
      if (!content || loading) return
      const next = [...messages, { id: newId(), role: 'user', kind: 'text', content }]
      setMessages(next)
      setInput('')
      requestReply(next)
    },
    [messages, loading, requestReply],
  )

  const retry = () => {
    if (loading) return
    const clean = messages.filter((m) => m.kind !== 'error')
    setMessages(clean)
    requestReply(clean)
  }

  const answer = (id, qi, oi) =>
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id || m.answers[qi] !== null) return m
        const answers = [...m.answers]
        answers[qi] = oi
        return { ...m, answers }
      }),
    )

  const retake = (id) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, answers: m.answers.map(() => null) } : m)))

  const newChat = () => {
    if (loading) return
    setMessages([WELCOME])
    setInput('')
    inputRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(input)
    }
  }

  const onlyWelcome = messages.length === 1 && messages[0].id === 'welcome'

  return (
    <div className="app">
      <header className="topbar">
        <h1>QuizGen AI</h1>
        <button type="button" className="btn btn-quiet" onClick={newChat} disabled={loading || onlyWelcome}>
          New chat
        </button>
      </header>

      <main className="thread" aria-live="polite">
        <div className="thread-inner">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              msg={m}
              busy={loading}
              onAnswer={answer}
              onRetake={retake}
              onMore={() => send('Make a new quiz on the same material with different questions.')}
              onRetry={retry}
            />
          ))}

          {onlyWelcome && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="row" role="status" aria-label="QuizGen is thinking">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="composer-wrap">
        <div className="composer-inner">
          <div className="options-bar">
            <label className="field">
              <span>Questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {COUNTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="seg" role="radiogroup" aria-label="Difficulty">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === l}
                  className={difficulty === l ? 'seg-on' : ''}
                  onClick={() => setDifficulty(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_INPUT}
              placeholder="Paste notes or type a topic…"
              aria-label="Message"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button type="submit" className="send" disabled={loading || !input.trim()} aria-label="Send message">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p className="hint">Enter to send, Shift+Enter for a new line.</p>
        </div>
      </footer>
    </div>
  )
}
