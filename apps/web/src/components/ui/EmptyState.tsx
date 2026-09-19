/**
 * EmptyState — shown when a page has no data to display.
 *
 * Communicates clearly:
 * - What is empty
 * - Why it might be empty  
 * - What the user can do next
 */
'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox } from 'lucide-react';
import { colors } from '@/lib/theme/tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 4,
      }}
    >
      <Box
        sx={{
          mb: 2,
          color: colors.neutral[400],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon ?? <Inbox size={40} strokeWidth={1.25} />}
      </Box>

      <Typography
        variant="h3"
        sx={{ fontSize: '1rem', fontWeight: 600, color: 'text.primary', mb: 0.75 }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', maxWidth: 380, mb: action ? 3 : 0 }}
        >
          {description}
        </Typography>
      )}

      {action && (
        <Button
          variant="contained"
          size="small"
          onClick={action.onClick}
          startIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
