import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolePermissionsCacheService } from '../casl/role-permissions-cache.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RefundOrderDto } from './dto/refund-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolePermissions: RolePermissionsCacheService,
  ) {}

  private async hasStaffOrderAccess(roleId: string): Promise<boolean> {
    const grants = await this.rolePermissions.getGrantsForRole(roleId);
    return grants.some(
      (g) =>
        g.subject === 'Order' && (g.action === 'read' || g.action === 'manage'),
    );
  }

  async findAll(user: { id: string; roleId: string }, status?: string) {
    const isStaff = await this.hasStaffOrderAccess(user.roleId);

    return this.prisma.order.findMany({
      where: {
        ...(isStaff ? {} : { userId: user.id }), // staff sees everyone's, customers see only their own
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true, address: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: { id: string; roleId: string }, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        address: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isStaff = await this.hasStaffOrderAccess(user.roleId);
    if (!isStaff && order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }

    return order;
  }

  async updateStatus(
    actorId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException(
        `Cannot change status of a ${order.status.toLowerCase()} order`,
      );
    }
    if (dto.status === 'SHIPPED' && !dto.trackingNo) {
      throw new BadRequestException(
        'trackingNo is required when marking an order as shipped',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status, trackingNo: dto.trackingNo },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'ORDER_STATUS_CHANGED',
        targetId: orderId,
        metadata: { from: order.status, to: dto.status },
      },
    });

    return updated;
  }

  async refund(actorId: string, orderId: string, dto: RefundOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot refund an order with status ${order.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'ORDER_REFUNDED',
        targetId: orderId,
        metadata: { reason: dto.reason ?? null, previousStatus: order.status },
      },
    });

    return updated;
  }
}
