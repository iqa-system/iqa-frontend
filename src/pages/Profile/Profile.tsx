import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'

import LoadingScreen from '@/components/LoadingScreen'
import { getUserInfo, updateUserInfo } from '@/services/user'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { extractErrorMessage } from '@/utils/api-request'
import { getUserRoleChipColor, getUserRoleLabel } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'
import { EMAIL_MAX_LENGTH, isValidEmail } from '@/utils/validation'

interface ProfileErrors {
  confirmPassword?: string
  email?: string
  newPassword?: string
  oldPassword?: string
  username?: string
}

function ProfilePage() {
  const authUser = useAuthStore(state => state.user)
  const setUser = useAuthStore(state => state.setUser)
  const showError = useSnackbarStore(state => state.showError)
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<ProfileErrors>({})

  useEffect(() => {
    let active = true

    void getUserInfo()
      .then(user => {
        if (!active) {
          return
        }

        setUser(user)
        setForm(current => ({
          ...current,
          username: user.username,
          email: user.email,
        }))
      })
      .catch(error => {
        if (active) {
          showError(extractErrorMessage(error, '用户信息加载失败。'))
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
  }, [setUser, showError])

  const validateForm = () => {
    const nextErrors: ProfileErrors = {}
    const trimmedUsername = form.username.trim()
    const trimmedEmail = form.email.trim()
    const hasPasswordChange = Boolean(form.oldPassword || form.newPassword || form.confirmPassword)

    if (!trimmedUsername) {
      nextErrors.username = '请输入用户名。'
    } else if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      nextErrors.username = '用户名长度需要在 3 到 50 个字符之间。'
    }

    if (!trimmedEmail) {
      nextErrors.email = '请输入邮箱。'
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = `邮箱长度不能超过 ${EMAIL_MAX_LENGTH} 个字符。`
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = '请输入有效的邮箱地址。'
    }

    if (hasPasswordChange) {
      if (!form.oldPassword) {
        nextErrors.oldPassword = '修改密码时必须填写旧密码。'
      } else if (form.oldPassword.length < 6) {
        nextErrors.oldPassword = '旧密码长度至少为 6 个字符。'
      }

      if (!form.newPassword) {
        nextErrors.newPassword = '请输入新密码。'
      } else if (form.newPassword.length < 6) {
        nextErrors.newPassword = '新密码长度至少为 6 个字符。'
      }

      if (!form.confirmPassword) {
        nextErrors.confirmPassword = '请再次输入新密码。'
      } else if (form.confirmPassword !== form.newPassword) {
        nextErrors.confirmPassword = '两次输入的新密码不一致。'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!authUser) {
      return
    }

    if (!validateForm()) {
      return
    }

    const trimmedUsername = form.username.trim()
    const trimmedEmail = form.email.trim()
    const payload = {
      username: trimmedUsername !== authUser.username ? trimmedUsername : undefined,
      email: trimmedEmail !== authUser.email ? trimmedEmail : undefined,
      oldPassword: form.oldPassword || undefined,
      newPassword: form.newPassword || undefined,
    }

    if (!payload.username && !payload.email && !payload.newPassword) {
      showInfo('未检测到需要提交的修改。')
      return
    }

    setIsSubmitting(true)

    try {
      await updateUserInfo(payload)
      const refreshedUser = await getUserInfo()

      setUser(refreshedUser)
      setForm({
        username: refreshedUser.username,
        email: refreshedUser.email,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
      setIsEditing(false)
      showSuccess('个人信息更新成功。')
    } catch (error) {
      showError(extractErrorMessage(error, '个人信息更新失败。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <LoadingScreen
        description="正在同步当前账号信息。"
        fullscreen={false}
        title="加载个人信息"
      />
    )
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Stack spacing={1}>
              <Typography variant="h4">个人信息</Typography>
              <Typography color="text.secondary" variant="body2">
                查看当前账号信息, 并在同一页面中完成用户名、邮箱或密码更新。
              </Typography>
            </Stack>
            <Button
              onClick={() => setIsEditing(current => !current)}
              startIcon={<EditRoundedIcon />}
              variant={isEditing ? 'outlined' : 'contained'}
            >
              {isEditing ? '取消编辑' : '编辑信息'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
        }}
      >
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack alignItems="center" spacing={2.5}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  fontSize: 28,
                  height: 88,
                  width: 88,
                }}
              >
                {authUser?.username.slice(0, 1).toUpperCase() ?? 'U'}
              </Avatar>
              <Stack spacing={0.75} textAlign="center">
                <Stack alignItems="center" direction="row" justifyContent="center" spacing={1}>
                  <Typography variant="h5">{authUser?.username ?? '--'}</Typography>
                  {authUser?.role ? (
                    <Chip
                      color={getUserRoleChipColor(authUser.role)}
                      label={getUserRoleLabel(authUser.role)}
                      size="small"
                      variant="outlined"
                    />
                  ) : null}
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  用户 ID: {authUser?.id ?? '--'}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  邮箱: {authUser?.email ?? '--'}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  角色: {authUser?.role ? getUserRoleLabel(authUser.role) : '--'}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  注册时间: {formatDateTime(authUser?.registerTime)}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h5">编辑资料</Typography>
              {!isEditing ? (
                <Alert severity="info">点击右上角“编辑信息”后即可修改用户名、邮箱或密码。</Alert>
              ) : null}
              <TextField
                disabled={!isEditing}
                error={Boolean(errors.username)}
                helperText={errors.username}
                label="用户名"
                onChange={event => {
                  setForm(current => ({ ...current, username: event.target.value }))
                  setErrors(current => ({ ...current, username: undefined }))
                }}
                value={form.username}
              />
              <TextField
                disabled={!isEditing}
                error={Boolean(errors.email)}
                helperText={errors.email}
                label="邮箱"
                onChange={event => {
                  setForm(current => ({ ...current, email: event.target.value }))
                  setErrors(current => ({ ...current, email: undefined }))
                }}
                type="email"
                value={form.email}
              />
              <Divider />
              <Stack spacing={2}>
                <Typography variant="subtitle1">修改密码</Typography>
                <TextField
                  disabled={!isEditing}
                  error={Boolean(errors.oldPassword)}
                  helperText={errors.oldPassword}
                  label="旧密码"
                  onChange={event => {
                    setForm(current => ({ ...current, oldPassword: event.target.value }))
                    setErrors(current => ({ ...current, oldPassword: undefined }))
                  }}
                  type="password"
                  value={form.oldPassword}
                />
                <TextField
                  disabled={!isEditing}
                  error={Boolean(errors.newPassword)}
                  helperText={errors.newPassword}
                  label="新密码"
                  onChange={event => {
                    setForm(current => ({ ...current, newPassword: event.target.value }))
                    setErrors(current => ({ ...current, newPassword: undefined }))
                  }}
                  type="password"
                  value={form.newPassword}
                />
                <TextField
                  disabled={!isEditing}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  label="确认新密码"
                  onChange={event => {
                    setForm(current => ({ ...current, confirmPassword: event.target.value }))
                    setErrors(current => ({ ...current, confirmPassword: undefined }))
                  }}
                  type="password"
                  value={form.confirmPassword}
                />
              </Stack>

              {isEditing ? (
                <Box>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => void handleSave()}
                    startIcon={<SaveRoundedIcon />}
                    variant="contained"
                  >
                    {isSubmitting ? '保存中...' : '保存修改'}
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

export default ProfilePage
