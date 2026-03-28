import apiRequest, { unwrapResponse } from '@/utils/api-request'
import type { UpdateUserPayload, UserInfo } from '@/types/api'

function buildFormData<T extends object>(values: T) {
  const params = new URLSearchParams()

  Object.entries(values as Record<string, string | undefined>).forEach(([key, value]) => {
    if (value && value.trim()) {
      params.append(key, value)
    }
  })

  return params
}

export async function getUserInfo() {
  const response = await apiRequest.get('/user/info')
  return unwrapResponse<UserInfo>(response)
}

export async function updateUserInfo(payload: UpdateUserPayload) {
  const response = await apiRequest.post('/user/update-info', buildFormData(payload))
  return unwrapResponse<string>(response)
}
