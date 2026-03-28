import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import KeepAliveRouteOutlet from 'keepalive-for-react-router'
import { Navigate, useLocation, useNavigate, useNavigation } from 'react-router'

import { useAuthStore } from '@/stores/auth-store'
import { useSnackbarStore } from '@/stores/snackbar-store'

const DRAWER_WIDTH = 280

const navigationItems = [
  {
    label: '图像评估',
    path: '/assess',
    icon: <AutoAwesomeRoundedIcon />,
  },
  {
    label: '历史记录',
    path: '/history',
    icon: <HistoryRoundedIcon />,
  },
  {
    label: '个人信息',
    path: '/profile',
    icon: <PermIdentityRoundedIcon />,
  },
]

export function ProtectedLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = useNavigation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const username = useAuthStore((state) => state.username)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const openSnackbar = useSnackbarStore((state) => state.openSnackbar)

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(20, 83, 45, 0.08), transparent 24%), linear-gradient(180deg, #f4f7f2 0%, #eef4f5 100%)',
        pl: `${DRAWER_WIDTH}px`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          px: 3,
          py: 4,
          borderRadius: 0,
          borderRight: '1px solid rgba(20, 83, 45, 0.08)',
          background:
            'linear-gradient(180deg, rgba(20, 83, 45, 0.96) 0%, rgba(15, 118, 110, 0.92) 100%)',
          color: '#ffffff',
        }}
      >
        <Stack spacing={4} sx={{ height: '100%' }}>
          <Stack spacing={1.2}>
            <Typography variant="overline" sx={{ opacity: 0.82, letterSpacing: 2 }}>
              IQA SYSTEM
            </Typography>
            <Typography variant="h5">图像质量评估平台</Typography>
            <Typography variant="body2" sx={{ opacity: 0.82, lineHeight: 1.8 }}>
              支持单张评估, 批量评估, 历史记录查询和个人信息维护.
            </Typography>
          </Stack>

          <List sx={{ p: 0 }}>
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)

              return (
                <ListItemButton
                  key={item.path}
                  selected={isActive}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mb: 1,
                    borderRadius: 3,
                    color: '#ffffff',
                    bgcolor: isActive
                      ? 'rgba(255, 255, 255, 0.16)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.12)',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 255, 255, 0.16)',
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#ffffff', minWidth: 42 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )
            })}
          </List>

          <Box sx={{ flexGrow: 1 }} />

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          >
            <Stack spacing={1.2}>
              <Typography variant="subtitle2">当前登录用户</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {username || '未命名用户'}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Paper>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            px: 4,
            pt: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 5,
              border: '1px solid rgba(20, 83, 45, 0.08)',
              backdropFilter: 'blur(16px)',
              bgcolor: 'rgba(255, 255, 255, 0.82)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6">图像质量评估系统</Typography>
                <Typography variant="body2" color="text.secondary">
                  使用左侧导航切换页面, 所有操作反馈都会以中文提示展示.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip color="primary" variant="outlined" label={username || '当前用户'} />
                <Button
                  color="inherit"
                  variant="outlined"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={() => {
                    clearAuth()
                    openSnackbar({
                      message: '已退出登录',
                      severity: 'success',
                    })
                    navigate('/auth', { replace: true })
                  }}
                >
                  退出登录
                </Button>
              </Stack>
            </Stack>

            {navigation.state !== 'idle' ? (
              <LinearProgress sx={{ mt: 2, borderRadius: 999 }} />
            ) : (
              <Divider sx={{ mt: 2, opacity: 0 }} />
            )}
          </Paper>
        </Box>

        <Box sx={{ flexGrow: 1, px: 4, py: 3 }}>
          <KeepAliveRouteOutlet />
        </Box>
      </Box>
    </Box>
  )
}

