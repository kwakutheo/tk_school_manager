import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus as PrismaAttendanceStatus,
  EnrollmentStatus as PrismaEnrollmentStatus,
  Prisma,
} from '@prisma/client';
import {
  ADMIN_TIER_ROLES,
  AttendanceStatus,
  isPlatformRole,
  TEACHING_ROLES,
} from '@school-saas/config';
import {
  IAttendanceEntry,
  IAttendanceSession,
  IAttendanceSessionWithEntries,
  IAuthenticatedUser,
} from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceEntryDto } from './dto/create-attendance-entry.dto';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { UpdateAttendanceEntryDto } from './dto/update-attendance-entry.dto';

interface ListAttendanceSessionsFilters {
  schoolId?: string;
  classId?: string;
  academicYear?: string;
  attendanceDate?: string;
}

interface ClassScope {
  schoolId: string;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
}

type AttendanceSessionWithEntriesModel = AttendanceSession & {
  entries: AttendanceEntry[];
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    currentUser: IAuthenticatedUser,
    dto: CreateAttendanceSessionDto,
  ): Promise<IAttendanceSessionWithEntries> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const academicYear = this.clean(dto.academicYear);
    const attendanceDate = this.toDateOnly(dto.attendanceDate);
    const schoolClass = await this.getClassScope(dto.classId);

    this.ensureClassBelongsToSchool(schoolClass, schoolId);

    if (!schoolClass.isActive || schoolClass.academicYear !== academicYear) {
      throw new BadRequestException('Class must be active for the requested academic year');
    }

    this.ensureClassAccess(currentUser, schoolClass);

    const entries = this.normalizeEntries(dto.entries);
    const enrollmentByStudentId = await this.getActiveEnrollmentMap(
      schoolId,
      dto.classId,
      academicYear,
      entries.map((entry) => entry.studentId),
    );

    try {
      const session = await this.prisma.attendanceSession.create({
        data: {
          schoolId,
          classId: dto.classId,
          academicYear,
          attendanceDate,
          takenById: currentUser.id,
          notes: this.optionalClean(dto.notes),
          entries: {
            create: entries.map((entry) => ({
              schoolId,
              studentId: entry.studentId,
              studentEnrollmentId: enrollmentByStudentId.get(entry.studentId)!,
              status: entry.status as PrismaAttendanceStatus,
              remarks: this.optionalClean(entry.remarks),
            })),
          },
        },
        include: {
          entries: {
            orderBy: [{ createdAt: 'asc' }],
          },
        },
      });

      return this.toAttendanceSessionWithEntries(session);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    filters: ListAttendanceSessionsFilters = {},
  ): Promise<IAttendanceSession[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);

    if (filters.classId) {
      const schoolClass = await this.getClassScope(filters.classId);
      this.ensureClassBelongsToSchool(schoolClass, schoolId);
      this.ensureClassAccess(currentUser, schoolClass);
    } else if (!this.canManageSchoolAttendance(currentUser)) {
      throw new BadRequestException('A classId is required for teacher attendance views');
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        schoolId,
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.academicYear ? { academicYear: this.clean(filters.academicYear) } : {}),
        ...(filters.attendanceDate
          ? { attendanceDate: this.toDateOnly(filters.attendanceDate) }
          : {}),
      },
      orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
    });

    return sessions.map((session) => this.toAttendanceSession(session));
  }

  async findOne(
    currentUser: IAuthenticatedUser,
    id: string,
  ): Promise<IAttendanceSessionWithEntries> {
    const session = await this.prisma.attendanceSession.findUnique({
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
        entries: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    this.ensureTenantAccess(currentUser, session.schoolId);
    this.ensureClassAccess(currentUser, session.schoolClass);

    return this.toAttendanceSessionWithEntries(session);
  }

  async updateEntry(
    currentUser: IAuthenticatedUser,
    entryId: string,
    dto: UpdateAttendanceEntryDto,
  ): Promise<IAttendanceEntry> {
    const entry = await this.prisma.attendanceEntry.findUnique({
      where: { id: entryId },
      include: {
        session: {
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
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Attendance entry not found');
    }

    this.ensureTenantAccess(currentUser, entry.schoolId);
    this.ensureClassAccess(currentUser, entry.session.schoolClass);

    const updated = await this.prisma.attendanceEntry.update({
      where: { id: entryId },
      data: {
        status: dto.status as PrismaAttendanceStatus,
        ...(dto.remarks !== undefined ? { remarks: this.optionalClean(dto.remarks) } : {}),
      },
    });

    return this.toAttendanceEntry(updated);
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
      throw new ForbiddenException('You cannot access attendance outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access attendance outside your school');
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
      throw new ForbiddenException('You cannot access attendance outside your school');
    }
  }

  private ensureClassAccess(currentUser: IAuthenticatedUser, schoolClass: ClassScope): void {
    if (this.canManageSchoolAttendance(currentUser)) {
      return;
    }

    if (
      !TEACHING_ROLES.includes(currentUser.role as (typeof TEACHING_ROLES)[number]) ||
      schoolClass.classTeacherId !== currentUser.id
    ) {
      throw new ForbiddenException('Teachers can only access attendance for assigned classes');
    }
  }

  private canManageSchoolAttendance(currentUser: IAuthenticatedUser): boolean {
    return ADMIN_TIER_ROLES.includes(currentUser.role as (typeof ADMIN_TIER_ROLES)[number]);
  }

  private normalizeEntries(entries: CreateAttendanceEntryDto[]): CreateAttendanceEntryDto[] {
    const seenStudentIds = new Set<string>();

    for (const entry of entries) {
      if (seenStudentIds.has(entry.studentId)) {
        throw new BadRequestException('Attendance entries must not contain duplicate students');
      }

      seenStudentIds.add(entry.studentId);
    }

    return entries;
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
        'Every attendance entry must target an active student enrollment in this class',
      );
    }

    return new Map(enrollments.map((enrollment) => [enrollment.studentId, enrollment.id]));
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Attendance has already been recorded for this class date');
      }
    }

    throw error;
  }

  private toAttendanceSession(session: AttendanceSession): IAttendanceSession {
    return {
      id: session.id,
      schoolId: session.schoolId,
      classId: session.classId,
      academicYear: session.academicYear,
      attendanceDate: session.attendanceDate,
      takenById: session.takenById,
      notes: session.notes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private toAttendanceSessionWithEntries(
    session: AttendanceSessionWithEntriesModel,
  ): IAttendanceSessionWithEntries {
    return {
      ...this.toAttendanceSession(session),
      entries: session.entries.map((entry) => this.toAttendanceEntry(entry)),
    };
  }

  private toAttendanceEntry(entry: AttendanceEntry): IAttendanceEntry {
    return {
      id: entry.id,
      schoolId: entry.schoolId,
      sessionId: entry.sessionId,
      studentId: entry.studentId,
      studentEnrollmentId: entry.studentEnrollmentId,
      status: entry.status as AttendanceStatus,
      remarks: entry.remarks,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
