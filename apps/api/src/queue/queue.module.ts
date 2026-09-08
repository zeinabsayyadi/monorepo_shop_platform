import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { OrderCleanupProcessor } from './order-cleanup.processor';
import { TokenCleanupProcessor } from './token-cleanup.processor';
import { TokenCleanupScheduler } from './token-cleanup.scheduler';
import { ORDER_CLEANUP_QUEUE, TOKEN_CLEANUP_QUEUE } from './queue.constants';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue(
      { name: ORDER_CLEANUP_QUEUE },
      { name: TOKEN_CLEANUP_QUEUE },
    ),
  ],
  controllers: [QueueController],
  providers: [
    OrderCleanupProcessor,
    TokenCleanupProcessor,
    TokenCleanupScheduler,
  ],
  exports: [BullModule],
})
export class QueueModule {}
