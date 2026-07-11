import { Controller, Get, Param, Query } from '@nestjs/common';
import { IAuthenticatedUser, IClassTermReport, IStudentTermReport } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { REPORT_ACCESS_ROLES, ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('students/:studentId/term')
  @Roles(...REPORT_ACCESS_ROLES)
  getStudentTermReport(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ): Promise<IStudentTermReport> {
    return this.reportsService.getStudentTermReport(currentUser, studentId, academicYear, term);
  }

  @Get('classes/:classId/term')
  @Roles(...REPORT_ACCESS_ROLES)
  getClassTermReport(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('classId') classId: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
  ): Promise<IClassTermReport> {
    return this.reportsService.getClassTermReport(currentUser, classId, academicYear, term);
  }
}
