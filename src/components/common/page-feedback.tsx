import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface PageFeedbackProps {
  type: 'loading' | 'empty' | 'error'
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

function FeedbackIcon({ type }: Pick<PageFeedbackProps, 'type'>) {
  if (type === 'loading') {
    return <CircularProgress size={34} />
  }

  if (type === 'error') {
    return <ErrorOutlineRoundedIcon sx={{ fontSize: 40, color: 'error.main' }} />
  }

  return <InboxRoundedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
}

export function PageFeedback({
  type,
  title,
  description,
  actionText,
  onAction,
}: PageFeedbackProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 5,
        border: '1px dashed rgba(20, 83, 45, 0.18)',
        px: 4,
        py: 6,
      }}
    >
      <Stack spacing={2.5} alignItems="center" textAlign="center">
        <FeedbackIcon type={type} />
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        </Box>

        {actionText && onAction ? (
          <Button
            variant={type === 'error' ? 'contained' : 'outlined'}
            startIcon={type === 'error' ? <AutorenewRoundedIcon /> : undefined}
            onClick={onAction}
          >
            {actionText}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  )
}
