import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Role } from '@school-saas/config';
import { IJwtPayload, IRefreshTokenPayload, ITokenPair } from '@school-saas/types';
import { getJwtSettings } from '../../config/jwt.config';
import { PrismaService } from '../../prisma/prisma.service';
import { durationToDate } from '../../common/utils/duration.util';
import { comparePassword, hashToken } from '../../common/utils/hash.util';
import { LoginDto } from './dto/login.dto';

type AuthUser = Pick<User, 'id' | 'email' | 'passwordHash' | 'role' | 'schoolId' | 'isActive'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<ITokenPair> {
    const user = await this.validateCredentials(dto.email, dto.password);
    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<ITokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken || !storedToken.user.isActive) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(storedToken.user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async validateCredentials(email: string, password: string): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  private async issueTokenPair(user: Pick<User, 'id' | 'email' | 'role' | 'schoolId'>): Promise<ITokenPair> {
    const settings = getJwtSettings(this.configService);
    const accessPayload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      schoolId: user.schoolId,
    };
    const refreshPayload: IRefreshTokenPayload = {
      sub: user.id,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: settings.accessSecret,
        expiresIn: settings.accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: settings.refreshSecret,
        expiresIn: settings.refreshExpiresIn,
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: durationToDate(String(settings.refreshExpiresIn)),
      },
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<IRefreshTokenPayload> {
    const settings = getJwtSettings(this.configService);

    try {
      return await this.jwtService.verifyAsync<IRefreshTokenPayload>(refreshToken, {
        secret: settings.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }
}
