import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import {
  Alert,
  Box,
  Button, ButtonGroup,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useSearchParams } from 'react-router'

import DistortionList from '@/components/DistortionList'
import LoadingScreen from '@/components/LoadingScreen'
import {
  deleteAdminAssessmentHistory,
  deleteAdminUsers,
  getAdminAssessmentHistory,
  getAdminUsers,
  updateAdminUserRole,
} from '@/services/admin'
import { getAssessmentModels, resolveHistoryImageUrl } from '@/services/assessment'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type {
  AdminAssessHistoryQuery,
  AdminAssessRecord,
  AdminUsersQuery,
  ModelInfo,
  PageAdminAssessRecord,
  PageUserInfo,
  UserInfo,
  UserRole,
} from '@/types/api'
import { extractErrorMessage } from '@/utils/api-request'
import {
  getAssessmentModelDisplayName,
  editableUserRoles,
  getUserRoleChipColor,
  getSceneLabel,
  getUserRoleLabel,
} from '@/utils/constants'
import {
  exportAdminHistoryRecords,
  type AdminHistoryExportFormat,
} from '@/utils/admin-history-export'
import { formatDateTime, formatExpertScore, getQualityScoreDisplay } from '@/utils/format'

type AdminTab = 'users' | 'history'

interface AdminUsersFilterForm {
  username: string
  email: string
  role: '' | UserRole
}

interface AdminHistoryFilterForm {
  userId: string
  filename: string
  startTime: string
  endTime: string
}

const DEFAULT_USERS_FILTERS: AdminUsersFilterForm = {
  username: '',
  email: '',
  role: '',
}

const DEFAULT_HISTORY_FILTERS: AdminHistoryFilterForm = {
  userId: '',
  filename: '',
  startTime: '',
  endTime: '',
}

function normalizeAdminTab(value: string | null): AdminTab {
  return value === 'history' ? 'history' : 'users'
}

function toIsoDateTime(value: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

function buildAdminHistoryQuery(
  filters: AdminHistoryFilterForm,
  page: number,
  pageSize: number,
): AdminAssessHistoryQuery {
  return {
    page,
    pageSize,
    endTime: toIsoDateTime(filters.endTime),
    filename: filters.filename.trim() || undefined,
    startTime: toIsoDateTime(filters.startTime),
    userId: filters.userId.trim() ? Number(filters.userId.trim()) : undefined,
  }
}

function AdminUsersPanel({ currentUserId }: { currentUserId: number | undefined }) {
  const showError = useSnackbarStore(state => state.showError)
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [filters, setFilters] = useState<AdminUsersFilterForm>(DEFAULT_USERS_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AdminUsersFilterForm>(DEFAULT_USERS_FILTERS)
  const [records, setRecords] = useState<UserInfo[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [roleDialogUser, setRoleDialogUser] = useState<UserInfo | null>(null)
  const [nextRole, setNextRole] = useState<UserRole>('USER')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [usersReloadKey, setUsersReloadKey] = useState(0)

  /**
   * 用户管理页的列表数据完全由分页参数和已提交筛选条件驱动.
   * 当这些条件变化时, 统一清空当前页勾选状态, 避免跨查询残留误操作.
   */
  useEffect(() => {
    let active = true
    const query: AdminUsersQuery = {
      page,
      pageSize,
      email: appliedFilters.email.trim() || undefined,
      role: appliedFilters.role || undefined,
      username: appliedFilters.username.trim() || undefined,
    }

    setIsLoading(true)
    setSelectedUserIds([])
    setIsDeleteDialogOpen(false)

    void getAdminUsers(query)
      .then((data: PageUserInfo) => {
        if (!active) {
          return
        }

        setRecords(data.records)
        setTotal(data.total)
      })
      .catch(error => {
        if (active) {
          showError(extractErrorMessage(error, '管理员用户列表加载失败.'))
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
  }, [appliedFilters, page, pageSize, showError, usersReloadKey])

  const selectedUserIdSet = new Set(selectedUserIds)
  const selectableUsers = records.filter(user => user.id !== currentUserId)
  const selectedUsers = selectableUsers.filter(user => selectedUserIdSet.has(user.id))
  const selectedCount = selectedUsers.length
  const allUsersSelected = selectableUsers.length > 0 && selectedCount === selectableUsers.length
  const hasPartialSelection = selectedCount > 0 && selectedCount < selectableUsers.length

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_USERS_FILTERS)
    setPage(1)
    setAppliedFilters({ ...DEFAULT_USERS_FILTERS })
  }

  const handleSelectAllUsers = (checked: boolean) => {
    setSelectedUserIds(checked ? selectableUsers.map(user => user.id) : [])
  }

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(currentIds =>
      currentIds.includes(userId)
        ? currentIds.filter(currentId => currentId !== userId)
        : [...currentIds, userId],
    )
  }

  /**
   * 修改角色前把目标用户和目标角色一起缓存进弹窗状态.
   * 这样弹窗内展示和提交都只依赖一份稳定快照, 不受列表刷新影响.
   */
  const handleOpenRoleDialog = (user: UserInfo) => {
    setRoleDialogUser(user)
    setNextRole(user.role)
  }

  const handleCloseRoleDialog = () => {
    if (!isUpdatingRole) {
      setRoleDialogUser(null)
    }
  }

  const handleUpdateRole = async () => {
    if (!roleDialogUser) {
      return
    }

    if (roleDialogUser.role === nextRole) {
      showInfo('未检测到角色变化.')
      setRoleDialogUser(null)
      return
    }

    setIsUpdatingRole(true)

    try {
      const message = await updateAdminUserRole(roleDialogUser.id, nextRole)
      setRoleDialogUser(null)
      showSuccess(message || '用户角色更新成功.')
      setUsersReloadKey(current => current + 1)
    } catch (error) {
      showError(extractErrorMessage(error, '用户角色更新失败.'))
    } finally {
      setIsUpdatingRole(false)
    }
  }

  /**
   * 批量删除后重新按后端返回的实际删除数量推算有效页码.
   * 这样删除最后一页全部数据时, 前端可以平滑回退到上一页.
   */
  const handleDeleteSelectedUsers = async () => {
    if (!selectedUsers.length) {
      return
    }

    setIsDeleting(true)

    try {
      const deletedCount = await deleteAdminUsers(selectedUsers.map(user => user.id))
      const nextTotal = Math.max(total - deletedCount, 0)
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)))

      setSelectedUserIds([])
      setIsDeleteDialogOpen(false)
      setIsLoading(true)
      showSuccess(`已删除 ${deletedCount} 个用户.`)

      if (nextPage !== page) {
        setPage(nextPage)
        return
      }

      setUsersReloadKey(current => current + 1)
    } catch (error) {
      showError(extractErrorMessage(error, '用户删除失败.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ md: 'row', xs: 'column' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack spacing={1}>
              <Typography variant="h5">用户管理</Typography>
              <Typography color="text.secondary" variant="body2">
                支持按用户名, 邮箱和角色筛选用户, 并进行角色修改和批量删除.
              </Typography>
            </Stack>
            <Alert severity="warning" sx={{ alignSelf: 'flex-start' }}>
              当前登录管理员本人不可被删除, 也不可修改自己的角色.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="h6">筛选条件</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { lg: 'repeat(4, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
              }}
            >
              <TextField
                label="用户名"
                onChange={event => {
                  setFilters(current => ({ ...current, username: event.target.value }))
                }}
                value={filters.username}
              />
              <TextField
                label="邮箱"
                onChange={event => {
                  setFilters(current => ({ ...current, email: event.target.value }))
                }}
                value={filters.email}
              />
              <TextField
                label="角色"
                onChange={event => {
                  setFilters(current => ({ ...current, role: event.target.value as '' | UserRole }))
                }}
                select
                value={filters.role}
              >
                <MenuItem value="">全部角色</MenuItem>
                {editableUserRoles.map(role => (
                  <MenuItem key={role} value={role}>
                    {getUserRoleLabel(role)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button onClick={handleApplyFilters} variant="contained">
                查询用户
              </Button>
              <Button onClick={handleResetFilters} variant="outlined">
                重置筛选
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <LoadingScreen
              description="正在加载管理员用户列表."
              fullscreen={false}
              title="加载用户管理"
            />
          ) : records.length ? (
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
                      已选 {selectedCount} 个用户 / 当前页可操作 {selectableUsers.length} 个用户.
                    </Typography>
                  </Stack>
                  <Button
                    color="error"
                    disabled={!selectedCount || isDeleting}
                    onClick={() => setIsDeleteDialogOpen(true)}
                    variant="outlined"
                  >
                    {isDeleting ? '删除中...' : '删除所选用户'}
                  </Button>
                </Stack>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={allUsersSelected}
                          disabled={isDeleting || selectableUsers.length === 0}
                          indeterminate={hasPartialSelection}
                          onChange={event => handleSelectAllUsers(event.target.checked)}
                          slotProps={{ input: { 'aria-label': '全选当前页用户' } }}
                        />
                      </TableCell>
                      <TableCell>用户ID</TableCell>
                      <TableCell>用户名</TableCell>
                      <TableCell>邮箱</TableCell>
                      <TableCell>角色</TableCell>
                      <TableCell>注册时间</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map(user => {
                      const isCurrentUser = user.id === currentUserId
                      const isSelected = selectedUserIdSet.has(user.id)

                      return (
                        <TableRow hover key={user.id} selected={isSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              disabled={isDeleting || isCurrentUser}
                              onChange={() => handleToggleUser(user.id)}
                              slotProps={{ input: { 'aria-label': `选择用户 ${user.username}` } }}
                            />
                          </TableCell>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              color={getUserRoleChipColor(user.role)}
                              label={getUserRoleLabel(user.role)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{formatDateTime(user.registerTime)}</TableCell>
                          <TableCell align="right">
                            <Button
                              disabled={isCurrentUser || isUpdatingRole}
                              onClick={() => handleOpenRoleDialog(user)}
                              size="small"
                              variant="outlined"
                            >
                              修改角色
                            </Button>
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
              <Alert severity="info">当前筛选条件下暂无用户记录.</Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog maxWidth="xs" onClose={handleCloseRoleDialog} open={Boolean(roleDialogUser)}>
        <DialogTitle>修改用户角色</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="body2">
              目标用户: {roleDialogUser?.username ?? '--'}
            </Typography>
            <TextField
              label="当前角色"
              slotProps={{ input: { readOnly: true } }}
              value={roleDialogUser ? getUserRoleLabel(roleDialogUser.role) : ''}
            />
            <TextField
              label="目标角色"
              onChange={event => setNextRole(event.target.value as UserRole)}
              select
              value={nextRole}
            >
              {editableUserRoles.map(role => (
                <MenuItem key={role} value={role}>
                  {getUserRoleLabel(role)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={isUpdatingRole} onClick={handleCloseRoleDialog} variant="text">
            取消
          </Button>
          <Button disabled={isUpdatingRole} onClick={() => void handleUpdateRole()} variant="contained">
            {isUpdatingRole ? '保存中...' : '保存角色'}
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
        <DialogTitle>确认删除用户</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              将删除当前选中的 {selectedCount} 个用户, 并同步清理关联评估历史与图片资源.
            </Typography>
            <Alert severity="warning">删除后不可恢复, 请确认后再继续.</Alert>
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
            onClick={() => void handleDeleteSelectedUsers()}
            variant="contained"
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

function AdminHistoryPanel() {
  const showError = useSnackbarStore(state => state.showError)
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [filters, setFilters] = useState<AdminHistoryFilterForm>(DEFAULT_HISTORY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AdminHistoryFilterForm>(DEFAULT_HISTORY_FILTERS)
  const [records, setRecords] = useState<AdminAssessRecord[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([])
  const [failedImageRecordIds, setFailedImageRecordIds] = useState<number[]>([])
  const [previewImage, setPreviewImage] = useState('')
  const [modelInfoMap, setModelInfoMap] = useState<Record<string, ModelInfo>>({})
  const [exportingFormat, setExportingFormat] = useState<AdminHistoryExportFormat | null>(null)
  const [exportingAllFormat, setExportingAllFormat] = useState<AdminHistoryExportFormat | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [historyReloadKey, setHistoryReloadKey] = useState(0)

  /**
   * 全站历史页与普通历史页保持同样的数据刷新策略.
   * 任何分页, 筛选和删除触发的刷新, 都会先清空当前页选择和预览态.
   */
  useEffect(() => {
    let active = true
    const query = buildAdminHistoryQuery(appliedFilters, page, pageSize)

    setIsLoading(true)
    setSelectedRecordIds([])
    setPreviewImage('')
    setIsDeleteDialogOpen(false)

    void getAdminAssessmentHistory(query)
      .then((data: PageAdminAssessRecord) => {
        if (!active) {
          return
        }

        setRecords(data.records)
        setTotal(data.total)
      })
      .catch(error => {
        if (active) {
          showError(extractErrorMessage(error, '管理员全站历史加载失败.'))
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
  }, [appliedFilters, historyReloadKey, page, pageSize, showError])

  /**
   * 全站历史切页或刷新后, 旧页面的图片失败态不应继续污染新数据.
   * 这里在 records 变化时统一重置失败状态, 让每一页都按自己的图片结果重新判断.
   */
  useEffect(() => {
    setFailedImageRecordIds([])
  }, [records])

  /**
   * 管理员全站历史也需要按模型目录解释原始质量分数.
   * 目录加载失败时页面会回退成“只展示原始分数”, 因此这里不额外打断历史列表浏览.
   */
  useEffect(() => {
    let active = true

    void getAssessmentModels()
      .then(data => {
        if (!active) {
          return
        }

        const nextModelInfoMap = (data.models ?? []).reduce<Record<string, ModelInfo>>((currentMap, model) => {
          currentMap[model.model_id] = model
          return currentMap
        }, {})

        setModelInfoMap(nextModelInfoMap)
      })
      .catch(() => {
        if (active) {
          setModelInfoMap({})
        }
      })

    return () => {
      active = false
    }
  }, [])

  /**
   * 管理员全站历史与普通历史页共享同一套图片直连策略.
   * 这里仅把后端返回的 imageURL 解析成最终展示地址, 不再主动请求 Blob 或维护 object URL.
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
  const isBatchActionBusy = exportingFormat !== null || exportingAllFormat !== null || isDeleting

  const handleApplyFilters = () => {
    const trimmedUserId = filters.userId.trim()

    if (trimmedUserId) {
      const parsedUserId = Number(trimmedUserId)

      if (!Number.isInteger(parsedUserId) || parsedUserId < 1) {
        showError('用户ID必须是大于 0 的整数.')
        return
      }
    }

    if (filters.startTime && filters.endTime && filters.startTime > filters.endTime) {
      showError('开始时间不能晚于结束时间.')
      return
    }

    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_HISTORY_FILTERS)
    setPage(1)
    setAppliedFilters({ ...DEFAULT_HISTORY_FILTERS })
  }

  const handleOpenPreview = (recordId: number) => {
    const imageUrl = recordImageUrls[recordId]

    if (!imageUrl || failedImageRecordIdSet.has(recordId)) {
      return
    }

    setPreviewImage(imageUrl)
  }

  /**
   * 浏览器会自行请求直连图片资源.
   * 当缩略图或预览图加载失败时, 只记录失败状态并在需要时关闭预览, 避免继续渲染失效图片.
   */
  const handleImageLoadError = (recordId: number, imageUrl: string) => {
    setFailedImageRecordIds(currentIds => (
      currentIds.includes(recordId) ? currentIds : [...currentIds, recordId]
    ))
    setPreviewImage(currentImage => (currentImage === imageUrl ? '' : currentImage))
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

  const handleExport = async (format: AdminHistoryExportFormat) => {
    if (!selectedRecords.length) {
      return
    }

    setExportingFormat(format)

    try {
      await exportAdminHistoryRecords(selectedRecords, format, modelInfoMap)
      showSuccess(`已导出 ${selectedRecords.length} 条全站历史记录（${format.toUpperCase()}）.`)
    } catch (error) {
      showError(extractErrorMessage(error, '全站历史导出失败.'))
    } finally {
      setExportingFormat(null)
    }
  }

  const handleExportAll = async (format: AdminHistoryExportFormat) => {
    if (!total) {
      showInfo('当前查询结果为空, 无需导出.')
      return
    }

    setExportingAllFormat(format)

    try {
      const data = await getAdminAssessmentHistory(buildAdminHistoryQuery(appliedFilters, 1, total))

      if (!data.records.length) {
        showInfo('当前查询结果为空, 无需导出.')
        return
      }

      await exportAdminHistoryRecords(data.records, format, modelInfoMap)
      showSuccess(`已导出 ${data.records.length} 条当前查询结果（${format.toUpperCase()}）.`)
    } catch (error) {
      showError(extractErrorMessage(error, '当前查询结果导出失败.'))
    } finally {
      setExportingAllFormat(null)
    }
  }

  const handleDeleteSelectedRecords = async () => {
    if (!selectedRecordIds.length) {
      return
    }

    setIsDeleting(true)

    try {
      const deletedCount = await deleteAdminAssessmentHistory(selectedRecordIds)
      const nextTotal = Math.max(total - deletedCount, 0)
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)))

      setSelectedRecordIds([])
      setPreviewImage('')
      setIsDeleteDialogOpen(false)
      setIsLoading(true)
      showSuccess(`已删除 ${deletedCount} 条全站历史记录.`)

      if (nextPage !== page) {
        setPage(nextPage)
        return
      }

      setHistoryReloadKey(current => current + 1)
    } catch (error) {
      showError(extractErrorMessage(error, '全站历史删除失败.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5">全站历史</Typography>
            <Typography color="text.secondary" variant="body2">
              支持按用户, 文件名和时间范围筛选全站评估历史, 并进行导出, 预览和批量删除.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="h6">筛选条件</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { lg: 'repeat(4, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' },
              }}
            >
              <TextField
                label="用户ID"
                onChange={event => {
                  setFilters(current => ({ ...current, userId: event.target.value }))
                }}
                type="number"
                value={filters.userId}
              />
              <TextField
                label="文件名"
                onChange={event => {
                  setFilters(current => ({ ...current, filename: event.target.value }))
                }}
                value={filters.filename}
              />
              <TextField
                label="开始时间"
                onChange={event => {
                  setFilters(current => ({ ...current, startTime: event.target.value }))
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                type="datetime-local"
                value={filters.startTime}
              />
              <TextField
                label="结束时间"
                onChange={event => {
                  setFilters(current => ({ ...current, endTime: event.target.value }))
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                type="datetime-local"
                value={filters.endTime}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button onClick={handleApplyFilters} variant="contained">
                查询历史
              </Button>
              <Button onClick={handleResetFilters} variant="outlined">
                重置筛选
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <LoadingScreen
              description="正在加载管理员全站历史数据."
              fullscreen={false}
              title="加载全站历史"
            />
          ) : records.length ? (
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
                      已选 {selectedCount} 条 / 当前页 {records.length} 条 / 当前查询共 {total} 条. 所选操作仅处理当前页勾选记录.
                    </Typography>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <ButtonGroup>
                      <Button
                        disabled={!selectedCount || isBatchActionBusy}
                        onClick={() => void handleExport('csv')}
                        variant="outlined"
                      >
                        {exportingFormat === 'csv' ? '导出所选中...' : '导出所选 CSV'}
                      </Button>
                      <Button
                        disabled={!selectedCount || isBatchActionBusy}
                        onClick={() => void handleExport('xlsx')}
                        variant="contained"
                      >
                        {exportingFormat === 'xlsx' ? '导出所选中...' : '导出所选 XLSX'}
                      </Button>
                      <Button
                        disabled={!total || isBatchActionBusy}
                        onClick={() => void handleExportAll('csv')}
                        variant="outlined"
                      >
                        {exportingAllFormat === 'csv' ? '导出全部中...' : '导出全部 CSV'}
                      </Button>
                      <Button
                        disabled={!total || isBatchActionBusy}
                        onClick={() => void handleExportAll('xlsx')}
                        variant="contained"
                      >
                        {exportingAllFormat === 'xlsx' ? '导出全部中...' : '导出全部 XLSX'}
                      </Button>
                    </ButtonGroup>

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
                <Table sx={{ minWidth: 1640 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={allRecordsSelected}
                          disabled={isDeleting}
                          indeterminate={hasPartialSelection}
                          onChange={event => handleSelectAllRecords(event.target.checked)}
                          slotProps={{ input: { 'aria-label': '全选当前页全站历史记录' } }}
                        />
                      </TableCell>
                      <TableCell>记录ID</TableCell>
                      <TableCell>用户ID</TableCell>
                      <TableCell>用户名</TableCell>
                      <TableCell>缩略图</TableCell>
                      <TableCell>文件名</TableCell>
                      <TableCell>评估时间</TableCell>
                      <TableCell>评估模型</TableCell>
                      <TableCell>质量分数</TableCell>
                      <TableCell>专家评分</TableCell>
                      <TableCell>评分时间</TableCell>
                      <TableCell>场景分类</TableCell>
                      <TableCell>失真类型</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map(record => {
                      const imageUrl = recordImageUrls[record.id] || ''
                      const isSelected = selectedRecordIdSet.has(record.id)
                      const isImageFailed = failedImageRecordIdSet.has(record.id)
                      const hasImage = Boolean(imageUrl) && !isImageFailed
                      const qualityDisplay = getQualityScoreDisplay(
                        record.qualityScore,
                        record.modelId ? modelInfoMap[record.modelId]?.score_range : null,
                      )
                      const sceneDisplayText = record.scene === null || record.scene === undefined
                        ? '该模型未提供场景分类'
                        : getSceneLabel(record.scene)
                      const modelDisplayName = getAssessmentModelDisplayName(record.modelId, modelInfoMap)
                      const hasDistortionCapability = Array.isArray(record.distortions)

                      return (
                        <TableRow hover key={record.id} selected={isSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              disabled={isDeleting}
                              onChange={() => handleToggleRecord(record.id)}
                              slotProps={{ input: { 'aria-label': `选择历史记录 ${record.id}` } }}
                            />
                          </TableCell>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>{record.userId}</TableCell>
                          <TableCell>{record.username}</TableCell>
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
                          <TableCell>{modelDisplayName}</TableCell>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">
                                原始分数: {qualityDisplay.rawText}
                              </Typography>
                              <Typography color="text.secondary" variant="caption">
                                评分范围: {qualityDisplay.rangeText}
                              </Typography>
                              <Typography color="text.secondary" variant="caption">
                                {qualityDisplay.hasNormalizedScore
                                  ? `归一化分数: ${qualityDisplay.normalizedText} / 5, 等级: ${qualityDisplay.levelLabel}`
                                  : '范围未知, 暂不支持跨模型比较'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{formatExpertScore(record.expertScore)}</TableCell>
                          <TableCell>{formatDateTime(record.expertScoreTime)}</TableCell>
                          <TableCell>{sceneDisplayText}</TableCell>
                          <TableCell sx={{ maxWidth: 280, minWidth: 220 }}>
                            {hasDistortionCapability ? (
                              <DistortionList distortions={record.distortions} variant="chips" />
                            ) : (
                              <Typography color="text.secondary" variant="body2">
                                该模型未提供失真类型识别
                              </Typography>
                            )}
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
              <Alert severity="info">当前筛选条件下暂无全站历史记录.</Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog maxWidth="md" onClose={() => setPreviewImage('')} open={Boolean(previewImage)}>
        <DialogTitle>图片预览</DialogTitle>
        <DialogContent>
          {previewImage ? (
            <Box
              alt="管理员历史预览图"
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

      <Dialog
        maxWidth="xs"
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false)
          }
        }}
        open={isDeleteDialogOpen}
      >
        <DialogTitle>确认删除全站历史</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              将删除当前选中的 {selectedCount} 条全站评估历史记录, 并同步清理关联图片资源.
            </Typography>
            <Alert severity="warning">删除后不可恢复, 请确认后再继续.</Alert>
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
    </Stack>
  )
}

function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUserId = useAuthStore(state => state.user?.id)
  const activeTab = useMemo(
    () => normalizeAdminTab(searchParams.get('tab')),
    [searchParams],
  )

  /**
   * 通过 URL 查询参数记录当前标签页, 这样刷新页面或复制链接后仍能回到相同的管理视图.
   */
  const handleTabChange = (_event: SyntheticEvent, value: AdminTab) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (value === 'users') {
      nextSearchParams.delete('tab')
    } else {
      nextSearchParams.set('tab', value)
    }

    setSearchParams(nextSearchParams, { replace: true })
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4">管理员后台</Typography>
            <Typography color="text.secondary" variant="body2">
              在同一入口中管理系统用户和全站评估历史, 当前版本支持查询, 筛选, 角色调整, 导出和批量删除.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Tabs onChange={handleTabChange} value={activeTab}>
            <Tab label="用户管理" value="users" />
            <Tab label="全站历史" value="history" />
          </Tabs>
        </CardContent>
      </Card>

      {activeTab === 'users' ? <AdminUsersPanel currentUserId={currentUserId} /> : <AdminHistoryPanel />}
    </Stack>
  )
}

export default AdminPage
