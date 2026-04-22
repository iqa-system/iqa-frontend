import apiRequest, {
  extractErrorMessage,
  handleUnauthorizedState,
  resolveApiUrl,
  unwrapResponse,
} from '@/utils/api-request'
import { useAuthStore } from '@/stores/authStore'
import type {
  AssessRecord,
  BatchAssessmentCompletedPayload,
  BatchAssessmentErrorPayload,
  BatchAssessmentEvent,
  BatchAssessmentProgressPayload,
  BatchAssessmentResultPayload,
  HistoryQuery,
  PageAssessRecord,
  PredictResult,
  UpdateAssessmentExpertScorePayload,
} from '@/types/api'

type SseEventName = 'start' | 'progress' | 'result' | 'completed' | 'error'

/**
 * 解析 SSE 数据块, 提取事件名称和数据负载
 * @param chunk SSE 数据块文本
 * @returns 包含事件名称和数据负载的对象
 */
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

/**
 * 读取批量评估的 SSE 流, 实时处理事件并调用回调函数
 * @param stream SSE 响应体的可读流
 * @param onEvent 事件回调函数, 接收解析后的事件对象
 * @throws 当接收到 error 事件时抛出异常
 */
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

/**
 * 单张评估支持 EXPERT 用户附带可选主观评分.
 * 非专家用户调用时不应传 expertScore.
 */
export async function assessSingleImage(
  file: File,
  options?: {
    expertScore?: number
  },
) {
  const formData = new FormData()
  formData.append('file', file)

  if (options?.expertScore !== undefined) {
    formData.append('expertScore', String(options.expertScore))
  }

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
    expertScores?: Array<number | undefined>
    signal?: AbortSignal
    onEvent: (event: BatchAssessmentEvent) => void
  },
) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))

  if (options.expertScores?.length) {
    options.expertScores.forEach(score => {
      formData.append('expertScores', score === undefined ? '' : String(score))
    })
  }

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

export async function deleteAssessmentHistory(ids: number[]) {
  const response = await apiRequest.delete('/assess/history', {
    data: { ids },
  })

  return unwrapResponse<number>(response)
}

/**
 * EXPERT 用户可为自己的历史记录补录或修改主观评分.
 * 后端要求使用 JSON 请求体提交 expertScore 字段.
 */
export async function updateAssessmentExpertScore(id: number, expertScore: number) {
  const payload: UpdateAssessmentExpertScorePayload = { expertScore }
  const response = await apiRequest.patch(`/assess/history/${id}/expert-score`, payload)

  return unwrapResponse<string>(response)
}

/**
 * 新版历史图片资源已经允许直接通过 <img> 访问.
 * 这里统一把后端返回的 imageURL 规范化成浏览器可直接加载的完整地址.
 * 对相对路径必须显式拼接 API 基础地址, 否则开发环境下会错误命中前端本地服务.
 */
export function resolveHistoryImageUrl(record: Pick<AssessRecord, 'imageURL'>) {
  const imageURL = record.imageURL?.trim()

  if (!imageURL) {
    return ''
  }

  if (/^https?:\/\//i.test(imageURL)) {
    return imageURL
  }

  return resolveApiUrl(imageURL)
}
