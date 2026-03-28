// 这里集中定义后端接口返回结构和页面共享的数据类型.
// 统一类型后, 页面和服务层可以复用同一套约束, 避免到处写隐式 any.

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}

export interface AuthTokenResponse {
  accessToken: string
  tokenType?: string
  expiresIn: number
}

export interface PredictResult {
  file_name: string
  quality_score: number
  scene: number | string
  distortion: number | string
}

export interface BatchPredictResponse {
  results: PredictResult[]
}

export interface AssessRecord {
  id: number
  userId: number
  filename: string
  base64: string
  assessTime: string
  qualityScore: number
  scene: number | string
  distortion: number | string
}

export interface PageAssessRecord {
  records: AssessRecord[]
  total: number
  size: number
  current: number
  pages: number
}

export interface UserInfo {
  id: number
  username: string
  registerTime: string
}

export type BatchAssessEventName =
  | 'start'
  | 'progress'
  | 'result'
  | 'completed'
  | 'error'

export interface BatchAssessBasePayload {
  message: string
  progress?: number
  total?: number
  completed?: number
}

export interface BatchAssessResultPayload extends BatchAssessBasePayload {
  currentFileName?: string
  predictResult?: PredictResult
}

export interface BatchAssessCompletedPayload extends BatchAssessBasePayload {
  results?: PredictResult[]
}

export type BatchAssessPayload =
  | BatchAssessBasePayload
  | BatchAssessResultPayload
  | BatchAssessCompletedPayload

export interface BatchAssessEvent {
  event: BatchAssessEventName
  data: BatchAssessPayload
}

