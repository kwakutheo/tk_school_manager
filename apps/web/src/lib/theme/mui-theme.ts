'use client';

import { createTheme, type PaletteMode } from '@mui/material';
import { colors, light, dark, darkColors, radius, typography } from './tokens';

/**
 * Creates the Scholentra MUI theme.
 * MUI defaults are completely overridden to match the Scholentra design system.
 * No MUI default colors, radii, or shadows leak into the UI.
 */
export function createScholentraTheme(mode: PaletteMode = 'light') {
  const isDark = mode === 'dark';
  const surfaces = isDark ? dark : light;
  const primaryMain = isDark ? darkColors.primary[500] : colors.primary[500];
  const successMain = isDark ? darkColors.success[500] : colors.success[500];
  const errorMain = isDark ? darkColors.error[500] : colors.error[500];
  const warningMain = isDark ? darkColors.warning[500] : colors.warning[500];
  const infoMain = isDark ? darkColors.info[500] : colors.info[500];

  return createTheme({
    palette: {
      mode,
      primary: {
        light: isDark ? darkColors.primary[600] : colors.primary[400],
        main: primaryMain,
        dark: isDark ? darkColors.primary[700] : colors.primary[600],
        contrastText: '#FFFFFF',
      },
      secondary: {
        light: isDark ? darkColors.success[600] : colors.success[400],
        main: successMain,
        dark: isDark ? darkColors.success[700] : colors.success[600],
        contrastText: '#FFFFFF',
      },
      error: {
        light: isDark ? darkColors.error[600] : colors.error[400],
        main: errorMain,
        dark: isDark ? darkColors.error[700] : colors.error[600],
        contrastText: '#FFFFFF',
      },
      warning: {
        light: isDark ? darkColors.warning[600] : colors.warning[400],
        main: warningMain,
        dark: isDark ? darkColors.warning[700] : colors.warning[600],
        contrastText: '#FFFFFF',
      },
      info: {
        light: isDark ? darkColors.info[600] : colors.info[400],
        main: infoMain,
        dark: isDark ? darkColors.info[700] : colors.info[600],
        contrastText: '#FFFFFF',
      },
      background: {
        default: surfaces.background,
        paper: surfaces.surface,
      },
      text: {
        primary: surfaces.foreground,
        secondary: surfaces.muted,
        disabled: isDark ? colors.neutral[500] : colors.neutral[400],
      },
      divider: surfaces.border,
    },

    shape: {
      borderRadius: 6, // maps to radius.md — restrained, professional
    },

    typography: {
      fontFamily: typography.fontFamily.sans,
      h1: { fontSize: typography.fontSize['2xl'], fontWeight: 600, lineHeight: typography.lineHeight.tight },
      h2: { fontSize: typography.fontSize.xl, fontWeight: 600, lineHeight: typography.lineHeight.tight },
      h3: { fontSize: typography.fontSize.lg, fontWeight: 600, lineHeight: typography.lineHeight.tight },
      h4: { fontSize: typography.fontSize.base, fontWeight: 600 },
      h5: { fontSize: typography.fontSize.sm, fontWeight: 600 },
      h6: { fontSize: typography.fontSize.xs, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
      body1: { fontSize: typography.fontSize.base, lineHeight: typography.lineHeight.normal },
      body2: { fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.normal },
      caption: { fontSize: typography.fontSize.xs, color: surfaces.muted },
      button: { fontSize: typography.fontSize.sm, fontWeight: 500, textTransform: 'none' },
    },

    shadows: [
      'none',                                                                            // 0
      '0 1px 2px 0 rgb(0 0 0 / 0.05)',                                                   // 1 — sm
      '0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)',               // 2 — md
      '0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)',            // 3 — lg
      '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',          // 4
      '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)',         // 5
      // MUI requires exactly 25 shadow slots
      // @ts-expect-error: Array expansion creates string[] but MUI expects exact tuple
      ...Array(19).fill('0 20px 25px -5px rgb(0 0 0 / 0.08)'),
    ],

    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            fontWeight: 500,
            fontSize: typography.fontSize.sm,
            padding: '8px 16px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&:active': { boxShadow: 'none' },
          },
          sizeLarge: { padding: '10px 20px', fontSize: typography.fontSize.base },
          sizeSmall: { padding: '5px 12px', fontSize: typography.fontSize.xs },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small', variant: 'outlined' },
        styleOverrides: {
          root: { '& .MuiOutlinedInput-root': { borderRadius: radius.md } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            backgroundColor: isDark ? colors.neutral[800] : '#FFFFFF',
            '& fieldset': { borderColor: surfaces.border },
            '&:hover fieldset': { borderColor: primaryMain },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surfaces.card,
            borderRadius: radius.lg,
          },
          elevation1: { boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            border: `1px solid ${surfaces.border}`,
            boxShadow: 'none',
            backgroundColor: surfaces.card,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& th': {
              backgroundColor: isDark ? colors.neutral[800] : colors.neutral[50],
              fontWeight: 600,
              fontSize: typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: surfaces.muted,
              borderBottom: `1px solid ${surfaces.border}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${surfaces.border}`,
            fontSize: typography.fontSize.sm,
            padding: '12px 16px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radius.xl,
            border: `1px solid ${surfaces.border}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            fontSize: typography.fontSize.xs,
            fontWeight: 500,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: typography.fontSize.xs,
            backgroundColor: isDark ? colors.neutral[700] : colors.neutral[900],
            borderRadius: radius.md,
          },
        },
      },
    },
  });
}
