import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role as PrismaRole, User } from '@prisma/client';
import { Role } from '@school-saas/config';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { hashPassword, hashToken } from '../../common/utils/hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    schoolId: null,
    email: 'admin@example.com',
    passwordHash: 'hashed-password',
    role: PrismaRole.SUPER_ADMIN,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createConfigService(): ConfigService {
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_REFRESH_EXPIRES_IN: '7d',
  };

  return {
    get: jest.fn((key: string, defaultValue?: string) => values[key] ?? defaultValue),
    getOrThrow: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn<() => Promise<User | null>>(),
    },
    refreshToken: {
      create: jest.fn<() => Promise<unknown>>(),
      findFirst: jest.fn<() => Promise<unknown>>(),
      update: jest.fn<() => Promise<unknown>>(),
      updateMany: jest.fn<() => Promise<unknown>>(),
    },
  };
}

function createJwtMock() {
  return {
    signAsync: jest.fn<() => Promise<string>>(),
    verifyAsync: jest.fn<() => Promise<unknown>>(),
  };
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: ReturnType<typeof createJwtMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwtService = createJwtMock();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      createConfigService(),
    );
  });

  it('logs in with normalized email and stores a hashed refresh token', async () => {
    const user = createUser({ passwordHash: await hashPassword('SecurePass123') });
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.refreshToken.create.mockResolvedValue({});
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: ' Admin@Example.COM ',
      password: 'SecurePass123',
    });

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        sub: user.id,
        email: user.email,
        role: Role.SUPER_ADMIN,
        schoolId: null,
      },
      { secret: 'a'.repeat(32), expiresIn: '15m' },
    );
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        tokenHash: hashToken('refresh-token'),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('rejects inactive or missing users without revealing which check failed', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'SecurePass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid refresh token and revokes the previous token', async () => {
    const user = createUser({ schoolId: '00000000-0000-0000-0000-000000000010' });
    const oldRefreshToken = 'old-refresh-token';
    jwtService.verifyAsync.mockResolvedValue({ sub: user.id, tokenType: 'refresh' });
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000099',
      userId: user.id,
      tokenHash: hashToken(oldRefreshToken),
      revokedAt: null,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user,
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refresh(oldRefreshToken);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        userId: user.id,
        tokenHash: hashToken(oldRefreshToken),
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      include: { user: true },
    });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000099' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('revokes a refresh token on logout', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await service.logout(USER_ID, 'refresh-token');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        tokenHash: hashToken('refresh-token'),
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
