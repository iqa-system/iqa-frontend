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
  levelLabel: string
  levelValue: 1 | 2 | 3 | 4 | 5 | null
  rawText: string
}

export function getQualityScoreDisplay(score: number | null | undefined): QualityScoreDisplay {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return {
      levelLabel: '未知等级',
      levelValue: null,
      rawText: '--',
    }
  }

  const roundedScore = Math.round(score)
  const levelValue = Math.min(5, Math.max(1, roundedScore)) as 1 | 2 | 3 | 4 | 5

  return {
    levelLabel: QUALITY_LEVEL_LABELS[levelValue],
    levelValue,
    rawText: formatQualityScore(score),
  }
}

export function normalizeBase64Image(base64: string | null | undefined) {
  if (!base64) {
    return ''
  }

  return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
}
