import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'

import { useAuthStore } from '@/stores/authStore'

function NotFoundPage() {
  const navigate = useNavigate()
  const token = useAuthStore(state => state.token)

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 560, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Typography color="primary.main" variant="overline">
              404 Not Found
            </Typography>
            <Typography variant="h3">页面不存在</Typography>
            <Typography color="text.secondary" variant="body1">
              当前地址没有对应的页面。你可以返回上一页, 或回到系统的主要工作区。
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => void navigate(-1)} variant="outlined">
                返回上一页
              </Button>
              <Button
                onClick={() => void navigate(token ? '/assessment' : '/login', { replace: true })}
                variant="contained"
              >
                {token ? '前往评估页' : '前往登录页'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NotFoundPage
