import { Box, CircularProgress, Stack, Typography } from '@mui/material'

interface LoadingScreenProps {
  description?: string
  fullscreen?: boolean
  title?: string
}

function LoadingScreen({
  title = '正在加载',
  description = '请稍候, 页面正在准备数据。',
  fullscreen = true,
}: LoadingScreenProps) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: fullscreen ? '100vh' : 320,
        width: '100%',
      }}
    >
      <Stack alignItems="center" spacing={2.5}>
        <CircularProgress size={42} />
        <Stack spacing={0.75} textAlign="center">
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

export default LoadingScreen
