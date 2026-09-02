import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        isActive: dto.isActive ?? true,
        translations: {
          create: dto.translations,
        },
      },
      include: { translations: true },
    });
  }

  async findAll(locale?: 'fa' | 'en') {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        translations: locale ? { where: { locale } } : true,
      },
    });
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async remove(id: string) {
    await this.findOne(id); // throws 404 if it doesn't exist, before attempting delete
    return this.prisma.category.delete({ where: { id } });
  }
}
