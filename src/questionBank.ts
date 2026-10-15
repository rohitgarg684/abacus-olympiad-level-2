export type FormulaFamily = 'direct' | 'five-friend' | 'ten-friend' | 'combined'

export interface LevelTwoQuestion {
  id: string
  operands: readonly number[]
  answer: number
  formulaFamily: FormulaFamily
}

export const EXAM_LENGTH = 100
export const EXAM_SECONDS = 15 * 60
export const BANK_SIZE = 2400

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function classifyStep(before: number, change: number) {
  const after = before + change
  const beforeDigit = before % 10
  const afterDigit = after % 10
  const crossesTen =
    change > 0 ? beforeDigit + change >= 10 : beforeDigit + change < 0
  const crossesFive =
    !crossesTen &&
    (change > 0
      ? beforeDigit < 5 && afterDigit >= 5
      : beforeDigit >= 5 && afterDigit < 5)

  return { crossesFive, crossesTen }
}

function buildQuestionBank(): LevelTwoQuestion[] {
  const random = seededRandom(202602)
  const questions: LevelTwoQuestion[] = []
  const seen = new Set<string>()

  while (questions.length < BANK_SIZE) {
    const operands: number[] = [1 + Math.floor(random() * 9)]
    let total = operands[0]
    let usesFiveFriend = false
    let usesTenFriend = false

    for (let row = 1; row < 5; row += 1) {
      const magnitude = 1 + Math.floor(random() * 9)
      const maySubtract = total >= magnitude
      const subtract = maySubtract && random() < 0.43
      const change = subtract ? -magnitude : magnitude
      const nextTotal = total + change

      if (nextTotal > 45) {
        operands.length = 0
        break
      }

      const step = classifyStep(total, change)
      usesFiveFriend ||= step.crossesFive
      usesTenFriend ||= step.crossesTen
      operands.push(change)
      total = nextTotal
    }

    if (operands.length !== 5) continue

    const key = operands.join(',')
    if (seen.has(key)) continue
    seen.add(key)

    const formulaFamily: FormulaFamily =
      usesFiveFriend && usesTenFriend
        ? 'combined'
        : usesTenFriend
          ? 'ten-friend'
          : usesFiveFriend
            ? 'five-friend'
            : 'direct'

    questions.push({
      id: `L2-${String(questions.length + 1).padStart(4, '0')}`,
      operands,
      answer: total,
      formulaFamily,
    })
  }

  return questions
}

export const LEVEL_TWO_QUESTION_BANK = buildQuestionBank()

function shuffle<T>(items: readonly T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ]
  }

  return shuffled
}

export function selectOlympiadPaper(count = EXAM_LENGTH) {
  const targetMix: Record<FormulaFamily, number> = {
    direct: 10,
    'five-friend': 20,
    'ten-friend': 30,
    combined: 30,
  }
  const selected = (Object.keys(targetMix) as FormulaFamily[]).flatMap(
    (family) =>
      shuffle(
        LEVEL_TWO_QUESTION_BANK.filter(
          (question) => question.formulaFamily === family,
        ),
      ).slice(0, Math.round((targetMix[family] / EXAM_LENGTH) * count)),
  )
  const selectedIds = new Set(selected.map((question) => question.id))
  const remaining = shuffle(
    LEVEL_TWO_QUESTION_BANK.filter((question) => !selectedIds.has(question.id)),
  )

  return shuffle([...selected, ...remaining.slice(0, count - selected.length)])
}
