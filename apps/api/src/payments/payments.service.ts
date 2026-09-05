import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ORDER_CLEANUP_QUEUE } from '../queue/queue.constants';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    @InjectQueue(ORDER_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
  ) {}

  async initiate(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('This order is not awaiting payment');
    }

    const callbackUrl = `${this.config.getOrThrow('ZARINPAL_CALLBACK_BASE_URL')}/payments/zarinpal/callback`;
    const { authority, redirectUrl } = await this.provider.request(
      order.total,
      `Order ${order.id}`,
      callbackUrl,
    );

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'zarinpal',
        authority,
        amount: order.total,
        status: 'PENDING',
      },
    });

    return { redirectUrl };
  }

  async handleCallback(authority: string, status: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { authority },
    });
    if (!payment)
      throw new NotFoundException('Payment not found for this authority');

    if (status !== 'OK') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      return { success: false, message: 'Payment was cancelled or failed.' };
    }

    const result = await this.provider.verify(authority, payment.amount);

    if (!result.success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      return { success: false, message: 'Payment verification failed.' };
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'VERIFIED', refId: result.refId },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PROCESSING' },
      }),
    ]);

    // Order is paid — no need to let the auto-cancel job fire later.
    await this.cleanupQueue.remove(payment.orderId);

    return { success: true, refId: result.refId };
  }
}
