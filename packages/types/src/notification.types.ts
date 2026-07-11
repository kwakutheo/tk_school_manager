import { NotificationChannel, NotificationStatus } from '@school-saas/config';

export interface INotification {
  id: string;
  schoolId: string;
  recipientId: string;
  createdById: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata: unknown | null;
  sentAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
