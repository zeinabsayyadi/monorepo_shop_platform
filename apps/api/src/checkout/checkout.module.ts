import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { AddressesModule } from '../addresses/addresses.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [CartModule, AddressesModule, QueueModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
