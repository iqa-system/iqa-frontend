import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    error: null,
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      hasError: true,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 错误边界需要保留堆栈信息, 便于开发阶段快速定位异常来源。
    console.error('应用运行时异常:', error, errorInfo)
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children
    }

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
              <Typography variant="h4">页面出现异常</Typography>
              <Typography color="text.secondary" variant="body1">
                系统捕获到一个未处理的前端错误。你可以刷新页面重试, 或返回首页继续操作。
              </Typography>
              {this.state.error?.message ? (
                <Box
                  sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.04)',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body2">{this.state.error.message}</Typography>
                </Box>
              ) : null}
              <Stack direction="row" spacing={1.5}>
                <Button onClick={() => window.location.reload()} variant="contained">
                  刷新页面
                </Button>
                <Button onClick={() => window.location.assign('/')} variant="outlined">
                  返回首页
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }
}

export default ErrorBoundary
