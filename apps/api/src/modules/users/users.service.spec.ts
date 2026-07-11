import { ForbiddenException } from '@nestjs/common';
import { Role as PrismaRole, User } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    schoolId: SCHOOL_A,
    email: 'teacher@example.com',
    passwordHash: 'hashed-password',
    role: PrismaRole.TEACHER,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    user: {
      create: jest.fn<() => Promise<User>>(),
      findMany: jest.fn<() => Promise<User[]>>(),
      findUnique: jest.fn<() => Promise<User | null>>(),
      update: jest.fn<() => Promise<User>>(),
    },
  };
}

describe('UsersService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: UsersService;

  const schoolAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('creates school-scoped users inside the current school', async () => {
    prisma.user.create.mockResolvedValue(createUser({ email: 'teacher@example.com' }));

    const result = await service.create(schoolAdmin, {
      email: ' Teacher@Example.COM ',
      password: 'SecurePass123',
      role: Role.TEACHER,
      schoolId: SCHOOL_A,
    });

    expect(result).toEqual(
      expect.objectContaining({
        email: 'teacher@example.com',
        role: Role.TEACHER,
        schoolId: SCHOOL_A,
      }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'teacher@example.com',
        role: Role.TEACHER,
        schoolId: SCHOOL_A,
      }),
    });
  });

  it('blocks school admins from creating users in another school', async () => {
    await expect(
      service.create(schoolAdmin, {
        email: 'teacher@example.com',
        password: 'SecurePass123',
        role: Role.TEACHER,
        schoolId: SCHOOL_B,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('blocks school admins from creating platform users', async () => {
    await expect(
      service.create(schoolAdmin, {
        email: 'support@example.com',
        password: 'SecurePass123',
        role: Role.SUPPORT_ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets SUPER_ADMIN create platform users without a school', async () => {
    prisma.user.create.mockResolvedValue(
      createUser({
        email: 'support@example.com',
        role: PrismaRole.SUPPORT_ADMIN,
        schoolId: null,
      }),
    );

    const result = await service.create(superAdmin, {
      email: 'support@example.com',
      password: 'SecurePass123',
      role: Role.SUPPORT_ADMIN,
    });

    expect(result.schoolId).toBeNull();
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: Role.SUPPORT_ADMIN,
        schoolId: null,
      }),
    });
  });

  it('blocks school-scoped user listing outside the current school', async () => {
    await expect(service.findAll(schoolAdmin, SCHOOL_B)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('blocks single-user reads outside the current school', async () => {
    prisma.user.findUnique.mockResolvedValue(createUser({ schoolId: SCHOOL_B }));

    await expect(
      service.findOne(schoolAdmin, '00000000-0000-0000-0000-000000000004'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
