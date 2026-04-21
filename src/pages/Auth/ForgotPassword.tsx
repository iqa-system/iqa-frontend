import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import { Link as RouterLink, useNavigate } from 'react-router'

import { resetPassword, sendPasswordResetCode } from '@/services/auth'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { extractErrorMessage } from '@/utils/api-request'
import { EMAIL_MAX_LENGTH, isValidEmail } from '@/utils/validation'

type ForgotPasswordStep = 'send-code' | 'reset-password'

interface ForgotPasswordErrors {
  code?: string
  confirmPassword?: string
  email?: string
  newPassword?: string
}

const PASSWORD_MAX_LENGTH = 64
const PASSWORD_MIN_LENGTH = 6
const RESEND_COUNTDOWN_SECONDS = 60
const VERIFICATION_CODE_PATTERN = /^\d{6}$/

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const showError = useSnackbarStore(state => state.showError)
  const showSuccess = useSnackbarStore(state => state.showSuccess)
  const [step, setStep] = useState<ForgotPasswordStep>('send-code')
  const [countdown, setCountdown] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [form, setForm] = useState({
    code: '',
    confirmPassword: '',
    email: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState<ForgotPasswordErrors>({})

  useEffect(() => {
    if (countdown <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setCountdown(current => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdown])

  const validateEmail = () => {
    const trimmedEmail = form.email.trim()

    if (!trimmedEmail) {
      setErrors(current => ({ ...current, email: '请输入邮箱。' }))
      return null
    }

    if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      setErrors(current => ({
        ...current,
        email: `邮箱长度不能超过 ${EMAIL_MAX_LENGTH} 个字符。`,
      }))
      return null
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrors(current => ({ ...current, email: '请输入有效的邮箱地址。' }))
      return null
    }

    setErrors(current => ({ ...current, email: undefined }))
    return trimmedEmail
  }

  const validateResetForm = () => {
    const nextErrors: ForgotPasswordErrors = {}
    const trimmedEmail = validateEmail()

    if (!trimmedEmail) {
      return null
    }

    if (!VERIFICATION_CODE_PATTERN.test(form.code.trim())) {
      nextErrors.code = '请输入 6 位数字验证码。'
    }

    if (!form.newPassword) {
      nextErrors.newPassword = '请输入新密码。'
    } else if (form.newPassword.length < PASSWORD_MIN_LENGTH) {
      nextErrors.newPassword = `新密码长度至少为 ${PASSWORD_MIN_LENGTH} 个字符。`
    } else if (form.newPassword.length > PASSWORD_MAX_LENGTH) {
      nextErrors.newPassword = `新密码长度不能超过 ${PASSWORD_MAX_LENGTH} 个字符。`
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = '请再次输入新密码。'
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = '两次输入的新密码不一致。'
    }

    setErrors(current => ({
      ...current,
      ...nextErrors,
    }))

    if (Object.keys(nextErrors).length > 0) {
      return null
    }

    return trimmedEmail
  }

  const handleSendCode = async () => {
    const trimmedEmail = validateEmail()

    if (!trimmedEmail) {
      return
    }

    setIsSendingCode(true)

    try {
      const message = await sendPasswordResetCode({ email: trimmedEmail })
      showSuccess(message || '验证码已发送，请查收邮箱。')
      setStep('reset-password')
      setCountdown(RESEND_COUNTDOWN_SECONDS)
    } catch (error) {
      showError(extractErrorMessage(error, '验证码发送失败，请稍后重试。'))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleResetPassword = async () => {
    const trimmedEmail = validateResetForm()

    if (!trimmedEmail) {
      return
    }

    setIsResettingPassword(true)

    try {
      const message = await resetPassword({
        code: form.code.trim(),
        email: trimmedEmail,
        newPassword: form.newPassword,
      })
      showSuccess(message || '密码重置成功，请重新登录。')
      await navigate('/login', { replace: true })
    } catch (error) {
      showError(extractErrorMessage(error, '密码重置失败，请稍后重试。'))
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleEditEmail = () => {
    setStep('send-code')
    setCountdown(0)
    setErrors({})
    setForm(current => ({
      ...current,
      code: '',
      confirmPassword: '',
      newPassword: '',
    }))
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
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr' }}>
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
              <Typography variant="overline">Password Recovery</Typography>
              <Typography sx={{ maxWidth: 420 }} variant="h3">
                通过邮箱验证码安全重置你的登录密码。
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 420 }} variant="body1">
                输入注册邮箱后，我们会向邮箱发送 6 位验证码。验证通过后即可设置新密码并返回登录。
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Alert severity="info">验证码60秒内不可重新发送。</Alert>
                <Alert severity="warning">新密码长度需在 6 到 64 个字符之间。</Alert>
              </Stack>
            </Stack>
          </Box>

          <CardContent sx={{ p: 6 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h4">找回密码</Typography>
                <Typography color="text.secondary" variant="body2">
                  {step === 'send-code'
                    ? '先输入注册邮箱，我们会发送验证码到你的邮箱。'
                    : '输入验证码并设置新密码，完成后返回登录页。'}
                </Typography>
              </Stack>

              {step === 'send-code' ? (
                <Stack spacing={2.5}>
                  <TextField
                    autoComplete="email"
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    label="邮箱"
                    onChange={event => {
                      setForm(current => ({ ...current, email: event.target.value }))
                      setErrors(current => ({ ...current, email: undefined }))
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        void handleSendCode()
                      }
                    }}
                    type="email"
                    value={form.email}
                  />
                  <Button
                    disabled={isSendingCode}
                    onClick={() => void handleSendCode()}
                    size="large"
                    startIcon={<MarkEmailUnreadRoundedIcon />}
                    variant="contained"
                  >
                    {isSendingCode ? '发送中...' : '发送验证码'}
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  <Alert severity="info">
                    验证码已发送至 {form.email.trim()}。请查收邮箱后输入验证码完成密码重置。
                  </Alert>
                  <TextField
                    slotProps={{ input: { readOnly: true } }}
                    label="邮箱"
                    type="email"
                    value={form.email}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={handleEditEmail}
                      startIcon={<ArrowBackRoundedIcon />}
                      variant="text"
                    >
                      修改邮箱
                    </Button>
                    <Button
                      disabled={isSendingCode || countdown > 0}
                      onClick={() => void handleSendCode()}
                      startIcon={<ReplayRoundedIcon />}
                      variant="outlined"
                    >
                      {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
                    </Button>
                  </Stack>
                  <TextField
                    error={Boolean(errors.code)}
                    helperText={errors.code}
                    slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6, pattern: '\\d{6}' } }}
                    label="验证码"
                    onChange={event => {
                      setForm(current => ({ ...current, code: event.target.value }))
                      setErrors(current => ({ ...current, code: undefined }))
                    }}
                    value={form.code}
                  />
                  <TextField
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword}
                    label="确认新密码"
                    onChange={event => {
                      setForm(current => ({ ...current, confirmPassword: event.target.value }))
                      setErrors(current => ({ ...current, confirmPassword: undefined }))
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        void handleResetPassword()
                      }
                    }}
                    type="password"
                    value={form.confirmPassword}
                  />
                  <Button
                    disabled={isResettingPassword}
                    onClick={() => void handleResetPassword()}
                    size="large"
                    startIcon={<VpnKeyRoundedIcon />}
                    variant="contained"
                  >
                    {isResettingPassword ? '提交中...' : '重置密码'}
                  </Button>
                </Stack>
              )}

              <Typography color="text.secondary" variant="body2">
                想起密码了？
                <Link component={RouterLink} sx={{ ml: 0.5 }} to="/login" underline="hover">
                  返回登录
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Box>
      </Card>
    </Box>
  )
}

export default ForgotPasswordPage
