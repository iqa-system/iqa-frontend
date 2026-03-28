import axios, { type AxiosError, type AxiosInstance } from 'axios'

import { useAuthStore } from '@/stores/auth-store'
import { clearAuthSession } from '@/utils/session'

export const baseURL = 'http://localhost:8080'

const apiRequest: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

apiRequest.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    const hasExplicitAuthorizationHeader =
      typeof config.headers?.Authorization !== 'undefined'

    if (accessToken && !hasExplicitAuthorizationHeader) {
      config.headers.Authorization = accessToken
    }

    return config
  },
  (error) => Promise.reject(error)
)

apiRequest.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const requestUrl = error.config?.url ?? ''
    const isAuthApi = requestUrl.startsWith('/auth/')
    const hasAccessToken = Boolean(useAuthStore.getState().accessToken)

    if (status === 401 && hasAccessToken && !isAuthApi) {
      clearAuthSession('登录状态已失效, 请重新登录')
    }

    return Promise.reject(error)
  }
)

export default apiRequest
