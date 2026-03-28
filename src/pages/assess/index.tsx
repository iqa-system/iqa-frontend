import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import UploadRoundedIcon from '@mui/icons-material/UploadRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'

import { PageFeedback } from '@/components/common/page-feedback'
import { assessBatchImages, assessSingleImage } from '@/services/assess-service'
import { useSnackbarStore } from '@/stores/snackbar-store'
import type { PredictResult } from '@/types/api'
import {
  formatDistortionLabel,
  formatQualityScore,
  formatSceneLabel,
  resolveBatchProgress,
} from '@/utils/formatters'
import { getErrorMessage } from '@/utils/error'

type AssessTab = 'single' | 'batch'

function ResultSummaryCard({
  title,
  result,
}: {
  title: string
  result: PredictResult
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: '1px solid rgba(20, 83, 45, 0.08)',
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6">{title}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip color="primary" label={`质量分数: ${formatQualityScore(result.quality_score)}`} />
          <Chip variant="outlined" label={`场景: ${formatSceneLabel(result.scene)}`} />
          <Chip variant="outlined" label={`失真: ${formatDistortionLabel(result.distortion)}`} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          文件名: {result.file_name}
        </Typography>
      </Stack>
    </Paper>
  )
}

export function Component() {
  const openSnackbar = useSnackbarStore((state) => state.openSnackbar)
  const batchAbortControllerRef = useRef<AbortController | null>(null)
  const [activeTab, setActiveTab] = useState<AssessTab>('single')
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [singlePreviewUrl, setSinglePreviewUrl] = useState('')
  const [singleResult, setSingleResult] = useState<PredictResult | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleError, setSingleError] = useState('')
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<PredictResult[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)
  const [batchCompleted, setBatchCompleted] = useState(0)
  const [batchStatusText, setBatchStatusText] = useState('请选择多张图片后开始批量评估')
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState('')

  useEffect(() => {
    if (!singleFile) {
      setSinglePreviewUrl('')
      return
    }

    const previewUrl = URL.createObjectURL(singleFile)

    setSinglePreviewUrl(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [singleFile])

  useEffect(() => {
    return () => {
      batchAbortControllerRef.current?.abort()
    }
  }, [])

  const handleSingleAssess = async () => {
    if (!singleFile) {
      openSnackbar({
        message: '请先选择一张图片',
        severity: 'warning',
      })
      return
    }

    setSingleLoading(true)
    setSingleError('')

    try {
      const result = await assessSingleImage(singleFile)

      setSingleResult(result)

      openSnackbar({
        message: '单张图片评估完成',
        severity: 'success',
      })
    } catch (error) {
      const errorMessage = getErrorMessage(error, '单张图片评估失败, 请稍后重试')

      setSingleError(errorMessage)
      openSnackbar({
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setSingleLoading(false)
    }
  }

  const handleBatchAssess = async () => {
    if (!batchFiles.length) {
      openSnackbar({
        message: '请先选择多张图片',
        severity: 'warning',
      })
      return
    }

    batchAbortControllerRef.current?.abort()
    batchAbortControllerRef.current = new AbortController()

    setBatchLoading(true)
    setBatchError('')
    setBatchResults([])
    setBatchProgress(0)
    setBatchTotal(batchFiles.length)
    setBatchCompleted(0)
    setBatchStatusText('批量评估任务已开始')

    try {
      await assessBatchImages(batchFiles, {
        signal: batchAbortControllerRef.current.signal,
        onEvent: (batchEvent) => {
          const nextProgress = resolveBatchProgress(
            batchEvent.data.progress,
            batchEvent.data.completed,
            batchEvent.data.total
          )

          setBatchProgress(nextProgress)
          setBatchStatusText(batchEvent.data.message || '批量评估处理中')

          if (typeof batchEvent.data.total === 'number') {
            setBatchTotal(batchEvent.data.total)
          }

          if (typeof batchEvent.data.completed === 'number') {
            setBatchCompleted(batchEvent.data.completed)
          }

          if (batchEvent.event === 'result' && 'predictResult' in batchEvent.data) {
            const currentResult = batchEvent.data.predictResult

            if (currentResult) {
              setBatchResults((previousValue) => [...previousValue, currentResult])
            }
          }

          if (batchEvent.event === 'completed') {
            if ('results' in batchEvent.data && batchEvent.data.results?.length) {
              setBatchResults(batchEvent.data.results)
            }

            openSnackbar({
              message: '批量评估完成',
              severity: 'success',
            })
          }

          if (batchEvent.event === 'error') {
            const errorMessage = batchEvent.data.message || '批量评估失败, 请稍后重试'

            setBatchError(errorMessage)
            openSnackbar({
              message: errorMessage,
              severity: 'error',
            })
          }
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const errorMessage = getErrorMessage(error, '批量评估失败, 请稍后重试')

      setBatchError(errorMessage)
      openSnackbar({
        message: errorMessage,
        severity: 'error',
      })
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: 6,
          border: '1px solid rgba(20, 83, 45, 0.08)',
        }}
      >
        <Stack spacing={1.4}>
          <Typography variant="h4">图像质量评估</Typography>
          <Typography variant="body1" color="text.secondary">
            支持单张图片精细评估和多张图片批量评估. 评估完成后会自动弹出中文提示信息.
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 6,
          border: '1px solid rgba(20, 83, 45, 0.08)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value: AssessTab) => setActiveTab(value)}
          sx={{ mb: 3 }}
        >
          <Tab value="single" label="单张评估" icon={<ImageSearchRoundedIcon />} iconPosition="start" />
          <Tab value="batch" label="批量评估" icon={<LayersRoundedIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 'single' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 1.1fr) minmax(420px, 1fr)',
              gap: 24,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                border: '1px dashed rgba(20, 83, 45, 0.2)',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">上传单张图片</Typography>
                    <Typography variant="body2" color="text.secondary">
                      选择一张图片后即可发起质量评估
                    </Typography>
                  </Box>
                  <Button variant="outlined" component="label" startIcon={<UploadRoundedIcon />}>
                    选择图片
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] ?? null

                        setSingleFile(nextFile)
                        setSingleResult(null)
                        setSingleError('')
                      }}
                    />
                  </Button>
                </Stack>

                <Divider />

                {singlePreviewUrl ? (
                  <Box
                    component="img"
                    src={singlePreviewUrl}
                    alt="单张图片预览"
                    sx={{
                      width: '100%',
                      height: 320,
                      objectFit: 'contain',
                      borderRadius: 4,
                      bgcolor: '#f7faf7',
                    }}
                  />
                ) : (
                  <PageFeedback
                    type="empty"
                    title="暂无图片预览"
                    description="请选择一张图片后, 这里会展示对应预览内容"
                  />
                )}

                <Button
                  size="large"
                  variant="contained"
                  disabled={singleLoading}
                  onClick={() => void handleSingleAssess()}
                >
                  {singleLoading ? '评估中' : '开始单张评估'}
                </Button>
              </Stack>
            </Paper>

            <Stack spacing={2.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  border: '1px solid rgba(20, 83, 45, 0.08)',
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h6">评估说明</Typography>
                  <Typography variant="body2" color="text.secondary">
                    结果会展示质量分数, 场景类别和失真类型. 若重新选择图片, 当前结果会自动清空.
                  </Typography>
                </Stack>
              </Paper>

              {singleLoading ? (
                <PageFeedback
                  type="loading"
                  title="正在执行单张评估"
                  description="系统正在请求后端模型, 请稍候"
                />
              ) : singleError ? (
                <PageFeedback
                  type="error"
                  title="单张评估失败"
                  description={singleError}
                  actionText="重新评估"
                  onAction={() => void handleSingleAssess()}
                />
              ) : singleResult ? (
                <ResultSummaryCard title="单张评估结果" result={singleResult} />
              ) : (
                <PageFeedback
                  type="empty"
                  title="暂无评估结果"
                  description="上传图片并点击开始单张评估后, 结果会展示在这里"
                />
              )}
            </Stack>
          </Box>
        ) : (
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                border: '1px dashed rgba(20, 83, 45, 0.2)',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">上传多张图片</Typography>
                    <Typography variant="body2" color="text.secondary">
                      选择多张图片后开始批量评估, 进度条会随着服务端流事件实时更新
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" component="label" startIcon={<UploadRoundedIcon />}>
                      选择图片
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          const nextFiles = Array.from(event.target.files ?? [])

                          setBatchFiles(nextFiles)
                          setBatchResults([])
                          setBatchError('')
                          setBatchProgress(0)
                          setBatchCompleted(0)
                          setBatchTotal(nextFiles.length)
                          setBatchStatusText('已更新批量评估文件列表')
                        }}
                      />
                    </Button>
                    <Button
                      variant="contained"
                      disabled={batchLoading}
                      onClick={() => void handleBatchAssess()}
                    >
                      {batchLoading ? '评估中' : '开始批量评估'}
                    </Button>
                  </Stack>
                </Stack>

                {batchFiles.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {batchFiles.map((file) => (
                      <Chip key={file.name} label={file.name} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    当前还没有选择待评估图片
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                border: '1px solid rgba(20, 83, 45, 0.08)',
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">批量评估进度</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {batchCompleted}/{batchTotal || batchFiles.length || 0} 张
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={batchProgress}
                  sx={{ height: 10, borderRadius: 999 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {batchStatusText}
                </Typography>
              </Stack>
            </Paper>

            {batchLoading && !batchResults.length ? (
              <PageFeedback
                type="loading"
                title="正在执行批量评估"
                description="系统正在持续接收服务端进度流, 请稍候"
              />
            ) : batchError && !batchResults.length ? (
              <PageFeedback
                type="error"
                title="批量评估失败"
                description={batchError}
                actionText="重新评估"
                onAction={() => void handleBatchAssess()}
              />
            ) : batchResults.length ? (
              <Stack spacing={2}>
                {batchResults.map((result, index) => (
                  <ResultSummaryCard
                    key={`${result.file_name}-${index}`}
                    title={`第 ${index + 1} 张图片评估结果`}
                    result={result}
                  />
                ))}
              </Stack>
            ) : (
              <PageFeedback
                type="empty"
                title="暂无批量评估结果"
                description="请选择多张图片并点击开始批量评估后, 结果会依次展示在这里"
              />
            )}
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}
