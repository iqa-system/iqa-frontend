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
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded'
import { alpha } from '@mui/material/styles'

import DistortionList from '@/components/DistortionList'
import {
  assessBatchImages,
  assessSingleImage,
  getAssessmentModels,
} from '@/services/assessment'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { BatchAssessmentEvent, ModelInfo, PredictResult } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import {
  DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE,
  getAssessmentModelDisplayName,
  getDefaultAssessmentModelOptionLabel,
  getModelCapabilityLabel,
  getSceneLabel,
  isExpertRole,
} from '@/utils/constants'
import { getQualityScoreDisplay } from '@/utils/format'
import { parseExpertScoreInput } from '@/utils/validation'

type AssessmentTab = 'single' | 'batch'

interface PreviewItem {
  name: string
  url: string
}

interface ResultCardProps {
  modelInfoMap: Record<string, ModelInfo>
  result: PredictResult
}

function ResultCard({ modelInfoMap, result }: ResultCardProps) {
  const qualityDisplay = getQualityScoreDisplay(result.quality_score)
  const fileName = result.file_name?.trim() || '未命名文件'
  const modelDisplayName = getAssessmentModelDisplayName(result.model_id, modelInfoMap, {
    emptyFallback: '未知模型',
  })
  const sceneDisplayText = result.scene === null
    ? '该模型未提供场景分类'
    : getSceneLabel(result.scene)
  const hasDistortionCapability = Array.isArray(result.distortions)

  return (
    <Card
      sx={theme => ({
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(20,28,38,0.94) 0%, rgba(15,23,32,0.92) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
        height: '100%',
      })}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography sx={{fontWeight: 'bolder'}} variant="subtitle1">{fileName}</Typography>
            <Typography color="text.secondary" variant="body2">
              实际执行模型: {modelDisplayName}
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
              sx={theme => ({
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                borderRadius: 1,
                p: 2,
              })}
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
              sx={theme => ({
                bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                borderRadius: 1,
                p: 2,
              })}
            >
              <Typography color="text.secondary" variant="caption">
                场景分类
              </Typography>
              <Typography variant="body1">{sceneDisplayText}</Typography>
            </Box>
          </Box>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="caption">
              失真类型分布
            </Typography>
            {hasDistortionCapability ? (
              <DistortionList distortions={result.distortions} variant="panel" />
            ) : (
              <Alert severity="info" variant="outlined">
                该模型未提供失真类型识别.
              </Alert>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function AssessmentPage() {
  const currentUserRole = useAuthStore(state => state.user?.role)
  const showError = useSnackbarStore(state => state.showError)
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const isExpertUser = isExpertRole(currentUserRole)
  const [activeTab, setActiveTab] = useState<AssessmentTab>('single')
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [defaultModelId, setDefaultModelId] = useState('')
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE)
  const [isModelCatalogLoading, setIsModelCatalogLoading] = useState(true)
  const [modelCatalogError, setModelCatalogError] = useState('')
  const [previewDialog, setPreviewDialog] = useState({
    fileName: '',
    imageUrl: '',
    open: false,
  })

  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [singlePreviewUrl, setSinglePreviewUrl] = useState('')
  const [singleResult, setSingleResult] = useState<PredictResult | null>(null)
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false)
  const [singleExpertScoreInput, setSingleExpertScoreInput] = useState('')
  const [singleExpertScoreError, setSingleExpertScoreError] = useState('')

  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchPreviews, setBatchPreviews] = useState<PreviewItem[]>([])
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchMessage, setBatchMessage] = useState('等待开始')
  const [batchResults, setBatchResults] = useState<PredictResult[]>([])
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false)
  const [batchExpertScoreInputs, setBatchExpertScoreInputs] = useState<string[]>([])
  const [batchExpertScoreErrors, setBatchExpertScoreErrors] = useState<string[]>([])
  const batchAbortRef = useRef<AbortController | null>(null)
  const batchSubmittedExpertScoreCountRef = useRef(0)

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

  /**
   * 模型目录是评估页的共享基础数据.
   * 单张和批量评估都依赖同一套目录和当前选择, 因此在页面级统一加载和维护.
   * 如果目录接口失败, 前端会回退到“使用后端默认模型”的无 modelId 提交模式.
   */
  const loadAssessmentModelCatalog = async () => {
    setIsModelCatalogLoading(true)
    setModelCatalogError('')

    try {
      const data = await getAssessmentModels()
      const nextModels = data.models ?? []

      setAvailableModels(nextModels)
      setDefaultModelId(data.default_model_id ?? '')
      setSelectedModelId(currentModelId => (
        currentModelId !== DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE
          && nextModels.some(model => model.model_id === currentModelId)
          ? currentModelId
          : DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE
      ))
    } catch (error) {
      setAvailableModels([])
      setDefaultModelId('')
      setSelectedModelId(DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE)
      setModelCatalogError(
        extractErrorMessage(error, '可用模型加载失败, 当前将继续使用后端默认模型。'),
      )
    } finally {
      setIsModelCatalogLoading(false)
    }
  }

  useEffect(() => {
    void loadAssessmentModelCatalog()
  }, [])

  const modelInfoMap = useMemo(() => {
    return availableModels.reduce<Record<string, ModelInfo>>((currentMap, model) => {
      currentMap[model.model_id] = model
      return currentMap
    }, {})
  }, [availableModels])

  const resolvedDefaultModelId = useMemo(() => {
    return defaultModelId || availableModels.find(model => model.is_default)?.model_id || ''
  }, [availableModels, defaultModelId])

  const currentSubmittedModelId = selectedModelId === DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE
    ? undefined
    : selectedModelId

  const selectedModelInfo = currentSubmittedModelId
    ? modelInfoMap[currentSubmittedModelId]
    : modelInfoMap[resolvedDefaultModelId]

  const selectedModelCapabilityLabels = useMemo(() => {
    return (selectedModelInfo?.capabilities ?? []).map(getModelCapabilityLabel)
  }, [selectedModelInfo])

  const selectedModelSummaryText = selectedModelInfo
    ? getAssessmentModelDisplayName(selectedModelInfo.model_id, modelInfoMap)
    : '后端默认模型'

  const modelSelectorHelperText = modelCatalogError
    ? '模型目录暂时不可用, 提交时将自动回退到后端默认模型.'
    : currentSubmittedModelId
      ? '当前模型会同时作用于单张评估和批量评估.'
      : '当前未显式指定模型, 提交时将由后端默认模型处理.'

  const isModelSelectorDisabled = isSingleSubmitting || isBatchSubmitting || isModelCatalogLoading

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
    setSingleExpertScoreInput('')
    setSingleExpertScoreError('')
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
    setBatchExpertScoreInputs(files.map(() => ''))
    setBatchExpertScoreErrors(files.map(() => ''))
    batchSubmittedExpertScoreCountRef.current = 0
  }

  const handleSingleSubmit = async () => {
    if (!singleFile) {
      showInfo('请先选择需要评估的图片。')
      return
    }

    const singleExpertScoreResult = isExpertUser
      ? parseExpertScoreInput(singleExpertScoreInput)
      : { value: undefined }

    if (singleExpertScoreResult.error) {
      setSingleExpertScoreError(singleExpertScoreResult.error)
      return
    }

    setIsSingleSubmitting(true)

    try {
      const result = await assessSingleImage(singleFile, {
        modelId: currentSubmittedModelId,
        expertScore: singleExpertScoreResult.value,
      })
      setSingleResult(result)
      showSuccess(singleExpertScoreResult.value === undefined ? '评估完成。' : '评估完成, 已记录专家主观评分。')
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
        showSuccess(
          batchSubmittedExpertScoreCountRef.current > 0
            ? `批量评估完成, 共评估 ${event.payload.completed ?? batchFiles.length} 张图片, 已提交 ${batchSubmittedExpertScoreCountRef.current} 条专家评分。`
            : `批量评估完成, 共评估 ${event.payload.completed ?? batchFiles.length} 张图片。`,
        )
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

    let parsedExpertScores: Array<number | undefined> | undefined

    if (isExpertUser) {
      const parsedResults = batchExpertScoreInputs.map(input => parseExpertScoreInput(input))
      const nextErrors = parsedResults.map(result => result.error ?? '')
      const hasErrors = nextErrors.some(Boolean)

      setBatchExpertScoreErrors(nextErrors)

      if (hasErrors) {
        showError('请先修正专家评分输入后再提交。')
        return
      }

      parsedExpertScores = parsedResults.map(result => result.value)
      batchSubmittedExpertScoreCountRef.current = parsedExpertScores.filter(score => score !== undefined).length

      if (!batchSubmittedExpertScoreCountRef.current) {
        parsedExpertScores = undefined
      }
    } else {
      batchSubmittedExpertScoreCountRef.current = 0
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
        modelId: currentSubmittedModelId,
        expertScores: parsedExpertScores,
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
        sx={theme => ({
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 48%, ${theme.palette.secondary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
        })}
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
            <Typography  variant="h3">
              图片上传、评估、结果呈现和批量进度跟踪
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.84)', maxWidth: 720 }} variant="body1">
              支持单张图片即时评估, 也可以通过 SSE 流式反馈观察批量任务的推进过程。
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

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2.5}>
                  <Stack
                    direction={{ md: 'row', xs: 'column' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Stack spacing={0.75}>
                      <Typography variant="h5">评估模型</Typography>
                      <Typography color="text.secondary" variant="body2">
                        单张评估和批量评估共用同一模型选择. 不显式指定时, 会自动使用后端默认模型.
                      </Typography>
                    </Stack>
                    <Chip
                      color="primary"
                      label={`当前模型: ${selectedModelSummaryText}`}
                      sx={{ alignSelf: 'flex-start' }}
                      variant="outlined"
                    />
                  </Stack>

                  {modelCatalogError ? (
                    <Alert
                      action={(
                        <Button
                          color="inherit"
                          onClick={() => void loadAssessmentModelCatalog()}
                          size="small"
                        >
                          重试
                        </Button>
                      )}
                      severity="warning"
                    >
                      {modelCatalogError}
                    </Alert>
                  ) : null}

                  {isModelCatalogLoading ? (
                    <Alert severity="info">
                      正在加载可用模型列表. 目录加载完成前, 评估请求仍可按后端默认模型提交.
                    </Alert>
                  ) : null}

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { md: 'minmax(280px, 360px) minmax(0, 1fr)', xs: '1fr' },
                    }}
                  >
                    <TextField
                      disabled={isModelSelectorDisabled}
                      helperText={modelSelectorHelperText}
                      label="评估模型"
                      onChange={event => {
                        setSelectedModelId(event.target.value)
                      }}
                      select
                      value={selectedModelId}
                    >
                      <MenuItem value={DEFAULT_ASSESSMENT_MODEL_OPTION_VALUE}>
                        {getDefaultAssessmentModelOptionLabel(resolvedDefaultModelId, modelInfoMap)}
                      </MenuItem>
                      {availableModels.map(model => (
                        <MenuItem key={model.model_id} value={model.model_id}>
                          {model.display_name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Card
                      sx={theme => ({
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(15, 23, 32, 0.5)'
                            : 'rgba(248, 250, 252, 0.72)',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                      })}
                      variant="outlined"
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle1">模型说明</Typography>
                          <Typography color="text.secondary" variant="body2">
                            默认模型:
                            {' '}
                            {getAssessmentModelDisplayName(resolvedDefaultModelId, modelInfoMap, {
                              emptyFallback: '后端未返回默认模型信息',
                            })}
                          </Typography>
                          <Typography variant="body2">
                            {selectedModelInfo?.description || '未显式选择具体模型时, 系统将由后端默认模型完成评估.'}
                          </Typography>
                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {selectedModelCapabilityLabels.length ? (
                              selectedModelCapabilityLabels.map(capabilityLabel => (
                                <Chip key={capabilityLabel} label={capabilityLabel} size="small" />
                              ))
                            ) : (
                              <Chip label="能力信息暂不可用" size="small" variant="outlined" />
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

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
                      {isExpertUser ? (
                        <TextField
                          error={Boolean(singleExpertScoreError)}
                          helperText={singleExpertScoreError || '可选填写 0.00 到 5.00 之间的主观评分, 最多 2 位小数。'}
                          label="专家主观评分"
                          onChange={event => {
                            setSingleExpertScoreInput(event.target.value)
                            setSingleExpertScoreError('')
                          }}
                          placeholder="例如 4.50"
                          slotProps={{
                            htmlInput: {
                              inputMode: 'decimal',
                              max: 5,
                              min: 0,
                              step: '0.01',
                            },
                          }}
                          type="number"
                          value={singleExpertScoreInput}
                        />
                      ) : null}
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

                <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Typography variant="h5">图片预览</Typography>
                        <Box
                          sx={theme => ({
                            alignItems: 'center',
                            background:
                              `repeating-linear-gradient(135deg, ${alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.03)}, ${alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.03)} 12px, ${alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.2 : 0.06)} 12px, ${alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.2 : 0.06)} 24px)`,
                            border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.12)'}`,
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'center',
                            minHeight: 320,
                            overflow: 'hidden',
                            p: 2,
                          })}
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

                <div style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
                  {singleResult ? <ResultCard modelInfoMap={modelInfoMap} result={singleResult} /> : null}
                </div>
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
                        {isExpertUser && batchFiles.length ? (
                          <Stack spacing={1.5}>
                            <Typography variant="subtitle2">专家主观评分</Typography>
                            <Typography color="text.secondary" variant="body2">
                              可按文件顺序填写主观评分. 留空表示本次不填写该图片评分。
                            </Typography>
                            <Box
                              sx={{
                                display: 'grid',
                                gap: 1.25,
                                maxHeight: 260,
                                overflowY: 'visible',
                                pr: 0.5,
                              }}
                            >
                              {batchFiles.map((file, index) => (
                                <Box
                                  key={`${file.name}-${index}`}
                                  sx={{
                                    alignItems: 'flex-start',
                                    display: 'grid',
                                    gap: 1.25,
                                    gridTemplateColumns: 'minmax(0, 1fr) 160px',
                                  }}
                                >
                                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                                    <Typography noWrap title={file.name} variant="body2">
                                      {file.name}
                                    </Typography>
                                    <Typography color="text.secondary" variant="caption">
                                      第 {index + 1} 张图片
                                    </Typography>
                                  </Stack>
                                  <TextField
                                    error={Boolean(batchExpertScoreErrors[index])}
                                    helperText={batchExpertScoreErrors[index] || ' '}
                                    label="评分"
                                    onChange={event => {
                                      setBatchExpertScoreInputs(current =>
                                        current.map((value, currentIndex) => (
                                          currentIndex === index ? event.target.value : value
                                        )),
                                      )
                                      setBatchExpertScoreErrors(current =>
                                        current.map((value, currentIndex) => (
                                          currentIndex === index ? '' : value
                                        )),
                                      )
                                    }}
                                    placeholder="0.00 - 5.00"
                                    size="small"
                                    slotProps={{
                                      htmlInput: {
                                        inputMode: 'decimal',
                                        max: 5,
                                        min: 0,
                                        step: '0.01',
                                      },
                                    }}
                                    type="number"
                                    value={batchExpertScoreInputs[index] ?? ''}
                                  />
                                </Box>
                              ))}
                            </Box>
                          </Stack>
                        ) : null}
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
                                  backgroundColor: theme => (
                                    theme.palette.mode === 'dark'
                                      ? 'rgba(15, 23, 32, 0.72)'
                                      : 'rgba(255, 255, 255, 0.7)'
                                  ),
                                  border: theme => `1px solid ${theme.palette.divider}`,
                                  cursor: 'zoom-in',
                                  overflow: 'hidden',
                                  borderRadius: 1,
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
                            sx={theme => ({
                              alignItems: 'center',
                              border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.12)'}`,
                              borderRadius: 4,
                              display: 'flex',
                              justifyContent: 'center',
                              minHeight: 260,
                            })}
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
                      {batchResults.map((result, index) => (
                        <ResultCard
                          key={`${result.file_name ?? 'result'}-${result.model_id}-${index}`}
                          modelInfoMap={modelInfoMap}
                          result={result}
                        />
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
                borderRadius: 1,
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
