import type { DistortionProb, ModelInfo, UserRole } from '@/types/api'

export const sceneLabelMap: Record<string, string> = {
  '0': '动物',
  '1': '城市',
  '2': '人物',
  '3': '室内',
  '4': '风景',
  '5': '夜景',
  '6': '植物',
  '7': '静物',
  '8': '其他',
}

export const distLabelMap: Record<string, string> = {
  '0': 'JPEG2000 图像压缩',
  '1': 'JPEG 图像压缩',
  '2': '噪声',
  '3': '模糊',
  '4': '颜色失真',
  '5': '对比度失真',
  '6': '过曝光',
  '7': '欠曝光',
  '8': '空间失真',
  '9': '量化失真',
  '10': '其他失真',
}

export const userRoleLabelMap: Record<UserRole, string> = {
  USER: '普通用户',
  ADMIN: '管理员',
  EXPERT: '评估专家',
}

export const editableUserRoles: UserRole[] = ['USER', 'ADMIN', 'EXPERT']

export const DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE = '__DEFAULT_ASSESSMENT_MODEL__'
export const DEFAULT_ASSESSMENT_MODEL_OPTION_LABEL = '使用后端默认模型'

export const modelCapabilityLabelMap: Record<string, string> = {
  quality_score: '质量评分',
  scene: '场景分类',
  distortions: '失真类型识别',
  extra_outputs: '扩展输出',
}

export type UserRoleChipColor = 'default' | 'primary' | 'secondary' | 'warning'

export function getSceneLabel(scene: string | number | null | undefined) {
  if (scene === null || scene === undefined) {
    return '未知场景'
  }

  return sceneLabelMap[String(scene)] ?? `场景 ${scene}`
}

export function getDistortionLabel(distortion: string | number | null | undefined) {
  if (distortion === null || distortion === undefined) {
    return '未知失真'
  }

  return distLabelMap[String(distortion)] ?? `失真 ${distortion}`
}

export function getUserRoleLabel(role: UserRole | null | undefined) {
  if (!role) {
    return '未知角色'
  }

  return userRoleLabelMap[role] ?? role
}

export function getUserRoleChipColor(role: UserRole | null | undefined): UserRoleChipColor {
  if (role === 'ADMIN') {
    return 'secondary'
  }

  if (role === 'EXPERT') {
    return 'warning'
  }

  if (role === 'USER') {
    return 'primary'
  }

  return 'default'
}

export function isAdminRole(role: UserRole | null | undefined) {
  return role === 'ADMIN'
}

export function isExpertRole(role: UserRole | null | undefined) {
  return role === 'EXPERT'
}

/**
 * 将后端返回的 capability 标识转换成更适合界面展示的中文文案.
 * 如果后端将来追加新的 capability, 前端先保留原始值展示, 避免因为缺少映射而完全不可见.
 */
export function getModelCapabilityLabel(capability: string | null | undefined) {
  if (!capability) {
    return '未知能力'
  }

  return modelCapabilityLabelMap[capability] ?? capability
}

/**
 * 统一根据模型ID解析展示名称.
 * 历史记录可能只保存 modelId, 页面再根据最新目录做友好名称映射.
 * 如果目录里找不到该模型, 则回退显示原始 modelId.
 */
export function getAssessmentModelDisplayName(
  modelId: string | null | undefined,
  modelInfoMap?: Record<string, Pick<ModelInfo, 'display_name'>>,
  options: {
    emptyFallback?: string
  } = {},
) {
  const normalizedModelId = modelId?.trim()

  if (!normalizedModelId) {
    return options.emptyFallback ?? '未记录模型'
  }

  return modelInfoMap?.[normalizedModelId]?.display_name ?? normalizedModelId
}

/**
 * 统一生成“使用后端默认模型”选项的展示文案.
 * 如果模型目录里能找到默认模型, 就把友好名称一并带上, 方便用户理解默认值具体指向哪个模型.
 */
export function getDefaultAssessmentModelOptionLabel(
  defaultModelId: string | null | undefined,
  modelInfoMap?: Record<string, Pick<ModelInfo, 'display_name'>>,
) {
  const defaultModelName = getAssessmentModelDisplayName(defaultModelId, modelInfoMap, {
    emptyFallback: '',
  })

  return defaultModelName
    ? `${DEFAULT_ASSESSMENT_MODEL_OPTION_LABEL} (${defaultModelName})`
    : DEFAULT_ASSESSMENT_MODEL_OPTION_LABEL
}

export interface DistortionDisplayItem {
  isPrimary: boolean
  key: string
  label: string
  probability: number | null
  probabilityText: string
}

export function formatDistortionProbability(probability: number | null | undefined) {
  if (typeof probability !== 'number' || Number.isNaN(probability)) {
    return '--'
  }

  return `${(probability * 100).toFixed(2)}%`
}

export function getDistortionDisplayItems(
  distortions: DistortionProb[] | null | undefined,
): DistortionDisplayItem[] {
  if (!Array.isArray(distortions) || distortions.length === 0) {
    return [
      {
        isPrimary: false,
        key: 'unknown-distortion',
        label: '未知失真',
        probability: null,
        probabilityText: '--',
      },
    ]
  }

  const items = distortions
    .filter(distortion => typeof distortion?.index === 'number')
    .map((distortion, index) => ({
      key: `${distortion.index}-${index}`,
      label: getDistortionLabel(distortion.index),
      probability: distortion.prob,
      probabilityText: formatDistortionProbability(distortion.prob),
    }))
    .sort((left, right) => (right.probability ?? -1) - (left.probability ?? -1))
    .map((item, index) => ({
      ...item,
      isPrimary: index === 0,
    }))

  if (!items.length) {
    return [
      {
        isPrimary: false,
        key: 'unknown-distortion',
        label: '未知失真',
        probability: null,
        probabilityText: '--',
      },
    ]
  }

  return items
}
