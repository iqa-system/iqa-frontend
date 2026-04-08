import {
  Box,
  Card,
  CardContent,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { useUiPreferencesStore } from '@/stores/uiPreferencesStore'

function SettingsPage() {
  const darkModeEnabled = useUiPreferencesStore(state => state.darkModeEnabled)
  const isUiPreferencesHydrated = useUiPreferencesStore(state => state.isHydrated)
  const setDarkModeEnabled = useUiPreferencesStore(state => state.setDarkModeEnabled)

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h4">配置</Typography>
            <Typography color="text.secondary" variant="body2">
              管理当前浏览器中的界面显示偏好，修改后会立即应用到整个系统。
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Stack spacing={0.5}>
              <Typography variant="h5">显示</Typography>
              <Typography color="text.secondary" variant="body2">
                这些设置仅保存在当前浏览器中，不会同步到账号。
              </Typography>
            </Stack>

            <Box
              sx={theme => ({
                alignItems: 'center',
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.light, 0.14),
                border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.16)}`,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.03)}`
                    : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.5)}`,
                borderRadius: 3,
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                p: 2.5,
              })}
            >
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">深色模式</Typography>
                <Typography color="text.secondary" variant="body2">
                  切换后立即生效，并保存在当前浏览器。
                </Typography>
              </Stack>
              <Switch
                checked={darkModeEnabled}
                disabled={!isUiPreferencesHydrated}
                onChange={event => setDarkModeEnabled(event.target.checked)}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default SettingsPage
