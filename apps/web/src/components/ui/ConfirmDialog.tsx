/**
 * ConfirmDialog — for destructive or irreversible actions.
 * Forces the user to consciously confirm before proceeding.
 */
'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';
import { colors } from '@/lib/theme/tokens';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}
      >
        {destructive && (
          <AlertTriangle
            size={20}
            color={colors.error[500]}
            strokeWidth={2}
            style={{ flexShrink: 0 }}
          />
        )}
        <Typography variant="h4" component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography
          id="confirm-dialog-description"
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onConfirm}
          disabled={loading}
          color={destructive ? 'error' : 'primary'}
        >
          {loading ? 'Loading...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
