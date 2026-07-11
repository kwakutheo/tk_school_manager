import { IsEmail, IsString, MinLength } from 'class-validator';
import { APP_CONSTANTS } from '@school-saas/config';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(APP_CONSTANTS.PASSWORD_MIN_LENGTH)
  password!: string;
}
