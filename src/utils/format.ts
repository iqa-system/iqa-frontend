import type { ScoreRange } from '@/types/api'

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatQualityScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return '--'
  }

  return score.toFixed(2)
}

export function formatExpertScore(
  score: number | null | undefined,
  emptyFallback = '--',
) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return emptyFallback
  }

  return score.toFixed(2).replace(/\.?0+$/, '')
}

export const QUALITY_LEVEL_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '差',
  2: '较差',
  3: '一般',
  4: '良好',
  5: '完美',
}

export interface QualityScoreDisplay {
  hasNormalizedScore: boolean
  levelLabel: string
  levelValue: 1 | 2 | 3 | 4 | 5 | null
  normalizedText: string
  normalizedValue: number | null
  rangeText: string
  rawText: string
}

function formatScoreRangeBoundary(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, '')
}

export function isValidScoreRange(scoreRange: ScoreRange | null | undefined) {
  if (!scoreRange) {
    return false
  }

  const minScore = Number(scoreRange.min_score)
  const maxScore = Number(scoreRange.max_score)

  return Number.isFinite(minScore) && Number.isFinite(maxScore) && maxScore > minScore
}

export function formatScoreRange(
  scoreRange: ScoreRange | null | undefined,
  emptyFallback = '范围未知',
) {
  if (!isValidScoreRange(scoreRange)) {
    return emptyFallback
  }

  const validatedScoreRange = scoreRange as ScoreRange

  return `${formatScoreRangeBoundary(validatedScoreRange.min_score)} - ${formatScoreRangeBoundary(validatedScoreRange.max_score)}`
}

export function normalizeQualityScore(
  score: number | null | undefined,
  scoreRange: ScoreRange | null | undefined,
  targetMax = 5,
) {
  if (score === null || score === undefined || Number.isNaN(score) || !isValidScoreRange(scoreRange)) {
    return null
  }

  const validatedScoreRange = scoreRange as ScoreRange
  const ratio = (score - validatedScoreRange.min_score)
    / (validatedScoreRange.max_score - validatedScoreRange.min_score)
  const normalizedScore = ratio * targetMax

  if (Number.isNaN(normalizedScore)) {
    return null
  }

  return Math.min(targetMax, Math.max(0, normalizedScore))
}

export function getQualityScoreDisplay(
  score: number | null | undefined,
  scoreRange?: ScoreRange | null,
): QualityScoreDisplay {
  const rawText = formatQualityScore(score)
  const rangeText = formatScoreRange(scoreRange)
  const normalizedValue = normalizeQualityScore(score, scoreRange)

  if (normalizedValue === null) {
    return {
      hasNormalizedScore: false,
      levelLabel: '范围未知',
      levelValue: null,
      normalizedText: '--',
      normalizedValue: null,
      rangeText,
      rawText,
    }
  }

  const roundedScore = Math.round(normalizedValue)
  const levelValue = Math.min(5, Math.max(1, roundedScore)) as 1 | 2 | 3 | 4 | 5

  return {
    hasNormalizedScore: true,
    levelLabel: QUALITY_LEVEL_LABELS[levelValue],
    levelValue,
    normalizedText: formatQualityScore(normalizedValue),
    normalizedValue,
    rangeText,
    rawText,
  }
}

export function normalizeBase64Image(base64: string | null | undefined) {
  if (!base64) {
    return ''
  }

  return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
}
