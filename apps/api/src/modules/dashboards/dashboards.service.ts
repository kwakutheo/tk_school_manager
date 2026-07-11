import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  AttendanceStatus as PrismaAttendanceStatus,
  EnrollmentStatus as PrismaEnrollmentStatus,
  NotificationStatus as PrismaNotificationStatus,
  Prisma,
} from '@prisma/client';
import { AttendanceStatus, isPlatformRole } from '@school-saas/config';
import {
  IAdminDashboardSummary,
  IAuthenticatedUser,
  IDashboardAttendanceStatusCounts,
  ITeacherDashboardSummary,
} from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminSummary(
    currentUser: IAuthenticatedUser,
    schoolId?: string,
    academicYear?: string,
  ): Promise<IAdminDashboardSummary> {
    const resolvedSchoolId = this.resolveSchoolId(currentUser, schoolId);
    const resolvedAcademicYear = this.optionalClean(academicYear);
    const today = this.todayDateOnly();

    const classWhere: Prisma.SchoolClassWhereInput = {
      schoolId: resolvedSchoolId,
      isActive: true,
      ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
    };
    const attendanceSessionWhere: Prisma.AttendanceSessionWhereInput = {
      schoolId: resolvedSchoolId,
      attendanceDate: today,
      ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
    };
    const attendanceEntryWhere: Prisma.AttendanceEntryWhereInput = {
      schoolId: resolvedSchoolId,
      session: {
        attendanceDate: today,
        ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
      },
    };

    const [
      activeUsers,
      activeStaff,
      activeStudents,
      activeClasses,
      attendanceSessions,
      attendanceEntries,
      presentToday,
      absentToday,
      lateToday,
      excusedToday,
      unreadMine,
      pendingSchoolNotifications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { schoolId: resolvedSchoolId, isActive: true } }),
      this.prisma.staffProfile.count({ where: { schoolId: resolvedSchoolId, isActive: true } }),
      this.prisma.studentProfile.count({
        where: { schoolId: resolvedSchoolId, isActive: true },
      }),
      this.prisma.schoolClass.count({ where: classWhere }),
      this.prisma.attendanceSession.count({ where: attendanceSessionWhere }),
      this.prisma.attendanceEntry.count({ where: attendanceEntryWhere }),
      this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.PRESENT),
      this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.ABSENT),
      this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.LATE),
      this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.EXCUSED),
      this.prisma.notification.count({
        where: {
          schoolId: resolvedSchoolId,
          recipientId: currentUser.id,
          readAt: null,
        },
      }),
      this.prisma.notification.count({
        where: {
          schoolId: resolvedSchoolId,
          status: PrismaNotificationStatus.PENDING,
        },
      }),
    ]);

    return {
      schoolId: resolvedSchoolId,
      academicYear: resolvedAcademicYear,
      generatedAt: new Date(),
      totals: {
        activeUsers,
        activeStaff,
        activeStudents,
        activeClasses,
      },
      attendanceToday: {
        date: today,
        sessions: attendanceSessions,
        entries: attendanceEntries,
        byStatus: this.toStatusCounts(presentToday, absentToday, lateToday, excusedToday),
      },
      notifications: {
        unreadMine,
        pendingSchoolNotifications,
      },
    };
  }

  async getTeacherSummary(
    currentUser: IAuthenticatedUser,
    academicYear?: string,
  ): Promise<ITeacherDashboardSummary> {
    if (!currentUser.schoolId) {
      throw new ForbiddenException('Teacher dashboard requires a school context');
    }

    const resolvedAcademicYear = this.optionalClean(academicYear);
    const today = this.todayDateOnly();
    const assignedClasses = await this.prisma.schoolClass.findMany({
      where: {
        schoolId: currentUser.schoolId,
        classTeacherId: currentUser.id,
        isActive: true,
        ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
      },
      select: { id: true },
    });
    const classIds = assignedClasses.map((schoolClass) => schoolClass.id);

    const attendanceSessionWhere: Prisma.AttendanceSessionWhereInput = {
      schoolId: currentUser.schoolId,
      classId: { in: classIds },
      attendanceDate: today,
      ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
    };
    const attendanceEntryWhere: Prisma.AttendanceEntryWhereInput = {
      schoolId: currentUser.schoolId,
      session: {
        classId: { in: classIds },
        attendanceDate: today,
        ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
      },
    };

    const [
      activeStudents,
      attendanceSessions,
      attendanceEntries,
      presentToday,
      absentToday,
      lateToday,
      excusedToday,
      unreadMine,
    ] = classIds.length
      ? await Promise.all([
          this.prisma.studentProfile.count({
            where: {
              schoolId: currentUser.schoolId,
              isActive: true,
              enrollments: {
                some: {
                  classId: { in: classIds },
                  status: PrismaEnrollmentStatus.ACTIVE,
                  ...(resolvedAcademicYear ? { academicYear: resolvedAcademicYear } : {}),
                },
              },
            },
          }),
          this.prisma.attendanceSession.count({ where: attendanceSessionWhere }),
          this.prisma.attendanceEntry.count({ where: attendanceEntryWhere }),
          this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.PRESENT),
          this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.ABSENT),
          this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.LATE),
          this.countAttendanceStatus(attendanceEntryWhere, AttendanceStatus.EXCUSED),
          this.prisma.notification.count({
            where: {
              schoolId: currentUser.schoolId,
              recipientId: currentUser.id,
              readAt: null,
            },
          }),
        ])
      : await Promise.all([
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          Promise.resolve(0),
          this.prisma.notification.count({
            where: {
              schoolId: currentUser.schoolId,
              recipientId: currentUser.id,
              readAt: null,
            },
          }),
        ]);

    return {
      schoolId: currentUser.schoolId,
      teacherId: currentUser.id,
      academicYear: resolvedAcademicYear,
      generatedAt: new Date(),
      assignedClasses: classIds.length,
      activeStudents,
      attendanceToday: {
        date: today,
        sessions: attendanceSessions,
        entries: attendanceEntries,
        byStatus: this.toStatusCounts(presentToday, absentToday, lateToday, excusedToday),
      },
      notifications: {
        unreadMine,
      },
    };
  }

  private resolveSchoolId(currentUser: IAuthenticatedUser, requestedSchoolId?: string): string {
    if (isPlatformRole(currentUser.role)) {
      if (!requestedSchoolId) {
        throw new BadRequestException('A schoolId is required');
      }

      return requestedSchoolId;
    }

    if (!currentUser.schoolId) {
      throw new ForbiddenException('School-scoped user is missing a school context');
    }

    if (requestedSchoolId && requestedSchoolId !== currentUser.schoolId) {
      throw new ForbiddenException('You cannot access dashboards outside your school');
    }

    return currentUser.schoolId;
  }

  private countAttendanceStatus(
    where: Prisma.AttendanceEntryWhereInput,
    status: AttendanceStatus,
  ): Promise<number> {
    return this.prisma.attendanceEntry.count({
      where: {
        ...where,
        status: status as PrismaAttendanceStatus,
      },
    });
  }

  private toStatusCounts(
    present: number,
    absent: number,
    late: number,
    excused: number,
  ): IDashboardAttendanceStatusCounts {
    return {
      [AttendanceStatus.PRESENT]: present,
      [AttendanceStatus.ABSENT]: absent,
      [AttendanceStatus.LATE]: late,
      [AttendanceStatus.EXCUSED]: excused,
    };
  }

  private optionalClean(value: string | undefined): string | null {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private todayDateOnly(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
