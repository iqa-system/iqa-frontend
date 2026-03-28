import type { AxiosResponse } from 'axios'

import type { ApiResponse } from '@/types/api'
import { getErrorMessage } from '@/utils/error'

// 所有业务服务最终都通过这里解包, 统一处理 code/message 语义.
export function unwrapApiResponse<T>(response: AxiosResponse<ApiResponse<T>>) {
  const responseBody = response.data

  if (!responseBody) {
    throw new Error('服务端返回数据为空')
  }

  if (responseBody.code !== 200 && responseBody.code !== 0) {
    throw new Error(responseBody.message || '请求失败')
  }

  return responseBody.data as T
}

export function resolveServiceError(
  error: unknown,
  fallbackMessage = '请求失败, 请稍后重试'
): never {
  throw new Error(getErrorMessage(error, fallbackMessage))
}
