import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import type { EChartsOption } from 'echarts'

import EChart from '@/components/EChart'
import LoadingScreen from '@/components/LoadingScreen'
import { getAdminStatistics } from '@/services/admin'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { AdminStatisticsResponse } from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'

type RangeMode = '7d' | '30d' | 'all' | 'custom'

interface MetricCardProps {
  description: string
  icon: ReactNode
  label: string
  value: string
}

const CHART_COLORS = ['#0f5fb8', '#08a7a1', '#f59f00', '#6f8df6', '#ef6c73', '#4f7cff']

function toBackendDateTime(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function normalizeDateTimeInput(value: string) {
  if (!value) {
    return undefined
  }

  return value.length === 16 ? `${value}:00` : value
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--'
  }

  return value.toFixed(digits).replace(/\.?0+$/, '')
}

function formatRatio(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--'
  }

  return `${(value * 100).toFixed(1)}%`
}

function getRangeQuery(mode: RangeMode, customStartTime: string, customEndTime: string) {
  if (mode === 'all') {
    return {}
  }

  if (mode === 'custom') {
    return {
      endTime: normalizeDateTimeInput(customEndTime),
      startTime: normalizeDateTimeInput(customStartTime),
    }
  }

  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (mode === '7d' ? 7 : 30))
  start.setHours(0, 0, 0, 0)

  return {
    endTime: toBackendDateTime(now),
    startTime: toBackendDateTime(start),
  }
}

function MetricCard({ description, icon, label, value }: MetricCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2}>
          <Box
            sx={theme => ({
              alignItems: 'center',
              bgcolor: theme.palette.primary.main,
              borderRadius: 3,
              color: 'white',
              display: 'flex',
              flexShrink: 0,
              height: 48,
              justifyContent: 'center',
              width: 48,
            })}
          >
            {icon}
          </Box>
          <Stack spacing={0.5}>
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            <Typography color="text.secondary" variant="caption">
              {description}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function StatisticsPage() {
  const showError = useSnackbarStore(state => state.showError)
  const [rangeMode, setRangeMode] = useState<RangeMode>('30d')
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [statistics, setStatistics] = useState<AdminStatisticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const query = getRangeQuery(rangeMode, customStartTime, customEndTime)

    setIsLoading(true)
    void getAdminStatistics(query)
      .then(data => {
        if (active) {
          setStatistics(data)
        }
      })
      .catch(error => {
        if (active) {
          showError(extractErrorMessage(error, '统计信息加载失败。'))
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
  }, [customEndTime, customStartTime, rangeMode, reloadKey, showError])

  const dailyAssessmentsOption = useMemo<EChartsOption>(() => ({
    color: CHART_COLORS,
    grid: { bottom: 36, left: 48, right: 24, top: 32 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      data: statistics?.dailyAssessments.map(item => item.date) ?? [],
      type: 'category',
    },
    yAxis: { minInterval: 1, type: 'value' },
    series: [
      {
        areaStyle: { opacity: 0.12 },
        data: statistics?.dailyAssessments.map(item => item.count) ?? [],
        name: '评估次数',
        smooth: true,
        type: 'line',
      },
    ],
  }), [statistics])

  const modelUsageOption = useMemo<EChartsOption>(() => ({
    color: CHART_COLORS,
    grid: { bottom: 54, left: 48, right: 24, top: 32 },
    tooltip: {
      formatter: params => {
        const item = Array.isArray(params) ? params[0] : params
        const dataIndex = Number(item.dataIndex)
        const usage = statistics?.modelUsage[dataIndex]
        return usage ? `${usage.modelName}<br/>次数: ${usage.count}<br/>占比: ${formatRatio(usage.ratio)}` : ''
      },
    },
    xAxis: {
      axisLabel: { interval: 0, rotate: 24 },
      data: statistics?.modelUsage.map(item => item.modelName) ?? [],
      type: 'category',
    },
    yAxis: { minInterval: 1, type: 'value' },
    series: [
      {
        barMaxWidth: 42,
        data: statistics?.modelUsage.map(item => item.count) ?? [],
        name: '使用次数',
        type: 'bar',
      },
    ],
  }), [statistics])

  const qualityBucketsOption = useMemo<EChartsOption>(() => ({
    color: CHART_COLORS,
    legend: { bottom: 0 },
    tooltip: {
      formatter: params => {
        const item = Array.isArray(params) ? params[0] : params
        const data = item.data as { name: string; value: number; ratio?: number }
        return `${data.name}<br/>数量: ${data.value}<br/>占比: ${formatRatio(data.ratio)}`
      },
    },
    series: [
      {
        data: statistics?.qualityBuckets.map(item => ({
          name: item.bucket,
          ratio: item.ratio,
          value: item.count,
        })) ?? [],
        radius: ['42%', '68%'],
        type: 'pie',
      },
    ],
  }), [statistics])

  const activeUsersOption = useMemo<EChartsOption>(() => ({
    color: CHART_COLORS,
    grid: { bottom: 54, left: 48, right: 24, top: 32 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { interval: 0, rotate: 24 },
      data: statistics?.activeUsers.map(item => item.username) ?? [],
      type: 'category',
    },
    yAxis: { minInterval: 1, type: 'value' },
    series: [
      {
        barMaxWidth: 42,
        data: statistics?.activeUsers.map(item => item.count) ?? [],
        name: '评估次数',
        type: 'bar',
      },
    ],
  }), [statistics])

  const deviationOption = useMemo<EChartsOption>(() => ({
    color: CHART_COLORS,
    grid: { bottom: 42, left: 48, right: 24, top: 32 },
    tooltip: {
      formatter: params => {
        const item = Array.isArray(params) ? params[0] : params
        const bucket = statistics?.expertComparison.deviationBuckets[Number(item.dataIndex)]
        return bucket ? `${bucket.bucket}<br/>数量: ${bucket.count}<br/>占比: ${formatRatio(bucket.ratio)}` : ''
      },
    },
    xAxis: {
      data: statistics?.expertComparison.deviationBuckets.map(item => item.bucket) ?? [],
      type: 'category',
    },
    yAxis: { minInterval: 1, type: 'value' },
    series: [
      {
        barMaxWidth: 42,
        data: statistics?.expertComparison.deviationBuckets.map(item => item.count) ?? [],
        name: '样本数',
        type: 'bar',
      },
    ],
  }), [statistics])

  if (isLoading && !statistics) {
    return <LoadingScreen description="正在汇总全站评估记录。" title="加载统计信息" />
  }

  const expertComparison = statistics?.expertComparison

  return (
    <Stack spacing={3}>
      <Stack direction={{ md: 'row', xs: 'column' }} justifyContent="space-between" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4">统计信息</Typography>
          <Typography color="text.secondary">
            汇总评估次数、模型使用、质量分布和专家评分差异, 用于观察系统整体使用情况。
          </Typography>
        </Stack>
        <Stack alignItems={{ md: 'center', xs: 'stretch' }} direction={{ md: 'row', xs: 'column' }} spacing={1.5}>
          <TextField
            label="统计范围"
            onChange={event => setRangeMode(event.target.value as RangeMode)}
            select
            size="small"
            sx={{ minWidth: 160 }}
            value={rangeMode}
          >
            <MenuItem value="7d">最近7天</MenuItem>
            <MenuItem value="30d">最近30天</MenuItem>
            <MenuItem value="all">全部时间</MenuItem>
            <MenuItem value="custom">自定义范围</MenuItem>
          </TextField>
          {rangeMode === 'custom' ? (
            <>
              <TextField
                InputLabelProps={{ shrink: true }}
                label="开始时间"
                onChange={event => setCustomStartTime(event.target.value)}
                size="small"
                type="datetime-local"
                value={customStartTime}
              />
              <TextField
                InputLabelProps={{ shrink: true }}
                label="结束时间"
                onChange={event => setCustomEndTime(event.target.value)}
                size="small"
                type="datetime-local"
                value={customEndTime}
              />
            </>
          ) : null}
          <Button onClick={() => setReloadKey(value => value + 1)} variant="contained">
            刷新
          </Button>
        </Stack>
      </Stack>

      {statistics?.warnings?.length ? (
        <Alert severity="warning">
          <Stack spacing={0.5}>
            {statistics.warnings.map(warning => (
              <Typography key={warning} variant="body2">{warning}</Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            lg: 'repeat(5, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            xs: '1fr',
          },
        }}
      >
        <MetricCard
          description="当前筛选范围内的历史记录数"
          icon={<TimelineRoundedIcon />}
          label="总评估次数"
          value={String(statistics?.summary.totalAssessments ?? 0)}
        />
        <MetricCard
          description="产生过评估记录的用户数"
          icon={<PeopleAltRoundedIcon />}
          label="参与用户数"
          value={String(statistics?.summary.activeUserCount ?? 0)}
        />
        <MetricCard
          description="带专家主观分的历史样本"
          icon={<InsightsRoundedIcon />}
          label="专家样本数"
          value={String(statistics?.summary.expertSampleCount ?? 0)}
        />
        <MetricCard
          description="历史记录中出现过的模型"
          icon={<PieChartRoundedIcon />}
          label="模型数量"
          value={String(statistics?.summary.modelCount ?? 0)}
        />
        <MetricCard
          description="模型归一化分与专家分差异"
          icon={<BarChartRoundedIcon />}
          label="平均绝对误差"
          value={formatNumber(expertComparison?.meanAbsoluteError)}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { lg: '1fr 1fr', xs: '1fr' },
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6">评估趋势</Typography>
            <EChart option={dailyAssessmentsOption} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">模型使用次数</Typography>
            <EChart option={modelUsageOption} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">质量区间占比</Typography>
            <EChart option={qualityBucketsOption} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">活跃用户 Top 10</Typography>
            <EChart option={activeUsersOption} />
          </CardContent>
        </Card>
        <Card sx={{ gridColumn: { lg: '1 / span 2', xs: 'auto' } }}>
          <CardContent>
            <Stack direction={{ md: 'row', xs: 'column' }} justifyContent="space-between" spacing={1}>
              <Stack spacing={0.5}>
                <Typography variant="h6">专家评分差异分布</Typography>
                <Typography color="text.secondary" variant="body2">
                  差值 = 模型归一化分 - 专家主观分。正数表示模型评分更高。
                </Typography>
              </Stack>
              <Chip
                color={expertComparison?.sampleCount ? 'primary' : 'default'}
                label={`有效样本: ${expertComparison?.sampleCount ?? 0}`}
                variant="outlined"
              />
            </Stack>
            {expertComparison?.sampleCount ? (
              <EChart height={300} option={deviationOption} />
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>暂无专家评分数据, 暂不能进行差异分析。</Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography gutterBottom variant="h6">分模型专家一致性</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>模型</TableCell>
                  <TableCell align="right">样本数</TableCell>
                  <TableCell align="right">平均绝对误差</TableCell>
                  <TableCell align="right">平均偏差</TableCell>
                  <TableCell align="right">均方根误差</TableCell>
                  <TableCell align="right">相关系数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expertComparison?.modelConsistency.length ? expertComparison.modelConsistency.map(item => (
                  <TableRow key={item.modelId}>
                    <TableCell>{item.modelName || item.modelId}</TableCell>
                    <TableCell align="right">{item.sampleCount}</TableCell>
                    <TableCell align="right">{formatNumber(item.meanAbsoluteError)}</TableCell>
                    <TableCell align="right">{formatNumber(item.meanSignedError)}</TableCell>
                    <TableCell align="right">{formatNumber(item.rootMeanSquareError)}</TableCell>
                    <TableCell align="right">{formatNumber(item.pearsonCorrelation, 4)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell align="center" colSpan={6}>
                      暂无可用于分模型分析的专家评分样本
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default StatisticsPage
