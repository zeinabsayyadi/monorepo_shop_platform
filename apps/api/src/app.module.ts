import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { AddressesModule } from './addresses/addresses.module';
import { CheckoutModule } from './checkout/checkout.module';
import { QueueModule } from './queue/queue.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { RolesModule } from './roles/roles.module';
import { CouponsModule } from './coupons/coupons.module';
import { PagesModule } from './pages/pages.module';
import { RedirectsModule } from './redirects/redirects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    PrismaModule,
    CaslModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    AddressesModule,
    CheckoutModule,
    QueueModule,
    PaymentsModule,
    OrdersModule,
    RolesModule,
    CouponsModule,
    PagesModule,
    RedirectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
