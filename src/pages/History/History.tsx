import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'

import DistortionList from '@/components/DistortionList'
import LoadingScreen from '@/components/LoadingScreen'
import { getAssessmentHistory, getHistoryImageBlob } from '@/services/assessment'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { AssessRecord } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import { getSceneLabel } from '@/utils/constants'
import { formatDateTime, getQualityScoreDisplay } from '@/utils/format'
import { exportHistoryRecords, type HistoryExportFormat } from '@/utils/history-export'

function HistoryPage() {
  const showError = useSnackbarStore(state => state.showError)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [records, setRecords] = useState<AssessRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [recordImageUrls, setRecordImageUrls] = useState<Record<number, string>>({})
  const [loadingImageRecordIds, setLoadingImageRecordIds] = useState<number[]>([])
  const [failedImageRecordIds, setFailedImageRecordIds] = useState<number[]>([])
  const [previewImage, setPreviewImage] = useState('')
  const [exportingFormat, setExportingFormat] = useState<HistoryExportFormat | null>(null)

  useEffect(() => {
    let active = true
    setSelectedRecordIds([])
    setPreviewImage('')

    void getAssessmentHistory({ page, pageSize })
      .then(data => {
        if (!active) {
          return
        }

        setRecords(data.records)
        setTotal(data.total)
      })
      .catch(error => {
        if (active) {
          showError(extractErrorMessage(error, '历史记录加载失败。'))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [page, pageSize, showError])

  useEffect(() => {
    let active = true
    const objectUrls: string[] = []

    setRecordImageUrls({})
    setFailedImageRecordIds([])

    if (!records.length) {
      setLoadingImageRecordIds([])

      return () => {
        active = false
      }
    }

    setLoadingImageRecordIds(records.map(record => record.id))

    records.forEach(record => {
      void getHistoryImageBlob(record)
        .then(blob => {
          if (!active) {
            return
          }

          const objectUrl = URL.createObjectURL(blob)
          objectUrls.push(objectUrl)

          setRecordImageUrls(current => ({
            ...current,
            [record.id]: objectUrl,
          }))
        })
        .catch(() => {
          if (active) {
            setFailedImageRecordIds(currentIds => (
              currentIds.includes(record.id) ? currentIds : [...currentIds, record.id]
            ))
          }
        })
        .finally(() => {
          if (active) {
            setLoadingImageRecordIds(currentIds => currentIds.filter(id => id !== record.id))
          }
        })
    })

    return () => {
      active = false
      objectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl))
    }
  }, [records])

  const selectedRecordIdSet = new Set(selectedRecordIds)
  const loadingImageRecordIdSet = new Set(loadingImageRecordIds)
  const failedImageRecordIdSet = new Set(failedImageRecordIds)
  const selectedRecords = records.filter(record => selectedRecordIdSet.has(record.id))
  const selectedCount = selectedRecords.length
  const allRecordsSelected = records.length > 0 && selectedCount === records.length
  const hasPartialSelection = selectedCount > 0 && selectedCount < records.length

  const handleOpenPreview = (recordId: number) => {
    const imageUrl = recordImageUrls[recordId]

    if (!imageUrl) {
      return
    }

    setPreviewImage(imageUrl)
  }

  const handleSelectAllRecords = (checked: boolean) => {
    setSelectedRecordIds(checked ? records.map(record => record.id) : [])
  }

  const handleToggleRecord = (recordId: number) => {
    setSelectedRecordIds(currentIds =>
      currentIds.includes(recordId)
        ? currentIds.filter(currentId => currentId !== recordId)
        : [...currentIds, recordId],
    )
  }

  const handleExport = async (format: HistoryExportFormat) => {
    if (!selectedRecords.length) {
      return
    }

    setExportingFormat(format)

    try {
      await exportHistoryRecords(selectedRecords, format)
      showSuccess(`已导出 ${selectedRecords.length} 条历史记录（${format.toUpperCase()}）。`)
    } catch (error) {
      showError(extractErrorMessage(error, '历史记录导出失败。'))
    } finally {
      setExportingFormat(null)
    }
  }

  if (isLoading) {
    return (
      <LoadingScreen
        description="正在从后端拉取评估历史数据。"
        fullscreen={false}
        title="加载历史记录"
      />
    )
  }

  return (
    <>
      <Stack spacing={3}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="h4">历史记录</Typography>
              <Typography color="text.secondary" variant="body2">
                这里会展示当前账号的评估历史, 包括缩略图、时间、分数和识别标签。
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {records.length ? (
              <>
                <Box
                  sx={{
                    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                    px: 3,
                    py: 2.5,
                  }}
                >
                  <Stack
                    direction={{ md: 'row', xs: 'column' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="h6">批量导出</Typography>
                      <Typography color="text.secondary" variant="body2">
                        已选 {selectedCount} 条 / 当前页 {records.length} 条。仅导出当前页勾选记录。
                      </Typography>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Button
                        disabled={!selectedCount || exportingFormat !== null}
                        onClick={() => void handleExport('csv')}
                        variant="outlined"
                      >
                        {exportingFormat === 'csv' ? '导出中...' : '导出 CSV'}
                      </Button>
                      <Button
                        disabled={!selectedCount || exportingFormat !== null}
                        onClick={() => void handleExport('xlsx')}
                        variant="contained"
                      >
                        {exportingFormat === 'xlsx' ? '导出中...' : '导出 XLSX'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <TableContainer component={Paper} elevation={0}>
                  <Table sx={{ minWidth: 1040 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={allRecordsSelected}
                            indeterminate={hasPartialSelection}
                            slotProps={{ input: { 'aria-label': '全选当前页记录' } }}
                            onChange={event => handleSelectAllRecords(event.target.checked)}
                          />
                        </TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>缩略图</TableCell>
                        <TableCell>文件名</TableCell>
                        <TableCell>评估时间</TableCell>
                        <TableCell>质量分数</TableCell>
                        <TableCell>场景分类</TableCell>
                        <TableCell>失真类型</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map(record => {
                        const imageUrl = recordImageUrls[record.id]
                        const isSelected = selectedRecordIdSet.has(record.id)
                        const isImageLoading = loadingImageRecordIdSet.has(record.id)
                        const isImageFailed = failedImageRecordIdSet.has(record.id)
                        const qualityDisplay = getQualityScoreDisplay(record.qualityScore)

                        return (
                          <TableRow hover key={record.id} selected={isSelected}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                slotProps={{ input: { 'aria-label': `选择历史记录 ${record.id}` } }}
                                onChange={() => handleToggleRecord(record.id)}
                              />
                            </TableCell>
                            <TableCell>{record.id}</TableCell>
                            <TableCell>
                              {imageUrl ? (
                                <Box
                                  alt={record.filename}
                                  component="img"
                                  onClick={() => handleOpenPreview(record.id)}
                                  src={imageUrl}
                                  sx={{
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    height: 60,
                                    objectFit: 'cover',
                                    width: 60,
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    alignItems: 'center',
                                    bgcolor: 'rgba(15, 23, 42, 0.04)',
                                    border: '1px dashed rgba(15, 23, 42, 0.12)',
                                    borderRadius: 2,
                                    display: 'flex',
                                    height: 60,
                                    justifyContent: 'center',
                                    px: 1,
                                    textAlign: 'center',
                                    width: 60,
                                  }}
                                >
                                  <Typography color="text.secondary" sx={{ lineHeight: 1.2 }} variant="caption">
                                    {isImageLoading ? '加载中' : isImageFailed ? '加载失败' : '暂无图片'}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>{record.filename}</TableCell>
                            <TableCell>{formatDateTime(record.assessTime)}</TableCell>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="body2">{qualityDisplay.rawText}</Typography>
                                <Typography color="text.secondary" variant="caption">
                                  {qualityDisplay.levelLabel}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{getSceneLabel(record.scene)}</TableCell>
                            <TableCell sx={{ maxWidth: 280, minWidth: 220 }}>
                              <DistortionList distortions={record.distortions} variant="chips" />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={total}
                    onPageChange={(_event, nextPage) => {
                      setIsLoading(true)
                      setPage(nextPage + 1)
                    }}
                    onRowsPerPageChange={event => {
                      setIsLoading(true)
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    page={page - 1}
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                  />
                </TableContainer>
              </>
            ) : (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">暂无评估记录。</Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Dialog maxWidth="md" onClose={() => setPreviewImage('')} open={Boolean(previewImage)}>
        <DialogTitle>图片预览</DialogTitle>
        <DialogContent>
          {previewImage ? (
            <Box
              alt="历史记录预览图"
              component="img"
              src={previewImage}
              sx={{
                borderRadius: 1,
                maxHeight: '70vh',
                objectFit: 'contain',
                width: '100%',
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default HistoryPage
