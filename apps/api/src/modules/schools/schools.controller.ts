import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser, ISchool } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateSchoolDto): Promise<ISchool> {
    return this.schoolsService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll(): Promise<ISchool[]> {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.HEADMASTER, Role.SCHOOL_ADMIN)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ISchool> {
    return this.schoolsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
  ): Promise<ISchool> {
    return this.schoolsService.update(currentUser, id, dto);
  }
}
