import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolePermissionsCacheService } from '../casl/role-permissions-cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolePermissionsCache: RolePermissionsCacheService,
  ) {}

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ subject: 'asc' }, { action: 'asc' }],
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException(`A role named "${dto.name}" already exists`);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystemRole: false,
        permissions: {
          create: dto.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    return role;
  }

  async setPermissions(roleId: string, dto: SetRolePermissionsDto) {
    await this.findOne(roleId); // 404 if it doesn't exist

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      }),
    ]);

    await this.rolePermissionsCache.invalidate(roleId);

    return this.findOne(roleId);
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete a built-in system role');
    }

    const usersWithRole = await this.prisma.user.count({
      where: { roleId: id },
    });
    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete this role — ${usersWithRole} user(s) are still assigned to it`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    await this.rolePermissionsCache.invalidate(id);
  }
}
