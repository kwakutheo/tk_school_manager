import { AttendanceStatus } from '@school-saas/config';

export interface IAttendanceEntry {
  id: string;
  schoolId: string;
  sessionId: string;
  studentId: string;
  studentEnrollmentId: string;
  status: AttendanceStatus;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSession {
  id: string;
  schoolId: string;
  classId: string;
  academicYear: string;
  attendanceDate: Date;
  takenById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSessionWithEntries extends IAttendanceSession {
  entries: IAttendanceEntry[];
}
