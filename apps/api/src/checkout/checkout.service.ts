import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { AddressesService } from '../addresses/addresses.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ORDER_CLEANUP_QUEUE } from '../queue/queue.constants';
import { Prisma } from '@shop/db';

const ORDER_EXPIRY_MS = 60 * 60 * 1000;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    @InjectQueue(ORDER_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
  ) {}

  async checkout(userId: string, addressId: string, couponCode?: string) {
    await this.addressesService.findOneOwned(userId, addressId);

    const cart = await this.cartService.getCart(`user:${userId}`);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');
    if (cart.items.some((item) => !item.available)) {
      throw new BadRequestException(
        'Some items in your cart are no longer available',
      );
    }

    let order;
    try {
      order = await this.prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const orderItemsData: {
          productId: string;
          quantity: number;
          price: number;
        }[] = [];

        for (const item of cart.items) {
          if (!item.available) continue;

          const decremented = await tx.product.updateMany({
            where: {
              id: item.productId,
              isActive: true,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0) {
            throw new BadRequestException(
              `"${item.name}" no longer has enough stock — someone may have just bought it.`,
            );
          }

          subtotal += item.lineTotal;
          orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
          });
        }

        let discountAmount = 0;
        let couponId: string | undefined;

        if (couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: couponCode },
          });

          if (!coupon || !coupon.isActive) {
            throw new BadRequestException('Invalid coupon code');
          }
          if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            throw new BadRequestException('This coupon has expired');
          }
          if (coupon.minOrderTotal && subtotal < coupon.minOrderTotal) {
            throw new BadRequestException(
              `This coupon requires a minimum order of ${coupon.minOrderTotal}`,
            );
          }

          // Atomic, race-safe redemption count check — same "conditional WHERE" pattern as stock.
          const redeemed = await tx.coupon.updateMany({
            where: {
              id: coupon.id,
              OR: [
                { maxRedemptions: null },
                { redemptionCount: { lt: coupon.maxRedemptions ?? 0 } },
              ],
            },
            data: { redemptionCount: { increment: 1 } },
          });
          if (redeemed.count === 0) {
            throw new BadRequestException(
              'This coupon has reached its usage limit',
            );
          }

          discountAmount =
            coupon.type === 'PERCENTAGE'
              ? Math.floor((subtotal * coupon.value) / 100)
              : Math.min(coupon.value, subtotal);
          couponId = coupon.id;
        }

        const total = subtotal - discountAmount;

        const createdOrder = await tx.order.create({
          data: {
            userId,
            addressId,
            status: 'PENDING',
            total,
            discountAmount,
            couponId,
            items: { create: orderItemsData },
          },
          include: { items: true, address: true },
        });

        if (couponId) {
          // The unique(couponId, userId) constraint is the REAL guard against reuse —
          // if this insert fails, the whole transaction rolls back, including the
          // stock decrement and redemptionCount increment above.
          await tx.couponRedemption.create({
            data: { couponId, userId, orderId: createdOrder.id },
          });
        }

        return createdOrder;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('You have already used this coupon.');
      }
      throw err;
    }

    await this.cleanupQueue.add(
      'cancel-expired-order',
      { orderId: order.id },
      { delay: ORDER_EXPIRY_MS, jobId: order.id },
    );
    await this.cartService.clearCart(`user:${userId}`);

    return order;
  }
}
