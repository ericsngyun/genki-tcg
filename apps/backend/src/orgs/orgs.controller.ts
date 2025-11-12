import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Get('me')
  async getMyOrg(@CurrentUser() user: any) {
    return this.orgsService.getOrg(user.orgId);
  }

  @Get('users')
  async getUsers(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.orgsService.getOrgUsers(user.orgId, search);
  }
}
