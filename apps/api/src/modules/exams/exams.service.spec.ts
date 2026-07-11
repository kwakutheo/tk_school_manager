import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  Exam,
  ExamResult,
  ExamStatus as PrismaExamStatus,
  Prisma,
} from '@prisma/client';
import { AcademicTerm, ExamStatus, Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ExamsService } from './exams.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const ADMIN_ID = '00000000-0000-0000-0000-000000000030';
const TEACHER_ID = '00000000-0000-0000-0000-000000000040';
const OTHER_TEACHER_ID = '00000000-0000-0000-0000-000000000041';
const CLASS_ID = '00000000-0000-0000-0000-000000000050';
const SUBJECT_ID = '00000000-0000-0000-0000-000000000060';
const EXAM_ID = '00000000-0000-0000-0000-000000000070';
const STUDENT_A = '00000000-0000-0000-0000-000000000080';
const STUDENT_B = '00000000-0000-0000-0000-000000000081';
const ENROLLMENT_A = '00000000-0000-0000-0000-000000000090';
const ENROLLMENT_B = '00000000-0000-0000-0000-000000000091';
const RESULT_ID = '00000000-0000-0000-0000-000000000100';
const ACADEMIC_YEAR = '2026/2027';

interface ClassScope {
  schoolId: string;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
}

type ExamFindUniqueResult =
  | (Exam & {
      schoolClass: ClassScope;
      results?: ExamResult[];
    })
  | null;

function createClassScope(overrides: Partial<ClassScope> = {}): ClassScope {
  return {
    schoolId: SCHOOL_A,
    academicYear: ACADEMIC_YEAR,
    classTeacherId: TEACHER_ID,
    isActive: true,
    ...overrides,
  };
}

function createExam(overrides: Partial<Exam> = {}): Exam {
  return {
    id: EXAM_ID,
    schoolId: SCHOOL_A,
    classId: CLASS_ID,
    subjectId: SUBJECT_ID,
    academicYear: ACADEMIC_YEAR,
    term: PrismaAcademicTerm.FIRST_TERM,
    title: 'End of Term Exam',
    examDate: new Date('2026-12-10T00:00:00.000Z'),
    maxScore: new Prisma.Decimal(100),
    weight: new Prisma.Decimal(40),
    status: PrismaExamStatus.DRAFT,
    createdById: ADMIN_ID,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createExamWithClass(
  examOverrides: Partial<Exam> = {},
  classOverrides: Partial<ClassScope> = {},
): Exam & { schoolClass: ClassScope } {
  return {
    ...createExam(examOverrides),
    schoolClass: createClassScope(classOverrides),
  };
}

function createResult(overrides: Partial<ExamResult> = {}): ExamResult {
  return {
    id: RESULT_ID,
    schoolId: SCHOOL_A,
    examId: EXAM_ID,
    studentId: STUDENT_A,
    studentEnrollmentId: ENROLLMENT_A,
    score: new Prisma.Decimal(90),
    grade: 'A',
    remarks: null,
    recordedById: ADMIN_ID,
    createdAt: new Date('2026-12-11T00:00:00.000Z'),
    updatedAt: new Date('2026-12-11T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    schoolClass: {
      findUnique: jest.fn<() => Promise<ClassScope | null>>(),
    },
    subject: {
      findUnique: jest.fn<() => Promise<{ schoolId: string; isActive: boolean } | null>>(),
    },
    studentEnrollment: {
      findMany: jest.fn<() => Promise<{ id: string; studentId: string }[]>>(),
    },
    exam: {
      create: jest.fn<() => Promise<Exam>>(),
      findMany: jest.fn<() => Promise<Exam[]>>(),
      findUnique: jest.fn<() => Promise<ExamFindUniqueResult>>(),
      update: jest.fn<() => Promise<Exam>>(),
    },
    examResult: {
      findFirst: jest.fn<() => Promise<{ id: string } | null>>(),
      upsert: jest.fn<() => Promise<ExamResult>>(),
    },
    $transaction: jest.fn<(operations: Promise<ExamResult>[]) => Promise<ExamResult[]>>(),
  };
}

describe('ExamsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ExamsService;

  const schoolAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'admin@school.test',
    role: Role.ACADEMIC_COORDINATOR,
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
    prisma.$transaction.mockImplementation(async (operations) => Promise.all(operations));
    service = new ExamsService(prisma as unknown as PrismaService);
  });

  it('creates an exam after validating class and subject scope', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.subject.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.exam.create.mockResolvedValue(createExam());

    const result = await service.create(schoolAdmin, {
      classId: CLASS_ID,
      subjectId: SUBJECT_ID,
      academicYear: ` ${ACADEMIC_YEAR} `,
      term: AcademicTerm.FIRST_TERM,
      title: ' End of Term Exam ',
      examDate: '2026-12-10',
      maxScore: 100,
      weight: 40,
      schoolId: SCHOOL_A,
    });

    expect(result.maxScore).toBe(100);
    expect(prisma.exam.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        subjectId: SUBJECT_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'End of Term Exam',
        examDate: new Date('2026-12-10'),
        maxScore: 100,
        weight: 40,
        status: ExamStatus.DRAFT,
        createdById: ADMIN_ID,
      },
    });
  });

  it('allows assigned class teachers to create exams for their class', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.subject.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.exam.create.mockResolvedValue(createExam({ createdById: TEACHER_ID }));

    const result = await service.create(assignedTeacher, {
      classId: CLASS_ID,
      subjectId: SUBJECT_ID,
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      title: 'Class Quiz',
      examDate: '2026-10-05',
      maxScore: 20,
    });

    expect(result.createdById).toBe(TEACHER_ID);
    expect(prisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: TEACHER_ID,
        }),
      }),
    );
  });

  it('requires platform users to provide schoolId when listing exams', async () => {
    await expect(service.findAll(superAdmin)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.exam.findMany).not.toHaveBeenCalled();
  });

  it('requires teacher exam list views to include an assigned classId', async () => {
    await expect(service.findAll(assignedTeacher)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.exam.findMany).not.toHaveBeenCalled();
  });

  it('blocks unassigned teachers from class exams', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(service.findAll(otherTeacher, { classId: CLASS_ID })).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.exam.findMany).not.toHaveBeenCalled();
  });

  it('records exam results against active enrollments', async () => {
    prisma.exam.findUnique.mockResolvedValue(createExamWithClass());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
      { id: ENROLLMENT_B, studentId: STUDENT_B },
    ]);
    prisma.examResult.upsert
      .mockResolvedValueOnce(
        createResult({ studentId: STUDENT_A, studentEnrollmentId: ENROLLMENT_A }),
      )
      .mockResolvedValueOnce(
        createResult({
          id: '00000000-0000-0000-0000-000000000101',
          studentId: STUDENT_B,
          studentEnrollmentId: ENROLLMENT_B,
          score: new Prisma.Decimal(75),
          grade: 'B',
          remarks: 'Good effort',
        }),
      );

    const results = await service.recordResults(schoolAdmin, EXAM_ID, {
      results: [
        { studentId: STUDENT_A, score: 90, grade: ' A ' },
        { studentId: STUDENT_B, score: 75, grade: ' B ', remarks: ' Good effort ' },
      ],
    });

    expect(results).toHaveLength(2);
    expect(prisma.studentEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        status: 'ACTIVE',
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
    expect(prisma.examResult.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          examId_studentId: {
            examId: EXAM_ID,
            studentId: STUDENT_A,
          },
        },
        update: expect.objectContaining({
          studentEnrollmentId: ENROLLMENT_A,
          score: 90,
          grade: 'A',
          recordedById: ADMIN_ID,
        }),
        create: expect.objectContaining({
          schoolId: SCHOOL_A,
          examId: EXAM_ID,
          studentId: STUDENT_A,
          studentEnrollmentId: ENROLLMENT_A,
        }),
      }),
    );
  });

  it('rejects duplicate students in a result batch', async () => {
    prisma.exam.findUnique.mockResolvedValue(createExamWithClass());

    await expect(
      service.recordResults(schoolAdmin, EXAM_ID, {
        results: [
          { studentId: STUDENT_A, score: 90 },
          { studentId: STUDENT_A, score: 80 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
    expect(prisma.examResult.upsert).not.toHaveBeenCalled();
  });

  it('rejects scores above the exam max score', async () => {
    prisma.exam.findUnique.mockResolvedValue(createExamWithClass());

    await expect(
      service.recordResults(schoolAdmin, EXAM_ID, {
        results: [{ studentId: STUDENT_A, score: 101 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('requires every result to match an active enrollment in the exam class', async () => {
    prisma.exam.findUnique.mockResolvedValue(createExamWithClass());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_A, studentId: STUDENT_A },
    ]);

    await expect(
      service.recordResults(schoolAdmin, EXAM_ID, {
        results: [
          { studentId: STUDENT_A, score: 90 },
          { studentId: STUDENT_B, score: 75 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.examResult.upsert).not.toHaveBeenCalled();
  });

  it('blocks max-score updates that would invalidate existing results', async () => {
    prisma.exam.findUnique.mockResolvedValue(createExamWithClass());
    prisma.examResult.findFirst.mockResolvedValue({ id: RESULT_ID });

    await expect(service.update(schoolAdmin, EXAM_ID, { maxScore: 50 })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.exam.update).not.toHaveBeenCalled();
  });
});
