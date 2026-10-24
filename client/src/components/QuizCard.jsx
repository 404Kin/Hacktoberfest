const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuizCard({ quiz, answers, onAnswer, onRetake, onMore, busy }) {
  const total = quiz.questions.length
  const answered = answers.filter((a) => a !== null).length
  const done = answered === total
  const score = quiz.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctAnswerIndex ? 1 : 0), 0)

  return (
    <section className="quiz" aria-label={quiz.title}>
      <header className="quiz-head">
        <h2>{quiz.title}</h2>
        <span className="quiz-progress">
          {answered} of {total} answered
        </span>
      </header>

      {quiz.questions.map((q, qi) => {
        const picked = answers[qi]
        const locked = picked !== null
        return (
          <div className="question" key={qi}>
            <p className="question-text">
              <span className="question-num">{qi + 1}.</span> {q.question}
            </p>
            <div className="options" role="group" aria-label={`Question ${qi + 1} options`}>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correctAnswerIndex
                const isPicked = oi === picked
                let state = ''
                let tag = ''
                if (locked && isCorrect) {
                  state = 'correct'
                  tag = isPicked ? 'Your answer · correct' : 'Correct answer'
                } else if (locked && isPicked) {
                  state = 'wrong'
                  tag = 'Your answer'
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={`option ${state}`}
                    disabled={locked}
                    onClick={() => onAnswer(qi, oi)}
                  >
                    <span className="option-letter">{LETTERS[oi]}</span>
                    <span className="option-text">{opt}</span>
                    {tag && <span className="option-tag">{tag}</span>}
                  </button>
                )
              })}
            </div>
            {locked && q.explanation && <p className="explanation">{q.explanation}</p>}
          </div>
        )
      })}

      {done && (
        <footer className="result">
          <p className="result-score">
            You scored {score} out of {total}
            <span className="result-pct"> ({Math.round((score / total) * 100)}%)</span>
          </p>
          <div className="result-actions">
            <button type="button" className="btn" onClick={onRetake}>
              Retake quiz
            </button>
            <button type="button" className="btn btn-solid" onClick={onMore} disabled={busy}>
              New questions
            </button>
          </div>
        </footer>
      )}
    </section>
  )
}
