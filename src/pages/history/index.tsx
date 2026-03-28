import { useCallback, useEffect, useState } from 'react'

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { PageFeedback } from '@/components/common/page-feedback'
import { getAssessHistory } from '@/services/assess-service'
import type { AssessRecord } from '@/types/api'
import {
  formatDateTime,
  formatDistortionLabel,
  formatQualityScore,
  formatSceneLabel,
  normalizeImageSrc,
} from '@/utils/formatters'
import { getErrorMessage } from '@/utils/error'

export function Component() {
  const [records, setRecords] = useState<AssessRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewImageSrc, setPreviewImageSrc] = useState('')

  const loadHistoryRecords = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const historyResponse = await getAssessHistory({
        page,
        pageSize,
      })

      setRecords(historyResponse.records)
      setTotal(historyResponse.total)
    } catch (requestError) {
      setError(getErrorMessage(requestError, '获取评估历史失败, 请稍后重试'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void loadHistoryRecords()
  }, [loadHistoryRecords])

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
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">评估历史记录</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              当前页面仅提供服务端分页查询, 不包含关键词搜索和条件筛选.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadHistoryRecords()}
          >
            刷新列表
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 6,
          border: '1px solid rgba(20, 83, 45, 0.08)',
          overflow: 'hidden',
        }}
      >
        {loading ? <LinearProgress /> : null}

        {loading && !records.length ? (
          <Box sx={{ p: 3 }}>
            <PageFeedback
              type="loading"
              title="正在加载历史记录"
              description="系统正在请求当前页数据, 请稍候"
            />
          </Box>
        ) : error && !records.length ? (
          <Box sx={{ p: 3 }}>
            <PageFeedback
              type="error"
              title="历史记录加载失败"
              description={error}
              actionText="重新加载"
              onAction={() => void loadHistoryRecords()}
            />
          </Box>
        ) : !records.length ? (
          <Box sx={{ p: 3 }}>
            <PageFeedback
              type="empty"
              title="暂无历史记录"
              description="当前账号还没有生成评估历史, 完成图片评估后再回来查看"
            />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>缩略图</TableCell>
                    <TableCell>文件名</TableCell>
                    <TableCell>质量分数</TableCell>
                    <TableCell>场景</TableCell>
                    <TableCell>失真类型</TableCell>
                    <TableCell>评估时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell sx={{ width: 120 }}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box
                            component="img"
                            src={normalizeImageSrc(record.base64)}
                            alt={record.filename}
                            sx={{
                              width: 64,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: '1px solid rgba(20, 83, 45, 0.08)',
                            }}
                          />
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setPreviewTitle(record.filename)
                              setPreviewImageSrc(normalizeImageSrc(record.base64))
                            }}
                          >
                            <VisibilityRoundedIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>{record.filename}</TableCell>
                      <TableCell>{formatQualityScore(record.qualityScore)}</TableCell>
                      <TableCell>{formatSceneLabel(record.scene)}</TableCell>
                      <TableCell>{formatDistortionLabel(record.distortion)}</TableCell>
                      <TableCell>{formatDateTime(record.assessTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page - 1}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[5, 10, 20, 50]}
              onPageChange={(_, nextPage) => {
                setPage(nextPage + 1)
              }}
              onRowsPerPageChange={(event) => {
                setPage(1)
                setPageSize(Number(event.target.value))
              }}
            />
          </>
        )}
      </Paper>

      <Dialog
        open={Boolean(previewImageSrc)}
        onClose={() => {
          setPreviewTitle('')
          setPreviewImageSrc('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewTitle || '图片预览'}</DialogTitle>
        <DialogContent>
          {previewImageSrc ? (
            <Box
              component="img"
              src={previewImageSrc}
              alt={previewTitle}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
