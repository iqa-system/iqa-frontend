import { zhCN } from '@mui/material/locale'
import { createTheme } from '@mui/material/styles'

export const theme = createTheme(
  {
    cssVariables: true,
    palette: {
      primary: {
        main: '#136f63',
      },
      secondary: {
        main: '#ff7a59',
      },
      background: {
        default: '#f8f2e9',
        paper: 'rgba(255, 255, 255, 0.88)',
      },
      text: {
        primary: '#1f2937',
        secondary: '#526072',
      },
    },
    shape: {
      borderRadius: 20,
    },
    typography: {
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      h3: {
        fontSize: '2.6rem',
        fontWeight: 700,
        lineHeight: 1.18,
      },
      h4: {
        fontSize: '2rem',
        fontWeight: 700,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 700,
      },
      button: {
        fontWeight: 700,
        textTransform: 'none',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            paddingInline: 18,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.42)',
            boxShadow: '0 22px 60px rgba(20, 38, 52, 0.08)',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            color: '#1f2937',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.88) 100%)',
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
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 56,
          },
        },
      },
    },
  },
  zhCN,
)
