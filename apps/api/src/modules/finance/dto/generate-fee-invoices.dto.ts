import { AcademicTerm } from '@school-saas/config';
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

export class GenerateFeeInvoicesDto {
  @IsUUID()
  classId!: string;

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

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description?: string | null;

  @IsDateString()
  dueDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  amount!: number;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
