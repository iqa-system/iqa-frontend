import { createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'

// 主题里直接合并中文地域配置, 这样 TablePagination 等组件默认文案都会自动变成中文.
export const appTheme = createTheme(
  {
    palette: {
      primary: {
        main: '#14532d',
      },
      secondary: {
        main: '#0f766e',
      },
      background: {
        default: '#f4f7f2',
        paper: '#ffffff',
      },
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily:
        '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      h3: {
        fontWeight: 700,
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 14,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  },
  zhCN
)

