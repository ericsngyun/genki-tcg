import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Get('me')
  async getMyOrg(@CurrentUser() user: AuthenticatedUser) {
    return this.orgsService.getOrg(user.orgId);
  }

  @Get('users')
  async getUsers(@CurrentUser() user: AuthenticatedUser, @Query('search') search?: string) {
    return this.orgsService.getOrgUsers(user.orgId, search);
  }
}
