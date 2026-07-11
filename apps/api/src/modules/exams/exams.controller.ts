import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ACADEMIC_MANAGEMENT_ROLES } from '@school-saas/config';
import { IAuthenticatedUser, IExam, IExamResult, IExamWithResults } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateExamDto } from './dto/create-exam.dto';
import { RecordExamResultsDto } from './dto/record-exam-results.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { EXAM_ACCESS_ROLES, ExamsService } from './exams.service';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(...EXAM_ACCESS_ROLES)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateExamDto,
  ): Promise<IExam> {
    return this.examsService.create(currentUser, dto);
  }

  @Get()
  @Roles(...EXAM_ACCESS_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('status') status?: string,
  ): Promise<IExam[]> {
    return this.examsService.findAll(currentUser, {
      schoolId,
      classId,
      subjectId,
      academicYear,
      term,
      status,
    });
  }

  @Get(':id')
  @Roles(...EXAM_ACCESS_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IExamWithResults> {
    return this.examsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(...ACADEMIC_MANAGEMENT_ROLES)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ): Promise<IExam> {
    return this.examsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(...ACADEMIC_MANAGEMENT_ROLES)
  archive(@CurrentUser() currentUser: IAuthenticatedUser, @Param('id') id: string): Promise<IExam> {
    return this.examsService.archive(currentUser, id);
  }

  @Post(':id/results')
  @Roles(...EXAM_ACCESS_ROLES)
  recordResults(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecordExamResultsDto,
  ): Promise<IExamResult[]> {
    return this.examsService.recordResults(currentUser, id, dto);
  }
}
