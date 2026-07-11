import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateAttendanceEntryDto } from './create-attendance-entry.dto';

export class CreateAttendanceSessionDto {
  @IsUUID()
  classId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  academicYear!: string;

  @IsDateString()
  attendanceDate!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceEntryDto)
  entries!: CreateAttendanceEntryDto[];
}
