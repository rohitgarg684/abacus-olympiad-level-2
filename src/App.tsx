import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Delete,
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

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [studentName, setStudentName] = useState('')
  const [category, setCategory] = useState<Category>('A')
  const [paper, setPaper] = useState<LevelTwoQuestion[]>([])
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

  const updateDraft = (value: string) => {
    if (!/^\d{0,2}$/.test(value)) return
    setAnswers((previous) => {
      const next = [...previous]
      next[current] = value
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
      if (/^\d$/.test(event.key)) updateDraft(`${draft}${event.key}`)
      if (event.key === 'Backspace') updateDraft(draft.slice(0, -1))
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
    setAnswers(Array(EXAM_LENGTH).fill(''))
    setCurrent(0)
    setTimeLeft(EXAM_SECONDS)
    setStartedAt(Date.now())
    setElapsedSeconds(0)
    setScreen('exam')
  }

  const restart = () => {
    setPaper([])
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
          <span>Level 2 · All 34 formula families</span>
          <span>{BANK_SIZE.toLocaleString()} validated questions</span>
        </footer>
      </main>
    )
  }

  if (screen === 'results') {
    const percentage = Math.round((score / EXAM_LENGTH) * 100)
    return (
      <main className="results-shell">
        <section className="result-card">
          <div className="result-trophy"><Trophy size={44} /></div>
          <span className="eyebrow">Level 2 challenge complete</span>
          <h1>{percentage >= 80 ? 'Outstanding focus!' : percentage >= 60 ? 'Strong attempt!' : 'Keep practising!'}</h1>
          <p>{studentName} · Category {category}</p>

          <div className="score-ring" style={{ '--score': `${percentage * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{score}</strong><span>out of {EXAM_LENGTH}</span></div>
          </div>

          <div className="result-stats">
            <div><b>{percentage}%</b><span>Accuracy</span></div>
            <div><b>{answeredCount}</b><span>Answered</span></div>
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
              <div className={draft ? 'answer-value has-answer' : 'answer-value'}>
                {draft || '?'}
              </div>
            </div>
          )}
          <p className="exam-hint">Add or subtract each row from top to bottom.</p>
        </div>

        <aside className="keypad-zone">
          <span className="keypad-label">Enter your answer</span>
          <div className="answer-preview">{draft || <span>Tap a number</span>}</div>
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button key={number} onClick={() => updateDraft(`${draft}${number}`)}>{number}</button>
            ))}
            <button className="clear-key" onClick={() => updateDraft('')}>Clear</button>
            <button onClick={() => updateDraft(`${draft}0`)}>0</button>
            <button aria-label="Delete last digit" onClick={() => updateDraft(draft.slice(0, -1))}>
              <Delete size={24} />
            </button>
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
