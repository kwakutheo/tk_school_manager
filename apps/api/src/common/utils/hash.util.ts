import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
