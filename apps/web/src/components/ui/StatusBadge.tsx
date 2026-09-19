/**
 * StatusBadge — semantic status indicator
 *
 * Maps status strings to the Scholentra color system.
 * - Green = positive / present / completed
 * - Red = danger / absent / failed
 * - Yellow = pending / warning
 * - Blue = info / in-progress
 * - Gray = neutral / inactive
 */
'use client';

import React from 'react';
import { colors } from '@/lib/theme/tokens';

export type StatusVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';

export type StatusSize = 'sm' | 'md';

// Maps well-known domain strings to a variant — extend as needed
const STATUS_MAP: Record<string, StatusVariant> = {
  // Attendance
  PRESENT: 'success',
  ABSENT: 'error',
  LATE: 'warning',
  EXCUSED: 'info',
  // Payments / Finance
  PAID: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  REVERSED: 'error',
  CANCELLED: 'neutral',
  INITIATED: 'info',
  PARTIAL: 'warning',
  OVERDUE: 'error',
  // User / Record status
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'error',
  // Exam
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  COMPLETED: 'success',
  // Invoice
  OPEN: 'warning',
  VOID: 'neutral',
};

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; border: string }> = {
  success: {
    bg: '#EAFBF2',
    text: '#0F6F40',
    border: '#A6EAC3',
  },
  error: {
    bg: '#FDECEC',
    text: '#8F1414',
    border: '#F49E9E',
  },
  warning: {
    bg: '#FFF8E6',
    text: '#935B06',
    border: '#FFD580',
  },
  info: {
    bg: '#E8F4FF',
    text: '#086193',
    border: '#9CCFFF',
  },
  neutral: {
    bg: colors.neutral[100],
    text: colors.neutral[600],
    border: colors.neutral[200],
  },
};

interface StatusBadgeProps {
  status: string;
  label?: string; // Override the display label (defaults to formatted status)
  variant?: StatusVariant; // Override automatic variant detection
  size?: StatusSize;
}

function formatLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({ status, label, variant, size = 'sm' }: StatusBadgeProps) {
  const resolvedVariant = variant ?? STATUS_MAP[status.toUpperCase()] ?? 'neutral';
  const styles = VARIANT_STYLES[resolvedVariant];
  const displayLabel = label ?? formatLabel(status);

  const paddingX = size === 'sm' ? '6px' : '10px';
  const paddingY = size === 'sm' ? '2px' : '4px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${paddingY} ${paddingX}`,
        borderRadius: '4px',
        border: `1px solid ${styles.border}`,
        backgroundColor: styles.bg,
        color: styles.text,
        fontSize,
        fontWeight: 500,
        lineHeight: '1.4',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {displayLabel}
    </span>
  );
}
