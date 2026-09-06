import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

@Controller()
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get('roles')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('roles/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post('roles')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch('roles/:id/permissions')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  setPermissions(@Param('id') id: string, @Body() dto: SetRolePermissionsDto) {
    return this.rolesService.setPermissions(id, dto);
  }

  @Delete('roles/:id')
  @CheckPolicies((ability) => ability.can('manage', 'Role'))
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
