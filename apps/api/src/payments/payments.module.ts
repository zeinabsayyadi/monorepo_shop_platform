import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZarinpalProvider } from './providers/zarinpal.provider';
import { PAYMENT_PROVIDER } from './payment-provider.interface';

@Module({
  imports: [QueueModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_PROVIDER, useClass: ZarinpalProvider },
  ],
})
export class PaymentsModule {}
