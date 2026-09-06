import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { RedirectsService } from './redirects.service';

@Controller('redirects')
export class RedirectsController {
  constructor(private readonly redirectsService: RedirectsService) {}

  @Get(':fromPath')
  findByPath(@Param('fromPath') fromPath: string) {
    return this.redirectsService.findByPath(fromPath);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'SEO'))
  findAll() {
    return this.redirectsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'SEO'))
  create(@Body() dto: CreateRedirectDto) {
    return this.redirectsService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'SEO'))
  remove(@Param('id') id: string) {
    return this.redirectsService.remove(id);
  }
}
