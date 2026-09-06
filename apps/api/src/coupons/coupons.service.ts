import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }

    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(`Coupon code "${dto.code}" already exists`);

    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        minOrderTotal: dto.minOrderTotal,
        maxRedemptions: dto.maxRedemptions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
