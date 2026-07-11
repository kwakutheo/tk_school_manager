import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, Role, TEACHING_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, IStudentEnrollment, IStudentProfile } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateStudentEnrollmentDto } from './dto/create-student-enrollment.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';

const STUDENT_READ_ROLES = [...ADMIN_TIER_ROLES, ...TEACHING_ROLES] as const;
const STUDENT_WRITE_ROLES = [
  Role.SUPER_ADMIN,
  Role.SCHOOL_OWNER,
  Role.HEADMASTER,
  Role.SCHOOL_ADMIN,
  Role.ACADEMIC_COORDINATOR,
  Role.ADMIN_OFFICER,
] as const;

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(...STUDENT_WRITE_ROLES)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateStudentDto,
  ): Promise<IStudentProfile> {
    return this.studentsService.create(currentUser, dto);
  }

  @Get()
  @Roles(...STUDENT_READ_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('academicYear') academicYear?: string,
  ): Promise<IStudentProfile[]> {
    return this.studentsService.findAll(currentUser, { schoolId, classId, academicYear });
  }

  @Get(':id')
  @Roles(...STUDENT_READ_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IStudentProfile> {
    return this.studentsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(...STUDENT_WRITE_ROLES)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<IStudentProfile> {
    return this.studentsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.HEADMASTER, Role.SCHOOL_ADMIN)
  remove(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IStudentProfile> {
    return this.studentsService.softDelete(currentUser, id);
  }

  @Post(':id/enrollments')
  @Roles(...STUDENT_WRITE_ROLES)
  createEnrollment(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateStudentEnrollmentDto,
  ): Promise<IStudentEnrollment> {
    return this.studentsService.createEnrollment(currentUser, id, dto);
  }

  @Get(':id/enrollments')
  @Roles(...STUDENT_READ_ROLES)
  findEnrollments(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IStudentEnrollment[]> {
    return this.studentsService.findEnrollments(currentUser, id);
  }
}
