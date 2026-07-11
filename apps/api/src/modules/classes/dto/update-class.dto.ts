import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  level?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  section?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  academicYear?: string;

  @IsOptional()
  @IsUUID()
  classTeacherId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
