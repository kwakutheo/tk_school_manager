import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus as PrismaAttendanceStatus,
  EnrollmentStatus as PrismaEnrollmentStatus,
  Prisma,
} from '@prisma/client';
import { AttendanceStatus, Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceService } from './attendance.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const ADMIN_ID = '00000000-0000-0000-0000-000000000030';
const TEACHER_ID = '00000000-0000-0000-0000-000000000040';
const OTHER_TEACHER_ID = '00000000-0000-0000-0000-000000000041';
const CLASS_ID = '00000000-0000-0000-0000-000000000050';
const SESSION_ID = '00000000-0000-0000-0000-000000000060';
const STUDENT_A = '00000000-0000-0000-0000-000000000070';
const STUDENT_B = '00000000-0000-0000-0000-000000000071';
const ENROLLMENT_A = '00000000-0000-0000-0000-000000000080';
const ENROLLMENT_B = '00000000-0000-0000-0000-000000000081';
const ENTRY_ID = '00000000-0000-0000-0000-000000000090';
const ACADEMIC_YEAR = '2026/2027';

interface ClassScope {
  schoolId: string;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
}

type SessionWithEntries = AttendanceSession & {
  entries: AttendanceEntry[];
};

type SessionWithClassAndEntries = SessionWithEntries & {
  schoolClass: ClassScope;
};

type EntryWithSession = AttendanceEntry & {
  session: AttendanceSession & {
    schoolClass: ClassScope;
  };
};

function createClassScope(overrides: Partial<ClassScope> = {}): ClassScope {
  return {
    schoolId: SCHOOL_A,
    academicYear: ACADEMIC_YEAR,
    classTeacherId: TEACHER_ID,
    isActive: true,
    ...overrides,
  };
}

function createSession(overrides: Partial<AttendanceSession> = {}): AttendanceSession {
  return {
    id: SESSION_ID,
    schoolId: SCHOOL_A,
    classId: CLASS_ID,
    academicYear: ACADEMIC_YEAR,
    attendanceDate: new Date('2026-09-15T00:00:00.000Z'),
    takenById: ADMIN_ID,
    notes: 'Morning register',
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
    ...overrides,
  };
}

function createEntry(overrides: Partial<AttendanceEntry> = {}): AttendanceEntry {
  return {
    id: ENTRY_ID,
    schoolId: SCHOOL_A,
    sessionId: SESSION_ID,
    studentId: STUDENT_A,
    studentEnrollmentId: ENROLLMENT_A,
    status: PrismaAttendanceStatus.PRESENT,
    remarks: null,
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    schoolClass: {
      findUnique: jest.fn<() => Promise<ClassScope | null>>(),
    },
    studentEnrollment: {
      findMany: jest.fn<() => Promise<{ id: string; studentId: string }[]>>(),
    },
    attendanceSession: {
      create: jest.fn<() => Promise<SessionWithEntries>>(),
      findMany: jest.fn<() => Promise<AttendanceSession[]>>(),
      findUnique: jest.fn<() => Promise<SessionWithClassAndEntries | null>>(),
    },
    attendanceEntry: {
      findUnique: jest.fn<() => Promise<EntryWithSession | null>>(),
      update: jest.fn<() => Promise<AttendanceEntry>>(),
    },
  };
}

function knownPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Known Prisma error', {
    code,
    clientVersion: 'test',
  });
}

describe('AttendanceService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AttendanceService;

  const schoolAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const assignedTeacher: IAuthenticatedUser = {
    id: TEACHER_ID,
    email: 'teacher@school.test',
    role: Role.CLASS_TEACHER,
    schoolId: SCHOOL_A,
  };

  const otherTeacher: IAuthenticatedUser = {
    id: OTHER_TEACHER_ID,
    email: 'other.teacher@school.test',
    role: Role.TEACHER,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000031',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AttendanceService(prisma as unknown as PrismaService);
  });

  it('creates a class attendance session using active enrollments', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
      { id: ENROLLMENT_B, studentId: STUDENT_B },
    ]);
    prisma.attendanceSession.create.mockResolvedValue({
      ...createSession({ notes: 'Morning register' }),
      entries: [
        createEntry({ studentId: STUDENT_A, studentEnrollmentId: ENROLLMENT_A }),
        createEntry({
          id: '00000000-0000-0000-0000-000000000091',
          studentId: STUDENT_B,
          studentEnrollmentId: ENROLLMENT_B,
          status: PrismaAttendanceStatus.LATE,
          remarks: 'Traffic',
        }),
      ],
    });

    const result = await service.createSession(schoolAdmin, {
      classId: CLASS_ID,
      academicYear: ` ${ACADEMIC_YEAR} `,
      attendanceDate: '2026-09-15',
      notes: ' Morning register ',
      schoolId: SCHOOL_A,
      entries: [
        { studentId: STUDENT_A, status: AttendanceStatus.PRESENT },
        { studentId: STUDENT_B, status: AttendanceStatus.LATE, remarks: ' Traffic ' },
      ],
    });

    expect(result.entries).toHaveLength(2);
    expect(prisma.studentEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        status: PrismaEnrollmentStatus.ACTIVE,
        studentId: { in: [STUDENT_A, STUDENT_B] },
        student: {
          isActive: true,
        },
      },
      select: {
        id: true,
        studentId: true,
      },
    });
    expect(prisma.attendanceSession.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        attendanceDate: new Date('2026-09-15'),
        takenById: ADMIN_ID,
        notes: 'Morning register',
        entries: {
          create: [
            {
              schoolId: SCHOOL_A,
              studentId: STUDENT_A,
              studentEnrollmentId: ENROLLMENT_A,
              status: AttendanceStatus.PRESENT,
              remarks: null,
            },
            {
              schoolId: SCHOOL_A,
              studentId: STUDENT_B,
              studentEnrollmentId: ENROLLMENT_B,
              status: AttendanceStatus.LATE,
              remarks: 'Traffic',
            },
          ],
        },
      },
      include: {
        entries: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });
  });

  it('allows assigned class teachers to create attendance for their class', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
    ]);
    prisma.attendanceSession.create.mockResolvedValue({
      ...createSession({ takenById: TEACHER_ID }),
      entries: [createEntry()],
    });

    const result = await service.createSession(assignedTeacher, {
      classId: CLASS_ID,
      academicYear: ACADEMIC_YEAR,
      attendanceDate: '2026-09-15',
      entries: [{ studentId: STUDENT_A, status: AttendanceStatus.PRESENT }],
    });

    expect(result.takenById).toBe(TEACHER_ID);
    expect(prisma.attendanceSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          takenById: TEACHER_ID,
        }),
      }),
    );
  });

  it('rejects duplicate students in a single attendance session', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(
      service.createSession(schoolAdmin, {
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        attendanceDate: '2026-09-15',
        entries: [
          { studentId: STUDENT_A, status: AttendanceStatus.PRESENT },
          { studentId: STUDENT_A, status: AttendanceStatus.ABSENT },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
    expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
  });

  it('requires every entry to match an active enrollment in the class', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
    ]);

    await expect(
      service.createSession(schoolAdmin, {
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        attendanceDate: '2026-09-15',
        entries: [
          { studentId: STUDENT_A, status: AttendanceStatus.PRESENT },
          { studentId: STUDENT_B, status: AttendanceStatus.ABSENT },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceSession.create).not.toHaveBeenCalled();
  });

  it('blocks unassigned teachers from class attendance', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(
      service.findAll(otherTeacher, {
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled();
  });

  it('requires teacher attendance list views to include a classId', async () => {
    await expect(service.findAll(assignedTeacher)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled();
  });

  it('requires platform users to provide schoolId when listing attendance', async () => {
    await expect(service.findAll(superAdmin)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled();
  });

  it('returns a clean error when attendance is already recorded for the class date', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
    ]);
    prisma.attendanceSession.create.mockRejectedValue(knownPrismaError('P2002'));

    await expect(
      service.createSession(schoolAdmin, {
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        attendanceDate: '2026-09-15',
        entries: [{ studentId: STUDENT_A, status: AttendanceStatus.PRESENT }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds a session with entries for school admins', async () => {
    prisma.attendanceSession.findUnique.mockResolvedValue({
      ...createSession(),
      schoolClass: createClassScope(),
      entries: [createEntry()],
    });

    const result = await service.findOne(schoolAdmin, SESSION_ID);

    expect(result.entries).toHaveLength(1);
    expect(prisma.attendanceSession.findUnique).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      include: {
        schoolClass: {
          select: {
            schoolId: true,
            academicYear: true,
            classTeacherId: true,
            isActive: true,
          },
        },
        entries: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });
  });

  it('updates an attendance entry after validating class access', async () => {
    prisma.attendanceEntry.findUnique.mockResolvedValue({
      ...createEntry(),
      session: {
        ...createSession(),
        schoolClass: createClassScope(),
      },
    });
    prisma.attendanceEntry.update.mockResolvedValue(
      createEntry({
        status: PrismaAttendanceStatus.EXCUSED,
        remarks: 'Medical appointment',
      }),
    );

    const result = await service.updateEntry(assignedTeacher, ENTRY_ID, {
      status: AttendanceStatus.EXCUSED,
      remarks: ' Medical appointment ',
    });

    expect(result.status).toBe(AttendanceStatus.EXCUSED);
    expect(prisma.attendanceEntry.update).toHaveBeenCalledWith({
      where: { id: ENTRY_ID },
      data: {
        status: AttendanceStatus.EXCUSED,
        remarks: 'Medical appointment',
      },
    });
  });

  it('blocks attendance reads outside the current school', async () => {
    prisma.attendanceSession.findUnique.mockResolvedValue({
      ...createSession({ schoolId: SCHOOL_B }),
      schoolClass: createClassScope({ schoolId: SCHOOL_B }),
      entries: [],
    });

    await expect(service.findOne(schoolAdmin, SESSION_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
