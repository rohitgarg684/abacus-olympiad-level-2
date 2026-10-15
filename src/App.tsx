import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Expand,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  BANK_SIZE,
  EXAM_LENGTH,
  EXAM_SECONDS,
  selectOlympiadPaper,
  type LevelTwoQuestion,
} from './questionBank'

type Screen = 'welcome' | 'exam' | 'results'
type Category = 'A' | 'B' | 'C'

const categories: Array<{ value: Category; age: string }> = [
  { value: 'A', age: '5–7 years' },
  { value: 'B', age: '8–10 years' },
  { value: 'C', age: '11–13 years' },
]

function createAnswerChoices(question: LevelTwoQuestion) {
  const choices = new Set<number>([question.answer])
  const offsets = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]
  let offsetIndex = Number(question.id.slice(-2)) % offsets.length

  while (choices.size < 4) {
    const candidate = question.answer + offsets[offsetIndex % offsets.length]
    if (candidate >= 0 && candidate <= 45) choices.add(candidate)
    offsetIndex += 1
  }

  return [...choices]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [studentName, setStudentName] = useState('')
  const [category, setCategory] = useState<Category>('A')
  const [paper, setPaper] = useState<LevelTwoQuestion[]>([])
  const [answerChoices, setAnswerChoices] = useState<number[][]>([])
  const [answers, setAnswers] = useState<Array<string>>([])
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showFinishPrompt, setShowFinishPrompt] = useState(false)

  const draft = answers[current] ?? ''
  const question = paper[current]

  const score = useMemo(
    () =>
      paper.reduce(
        (total, item, index) =>
          Number(answers[index]) === item.answer && answers[index] !== ''
            ? total + 1
            : total,
        0,
      ),
    [answers, paper],
  )

  const answeredCount = answers.filter((answer) => answer !== '').length

  const finishExam = () => {
    setElapsedSeconds(
      Math.min(EXAM_SECONDS, Math.round((Date.now() - startedAt) / 1000)),
    )
    setShowFinishPrompt(false)
    setScreen('results')
  }

  useEffect(() => {
    if (screen !== 'exam') return

    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        EXAM_SECONDS - Math.floor((Date.now() - startedAt) / 1000),
      )
      setTimeLeft(remaining)
      if (remaining === 0) {
        window.clearInterval(timer)
        setElapsedSeconds(EXAM_SECONDS)
        setScreen('results')
      }
    }, 250)

    return () => window.clearInterval(timer)
  }, [screen, startedAt])

  const selectAnswer = (value: number) => {
    setAnswers((previous) => {
      const next = [...previous]
      next[current] = String(value)
      return next
    })
  }

  const moveTo = (index: number) => {
    setCurrent(Math.max(0, Math.min(EXAM_LENGTH - 1, index)))
  }

  const submitAndContinue = () => {
    if (draft === '') return
    if (current === EXAM_LENGTH - 1) {
      setShowFinishPrompt(true)
    } else {
      moveTo(current + 1)
    }
  }

  useEffect(() => {
    if (screen !== 'exam' || showFinishPrompt) return

    const handleKey = (event: KeyboardEvent) => {
      const choiceIndex = Number(event.key) - 1
      if (choiceIndex >= 0 && choiceIndex < 4) {
        selectAnswer(answerChoices[current][choiceIndex])
      }
      if (event.key === 'Enter') submitAndContinue()
      if (event.key === 'ArrowLeft') moveTo(current - 1)
      if (event.key === 'ArrowRight') moveTo(current + 1)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const startExam = () => {
    const nextPaper = selectOlympiadPaper()
    setPaper(nextPaper)
    setAnswerChoices(nextPaper.map(createAnswerChoices))
    setAnswers(Array(EXAM_LENGTH).fill(''))
    setCurrent(0)
    setTimeLeft(EXAM_SECONDS)
    setStartedAt(Date.now())
    setElapsedSeconds(0)
    setScreen('exam')
  }

  const restart = () => {
    setPaper([])
    setAnswerChoices([])
    setAnswers([])
    setScreen('welcome')
  }

  const openFullscreen = () => {
    void document.documentElement.requestFullscreen?.()
  }

  if (screen === 'welcome') {
    return (
      <main className="welcome-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <header className="brand-bar">
          <div className="brand">
            <div className="abacus-mark" aria-hidden="true">
              <i /><i /><i />
            </div>
            <div>
              <strong>Abacus Olympiad</strong>
              <span>Practice Arena</span>
            </div>
          </div>
          <button className="icon-button" onClick={openFullscreen} aria-label="Open full screen">
            <Expand size={20} />
          </button>
        </header>

        <section className="welcome-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={16} /> International format practice</div>
            <h1>Level <em>02</em><br />Challenge</h1>
            <p>
              Build speed, focus, and confidence with a fresh Olympiad-style
              paper every time.
            </p>
            <div className="exam-facts">
              <div><strong>100</strong><span>Questions</span></div>
              <div><strong>15</strong><span>Minutes</span></div>
              <div><strong>5</strong><span>Rows each</span></div>
            </div>
          </div>

          <div className="registration-card">
            <div className="card-medal"><Medal size={28} /></div>
            <span className="card-kicker">Candidate entry</span>
            <h2>Ready to compete?</h2>
            <p>Enter your details to generate a unique question paper.</p>

            <label htmlFor="student-name">Student name</label>
            <input
              id="student-name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Enter full name"
              autoComplete="name"
              maxLength={40}
            />

            <fieldset>
              <legend>Age category</legend>
              <div className="category-options">
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={category === item.value ? 'category active' : 'category'}
                    onClick={() => setCategory(item.value)}
                  >
                    <b>{item.value}</b>
                    <span>{item.age}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              className="primary-button"
              onClick={startExam}
              disabled={!studentName.trim()}
            >
              Begin challenge <ArrowRight size={19} />
            </button>
            <small><ShieldCheck size={14} /> Answers stay hidden until the exam ends</small>
          </div>
        </section>

        <footer className="welcome-footer">
          <span>Level 2 · Multiple-choice practice format</span>
          <span>{BANK_SIZE.toLocaleString()} validated questions</span>
        </footer>
      </main>
    )
  }

  if (screen === 'results') {
    const percentage = Math.round((score / EXAM_LENGTH) * 100)
    const questionsToReview = paper
      .map((item, index) => ({
        ...item,
        questionNumber: index + 1,
        studentAnswer: answers[index],
      }))
      .filter(
        (item) =>
          item.studentAnswer === '' ||
          Number(item.studentAnswer) !== item.answer,
      )

    return (
      <main className="results-shell">
        <div className="results-container">
          <section className="result-card">
            <div className="result-trophy"><Trophy size={44} /></div>
            <span className="eyebrow">Level 2 challenge complete</span>
            <h1>{percentage >= 80 ? 'Outstanding focus!' : percentage >= 60 ? 'Strong attempt!' : 'Keep practising!'}</h1>
            <p>{studentName} · Category {category}</p>

            <div className="score-ring" style={{ '--score': `${percentage * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{score}</strong><span>correct out of {EXAM_LENGTH}</span></div>
            </div>

            <div className="result-stats">
              <div><b>{score}</b><span>Correct</span></div>
              <div><b>{questionsToReview.length}</b><span>Need review</span></div>
              <div><b>{percentage}%</b><span>Accuracy</span></div>
              <div><b>{formatTime(elapsedSeconds)}</b><span>Time used</span></div>
            </div>

            <div className="result-message">
              <Check size={20} />
              <span>A new practice creates a completely different 100-question paper.</span>
            </div>

            <button className="primary-button" onClick={startExam}>
              <RotateCcw size={18} /> Try another paper
            </button>
            <button className="text-button" onClick={restart}>Change candidate details</button>
          </section>

          <section className="review-card">
            <div className="review-heading">
              <div>
                <span>Answer review</span>
                <h2>{questionsToReview.length ? 'Questions to practise' : 'Perfect paper!'}</h2>
              </div>
              <b>{questionsToReview.length}</b>
            </div>

            {questionsToReview.length === 0 ? (
              <div className="perfect-message">
                <Trophy size={28} />
                Every answer was correct. Excellent work!
              </div>
            ) : (
              <div className="review-list">
                {questionsToReview.map((item) => (
                  <article className="review-item" key={item.id}>
                    <span className="review-number">Q{item.questionNumber}</span>
                    <div className="review-sum">
                      {item.operands.map((operand, index) => (
                        <span key={`${item.id}-review-${index}`}>
                          {index > 0 && operand > 0 ? '+' : ''}
                          {operand < 0 ? `−${Math.abs(operand)}` : operand}
                        </span>
                      ))}
                    </div>
                    <div className="review-answers">
                      <span>Your answer <b className="wrong-answer">{item.studentAnswer || 'Not answered'}</b></span>
                      <span>Correct answer <b className="correct-answer">{item.answer}</b></span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="exam-shell">
      <header className="exam-header">
        <div className="brand compact">
          <div className="abacus-mark" aria-hidden="true"><i /><i /><i /></div>
          <div><strong>Abacus Olympiad</strong><span>Level 02</span></div>
        </div>

        <div className={timeLeft <= 60 ? 'timer danger' : 'timer'}>
          <Clock3 size={20} />
          <div><span>Time remaining</span><strong>{formatTime(timeLeft)}</strong></div>
        </div>

        <button className="finish-button" onClick={() => setShowFinishPrompt(true)}>
          Finish exam
        </button>
      </header>

      <div className="progress-track">
        <div style={{ width: `${((current + 1) / EXAM_LENGTH) * 100}%` }} />
      </div>

      <section className="exam-stage">
        <div className="question-zone">
          <div className="question-meta">
            <div>
              <span>Question</span>
              <strong>{String(current + 1).padStart(2, '0')} <small>/ {EXAM_LENGTH}</small></strong>
            </div>
            <span className="status-pill">{answeredCount} answered</span>
          </div>

          {question && (
            <div className="sum-card" aria-label={`Question ${current + 1}`}>
              <div className="sum-values">
                {question.operands.map((operand, index) => (
                  <span key={`${question.id}-${index}`}>
                    {operand < 0 ? `−${Math.abs(operand)}` : operand}
                  </span>
                ))}
              </div>
              <div className="sum-rule" />
              <div className="answer-value">?</div>
            </div>
          )}
          <p className="exam-hint">Add or subtract each row from top to bottom.</p>
        </div>

        <aside className="choices-zone">
          <span className="choices-label">Choose the correct answer</span>
          <div className="answer-choices">
            {answerChoices[current]?.map((choice, index) => (
              <button
                key={choice}
                className={draft === String(choice) ? 'selected' : ''}
                onClick={() => selectAnswer(choice)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{choice}</strong>
                <i>{draft === String(choice) && <Check size={18} />}</i>
              </button>
            ))}
          </div>
          <button className="primary-button confirm-button" disabled={!draft} onClick={submitAndContinue}>
            {current === EXAM_LENGTH - 1 ? 'Review & finish' : 'Confirm & continue'}
            <ArrowRight size={19} />
          </button>
        </aside>
      </section>

      <footer className="exam-footer">
        <button disabled={current === 0} onClick={() => moveTo(current - 1)}>
          <ArrowLeft size={18} /> Previous
        </button>
        <div className="question-dots" aria-label="Question navigation">
          {Array.from({ length: 7 }, (_, offset) => {
            const start = Math.max(0, Math.min(EXAM_LENGTH - 7, current - 3))
            const index = start + offset
            return (
              <button
                key={index}
                aria-label={`Go to question ${index + 1}`}
                className={`${index === current ? 'current ' : ''}${answers[index] ? 'answered' : ''}`}
                onClick={() => moveTo(index)}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
        <button disabled={current === EXAM_LENGTH - 1} onClick={() => moveTo(current + 1)}>
          Next <ArrowRight size={18} />
        </button>
      </footer>

      {showFinishPrompt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="finish-modal">
            <div className="modal-icon"><Trophy size={28} /></div>
            <h2 id="finish-title">Submit your paper?</h2>
            <p>You answered <strong>{answeredCount} of {EXAM_LENGTH}</strong> questions. You cannot change answers after submitting.</p>
            <button className="primary-button" onClick={finishExam}>Submit final answers</button>
            <button className="text-button" onClick={() => setShowFinishPrompt(false)}>Continue exam</button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
