import { EnrollmentStatus } from '@school-saas/config';

export interface IStudentProfile {
  id: string;
  schoolId: string;
  userId: string | null;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentEnrollment {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  academicYear: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  exitedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
