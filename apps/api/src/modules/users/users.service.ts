import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role as PrismaRole, User } from '@prisma/client';
import { isPlatformRole, isSchoolScopedRole, Role } from '@school-saas/config';
import { IAuthenticatedUser, IUserPublic } from '@school-saas/types';
import { hashPassword } from '../../common/utils/hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: IAuthenticatedUser, dto: CreateUserDto): Promise<IUserPublic> {
    this.ensureCanManageRole(currentUser, dto.role);

    const schoolId = this.resolveSchoolIdForCreate(currentUser, dto);
    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: this.normalizeEmail(dto.email),
        passwordHash,
        role: dto.role as PrismaRole,
        schoolId,
      },
    });

    return this.toPublicUser(user);
  }

  async findAll(currentUser: IAuthenticatedUser, schoolId?: string): Promise<IUserPublic[]> {
    const where = this.buildTenantWhere(currentUser, schoolId);
    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<IUserPublic> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.ensureTenantAccess(currentUser, user.schoolId);
    return this.toPublicUser(user);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<IUserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    const nextRole = dto.role ?? (existing.role as Role);
    this.ensureCanManageRole(currentUser, nextRole);

    const nextSchoolId =
      dto.schoolId === undefined
        ? existing.schoolId
        : this.resolveSchoolIdForUpdate(currentUser, nextRole, dto.schoolId);

    const data: Prisma.UserUpdateInput = {
      ...(dto.email ? { email: this.normalizeEmail(dto.email) } : {}),
      ...(dto.password ? { passwordHash: await hashPassword(dto.password) } : {}),
      ...(dto.role ? { role: dto.role as PrismaRole } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      school: nextSchoolId ? { connect: { id: nextSchoolId } } : { disconnect: true },
    };

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.toPublicUser(updated);
  }

  async softDelete(currentUser: IAuthenticatedUser, id: string): Promise<IUserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    if (existing.id === currentUser.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        refreshTokens: {
          updateMany: {
            where: { revokedAt: null },
            data: { revokedAt: new Date() },
          },
        },
      },
    });

    return this.toPublicUser(updated);
  }

  private buildTenantWhere(
    currentUser: IAuthenticatedUser,
    requestedSchoolId?: string,
  ): Prisma.UserWhereInput {
    if (isPlatformRole(currentUser.role)) {
      return requestedSchoolId ? { schoolId: requestedSchoolId } : {};
    }

    if (!currentUser.schoolId) {
      throw new ForbiddenException('School-scoped user is missing a school context');
    }

    if (requestedSchoolId && requestedSchoolId !== currentUser.schoolId) {
      throw new ForbiddenException('You cannot access users outside your school');
    }

    return { schoolId: currentUser.schoolId };
  }

  private resolveSchoolIdForCreate(
    currentUser: IAuthenticatedUser,
    dto: CreateUserDto,
  ): string | null {
    if (isPlatformRole(dto.role)) {
      if (!isPlatformRole(currentUser.role)) {
        throw new ForbiddenException('Only platform roles can create platform users');
      }

      if (dto.schoolId) {
        throw new BadRequestException('Platform users must not be assigned to a school');
      }

      return null;
    }

    if (isSchoolScopedRole(dto.role)) {
      if (isPlatformRole(currentUser.role)) {
        if (!dto.schoolId) {
          throw new BadRequestException('A schoolId is required for school-scoped users');
        }

        return dto.schoolId;
      }

      if (!currentUser.schoolId) {
        throw new ForbiddenException('School-scoped user is missing a school context');
      }

      if (dto.schoolId && dto.schoolId !== currentUser.schoolId) {
        throw new ForbiddenException('You cannot create users outside your school');
      }

      return currentUser.schoolId;
    }

    throw new BadRequestException('Unsupported role');
  }

  private resolveSchoolIdForUpdate(
    currentUser: IAuthenticatedUser,
    nextRole: Role,
    requestedSchoolId?: string | null,
  ): string | null {
    if (isPlatformRole(nextRole)) {
      if (!isPlatformRole(currentUser.role)) {
        throw new ForbiddenException('Only platform roles can assign platform roles');
      }

      return null;
    }

    if (!isSchoolScopedRole(nextRole)) {
      throw new BadRequestException('Unsupported role');
    }

    if (isPlatformRole(currentUser.role)) {
      if (!requestedSchoolId) {
        throw new BadRequestException('A schoolId is required for school-scoped users');
      }

      return requestedSchoolId;
    }

    if (!currentUser.schoolId) {
      throw new ForbiddenException('School-scoped user is missing a school context');
    }

    if (requestedSchoolId && requestedSchoolId !== currentUser.schoolId) {
      throw new ForbiddenException('You cannot move users outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureCanManageRole(currentUser: IAuthenticatedUser, targetRole: Role): void {
    if (isPlatformRole(targetRole) && currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can manage platform roles');
    }
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string | null): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access users outside your school');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toPublicUser(user: User): IUserPublic {
    return {
      id: user.id,
      schoolId: user.schoolId,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
