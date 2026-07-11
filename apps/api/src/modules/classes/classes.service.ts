import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SchoolClass } from '@prisma/client';
import { isPlatformRole, Role, TEACHING_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, ISchoolClass } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateClassDto): Promise<ISchoolClass> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);

    await this.ensureSchoolExists(schoolId);
    await this.ensureClassTeacherCanTeachInSchool(dto.classTeacherId, schoolId);

    try {
      const schoolClass = await this.prisma.schoolClass.create({
        data: {
          schoolId,
          name: this.clean(dto.name),
          code: this.optionalClean(dto.code),
          level: this.optionalClean(dto.level),
          section: this.optionalClean(dto.section),
          academicYear: this.clean(dto.academicYear),
          classTeacherId: dto.classTeacherId ?? null,
        },
      });

      return this.toSchoolClass(schoolClass);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    requestedSchoolId?: string,
  ): Promise<ISchoolClass[]> {
    const schoolId = this.resolveSchoolId(currentUser, requestedSchoolId);
    const classes = await this.prisma.schoolClass.findMany({
      where: { schoolId },
      orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
    });

    return classes.map((schoolClass) => this.toSchoolClass(schoolClass));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<ISchoolClass> {
    const schoolClass = await this.prisma.schoolClass.findUnique({ where: { id } });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    this.ensureTenantAccess(currentUser, schoolClass.schoolId);
    return this.toSchoolClass(schoolClass);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateClassDto,
  ): Promise<ISchoolClass> {
    const existing = await this.prisma.schoolClass.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Class not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);
    await this.ensureClassTeacherCanTeachInSchool(dto.classTeacherId, existing.schoolId);

    try {
      const updated = await this.prisma.schoolClass.update({
        where: { id },
        data: {
          ...(dto.name ? { name: this.clean(dto.name) } : {}),
          ...(dto.code !== undefined ? { code: this.optionalClean(dto.code) } : {}),
          ...(dto.level !== undefined ? { level: this.optionalClean(dto.level) } : {}),
          ...(dto.section !== undefined ? { section: this.optionalClean(dto.section) } : {}),
          ...(dto.academicYear ? { academicYear: this.clean(dto.academicYear) } : {}),
          ...(dto.classTeacherId !== undefined
            ? { classTeacherId: dto.classTeacherId ?? null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return this.toSchoolClass(updated);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async softDelete(currentUser: IAuthenticatedUser, id: string): Promise<ISchoolClass> {
    const existing = await this.prisma.schoolClass.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Class not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    const updated = await this.prisma.schoolClass.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toSchoolClass(updated);
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
      throw new ForbiddenException('You cannot access classes outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access classes outside your school');
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

  private async ensureClassTeacherCanTeachInSchool(
    classTeacherId: string | null | undefined,
    schoolId: string,
  ): Promise<void> {
    if (!classTeacherId) {
      return;
    }

    const teacher = await this.prisma.user.findUnique({
      where: { id: classTeacherId },
      select: { schoolId: true, role: true, isActive: true },
    });

    if (!teacher?.isActive || teacher.schoolId !== schoolId) {
      throw new BadRequestException('Class teacher must be an active user in this school');
    }

    if (!TEACHING_ROLES.includes(teacher.role as Role & (typeof TEACHING_ROLES)[number])) {
      throw new BadRequestException('Class teacher must have a teaching role');
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
      throw new BadRequestException('A class with the same unique details already exists');
    }

    throw error;
  }

  private toSchoolClass(schoolClass: SchoolClass): ISchoolClass {
    return {
      id: schoolClass.id,
      schoolId: schoolClass.schoolId,
      name: schoolClass.name,
      code: schoolClass.code,
      level: schoolClass.level,
      section: schoolClass.section,
      academicYear: schoolClass.academicYear,
      classTeacherId: schoolClass.classTeacherId,
      isActive: schoolClass.isActive,
      createdAt: schoolClass.createdAt,
      updatedAt: schoolClass.updatedAt,
    };
  }
}
