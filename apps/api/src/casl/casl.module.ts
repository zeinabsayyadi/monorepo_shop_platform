import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { RolePermissionsCacheService } from './role-permissions-cache.service';

@Global()
@Module({
  providers: [CaslAbilityFactory, RolePermissionsCacheService],
  exports: [CaslAbilityFactory, RolePermissionsCacheService],
})
export class CaslModule {}
