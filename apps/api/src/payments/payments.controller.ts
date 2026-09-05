import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/pay')
  @UseGuards(JwtAuthGuard)
  initiate(@Param('id') orderId: string, @Req() req: Request) {
    return this.paymentsService.initiate((req as any).user.id, orderId);
  }

  @Get('payments/zarinpal/callback')
  handleCallback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
  ) {
    return this.paymentsService.handleCallback(authority, status);
  }
}
