import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, Subject } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectsService } from './subjects.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const SUBJECT_ID = '00000000-0000-0000-0000-000000000030';

function createSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: SUBJECT_ID,
    schoolId: SCHOOL_A,
    name: 'Mathematics',
    code: 'MATH',
    department: 'Science',
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
    subject: {
      create: jest.fn<() => Promise<Subject>>(),
      findMany: jest.fn<() => Promise<Subject[]>>(),
      findUnique: jest.fn<() => Promise<Subject | null>>(),
      update: jest.fn<() => Promise<Subject>>(),
    },
  };
}

function knownPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Known Prisma error', {
    code,
    clientVersion: 'test',
  });
}

describe('SubjectsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SubjectsService;

  const schoolAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@school.test',
    role: Role.ACADEMIC_COORDINATOR,
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
    service = new SubjectsService(prisma as unknown as PrismaService);
  });

  it('creates a subject in the current school after validating the school', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.subject.create.mockResolvedValue(createSubject());

    const result = await service.create(schoolAdmin, {
      name: ' Mathematics ',
      code: ' MATH ',
      department: ' Science ',
      schoolId: SCHOOL_A,
    });

    expect(result).toEqual(expect.objectContaining({ name: 'Mathematics', schoolId: SCHOOL_A }));
    expect(prisma.subject.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        name: 'Mathematics',
        code: 'MATH',
        department: 'Science',
      },
    });
  });

  it('requires platform users to provide schoolId when creating subjects', async () => {
    await expect(
      service.create(superAdmin, {
        name: 'Mathematics',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.subject.create).not.toHaveBeenCalled();
  });

  it('blocks school-scoped users from reading another school subject', async () => {
    prisma.subject.findUnique.mockResolvedValue(createSubject({ schoolId: SCHOOL_B }));

    await expect(service.findOne(schoolAdmin, SUBJECT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('filters list queries to active subjects when requested', async () => {
    prisma.subject.findMany.mockResolvedValue([createSubject()]);

    await service.findAll(schoolAdmin, undefined, true);

    expect(prisma.subject.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        isActive: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  });

  it('returns a clean duplicate-subject error', async () => {
    prisma.school.findUnique.mockResolvedValue({ id: SCHOOL_A, isActive: true });
    prisma.subject.create.mockRejectedValue(knownPrismaError('P2002'));

    await expect(
      service.create(schoolAdmin, {
        name: 'Mathematics',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes subjects to preserve exam history', async () => {
    prisma.subject.findUnique.mockResolvedValue(createSubject());
    prisma.subject.update.mockResolvedValue(createSubject({ isActive: false }));

    const result = await service.softDelete(schoolAdmin, SUBJECT_ID);

    expect(result.isActive).toBe(false);
    expect(prisma.subject.update).toHaveBeenCalledWith({
      where: { id: SUBJECT_ID },
      data: { isActive: false },
    });
  });
});
