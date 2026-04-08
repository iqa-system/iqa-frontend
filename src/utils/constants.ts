import type { DistortionProb, UserRole } from '@/types/api'

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
}

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
