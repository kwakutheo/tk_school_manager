import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  level?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  section?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  academicYear!: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  classTeacherId?: string;
}
