import { useAuthStore } from '@/stores/authStore'
import type { AssessRecord, ModelInfo } from '@/types/api'
import {
  getAssessmentModelDisplayName,
  getDistortionDisplayItems,
  getSceneLabel,
  isExpertRole,
} from '@/utils/constants'
import { formatDateTime, formatExpertScore, getQualityScoreDisplay } from '@/utils/format'

export type HistoryExportFormat = 'csv' | 'xlsx'

const UTF8_BOM = '\uFEFF'
const CSV_MIME_TYPE = 'text/csv;charset=utf-8;'
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DEFAULT_HISTORY_EXPORT_HEADERS = [
  '编号',
  '文件名',
  '评估时间',
  '评估模型',
  '原始质量分数',
  '评分范围',
  '归一化分数',
  '场景分类',
  '失真类型',
] as const
const EXPERT_HISTORY_EXPORT_HEADERS = [
  '编号',
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

type HistoryExportRow = Record<string, string>

function formatExportTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

function getExportFilename(format: HistoryExportFormat) {
  return `iqa-history-export-${formatExportTimestamp()}.${format}`
}

function formatDistortionSummary(record: AssessRecord) {
  return getDistortionDisplayItems(record.distortions)
    .map(item => (item.probabilityText === '--' ? item.label : `${item.label}(${item.probabilityText})`))
    .join('；')
}

function getHistoryExportHeaders() {
  return isExpertRole(useAuthStore.getState().user?.role)
    ? [...EXPERT_HISTORY_EXPORT_HEADERS]
    : [...DEFAULT_HISTORY_EXPORT_HEADERS]
}

function toHistoryExportRows(
  records: AssessRecord[],
  headers: string[],
  modelInfoMap: Record<string, ModelInfo>,
): HistoryExportRow[] {
  const isExpertHistory = headers.includes('专家主观评分')

  return records.map((record, index) => {
    const qualityDisplay = getQualityScoreDisplay(
      record.qualityScore,
      record.modelId ? modelInfoMap[record.modelId]?.score_range : null,
    )
    const row: HistoryExportRow = {
      '编号': String(index + 1),
      '文件名': record.filename ?? '',
      '评估时间': formatDateTime(record.assessTime),
      '评估模型': getAssessmentModelDisplayName(record.modelId, modelInfoMap),
      '原始质量分数': qualityDisplay.rawText,
      '评分范围': qualityDisplay.rangeText === '范围未知' ? '' : qualityDisplay.rangeText,
      '归一化分数': qualityDisplay.hasNormalizedScore ? qualityDisplay.normalizedText : '',
      '场景分类': record.scene === null || record.scene === undefined ? '该模型未提供场景分类' : getSceneLabel(record.scene),
      '失真类型': formatDistortionSummary(record),
    }

    if (isExpertHistory) {
      row['专家主观评分'] = formatExpertScore(record.expertScore, '')
    }

    return row
  })
}

function getExportMatrix(headers: string[], rows: HistoryExportRow[]) {
  return [
    headers,
    ...rows.map(row => headers.map(header => row[header] ?? '')),
  ]
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""')
  const shouldQuote = escaped.includes(',') || escaped.includes('"') || escaped.includes('\r') || escaped.includes('\n')

  return shouldQuote ? `"${escaped}"` : escaped
}

function buildCsvContent(headers: string[], rows: HistoryExportRow[]) {
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsvCell(row[header] ?? '')).join(',')),
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

export async function exportHistoryRecords(
  records: AssessRecord[],
  format: HistoryExportFormat,
  modelInfoMap: Record<string, ModelInfo>,
) {
  const headers = getHistoryExportHeaders()
  const rows = toHistoryExportRows(records, headers, modelInfoMap)
  const filename = getExportFilename(format)

  if (format === 'csv') {
    downloadBlob(`${UTF8_BOM}${buildCsvContent(headers, rows)}`, {
      filename,
      type: CSV_MIME_TYPE,
    })

    return filename
  }

  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.aoa_to_sheet(getExportMatrix(headers, rows))
  worksheet['!cols'] = headers.includes('专家主观评分')
    ? [
        { wch: 8 },
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
    : [
        { wch: 8 },
        { wch: 28 },
        { wch: 22 },
        { wch: 18 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 48 },
      ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '历史记录')

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
