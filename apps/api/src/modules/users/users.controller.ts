import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ADMIN_TIER_ROLES, Role } from '@school-saas/config';
import { IAuthenticatedUser, IUserPublic } from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER, Role.SCHOOL_ADMIN)
  create(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateUserDto,
  ): Promise<IUserPublic> {
    return this.usersService.create(currentUser, dto);
  }

  @Get()
  @Roles(...ADMIN_TIER_ROLES)
  findAll(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
  ): Promise<IUserPublic[]> {
    return this.usersService.findAll(currentUser, schoolId);
  }

  @Get(':id')
  @Roles(...ADMIN_TIER_ROLES)
  findOne(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IUserPublic> {
    return this.usersService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Roles(...ADMIN_TIER_ROLES)
  update(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IUserPublic> {
    return this.usersService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_OWNER)
  remove(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IUserPublic> {
    return this.usersService.softDelete(currentUser, id);
  }
}
