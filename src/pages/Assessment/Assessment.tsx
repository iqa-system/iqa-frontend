import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  ImageList,
  ImageListItem,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded'
import { alpha } from '@mui/material/styles'

import DistortionList from '@/components/DistortionList'
import { assessBatchImages, assessSingleImage } from '@/services/assessment'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { BatchAssessmentEvent, PredictResult } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import { getSceneLabel } from '@/utils/constants'
import { getQualityScoreDisplay } from '@/utils/format'

type AssessmentTab = 'single' | 'batch'

interface PreviewItem {
  name: string
  url: string
}

interface ResultCardProps {
  result: PredictResult
}

function ResultCard({ result }: ResultCardProps) {
  const qualityDisplay = getQualityScoreDisplay(result.quality_score)

  return (
    <Card
      sx={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
        height: '100%',
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">{result.file_name}</Typography>
            <Typography color="text.secondary" variant="body2">
              模型已完成质量、场景与失真识别。
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <Box
              sx={{
                bgcolor: alpha('#136f63', 0.08),
                borderRadius: 3,
                p: 2,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                质量分数
              </Typography>
              <Typography variant="h5">{qualityDisplay.rawText}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                质量等级: {qualityDisplay.levelLabel}
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: alpha('#ff7a59', 0.1),
                borderRadius: 3,
                p: 2,
              }}
            >
                <Typography color="text.secondary" variant="caption">
                  场景分类
                </Typography>
                <Typography variant="body1">{getSceneLabel(result.scene)}</Typography>
              </Box>
          </Box>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="caption">
              失真类型分布
            </Typography>
            <DistortionList distortions={result.distortions} variant="panel" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function AssessmentPage() {
  const showError = useSnackbarStore(state => state.showError)
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [activeTab, setActiveTab] = useState<AssessmentTab>('single')
  const [previewDialog, setPreviewDialog] = useState({
    fileName: '',
    imageUrl: '',
    open: false,
  })

  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [singlePreviewUrl, setSinglePreviewUrl] = useState('')
  const [singleResult, setSingleResult] = useState<PredictResult | null>(null)
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false)

  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchPreviews, setBatchPreviews] = useState<PreviewItem[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchMessage, setBatchMessage] = useState('等待开始')
  const [batchResults, setBatchResults] = useState<PredictResult[]>([])
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false)
  const batchAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (singlePreviewUrl) {
        URL.revokeObjectURL(singlePreviewUrl)
      }
    }
  }, [singlePreviewUrl])

  useEffect(() => {
    return () => {
      batchPreviews.forEach(item => URL.revokeObjectURL(item.url))
    }
  }, [batchPreviews])

  useEffect(() => {
    return () => {
      batchAbortRef.current?.abort()
    }
  }, [])

  const batchCountLabel = useMemo(() => {
    if (!batchFiles.length) {
      return '尚未选择图片'
    }

    return `已选择 ${batchFiles.length} 张图片`
  }, [batchFiles.length])

  const openPreviewDialog = (imageUrl: string, fileName: string) => {
    if (!imageUrl) {
      return
    }

    setPreviewDialog({
      fileName,
      imageUrl,
      open: true,
    })
  }

  const closePreviewDialog = () => {
    setPreviewDialog({
      fileName: '',
      imageUrl: '',
      open: false,
    })
  }

  const handleSingleFileChange = (file: File | null) => {
    if (singlePreviewUrl) {
      URL.revokeObjectURL(singlePreviewUrl)
    }

    setSingleFile(file)
    setSingleResult(null)
    setSinglePreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  const handleBatchFileChange = (files: File[]) => {
    batchPreviews.forEach(item => URL.revokeObjectURL(item.url))

    const nextPreviews = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    setBatchFiles(files)
    setBatchPreviews(nextPreviews)
    setBatchResults([])
    setBatchProgress(0)
    setBatchMessage(files.length ? '文件已准备, 可以开始评估。' : '等待开始')
  }

  const handleSingleSubmit = async () => {
    if (!singleFile) {
      showInfo('请先选择需要评估的图片。')
      return
    }

    setIsSingleSubmitting(true)

    try {
      const result = await assessSingleImage(singleFile)
      setSingleResult(result)
      showSuccess('评估完成。')
    } catch (error) {
      showError(extractErrorMessage(error, '单张图片评估失败。'))
    } finally {
      setIsSingleSubmitting(false)
    }
  }

  const handleBatchEvent = (event: BatchAssessmentEvent) => {
    switch (event.type) {
      case 'start':
      case 'progress':
        setBatchMessage(event.payload.message)
        setBatchProgress(event.payload.progress ?? 0)
        break
      case 'result':
        setBatchMessage(event.payload.message)
        setBatchProgress(event.payload.progress ?? 0)
        setBatchResults(current => [...current, event.payload.predictResult])
        break
      case 'completed':
        setBatchMessage(event.payload.message)
        setBatchProgress(event.payload.progress ?? 100)
        setBatchResults(current =>
          event.payload.results.length ? event.payload.results : current,
        )
        showSuccess(`批量评估完成, 共评估 ${event.payload.completed ?? batchFiles.length} 张图片。`)
        break
      case 'error':
        setBatchMessage(event.payload.message)
        break
      default:
        break
    }
  }

  const handleBatchSubmit = async () => {
    if (!batchFiles.length) {
      showInfo('请先选择至少一张图片。')
      return
    }

    batchAbortRef.current?.abort()
    const controller = new AbortController()
    batchAbortRef.current = controller

    setIsBatchSubmitting(true)
    setBatchProgress(0)
    setBatchResults([])
    setBatchMessage('批量评估任务已提交。')

    try {
      await assessBatchImages(batchFiles, {
        onEvent: handleBatchEvent,
        signal: controller.signal,
      })
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        showError(extractErrorMessage(error, '批量评估失败。'))
      }
    } finally {
      setIsBatchSubmitting(false)
      batchAbortRef.current = null
    }
  }

  return (
    <Stack spacing={3.5}>
      <Card
        sx={{
          background:
            'linear-gradient(135deg, rgba(19,111,99,0.96) 0%, rgba(255,122,89,0.92) 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 72%)',
              height: 240,
              pointerEvents: 'none',
              position: 'absolute',
              right: -80,
              top: -100,
              width: 240,
            }}
          />
          <Stack spacing={1.25}>
            <Typography variant="overline">Assessment Console</Typography>
            <Typography sx={{ maxWidth: 720 }} variant="h3">
              把上传、推理、结果呈现和批量进度跟踪放进同一个操作台。
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.84)', maxWidth: 720 }} variant="body1">
              你可以执行单张图片即时评估, 也可以通过 SSE 流式反馈观察批量任务的推进过程。
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Tabs onChange={(_event, value: AssessmentTab) => setActiveTab(value)} value={activeTab}>
              <Tab
                icon={<ImageSearchRoundedIcon />}
                iconPosition="start"
                label="单张评估"
                value="single"
              />
              <Tab
                icon={<CollectionsRoundedIcon />}
                iconPosition="start"
                label="批量评估"
                value="batch"
              />
            </Tabs>

            {activeTab === 'single' ? (
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
                }}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2.5}>
                      <Stack spacing={0.75}>
                        <Typography variant="h5">上传单张图片</Typography>
                        <Typography color="text.secondary" variant="body2">
                          支持本地图片预览, 评估完成后将展示分数、场景和失真类型。
                        </Typography>
                      </Stack>
                      <Button
                        component="label"
                        startIcon={<CloudUploadRoundedIcon />}
                        variant="outlined"
                      >
                        选择图片
                        <input
                          accept="image/*"
                          hidden
                          onChange={event =>
                            handleSingleFileChange(event.target.files?.[0] ?? null)
                          }
                          type="file"
                        />
                      </Button>
                      <Alert severity="info">
                        {singleFile ? `当前文件: ${singleFile.name}` : '尚未选择图片。'}
                      </Alert>
                      <Button
                        disabled={!singleFile || isSingleSubmitting}
                        onClick={() => void handleSingleSubmit()}
                        startIcon={isSingleSubmitting ? undefined : <AutoAwesomeRoundedIcon />}
                        variant="contained"
                      >
                        {isSingleSubmitting ? '评估中...' : '开始评估'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Stack spacing={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Typography variant="h5">图片预览</Typography>
                        <Box
                          sx={{
                            alignItems: 'center',
                            background:
                              'repeating-linear-gradient(135deg, rgba(15,23,42,0.03), rgba(15,23,42,0.03) 12px, rgba(15,23,42,0.06) 12px, rgba(15,23,42,0.06) 24px)',
                            border: '1px dashed rgba(15, 23, 42, 0.12)',
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'center',
                            minHeight: 320,
                            overflow: 'hidden',
                            p: 2,
                          }}
                        >
                          {singlePreviewUrl ? (
                            <Box
                              alt={singleFile?.name ?? '预览图'}
                              component="img"
                              onClick={() =>
                                openPreviewDialog(singlePreviewUrl, singleFile?.name ?? '预览图')
                              }
                              src={singlePreviewUrl}
                              sx={{
                                borderRadius: 3,
                                cursor: 'zoom-in',
                                maxHeight: 420,
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            <Stack alignItems="center" spacing={1.5}>
                              <CloudUploadRoundedIcon color="action" sx={{ fontSize: 48 }} />
                              <Typography color="text.secondary" variant="body2">
                                选择图片后将在这里显示预览。
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                        {singlePreviewUrl ? (
                          <Typography color="text.secondary" variant="caption">
                            点击图片可放大查看。
                          </Typography>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>

                  {singleResult ? <ResultCard result={singleResult} /> : null}
                </Stack>
              </Box>
            ) : (
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2.5}>
                        <Stack spacing={0.75}>
                          <Typography variant="h5">上传批量图片</Typography>
                          <Typography color="text.secondary" variant="body2">
                            任务执行过程中会实时更新进度, 并逐张追加评估结果。
                          </Typography>
                        </Stack>
                        <Button
                          component="label"
                          startIcon={<CollectionsRoundedIcon />}
                          variant="outlined"
                        >
                          选择多张图片
                          <input
                            accept="image/*"
                            hidden
                            multiple
                            onChange={event =>
                              handleBatchFileChange(Array.from(event.target.files ?? []))
                            }
                            type="file"
                          />
                        </Button>
                        <Alert severity="info">{batchCountLabel}</Alert>
                        <Button
                          disabled={!batchFiles.length || isBatchSubmitting}
                          onClick={() => void handleBatchSubmit()}
                          variant="contained"
                        >
                          {isBatchSubmitting ? '批量评估中...' : '启动批量评估'}
                        </Button>
                        <Divider />
                        <Stack spacing={1.25}>
                          <Stack
                            alignItems="center"
                            direction="row"
                            justifyContent="space-between"
                          >
                            <Typography variant="subtitle2">任务进度</Typography>
                            <Chip label={`${Math.round(batchProgress)}%`} size="small" />
                          </Stack>
                          <LinearProgress
                            sx={{ height: 10, borderRadius: 999 }}
                            value={batchProgress}
                            variant="determinate"
                          />
                          <Typography color="text.secondary" variant="body2">
                            {batchMessage}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Typography variant="h5">文件预览</Typography>
                        {batchPreviews.length ? (
                          <Typography color="text.secondary" variant="caption">
                            点击任一缩略图可放大查看, 预览下方显示文件名。
                          </Typography>
                        ) : null}
                        {batchPreviews.length ? (
                          <ImageList cols={4} gap={16}>
                            {batchPreviews.map(item => (
                              <ImageListItem
                                key={item.url}
                                onClick={() => openPreviewDialog(item.url, item.name)}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  border: '1px solid rgba(15, 23, 42, 0.08)',
                                  cursor: 'zoom-in',
                                  overflow: 'hidden',
                                  borderRadius: 3,
                                }}
                              >
                                <img
                                  alt={item.name}
                                  loading="lazy"
                                  src={item.url}
                                  style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                                />
                                <Box sx={{ px: 1.25, py: 1 }}>
                                  <Typography noWrap title={item.name} variant="caption">
                                    {item.name}
                                  </Typography>
                                </Box>
                              </ImageListItem>
                            ))}
                          </ImageList>
                        ) : (
                          <Box
                            sx={{
                              alignItems: 'center',
                              border: '1px dashed rgba(15, 23, 42, 0.12)',
                              borderRadius: 4,
                              display: 'flex',
                              justifyContent: 'center',
                              minHeight: 260,
                            }}
                          >
                            <Typography color="text.secondary" variant="body2">
                              选择图片后将在这里显示缩略图列表。
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Stack spacing={2}>
                  <Typography variant="h5">评估结果</Typography>
                  {batchResults.length ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      }}
                    >
                      {batchResults.map(result => (
                        <ResultCard key={`${result.file_name}-${result.quality_score}`} result={result} />
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">批量任务开始后, 结果会逐条显示在这里。</Alert>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog maxWidth="md" onClose={closePreviewDialog} open={previewDialog.open}>
        <DialogTitle>{previewDialog.fileName || '图片预览'}</DialogTitle>
        <DialogContent>
          {previewDialog.imageUrl ? (
            <Box
              alt={previewDialog.fileName || '评估页预览图'}
              component="img"
              src={previewDialog.imageUrl}
              sx={{
                borderRadius: 2,
                maxHeight: '70vh',
                objectFit: 'contain',
                width: '100%',
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

export default AssessmentPage
