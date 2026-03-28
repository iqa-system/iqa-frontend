import { create } from 'zustand'

import type { SnackbarState } from '@/types/api'

interface SnackbarStore extends SnackbarState {
  hide: () => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
}

const DEFAULT_DURATION = 4000

export const useSnackbarStore = create<SnackbarStore>(set => ({
  open: false,
  message: '',
  severity: 'info',
  duration: DEFAULT_DURATION,
  hide: () => set({ open: false }),
  showError: (message, duration = DEFAULT_DURATION) =>
    set({ open: true, message, severity: 'error', duration }),
  showInfo: (message, duration = DEFAULT_DURATION) =>
    set({ open: true, message, severity: 'info', duration }),
  showSuccess: (message, duration = DEFAULT_DURATION) =>
    set({ open: true, message, severity: 'success', duration }),
  showWarning: (message, duration = DEFAULT_DURATION) =>
    set({ open: true, message, severity: 'warning', duration }),
}))
