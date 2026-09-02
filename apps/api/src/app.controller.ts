import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from './common/guards/policies.guard';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('roles')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  async getRoles() {
    return await this.prisma.role.findMany();
  }
}
