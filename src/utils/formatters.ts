import { DIST_LABEL_MAP, SCENE_LABEL_MAP } from '@/utils/constants'

type DictionaryValue = string | number | null | undefined

function resolveDictionaryLabel(
  value: DictionaryValue,
  dictionary: Record<number, string>
) {
  if (typeof value === 'number' && dictionary[value]) {
    return dictionary[value]
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return '未知'
    }

    const parsedNumber = Number(trimmedValue)

    if (!Number.isNaN(parsedNumber) && dictionary[parsedNumber]) {
      return dictionary[parsedNumber]
    }

    return trimmedValue
  }

  return '未知'
}

export function formatSceneLabel(value: DictionaryValue) {
  return resolveDictionaryLabel(value, SCENE_LABEL_MAP)
}

export function formatDistortionLabel(value: DictionaryValue) {
  return resolveDictionaryLabel(value, DIST_LABEL_MAP)
}

export function formatQualityScore(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }

  return value.toFixed(4)
}

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

export function normalizeImageSrc(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  if (value.startsWith('data:image')) {
    return value
  }

  return `data:image/png;base64,${value}`
}

export function resolveBatchProgress(
  progress?: number,
  completed?: number,
  total?: number
) {
  if (typeof progress === 'number' && !Number.isNaN(progress)) {
    return progress
  }

  if (
    typeof completed === 'number' &&
    typeof total === 'number' &&
    total > 0
  ) {
    return Math.round((completed / total) * 100)
  }

  return 0
}

