import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, Role } from '@school-saas/config';
import { IAuthenticatedUser, IStaffProfile } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

const STAFF_WRITE_ROLES = [
  Role.SUPER_ADMIN,
  Role.SCHOOL_OWNER,
  Role.HEADMASTER,
  Role.SCHOOL_ADMIN,
  Role.ADMIN_OFFICER,
] as const;

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(...STAFF_WRITE_ROLES)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateStaffDto,
  ): Promise<IStaffProfile> {
    return this.staffService.create(currentUser, dto);
  }

  @Get()
  @Roles(...ADMIN_TIER_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
  ): Promise<IStaffProfile[]> {
    return this.staffService.findAll(currentUser, { schoolId });
  }

  @Get(':id')
  @Roles(...ADMIN_TIER_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IStaffProfile> {
    return this.staffService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE_ROLES)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ): Promise<IStaffProfile> {
    return this.staffService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.HEADMASTER, Role.SCHOOL_ADMIN)
  remove(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IStaffProfile> {
    return this.staffService.softDelete(currentUser, id);
  }
}
