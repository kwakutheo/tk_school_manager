import { AttendanceStatus } from '@school-saas/config';

export interface IDashboardAttendanceStatusCounts {
  [AttendanceStatus.PRESENT]: number;
  [AttendanceStatus.ABSENT]: number;
  [AttendanceStatus.LATE]: number;
  [AttendanceStatus.EXCUSED]: number;
}

export interface IAdminDashboardSummary {
  schoolId: string;
  academicYear: string | null;
  generatedAt: Date;
  totals: {
    activeUsers: number;
    activeStaff: number;
    activeStudents: number;
    activeClasses: number;
  };
  attendanceToday: {
    date: Date;
    sessions: number;
    entries: number;
    byStatus: IDashboardAttendanceStatusCounts;
  };
  notifications: {
    unreadMine: number;
    pendingSchoolNotifications: number;
  };
}

export interface ITeacherDashboardSummary {
  schoolId: string;
  teacherId: string;
  academicYear: string | null;
  generatedAt: Date;
  assignedClasses: number;
  activeStudents: number;
  attendanceToday: {
    date: Date;
    sessions: number;
    entries: number;
    byStatus: IDashboardAttendanceStatusCounts;
  };
  notifications: {
    unreadMine: number;
  };
}
