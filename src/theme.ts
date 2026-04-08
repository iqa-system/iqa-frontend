import { zhCN } from '@mui/material/locale'
import { alpha, createTheme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

const fontFamily = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'

export function createAppTheme(mode: ThemeMode) {
  const isDark = mode === 'dark'
  const primary = isDark
    ? {
        contrastText: '#07231f',
        dark: '#1f8f81',
        light: '#7ad8c8',
        main: '#40b7a8',
      }
    : {
        contrastText: '#f8fffd',
        dark: '#0d574d',
        light: '#43bca8',
        main: '#136f63',
      }
  const secondary = isDark
    ? {
        contrastText: '#31140d',
        dark: '#d87453',
        light: '#ffc1ad',
        main: '#ff9a7a',
      }
    : {
        contrastText: '#fff7f4',
        dark: '#d95d3b',
        light: '#ffb49d',
        main: '#ff7a59',
      }
  const textPrimary = isDark ? '#e8eef6' : '#1f2937'
  const textSecondary = isDark ? '#99a8b8' : '#526072'
  const divider = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.08)'
  const bodyBackground = isDark
    ? `
      radial-gradient(circle at 10% 8%, rgba(255, 122, 89, 0.12) 0%, transparent 24%),
      radial-gradient(circle at 88% 10%, rgba(19, 111, 99, 0.16) 0%, transparent 28%),
      linear-gradient(180deg, #0f1620 0%, #161f2b 100%)
    `
    : `
      radial-gradient(circle at 10% 8%, rgba(255, 122, 89, 0.18) 0%, transparent 24%),
      radial-gradient(circle at 88% 10%, rgba(19, 111, 99, 0.14) 0%, transparent 28%),
      linear-gradient(180deg, #fffaf3 0%, #f6eee4 100%)
    `

  return createTheme(
    {
      cssVariables: true,
      palette: {
        mode,
        primary,
        secondary,
        background: {
          default: isDark ? '#0f1620' : '#f8f2e9',
          paper: isDark ? 'rgba(17, 24, 39, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        },
        divider,
        text: {
          primary: textPrimary,
          secondary: textSecondary,
        },
      },
      shape: {
        borderRadius: 20,
      },
      typography: {
        fontFamily,
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
              boxShadow: 'none',
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
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.88)' : 'rgba(255, 255, 255, 0.88)',
              border: `1px solid ${
                isDark ? alpha('#cbd5e1', 0.14) : 'rgba(255, 255, 255, 0.42)'
              }`,
              boxShadow: isDark
                ? '0 22px 60px rgba(2, 6, 23, 0.28)'
                : '0 22px 60px rgba(20, 38, 52, 0.08)',
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            ':root': {
              colorScheme: mode,
              fontFamily,
            },
            body: {
              background: bodyBackground,
              color: textPrimary,
              margin: 0,
            },
            '::-webkit-scrollbar': {
              height: 10,
              width: 10,
            },
            '::-webkit-scrollbar-thumb': {
              background: isDark ? 'rgba(148, 163, 184, 0.32)' : 'rgba(82, 96, 114, 0.35)',
              borderRadius: 999,
            },
            '::-webkit-scrollbar-track': {
              background: isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.04)',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              border: `1px solid ${divider}`,
              borderRadius: 22,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              background: isDark
                ? 'linear-gradient(180deg, rgba(12, 18, 26, 0.96) 0%, rgba(17, 24, 39, 0.92) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.88) 100%)',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? alpha('#ffffff', 0.02) : alpha('#ffffff', 0.52),
              borderRadius: 16,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? alpha('#cbd5e1', 0.16) : alpha('#0f172a', 0.12),
              },
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
}
