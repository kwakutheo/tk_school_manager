import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AttendanceStatus, Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardsService } from './dashboards.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const ADMIN_ID = '00000000-0000-0000-0000-000000000030';
const TEACHER_ID = '00000000-0000-0000-0000-000000000040';
const CLASS_A = '00000000-0000-0000-0000-000000000050';
const CLASS_B = '00000000-0000-0000-0000-000000000051';
const ACADEMIC_YEAR = '2026/2027';

function createPrismaMock() {
  return {
    user: {
      count: jest.fn<() => Promise<number>>(),
    },
    staffProfile: {
      count: jest.fn<() => Promise<number>>(),
    },
    studentProfile: {
      count: jest.fn<() => Promise<number>>(),
    },
    schoolClass: {
      count: jest.fn<() => Promise<number>>(),
      findMany: jest.fn<() => Promise<{ id: string }[]>>(),
    },
    attendanceSession: {
      count: jest.fn<() => Promise<number>>(),
    },
    attendanceEntry: {
      count: jest.fn<() => Promise<number>>(),
    },
    notification: {
      count: jest.fn<() => Promise<number>>(),
    },
  };
}

describe('DashboardsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: DashboardsService;

  const schoolAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000031',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  const teacher: IAuthenticatedUser = {
    id: TEACHER_ID,
    email: 'teacher@school.test',
    role: Role.CLASS_TEACHER,
    schoolId: SCHOOL_A,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DashboardsService(prisma as unknown as PrismaService);
  });

  it('builds an admin dashboard summary scoped to the current school', async () => {
    prisma.user.count.mockResolvedValue(12);
    prisma.staffProfile.count.mockResolvedValue(5);
    prisma.studentProfile.count.mockResolvedValue(100);
    prisma.schoolClass.count.mockResolvedValue(4);
    prisma.attendanceSession.count.mockResolvedValue(2);
    prisma.attendanceEntry.count
      .mockResolvedValueOnce(90)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(7);

    const result = await service.getAdminSummary(schoolAdmin, undefined, ` ${ACADEMIC_YEAR} `);

    expect(result).toEqual(
      expect.objectContaining({
        schoolId: SCHOOL_A,
        academicYear: ACADEMIC_YEAR,
        totals: {
          activeUsers: 12,
          activeStaff: 5,
          activeStudents: 100,
          activeClasses: 4,
        },
        notifications: {
          unreadMine: 1,
          pendingSchoolNotifications: 7,
        },
      }),
    );
    expect(result.attendanceToday.byStatus).toEqual({
      [AttendanceStatus.PRESENT]: 80,
      [AttendanceStatus.ABSENT]: 5,
      [AttendanceStatus.LATE]: 3,
      [AttendanceStatus.EXCUSED]: 2,
    });
    expect(prisma.schoolClass.count).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
    });
    expect(prisma.notification.count).toHaveBeenLastCalledWith({
      where: {
        schoolId: SCHOOL_A,
        status: 'PENDING',
      },
    });
  });

  it('requires platform admins to provide schoolId for admin dashboards', async () => {
    await expect(service.getAdminSummary(superAdmin)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('blocks school admins from requesting another school dashboard', async () => {
    await expect(service.getAdminSummary(schoolAdmin, SCHOOL_B)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('builds a teacher dashboard summary for assigned classes only', async () => {
    prisma.schoolClass.findMany.mockResolvedValue([{ id: CLASS_A }, { id: CLASS_B }]);
    prisma.studentProfile.count.mockResolvedValue(45);
    prisma.attendanceSession.count.mockResolvedValue(1);
    prisma.attendanceEntry.count
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(35)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prisma.notification.count.mockResolvedValue(3);

    const result = await service.getTeacherSummary(teacher, ACADEMIC_YEAR);

    expect(result).toEqual(
      expect.objectContaining({
        schoolId: SCHOOL_A,
        teacherId: TEACHER_ID,
        academicYear: ACADEMIC_YEAR,
        assignedClasses: 2,
        activeStudents: 45,
        notifications: {
          unreadMine: 3,
        },
      }),
    );
    expect(prisma.schoolClass.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        classTeacherId: TEACHER_ID,
        isActive: true,
        academicYear: ACADEMIC_YEAR,
      },
      select: { id: true },
    });
    expect(prisma.studentProfile.count).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        isActive: true,
        enrollments: {
          some: {
            classId: { in: [CLASS_A, CLASS_B] },
            status: 'ACTIVE',
            academicYear: ACADEMIC_YEAR,
          },
        },
      },
    });
  });

  it('returns zero class metrics for teachers with no assigned classes', async () => {
    prisma.schoolClass.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(2);

    const result = await service.getTeacherSummary(teacher);

    expect(result.assignedClasses).toBe(0);
    expect(result.activeStudents).toBe(0);
    expect(result.attendanceToday.entries).toBe(0);
    expect(result.notifications.unreadMine).toBe(2);
    expect(prisma.studentProfile.count).not.toHaveBeenCalled();
    expect(prisma.attendanceSession.count).not.toHaveBeenCalled();
    expect(prisma.attendanceEntry.count).not.toHaveBeenCalled();
  });

  it('requires a school context for teacher dashboards', async () => {
    await expect(
      service.getTeacherSummary({
        ...teacher,
        schoolId: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.schoolClass.findMany).not.toHaveBeenCalled();
  });
});
