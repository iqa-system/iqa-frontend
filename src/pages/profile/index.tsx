import { useCallback, useEffect, useState } from 'react'

import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { PageFeedback } from '@/components/common/page-feedback'
import { getCurrentUserInfo, updateCurrentUserInfo } from '@/services/user-service'
import { useAuthStore } from '@/stores/auth-store'
import { useSnackbarStore } from '@/stores/snackbar-store'
import type { UserInfo } from '@/types/api'
import { formatDateTime } from '@/utils/formatters'
import { getErrorMessage } from '@/utils/error'

export function Component() {
  const setUserInfo = useAuthStore((state) => state.setUserInfo)
  const openSnackbar = useSnackbarStore((state) => state.openSnackbar)
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formState, setFormState] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const loadUserInfo = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const userInfoResponse = await getCurrentUserInfo()

      setCurrentUserInfo(userInfoResponse)
      setUserInfo(userInfoResponse)
      setFormState((previousValue) => ({
        ...previousValue,
        username: userInfoResponse.username,
      }))
    } catch (requestError) {
      setError(getErrorMessage(requestError, '获取个人信息失败, 请稍后重试'))
    } finally {
      setLoading(false)
    }
  }, [setUserInfo])

  useEffect(() => {
    void loadUserInfo()
  }, [loadUserInfo])

  const handleSubmit = async () => {
    if (!currentUserInfo) {
      return
    }

    const trimmedUsername = formState.username.trim()
    const nextPayload: {
      username?: string
      oldPassword?: string
      newPassword?: string
    } = {}

    if (!trimmedUsername) {
      openSnackbar({
        message: '用户名不能为空',
        severity: 'warning',
      })
      return
    }

    if (trimmedUsername.length < 3) {
      openSnackbar({
        message: '用户名长度不能少于 3 位',
        severity: 'warning',
      })
      return
    }

    if (trimmedUsername !== currentUserInfo.username) {
      nextPayload.username = trimmedUsername
    }

    const isPasswordEditing = Boolean(
      formState.oldPassword || formState.newPassword || formState.confirmPassword
    )

    if (isPasswordEditing) {
      if (!formState.oldPassword) {
        openSnackbar({
          message: '修改密码时请输入旧密码',
          severity: 'warning',
        })
        return
      }

      if (!formState.newPassword) {
        openSnackbar({
          message: '请输入新密码',
          severity: 'warning',
        })
        return
      }

      if (formState.newPassword.length < 6) {
        openSnackbar({
          message: '新密码长度不能少于 6 位',
          severity: 'warning',
        })
        return
      }

      if (!formState.confirmPassword) {
        openSnackbar({
          message: '请再次输入确认密码',
          severity: 'warning',
        })
        return
      }

      if (formState.newPassword !== formState.confirmPassword) {
        openSnackbar({
          message: '两次输入的新密码不一致',
          severity: 'warning',
        })
        return
      }

      nextPayload.oldPassword = formState.oldPassword
      nextPayload.newPassword = formState.newPassword
    }

    if (!Object.keys(nextPayload).length) {
      openSnackbar({
        message: '请至少修改一项信息后再提交',
        severity: 'warning',
      })
      return
    }

    setSubmitting(true)

    try {
      await updateCurrentUserInfo(nextPayload)

      const refreshedUserInfo = await getCurrentUserInfo()

      setCurrentUserInfo(refreshedUserInfo)
      setUserInfo(refreshedUserInfo)
      setFormState({
        username: refreshedUserInfo.username,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      openSnackbar({
        message: '个人信息更新成功',
        severity: 'success',
      })
    } catch (requestError) {
      openSnackbar({
        message: getErrorMessage(requestError, '更新个人信息失败, 请稍后重试'),
        severity: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageFeedback
        type="loading"
        title="正在加载个人信息"
        description="系统正在获取当前账号的最新资料, 请稍候"
      />
    )
  }

  if (error || !currentUserInfo) {
    return (
      <PageFeedback
        type="error"
        title="个人信息加载失败"
        description={error || '当前用户信息不存在'}
        actionText="重新加载"
        onAction={() => void loadUserInfo()}
      />
    )
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
        <Typography variant="h4">个人信息</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          这里展示当前账号的基本信息, 同时支持修改用户名和密码. 修改密码时需要二次输入确认.
        </Typography>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) minmax(520px, 1fr)',
          gap: 24,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 5,
            border: '1px solid rgba(20, 83, 45, 0.08)',
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">基本资料</Typography>
            <Typography variant="body2" color="text.secondary">
              用户 ID: {currentUserInfo.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              用户名: {currentUserInfo.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              注册时间: {formatDateTime(currentUserInfo.registerTime)}
            </Typography>
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
          <Stack spacing={2.5}>
            <Typography variant="h6">编辑信息</Typography>

            <TextField
              label="用户名"
              value={formState.username}
              onChange={(event) => {
                setFormState((previousValue) => ({
                  ...previousValue,
                  username: event.target.value,
                }))
              }}
              fullWidth
            />
            <TextField
              label="旧密码"
              type="password"
              value={formState.oldPassword}
              onChange={(event) => {
                setFormState((previousValue) => ({
                  ...previousValue,
                  oldPassword: event.target.value,
                }))
              }}
              fullWidth
            />
            <TextField
              label="新密码"
              type="password"
              value={formState.newPassword}
              onChange={(event) => {
                setFormState((previousValue) => ({
                  ...previousValue,
                  newPassword: event.target.value,
                }))
              }}
              fullWidth
            />
            <TextField
              label="确认新密码"
              type="password"
              value={formState.confirmPassword}
              onChange={(event) => {
                setFormState((previousValue) => ({
                  ...previousValue,
                  confirmPassword: event.target.value,
                }))
              }}
              fullWidth
            />

            <Button
              size="large"
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? '保存中' : '保存修改'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
