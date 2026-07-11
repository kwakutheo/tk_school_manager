import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, TEACHING_ROLES } from '@school-saas/config';
import {
  IAttendanceEntry,
  IAttendanceSession,
  IAttendanceSessionWithEntries,
  IAuthenticatedUser,
} from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { UpdateAttendanceEntryDto } from './dto/update-attendance-entry.dto';

const ATTENDANCE_ACCESS_ROLES = [...ADMIN_TIER_ROLES, ...TEACHING_ROLES] as const;

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions')
  @Roles(...ATTENDANCE_ACCESS_ROLES)
  createSession(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateAttendanceSessionDto,
  ): Promise<IAttendanceSessionWithEntries> {
    return this.attendanceService.createSession(currentUser, dto);
  }

  @Get('sessions')
  @Roles(...ATTENDANCE_ACCESS_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('attendanceDate') attendanceDate?: string,
  ): Promise<IAttendanceSession[]> {
    return this.attendanceService.findAll(currentUser, {
      schoolId,
      classId,
      academicYear,
      attendanceDate,
    });
  }

  @Get('sessions/:id')
  @Roles(...ATTENDANCE_ACCESS_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IAttendanceSessionWithEntries> {
    return this.attendanceService.findOne(currentUser, id);
  }

  @Patch('entries/:id')
  @Roles(...ATTENDANCE_ACCESS_ROLES)
  updateEntry(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceEntryDto,
  ): Promise<IAttendanceEntry> {
    return this.attendanceService.updateEntry(currentUser, id, dto);
  }
}
