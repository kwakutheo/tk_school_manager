import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { APP_CONSTANTS, Role } from '@school-saas/config';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(APP_CONSTANTS.PASSWORD_MIN_LENGTH)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
