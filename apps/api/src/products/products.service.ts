import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { STORAGE_PROVIDER } from '../storage/storage-provider.interface';
import type { StorageProvider } from '../storage/storage-provider.interface';
import * as crypto from 'crypto';
import { UpdateProductTranslationDto } from './dto/update-product-translation.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

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

  async addImage(
    productId: string,
    file: { buffer: Buffer; originalname: string },
  ) {
    await this.findOne(productId); // 404 if the product doesn't exist

    const ext = file.originalname.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const url = await this.storage.save(file.buffer, filename, 'products');

    return this.prisma.product.update({
      where: { id: productId },
      data: { images: { push: url } },
      include: { translations: true },
    });
  }

  async updateTranslation(
    productId: string,
    locale: 'fa' | 'en',
    dto: UpdateProductTranslationDto,
  ) {
    await this.findOne(productId);
    return this.prisma.productTranslation.update({
      where: { productId_locale: { productId, locale } },
      data: dto,
    });
  }

  async findBySlug(locale: 'fa' | 'en', slug: string) {
    const translation = await this.prisma.productTranslation.findUnique({
      where: { locale_slug: { locale, slug } },
      include: {
        product: {
          include: {
            translations: true,
            category: { include: { translations: true } },
          },
        },
      },
    });
    if (!translation || !translation.product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return translation.product;
  }
}
