import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
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
  TextField,
  Typography,
} from '@mui/material'

import DistortionList from '@/components/DistortionList'
import LoadingScreen from '@/components/LoadingScreen'
import {
  deleteAssessmentHistory,
  getAssessmentHistory,
  resolveHistoryImageUrl,
  updateAssessmentExpertScore,
} from '@/services/assessment'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { AssessRecord } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import { getSceneLabel, isExpertRole } from '@/utils/constants'
import { formatDateTime, formatExpertScore, getQualityScoreDisplay } from '@/utils/format'
import { exportHistoryRecords, type HistoryExportFormat } from '@/utils/history-export'
import { parseExpertScoreInput } from '@/utils/validation'

function HistoryPage() {
  const currentUserRole = useAuthStore(state => state.user?.role)
  const showError = useSnackbarStore(state => state.showError)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const isExpertUser = isExpertRole(currentUserRole)
  const [records, setRecords] = useState<AssessRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [failedImageRecordIds, setFailedImageRecordIds] = useState<number[]>([])
  const [previewImage, setPreviewImage] = useState('')
  const [exportingFormat, setExportingFormat] = useState<HistoryExportFormat | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expertScoreDialogRecord, setExpertScoreDialogRecord] = useState<AssessRecord | null>(null)
  const [expertScoreInput, setExpertScoreInput] = useState('')
  const [expertScoreError, setExpertScoreError] = useState('')
  const [isSavingExpertScore, setIsSavingExpertScore] = useState(false)
  const [historyReloadKey, setHistoryReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setSelectedRecordIds([])
    setPreviewImage('')
    setIsDeleteDialogOpen(false)
    setExpertScoreDialogRecord(null)
    setExpertScoreInput('')
    setExpertScoreError('')

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
  }, [historyReloadKey, page, pageSize, showError])

  useEffect(() => {
    /**
     * 历史记录切页或刷新后, 旧页面的图片失败态不应继续污染新数据.
     * 这里在 records 变化时统一重置失败状态, 让每一页都按自己的图片结果重新判断.
     */
    setFailedImageRecordIds([])
  }, [records])

  /**
   * 新版后端图片资源已经允许直接用于 <img src>.
   * 这里仅把每条记录的 imageURL 规范化成最终展示地址, 不再主动拉取 Blob 或维护 object URL 生命周期.
   */
  const recordImageUrls = useMemo(() => {
    return records.reduce<Record<number, string>>((currentMap, record) => {
      const imageUrl = resolveHistoryImageUrl(record)

      if (imageUrl) {
        currentMap[record.id] = imageUrl
      }

      return currentMap
    }, {})
  }, [records])

  const selectedRecordIdSet = new Set(selectedRecordIds)
  const failedImageRecordIdSet = new Set(failedImageRecordIds)
  const selectedRecords = records.filter(record => selectedRecordIdSet.has(record.id))
  const selectedCount = selectedRecords.length
  const allRecordsSelected = records.length > 0 && selectedCount === records.length
  const hasPartialSelection = selectedCount > 0 && selectedCount < records.length
  const isBatchActionBusy = exportingFormat !== null || isDeleting

  const handleOpenPreview = (recordId: number) => {
    const imageUrl = recordImageUrls[recordId]

    if (!imageUrl || failedImageRecordIdSet.has(recordId)) {
      return
    }

    setPreviewImage(imageUrl)
  }

  /**
   * 浏览器会自行请求直连图片资源.
   * 当 <img> 触发 onError 时, 只记录失败状态并在需要时关闭预览, 避免继续渲染失效图片.
   */
  const handleImageLoadError = (recordId: number, imageUrl: string) => {
    setFailedImageRecordIds(currentIds => (
      currentIds.includes(recordId) ? currentIds : [...currentIds, recordId]
    ))
    setPreviewImage(currentImage => (currentImage === imageUrl ? '' : currentImage))
  }

  /**
   * 历史页的专家评分修改只对 EXPERT 用户开放.
   * 打开弹窗时先缓存当前记录快照, 避免刷新列表后弹窗内容出现错位.
   */
  const handleOpenExpertScoreDialog = (record: AssessRecord) => {
    setExpertScoreDialogRecord(record)
    setExpertScoreInput(formatExpertScore(record.expertScore, ''))
    setExpertScoreError('')
  }

  const handleCloseExpertScoreDialog = () => {
    if (isSavingExpertScore) {
      return
    }

    setExpertScoreDialogRecord(null)
    setExpertScoreInput('')
    setExpertScoreError('')
  }

  const handleSaveExpertScore = async () => {
    if (!expertScoreDialogRecord) {
      return
    }

    const validationResult = parseExpertScoreInput(expertScoreInput, { required: true })

    if (validationResult.error || validationResult.value === undefined) {
      setExpertScoreError(validationResult.error || '请输入专家主观评分.')
      return
    }

    setIsSavingExpertScore(true)

    try {
      const message = await updateAssessmentExpertScore(expertScoreDialogRecord.id, validationResult.value)
      setExpertScoreDialogRecord(null)
      setExpertScoreInput('')
      setExpertScoreError('')
      setIsLoading(true)
      showSuccess(message || '专家主观评分保存成功。')
      setHistoryReloadKey(current => current + 1)
    } catch (error) {
      showError(extractErrorMessage(error, '专家主观评分保存失败。'))
    } finally {
      setIsSavingExpertScore(false)
    }
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

  const handleDeleteSelectedRecords = async () => {
    if (!selectedRecordIds.length) {
      return
    }

    setIsDeleting(true)

    try {
      const deletedCount = await deleteAssessmentHistory(selectedRecordIds)
      const nextTotal = Math.max(total - deletedCount, 0)
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)))

      setSelectedRecordIds([])
      setPreviewImage('')
      setIsDeleteDialogOpen(false)
      setIsLoading(true)
      showSuccess(`已删除 ${deletedCount} 条历史记录。`)

      if (nextPage !== page) {
        setPage(nextPage)
        return
      }

      setHistoryReloadKey(current => current + 1)
    } catch (error) {
      showError(extractErrorMessage(error, '历史记录删除失败。'))
    } finally {
      setIsDeleting(false)
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
                  sx={theme => ({
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    px: 3,
                    py: 2.5,
                  })}
                >
                  <Stack
                    direction={{ md: 'row', xs: 'column' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="h6">批量操作</Typography>
                      <Typography color="text.secondary" variant="body2">
                        已选 {selectedCount} 条 / 当前页 {records.length} 条。仅处理当前页勾选记录。
                      </Typography>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      <Button
                        disabled={!selectedCount || isBatchActionBusy}
                        onClick={() => void handleExport('csv')}
                        variant="outlined"
                      >
                        {exportingFormat === 'csv' ? '导出中...' : '导出 CSV'}
                      </Button>
                      <Button
                        disabled={!selectedCount || isBatchActionBusy}
                        onClick={() => void handleExport('xlsx')}
                        variant="contained"
                      >
                        {exportingFormat === 'xlsx' ? '导出中...' : '导出 XLSX'}
                      </Button>
                      <Button
                        color="error"
                        disabled={!selectedCount || isBatchActionBusy}
                        onClick={() => setIsDeleteDialogOpen(true)}
                        variant="outlined"
                      >
                        {isDeleting ? '删除中...' : '删除所选'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>

                <TableContainer component={Paper} elevation={0}>
                  <Table sx={{ minWidth: isExpertUser ? 1360 : 1040 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={allRecordsSelected}
                            disabled={isDeleting}
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
                        {isExpertUser ? <TableCell>专家评分</TableCell> : null}
                        {isExpertUser ? <TableCell>评分时间</TableCell> : null}
                        <TableCell>场景分类</TableCell>
                        <TableCell>失真类型</TableCell>
                        {isExpertUser ? <TableCell align="right">操作</TableCell> : null}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map(record => {
                        const imageUrl = recordImageUrls[record.id] || ''
                        const isSelected = selectedRecordIdSet.has(record.id)
                        const isImageFailed = failedImageRecordIdSet.has(record.id)
                        const hasImage = Boolean(imageUrl) && !isImageFailed
                        const qualityDisplay = getQualityScoreDisplay(record.qualityScore)

                        return (
                          <TableRow hover key={record.id} selected={isSelected}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                disabled={isDeleting}
                                slotProps={{ input: { 'aria-label': `选择历史记录 ${record.id}` } }}
                                onChange={() => handleToggleRecord(record.id)}
                              />
                            </TableCell>
                            <TableCell>{record.id}</TableCell>
                            <TableCell>
                              {hasImage ? (
                                <Box
                                  alt={record.filename}
                                  component="img"
                                  loading="lazy"
                                  onClick={() => handleOpenPreview(record.id)}
                                  onError={() => handleImageLoadError(record.id, imageUrl)}
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
                                  sx={theme => ({
                                    alignItems: 'center',
                                    bgcolor:
                                      theme.palette.mode === 'dark'
                                        ? 'rgba(148, 163, 184, 0.08)'
                                        : 'rgba(15, 23, 42, 0.04)',
                                    border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.12)'}`,
                                    borderRadius: 2,
                                    display: 'flex',
                                    height: 60,
                                    justifyContent: 'center',
                                    px: 1,
                                    textAlign: 'center',
                                    width: 60,
                                  })}
                                >
                                  <Typography color="text.secondary" sx={{ lineHeight: 1.2 }} variant="caption">
                                    {isImageFailed ? '加载失败' : '暂无图片'}
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
                            {isExpertUser ? (
                              <TableCell>{formatExpertScore(record.expertScore)}</TableCell>
                            ) : null}
                            {isExpertUser ? (
                              <TableCell>{formatDateTime(record.expertScoreTime)}</TableCell>
                            ) : null}
                            <TableCell>{getSceneLabel(record.scene)}</TableCell>
                            <TableCell sx={{ maxWidth: 280, minWidth: 220 }}>
                              <DistortionList distortions={record.distortions} variant="chips" />
                            </TableCell>
                            {isExpertUser ? (
                              <TableCell align="right">
                                <Button
                                  disabled={isDeleting || isSavingExpertScore}
                                  onClick={() => handleOpenExpertScoreDialog(record)}
                                  size="small"
                                  variant="outlined"
                                >
                                  {record.expertScore === null || record.expertScore === undefined ? '填写评分' : '修改评分'}
                                </Button>
                              </TableCell>
                            ) : null}
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

      <Dialog maxWidth="xs" onClose={handleCloseExpertScoreDialog} open={Boolean(expertScoreDialogRecord)}>
        <DialogTitle>
          {expertScoreDialogRecord?.expertScore === null || expertScoreDialogRecord?.expertScore === undefined
            ? '填写专家评分'
            : '修改专家评分'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                文件名: {expertScoreDialogRecord?.filename ?? '--'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                评估时间: {formatDateTime(expertScoreDialogRecord?.assessTime)}
              </Typography>
            </Stack>
            <TextField
              error={Boolean(expertScoreError)}
              helperText={expertScoreError || '请输入 0.00 到 5.00 之间的分值, 最多 2 位小数。'}
              label="专家主观评分"
              onChange={event => {
                setExpertScoreInput(event.target.value)
                setExpertScoreError('')
              }}
              slotProps={{
                htmlInput: {
                  inputMode: 'decimal',
                  max: 5,
                  min: 0,
                  step: '0.01',
                },
              }}
              type="number"
              value={expertScoreInput}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={isSavingExpertScore} onClick={handleCloseExpertScoreDialog} variant="text">
            取消
          </Button>
          <Button
            disabled={isSavingExpertScore}
            onClick={() => void handleSaveExpertScore()}
            variant="contained"
          >
            {isSavingExpertScore ? '保存中...' : '保存评分'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        maxWidth="xs"
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false)
          }
        }}
        open={isDeleteDialogOpen}
      >
        <DialogTitle>确认删除历史记录</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              将删除当前选中的 {selectedCount} 条评估历史记录，并同步清理关联图片资源。
            </Typography>
            <Alert severity="warning">删除后不可恢复，请确认后再继续。</Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            disabled={isDeleting}
            onClick={() => setIsDeleteDialogOpen(false)}
            variant="text"
          >
            取消
          </Button>
          <Button
            color="error"
            disabled={isDeleting || !selectedCount}
            onClick={() => void handleDeleteSelectedRecords()}
            variant="contained"
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default HistoryPage
