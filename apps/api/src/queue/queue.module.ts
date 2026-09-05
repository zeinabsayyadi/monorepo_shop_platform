import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { OrderCleanupProcessor } from './order-cleanup.processor';
import { ORDER_CLEANUP_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: ORDER_CLEANUP_QUEUE }),
  ],
  providers: [OrderCleanupProcessor],
  exports: [BullModule],
})
export class QueueModule {}
