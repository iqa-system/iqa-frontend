import apiRequest from '@/utils/api-request'
import type { AuthTokenResponse } from '@/types/api'
import { resolveServiceError, unwrapApiResponse } from '@/services/service-helpers'

export async function signUp(username: string, password: string) {
  try {
    const body = new URLSearchParams({
      username,
      password,
    })

    const response = await apiRequest.post('/auth/sign-up', body)

    return unwrapApiResponse<AuthTokenResponse>(response)
  } catch (error) {
    resolveServiceError(error, '注册失败, 请稍后重试')
  }
}

export async function login(username: string, password: string) {
  try {
    const body = new URLSearchParams({
      username,
      password,
    })

    const response = await apiRequest.post('/auth/login', body)

    return unwrapApiResponse<AuthTokenResponse>(response)
  } catch (error) {
    resolveServiceError(error, '登录失败, 请稍后重试')
  }
}

export async function refreshAuthToken(accessToken: string) {
  try {
    const body = new URLSearchParams({
      accessToken,
    })

    const response = await apiRequest.post('/auth/refresh', body, {
      headers: {
        Authorization: '',
      },
    })

    return unwrapApiResponse<AuthTokenResponse>(response)
  } catch (error) {
    resolveServiceError(error, '自动登录失败, 请重新登录')
  }
}

