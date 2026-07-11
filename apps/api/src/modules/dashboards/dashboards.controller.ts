import { Controller, Get, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, TEACHING_ROLES } from '@school-saas/config';
import {
  IAdminDashboardSummary,
  IAuthenticatedUser,
  ITeacherDashboardSummary,
} from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('admin')
  @Roles(...ADMIN_TIER_ROLES)
  getAdminSummary(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('academicYear') academicYear?: string,
  ): Promise<IAdminDashboardSummary> {
    return this.dashboardsService.getAdminSummary(currentUser, schoolId, academicYear);
  }

  @Get('teacher')
  @Roles(...TEACHING_ROLES)
  getTeacherSummary(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('academicYear') academicYear?: string,
  ): Promise<ITeacherDashboardSummary> {
    return this.dashboardsService.getTeacherSummary(currentUser, academicYear);
  }
}
