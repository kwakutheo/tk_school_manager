import { Body, Controller, Get, Post } from '@nestjs/common';
import { IAuthenticatedUser, ITokenPair } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<ITokenPair> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<ITokenPair> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: IAuthenticatedUser, @Body() dto: RefreshDto): Promise<{ success: true }> {
    await this.authService.logout(user.id, dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: IAuthenticatedUser): IAuthenticatedUser {
    return user;
  }
}
