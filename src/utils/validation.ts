export const EMAIL_MAX_LENGTH = 255
export const EXPERT_SCORE_MAX = 5

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email)
}

export interface ExpertScoreParseResult {
  error?: string
  value?: number
}

/**
 * 统一校验专家主观评分输入.
 * 留空是否允许由 required 控制, 其余情况下统一限制为 0.00 到 5.00, 最多 2 位小数.
 */
export function parseExpertScoreInput(
  input: string,
  options: { required?: boolean } = {},
): ExpertScoreParseResult {
  const trimmedInput = input.trim()

  if (!trimmedInput) {
    if (options.required) {
      return { error: '请输入专家主观评分.' }
    }

    return { value: undefined }
  }

  if (!/^\d+(\.\d+)?$/.test(trimmedInput)) {
    return { error: '请输入合法的数字格式.' }
  }

  const decimalPart = trimmedInput.split('.')[1]

  if (decimalPart && decimalPart.length > 2) {
    return { error: '专家主观评分最多保留 2 位小数.' }
  }

  const parsedValue = Number(trimmedInput)

  if (Number.isNaN(parsedValue)) {
    return { error: '请输入合法的数字格式.' }
  }

  if (parsedValue < 0 || parsedValue > EXPERT_SCORE_MAX) {
    return { error: '专家主观评分必须在 0.00 到 5.00 之间.' }
  }

  return { value: parsedValue }
}
