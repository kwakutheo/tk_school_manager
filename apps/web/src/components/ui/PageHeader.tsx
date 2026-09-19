/**
 * PageHeader — consistent page title area
 *
 * Keeps page titles proportionate — no marketing-style giant headings.
 * Primary action slot is top-right (conventional admin pattern).
 * Breadcrumb slot sits above the title.
 */
'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import { colors } from '@/lib/theme/tokens';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  action?: React.ReactNode; // Primary page action (button)
  meta?: React.ReactNode;   // Supplemental metadata (e.g. school name, date)
}

export function PageHeader({ title, description, breadcrumbs, action, meta }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        mb: 3,
        pb: 3,
        borderBottom: `1px solid ${colors.neutral[200]}`,
      }}
    >
      {breadcrumbs && (
        <Box sx={{ mb: 1 }}>
          {breadcrumbs}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: '1.375rem', // 22px — proportionate for admin page, not marketing
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.3,
              mb: description ? 0.5 : 0,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25 }}
            >
              {description}
            </Typography>
          )}
          {meta && (
            <Box sx={{ mt: 0.5 }}>
              {meta}
            </Box>
          )}
        </Box>

        {action && (
          <Box sx={{ flexShrink: 0, mt: 0.25 }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
}
