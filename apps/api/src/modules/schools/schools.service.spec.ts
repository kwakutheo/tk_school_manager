import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { SchoolsService } from './schools.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';

function createSchool(overrides: Partial<School> = {}): School {
  return {
    id: SCHOOL_A,
    name: 'Tema International School',
    slug: 'tema-international-school',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    school: {
      create: jest.fn<() => Promise<School>>(),
      findMany: jest.fn<() => Promise<School[]>>(),
      findUnique: jest.fn<() => Promise<School | null>>(),
      update: jest.fn<() => Promise<School>>(),
    },
  };
}

function knownPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Known Prisma error', {
    code,
    clientVersion: 'test',
  });
}

describe('SchoolsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SchoolsService;

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  const schoolOwner: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'owner@school.test',
    role: Role.SCHOOL_OWNER,
    schoolId: SCHOOL_A,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SchoolsService(prisma as unknown as PrismaService);
  });

  it('normalizes school slugs on create', async () => {
    prisma.school.create.mockResolvedValue(createSchool());

    const result = await service.create({
      name: ' Tema International School ',
    });

    expect(result.slug).toBe('tema-international-school');
    expect(prisma.school.create).toHaveBeenCalledWith({
      data: {
        name: 'Tema International School',
        slug: 'tema-international-school',
      },
    });
  });

  it('rejects slugs without letters or numbers', async () => {
    await expect(
      service.create({
        name: '!!!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.school.create).not.toHaveBeenCalled();
  });

  it('returns a clean error for duplicate slugs', async () => {
    prisma.school.create.mockRejectedValue(knownPrismaError('P2002'));

    await expect(
      service.create({
        name: 'Tema International School',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks school-scoped users from reading another school', async () => {
    await expect(service.findOne(schoolOwner, SCHOOL_B)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.school.findUnique).not.toHaveBeenCalled();
  });

  it('returns not found for missing schools visible to platform users', async () => {
    prisma.school.findUnique.mockResolvedValue(null);

    await expect(service.findOne(superAdmin, SCHOOL_B)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a clean not found error when an update target disappears', async () => {
    prisma.school.update.mockRejectedValue(knownPrismaError('P2025'));

    await expect(
      service.update(superAdmin, SCHOOL_A, {
        name: 'Tema International School',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
