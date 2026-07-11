import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Notification,
  NotificationChannel as PrismaNotificationChannel,
  NotificationStatus as PrismaNotificationStatus,
  Prisma,
} from '@prisma/client';
import { NotificationChannel, NotificationStatus, isPlatformRole } from '@school-saas/config';
import { IAuthenticatedUser, INotification } from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

interface ListNotificationsFilters {
  schoolId?: string;
  recipientId?: string;
  status?: string;
  channel?: string;
  unreadOnly?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    currentUser: IAuthenticatedUser,
    dto: CreateNotificationDto,
  ): Promise<INotification> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
      select: { id: true, schoolId: true, isActive: true },
    });

    if (!recipient?.isActive || recipient.schoolId !== schoolId) {
      throw new BadRequestException('Recipient must be an active user in this school');
    }

    const channel = dto.channel ?? NotificationChannel.IN_APP;
    const now = new Date();
    const isInApp = channel === NotificationChannel.IN_APP;

    const notification = await this.prisma.notification.create({
      data: {
        schoolId,
        recipientId: dto.recipientId,
        createdById: currentUser.id,
        channel: channel as PrismaNotificationChannel,
        status: (isInApp
          ? NotificationStatus.SENT
          : NotificationStatus.PENDING) as PrismaNotificationStatus,
        title: this.clean(dto.title),
        message: this.clean(dto.message),
        ...(dto.metadata ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
        sentAt: isInApp ? now : null,
      },
    });

    return this.toNotification(notification);
  }

  async findMine(currentUser: IAuthenticatedUser, unreadOnly = false): Promise<INotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        recipientId: currentUser.id,
        ...(currentUser.schoolId ? { schoolId: currentUser.schoolId } : {}),
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return notifications.map((notification) => this.toNotification(notification));
  }

  async findAll(
    currentUser: IAuthenticatedUser,
    filters: ListNotificationsFilters = {},
  ): Promise<INotification[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const status = this.optionalEnumValue(NotificationStatus, filters.status, 'status');
    const channel = this.optionalEnumValue(NotificationChannel, filters.channel, 'channel');

    if (filters.recipientId) {
      await this.ensureRecipientInSchool(filters.recipientId, schoolId);
    }

    const notifications = await this.prisma.notification.findMany({
      where: {
        schoolId,
        ...(filters.recipientId ? { recipientId: filters.recipientId } : {}),
        ...(status ? { status: status as PrismaNotificationStatus } : {}),
        ...(channel ? { channel: channel as PrismaNotificationChannel } : {}),
        ...(filters.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return notifications.map((notification) => this.toNotification(notification));
  }

  async markRead(currentUser: IAuthenticatedUser, id: string): Promise<INotification> {
    const existing = await this.prisma.notification.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.recipientId !== currentUser.id) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    this.ensureTenantAccess(currentUser, existing.schoolId);

    if (existing.readAt) {
      return this.toNotification(existing);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return this.toNotification(updated);
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
      throw new ForbiddenException('You cannot access notifications outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access notifications outside your school');
    }
  }

  private async ensureRecipientInSchool(recipientId: string, schoolId: string): Promise<void> {
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { schoolId: true, isActive: true },
    });

    if (!recipient?.isActive || recipient.schoolId !== schoolId) {
      throw new BadRequestException('Recipient must be an active user in this school');
    }
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
      throw new BadRequestException(`Invalid notification ${fieldName}`);
    }

    return value as T[keyof T];
  }

  private clean(value: string): string {
    return value.trim();
  }

  private toNotification(notification: Notification): INotification {
    return {
      id: notification.id,
      schoolId: notification.schoolId,
      recipientId: notification.recipientId,
      createdById: notification.createdById,
      channel: notification.channel as NotificationChannel,
      status: notification.status as NotificationStatus,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      failedAt: notification.failedAt,
      failureReason: notification.failureReason,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
