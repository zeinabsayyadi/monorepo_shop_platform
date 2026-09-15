import { Injectable } from '@nestjs/common';
import { Prisma } from '@shop/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(from?: string, to?: string) {
    return {
      gte: from
        ? new Date(from)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lte: to ? new Date(to) : new Date(),
    };
  }

  async overview(from?: string, to?: string) {
    const range = this.dateRange(from, to);

    const [revenueResult, ordersByStatus, customerCount, productCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'VERIFIED', createdAt: range },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where: { createdAt: range },
          _count: true,
        }),
        this.prisma.user.count({ where: { role: { name: 'Customer' } } }),
        this.prisma.product.count({ where: { isActive: true } }),
      ]);

    return {
      revenue: revenueResult._sum.amount ?? 0,
      paidOrderCount: revenueResult._count,
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.status,
        count: row._count,
      })),
      totalCustomers: customerCount,
      activeProducts: productCount,
    };
  }

  async revenueByDay(from?: string, to?: string) {
    const range = this.dateRange(from, to);

    return this.prisma.$queryRaw<{ day: Date; revenue: bigint }[]>(Prisma.sql`
      SELECT DATE_TRUNC('day', "createdAt") AS day, SUM("amount") AS revenue
      FROM "Payment"
      WHERE "status" = 'VERIFIED'
        AND "createdAt" >= ${range.gte}
        AND "createdAt" <= ${range.lte}
      GROUP BY day
      ORDER BY day ASC
    `);
  }

  async topProducts(from?: string, to?: string, limit = 10) {
    const range = this.dateRange(from, to);

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: range, status: { notIn: ['CANCELLED'] } } },
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = grouped.map((g) => g.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { translations: { where: { locale: 'fa' } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => ({
      productId: g.productId,
      name: productMap.get(g.productId)?.translations[0]?.name ?? 'Unknown',
      unitsSold: g._sum.quantity ?? 0,
    }));
  }

  async coupons() {
    const coupons = await this.prisma.coupon.findMany({
      where: { redemptionCount: { gt: 0 } },
      orderBy: { redemptionCount: 'desc' },
    });

    return coupons.map((c) => ({
      code: c.code,
      redemptionCount: c.redemptionCount,
      maxRedemptions: c.maxRedemptions,
      isActive: c.isActive,
    }));
  }
}
