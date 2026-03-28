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

export function normalizeBase64Image(base64: string | null | undefined) {
  if (!base64) {
    return ''
  }

  return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
}
