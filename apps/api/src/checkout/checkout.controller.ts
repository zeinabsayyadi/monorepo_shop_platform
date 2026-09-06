import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  checkout(@Body() dto: CheckoutDto, @Req() req: Request) {
    return this.checkoutService.checkout(
      (req as any).user.id,
      dto.addressId,
      dto.couponCode,
    );
  }
}
