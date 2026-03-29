import { Box, Chip, Stack, Typography } from '@mui/material'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

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
            color={item.isPrimary ? 'primary' : 'default'}
            key={item.key}
            label={`${item.label} ${item.probabilityText}`}
            size="small"
            sx={item.isPrimary ? { fontWeight: 700 } : undefined}
            variant={item.isPrimary ? 'filled' : 'outlined'}
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
            bgcolor: item.isPrimary ? 'rgba(19, 111, 99, 0.10)' : 'rgba(15, 23, 42, 0.04)',
            border: item.isPrimary ? '1px solid rgba(19, 111, 99, 0.22)' : '1px solid transparent',
            borderRadius: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            {item.isPrimary ? <StarRoundedIcon color="primary" sx={{ fontSize: 16 }} /> : null}
            <Typography sx={{ fontWeight: item.isPrimary ? 700 : 400 }} variant="body2">
              {item.label}
            </Typography>
            {item.isPrimary ? (
              <Chip
                color="primary"
                label="主失真"
                size="small"
                sx={{ height: 22 }}
                variant="filled"
              />
            ) : null}
          </Stack>
          <Typography
            color={item.isPrimary ? 'primary.main' : 'text.secondary'}
            sx={{ fontWeight: item.isPrimary ? 700 : 400 }}
            variant="body2"
          >
            {item.probabilityText}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default DistortionList
