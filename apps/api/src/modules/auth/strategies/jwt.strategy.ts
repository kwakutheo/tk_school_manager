import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@school-saas/config';
import { IAuthenticatedUser, IJwtPayload } from '@school-saas/types';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: IJwtPayload): Promise<IAuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User is inactive or no longer exists');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      schoolId: user.schoolId,
    };
  }
}
