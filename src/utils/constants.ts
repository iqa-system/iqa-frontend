// 场景和失真编码字典由后端协议约定, 页面展示统一走这里的常量和格式化函数.
export const SCENE_LABEL_MAP: Record<number, string> = {
  0: '动物',
  1: '城市',
  2: '人物',
  3: '室内',
  4: '风景',
  5: '夜景',
  6: '植物',
  7: '静物',
  8: '其他',
}

export const DIST_LABEL_MAP: Record<number, string> = {
  0: 'jpeg2000图像压缩',
  1: 'jpeg图像压缩',
  2: '噪声',
  3: '模糊',
  4: '颜色失真',
  5: '对比度失真',
  6: '过曝光',
  7: '欠曝光',
  8: '空间失真',
  9: '量化失真',
  10: '其他失真',
}

// 兼容旧命名, 避免后续引用这两个常量时出现破坏性修改.
export const sceneLabel = SCENE_LABEL_MAP
export const distLabel = DIST_LABEL_MAP
