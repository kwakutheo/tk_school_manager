import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EnrollmentStatus as PrismaEnrollmentStatus,
  Role as PrismaRole,
  StudentEnrollment,
  StudentProfile,
} from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentsService } from './students.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const STUDENT_ID = '00000000-0000-0000-0000-000000000030';
const USER_ID = '00000000-0000-0000-0000-000000000040';
const CLASS_ID = '00000000-0000-0000-0000-000000000050';
const ENROLLMENT_ID = '00000000-0000-0000-0000-000000000060';

function createStudent(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: STUDENT_ID,
    schoolId: SCHOOL_A,
    userId: USER_ID,
    admissionNumber: 'ADM-001',
    firstName: 'Ama',
    middleName: null,
    lastName: 'Mensah',
    dateOfBirth: new Date('2018-09-01T00:00:00.000Z'),
    gender: 'Female',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createEnrollment(overrides: Partial<StudentEnrollment> = {}): StudentEnrollment {
  return {
    id: ENROLLMENT_ID,
    schoolId: SCHOOL_A,
    studentId: STUDENT_ID,
    classId: CLASS_ID,
    academicYear: '2026/2027',
    status: PrismaEnrollmentStatus.ACTIVE,
    enrolledAt: new Date('2026-09-01T00:00:00.000Z'),
    exitedAt: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  const prisma = {
    school: {
      findUnique: jest.fn<() => Promise<any>>(),
    },
    user: {
      findUnique: jest.fn<() => Promise<any>>(),
    },
    schoolClass: {
      findUnique: jest.fn<() => Promise<any>>(),
    },
    studentProfile: {
      create: jest.fn<() => Promise<StudentProfile>>(),
      findMany: jest.fn<() => Promise<StudentProfile[]>>(),
      findUnique: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<StudentProfile>>(),
    },
    studentEnrollment: {
      create: jest.fn<() => Promise<StudentEnrollment>>(),
      findFirst: jest.fn<() => Promise<StudentEnrollment | null>>(),
      findMany: jest.fn<() => Promise<StudentEnrollment[]>>(),
      updateMany: jest.fn<() => Promise<any>>(),
    },
    $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(prisma)),
  };

  return prisma;
}

describe('StudentsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: StudentsService;

  const schoolAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new StudentsService(prisma as unknown as PrismaService);
  });

  it('creates a student with an initial enrollment inside the current school', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_A,
      role: PrismaRole.STUDENT,
      isActive: true,
    });
    prisma.schoolClass.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.studentProfile.create.mockResolvedValue(createStudent());
    prisma.studentEnrollment.create.mockResolvedValue(createEnrollment());

    const result = await service.create(schoolAdmin, {
      admissionNumber: ' ADM-001 ',
      firstName: ' Ama ',
      lastName: ' Mensah ',
      middleName: ' ',
      dateOfBirth: '2018-09-01',
      gender: ' Female ',
      schoolId: SCHOOL_A,
      userId: USER_ID,
      classId: CLASS_ID,
      academicYear: ' 2026/2027 ',
    });

    expect(result).toEqual(
      expect.objectContaining({
        admissionNumber: 'ADM-001',
        schoolId: SCHOOL_A,
        userId: USER_ID,
      }),
    );
    expect(prisma.studentProfile.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        userId: USER_ID,
        admissionNumber: 'ADM-001',
        firstName: 'Ama',
        middleName: null,
        lastName: 'Mensah',
        dateOfBirth: new Date('2018-09-01'),
        gender: 'Female',
      },
    });
    expect(prisma.studentEnrollment.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        academicYear: '2026/2027',
        status: PrismaEnrollmentStatus.ACTIVE,
      },
    });
  });

  it('requires platform users to provide a schoolId when creating students', async () => {
    await expect(
      service.create(superAdmin, {
        admissionNumber: 'ADM-001',
        firstName: 'Ama',
        lastName: 'Mensah',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks school users from creating students in another school', async () => {
    await expect(
      service.create(schoolAdmin, {
        admissionNumber: 'ADM-001',
        firstName: 'Ama',
        lastName: 'Mensah',
        schoolId: SCHOOL_B,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.studentProfile.create).not.toHaveBeenCalled();
  });

  it('requires initial enrollment to include both classId and academicYear', async () => {
    await expect(
      service.create(schoolAdmin, {
        admissionNumber: 'ADM-001',
        firstName: 'Ama',
        lastName: 'Mensah',
        classId: CLASS_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects linked users that are not active STUDENT users in the same school', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_A,
      role: PrismaRole.PARENT,
      isActive: true,
    });

    await expect(
      service.create(schoolAdmin, {
        admissionNumber: 'ADM-001',
        firstName: 'Ama',
        lastName: 'Mensah',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks student reads outside the current school', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent({ schoolId: SCHOOL_B }));

    await expect(service.findOne(schoolAdmin, STUDENT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('validates class filters before listing students', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.studentProfile.findMany.mockResolvedValue([createStudent()]);

    const result = await service.findAll(schoolAdmin, {
      classId: CLASS_ID,
      academicYear: '2026/2027',
    });

    expect(result).toHaveLength(1);
    expect(prisma.studentProfile.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        enrollments: {
          some: {
            classId: CLASS_ID,
            academicYear: '2026/2027',
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { admissionNumber: 'asc' }],
    });
  });

  it('prevents a second active enrollment in the same academic year', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent());
    prisma.schoolClass.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.studentEnrollment.findFirst.mockResolvedValue(createEnrollment());

    await expect(
      service.createEnrollment(schoolAdmin, STUDENT_ID, {
        classId: CLASS_ID,
        academicYear: '2026/2027',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.create).not.toHaveBeenCalled();
  });

  it('creates an active enrollment for an active student', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent());
    prisma.schoolClass.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.studentEnrollment.findFirst.mockResolvedValue(null);
    prisma.studentEnrollment.create.mockResolvedValue(createEnrollment());

    const result = await service.createEnrollment(schoolAdmin, STUDENT_ID, {
      classId: CLASS_ID,
      academicYear: '2026/2027',
    });

    expect(result).toEqual(expect.objectContaining({ status: PrismaEnrollmentStatus.ACTIVE }));
    expect(prisma.studentEnrollment.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        studentId: STUDENT_ID,
        classId: CLASS_ID,
        academicYear: '2026/2027',
        status: PrismaEnrollmentStatus.ACTIVE,
      },
    });
  });

  it('withdraws active enrollments when a student is deactivated', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent());
    prisma.studentEnrollment.updateMany.mockResolvedValue({ count: 1 });
    prisma.studentProfile.update.mockResolvedValue(createStudent({ isActive: false }));

    const result = await service.softDelete(schoolAdmin, STUDENT_ID);

    expect(result.isActive).toBe(false);
    expect(prisma.studentEnrollment.updateMany).toHaveBeenCalledWith({
      where: {
        studentId: STUDENT_ID,
        status: PrismaEnrollmentStatus.ACTIVE,
      },
      data: {
        status: PrismaEnrollmentStatus.WITHDRAWN,
        exitedAt: expect.any(Date),
      },
    });
    expect(prisma.studentProfile.update).toHaveBeenCalledWith({
      where: { id: STUDENT_ID },
      data: { isActive: false },
    });
  });
});
