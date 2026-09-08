import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TOKEN_CLEANUP_QUEUE } from './queue.constants';

const REVOKED_GRACE_PERIOD_DAYS = 7;

@Processor(TOKEN_CLEANUP_QUEUE)
export class TokenCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(TokenCleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(): Promise<void> {
    const revokedCutoff = new Date(
      Date.now() - REVOKED_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true, createdAt: { lt: revokedCutoff } },
        ],
      },
    });

    this.logger.log(
      `Token cleanup: removed ${result.count} stale refresh token(s)`,
    );
  }
}
