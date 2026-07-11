import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  EnrollmentStatus as PrismaEnrollmentStatus,
  ExamStatus as PrismaExamStatus,
  Prisma,
} from '@prisma/client';
import {
  ACADEMIC_MANAGEMENT_ROLES,
  AcademicTerm,
  ExamStatus,
  isPlatformRole,
  TEACHING_ROLES,
} from '@school-saas/config';
import {
  IAuthenticatedUser,
  IClassTermReport,
  IClassTermReportExam,
  IClassTermReportStudentSummary,
  IStudentReportIdentity,
  IStudentTermReport,
  IStudentTermReportResult,
} from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';

interface ClassScope {
  schoolId: string;
  name: string;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
}

interface StudentEnrollmentScope {
  classId: string;
  schoolClass: {
    schoolId: string;
    academicYear: string;
    classTeacherId: string | null;
    isActive: boolean;
  };
}

interface StudentForReport extends IStudentReportIdentity {
  schoolId: string;
  isActive: boolean;
  enrollments: StudentEnrollmentScope[];
}

interface ResultWithExam {
  score: Prisma.Decimal;
  grade: string | null;
  remarks: string | null;
  exam: {
    id: string;
    title: string;
    subjectId: string;
    examDate: Date;
    maxScore: Prisma.Decimal;
    weight: Prisma.Decimal | null;
    status: PrismaExamStatus;
    subject: {
      name: string;
    };
  };
}

interface ClassExamForReport {
  id: string;
  title: string;
  subjectId: string;
  examDate: Date;
  maxScore: Prisma.Decimal;
  status: PrismaExamStatus;
  subject: {
    name: string;
  };
  results: {
    studentId: string;
    score: Prisma.Decimal;
  }[];
}

interface EnrollmentForClassReport {
  studentId: string;
  student: IStudentReportIdentity & {
    isActive: boolean;
  };
}

export const REPORT_ACCESS_ROLES = [...ACADEMIC_MANAGEMENT_ROLES, ...TEACHING_ROLES] as const;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentTermReport(
    currentUser: IAuthenticatedUser,
    studentId: string,
    academicYearInput?: string,
    termInput?: string,
  ): Promise<IStudentTermReport> {
    const academicYear = this.requiredClean(academicYearInput, 'academicYear');
    const term = this.requiredTerm(termInput);
    const student = await this.getStudentForReport(studentId, academicYear);

    this.ensureTenantAccess(currentUser, student.schoolId);
    this.ensureStudentReportAccess(currentUser, student);

    const results = await this.prisma.examResult.findMany({
      where: {
        schoolId: student.schoolId,
        studentId,
        exam: {
          academicYear,
          term: term as PrismaAcademicTerm,
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

    const reportResults = results
      .map((result) => this.toStudentTermReportResult(result))
      .sort((first, second) => this.sortByExamDateThenTitle(first, second));
    const totals = this.calculateResultTotals(reportResults);

    return {
      schoolId: student.schoolId,
      student: this.toStudentIdentity(student),
      academicYear,
      term,
      generatedAt: new Date(),
      totals: {
        exams: reportResults.length,
        ...totals,
      },
      results: reportResults,
    };
  }

  async getClassTermReport(
    currentUser: IAuthenticatedUser,
    classId: string,
    academicYearInput?: string,
    termInput?: string,
  ): Promise<IClassTermReport> {
    const academicYear = this.requiredClean(academicYearInput, 'academicYear');
    const term = this.requiredTerm(termInput);
    const schoolClass = await this.getClassScope(classId);

    this.ensureTenantAccess(currentUser, schoolClass.schoolId);
    this.ensureClassAccess(currentUser, schoolClass);

    if (schoolClass.academicYear !== academicYear) {
      throw new BadRequestException('Class does not belong to the requested academic year');
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId: schoolClass.schoolId,
        classId,
        academicYear,
        status: PrismaEnrollmentStatus.ACTIVE,
        student: {
          isActive: true,
        },
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
    const studentIds = enrollments.map((enrollment) => enrollment.studentId);
    const exams = await this.prisma.exam.findMany({
      where: {
        schoolId: schoolClass.schoolId,
        classId,
        academicYear,
        term: term as PrismaAcademicTerm,
        status: { not: PrismaExamStatus.ARCHIVED },
      },
      select: {
        id: true,
        title: true,
        subjectId: true,
        examDate: true,
        maxScore: true,
        status: true,
        subject: {
          select: {
            name: true,
          },
        },
        results: {
          where: {
            schoolId: schoolClass.schoolId,
            studentId: { in: studentIds },
          },
          select: {
            studentId: true,
            score: true,
          },
        },
      },
    });

    const sortedExams = [...exams].sort((first, second) => this.sortClassExams(first, second));
    const students = this.buildClassStudentSummaries(enrollments, sortedExams);
    const aggregateTotals = this.calculateClassTotals(students);

    return {
      schoolId: schoolClass.schoolId,
      classId,
      className: schoolClass.name,
      academicYear,
      term,
      generatedAt: new Date(),
      totals: {
        enrolledStudents: students.length,
        exams: sortedExams.length,
        expectedResults: students.length * sortedExams.length,
        recordedResults: aggregateTotals.recordedResults,
        classAveragePercentage: aggregateTotals.classAveragePercentage,
      },
      exams: sortedExams.map((exam) => this.toClassTermReportExam(exam)),
      students,
    };
  }

  private async getStudentForReport(
    studentId: string,
    academicYear: string,
  ): Promise<StudentForReport> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        schoolId: true,
        admissionNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        isActive: true,
        enrollments: {
          where: { academicYear },
          select: {
            classId: true,
            schoolClass: {
              select: {
                schoolId: true,
                academicYear: true,
                classTeacherId: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.isActive) {
      throw new BadRequestException('Inactive students cannot have generated reports');
    }

    if (!student.enrollments.length) {
      throw new BadRequestException('Student has no enrollment for the requested academic year');
    }

    return student;
  }

  private async getClassScope(classId: string): Promise<ClassScope> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: {
        schoolId: true,
        name: true,
        academicYear: true,
        classTeacherId: true,
        isActive: true,
      },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    if (!schoolClass.isActive) {
      throw new BadRequestException('Inactive classes cannot have generated reports');
    }

    return schoolClass;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access reports outside your school');
    }
  }

  private ensureStudentReportAccess(
    currentUser: IAuthenticatedUser,
    student: StudentForReport,
  ): void {
    if (this.canManageAcademics(currentUser)) {
      return;
    }

    if (
      !TEACHING_ROLES.includes(currentUser.role as (typeof TEACHING_ROLES)[number]) ||
      !student.enrollments.some(
        (enrollment) => enrollment.schoolClass.classTeacherId === currentUser.id,
      )
    ) {
      throw new ForbiddenException('Teachers can only access reports for assigned classes');
    }
  }

  private ensureClassAccess(currentUser: IAuthenticatedUser, schoolClass: ClassScope): void {
    if (this.canManageAcademics(currentUser)) {
      return;
    }

    if (
      !TEACHING_ROLES.includes(currentUser.role as (typeof TEACHING_ROLES)[number]) ||
      schoolClass.classTeacherId !== currentUser.id
    ) {
      throw new ForbiddenException('Teachers can only access reports for assigned classes');
    }
  }

  private canManageAcademics(currentUser: IAuthenticatedUser): boolean {
    return ACADEMIC_MANAGEMENT_ROLES.includes(
      currentUser.role as (typeof ACADEMIC_MANAGEMENT_ROLES)[number],
    );
  }

  private requiredClean(value: string | undefined, fieldName: string): string {
    const cleaned = value?.trim();

    if (!cleaned) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return cleaned;
  }

  private requiredTerm(value: string | undefined): AcademicTerm {
    const cleaned = this.requiredClean(value, 'term');

    if (!Object.values(AcademicTerm).includes(cleaned as AcademicTerm)) {
      throw new BadRequestException('Invalid report term');
    }

    return cleaned as AcademicTerm;
  }

  private toStudentIdentity(student: IStudentReportIdentity): IStudentReportIdentity {
    return {
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
    };
  }

  private toStudentTermReportResult(result: ResultWithExam): IStudentTermReportResult {
    const score = Number(result.score);
    const maxScore = Number(result.exam.maxScore);

    return {
      examId: result.exam.id,
      title: result.exam.title,
      subjectId: result.exam.subjectId,
      subjectName: result.exam.subject.name,
      examDate: result.exam.examDate,
      maxScore,
      score,
      percentage: this.percentage(score, maxScore),
      grade: result.grade,
      remarks: result.remarks,
      weight: result.exam.weight === null ? null : Number(result.exam.weight),
      status: result.exam.status as ExamStatus,
    };
  }

  private calculateResultTotals(results: IStudentTermReportResult[]): {
    totalScore: number;
    totalMaxScore: number;
    averagePercentage: number;
  } {
    const totalScore = this.round2(results.reduce((sum, result) => sum + result.score, 0));
    const totalMaxScore = this.round2(results.reduce((sum, result) => sum + result.maxScore, 0));

    return {
      totalScore,
      totalMaxScore,
      averagePercentage: this.percentage(totalScore, totalMaxScore),
    };
  }

  private buildClassStudentSummaries(
    enrollments: EnrollmentForClassReport[],
    exams: ClassExamForReport[],
  ): IClassTermReportStudentSummary[] {
    return enrollments
      .map((enrollment) => {
        const studentResults = exams.flatMap((exam) =>
          exam.results
            .filter((result) => result.studentId === enrollment.studentId)
            .map((result) => ({
              score: Number(result.score),
              maxScore: Number(exam.maxScore),
            })),
        );
        const totals = this.calculateClassStudentTotals(studentResults);

        return {
          ...this.toStudentIdentity(enrollment.student),
          recordedResults: studentResults.length,
          ...totals,
        };
      })
      .sort((first, second) => this.sortStudents(first, second));
  }

  private calculateClassStudentTotals(results: { score: number; maxScore: number }[]): {
    totalScore: number;
    totalMaxScore: number;
    averagePercentage: number;
  } {
    const totalScore = this.round2(results.reduce((sum, result) => sum + result.score, 0));
    const totalMaxScore = this.round2(results.reduce((sum, result) => sum + result.maxScore, 0));

    return {
      totalScore,
      totalMaxScore,
      averagePercentage: this.percentage(totalScore, totalMaxScore),
    };
  }

  private calculateClassTotals(students: IClassTermReportStudentSummary[]): {
    recordedResults: number;
    classAveragePercentage: number;
  } {
    const recordedResults = students.reduce((sum, student) => sum + student.recordedResults, 0);
    const totalScore = students.reduce((sum, student) => sum + student.totalScore, 0);
    const totalMaxScore = students.reduce((sum, student) => sum + student.totalMaxScore, 0);

    return {
      recordedResults,
      classAveragePercentage: this.percentage(totalScore, totalMaxScore),
    };
  }

  private toClassTermReportExam(exam: ClassExamForReport): IClassTermReportExam {
    return {
      id: exam.id,
      title: exam.title,
      subjectId: exam.subjectId,
      subjectName: exam.subject.name,
      examDate: exam.examDate,
      maxScore: Number(exam.maxScore),
      status: exam.status as ExamStatus,
    };
  }

  private sortByExamDateThenTitle(
    first: IStudentTermReportResult,
    second: IStudentTermReportResult,
  ): number {
    return first.examDate.getTime() - second.examDate.getTime() || first.title.localeCompare(second.title);
  }

  private sortClassExams(first: ClassExamForReport, second: ClassExamForReport): number {
    return first.examDate.getTime() - second.examDate.getTime() || first.title.localeCompare(second.title);
  }

  private sortStudents(
    first: IStudentReportIdentity,
    second: IStudentReportIdentity,
  ): number {
    return (
      first.lastName.localeCompare(second.lastName) ||
      first.firstName.localeCompare(second.firstName) ||
      first.admissionNumber.localeCompare(second.admissionNumber)
    );
  }

  private percentage(score: number, maxScore: number): number {
    if (maxScore <= 0) {
      return 0;
    }

    return this.round2((score / maxScore) * 100);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
