import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, Role as PrismaRole, StaffProfile } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffService } from './staff.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const STAFF_ID = '00000000-0000-0000-0000-000000000030';
const USER_ID = '00000000-0000-0000-0000-000000000040';

function createStaff(overrides: Partial<StaffProfile> = {}): StaffProfile {
  return {
    id: STAFF_ID,
    schoolId: SCHOOL_A,
    userId: USER_ID,
    staffNumber: 'STF-001',
    firstName: 'Kofi',
    middleName: null,
    lastName: 'Mensah',
    phoneNumber: '+233200000000',
    jobTitle: 'Teacher',
    department: 'Primary',
    hireDate: new Date('2026-01-10T00:00:00.000Z'),
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
    staffProfile: {
      create: jest.fn<() => Promise<StaffProfile>>(),
      findMany: jest.fn<() => Promise<StaffProfile[]>>(),
      findUnique: jest.fn<() => Promise<StaffProfile | null>>(),
      update: jest.fn<() => Promise<StaffProfile>>(),
    },
  };
}

function knownPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Known Prisma error', {
    code,
    clientVersion: 'test',
  });
}

describe('StaffService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: StaffService;

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
    service = new StaffService(prisma as unknown as PrismaService);
  });

  it('creates staff profiles in the current school and validates the linked user', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_A,
      role: PrismaRole.TEACHER,
      isActive: true,
    });
    prisma.staffProfile.create.mockResolvedValue(createStaff());

    const result = await service.create(schoolAdmin, {
      staffNumber: ' STF-001 ',
      firstName: ' Kofi ',
      middleName: ' ',
      lastName: ' Mensah ',
      phoneNumber: ' +233200000000 ',
      jobTitle: ' Teacher ',
      department: ' Primary ',
      hireDate: '2026-01-10',
      schoolId: SCHOOL_A,
      userId: USER_ID,
    });

    expect(result).toEqual(
      expect.objectContaining({
        staffNumber: 'STF-001',
        schoolId: SCHOOL_A,
        userId: USER_ID,
      }),
    );
    expect(prisma.staffProfile.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        userId: USER_ID,
        staffNumber: 'STF-001',
        firstName: 'Kofi',
        middleName: null,
        lastName: 'Mensah',
        phoneNumber: '+233200000000',
        jobTitle: 'Teacher',
        department: 'Primary',
        hireDate: new Date('2026-01-10'),
      },
    });
  });

  it('requires platform users to provide a schoolId when creating staff', async () => {
    await expect(
      service.create(superAdmin, {
        staffNumber: 'STF-001',
        firstName: 'Kofi',
        lastName: 'Mensah',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks school-scoped users from creating staff in another school', async () => {
    await expect(
      service.create(schoolAdmin, {
        staffNumber: 'STF-001',
        firstName: 'Kofi',
        lastName: 'Mensah',
        schoolId: SCHOOL_B,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.staffProfile.create).not.toHaveBeenCalled();
  });

  it('rejects linked users that are not active staff users in the same school', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.user.findUnique.mockResolvedValue({
      schoolId: SCHOOL_A,
      role: PrismaRole.STUDENT,
      isActive: true,
    });

    await expect(
      service.create(schoolAdmin, {
        staffNumber: 'STF-001',
        firstName: 'Kofi',
        lastName: 'Mensah',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a clean error for duplicate staff numbers or linked users', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.staffProfile.create.mockRejectedValue(knownPrismaError('P2002'));

    await expect(
      service.create(schoolAdmin, {
        staffNumber: 'STF-001',
        firstName: 'Kofi',
        lastName: 'Mensah',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists staff only inside the current school', async () => {
    prisma.staffProfile.findMany.mockResolvedValue([createStaff()]);

    const result = await service.findAll(schoolAdmin);

    expect(result).toHaveLength(1);
    expect(prisma.staffProfile.findMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { staffNumber: 'asc' }],
    });
  });

  it('blocks staff reads outside the current school', async () => {
    prisma.staffProfile.findUnique.mockResolvedValue(createStaff({ schoolId: SCHOOL_B }));

    await expect(service.findOne(schoolAdmin, STAFF_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft deletes staff profiles to preserve history', async () => {
    prisma.staffProfile.findUnique.mockResolvedValue(createStaff());
    prisma.staffProfile.update.mockResolvedValue(createStaff({ isActive: false }));

    const result = await service.softDelete(schoolAdmin, STAFF_ID);

    expect(result.isActive).toBe(false);
    expect(prisma.staffProfile.update).toHaveBeenCalledWith({
      where: { id: STAFF_ID },
      data: { isActive: false },
    });
  });
});
