import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('coupons')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'Coupon'))
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('manage', 'Coupon'))
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  @CheckPolicies((ability) => ability.can('manage', 'Coupon'))
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id/deactivate')
  @CheckPolicies((ability) => ability.can('manage', 'Coupon'))
  deactivate(@Param('id') id: string) {
    return this.couponsService.deactivate(id);
  }
}
