import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStudentEnrollmentDto {
  @IsUUID()
  classId!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  academicYear!: string;
}
