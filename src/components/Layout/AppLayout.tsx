import { useEffect } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router'

import LoadingScreen from '@/components/LoadingScreen'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { refreshSessionAndUser } from '@/utils/session'

const drawerWidth = 280

const navigationItems = [
  {
    icon: <AssessmentOutlinedIcon />,
    label: '图像评估',
    to: '/assessment',
  },
  {
    icon: <HistoryOutlinedIcon />,
    label: '历史记录',
    to: '/history',
  },
  {
    icon: <PersonOutlineRoundedIcon />,
    label: '个人信息',
    to: '/profile',
  },
  {
    icon: <SettingsRoundedIcon />,
    label: '配置',
    to: '/settings',
  },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    isSessionChecking,
    isSessionValidated,
    logout,
    setSessionChecking,
    setSessionValidated,
    token,
    user,
  } = useAuthStore()
  const showInfo = useSnackbarStore(state => state.showInfo)
  const showWarning = useSnackbarStore(state => state.showWarning)

  useEffect(() => {
    let active = true

    // 仅在本地持久化恢复后首次进入受保护区域时刷新 token, 避免每次切路由都重复请求。
    if (!token || isSessionValidated) {
      return undefined
    }

    setSessionChecking(true)

    void refreshSessionAndUser()
      .then(() => {
        if (active) {
          setSessionValidated(true)
        }
      })
      .catch(() => {
        if (active) {
          logout()
          showWarning('登录已过期, 请重新登录。')
          void navigate('/login', { replace: true })
        }
      })
      .finally(() => {
        if (active) {
          setSessionChecking(false)
        }
      })

    return () => {
      active = false
    }
  }, [
    isSessionValidated,
    logout,
    navigate,
    setSessionChecking,
    setSessionValidated,
    showWarning,
    token,
  ])

  const handleLogout = () => {
    logout()
    showInfo('已退出当前账号。')
    void navigate('/login', { replace: true })
  }

  if (isSessionChecking && !isSessionValidated) {
    return (
      <LoadingScreen
        description="正在校验登录态并同步用户信息。"
        title="验证会话"
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="fixed"
        sx={theme => ({
          backdropFilter: 'blur(20px)',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.82)
              : alpha(theme.palette.background.paper, 0.74),
          borderBottom: `1px solid ${theme.palette.divider}`,
          ml: `${drawerWidth}px`,
          width: `calc(100% - ${drawerWidth}px)`,
        })}
      >
        <Toolbar sx={{ gap: 2, minHeight: 80 }}>
          <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
            <Typography variant="h5">图像质量评估系统</Typography>
            <Typography color="text.secondary" variant="body2">
              上传图像, 获取单张与批量质量分析结果。
            </Typography>
          </Stack>
          <Chip
            color="primary"
            icon={<TuneRoundedIcon />}
            label={user ? `当前用户: ${user.username}` : '当前用户'}
            variant="outlined"
          />
          <Button
            onClick={handleLogout}
            startIcon={<LogoutRoundedIcon />}
            variant="contained"
          >
            退出登录
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          flexShrink: 0,
          width: drawerWidth,
          '& .MuiDrawer-paper': theme => ({
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
            px: 2.5,
            py: 3,
            width: drawerWidth,
          }),
        }}
        variant="permanent"
      >
        <Stack spacing={3} sx={{ height: '100%' }}>
          <Box
            sx={theme => ({
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(140deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main})`
                  : `linear-gradient(140deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 1,
              color: 'white',
              overflow: 'hidden',
              p: 3,
              position: 'relative',
            })}
          >
            <Box
              sx={{
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0) 70%)',
                height: 160,
                pointerEvents: 'none',
                position: 'absolute',
                right: -40,
                top: -50,
                width: 160,
              }}
            />
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.22)',
                  color: 'white',
                  height: 52,
                  width: 52,
                }}
              >
                IQA
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h6">智能评估工作台</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.82)' }} variant="body2">
                  覆盖单图检测、批量推理、历史查询和账户管理。
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <List disablePadding sx={{ flexGrow: 1 }}>
            {navigationItems.map(item => (
              <ListItem disablePadding key={item.to} sx={{ mb: 1 }}>
                <ListItemButton
                  component={RouterLink}
                  selected={location.pathname === item.to}
                  sx={theme => ({
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.22 : 0.12,
                      ),
                      color: theme.palette.primary.main,
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.28 : 0.16,
                      ),
                    },
                    '&:hover': {
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.14 : 0.07,
                      ),
                    },
                    borderRadius: 3,
                    minHeight: 56,
                  })}
                  to={item.to}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontWeight: 600 } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          pt: '112px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppLayout
