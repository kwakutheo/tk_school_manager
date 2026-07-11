import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  ExamStatus as PrismaExamStatus,
  Prisma,
} from '@prisma/client';
import { AcademicTerm, Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from './reports.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const ADMIN_ID = '00000000-0000-0000-0000-000000000030';
const TEACHER_ID = '00000000-0000-0000-0000-000000000040';
const OTHER_TEACHER_ID = '00000000-0000-0000-0000-000000000041';
const CLASS_ID = '00000000-0000-0000-0000-000000000050';
const STUDENT_A = '00000000-0000-0000-0000-000000000060';
const STUDENT_B = '00000000-0000-0000-0000-000000000061';
const SUBJECT_A = '00000000-0000-0000-0000-000000000070';
const SUBJECT_B = '00000000-0000-0000-0000-000000000071';
const EXAM_A = '00000000-0000-0000-0000-000000000080';
const EXAM_B = '00000000-0000-0000-0000-000000000081';
const ACADEMIC_YEAR = '2026/2027';

function createStudent(overrides: Record<string, unknown> = {}) {
  return {
    id: STUDENT_A,
    schoolId: SCHOOL_A,
    admissionNumber: 'ADM-001',
    firstName: 'Ama',
    middleName: null,
    lastName: 'Mensah',
    isActive: true,
    enrollments: [
      {
        classId: CLASS_ID,
        schoolClass: {
          schoolId: SCHOOL_A,
          academicYear: ACADEMIC_YEAR,
          classTeacherId: TEACHER_ID,
          isActive: true,
        },
      },
    ],
    ...overrides,
  };
}

function createClassScope(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: SCHOOL_A,
    name: 'Basic 1',
    academicYear: ACADEMIC_YEAR,
    classTeacherId: TEACHER_ID,
    isActive: true,
    ...overrides,
  };
}

function createResult(overrides: Record<string, unknown> = {}) {
  return {
    score: new Prisma.Decimal(18),
    grade: 'A',
    remarks: 'Strong',
    exam: {
      id: EXAM_B,
      title: 'Quiz',
      subjectId: SUBJECT_B,
      examDate: new Date('2026-10-01T00:00:00.000Z'),
      maxScore: new Prisma.Decimal(20),
      weight: null,
      status: PrismaExamStatus.PUBLISHED,
      subject: {
        name: 'English',
      },
    },
    ...overrides,
  };
}

function createEnrollment(studentId: string, firstName: string, lastName: string) {
  return {
    studentId,
    student: {
      id: studentId,
      admissionNumber: studentId === STUDENT_A ? 'ADM-001' : 'ADM-002',
      firstName,
      middleName: null,
      lastName,
      isActive: true,
    },
  };
}

function createClassExam(overrides: Record<string, unknown> = {}) {
  return {
    id: EXAM_A,
    title: 'End of Term Exam',
    subjectId: SUBJECT_A,
    examDate: new Date('2026-12-10T00:00:00.000Z'),
    maxScore: new Prisma.Decimal(100),
    status: PrismaExamStatus.PUBLISHED,
    subject: {
      name: 'Mathematics',
    },
    results: [
      {
        studentId: STUDENT_A,
        score: new Prisma.Decimal(90),
      },
      {
        studentId: STUDENT_B,
        score: new Prisma.Decimal(75),
      },
    ],
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    studentProfile: {
      findUnique: jest.fn<() => Promise<ReturnType<typeof createStudent> | null>>(),
    },
    examResult: {
      findMany: jest.fn<() => Promise<ReturnType<typeof createResult>[]>>(),
    },
    schoolClass: {
      findUnique: jest.fn<() => Promise<ReturnType<typeof createClassScope> | null>>(),
    },
    studentEnrollment: {
      findMany: jest.fn<() => Promise<ReturnType<typeof createEnrollment>[]>>(),
    },
    exam: {
      findMany: jest.fn<() => Promise<ReturnType<typeof createClassExam>[]>>(),
    },
  };
}

describe('ReportsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ReportsService;

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

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ReportsService(prisma as unknown as PrismaService);
  });

  it('builds a student term report with calculated totals', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent());
    prisma.examResult.findMany.mockResolvedValue([
      createResult({
        score: new Prisma.Decimal(90),
        grade: 'A',
        remarks: null,
        exam: {
          id: EXAM_A,
          title: 'End of Term Exam',
          subjectId: SUBJECT_A,
          examDate: new Date('2026-12-10T00:00:00.000Z'),
          maxScore: new Prisma.Decimal(100),
          weight: new Prisma.Decimal(40),
          status: PrismaExamStatus.PUBLISHED,
          subject: { name: 'Mathematics' },
        },
      }),
      createResult(),
    ]);

    const report = await service.getStudentTermReport(
      schoolAdmin,
      STUDENT_A,
      ` ${ACADEMIC_YEAR} `,
      AcademicTerm.FIRST_TERM,
    );

    expect(report.student).toEqual({
      id: STUDENT_A,
      admissionNumber: 'ADM-001',
      firstName: 'Ama',
      middleName: null,
      lastName: 'Mensah',
    });
    expect(report.totals).toEqual({
      exams: 2,
      totalScore: 108,
      totalMaxScore: 120,
      averagePercentage: 90,
    });
    expect(report.results.map((result) => result.title)).toEqual(['Quiz', 'End of Term Exam']);
    expect(prisma.examResult.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        studentId: STUDENT_A,
        exam: {
          academicYear: ACADEMIC_YEAR,
          term: PrismaAcademicTerm.FIRST_TERM,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            subjectId: true,
            examDate: true,
            maxScore: true,
            weight: true,
            status: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  });

  it('requires term when generating a student report', async () => {
    await expect(
      service.getStudentTermReport(schoolAdmin, STUDENT_A, ACADEMIC_YEAR),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentProfile.findUnique).not.toHaveBeenCalled();
  });

  it('blocks unassigned teachers from student reports', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent());

    await expect(
      service.getStudentTermReport(otherTeacher, STUDENT_A, ACADEMIC_YEAR, AcademicTerm.FIRST_TERM),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.examResult.findMany).not.toHaveBeenCalled();
  });

  it('blocks reports outside the current school', async () => {
    prisma.studentProfile.findUnique.mockResolvedValue(createStudent({ schoolId: SCHOOL_B }));

    await expect(
      service.getStudentTermReport(schoolAdmin, STUDENT_A, ACADEMIC_YEAR, AcademicTerm.FIRST_TERM),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('builds a class term report with student summaries and class totals', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      createEnrollment(STUDENT_A, 'Ama', 'Mensah'),
      createEnrollment(STUDENT_B, 'Kojo', 'Boateng'),
    ]);
    prisma.exam.findMany.mockResolvedValue([
      createClassExam(),
      createClassExam({
        id: EXAM_B,
        title: 'Quiz',
        subjectId: SUBJECT_B,
        examDate: new Date('2026-10-01T00:00:00.000Z'),
        maxScore: new Prisma.Decimal(20),
        subject: { name: 'English' },
        results: [
          {
            studentId: STUDENT_A,
            score: new Prisma.Decimal(18),
          },
        ],
      }),
    ]);

    const report = await service.getClassTermReport(
      assignedTeacher,
      CLASS_ID,
      ACADEMIC_YEAR,
      AcademicTerm.FIRST_TERM,
    );

    expect(report.exams.map((exam) => exam.title)).toEqual(['Quiz', 'End of Term Exam']);
    expect(report.totals).toEqual({
      enrolledStudents: 2,
      exams: 2,
      expectedResults: 4,
      recordedResults: 3,
      classAveragePercentage: 86.36,
    });
    expect(report.students).toEqual([
      expect.objectContaining({
        id: STUDENT_B,
        recordedResults: 1,
        totalScore: 75,
        totalMaxScore: 100,
        averagePercentage: 75,
      }),
      expect.objectContaining({
        id: STUDENT_A,
        recordedResults: 2,
        totalScore: 108,
        totalMaxScore: 120,
        averagePercentage: 90,
      }),
    ]);
    expect(prisma.exam.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
        status: { not: PrismaExamStatus.ARCHIVED },
      },
      select: expect.any(Object),
    });
  });

  it('rejects class report requests for the wrong academic year', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(
      service.getClassTermReport(schoolAdmin, CLASS_ID, '2027/2028', AcademicTerm.FIRST_TERM),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('blocks unassigned teachers from class reports', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(
      service.getClassTermReport(otherTeacher, CLASS_ID, ACADEMIC_YEAR, AcademicTerm.FIRST_TERM),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
  });
});
