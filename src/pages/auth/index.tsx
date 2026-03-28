import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Navigate, useNavigate } from 'react-router'
import { useState } from 'react'

import { login, signUp } from '@/services/auth-service'
import { getCurrentUserInfo } from '@/services/user-service'
import { useAuthStore } from '@/stores/auth-store'
import { useSnackbarStore } from '@/stores/snackbar-store'
import { getErrorMessage } from '@/utils/error'

type AuthTab = 'login' | 'register'

function validateUsername(username: string) {
  const trimmedUsername = username.trim()

  if (!trimmedUsername) {
    return '请输入用户名'
  }

  if (trimmedUsername.length < 3) {
    return '用户名长度不能少于 3 位'
  }

  return ''
}

function validatePassword(password: string) {
  if (!password.trim()) {
    return '请输入密码'
  }

  if (password.length < 6) {
    return '密码长度不能少于 6 位'
  }

  return ''
}

export function Component() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const setUserInfo = useAuthStore((state) => state.setUserInfo)
  const openSnackbar = useSnackbarStore((state) => state.openSnackbar)
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })

  if (isAuthenticated) {
    return <Navigate to="/assess" replace />
  }

  const handleLogin = async () => {
    const usernameMessage = validateUsername(loginForm.username)
    const passwordMessage = validatePassword(loginForm.password)
    const validationMessage = usernameMessage || passwordMessage

    if (validationMessage) {
      openSnackbar({
        message: validationMessage,
        severity: 'warning',
      })
      return
    }

    setLoginSubmitting(true)

    try {
      // 登录成功后先保存 token, 再拉取用户信息, 确保顶部导航可以立即显示用户名.
      const session = await login(loginForm.username.trim(), loginForm.password)

      setSession(session)

      const currentUserInfo = await getCurrentUserInfo()

      setUserInfo(currentUserInfo)

      openSnackbar({
        message: '登录成功, 欢迎进入图像质量评估系统',
        severity: 'success',
      })

      navigate('/assess', { replace: true })
    } catch (error) {
      openSnackbar({
        message: getErrorMessage(error, '登录失败, 请稍后重试'),
        severity: 'error',
      })
    } finally {
      setLoginSubmitting(false)
    }
  }

  const handleRegister = async () => {
    const usernameMessage = validateUsername(registerForm.username)
    const passwordMessage = validatePassword(registerForm.password)

    if (usernameMessage || passwordMessage) {
      openSnackbar({
        message: usernameMessage || passwordMessage,
        severity: 'warning',
      })
      return
    }

    if (!registerForm.confirmPassword.trim()) {
      openSnackbar({
        message: '请再次输入确认密码',
        severity: 'warning',
      })
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      openSnackbar({
        message: '两次输入的密码不一致',
        severity: 'warning',
      })
      return
    }

    setRegisterSubmitting(true)

    try {
      await signUp(registerForm.username.trim(), registerForm.password)

      openSnackbar({
        message: '注册成功, 请使用新账号登录',
        severity: 'success',
      })

      setActiveTab('login')
      setLoginForm((previousValue) => ({
        ...previousValue,
        username: registerForm.username.trim(),
      }))
      setRegisterForm({
        username: registerForm.username.trim(),
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      openSnackbar({
        message: getErrorMessage(error, '注册失败, 请稍后重试'),
        severity: 'error',
      })
    } finally {
      setRegisterSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 4,
        py: 5,
        background:
          'radial-gradient(circle at top left, rgba(20, 83, 45, 0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.18), transparent 28%), linear-gradient(135deg, #f4f7f2 0%, #eef7f3 100%)',
      }}
    >
      <Stack direction="row" spacing={3} sx={{ width: '100%', maxWidth: 1320 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1.15,
            p: 5,
            borderRadius: 6,
            color: '#ffffff',
            background:
              'linear-gradient(160deg, rgba(20, 83, 45, 0.98) 0%, rgba(15, 118, 110, 0.92) 100%)',
          }}
        >
          <Stack spacing={4} sx={{ height: '100%' }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 3 }}>
                INTELLIGENT IQA
              </Typography>
              <Typography variant="h3">图像质量评估系统</Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.9, opacity: 0.88 }}>
                这里提供单张图片评估, 多张图片批量评估, 历史记录查询和个人信息维护等完整功能.
                登录后即可进入图像质量评估主页.
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AutoAwesomeRoundedIcon />
                  <Typography variant="h6">系统能力概览</Typography>
                </Stack>
                <Typography variant="body2" sx={{ lineHeight: 1.9, opacity: 0.9 }}>
                  1. 支持单张图片质量评估, 自动展示分数, 场景和失真类型.
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.9, opacity: 0.9 }}>
                  2. 支持批量评估与进度展示, 适合快速处理多张图片.
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.9, opacity: 0.9 }}>
                  3. 支持历史记录回溯和个人信息维护, 便于持续使用.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            width: 470,
            p: 4,
            borderRadius: 6,
            border: '1px solid rgba(20, 83, 45, 0.08)',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4">
                {activeTab === 'login' ? '欢迎登录' : '创建账号'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {activeTab === 'login'
                  ? '请输入用户名和密码登录系统'
                  : '注册完成后返回登录页继续进入系统'}
              </Typography>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, value: AuthTab) => setActiveTab(value)}
              variant="fullWidth"
            >
              <Tab value="login" label="登录" icon={<LoginRoundedIcon />} iconPosition="start" />
              <Tab
                value="register"
                label="注册"
                icon={<PersonAddAlt1RoundedIcon />}
                iconPosition="start"
              />
            </Tabs>

            {activeTab === 'login' ? (
              <Stack spacing={2.5}>
                <TextField
                  label="用户名"
                  value={loginForm.username}
                  onChange={(event) => {
                    setLoginForm((previousValue) => ({
                      ...previousValue,
                      username: event.target.value,
                    }))
                  }}
                  fullWidth
                />
                <TextField
                  label="密码"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => {
                    setLoginForm((previousValue) => ({
                      ...previousValue,
                      password: event.target.value,
                    }))
                  }}
                  fullWidth
                />
                <Button
                  size="large"
                  variant="contained"
                  disabled={loginSubmitting}
                  onClick={() => void handleLogin()}
                >
                  {loginSubmitting ? '登录中' : '立即登录'}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <TextField
                  label="用户名"
                  value={registerForm.username}
                  onChange={(event) => {
                    setRegisterForm((previousValue) => ({
                      ...previousValue,
                      username: event.target.value,
                    }))
                  }}
                  fullWidth
                />
                <TextField
                  label="密码"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => {
                    setRegisterForm((previousValue) => ({
                      ...previousValue,
                      password: event.target.value,
                    }))
                  }}
                  fullWidth
                />
                <TextField
                  label="确认密码"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) => {
                    setRegisterForm((previousValue) => ({
                      ...previousValue,
                      confirmPassword: event.target.value,
                    }))
                  }}
                  fullWidth
                />
                <Button
                  size="large"
                  variant="contained"
                  disabled={registerSubmitting}
                  onClick={() => void handleRegister()}
                >
                  {registerSubmitting ? '注册中' : '立即注册'}
                </Button>
              </Stack>
            )}

            <Divider />

            <Typography variant="body2" color="text.secondary">
              所有提示信息和预设文案均采用中文展示. 若登录状态失效, 系统会自动回到登录页.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
