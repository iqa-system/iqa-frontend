import type { AlertColor } from '@mui/material'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface AuthTokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export type UserRole = 'USER' | 'ADMIN'

export interface UserInfo {
  id: number
  username: string
  email: string
  role: UserRole
  registerTime: string
}

export interface DistortionProb {
  index: number
  prob: number
}

export interface PredictResult {
  file_name: string
  quality_score: number
  scene: number
  distortions: DistortionProb[]
}

export interface AssessRecord {
  id: number
  userId: number
  filename: string
  fileEntryId?: number | null
  imageURL?: string | null
  assessTime: string
  qualityScore: number
  scene: string | number
  distortions: DistortionProb[]
}

export interface PageAssessRecord {
  records: AssessRecord[]
  total: number
  size: number
  current: number
  pages: number
}

export interface HistoryQuery {
  page: number
  pageSize: number
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  email: string
}

export interface PasswordResetCodePayload {
  email: string
}

export interface PasswordResetSubmitPayload {
  email: string
  code: string
  newPassword: string
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  oldPassword?: string
  newPassword?: string
}

export interface BatchAssessmentProgressPayload {
  message: string
  progress?: number
  total?: number
  completed?: number
}

export interface BatchAssessmentResultPayload extends BatchAssessmentProgressPayload {
  currentFileName?: string
  predictResult: PredictResult
}

export interface BatchAssessmentCompletedPayload extends BatchAssessmentProgressPayload {
  results: PredictResult[]
}

export interface BatchAssessmentErrorPayload {
  message: string
}

export type BatchAssessmentEvent =
  | { type: 'start'; payload: BatchAssessmentProgressPayload }
  | { type: 'progress'; payload: BatchAssessmentProgressPayload }
  | { type: 'result'; payload: BatchAssessmentResultPayload }
  | { type: 'completed'; payload: BatchAssessmentCompletedPayload }
  | { type: 'error'; payload: BatchAssessmentErrorPayload }

export interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
  duration: number
}
