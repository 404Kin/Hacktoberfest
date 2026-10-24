import QuizCard from './QuizCard'

export default function ChatMessage({ msg, busy, onAnswer, onRetake, onMore, onRetry }) {
  if (msg.role === 'user') {
    return (
      <div className="row row-user">
        <div className="bubble-user">{msg.content}</div>
      </div>
    )
  }

  if (msg.kind === 'error') {
    return (
      <div className="row">
        <div className="bot-body">
          <p className="error-text" role="alert">
            {msg.content}
          </p>
          <button type="button" className="btn" onClick={onRetry} disabled={busy}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (msg.kind === 'quiz') {
    return (
      <div className="row">
        <div className="bot-body bot-body-wide">
          {msg.quiz.intro && <p className="bot-text">{msg.quiz.intro}</p>}
          <QuizCard
            quiz={msg.quiz}
            answers={msg.answers}
            busy={busy}
            onAnswer={(qi, oi) => onAnswer(msg.id, qi, oi)}
            onRetake={() => onRetake(msg.id)}
            onMore={onMore}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="row">
      <div className="bot-body">
        <p className="bot-text">{msg.content}</p>
      </div>
    </div>
  )
}
