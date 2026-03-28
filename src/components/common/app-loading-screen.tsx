import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface AppLoadingScreenProps {
  message?: string
}

export function AppLoadingScreen({
  message = '系统正在初始化, 请稍候',
}: AppLoadingScreenProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top left, rgba(20, 83, 45, 0.14), transparent 30%), linear-gradient(135deg, #f4f7f2 0%, #eef7f3 100%)',
        px: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          px: 5,
          py: 6,
          borderRadius: 6,
          border: '1px solid rgba(20, 83, 45, 0.08)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={42} />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6">图像质量评估系统</Typography>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

