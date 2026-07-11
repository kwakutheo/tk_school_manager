import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  EnrollmentStatus as PrismaEnrollmentStatus,
  Exam,
  ExamResult,
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
import { IAuthenticatedUser, IExam, IExamResult, IExamWithResults } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { RecordExamResultDto } from './dto/record-exam-result.dto';
import { RecordExamResultsDto } from './dto/record-exam-results.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

interface ListExamsFilters {
  schoolId?: string;
  classId?: string;
  subjectId?: string;
  academicYear?: string;
  term?: string;
  status?: string;
}

interface ClassScope {
  schoolId: string;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
}

type ExamWithResultsModel = Exam & {
  results: ExamResult[];
};

type ExamWithClassScope = Exam & {
  schoolClass: ClassScope;
};

type ExamWithClassAndResults = ExamWithResultsModel & {
  schoolClass: ClassScope;
};

export const EXAM_ACCESS_ROLES = [...ACADEMIC_MANAGEMENT_ROLES, ...TEACHING_ROLES] as const;

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateExamDto): Promise<IExam> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const academicYear = this.clean(dto.academicYear);
    const schoolClass = await this.getClassScope(dto.classId);

    this.ensureClassBelongsToSchool(schoolClass, schoolId);
    this.ensureClassAccess(currentUser, schoolClass);

    if (!schoolClass.isActive || schoolClass.academicYear !== academicYear) {
      throw new BadRequestException('Class must be active for the requested academic year');
    }

    await this.ensureSubjectCanBeUsed(dto.subjectId, schoolId);

    try {
      const exam = await this.prisma.exam.create({
        data: {
          schoolId,
          classId: dto.classId,
          subjectId: dto.subjectId,
          academicYear,
          term: dto.term as PrismaAcademicTerm,
          title: this.clean(dto.title),
          examDate: this.toDateOnly(dto.examDate),
          maxScore: dto.maxScore,
          weight: dto.weight ?? null,
          status: (dto.status ?? ExamStatus.DRAFT) as PrismaExamStatus,
          createdById: currentUser.id,
        },
      });

      return this.toExam(exam);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(currentUser: IAuthenticatedUser, filters: ListExamsFilters = {}): Promise<IExam[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const term = this.optionalEnumValue(AcademicTerm, filters.term, 'term');
    const status = this.optionalEnumValue(ExamStatus, filters.status, 'status');

    if (filters.classId) {
      const schoolClass = await this.getClassScope(filters.classId);
      this.ensureClassBelongsToSchool(schoolClass, schoolId);
      this.ensureClassAccess(currentUser, schoolClass);
    } else if (!this.canManageAcademics(currentUser)) {
      throw new BadRequestException('A classId is required for teacher exam views');
    }

    if (filters.subjectId) {
      await this.ensureSubjectCanBeUsed(filters.subjectId, schoolId, false);
    }

    const exams = await this.prisma.exam.findMany({
      where: {
        schoolId,
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.academicYear ? { academicYear: this.clean(filters.academicYear) } : {}),
        ...(term ? { term: term as PrismaAcademicTerm } : {}),
        ...(status ? { status: status as PrismaExamStatus } : {}),
      },
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
    });

    return exams.map((exam) => this.toExam(exam));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<IExamWithResults> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        schoolClass: {
          select: {
            schoolId: true,
            academicYear: true,
            classTeacherId: true,
            isActive: true,
          },
        },
        results: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    this.ensureTenantAccess(currentUser, exam.schoolId);
    this.ensureClassAccess(currentUser, exam.schoolClass);

    return this.toExamWithResults(exam);
  }

  async update(currentUser: IAuthenticatedUser, id: string, dto: UpdateExamDto): Promise<IExam> {
    const existing = await this.findExamWithClass(id);

    this.ensureTenantAccess(currentUser, existing.schoolId);
    this.ensureClassAccess(currentUser, existing.schoolClass);

    if (dto.maxScore !== undefined) {
      await this.ensureNoResultExceedsScore(existing.id, dto.maxScore);
    }

    try {
      const updated = await this.prisma.exam.update({
        where: { id },
        data: {
          ...(dto.title ? { title: this.clean(dto.title) } : {}),
          ...(dto.examDate ? { examDate: this.toDateOnly(dto.examDate) } : {}),
          ...(dto.maxScore !== undefined ? { maxScore: dto.maxScore } : {}),
          ...(dto.weight !== undefined ? { weight: dto.weight ?? null } : {}),
          ...(dto.status ? { status: dto.status as PrismaExamStatus } : {}),
        },
      });

      return this.toExam(updated);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async archive(currentUser: IAuthenticatedUser, id: string): Promise<IExam> {
    return this.update(currentUser, id, { status: ExamStatus.ARCHIVED });
  }

  async recordResults(
    currentUser: IAuthenticatedUser,
    examId: string,
    dto: RecordExamResultsDto,
  ): Promise<IExamResult[]> {
    const exam = await this.findExamWithClass(examId);

    this.ensureTenantAccess(currentUser, exam.schoolId);
    this.ensureClassAccess(currentUser, exam.schoolClass);

    if (exam.status === PrismaExamStatus.ARCHIVED) {
      throw new BadRequestException('Archived exams cannot receive results');
    }

    const results = this.normalizeResults(dto.results, Number(exam.maxScore));
    const enrollmentByStudentId = await this.getActiveEnrollmentMap(
      exam.schoolId,
      exam.classId,
      exam.academicYear,
      results.map((result) => result.studentId),
    );

    const operations = results.map((result) =>
      this.prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: result.studentId,
          },
        },
        update: {
          studentEnrollmentId: enrollmentByStudentId.get(result.studentId)!,
          score: result.score,
          grade: this.optionalClean(result.grade),
          remarks: this.optionalClean(result.remarks),
          recordedById: currentUser.id,
        },
        create: {
          schoolId: exam.schoolId,
          examId,
          studentId: result.studentId,
          studentEnrollmentId: enrollmentByStudentId.get(result.studentId)!,
          score: result.score,
          grade: this.optionalClean(result.grade),
          remarks: this.optionalClean(result.remarks),
          recordedById: currentUser.id,
        },
      }),
    );

    const savedResults = await this.prisma.$transaction(operations);
    return savedResults.map((result) => this.toExamResult(result));
  }

  private resolveSchoolId(currentUser: IAuthenticatedUser, requestedSchoolId?: string): string {
    if (isPlatformRole(currentUser.role)) {
      if (!requestedSchoolId) {
        throw new BadRequestException('A schoolId is required');
      }

      return requestedSchoolId;
    }

    if (!currentUser.schoolId) {
      throw new ForbiddenException('School-scoped user is missing a school context');
    }

    if (requestedSchoolId && requestedSchoolId !== currentUser.schoolId) {
      throw new ForbiddenException('You cannot access exams outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access exams outside your school');
    }
  }

  private async getClassScope(classId: string): Promise<ClassScope> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: {
        schoolId: true,
        academicYear: true,
        classTeacherId: true,
        isActive: true,
      },
    });

    if (!schoolClass) {
      throw new BadRequestException('Class does not exist');
    }

    return schoolClass;
  }

  private ensureClassBelongsToSchool(schoolClass: ClassScope, schoolId: string): void {
    if (schoolClass.schoolId !== schoolId) {
      throw new ForbiddenException('You cannot access exams outside your school');
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
      throw new ForbiddenException('Teachers can only access exams for assigned classes');
    }
  }

  private canManageAcademics(currentUser: IAuthenticatedUser): boolean {
    return ACADEMIC_MANAGEMENT_ROLES.includes(
      currentUser.role as (typeof ACADEMIC_MANAGEMENT_ROLES)[number],
    );
  }

  private async ensureSubjectCanBeUsed(
    subjectId: string,
    schoolId: string,
    requireActive = true,
  ): Promise<void> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true, isActive: true },
    });

    if (!subject || subject.schoolId !== schoolId) {
      throw new BadRequestException('Subject does not exist in this school');
    }

    if (requireActive && !subject.isActive) {
      throw new BadRequestException('Subject is inactive');
    }
  }

  private async findExamWithClass(id: string): Promise<ExamWithClassScope> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        schoolClass: {
          select: {
            schoolId: true,
            academicYear: true,
            classTeacherId: true,
            isActive: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  private async ensureNoResultExceedsScore(examId: string, maxScore: number): Promise<void> {
    const result = await this.prisma.examResult.findFirst({
      where: {
        examId,
        score: { gt: maxScore },
      },
      select: { id: true },
    });

    if (result) {
      throw new BadRequestException('Existing results exceed the requested max score');
    }
  }

  private normalizeResults(
    results: RecordExamResultDto[],
    maxScore: number,
  ): RecordExamResultDto[] {
    const seenStudentIds = new Set<string>();

    for (const result of results) {
      if (seenStudentIds.has(result.studentId)) {
        throw new BadRequestException('Exam results must not contain duplicate students');
      }

      if (result.score > maxScore) {
        throw new BadRequestException('Exam result score cannot exceed the exam max score');
      }

      seenStudentIds.add(result.studentId);
    }

    return results;
  }

  private async getActiveEnrollmentMap(
    schoolId: string,
    classId: string,
    academicYear: string,
    studentIds: string[],
  ): Promise<Map<string, string>> {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId,
        academicYear,
        status: PrismaEnrollmentStatus.ACTIVE,
        studentId: { in: studentIds },
        student: {
          isActive: true,
        },
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException(
        'Every result must target an active student enrollment in this class',
      );
    }

    return new Map(enrollments.map((enrollment) => [enrollment.studentId, enrollment.id]));
  }

  private optionalEnumValue<T extends Record<string, string>>(
    enumObject: T,
    value: string | undefined,
    fieldName: string,
  ): T[keyof T] | undefined {
    if (!value) {
      return undefined;
    }

    if (!Object.values(enumObject).includes(value)) {
      throw new BadRequestException(`Invalid exam ${fieldName}`);
    }

    return value as T[keyof T];
  }

  private clean(value: string): string {
    return value.trim();
  }

  private optionalClean(value: string | null | undefined): string | null {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private toDateOnly(value: string): Date {
    return new Date(value);
  }

  private handleKnownPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException('An exam with the same unique details already exists');
    }

    throw error;
  }

  private toExam(exam: Exam): IExam {
    return {
      id: exam.id,
      schoolId: exam.schoolId,
      classId: exam.classId,
      subjectId: exam.subjectId,
      academicYear: exam.academicYear,
      term: exam.term as AcademicTerm,
      title: exam.title,
      examDate: exam.examDate,
      maxScore: Number(exam.maxScore),
      weight: exam.weight === null ? null : Number(exam.weight),
      status: exam.status as ExamStatus,
      createdById: exam.createdById,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    };
  }

  private toExamWithResults(exam: ExamWithClassAndResults): IExamWithResults {
    return {
      ...this.toExam(exam),
      results: exam.results.map((result) => this.toExamResult(result)),
    };
  }

  private toExamResult(result: ExamResult): IExamResult {
    return {
      id: result.id,
      schoolId: result.schoolId,
      examId: result.examId,
      studentId: result.studentId,
      studentEnrollmentId: result.studentEnrollmentId,
      score: Number(result.score),
      grade: result.grade,
      remarks: result.remarks,
      recordedById: result.recordedById,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
