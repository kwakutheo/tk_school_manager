import { AcademicTerm, ExamStatus } from '@school-saas/config';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExamDto {
  @IsUUID()
  classId!: string;

  @IsUUID()
  subjectId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  academicYear!: string;

  @IsEnum(AcademicTerm)
  term!: AcademicTerm;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsDateString()
  examDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999.99)
  maxScore!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  weight?: number | null;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
