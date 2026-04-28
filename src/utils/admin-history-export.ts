import type { AdminAssessRecord, ModelInfo } from '@/types/api'
import {
  getAssessmentModelDisplayName,
  getDistortionDisplayItems,
  getSceneLabel,
} from '@/utils/constants'
import { formatDateTime, formatExpertScore, getQualityScoreDisplay } from '@/utils/format'

export type AdminHistoryExportFormat = 'csv' | 'xlsx'

const UTF8_BOM = '\uFEFF'
const CSV_MIME_TYPE = 'text/csv;charset=utf-8;'
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const ADMIN_HISTORY_EXPORT_HEADERS = [
  '编号',
  '用户ID',
  '用户名',
  '文件名',
  '评估时间',
  '评估模型',
  '原始质量分数',
  '评分范围',
  '归一化分数',
  '专家主观评分',
  '场景分类',
  '失真类型',
] as const

type AdminHistoryExportRow = Record<(typeof ADMIN_HISTORY_EXPORT_HEADERS)[number], string>

function formatExportTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

function getExportFilename(format: AdminHistoryExportFormat) {
  return `iqa-admin-history-export-${formatExportTimestamp()}.${format}`
}

/**
 * 将失真列表压平成单列字符串.
 * 管理员导出沿用普通历史页的展示语义, 便于后续统一核对.
 */
function formatDistortionSummary(record: AdminAssessRecord) {
  return getDistortionDisplayItems(record.distortions)
    .map(item => (item.probabilityText === '--' ? item.label : `${item.label}(${item.probabilityText})`))
    .join('；')
}

/**
 * 将管理员历史记录转换为导出行.
 * 编号始终按照本次实际导出的顺序从 1 开始.
 */
function toAdminHistoryExportRows(
  records: AdminAssessRecord[],
  modelInfoMap: Record<string, ModelInfo>,
): AdminHistoryExportRow[] {
  return records.map((record, index) => {
    const qualityDisplay = getQualityScoreDisplay(
      record.qualityScore,
      record.modelId ? modelInfoMap[record.modelId]?.score_range : null,
    )

    return {
      '编号': String(index + 1),
      '用户ID': String(record.userId ?? ''),
      '用户名': record.username ?? '',
      '文件名': record.filename ?? '',
      '评估时间': formatDateTime(record.assessTime),
      '评估模型': getAssessmentModelDisplayName(record.modelId, modelInfoMap),
      '原始质量分数': qualityDisplay.rawText,
      '评分范围': qualityDisplay.rangeText === '范围未知' ? '' : qualityDisplay.rangeText,
      '归一化分数': qualityDisplay.hasNormalizedScore ? qualityDisplay.normalizedText : '',
      '专家主观评分': formatExpertScore(record.expertScore, ''),
      '场景分类': record.scene === null || record.scene === undefined ? '该模型未提供场景分类' : getSceneLabel(record.scene),
      '失真类型': formatDistortionSummary(record),
    }
  })
}

function getExportMatrix(rows: AdminHistoryExportRow[]) {
  return [
    [...ADMIN_HISTORY_EXPORT_HEADERS],
    ...rows.map(row => ADMIN_HISTORY_EXPORT_HEADERS.map(header => row[header])),
  ]
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""')
  const shouldQuote = escaped.includes(',') || escaped.includes('"') || escaped.includes('\r') || escaped.includes('\n')

  return shouldQuote ? `"${escaped}"` : escaped
}

function buildCsvContent(rows: AdminHistoryExportRow[]) {
  return [
    ADMIN_HISTORY_EXPORT_HEADERS.join(','),
    ...rows.map(row => ADMIN_HISTORY_EXPORT_HEADERS.map(header => escapeCsvCell(row[header])).join(',')),
  ].join('\r\n')
}

function downloadBlob(content: BlobPart, options: { filename: string; type: string }) {
  const blob = new Blob([content], { type: options.type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = options.filename
  anchor.style.display = 'none'

  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * 导出管理员当前勾选的全站历史记录.
 * CSV 走前端字符串拼装, XLSX 走浏览器端 workbook 生成.
 */
export async function exportAdminHistoryRecords(
  records: AdminAssessRecord[],
  format: AdminHistoryExportFormat,
  modelInfoMap: Record<string, ModelInfo>,
) {
  const rows = toAdminHistoryExportRows(records, modelInfoMap)
  const filename = getExportFilename(format)

  if (format === 'csv') {
    downloadBlob(`${UTF8_BOM}${buildCsvContent(rows)}`, {
      filename,
      type: CSV_MIME_TYPE,
    })

    return filename
  }

  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.aoa_to_sheet(getExportMatrix(rows))
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 10 },
    { wch: 20 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 48 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '全站历史')

  const content = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  downloadBlob(content, {
    filename,
    type: XLSX_MIME_TYPE,
  })

  return filename
}
