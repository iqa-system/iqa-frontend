import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { Link as RouterLink, useNavigate } from 'react-router'

import { register as registerService } from '@/services/auth'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { extractErrorMessage } from '@/utils/api-request'
import { applyTokenAndLoadUser, refreshSessionAndUser } from '@/utils/session'

interface RegisterErrors {
  confirmPassword?: string
  password?: string
  username?: string
}

function RegisterPage() {
  const navigate = useNavigate()
  const { isHydrated, isSessionValidated, logout, token } = useAuthStore()
  const showError = useSnackbarStore(state => state.showError)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    if (!isHydrated || !token) {
      return undefined
    }

    if (isSessionValidated) {
      void navigate('/assessment', { replace: true })
      return undefined
    }

    setIsAutoLoggingIn(true)

    void refreshSessionAndUser()
      .then(() => {
        if (active) {
          showSuccess('自动登录成功。')
          void navigate('/assessment', { replace: true })
        }
      })
      .catch(() => {
        if (active) {
          logout()
        }
      })
      .finally(() => {
        if (active) {
          setIsAutoLoggingIn(false)
        }
      })

    return () => {
      active = false
    }
  }, [isHydrated, isSessionValidated, logout, navigate, showSuccess, token])

  const validateForm = () => {
    const nextErrors: RegisterErrors = {}

    if (!form.username.trim()) {
      nextErrors.username = '请输入用户名。'
    } else if (form.username.trim().length < 3 || form.username.trim().length > 50) {
      nextErrors.username = '用户名长度需要在 3 到 50 个字符之间。'
    }

    if (!form.password) {
      nextErrors.password = '请输入密码。'
    } else if (form.password.length < 6) {
      nextErrors.password = '密码长度至少为 6 个字符。'
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = '请再次输入密码。'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = '两次输入的密码不一致。'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const tokenResponse = await registerService({
        username: form.username.trim(),
        password: form.password,
      })

      await applyTokenAndLoadUser(tokenResponse)
      showSuccess('注册成功, 已自动登录。')
      await navigate('/assessment', { replace: true })
    } catch (error) {
      showError(extractErrorMessage(error, '注册失败, 请稍后重试。'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 1040, overflow: 'hidden', width: '100%' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr' }}>
          <CardContent sx={{ p: 6 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h4">注册账号</Typography>
                <Typography color="text.secondary" variant="body2">
                  创建账号后即可使用单图评估、批量评估和历史记录查询能力。
                </Typography>
              </Stack>

              {isAutoLoggingIn ? (
                <Alert icon={<CircularProgress color="inherit" size={18} />} severity="info">
                  检测到本地登录信息, 正在尝试自动登录。
                </Alert>
              ) : null}

              <TextField
                autoComplete="username"
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
                autoComplete="new-password"
                error={Boolean(errors.password)}
                helperText={errors.password}
                label="密码"
                onChange={event => {
                  setForm(current => ({ ...current, password: event.target.value }))
                  setErrors(current => ({ ...current, password: undefined }))
                }}
                type="password"
                value={form.password}
              />
              <TextField
                autoComplete="new-password"
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                label="确认密码"
                onChange={event => {
                  setForm(current => ({ ...current, confirmPassword: event.target.value }))
                  setErrors(current => ({ ...current, confirmPassword: undefined }))
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    void handleSubmit()
                  }
                }}
                type="password"
                value={form.confirmPassword}
              />

              <Button
                disabled={isSubmitting || isAutoLoggingIn}
                onClick={() => void handleSubmit()}
                size="large"
                startIcon={
                  isSubmitting
                    ? <CircularProgress color="inherit" size={18} />
                    : <PersonAddAltRoundedIcon />
                }
                variant="contained"
              >
                {isSubmitting ? '注册中...' : '创建账号'}
              </Button>

              <Typography color="text.secondary" variant="body2">
                已有账号？
                <Link component={RouterLink} sx={{ ml: 0.5 }} to="/login" underline="hover">
                  前往登录
                </Link>
              </Typography>
            </Stack>
          </CardContent>

          <Box
            sx={{
              background:
                'linear-gradient(180deg, rgba(255,245,238,0.92) 0%, rgba(245,255,251,0.95) 100%)',
              p: 6,
            }}
          >
            <Stack spacing={2.5}>
              <Typography color="primary.main" variant="overline">
                Fast Onboarding
              </Typography>
              <Typography variant="h3">注册后即可进入完整评估工作流。</Typography>
              <Typography color="text.secondary" variant="body1">
                你将获得统一的图像评估入口、进度追踪界面和可检索的历史记录。
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Alert severity="success">支持单张图片即时评估。</Alert>
                <Alert severity="info">支持批量任务流式进度反馈。</Alert>
                <Alert severity="warning">支持账户信息与密码更新。</Alert>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Card>
    </Box>
  )
}

export default RegisterPage
