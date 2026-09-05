import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { AddressesService } from '../addresses/addresses.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ORDER_CLEANUP_QUEUE } from '../queue/queue.constants';

const ORDER_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    @InjectQueue(ORDER_CLEANUP_QUEUE) private readonly orderCleanupQueue: Queue,
  ) {}

  async checkout(userId: string, addressId: string) {
    await this.addressesService.findOneOwned(userId, addressId); // 404/403 if not theirs

    const cart = await this.cartService.getCart(`user:${userId}`);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    const unavailable = cart.items.filter((item) => !item.available);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        'Some items in your cart are no longer available',
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItemsData: {
        productId: string;
        quantity: number;
        price: number;
      }[] = [];

      for (const item of cart.items) {
        if (!item.available) continue; // TypeScript narrowing; already filtered above

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

        total += item.lineTotal;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        });
      }

      return tx.order.create({
        data: {
          userId,
          addressId,
          status: 'PENDING',
          total,
          items: { create: orderItemsData },
        },
        include: { items: true, address: true },
      });
    });

    await this.orderCleanupQueue.add(
      'cancel-expired-order',
      { orderId: order.id },
      { delay: ORDER_EXPIRY_MS, jobId: order.id },
    );

    await this.cartService.clearCart(`user:${userId}`);
    return order;
  }
}
