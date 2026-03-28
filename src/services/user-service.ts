import apiRequest from '@/utils/api-request'
import type { UserInfo } from '@/types/api'
import { resolveServiceError, unwrapApiResponse } from '@/services/service-helpers'

interface UpdateUserInfoPayload {
  username?: string
  oldPassword?: string
  newPassword?: string
}

export async function getCurrentUserInfo() {
  try {
    const response = await apiRequest.get('/user/info')

    return unwrapApiResponse<UserInfo>(response)
  } catch (error) {
    resolveServiceError(error, '获取用户信息失败, 请稍后重试')
  }
}

export async function updateCurrentUserInfo(payload: UpdateUserInfoPayload) {
  try {
    const body = new URLSearchParams()

    if (payload.username) {
      body.set('username', payload.username)
    }

    if (payload.oldPassword) {
      body.set('oldPassword', payload.oldPassword)
    }

    if (payload.newPassword) {
      body.set('newPassword', payload.newPassword)
    }

    const response = await apiRequest.post('/user/update-info', body)

    return unwrapApiResponse<string>(response)
  } catch (error) {
    resolveServiceError(error, '更新个人信息失败, 请稍后重试')
  }
}

