import apiRequest, {
  extractErrorMessage,
  handleUnauthorizedState,
  resolveApiUrl,
  unwrapResponse,
} from '@/utils/api-request'
import { useAuthStore } from '@/stores/authStore'
import type {
  BatchAssessmentCompletedPayload,
  BatchAssessmentErrorPayload,
  BatchAssessmentEvent,
  BatchAssessmentProgressPayload,
  BatchAssessmentResultPayload,
  HistoryQuery,
  PageAssessRecord,
  PredictResult,
} from '@/types/api'

type SseEventName = 'start' | 'progress' | 'result' | 'completed' | 'error'

function parseSseChunk(chunk: string): {
  eventName: SseEventName | 'unknown'
  payload: object
} {
  let eventName: SseEventName | 'unknown' = 'progress'
  const dataLines: string[] = []

  chunk.split(/\r?\n/).forEach(line => {
    if (line.startsWith('event:')) {
      const parsedEventName = line.slice(6).trim()

      if (
        parsedEventName === 'start'
        || parsedEventName === 'progress'
        || parsedEventName === 'result'
        || parsedEventName === 'completed'
        || parsedEventName === 'error'
      ) {
        eventName = parsedEventName
      } else {
        eventName = 'unknown'
      }
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  })

  const payloadText = dataLines.join('\n')
  const payload = payloadText ? (JSON.parse(payloadText) as object) : {}

  return {
    eventName,
    payload,
  }
}

async function readBatchSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: BatchAssessmentEvent) => void,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const segments = buffer.split(/\r?\n\r?\n/)
    buffer = segments.pop() ?? ''

    for (const segment of segments) {
      if (!segment.trim()) {
        continue
      }

      const { eventName, payload } = parseSseChunk(segment)

      switch (eventName) {
        case 'start':
        case 'progress':
          onEvent({
            type: eventName,
            payload: payload as BatchAssessmentProgressPayload,
          })
          break
        case 'result':
          onEvent({
            type: 'result',
            payload: payload as BatchAssessmentResultPayload,
          })
          break
        case 'completed':
          onEvent({
            type: 'completed',
            payload: payload as BatchAssessmentCompletedPayload,
          })
          break
        case 'error': {
          const errorPayload = payload as BatchAssessmentErrorPayload

          onEvent({
            type: 'error',
            payload: errorPayload,
          })

          throw new Error(errorPayload.message || '批量评估失败。')
        }
        default:
          break
      }
    }
  }

  const lastChunk = buffer.trim()

  if (lastChunk) {
    const { eventName, payload } = parseSseChunk(lastChunk)

    if (eventName === 'completed') {
      onEvent({
        type: 'completed',
        payload: payload as BatchAssessmentCompletedPayload,
      })
    }
  }
}

export async function assessSingleImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiRequest.post('/assess', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResponse<PredictResult>(response)
}

export async function assessBatchImages(
  files: File[],
  options: {
    signal?: AbortSignal
    onEvent: (event: BatchAssessmentEvent) => void
  },
) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))

  const authorization = useAuthStore.getState().token?.accessToken
  const headers: HeadersInit = authorization ? { Authorization: authorization } : {}

  const response = await fetch(resolveApiUrl('/assess/batch'), {
    method: 'POST',
    body: formData,
    headers,
    signal: options.signal,
  })

  if (response.status === 401) {
    handleUnauthorizedState()
    throw new Error('登录状态已失效, 请重新登录。')
  }

  if (!response.ok || !response.body) {
    throw new Error(`批量评估请求失败: ${response.status}`)
  }

  try {
    await readBatchSseStream(response.body, options.onEvent)
  } catch (error) {
    throw new Error(extractErrorMessage(error, '批量评估过程中发生异常。'))
  }
}

export async function getAssessmentHistory(query: HistoryQuery) {
  const response = await apiRequest.get('/assess/history', {
    params: query,
  })

  return unwrapResponse<PageAssessRecord>(response)
}
