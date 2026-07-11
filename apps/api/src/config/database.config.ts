import { ConfigService } from '@nestjs/config';

export function getDatabaseUrl(configService: ConfigService): string {
  return configService.getOrThrow<string>('DATABASE_URL');
}
