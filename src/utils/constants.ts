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
