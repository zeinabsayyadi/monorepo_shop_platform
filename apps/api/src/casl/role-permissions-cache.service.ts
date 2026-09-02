import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Actions, Subjects } from './casl-types';

export interface Grant {
  action: Actions;
  subject: Subjects;
}

const CACHE_TTL_SECONDS = 300;
const cacheKey = (roleId: string) => `role-permissions:${roleId}`;

@Injectable()
export class RolePermissionsCacheService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getGrantsForRole(roleId: string): Promise<Grant[]> {
    const cached = await this.redis.get(cacheKey(roleId));
    if (cached) return JSON.parse(cached);

    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    const grants: Grant[] = rows.map((r) => ({
      subject: r.permission.subject as Subjects,
      action: r.permission.action as Actions,
    }));

    await this.redis.set(
      cacheKey(roleId),
      JSON.stringify(grants),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return grants;
  }

  async invalidate(roleId: string): Promise<void> {
    await this.redis.del(cacheKey(roleId));
  }
}
