import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role as PrismaRole, SchoolClass } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassesService } from './classes.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const TEACHER_ID = '00000000-0000-0000-0000-000000000030';

function createClass(overrides: Partial<SchoolClass> = {}): SchoolClass {
  return {
    id: '00000000-0000-0000-0000-000000000040',
    schoolId: SCHOOL_A,
    name: 'Basic 1',
    code: 'B1',
    level: 'Primary',
    section: 'A',
    academicYear: '2026/2027',
    classTeacherId: TEACHER_ID,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    school: {
      findUnique: jest.fn<() => Promise<{ id: string; isActive: boolean } | null>>(),
    },
    user: {
      findUnique:
        jest.fn<
          () => Promise<{ schoolId: string | null; role: PrismaRole; isActive: boolean } | null>
        >(),
    },
    schoolClass: {
      create: jest.fn<() => Promise<SchoolClass>>(),
      findMany: jest.fn<() => Promise<SchoolClass[]>>(),
      findUnique: jest.fn<() => Promise<SchoolClass | null>>(),
      update: jest.fn<() => Promise<SchoolClass>>(),
    },
  };
}

describe('ClassesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ClassesService;

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
    service = new ClassesService(prisma as unknown as PrismaService);
  });

  it('creates a class in the current school and validates the class teacher', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_A,
      role: PrismaRole.CLASS_TEACHER,
      isActive: true,
    });
    prisma.schoolClass.create.mockResolvedValue(createClass());

    const result = await service.create(schoolAdmin, {
      name: ' Basic 1 ',
      code: ' B1 ',
      level: ' Primary ',
      section: ' A ',
      academicYear: ' 2026/2027 ',
      schoolId: SCHOOL_A,
      classTeacherId: TEACHER_ID,
    });

    expect(result).toEqual(expect.objectContaining({ name: 'Basic 1', schoolId: SCHOOL_A }));
    expect(prisma.schoolClass.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        name: 'Basic 1',
        code: 'B1',
        level: 'Primary',
        section: 'A',
        academicYear: '2026/2027',
        classTeacherId: TEACHER_ID,
      },
    });
  });

  it('requires platform users to provide a schoolId when creating classes', async () => {
    await expect(
      service.create(superAdmin, {
        name: 'Basic 1',
        academicYear: '2026/2027',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks school-scoped users from creating classes in another school', async () => {
    await expect(
      service.create(schoolAdmin, {
        name: 'Basic 1',
        academicYear: '2026/2027',
        schoolId: SCHOOL_B,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.schoolClass.create).not.toHaveBeenCalled();
  });

  it('rejects class teachers from another school', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_B,
      role: PrismaRole.CLASS_TEACHER,
      isActive: true,
    });

    await expect(
      service.create(schoolAdmin, {
        name: 'Basic 1',
        academicYear: '2026/2027',
        classTeacherId: TEACHER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks class reads outside the current school', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClass({ schoolId: SCHOOL_B }));

    await expect(
      service.findOne(schoolAdmin, '00000000-0000-0000-0000-000000000040'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft deletes classes to preserve future enrollment history', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClass());
    prisma.schoolClass.update.mockResolvedValue(createClass({ isActive: false }));

    const result = await service.softDelete(schoolAdmin, '00000000-0000-0000-0000-000000000040');

    expect(result.isActive).toBe(false);
    expect(prisma.schoolClass.update).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000040' },
      data: { isActive: false },
    });
  });
});
