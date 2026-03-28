import SentimentDissatisfiedRoundedIcon from '@mui/icons-material/SentimentDissatisfiedRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router'

export function Component() {
  const navigate = useNavigate()

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
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <SentimentDissatisfiedRoundedIcon sx={{ fontSize: 54, color: 'primary.main' }} />
          <Typography variant="h4">页面不存在</Typography>
          <Typography variant="body1" color="text.secondary">
            当前访问的页面地址无效, 请返回系统主页后继续操作.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/assess', { replace: true })}>
            返回主页
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
