import type { AlertColor } from '@mui/material'

/**
 * 通用接口响应结构.
 * 后端会统一返回 code, message 和 data 三个字段.
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 登录或刷新令牌成功后返回的访问令牌信息.
 */
export interface AuthTokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

/**
 * 当前系统已知的用户角色联合类型.
 * 如果后端后续扩展角色, 需要在这里同步追加字面量类型.
 */
export type UserRole = 'USER' | 'ADMIN'

/**
 * 当前登录用户或管理员用户列表中的用户信息.
 */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: UserRole
  registerTime: string
}

/**
 * 管理员分页查询用户列表时使用的分页结果结构.
 */
export interface PageUserInfo {
  records: UserInfo[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 失真类型概率项.
 * index 表示失真类型编码, prob 表示该失真的概率值.
 */
export interface DistortionProb {
  index: number
  prob: number
}

/**
 * 单张或批量评估结果结构.
 */
export interface PredictResult {
  file_name: string
  quality_score: number
  scene: number
  distortions: DistortionProb[]
}

/**
 * 普通用户历史记录列表中的单条评估记录.
 */
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

/**
 * 普通用户历史记录的分页结果结构.
 */
export interface PageAssessRecord {
  records: AssessRecord[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 管理员查看全站历史时使用的单条评估记录结构.
 * 相比普通历史记录, 额外包含 username 字段.
 */
export interface AdminAssessRecord {
  id: number
  userId: number
  username: string
  filename: string
  fileEntryId?: number | null
  imageURL?: string | null
  assessTime: string
  qualityScore: number
  scene: string | number
  distortions: DistortionProb[]
}

/**
 * 管理员全站历史的分页结果结构.
 */
export interface PageAdminAssessRecord {
  records: AdminAssessRecord[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 普通用户历史记录查询参数.
 */
export interface HistoryQuery {
  page: number
  pageSize: number
}

/**
 * 管理员用户列表查询参数.
 * role 为精确筛选, username 和 email 为模糊筛选.
 */
export interface AdminUsersQuery {
  page: number
  pageSize: number
  username?: string
  email?: string
  role?: UserRole
}

/**
 * 管理员全站历史查询参数.
 * startTime 和 endTime 使用 ISO-8601 时间字符串.
 */
export interface AdminAssessHistoryQuery {
  page: number
  pageSize: number
  userId?: number
  filename?: string
  startTime?: string
  endTime?: string
}

/**
 * 登录表单提交载荷.
 */
export interface LoginPayload {
  username: string
  password: string
}

/**
 * 注册表单提交载荷.
 */
export interface RegisterPayload extends LoginPayload {
  email: string
}

/**
 * 发送找回密码验证码时的请求载荷.
 */
export interface PasswordResetCodePayload {
  email: string
}

/**
 * 提交验证码并重置密码时的请求载荷.
 */
export interface PasswordResetSubmitPayload {
  email: string
  code: string
  newPassword: string
}

/**
 * 普通用户更新个人资料时的请求载荷.
 * 所有字段均为可选, 前端只提交实际变化的内容.
 */
export interface UpdateUserPayload {
  username?: string
  email?: string
  oldPassword?: string
  newPassword?: string
}

/**
 * 管理员修改目标用户角色时的请求载荷.
 */
export interface AdminUpdateUserRolePayload {
  role: UserRole
}

/**
 * SSE 批量评估的基础进度载荷.
 */
export interface BatchAssessmentProgressPayload {
  message: string
  progress?: number
  total?: number
  completed?: number
}

/**
 * SSE 批量评估中单条结果事件的载荷.
 */
export interface BatchAssessmentResultPayload extends BatchAssessmentProgressPayload {
  currentFileName?: string
  predictResult: PredictResult
}

/**
 * SSE 批量评估完成事件的载荷.
 */
export interface BatchAssessmentCompletedPayload extends BatchAssessmentProgressPayload {
  results: PredictResult[]
}

/**
 * SSE 批量评估异常事件的载荷.
 */
export interface BatchAssessmentErrorPayload {
  message: string
}

/**
 * 前端统一消费的批量评估事件联合类型.
 */
export type BatchAssessmentEvent =
  | { type: 'start'; payload: BatchAssessmentProgressPayload }
  | { type: 'progress'; payload: BatchAssessmentProgressPayload }
  | { type: 'result'; payload: BatchAssessmentResultPayload }
  | { type: 'completed'; payload: BatchAssessmentCompletedPayload }
  | { type: 'error'; payload: BatchAssessmentErrorPayload }

/**
 * 全局 Snackbar 状态结构.
 */
export interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
  duration: number
}
