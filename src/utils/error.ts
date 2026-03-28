import axios from 'axios'

// 统一把接口异常, 网络异常和运行时异常转换为可直接展示给用户的中文提示.
export function getErrorMessage(
  error: unknown,
  fallbackMessage = '操作失败, 请稍后重试'
) {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message
    const directMessage = error.message

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage
    }

    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallbackMessage
}

