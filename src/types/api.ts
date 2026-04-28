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
export type UserRole = 'USER' | 'ADMIN' | 'EXPERT'

/**
 * 公开注册页允许自助选择的角色类型.
 * 管理员不允许通过注册页直接创建.
 */
export type SelfRegisterRole = 'USER' | 'EXPERT'

/**
 * 登录页入口角色类型.
 * 当前登录页提供普通用户, 评估专家和管理员三个入口.
 */
export type LoginEntryRole = 'USER' | 'EXPERT' | 'ADMIN'

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
 * 模型原始评分范围.
 * 前端会基于这个范围把不同模型的原始分数统一映射到 0-5 量纲.
 */
export interface ScoreRange {
  min_score: number
  max_score: number
}

/**
 * 单个可用评估模型的目录信息.
 * 该结构来自 /assess/models, 用于前端渲染模型下拉和说明文案.
 */
export interface ModelInfo {
  model_id: string
  display_name: string
  description: string
  capabilities: string[]
  score_range: ScoreRange
  is_default: boolean
}

/**
 * 可用评估模型列表响应中的 data 结构.
 * default_model_id 表示后端在未显式传 modelId 时会使用的默认模型.
 */
export interface ModelsResponse {
  default_model_id: string
  models: ModelInfo[]
}

/**
 * 单张或批量评估结果结构.
 * 不同模型支持的能力不同, 因此 scene 和 distortions 允许为空.
 */
export interface PredictResult {
  file_name?: string | null
  model_id: string
  quality_score: number
  score_range: ScoreRange
  extra_outputs: Record<string, unknown>
  scene: number | null
  distortions: DistortionProb[] | null
}

/**
 * 普通用户历史记录列表中的单条评估记录.
 */
export interface AssessRecord {
  id: number
  userId: number
  filename: string
  /**
   * 文件元数据主键.
   * 该字段仅作为后端返回的关联元数据保留, 前端图片展示不再依赖它.
   */
  fileEntryId?: number | null
  /**
   * 图片资源路径.
   * 后端会返回可直接用于图片展示的路径, 前端会基于它生成 <img> 的最终 src.
   */
  imageURL?: string | null
  /**
   * 实际执行评估的模型ID.
   * 旧历史记录可能没有该字段, 因此前端需要兼容空值.
   */
  modelId?: string | null
  /**
   * 专家主观评分.
   * 仅当当前记录由 EXPERT 用户填写过主观评分时才会有值.
   */
  expertScore?: number | null
  /**
   * 专家主观评分最后一次填写或修改时间.
   */
  expertScoreTime?: string | null
  assessTime: string
  qualityScore: number
  scene: string | number | null
  distortions: DistortionProb[] | null
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
  /**
   * 文件元数据主键.
   * 该字段仅作为后端返回的关联元数据保留, 前端图片展示不再依赖它.
   */
  fileEntryId?: number | null
  /**
   * 图片资源路径.
   * 后端会返回可直接用于图片展示的路径, 前端会基于它生成 <img> 的最终 src.
   */
  imageURL?: string | null
  /**
   * 实际执行评估的模型ID.
   * 管理员历史主要用于查看和审计, 因此前端同样需要保留该字段.
   */
  modelId?: string | null
  /**
   * 专家主观评分.
   * 管理员可通过全站历史只读查看该值.
   */
  expertScore?: number | null
  /**
   * 专家主观评分最后一次填写或修改时间.
   */
  expertScoreTime?: string | null
  assessTime: string
  qualityScore: number
  scene: string | number | null
  distortions: DistortionProb[] | null
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
  role: SelfRegisterRole
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
 * 专家用户补录或修改历史记录主观评分时的请求载荷.
 */
export interface UpdateAssessmentExpertScorePayload {
  expertScore: number
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
  expertScore?: number | null
  predictResult: PredictResult
}

/**
 * SSE 批量评估完成事件中的单条结果项.
 * 和 result 事件保持同一字段语义, 便于前端统一复用结果卡片组件.
 */
export interface BatchAssessmentResultItem {
  expertScore?: number | null
  predictResult: PredictResult
}

/**
 * SSE 批量评估完成事件的载荷.
 */
export interface BatchAssessmentCompletedPayload extends BatchAssessmentProgressPayload {
  results: PredictResult[]
  resultItems?: BatchAssessmentResultItem[]
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
