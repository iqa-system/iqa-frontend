import type { AssessRecord } from '@/types/api'
import { getDistortionDisplayItems, getSceneLabel } from '@/utils/constants'
import { formatDateTime, formatQualityScore } from '@/utils/format'

export type HistoryExportFormat = 'csv' | 'xlsx'

const UTF8_BOM = '\uFEFF'
const CSV_MIME_TYPE = 'text/csv;charset=utf-8;'
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const HISTORY_EXPORT_HEADERS = ['编号', '文件名', '评估时间', '质量分数', '场景分类', '失真类型'] as const

type HistoryExportRow = Record<(typeof HISTORY_EXPORT_HEADERS)[number], string>

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

function toHistoryExportRows(records: AssessRecord[]): HistoryExportRow[] {
  return records.map((record, index) => ({
    '编号': String(index + 1),
    '文件名': record.filename ?? '',
    '评估时间': formatDateTime(record.assessTime),
    '质量分数': formatQualityScore(record.qualityScore),
    '场景分类': getSceneLabel(record.scene),
    '失真类型': formatDistortionSummary(record),
  }))
}

function getExportMatrix(rows: HistoryExportRow[]) {
  return [
    [...HISTORY_EXPORT_HEADERS],
    ...rows.map(row => HISTORY_EXPORT_HEADERS.map(header => row[header])),
  ]
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""')
  const shouldQuote = escaped.includes(',') || escaped.includes('"') || escaped.includes('\r') || escaped.includes('\n')

  return shouldQuote ? `"${escaped}"` : escaped
}

function buildCsvContent(rows: HistoryExportRow[]) {
  return [
    HISTORY_EXPORT_HEADERS.join(','),
    ...rows.map(row => HISTORY_EXPORT_HEADERS.map(header => escapeCsvCell(row[header])).join(',')),
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

export async function exportHistoryRecords(records: AssessRecord[], format: HistoryExportFormat) {
  const rows = toHistoryExportRows(records)
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
    { wch: 28 },
    { wch: 22 },
    { wch: 12 },
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
