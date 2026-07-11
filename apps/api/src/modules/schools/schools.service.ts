import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { isPlatformRole } from '@school-saas/config';
import { IAuthenticatedUser, ISchool } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSchoolDto): Promise<ISchool> {
    try {
      const school = await this.prisma.school.create({
        data: {
          name: dto.name.trim(),
          slug: this.normalizeSlug(dto.slug ?? dto.name),
        },
      });

      return this.toSchool(school);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  async findAll(): Promise<ISchool[]> {
    const schools = await this.prisma.school.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });

    return schools.map((school) => this.toSchool(school));
  }

  async findOne(currentUser: IAuthenticatedUser, id: string): Promise<ISchool> {
    this.ensureSchoolAccess(currentUser, id);

    const school = await this.prisma.school.findUnique({ where: { id } });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return this.toSchool(school);
  }

  async update(
    currentUser: IAuthenticatedUser,
    id: string,
    dto: UpdateSchoolDto,
  ): Promise<ISchool> {
    this.ensureSchoolAccess(currentUser, id);

    try {
      const school = await this.prisma.school.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.slug ? { slug: this.normalizeSlug(dto.slug) } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      return this.toSchool(school);
    } catch (error) {
      this.handleKnownPrismaError(error);
    }
  }

  private ensureSchoolAccess(currentUser: IAuthenticatedUser, schoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== schoolId) {
      throw new ForbiddenException('You cannot access this school');
    }
  }

  private normalizeSlug(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new BadRequestException('School slug must contain letters or numbers');
    }

    return slug;
  }

  private handleKnownPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A school with this slug already exists');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('School not found');
      }
    }

    throw error;
  }

  private toSchool(school: School): ISchool {
    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      isActive: school.isActive,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }
}
