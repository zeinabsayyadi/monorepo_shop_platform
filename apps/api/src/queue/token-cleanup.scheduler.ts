import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TOKEN_CLEANUP_QUEUE } from './queue.constants';

@Injectable()
export class TokenCleanupScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(TOKEN_CLEANUP_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'token-cleanup-recurring', // scheduler id — this replaces the old jobId trick
      { pattern: '0 3 * * *' }, // every day at 3:00 AM
      { name: 'sweep', data: {} },
    );
  }
}
