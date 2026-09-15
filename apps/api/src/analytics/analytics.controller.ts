import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @CheckPolicies((ability) => ability.can('read', 'Analytics'))
  overview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.overview(query.from, query.to);
  }

  @Get('revenue')
  @CheckPolicies((ability) => ability.can('read', 'Analytics'))
  revenue(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.revenueByDay(query.from, query.to);
  }

  @Get('top-products')
  @CheckPolicies((ability) => ability.can('read', 'Analytics'))
  topProducts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.topProducts(query.from, query.to);
  }

  @Get('coupons')
  @CheckPolicies((ability) => ability.can('read', 'Analytics'))
  coupons() {
    return this.analyticsService.coupons();
  }
}
