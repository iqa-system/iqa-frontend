import apiRequest, { unwrapResponse } from '@/utils/api-request'
import type {
  AuthTokenResponse,
  LoginPayload,
  PasswordResetCodePayload,
  PasswordResetSubmitPayload,
  RegisterPayload,
} from '@/types/api'

function buildFormData<T extends object>(values: T) {
  const params = new URLSearchParams()

  Object.entries(values as Record<string, string | undefined>).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value)
    }
  })

  return params
}

export async function login(credentials: LoginPayload) {
  const response = await apiRequest.post('/auth/login', buildFormData(credentials))
  return unwrapResponse<AuthTokenResponse>(response)
}

export async function register(credentials: RegisterPayload) {
  const response = await apiRequest.post('/auth/sign-up', buildFormData(credentials))
  return unwrapResponse<string>(response)
}

export async function sendPasswordResetCode(payload: PasswordResetCodePayload) {
  const response = await apiRequest.post('/auth/password-reset/send-code', buildFormData(payload))
  return unwrapResponse<string>(response)
}

export async function resetPassword(payload: PasswordResetSubmitPayload) {
  const response = await apiRequest.post('/auth/password-reset/reset', buildFormData(payload))
  return unwrapResponse<string>(response)
}

export async function refreshAccessToken(accessToken: string) {
  const response = await apiRequest.post(
    '/auth/refresh',
    buildFormData({ accessToken }),
    {
      skipUnauthorizedHandler: true,
    },
  )

  return unwrapResponse<AuthTokenResponse>(response)
}
