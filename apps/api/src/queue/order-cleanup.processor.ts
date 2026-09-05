import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_CLEANUP_QUEUE } from './queue.constants';

interface CancelExpiredOrderPayload {
  orderId: string;
}

@Processor(ORDER_CLEANUP_QUEUE)
export class OrderCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderCleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CancelExpiredOrderPayload>): Promise<void> {
    const { orderId } = job.data;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(`Cleanup job fired for missing order ${orderId}`);
      return;
    }

    if (order.status !== 'PENDING') {
      // Already paid, already cancelled, whatever — nothing to do.
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });

    this.logger.log(`Auto-cancelled unpaid order ${orderId}, stock restored`);
  }
}
