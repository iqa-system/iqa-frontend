import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
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
import { getAssessmentHistory } from '@/services/assessment'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { AssessRecord } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import { getSceneLabel } from '@/utils/constants'
import { formatDateTime, getQualityScoreDisplay, normalizeBase64Image } from '@/utils/format'

function HistoryPage() {
  const showError = useSnackbarStore(state => state.showError)
  const [records, setRecords] = useState<AssessRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    let active = true

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
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
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
                      const qualityDisplay = getQualityScoreDisplay(record.qualityScore)

                      return (
                        <TableRow hover key={record.id}>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>
                            <Box
                              alt={record.filename}
                              component="img"
                              onClick={() => setPreviewImage(normalizeBase64Image(record.base64))}
                              src={normalizeBase64Image(record.base64)}
                              sx={{
                                borderRadius: 2,
                                cursor: 'pointer',
                                height: 60,
                                objectFit: 'cover',
                                width: 60,
                              }}
                            />
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
                  rowsPerPageOptions={[5, 10, 20, 50]}
                />
              </TableContainer>
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
                borderRadius: 2,
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
