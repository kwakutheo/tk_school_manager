import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Subject } from '@prisma/client';
import { ACADEMIC_MANAGEMENT_ROLES, isPlatformRole, TEACHING_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, ISubject } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

export const SUBJECT_READ_ROLES = [...ACADEMIC_MANAGEMENT_ROLES, ...TEACHING_ROLES] as const;

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateSubjectDto): Promise<ISubject> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);

    await this.ensureSchoolExists(schoolId);

    try {
      const subject = await this.prisma.subject.create({
        data: {
          schoolId,
          name: this.clean(dto.name),
          code: this.optionalClean(dto.code),
          department: this.optionalClean(dto.department),
        },
      });

      return this.toSubject(subject);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    requestedSchoolId?: string,
    activeOnly = false,
  ): Promise<ISubject[]> {
    const schoolId = this.resolveSchoolId(currentUser, requestedSchoolId);
    const subjects = await this.prisma.subject.findMany({
      where: {
        schoolId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ name: 'asc' }],
    });

    return subjects.map((subject) => this.toSubject(subject));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<ISubject> {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    this.ensureTenantAccess(currentUser, subject.schoolId);
    return this.toSubject(subject);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateSubjectDto,
  ): Promise<ISubject> {
    const existing = await this.prisma.subject.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    try {
      const updated = await this.prisma.subject.update({
        where: { id },
        data: {
          ...(dto.name ? { name: this.clean(dto.name) } : {}),
          ...(dto.code !== undefined ? { code: this.optionalClean(dto.code) } : {}),
          ...(dto.department !== undefined
            ? { department: this.optionalClean(dto.department) }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return this.toSubject(updated);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async softDelete(currentUser: IAuthenticatedUser, id: string): Promise<ISubject> {
    const existing = await this.prisma.subject.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    const updated = await this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toSubject(updated);
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
      throw new ForbiddenException('You cannot access subjects outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access subjects outside your school');
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

  private clean(value: string): string {
    return value.trim();
  }

  private optionalClean(value: string | null | undefined): string | null {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private handleKnownPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException('A subject with the same unique details already exists');
    }

    throw error;
  }

  private toSubject(subject: Subject): ISubject {
    return {
      id: subject.id,
      schoolId: subject.schoolId,
      name: subject.name,
      code: subject.code,
      department: subject.department,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }
}
