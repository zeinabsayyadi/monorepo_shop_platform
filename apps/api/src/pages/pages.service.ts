import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePageDto) {
    return this.prisma.page.create({
      data: {
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    });
  }

  async findAllPublished(locale?: 'fa' | 'en') {
    return this.prisma.page.findMany({
      where: { isPublished: true },
      include: { translations: locale ? { where: { locale } } : true },
    });
  }

  async findAllForStaff() {
    return this.prisma.page.findMany({ include: { translations: true } });
  }

  async findBySlug(locale: 'fa' | 'en', slug: string) {
    const translation = await this.prisma.pageTranslation.findUnique({
      where: { locale_slug: { locale, slug } },
      include: { page: true },
    });
    if (!translation || !translation.page.isPublished) {
      throw new NotFoundException('Page not found');
    }
    return translation;
  }

  async publish(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return this.prisma.page.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return this.prisma.page.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async remove(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return this.prisma.page.delete({ where: { id } });
  }
}
