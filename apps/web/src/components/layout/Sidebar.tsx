'use client';

/**
 * Sidebar — primary navigation component.
 *
 * Features:
 * - Collapsible on desktop (icon-only mode)
 * - Grouped by workflow area (not by API module)
 * - Active route highlighting
 * - Role-aware item visibility (driven by nav.config)
 * - Lucide icons throughout (no MUI icons)
 * - Responsive: collapses to off-canvas on mobile
 */

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  Typography,
  Tooltip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Library,
  CalendarCheck,
  FileText,
  Receipt,
  CreditCard,
  BarChart2,
  Building2,
  ShieldCheck,
  Bell,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LucideIcon,
} from 'lucide-react';
import { navConfig, NavItem } from '@/lib/config/nav.config';
import { colors } from '@/lib/theme/tokens';
import { useAuthStore } from '@/lib/store/auth.store';
import { Role } from '@school-saas/config';

// ----- Lucide icon registry (single source of truth) -----
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Library,
  CalendarCheck,
  FileText,
  Receipt,
  CreditCard,
  BarChart2,
  Building2,
  ShieldCheck,
  Bell,
  ScrollText,
};

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItemComponent({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  const activeStyle = {
    backgroundColor: colors.primary[50],
    color: colors.primary[600],
    '& .nav-icon': { color: colors.primary[600] },
    '&:hover': { backgroundColor: colors.primary[100] },
  };

  const inactiveStyle = {
    color: colors.neutral[700],
    '& .nav-icon': { color: colors.neutral[500] },
    '&:hover': {
      backgroundColor: colors.neutral[100],
      '& .nav-icon': { color: colors.neutral[700] },
    },
  };

  const content = (
    <Box
      component={Link}
      href={item.href}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: collapsed ? 0 : 1.5,
        py: '7px',
        borderRadius: '6px',
        textDecoration: 'none',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        width: '100%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        ...(isActive ? activeStyle : inactiveStyle),
      }}
    >
      <Icon
        className="nav-icon"
        size={18}
        strokeWidth={isActive ? 2.25 : 1.75}
        style={{ flexShrink: 0 }}
      />
      {!collapsed && (
        <Typography
          component="span"
          sx={{
            fontSize: '0.8125rem',
            fontWeight: isActive ? 600 : 400,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </Typography>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {content}
        </Box>
      </Tooltip>
    );
  }

  return content;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}) {
  const { user } = useAuthStore();
  const userRole = user?.role as Role | undefined;

  function hasAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
        borderRight: `1px solid ${colors.neutral[200]}`,
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          height: 60,
          borderBottom: `1px solid ${colors.neutral[200]}`,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GraduationCap size={22} color={colors.primary[500]} strokeWidth={2} />
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: colors.primary[600],
                letterSpacing: '-0.01em',
              }}
            >
              Scholentra
            </Typography>
          </Box>
        )}
        {collapsed && (
          <GraduationCap size={22} color={colors.primary[500]} strokeWidth={2} />
        )}

        {onToggleCollapse && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              ml: collapsed ? 'auto' : 0,
              mr: collapsed ? 'auto' : 0,
              color: colors.neutral[500],
              '&:hover': { backgroundColor: colors.neutral[100] },
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </IconButton>
        )}
      </Box>

      {/* Navigation Groups */}
      <Box
        component="nav"
        sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5, px: collapsed ? 1 : 1.5 }}
      >
        {navConfig.map((group, groupIndex) => {
          const visibleItems = group.items.filter(hasAccess);
          if (visibleItems.length === 0) return null;

          return (
            <Box key={group.group} sx={{ mb: 0.5 }}>
              {!collapsed && (
                <Typography
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: colors.neutral[400],
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    px: 1.5,
                    py: 0.75,
                    display: 'block',
                  }}
                >
                  {group.group}
                </Typography>
              )}

              {collapsed && groupIndex > 0 && (
                <Divider sx={{ my: 1, borderColor: colors.neutral[200] }} />
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {visibleItems.map((item) => (
                  <NavItemComponent key={item.href} item={item} collapsed={collapsed} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Bottom — User info */}
      {user && !collapsed && (
        <Box
          sx={{
            borderTop: `1px solid ${colors.neutral[200]}`,
            px: 2,
            py: 1.5,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }}>
            {user.email}
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.25 }}>
            {user.role.replace(/_/g, ' ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <SidebarContent collapsed={false} />
      </Drawer>
    </>
  );
}
