import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrollmentStatus as PrismaEnrollmentStatus,
  Prisma,
  Role as PrismaRole,
  StudentEnrollment,
  StudentProfile,
} from '@prisma/client';
import { EnrollmentStatus, isPlatformRole } from '@school-saas/config';
import { IAuthenticatedUser, IStudentEnrollment, IStudentProfile } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentEnrollmentDto } from './dto/create-student-enrollment.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

interface ListStudentsFilters {
  schoolId?: string;
  classId?: string;
  academicYear?: string;
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateStudentDto): Promise<IStudentProfile> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const initialEnrollment = this.resolveInitialEnrollment(dto);

    await this.ensureSchoolExists(schoolId);
    await this.ensureStudentUserCanBeLinked(dto.userId, schoolId);

    if (initialEnrollment) {
      await this.ensureClassInSchool(initialEnrollment.classId, schoolId);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const student = await tx.studentProfile.create({
          data: {
            schoolId,
            userId: dto.userId ?? null,
            admissionNumber: this.clean(dto.admissionNumber),
            firstName: this.clean(dto.firstName),
            middleName: this.optionalClean(dto.middleName),
            lastName: this.clean(dto.lastName),
            dateOfBirth: this.optionalDate(dto.dateOfBirth),
            gender: this.optionalClean(dto.gender),
          },
        });

        if (initialEnrollment) {
          await tx.studentEnrollment.create({
            data: {
              schoolId,
              studentId: student.id,
              classId: initialEnrollment.classId,
              academicYear: initialEnrollment.academicYear,
              status: PrismaEnrollmentStatus.ACTIVE,
            },
          });
        }

        return this.toStudentProfile(student);
      });
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    filters: ListStudentsFilters = {},
  ): Promise<IStudentProfile[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);

    if (filters.classId) {
      await this.ensureClassInSchool(filters.classId, schoolId);
    }

    const where: Prisma.StudentProfileWhereInput = {
      schoolId,
      ...(filters.classId || filters.academicYear
        ? {
            enrollments: {
              some: {
                ...(filters.classId ? { classId: filters.classId } : {}),
                ...(filters.academicYear
                  ? { academicYear: this.clean(filters.academicYear) }
                  : {}),
              },
            },
          }
        : {}),
    };

    const students = await this.prisma.studentProfile.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { admissionNumber: 'asc' }],
    });

    return students.map((student) => this.toStudentProfile(student));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<IStudentProfile> {
    const student = await this.prisma.studentProfile.findUnique({ where: { id } });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    this.ensureTenantAccess(currentUser, student.schoolId);
    return this.toStudentProfile(student);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateStudentDto,
  ): Promise<IStudentProfile> {
    const existing = await this.prisma.studentProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);
    await this.ensureStudentUserCanBeLinked(dto.userId, existing.schoolId);

    try {
      const updated = await this.prisma.studentProfile.update({
        where: { id },
        data: {
          ...(dto.admissionNumber ? { admissionNumber: this.clean(dto.admissionNumber) } : {}),
          ...(dto.firstName ? { firstName: this.clean(dto.firstName) } : {}),
          ...(dto.middleName !== undefined
            ? { middleName: this.optionalClean(dto.middleName) }
            : {}),
          ...(dto.lastName ? { lastName: this.clean(dto.lastName) } : {}),
          ...(dto.dateOfBirth !== undefined
            ? { dateOfBirth: this.optionalDate(dto.dateOfBirth) }
            : {}),
          ...(dto.gender !== undefined ? { gender: this.optionalClean(dto.gender) } : {}),
          ...(dto.userId !== undefined ? { userId: dto.userId ?? null } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return this.toStudentProfile(updated);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async softDelete(currentUser: IAuthenticatedUser, id: string): Promise<IStudentProfile> {
    const existing = await this.prisma.studentProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.studentEnrollment.updateMany({
        where: {
          studentId: id,
          status: PrismaEnrollmentStatus.ACTIVE,
        },
        data: {
          status: PrismaEnrollmentStatus.WITHDRAWN,
          exitedAt: now,
        },
      });

      const updated = await tx.studentProfile.update({
        where: { id },
        data: { isActive: false },
      });

      return this.toStudentProfile(updated);
    });
  }

  async createEnrollment(
    currentUser: IAuthenticatedUser,
    studentId: string,
    dto: CreateStudentEnrollmentDto,
  ): Promise<IStudentEnrollment> {
    const student = await this.prisma.studentProfile.findUnique({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    this.ensureTenantAccess(currentUser, student.schoolId);

    if (!student.isActive) {
      throw new BadRequestException('Inactive students cannot be enrolled');
    }

    const academicYear = this.clean(dto.academicYear);
    await this.ensureClassInSchool(dto.classId, student.schoolId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const activeEnrollment = await tx.studentEnrollment.findFirst({
          where: {
            studentId,
            academicYear,
            status: PrismaEnrollmentStatus.ACTIVE,
          },
        });

        if (activeEnrollment) {
          throw new BadRequestException('Student already has an active enrollment for this year');
        }

        const enrollment = await tx.studentEnrollment.create({
          data: {
            schoolId: student.schoolId,
            studentId,
            classId: dto.classId,
            academicYear,
            status: PrismaEnrollmentStatus.ACTIVE,
          },
        });

        return this.toStudentEnrollment(enrollment);
      });
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findEnrollments(
    currentUser: IAuthenticatedUser,
    studentId: string,
  ): Promise<IStudentEnrollment[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    this.ensureTenantAccess(currentUser, student.schoolId);

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { studentId },
      orderBy: [{ academicYear: 'desc' }, { enrolledAt: 'desc' }],
    });

    return enrollments.map((enrollment) => this.toStudentEnrollment(enrollment));
  }

  private resolveSchoolId(
    currentUser: IAuthenticatedUser,
    requestedSchoolId?: string,
  ): string {
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
      throw new ForbiddenException('You cannot access students outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access students outside your school');
    }
  }

  private async ensureSchoolExists(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, isActive: true },
    });

    if (!school?.isActive) {
      throw new BadRequestException('School is inactive or does not exist');
    }
  }

  private async ensureClassInSchool(classId: string, schoolId: string): Promise<void> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { schoolId: true, isActive: true },
    });

    if (!schoolClass?.isActive || schoolClass.schoolId !== schoolId) {
      throw new BadRequestException('Class must be active and belong to this school');
    }
  }

  private async ensureStudentUserCanBeLinked(
    userId: string | null | undefined,
    schoolId: string,
  ): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true, isActive: true },
    });

    if (!user?.isActive || user.schoolId !== schoolId || user.role !== PrismaRole.STUDENT) {
      throw new BadRequestException('Linked user must be an active STUDENT in this school');
    }
  }

  private resolveInitialEnrollment(
    dto: CreateStudentDto,
  ): { classId: string; academicYear: string } | null {
    if (!dto.classId && !dto.academicYear) {
      return null;
    }

    if (!dto.classId || !dto.academicYear) {
      throw new BadRequestException('classId and academicYear are both required for enrollment');
    }

    return {
      classId: dto.classId,
      academicYear: this.clean(dto.academicYear),
    };
  }

  private clean(value: string): string {
    return value.trim();
  }

  private optionalClean(value: string | null | undefined): string | null {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private optionalDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private handleKnownPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException('A student with the same unique details already exists');
    }

    throw error;
  }

  private toStudentProfile(student: StudentProfile): IStudentProfile {
    return {
      id: student.id,
      schoolId: student.schoolId,
      userId: student.userId,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  private toStudentEnrollment(enrollment: StudentEnrollment): IStudentEnrollment {
    return {
      id: enrollment.id,
      schoolId: enrollment.schoolId,
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      academicYear: enrollment.academicYear,
      status: enrollment.status as EnrollmentStatus,
      enrolledAt: enrollment.enrolledAt,
      exitedAt: enrollment.exitedAt,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }
}
