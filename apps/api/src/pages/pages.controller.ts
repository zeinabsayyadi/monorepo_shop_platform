import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckPolicies, PoliciesGuard } from '../common/guards/policies.guard';
import { CreatePageDto } from './dto/create-page.dto';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAllPublished(@Query('locale') locale?: 'fa' | 'en') {
    return this.pagesService.findAllPublished(locale);
  }

  @Get(':locale/:slug')
  findBySlug(
    @Param('locale') locale: 'fa' | 'en',
    @Param('slug') slug: string,
  ) {
    return this.pagesService.findBySlug(locale, slug);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Content'))
  findAllForStaff() {
    return this.pagesService.findAllForStaff();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Content'))
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Content'))
  publish(@Param('id') id: string) {
    return this.pagesService.publish(id);
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Content'))
  unpublish(@Param('id') id: string) {
    return this.pagesService.unpublish(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can('manage', 'Content'))
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }
}
