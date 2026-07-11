import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import { getEnvFilePaths } from './src/config/env-files';

for (const path of getEnvFilePaths()) {
  config({ path, override: false });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'ts-node --project tsconfig.json prisma/seed.ts',
  },
});
