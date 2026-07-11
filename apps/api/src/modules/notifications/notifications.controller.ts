import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, PLATFORM_ROLES, SCHOOL_SCOPED_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, INotification } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

const NOTIFICATION_READ_ROLES = [...PLATFORM_ROLES, ...SCHOOL_SCOPED_ROLES] as const;

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(...ADMIN_TIER_ROLES)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ): Promise<INotification> {
    return this.notificationsService.create(currentUser, dto);
  }

  @Get('me')
  @Roles(...NOTIFICATION_READ_ROLES)
  findMine(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<INotification[]> {
    return this.notificationsService.findMine(currentUser, unreadOnly === 'true');
  }

  @Get()
  @Roles(...ADMIN_TIER_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<INotification[]> {
    return this.notificationsService.findAll(currentUser, {
      schoolId,
      recipientId,
      status,
      channel,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Patch(':id/read')
  @Roles(...NOTIFICATION_READ_ROLES)
  markRead(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<INotification> {
    return this.notificationsService.markRead(currentUser, id);
  }
}
