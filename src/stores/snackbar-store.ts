import { create } from 'zustand'

import type { AlertColor } from '@mui/material'

interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
  openSnackbar: (payload: { message: string; severity?: AlertColor }) => void
  closeSnackbar: () => void
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'info',

  // 全局提示统一从这里发出, 页面只关心何时触发, 不需要重复维护 Snackbar 状态.
  openSnackbar: ({ message, severity = 'info' }) => {
    set({
      open: true,
      message,
      severity,
    })
  },

  closeSnackbar: () => {
    set({ open: false })
  },
}))

