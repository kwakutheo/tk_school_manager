import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  Notification,
  NotificationChannel as PrismaNotificationChannel,
  NotificationStatus as PrismaNotificationStatus,
} from '@prisma/client';
import { NotificationChannel, NotificationStatus, Role } from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const ADMIN_ID = '00000000-0000-0000-0000-000000000030';
const RECIPIENT_ID = '00000000-0000-0000-0000-000000000040';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000050';
const NOTIFICATION_ID = '00000000-0000-0000-0000-000000000060';

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: NOTIFICATION_ID,
    schoolId: SCHOOL_A,
    recipientId: RECIPIENT_ID,
    createdById: ADMIN_ID,
    channel: PrismaNotificationChannel.IN_APP,
    status: PrismaNotificationStatus.SENT,
    title: 'Fee reminder',
    message: 'Please settle outstanding fees.',
    metadata: null,
    sentAt: new Date('2026-09-15T08:00:00.000Z'),
    readAt: null,
    failedAt: null,
    failureReason: null,
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    user: {
      findUnique:
        jest.fn<
          () => Promise<{ id?: string; schoolId: string | null; isActive: boolean } | null>
        >(),
    },
    notification: {
      create: jest.fn<() => Promise<Notification>>(),
      findMany: jest.fn<() => Promise<Notification[]>>(),
      findUnique: jest.fn<() => Promise<Notification | null>>(),
      update: jest.fn<() => Promise<Notification>>(),
    },
  };
}

describe('NotificationsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: NotificationsService;

  const schoolAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const recipientUser: IAuthenticatedUser = {
    id: RECIPIENT_ID,
    email: 'parent@school.test',
    role: Role.PARENT,
    schoolId: SCHOOL_A,
  };

  const otherUser: IAuthenticatedUser = {
    id: OTHER_USER_ID,
    email: 'other@school.test',
    role: Role.PARENT,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000031',
    email: 'platform@test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('creates an in-app notification as sent for an active recipient in the school', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: RECIPIENT_ID,
      schoolId: SCHOOL_A,
      isActive: true,
    });
    prisma.notification.create.mockResolvedValue(createNotification());

    const result = await service.create(schoolAdmin, {
      recipientId: RECIPIENT_ID,
      title: ' Fee reminder ',
      message: ' Please settle outstanding fees. ',
      metadata: { invoiceId: 'INV-001' },
    });

    expect(result.status).toBe(NotificationStatus.SENT);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        recipientId: RECIPIENT_ID,
        createdById: ADMIN_ID,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: 'Fee reminder',
        message: 'Please settle outstanding fees.',
        metadata: { invoiceId: 'INV-001' },
        sentAt: expect.any(Date),
      },
    });
  });

  it('stores external-channel notifications as pending until a provider sends them', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: RECIPIENT_ID,
      schoolId: SCHOOL_A,
      isActive: true,
    });
    prisma.notification.create.mockResolvedValue(
      createNotification({
        channel: PrismaNotificationChannel.SMS,
        status: PrismaNotificationStatus.PENDING,
        sentAt: null,
      }),
    );

    const result = await service.create(schoolAdmin, {
      recipientId: RECIPIENT_ID,
      title: 'Attendance alert',
      message: 'Your child was absent today.',
      channel: NotificationChannel.SMS,
    });

    expect(result.status).toBe(NotificationStatus.PENDING);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        channel: NotificationChannel.SMS,
        status: NotificationStatus.PENDING,
        sentAt: null,
      }),
    });
  });

  it('blocks school admins from creating notifications outside their school', async () => {
    await expect(
      service.create(schoolAdmin, {
        recipientId: RECIPIENT_ID,
        title: 'Hello',
        message: 'Message',
        schoolId: SCHOOL_B,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('requires platform users to provide schoolId when creating notifications', async () => {
    await expect(
      service.create(superAdmin, {
        recipientId: RECIPIENT_ID,
        title: 'Hello',
        message: 'Message',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('rejects recipients outside the target school', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: RECIPIENT_ID,
      schoolId: SCHOOL_B,
      isActive: true,
    });

    await expect(
      service.create(schoolAdmin, {
        recipientId: RECIPIENT_ID,
        title: 'Hello',
        message: 'Message',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('lists the current user notifications and supports unread-only filtering', async () => {
    prisma.notification.findMany.mockResolvedValue([createNotification()]);

    const result = await service.findMine(recipientUser, true);

    expect(result).toHaveLength(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: {
        recipientId: RECIPIENT_ID,
        schoolId: SCHOOL_A,
        readAt: null,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  });

  it('lets admins list school notifications with validated filters', async () => {
    prisma.user.findUnique.mockResolvedValue({ schoolId: SCHOOL_A, isActive: true });
    prisma.notification.findMany.mockResolvedValue([createNotification()]);

    const result = await service.findAll(schoolAdmin, {
      recipientId: RECIPIENT_ID,
      status: NotificationStatus.SENT,
      channel: NotificationChannel.IN_APP,
      unreadOnly: true,
    });

    expect(result).toHaveLength(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        recipientId: RECIPIENT_ID,
        status: NotificationStatus.SENT,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  });

  it('rejects invalid admin list status filters', async () => {
    await expect(service.findAll(schoolAdmin, { status: 'NOPE' })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('marks the recipient own unread notification as read', async () => {
    prisma.notification.findUnique.mockResolvedValue(createNotification());
    prisma.notification.update.mockResolvedValue(
      createNotification({ readAt: new Date('2026-09-15T09:00:00.000Z') }),
    );

    const result = await service.markRead(recipientUser, NOTIFICATION_ID);

    expect(result.readAt).toBeInstanceOf(Date);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: NOTIFICATION_ID },
      data: { readAt: expect.any(Date) },
    });
  });

  it('does not update notifications that are already read', async () => {
    const readAt = new Date('2026-09-15T09:00:00.000Z');
    prisma.notification.findUnique.mockResolvedValue(createNotification({ readAt }));

    const result = await service.markRead(recipientUser, NOTIFICATION_ID);

    expect(result.readAt).toEqual(readAt);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('blocks users from marking another user notification as read', async () => {
    prisma.notification.findUnique.mockResolvedValue(createNotification());

    await expect(service.markRead(otherUser, NOTIFICATION_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});
