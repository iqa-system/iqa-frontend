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
import { alpha } from '@mui/material/styles'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router'

import { login as loginService } from '@/services/auth'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { extractErrorMessage } from '@/utils/api-request'
import { applyTokenAndLoadUser, refreshSessionAndUser } from '@/utils/session'

interface LoginErrors {
  password?: string
  username?: string
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isHydrated, isSessionValidated, logout, token } = useAuthStore()
  const showError = useSnackbarStore(state => state.showError)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})
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
          showSuccess('自动登录成功')
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
    const nextErrors: LoginErrors = {}

    if (!form.username.trim()) {
      nextErrors.username = '请输入用户名'
    }

    if (!form.password) {
      nextErrors.password = '请输入密码'
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
      const tokenResponse = await loginService({
        username: form.username.trim(),
        password: form.password,
      })
      console.log('tokenResponse = ', tokenResponse)
      await applyTokenAndLoadUser(tokenResponse)
      showSuccess('欢迎回来')

      const redirectTo = typeof location.state?.from?.pathname === 'string'
        ? location.state.from.pathname
        : '/assessment'

      await navigate(redirectTo, { replace: true })
    } catch (error) {
      showError(extractErrorMessage(error, '登录失败, 请检查用户名和密码'))
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
      <Card
        sx={theme => ({
          backdropFilter: 'blur(18px)',
          backgroundColor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'dark' ? 0.94 : 0.78,
          ),
          maxWidth: 1040,
          overflow: 'hidden',
          WebkitBackdropFilter: 'blur(18px)',
          width: '100%',
        })}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr' }}>
          <Box
            sx={theme => ({
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.secondary.main} 100%)`
                  : `linear-gradient(160deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              color: 'white',
              p: 6,
            })}
          >
            <Stack spacing={3}>
              <Typography variant="overline">IQA Workspace</Typography>
              <Typography sx={{ maxWidth: 420 }} variant="h3">
                用一套前端工作台, 管理整条图像质量评估流程。
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 420 }} variant="body1">
                登录后即可上传图像、查看评估结果、回溯历史记录并维护个人信息。
              </Typography>
            </Stack>
          </Box>

          <CardContent sx={{ p: 6 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h4">登录系统</Typography>
                <Typography color="text.secondary" variant="body2">
                  使用你的账号进入图像质量评估控制台。
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
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password}
                label="密码"
                onChange={event => {
                  setForm(current => ({ ...current, password: event.target.value }))
                  setErrors(current => ({ ...current, password: undefined }))
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    void handleSubmit()
                  }
                }}
                type="password"
                value={form.password}
              />

              <Button
                disabled={isSubmitting || isAutoLoggingIn}
                onClick={() => void handleSubmit()}
                size="large"
                startIcon={
                  isSubmitting ? <CircularProgress color="inherit" size={18} /> : <LoginRoundedIcon />
                }
                variant="contained"
              >
                {isSubmitting ? '登录中...' : '立即登录'}
              </Button>

              <Typography color="text.secondary" variant="body2">
                还没有账号？
                <Link component={RouterLink} sx={{ ml: 0.5 }} to="/register" underline="hover">
                  前往注册
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Box>
      </Card>
    </Box>
  )
}

export default LoginPage
