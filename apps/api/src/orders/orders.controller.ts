import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RefundOrderDto } from './dto/refund-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: string) {
    return this.ordersService.findAll((req as any).user, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.ordersService.findOne((req as any).user, id);
  }

  @Patch(':id/status')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can('update', 'Order'))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    return this.ordersService.updateStatus((req as any).user.id, id, dto);
  }

  @Post(':id/refund')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can('refund', 'Order'))
  refund(
    @Param('id') id: string,
    @Body() dto: RefundOrderDto,
    @Req() req: Request,
  ) {
    return this.ordersService.refund((req as any).user.id, id, dto);
  }
}
