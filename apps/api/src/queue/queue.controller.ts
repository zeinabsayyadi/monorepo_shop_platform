import { Controller, Post, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { TOKEN_CLEANUP_QUEUE } from './queue.constants';

@Controller('admin/token-cleanup')
export class QueueController {
  constructor(
    @InjectQueue(TOKEN_CLEANUP_QUEUE) private readonly queue: Queue,
  ) {}

  @Post('run-now')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Settings'))
  async runNow() {
    await this.queue.add('sweep', {});
    return {
      message: 'Token cleanup triggered — check server logs for the result.',
    };
  }
}
