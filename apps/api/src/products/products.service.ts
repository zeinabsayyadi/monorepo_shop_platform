import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        price: dto.price,
        salePrice: dto.salePrice,
        stock: dto.stock ?? 0,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
        translations: {
          create: dto.translations,
        },
      },
      include: {
        translations: true,
        category: { include: { translations: true } },
      },
    });
  }

  async findAll(locale?: 'fa' | 'en') {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        translations: locale ? { where: { locale } } : true,
        category: { include: { translations: true } },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        category: { include: { translations: true } },
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
