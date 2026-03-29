import { Box, Chip, Stack, Typography } from '@mui/material'

import type { DistortionProb } from '@/types/api'
import { getDistortionDisplayItems } from '@/utils/constants'

interface DistortionListProps {
  distortions: DistortionProb[] | null | undefined
  variant?: 'chips' | 'panel'
}

function DistortionList({
  distortions,
  variant = 'panel',
}: DistortionListProps) {
  const items = getDistortionDisplayItems(distortions)

  if (variant === 'chips') {
    return (
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {items.map(item => (
          <Chip
            key={item.key}
            label={`${item.label} ${item.probabilityText}`}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>
    )
  }

  return (
    <Stack spacing={1}>
      {items.map(item => (
        <Box
          key={item.key}
          sx={{
            alignItems: 'center',
            bgcolor: 'rgba(15, 23, 42, 0.04)',
            borderRadius: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography variant="body2">{item.label}</Typography>
          <Typography color="text.secondary" variant="body2">
            {item.probabilityText}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default DistortionList
