import apiRequest, { unwrapResponse } from '@/utils/api-request'
import type {
  AdminAssessHistoryQuery,
  AdminUpdateUserRolePayload,
  AdminUsersQuery,
  PageAdminAssessRecord,
  PageUserInfo,
  UserRole,
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

/**
 * 查询管理员可见的用户分页列表.
 * 这里统一复用 axios 的 params 序列化, 便于和现有分页接口保持一致.
 */
export async function getAdminUsers(query: AdminUsersQuery) {
  const response = await apiRequest.get('/admin/users', {
    params: query,
  })

  return unwrapResponse<PageUserInfo>(response)
}

/**
 * 批量删除管理员选中的用户.
 * 后端返回的 data 为实际删除数量, 前端用它更新提示文案和分页状态.
 */
export async function deleteAdminUsers(ids: number[]) {
  const response = await apiRequest.delete('/admin/users', {
    data: { ids },
  })

  return unwrapResponse<number>(response)
}

/**
 * 修改指定用户的角色.
 * 后端要求使用 application/x-www-form-urlencoded 提交 role 字段.
 */
export async function updateAdminUserRole(id: number, role: UserRole) {
  const payload: AdminUpdateUserRolePayload = { role }
  const response = await apiRequest.post(`/admin/users/${id}/role`, buildFormData(payload))

  return unwrapResponse<string>(response)
}

/**
 * 查询管理员可见的全站评估历史.
 * startTime 和 endTime 由调用方预先转换为 ISO-8601 字符串.
 */
export async function getAdminAssessmentHistory(query: AdminAssessHistoryQuery) {
  const response = await apiRequest.get('/admin/assess/history', {
    params: query,
  })

  return unwrapResponse<PageAdminAssessRecord>(response)
}

/**
 * 批量删除管理员当前勾选的全站历史记录.
 * 删除结果同样返回实际删除条数, 方便前端统一处理页码回退.
 */
export async function deleteAdminAssessmentHistory(ids: number[]) {
  const response = await apiRequest.delete('/admin/assess/history', {
    data: { ids },
  })

  return unwrapResponse<number>(response)
}
