import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNavigate, useRouteError } from 'react-router'

import { getErrorMessage } from '@/utils/error'

export function RootErrorBoundary() {
  const navigate = useNavigate()
  const routeError = useRouteError()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        background:
          'radial-gradient(circle at top left, rgba(20, 83, 45, 0.14), transparent 30%), linear-gradient(135deg, #f4f7f2 0%, #eef7f3 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: '100%',
          px: 5,
          py: 6,
          borderRadius: 6,
          border: '1px solid rgba(20, 83, 45, 0.08)',
        }}
      >
        <Stack spacing={2.5}>
          <Typography variant="h4">页面加载失败</Typography>
          <Typography variant="body1" color="text.secondary">
            {getErrorMessage(routeError, '当前页面发生了未预期错误, 请返回主页后重试')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeRoundedIcon />}
            onClick={() => navigate('/assess', { replace: true })}
          >
            返回主页
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
