/**
 * SCHOLENTRA DESIGN TOKENS
 * Single source of truth for all design values.
 * Both MUI theme and Tailwind CSS pull from these values.
 */

export const colors = {
  primary: {
    50: '#EAF2FF',
    100: '#CFE0FF',
    200: '#A9C7FF',
    300: '#7FA8FF',
    400: '#558BFF',
    500: '#2F6BFF',
    600: '#2555D6',
    700: '#1C41A8',
    800: '#132D7A',
    900: '#0B1A4D',
  },
  success: {
    50: '#EAFBF2',
    100: '#CFF5DF',
    200: '#A6EAC3',
    300: '#73DFA2',
    400: '#3FD27F',
    500: '#16B364',
    600: '#129153',
    700: '#0F6F40',
    800: '#0B4D2C',
    900: '#062A18',
  },
  error: {
    50: '#FDECEC',
    100: '#F9C7C7',
    200: '#F49E9E',
    300: '#EE6F6F',
    400: '#E84A4A',
    500: '#DC2626',
    600: '#B91C1C',
    700: '#8F1414',
    800: '#660F0F',
    900: '#3D0909',
  },
  warning: {
    50: '#FFF8E6',
    100: '#FFE9B3',
    200: '#FFD580',
    300: '#FFC14D',
    400: '#FFB020',
    500: '#F59E0B',
    600: '#C47A08',
    700: '#935B06',
    800: '#623D04',
    900: '#321E02',
  },
  info: {
    50: '#E8F4FF',
    100: '#C6E4FF',
    200: '#9CCFFF',
    300: '#6EB6FF',
    400: '#3A9BFF',
    500: '#0EA5E9',
    600: '#0B82C2',
    700: '#086193',
    800: '#054062',
    900: '#022033',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export const light = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  foreground: '#111827',
  muted: '#6B7280',
} as const;

export const dark = {
  background: '#0B1220',
  surface: '#111827',
  card: '#1F2937',
  border: '#2D3748',
  foreground: '#E5E7EB',
  muted: '#9CA3AF',
} as const;

/** Dark-mode overrides for semantic colors */
export const darkColors = {
  primary: { 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
  success: { 500: '#22C55E', 600: '#16A34A', 700: '#15803D' },
  error: { 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C' },
  warning: { 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
  info: { 500: '#38BDF8', 600: '#0EA5E9', 700: '#0284C7' },
} as const;

export const radius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)',
  lg: '0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'].join(', '),
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'].join(', '),
  },
  fontSize: {
    xs: '0.75rem',    // 12px — caption, metadata
    sm: '0.875rem',   // 14px — helper text, table content
    base: '1rem',     // 16px — body
    lg: '1.125rem',   // 18px — subsection title
    xl: '1.25rem',    // 20px — section title
    '2xl': '1.5rem',  // 24px — page title
    '3xl': '1.875rem', // 30px — large display (rare)
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;
