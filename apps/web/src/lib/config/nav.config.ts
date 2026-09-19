/**
 * Navigation configuration for the Scholentra dashboard sidebar.
 * Items are organized by user workflow, not by API module.
 * Permissions are enforced server-side; we show/hide here for UX clarity.
 */
import { Role } from '@school-saas/config';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  roles?: Role[]; // undefined = all authenticated users
  children?: NavItem[];
  badge?: 'notifications';
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

/**
 * Sidebar navigation — grouped by workflow area.
 * Roles listed are the *minimum* roles that should see each item.
 */
export const navConfig: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
      },
    ],
  },
  {
    group: 'Academic',
    items: [
      {
        label: 'Students',
        href: '/dashboard/students',
        icon: 'Users',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.VICE_PRINCIPAL,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
          Role.ADMIN_OFFICER,
          Role.CLASS_TEACHER,
          Role.TEACHER,
        ],
      },
      {
        label: 'Staff',
        href: '/dashboard/staff',
        icon: 'UserCog',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.VICE_PRINCIPAL,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
        ],
      },
      {
        label: 'Classes',
        href: '/dashboard/classes',
        icon: 'BookOpen',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.VICE_PRINCIPAL,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
          Role.CLASS_TEACHER,
          Role.TEACHER,
        ],
      },
      {
        label: 'Subjects',
        href: '/dashboard/subjects',
        icon: 'Library',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
          Role.HEAD_OF_DEPARTMENT,
          Role.TEACHER,
        ],
      },
    ],
  },
  {
    group: 'Operations',
    items: [
      {
        label: 'Attendance',
        href: '/dashboard/attendance',
        icon: 'CalendarCheck',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.VICE_PRINCIPAL,
          Role.SCHOOL_ADMIN,
          Role.CLASS_TEACHER,
          Role.TEACHER,
        ],
      },
      {
        label: 'Exams & Results',
        href: '/dashboard/exams',
        icon: 'FileText',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
          Role.EXAM_OFFICER,
          Role.TEACHER,
        ],
      },
    ],
  },
  {
    group: 'Finance',
    items: [
      {
        label: 'Invoices',
        href: '/dashboard/finance/invoices',
        icon: 'Receipt',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.SCHOOL_ADMIN,
          Role.ACCOUNTANT,
        ],
      },
      {
        label: 'Payments',
        href: '/dashboard/finance/payments',
        icon: 'CreditCard',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.SCHOOL_ADMIN,
          Role.ACCOUNTANT,
        ],
      },
    ],
  },
  {
    group: 'Reports',
    items: [
      {
        label: 'Reports',
        href: '/dashboard/reports',
        icon: 'BarChart2',
        roles: [
          Role.SUPER_ADMIN,
          Role.SCHOOL_OWNER,
          Role.HEADMASTER,
          Role.VICE_PRINCIPAL,
          Role.SCHOOL_ADMIN,
          Role.ACADEMIC_COORDINATOR,
        ],
      },
    ],
  },
  {
    group: 'Administration',
    items: [
      {
        label: 'Schools',
        href: '/dashboard/schools',
        icon: 'Building2',
        roles: [Role.SUPER_ADMIN],
      },
      {
        label: 'Users',
        href: '/dashboard/users',
        icon: 'ShieldCheck',
        roles: [Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_ADMIN],
      },
      {
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: 'Bell',
        badge: 'notifications',
      },
      {
        label: 'Audit Log',
        href: '/dashboard/audit-log',
        icon: 'ScrollText',
        roles: [Role.SUPER_ADMIN, Role.SYSTEM_AUDITOR, Role.SUPPORT_ADMIN],
      },
    ],
  },
];
