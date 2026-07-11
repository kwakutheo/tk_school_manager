import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, Role, TEACHING_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, ISchoolClass } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

const CLASS_READ_ROLES = [...ADMIN_TIER_ROLES, ...TEACHING_ROLES] as const;

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_OWNER,
    Role.HEADMASTER,
    Role.SCHOOL_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.ADMIN_OFFICER,
  )
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateClassDto,
  ): Promise<ISchoolClass> {
    return this.classesService.create(currentUser, dto);
  }

  @Get()
  @Roles(...CLASS_READ_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
  ): Promise<ISchoolClass[]> {
    return this.classesService.findAll(currentUser, schoolId);
  }

  @Get(':id')
  @Roles(...CLASS_READ_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ISchoolClass> {
    return this.classesService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_OWNER,
    Role.HEADMASTER,
    Role.SCHOOL_ADMIN,
    Role.ACADEMIC_COORDINATOR,
    Role.ADMIN_OFFICER,
  )
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ISchoolClass> {
    return this.classesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.HEADMASTER, Role.SCHOOL_ADMIN)
  remove(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ISchoolClass> {
    return this.classesService.softDelete(currentUser, id);
  }
}
