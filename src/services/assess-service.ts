import apiRequest, { baseURL } from '@/utils/api-request'
import { useAuthStore } from '@/stores/auth-store'
import type {
  BatchAssessEvent,
  BatchAssessEventName,
  BatchAssessPayload,
  PageAssessRecord,
  PredictResult,
} from '@/types/api'
import { resolveServiceError, unwrapApiResponse } from '@/services/service-helpers'
import { clearAuthSession } from '@/utils/session'

interface GetAssessHistoryParams {
  page: number
  pageSize: number
}

interface BatchAssessOptions {
  onEvent: (event: BatchAssessEvent) => void
  signal?: AbortSignal
}

function parseSseEventBlock(block: string) {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return null
  }

  const eventNameLine = lines.find((line) => line.startsWith('event:'))
  const dataLines = lines.filter((line) => line.startsWith('data:'))

  if (!eventNameLine || !dataLines.length) {
    return null
  }

  const eventName = eventNameLine.replace('event:', '').trim() as BatchAssessEventName
  const rawData = dataLines
    .map((line) => line.replace('data:', '').trim())
    .join('\n')

  if (!rawData) {
    return null
  }

  return {
    event: eventName,
    data: JSON.parse(rawData) as BatchAssessPayload,
  }
}

export async function assessSingleImage(file: File) {
  try {
    const formData = new FormData()

    formData.append('file', file)

    const response = await apiRequest.post('/assess', formData)

    return unwrapApiResponse<PredictResult>(response)
  } catch (error) {
    resolveServiceError(error, '单张图片评估失败, 请稍后重试')
  }
}

export async function getAssessHistory(params: GetAssessHistoryParams) {
  try {
    const response = await apiRequest.get('/assess/history', {
      params,
    })

    return unwrapApiResponse<PageAssessRecord>(response)
  } catch (error) {
    resolveServiceError(error, '获取评估历史失败, 请稍后重试')
  }
}

export async function assessBatchImages(
  files: File[],
  options: BatchAssessOptions
) {
  const accessToken = useAuthStore.getState().accessToken

  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch(`${baseURL}/assess/batch`, {
    method: 'POST',
    headers: accessToken
      ? {
          Authorization: accessToken,
        }
      : undefined,
    body: formData,
    signal: options.signal,
  })

  if (response.status === 401) {
    clearAuthSession('登录状态已失效, 请重新登录')
    throw new Error('登录状态已失效, 请重新登录')
  }

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(errorText || '批量评估请求失败, 请稍后重试')
  }

  if (!response.body) {
    throw new Error('服务端未返回批量评估数据流')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const blocks = buffer.split('\n\n')

    buffer = blocks.pop() ?? ''

    blocks.forEach((block) => {
      const parsedEvent = parseSseEventBlock(block)

      if (parsedEvent) {
        options.onEvent(parsedEvent)
      }
    })
  }

  const tailEvent = parseSseEventBlock(buffer)

  if (tailEvent) {
    options.onEvent(tailEvent)
  }
}
