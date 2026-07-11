import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { APP_CONSTANTS, Role } from '@school-saas/config';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(APP_CONSTANTS.PASSWORD_MIN_LENGTH)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsUUID()
  schoolId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
