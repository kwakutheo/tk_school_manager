'use client';

/**
 * Topbar — page-level top navigation bar.
 *
 * Contains:
 * - Mobile menu toggle (hamburger)
 * - Breadcrumbs or page context (injected via slot)
 * - Theme toggle
 * - User menu (profile, logout)
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme/tokens';
import { useThemeMode } from '@/lib/theme';
import { useAuthStore } from '@/lib/store/auth.store';

interface TopbarProps {
  onMobileMenuOpen?: () => void;
}

export function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const { mode, toggleTheme } = useThemeMode();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleUserMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    router.push('/login');
  };

  // Initials from email
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <Box
      component="header"
      sx={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 3 },
        borderBottom: `1px solid ${colors.neutral[200]}`,
        backgroundColor: 'background.paper',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Mobile menu toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={onMobileMenuOpen}
          sx={{
            display: { md: 'none' },
            color: colors.neutral[600],
            '&:hover': { backgroundColor: colors.neutral[100] },
          }}
          aria-label="Open navigation menu"
        >
          <MenuIcon size={20} />
        </IconButton>
      </Box>

      {/* Right: Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Theme toggle */}
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton
            size="small"
            onClick={toggleTheme}
            sx={{
              color: colors.neutral[500],
              '&:hover': { backgroundColor: colors.neutral[100], color: colors.neutral[700] },
            }}
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Tooltip>

        {/* User menu */}
        <Tooltip title="Account">
          <IconButton
            size="small"
            onClick={handleUserMenuOpen}
            aria-controls={userMenuOpen ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            aria-label="Open user menu"
            sx={{
              ml: 0.5,
              width: 32,
              height: 32,
              borderRadius: '6px',
              backgroundColor: colors.primary[50],
              color: colors.primary[600],
              fontWeight: 600,
              fontSize: '0.75rem',
              '&:hover': { backgroundColor: colors.primary[100] },
            }}
          >
            {initials}
          </IconButton>
        </Tooltip>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                minWidth: 200,
                border: `1px solid ${colors.neutral[200]}`,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
              },
            },
          }}
        >
          {user && (
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary' }}>
                {user.email}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                {user.role.replace(/_/g, ' ')}
              </Typography>
            </Box>
          )}

          <Divider />

          <MenuItem
            onClick={handleUserMenuClose}
            dense
            sx={{ gap: 1.5, fontSize: '0.8125rem' }}
          >
            <User size={15} color={colors.neutral[500]} />
            Profile
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={handleLogout}
            dense
            sx={{ gap: 1.5, fontSize: '0.8125rem', color: colors.error[600] }}
          >
            <LogOut size={15} />
            Sign out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
