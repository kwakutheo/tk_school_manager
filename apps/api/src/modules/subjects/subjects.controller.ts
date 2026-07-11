import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ACADEMIC_MANAGEMENT_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, ISubject } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SUBJECT_READ_ROLES, SubjectsService } from './subjects.service';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(...ACADEMIC_MANAGEMENT_ROLES)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateSubjectDto,
  ): Promise<ISubject> {
    return this.subjectsService.create(currentUser, dto);
  }

  @Get()
  @Roles(...SUBJECT_READ_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<ISubject[]> {
    return this.subjectsService.findAll(currentUser, schoolId, activeOnly === 'true');
  }

  @Get(':id')
  @Roles(...SUBJECT_READ_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ISubject> {
    return this.subjectsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(...ACADEMIC_MANAGEMENT_ROLES)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<ISubject> {
    return this.subjectsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(...ACADEMIC_MANAGEMENT_ROLES)
  remove(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ISubject> {
    return this.subjectsService.softDelete(currentUser, id);
  }
}
