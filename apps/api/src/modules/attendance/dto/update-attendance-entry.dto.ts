import { AttendanceStatus } from '@school-saas/config';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAttendanceEntryDto {
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  remarks?: string | null;
}
