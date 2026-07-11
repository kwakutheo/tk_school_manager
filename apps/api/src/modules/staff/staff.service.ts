import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StaffProfile } from '@prisma/client';
import { isPlatformRole, isStaffRole, Role } from '@school-saas/config';
import { IAuthenticatedUser, IStaffProfile } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

interface ListStaffFilters {
  schoolId?: string;
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateStaffDto): Promise<IStaffProfile> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);

    await this.ensureSchoolExists(schoolId);
    await this.ensureStaffUserCanBeLinked(dto.userId, schoolId);

    try {
      const staff = await this.prisma.staffProfile.create({
        data: {
          schoolId,
          userId: dto.userId ?? null,
          staffNumber: this.clean(dto.staffNumber),
          firstName: this.clean(dto.firstName),
          middleName: this.optionalClean(dto.middleName),
          lastName: this.clean(dto.lastName),
          phoneNumber: this.optionalClean(dto.phoneNumber),
          jobTitle: this.optionalClean(dto.jobTitle),
          department: this.optionalClean(dto.department),
          hireDate: this.optionalDate(dto.hireDate),
        },
      });

      return this.toStaffProfile(staff);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    filters: ListStaffFilters = {},
  ): Promise<IStaffProfile[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const staff = await this.prisma.staffProfile.findMany({
      where: { schoolId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { staffNumber: 'asc' }],
    });

    return staff.map((staffMember) => this.toStaffProfile(staffMember));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<IStaffProfile> {
    const staff = await this.prisma.staffProfile.findUnique({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    this.ensureTenantAccess(currentUser, staff.schoolId);
    return this.toStaffProfile(staff);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateStaffDto,
  ): Promise<IStaffProfile> {
    const existing = await this.prisma.staffProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);
    await this.ensureStaffUserCanBeLinked(dto.userId, existing.schoolId);

    try {
      const updated = await this.prisma.staffProfile.update({
        where: { id },
        data: {
          ...(dto.staffNumber ? { staffNumber: this.clean(dto.staffNumber) } : {}),
          ...(dto.firstName ? { firstName: this.clean(dto.firstName) } : {}),
          ...(dto.middleName !== undefined
            ? { middleName: this.optionalClean(dto.middleName) }
            : {}),
          ...(dto.lastName ? { lastName: this.clean(dto.lastName) } : {}),
          ...(dto.phoneNumber !== undefined
            ? { phoneNumber: this.optionalClean(dto.phoneNumber) }
            : {}),
          ...(dto.jobTitle !== undefined ? { jobTitle: this.optionalClean(dto.jobTitle) } : {}),
          ...(dto.department !== undefined
            ? { department: this.optionalClean(dto.department) }
            : {}),
          ...(dto.hireDate !== undefined ? { hireDate: this.optionalDate(dto.hireDate) } : {}),
          ...(dto.userId !== undefined ? { userId: dto.userId ?? null } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return this.toStaffProfile(updated);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async softDelete(currentUser: IAuthenticatedUser, id: string): Promise<IStaffProfile> {
    const existing = await this.prisma.staffProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    const updated = await this.prisma.staffProfile.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toStaffProfile(updated);
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
      throw new ForbiddenException('You cannot access staff outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access staff outside your school');
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

  private async ensureStaffUserCanBeLinked(
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

    if (!user?.isActive || user.schoolId !== schoolId || !isStaffRole(user.role as Role)) {
      throw new BadRequestException('Linked user must be an active staff user in this school');
    }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A staff member with the same unique details already exists');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Staff member not found');
      }
    }

    throw error;
  }

  private toStaffProfile(staff: StaffProfile): IStaffProfile {
    return {
      id: staff.id,
      schoolId: staff.schoolId,
      userId: staff.userId,
      staffNumber: staff.staffNumber,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      phoneNumber: staff.phoneNumber,
      jobTitle: staff.jobTitle,
      department: staff.department,
      hireDate: staff.hireDate,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }
}
