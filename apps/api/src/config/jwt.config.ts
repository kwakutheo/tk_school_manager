import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { APP_CONSTANTS } from '@school-saas/config';

export interface JwtSettings {
  accessSecret: string;
  accessExpiresIn: JwtSignOptions['expiresIn'];
  refreshSecret: string;
  refreshExpiresIn: JwtSignOptions['expiresIn'];
}

export function getJwtSettings(configService: ConfigService): JwtSettings {
  return {
    accessSecret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    accessExpiresIn: configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      APP_CONSTANTS.JWT_ACCESS_EXPIRES_IN,
    ) as JwtSignOptions['expiresIn'],
    refreshSecret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    refreshExpiresIn: configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      APP_CONSTANTS.JWT_REFRESH_EXPIRES_IN,
    ) as JwtSignOptions['expiresIn'],
  };
}
