import axios, {type AxiosError, type AxiosInstance, type AxiosResponse,} from 'axios'

import {useAuthStore} from '@/stores/authStore'
import {useSnackbarStore} from '@/stores/snackbarStore'
import type {ApiResponse} from '@/types/api'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipUnauthorizedHandler?: boolean
  }
}

const SUCCESS_CODES = new Set([0, 200])
const AUTH_FREE_PATHS = new Set(['/login', '/register', '/forgot-password'])

// 阿里云服务器: 8.146.225.62:8080; 学校服务器: 211.87.232.11
export const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:8080'

export function resolveApiUrl(path: string) {
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
  return new URL(path.replace(/^\//, ''), normalizedBaseURL).toString()
}

export function extractErrorMessage(error: unknown, fallback = '请求失败, 请稍后重试。') {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage
    }

    if (error.message.trim()) {
      return error.message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>) {
  const payload = response.data

  if (!SUCCESS_CODES.has(payload.code)) {
    throw new Error(payload.message || '接口返回异常。')
  }

  return payload.data
}

export function handleUnauthorizedState(message = '登录状态已失效, 请重新登录。') {
  const authStore = useAuthStore.getState()
  const hadToken = Boolean(authStore.token)

  authStore.logout()

  if (hadToken) {
    useSnackbarStore.getState().showWarning(message)
  }

  if (typeof window !== 'undefined' && !AUTH_FREE_PATHS.has(window.location.pathname)) {
    window.location.replace('/login')
  }
}

const apiRequest: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
})

// 统一从全局认证状态中读取令牌, 保证 axios 请求自动带上 Authorization。
apiRequest.interceptors.request.use(
  config => {
    config.headers.Authorization = useAuthStore.getState().token?.accessToken
    return config
  },
  error => Promise.reject(error),
)

// 统一处理 HTTP 异常, 401 时清理登录态并回退到登录页。
apiRequest.interceptors.response.use(
  response => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && !error.config?.skipUnauthorizedHandler) {
      handleUnauthorizedState()
    }

    return Promise.reject(new Error(extractErrorMessage(error)))
  },
)

export default apiRequest
