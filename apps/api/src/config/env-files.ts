import { resolve } from 'node:path';

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function optionalEnvFilePath(): string[] {
  const envFile = process.env.ENV_FILE?.trim();

  if (!envFile) {
    return [];
  }

  return [resolve(process.cwd(), envFile)];
}

export function getEnvFilePaths(): string[] {
  const apiRoot = resolve(__dirname, '../..');
  const repoRoot = resolve(apiRoot, '../..');

  return unique([
    ...optionalEnvFilePath(),
    resolve(apiRoot, '.env.local'),
    resolve(apiRoot, '.env'),
    resolve(repoRoot, '.env.local'),
    resolve(repoRoot, '.env'),
  ]);
}
