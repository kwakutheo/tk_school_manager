import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IAuthenticatedUser } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditLogInput {
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  user?: IAuthenticatedUser;
  schoolId?: string | null;
  ip?: string;
  userAgent?: string | string[];
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: this.toJson(input.before),
        after: this.toJson(input.after),
        userId: input.user?.id,
        schoolId: input.schoolId ?? input.user?.schoolId ?? null,
        ip: input.ip,
        userAgent: Array.isArray(input.userAgent) ? input.userAgent.join(', ') : input.userAgent,
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
