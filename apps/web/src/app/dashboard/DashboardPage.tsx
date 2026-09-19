'use client';

/**
 * Main Dashboard Overview
 *
 * Professional, calm layout. Focuses on relevant operational metrics.
 * Uses a grid of summary cards (sparingly, only for true KPIs) and
 * placeholder sections for "Recent Activity" and "Attention Required".
 */

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { Users, BookOpen, Receipt, BellRing, LucideIcon } from 'lucide-react';
import { colors, radius } from '@/lib/theme/tokens';

// A simple KPI card component
function KpiCard({ title, value, icon: Icon, colorToken }: { title: string; value: string; icon: LucideIcon; colorToken: Record<number, string> }) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: radius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: radius.md,
          backgroundColor: colorToken[50],
          color: colorToken[600],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={24} strokeWidth={1.75} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="A summary of today's academic and operational metrics."
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Students"
            value="1,248"
            icon={Users}
            colorToken={colors.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Classes"
            value="42"
            icon={BookOpen}
            colorToken={colors.info}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Pending Invoices"
            value="GHS 12,450"
            icon={Receipt}
            colorToken={colors.warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="System Alerts"
            value="3"
            icon={BellRing}
            colorToken={colors.error}
          />
        </Grid>
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: radius.lg,
              backgroundColor: 'background.paper',
              p: 3,
              minHeight: 400,
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder for data table or timeline showing recent enrollments, payments, and system events.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: radius.lg,
              backgroundColor: 'background.paper',
              p: 3,
              minHeight: 400,
            }}
          >
            <Typography variant="h3" sx={{ mb: 2 }}>
              Attention Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder for tasks or alerts that need immediate review.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
