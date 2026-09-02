import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AppAbility } from './casl-types';
import { RolePermissionsCacheService } from './role-permissions-cache.service';

interface AppUser {
  id: string;
  roleId: string;
}

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly rolePermissions: RolePermissionsCacheService) {}

  async createForUser(user: AppUser): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    const grants = await this.rolePermissions.getGrantsForRole(user.roleId);

    for (const grant of grants) {
      can(grant.action, grant.subject);
    }

    can(['read', 'update'], 'User', { id: user.id } as any);
    can('read', 'Order', { userId: user.id } as any);
    can('create', 'Order');

    return build();
  }
}
